import { transactGrowth, getGrowthRanking } from './growth.js';
import { normalizeFeedback, feedbackFilters } from '../shared/feedback.js';
import { findFeedback, saveFeedback, listFeedback, updateFeedback, purgeResolvedFeedback } from './feedback.js';
import { GrowthError } from '../shared/growth.js';
import { normalizeTelemetry, analyticsFilters, csvCell } from '../shared/analytics.js';
import { recordTelemetry, getDashboardAnalytics, getAnalyticsUsers, getAnalyticsUserDetail } from './analytics.js';
import { normalizeCosmetics } from '../shared/cosmetics.js';
import { availableCosmetics, getWardrobeRewards } from '../shared/wardrobe.js';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cookieParser from 'cookie-parser';
import 'dotenv/config';
import express from 'express';
import {
  checkDatabaseConnection,
  ensureAccountVersion,
  accountSessionExists,
  deleteAccount,
  createLocalUser,
  getLocalUserByLoginId,
  getDatabaseMode,
  getGameSave,
  initializeDatabase,
  recordActivity,
  saveGame,
  saveUser,
  updateUserProfile,
  transactEconomy,
} from './database.js';
import { EconomyError, koreaDay, developmentEconomyEnabled } from '../shared/economy.js';

const app = express();
const port = Number(process.env.PORT || 3001);
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
const redirectUri = process.env.KAKAO_REDIRECT_URI || `http://localhost:${port}/auth/kakao/callback`;
const sessionSecret = process.env.SESSION_SECRET;
const isProduction = process.env.NODE_ENV === 'production';
const sessionMaxAge = 7 * 24 * 60 * 60 * 1000;
const adminToken = process.env.ADMIN_TOKEN;
// Dashboard login is independent of the existing API token. Keep legacy deployments working.
const adminPassword = process.env.ADMIN_PASSWORD || adminToken;
const passwordKeyLength = 64;

app.set('trust proxy', 1);
app.use(express.json());
app.use(cookieParser(sessionSecret || 'local-development-only'));

const isConfigured = () => Boolean(
  process.env.KAKAO_REST_API_KEY
  && process.env.KAKAO_CLIENT_SECRET
  && sessionSecret
);

const createOAuthState = () => {
  const payload = `${Date.now()}.${crypto.randomBytes(24).toString('hex')}`;
  const signature = crypto
    .createHmac('sha256', sessionSecret)
    .update(payload)
    .digest('hex');
  return `${payload}.${signature}`;
};

const isValidOAuthState = (state) => {
  if (!state || !sessionSecret) return false;
  const parts = String(state).split('.');
  if (parts.length !== 3) return false;
  const [timestamp, nonce, providedSignature] = parts;
  const payload = `${timestamp}.${nonce}`;
  const expectedSignature = crypto
    .createHmac('sha256', sessionSecret)
    .update(payload)
    .digest('hex');
  const signatureIsValid = providedSignature.length === expectedSignature.length
    && crypto.timingSafeEqual(Buffer.from(providedSignature), Buffer.from(expectedSignature));
  const age = Date.now() - Number(timestamp);
  return signatureIsValid && Number.isFinite(age) && age >= 0 && age <= 10 * 60 * 1000;
};

const encodeSession = (session) =>
  Buffer.from(JSON.stringify(session)).toString('base64url');

const decodeSession = (value) => {
  if (!value) return null;

  try {
    const session = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
    const age = Date.now() - Number(session.createdAt);
    const user = session.user;

    if (!Number.isFinite(age) || age < 0 || age > sessionMaxAge) return null;
    if (!user?.id || !user?.nickname) return null;

    return {
      user: {
        id: String(user.id),
        nickname: String(user.nickname),
        kakaoNickname: String(user.kakaoNickname || user.nickname),
        displayNickname: String(user.displayNickname || user.nickname),
        profileImage: user.profileImage || null,
      },
      createdAt: session.createdAt,
      version: session.version,
    };
  } catch {
    return null;
  }
};

const getSession = async (request) => {
  const session = decodeSession(request.signedCookies.game_session);
  return session && await accountSessionExists(session.user.id, session.version) ? session : null;
};
const createSession = async (user) => encodeSession({user, createdAt:Date.now(), version:await ensureAccountVersion(user.id)});
const sessionCookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: isProduction,
  maxAge: sessionMaxAge,
  signed: true,
};

const normalizeLoginId = (value) => {
  const loginId = String(value ?? '').trim().toLowerCase();
  if (!/^[a-z0-9_]{4,20}$/.test(loginId)) return null;
  return loginId;
};

const normalizePassword = (value) => {
  const password = String(value ?? '');
  if (password.length < 6 || password.length > 72) return null;
  return password;
};

const hashPassword = (password) => new Promise((resolve, reject) => {
  const salt = crypto.randomBytes(16).toString('hex');
  crypto.scrypt(password, salt, passwordKeyLength, (error, derivedKey) => {
    if (error) reject(error);
    else resolve(`scrypt:${salt}:${derivedKey.toString('hex')}`);
  });
});

const verifyPassword = (password, passwordHash) => new Promise((resolve) => {
  const [method, salt, storedHash] = String(passwordHash ?? '').split(':');
  if (method !== 'scrypt' || !salt || !storedHash) {
    resolve(false);
    return;
  }

  crypto.scrypt(password, salt, passwordKeyLength, (error, derivedKey) => {
    if (error) {
      resolve(false);
      return;
    }

    const storedBuffer = Buffer.from(storedHash, 'hex');
    resolve(
      storedBuffer.length === derivedKey.length
      && crypto.timingSafeEqual(storedBuffer, derivedKey)
    );
  });
});

app.get('/api/health', async (_request, response) => {
  response.set('Cache-Control', 'no-store');
  try {
    await checkDatabaseConnection();
    return response.json({ ok: true, kakaoConfigured: isConfigured(), database: getDatabaseMode() });
  } catch {
    return response.status(503).json({ ok: false, error: 'database_unavailable' });
  }
});

app.get('/auth/kakao', (_request, response) => {
  if (!isConfigured()) {
    return response.redirect(`${frontendUrl}/?loginError=not_configured`);
  }

  const state = createOAuthState();

  const query = new URLSearchParams({
    client_id: process.env.KAKAO_REST_API_KEY,
    redirect_uri: redirectUri,
    response_type: 'code',
    state,
  });

  return response.redirect(`https://kauth.kakao.com/oauth/authorize?${query}`);
});

app.get('/auth/kakao/callback', async (request, response) => {
  const { code, error, state } = request.query;
  if (error) {
    console.warn('Kakao authorization was not completed:', error, request.query.error_description || '');
    return response.redirect(`${frontendUrl}/?loginError=${encodeURIComponent(String(error))}`);
  }
  if (!code || !isValidOAuthState(state)) {
    return response.redirect(`${frontendUrl}/?loginError=invalid_state`);
  }

  try {
    const tokenBody = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.KAKAO_REST_API_KEY,
      client_secret: process.env.KAKAO_CLIENT_SECRET,
      redirect_uri: redirectUri,
      code: String(code),
    });
    const tokenResponse = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
      body: tokenBody,
    });
    if (!tokenResponse.ok) throw new Error(`Token request failed: ${tokenResponse.status}`);
    const token = await tokenResponse.json();

    const userResponse = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${token.access_token}` },
    });
    if (!userResponse.ok) throw new Error(`User request failed: ${userResponse.status}`);
    const kakaoUser = await userResponse.json();
    const profile = kakaoUser.kakao_account?.profile ?? {};
    const kakaoProfile = {
      id: String(kakaoUser.id),
      nickname: profile.nickname || kakaoUser.properties?.nickname || '카카오 사용자',
      profileImage: profile.profile_image_url || kakaoUser.properties?.profile_image || null,
    };
    const user = await saveUser(kakaoProfile);

    response.cookie('game_session', await createSession(user), sessionCookieOptions);
    return response.redirect(`${frontendUrl}/?login=success`);
  } catch (loginError) {
    console.error(loginError);
    return response.redirect(`${frontendUrl}/?loginError=server_error`);
  }
});

app.get('/api/me', async (request, response) => {
  const session = await getSession(request);
  if (!session) return response.status(401).json({ user: null });
  return response.json({ user: session.user });
});

app.post('/api/auth/local/register', async (request, response) => {
  const loginId = normalizeLoginId(request.body.loginId);
  const password = normalizePassword(request.body.password);
  const displayNickname = normalizeDisplayNickname(request.body.displayNickname);

  if (!loginId) return response.status(400).json({ error: 'invalid_login_id' });
  if (!password) return response.status(400).json({ error: 'invalid_password' });
  if (!displayNickname) return response.status(400).json({ error: 'invalid_nickname' });

  try {
    const passwordHash = await hashPassword(password);
    const user = await createLocalUser({
      id: `local:${loginId}`,
      loginId,
      nickname: displayNickname,
      passwordHash,
    });

    response.cookie('game_session', await createSession(user), sessionCookieOptions);
    return response.status(201).json({ user });
  } catch (error) {
    if (error?.code === '23505' || String(error?.message ?? '').includes('UNIQUE')) {
      return response.status(409).json({ error: 'login_id_taken' });
    }

    console.error(error);
    return response.status(500).json({ error: 'register_failed' });
  }
});

app.post('/api/auth/local/login', async (request, response) => {
  const loginId = normalizeLoginId(request.body.loginId);
  const password = normalizePassword(request.body.password);

  if (!loginId || !password) {
    return response.status(400).json({ error: 'invalid_credentials' });
  }

  try {
    const userWithPassword = await getLocalUserByLoginId(loginId);
    const passwordIsValid = await verifyPassword(password, userWithPassword?.passwordHash);
    if (!userWithPassword || !passwordIsValid) {
      return response.status(401).json({ error: 'invalid_credentials' });
    }

    const { passwordHash, ...user } = userWithPassword;
    response.cookie('game_session', await createSession(user), sessionCookieOptions);
    return response.json({ user });
  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: 'login_failed' });
  }
});

app.post('/api/logout', (request, response) => {
  response.clearCookie('game_session', {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    signed: true,
  });
  response.status(204).end();
});

const requireUser = async (request, response, next) => {
  const session = await getSession(request);
  if (!session) return response.status(401).json({ error: 'login_required' });
  request.authUser = session.user;
  request.authVersion = session.version;
  return next();
};

app.delete('/api/account', requireUser, async (request, response) => {
  if (!request.is('application/json') || request.body?.confirmation !== 'DELETE') {
    return response.status(400).json({error:'confirmation_required'});
  }
  const origin = request.get('origin');
  const allowedOrigin = new URL(frontendUrl).origin;
  if (origin && origin !== allowedOrigin) return response.status(403).json({error:'invalid_origin'});
  try {
    await deleteAccount(request.authUser.id, request.authVersion);
    response.clearCookie('game_session', {httpOnly:true,sameSite:'lax',secure:isProduction,signed:true});
    return response.status(204).end();
  } catch (error) {
    console.error('Account deletion failed:', error.code || 'unknown');
    return response.status(503).json({error:'delete_failed'});
  }
});

const economyCapabilities = { demo: developmentEconomyEnabled(process.env.NODE_ENV, process.env.ENABLE_ECONOMY_DEMO), ads: false, purchases: false, minigame: true };
const sendEconomy = (response, state) => response.json({ state, day: koreaDay(), serverNow: Date.now(), capabilities: economyCapabilities });
app.get('/api/economy', requireUser, async (request, response) => {
  response.set('Cache-Control', 'no-store');
  try { return sendEconomy(response, await transactEconomy(request.authUser.id)); }
  catch { return response.status(503).json({ error: 'economy_unavailable' }); }
});
app.post('/api/economy/actions', requireUser, async (request, response) => {
  // Puzzle moves are resolved inside the wallet transaction on the server.
  // Browser-supplied scores, rewards and advertising claims are never trusted.
  const action = request.body;
  const allowed = ['claim_daily', 'craft_toilet', 'renovate', 'reset_progress', 'abandon_run', 'puzzle_start', 'puzzle_move', 'puzzle_exit'];
  if (economyCapabilities.demo) allowed.push('start_run', 'demo_complete', 'demo_ad', 'demo_tokens');
  if (!allowed.includes(action?.type)) return response.status(403).json({ error: 'integration_not_ready' });
  try {
    const state = await transactEconomy(request.authUser.id, action, { allowDemo: economyCapabilities.demo });
    return sendEconomy(response, state);
  } catch (error) {
    if (error instanceof EconomyError) return response.status(409).json({ error: error.code });
    return response.status(503).json({ error: 'economy_unavailable' });
  }
});

const normalizeDisplayNickname = (value) => {
  const nickname = String(value ?? '').trim().replace(/\s+/g, ' ');
  if (nickname.length < 2 || nickname.length > 12) return null;
  return nickname;
};

app.patch('/api/me', requireUser, async (request, response) => {
  const displayNickname = normalizeDisplayNickname(request.body.displayNickname);
  if (!displayNickname) {
    return response.status(400).json({ error: 'invalid_nickname' });
  }

  try {
    const user = await updateUserProfile(request.authUser.id, { displayNickname });
    if (!user) return response.status(404).json({ error: 'user_not_found' });

    response.cookie('game_session', encodeSession({ user, createdAt: Date.now() }), sessionCookieOptions);
    return response.json({ user });
  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: 'profile_update_failed' });
  }
});

const adminCookieOptions = { httpOnly:true, sameSite:'strict', secure:isProduction, signed:true, maxAge:4*60*60*1000, path:'/api/admin' };
const tokenDigest = value => crypto.createHash('sha256').update(String(value)).digest();
const validAdminToken = value => Boolean(adminToken && typeof value === 'string' && crypto.timingSafeEqual(tokenDigest(value),tokenDigest(adminToken)));
const validAdminPassword = value => Boolean(adminPassword && typeof value === 'string' && crypto.timingSafeEqual(tokenDigest(value),tokenDigest(adminPassword)));
const adminPasswordDigest = () => crypto.createHmac('sha256', sessionSecret).update(String(adminPassword)).digest('hex');
const adminAuthenticated = request => {
  if (validAdminToken(request.get('x-admin-token'))) return true;
  try {
    const session = JSON.parse(request.signedCookies.admin_session || 'null');
    return Boolean(adminPassword && session && session.digest === adminPasswordDigest()
      && Date.now()-session.createdAt >= 0 && Date.now()-session.createdAt < adminCookieOptions.maxAge);
  } catch { return false; }
};
const requireAdmin = (request, response, next) => {
  response.set('Cache-Control','no-store');
  if (!adminAuthenticated(request)) return response.status(403).json({error:'admin_forbidden'});
  return next();
};
const adminAttempts = new Map();
const feedbackAttempts = new Map();
const feedbackRateSecret = crypto.randomBytes(32);
const feedbackOriginAllowed = request => {
  if(request.get('sec-fetch-site')==='cross-site')return false;
  const origin=request.get('origin');
  if(!origin)return true;
  return origin===new URL(frontendUrl).origin || origin===`${request.protocol}://${request.get('host')}`;
};
app.post('/api/feedback', async (request,response) => {
  response.set('Cache-Control','no-store');
  if(!feedbackOriginAllowed(request))return response.status(403).json({error:'feedback_forbidden'});
  let packet;
  try{packet=normalizeFeedback(request.body);}catch{return response.status(400).json({error:'invalid_feedback'});}
  try{
    const session=await getSession(request),userId=session?.user.id||null;
    const existing=await findFeedback(packet.id);
    if(existing){
      if(existing.kakao_id!==userId || existing.message!==packet.message)return response.status(409).json({error:'feedback_conflict'});
      return response.json({id:packet.id});
    }
    const now=Date.now();
    for(const [key,value] of feedbackAttempts)if(value.until<=now)feedbackAttempts.delete(key);
    const key=crypto.createHmac('sha256',feedbackRateSecret).update(String(request.ip)).digest('hex');
    const attempt=feedbackAttempts.get(key)||{count:0,until:now+10*60*1000};
    if(attempt.count>=5 || (!feedbackAttempts.has(key)&&feedbackAttempts.size>=5000)){
      response.set('Retry-After',String(Math.max(1,Math.ceil((attempt.until-now)/1000))));
      return response.status(429).json({error:'feedback_rate_limited'});
    }
    feedbackAttempts.set(key,{...attempt,count:attempt.count+1});
    return response.status(201).json(await saveFeedback(packet,userId));
  }catch(error){
    if(error.message==='feedback_conflict')return response.status(409).json({error:'feedback_conflict'});
    console.error('Feedback submission failed:',error.code||'database_error');
    return response.status(503).json({error:'feedback_unavailable'});
  }
});
app.get('/api/admin/feedback',requireAdmin,async(request,response)=>{
  let filters;
  try{filters=feedbackFilters(request.query);}catch{return response.status(400).json({error:'invalid_feedback_filter'});}
  try{return response.json(await listFeedback(filters));}
  catch{ return response.status(503).json({error:'feedback_unavailable'}); }
});
app.patch('/api/admin/feedback/:id',requireAdmin,async(request,response)=>{
  if(!feedbackOriginAllowed(request))return response.status(403).json({error:'feedback_forbidden'});
  if(!['new','resolved'].includes(request.body?.status))return response.status(400).json({error:'invalid_feedback_status'});
  try{
    if(!await updateFeedback(request.params.id,request.body.status))return response.status(404).json({error:'feedback_not_found'});
    return response.json({ok:true});
  }catch{return response.status(503).json({error:'feedback_unavailable'});}
});
app.get('/api/admin/session', (request,response) => {
  response.set('Cache-Control','no-store');
  response.json({authenticated:adminAuthenticated(request),configured:Boolean(adminPassword)});
});
app.post('/api/admin/session', (request,response) => {
  response.set('Cache-Control','no-store');
  if (!adminPassword) return response.status(503).json({error:'admin_not_configured'});
  const now = Date.now(), key = request.ip;
  for (const [ip, value] of adminAttempts) if (value.until <= now) adminAttempts.delete(ip);
  const attempts = adminAttempts.get(key) || {count:0,until:now+10*60*1000};
  if (attempts.count >= 5) return response.status(429).json({error:'admin_rate_limited'});
  if (!validAdminPassword(request.body?.password)) {
    if (adminAttempts.size >= 1000) adminAttempts.delete(adminAttempts.keys().next().value);
    adminAttempts.set(key,{...attempts,count:attempts.count+1});
    return response.status(403).json({error:'admin_forbidden'});
  }
  adminAttempts.delete(key);
  response.cookie('admin_session',JSON.stringify({createdAt:now,digest:adminPasswordDigest()}),adminCookieOptions);
  return response.json({authenticated:true});
});
app.post('/api/admin/logout', (_request,response) => {
  response.clearCookie('admin_session',{...adminCookieOptions,maxAge:undefined});
  response.status(204).end();
});

const normalizeScoreNumber = (value, max) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return Math.min(max, Math.max(0, Math.floor(number)));
};

app.post('/api/growth', requireUser, async (request, response) => {
  if(request.body.owner && request.body.owner !== request.authUser.id) return response.status(409).json({error:'account_changed'});
  response.set('Cache-Control','no-store');
  try {
    const result = await transactGrowth(request.authUser.id, request.body, { allowDemo: !isProduction && process.env.ENABLE_ECONOMY_DEMO === 'true' });
    return response.json(result);
  } catch (error) {
    if (error instanceof GrowthError) return response.status(409).json({error:error.message});
    console.error(error); return response.status(500).json({error:'growth_unavailable'});
  }
});
app.post('/api/score', requireUser, async (request, response) => {
  try { await transactGrowth(request.authUser.id); return response.status(204).end(); }
  catch (error) { console.error(error); return response.status(500).json({error:'score_save_failed'}); }
});
app.get('/api/ranking', async (_request, response) => {
  response.set('Cache-Control','no-store');
  try { return response.json({ranking:await getGrowthRanking(50)}); }
  catch (error) { console.error(error); return response.status(500).json({error:'ranking_load_failed'}); }
});

app.post('/api/activity', requireUser, async (request, response) => {
  const seconds = normalizeScoreNumber(request.body.seconds, 300);
  const sessionStart = Boolean(request.body.sessionStart);
  if (seconds === null) {
    return response.status(400).json({ error: 'invalid_activity' });
  }

  try {
    await recordActivity(request.authUser.id, { seconds, sessionStart });
    return response.status(204).end();
  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: 'activity_save_failed' });
  }
});

app.post('/api/telemetry', requireUser, async (request,response) => {
  let packet;
  try { packet=normalizeTelemetry(request.body); }
  catch { return response.status(400).json({error:'invalid_telemetry'}); }
  try { await recordTelemetry(request.authUser.id,packet); return response.status(204).end(); }
  catch (error) { console.error('Telemetry save failed:',error.code || error.message); return response.status(error.message==='invalid_telemetry'?400:503).json({error:'telemetry_save_failed'}); }
});
const readAnalyticsFilters = (request,response) => {
  try { return analyticsFilters(request.query); }
  catch (error) { response.status(400).json({error:error.message}); return null; }
};
app.get('/api/admin/analytics', requireAdmin, async (request,response) => {
  const filters=readAnalyticsFilters(request,response); if (!filters) return;
  try { return response.json(await getDashboardAnalytics(filters)); }
  catch (error) { console.error(error); return response.status(503).json({error:'admin_analytics_failed'}); }
});
app.get('/api/admin/users/:id', requireAdmin, async (request,response) => {
  const filters=readAnalyticsFilters(request,response); if (!filters) return;
  try {
    const detail=await getAnalyticsUserDetail(filters,request.params.id);
    return detail ? response.json(detail) : response.status(404).json({error:'user_not_found'});
  } catch (error) { console.error(error); return response.status(503).json({error:'admin_analytics_failed'}); }
});
app.get('/api/admin/export.csv', requireAdmin, async (request,response) => {
  const filters=readAnalyticsFilters(request,response); if (!filters) return;
  const fields=[['id','사용자 ID'],['nickname','게임 닉네임'],['provider','로그인 방식'],['createdAt','가입 시각'],['lastSeen','최근 기록 시각'],['activeDays','기간 내 활동 일수'],['playSeconds','플레이 시간(초)'],['mainSeconds','메인 시간(초)'],['puzzleSeconds','퍼즐 시간(초)'],['legacySeconds','기존 기록 시간(초)'],['sessions','접속 세션'],['clicks','캐릭터 클릭'],['poopUpgrades','똥 강화'],['evolutions','진화'],['itemUpgrades','장비 강화'],['wardrobeOpens','옷장 열기'],['skinEquips','스킨 착용'],['puzzleEntries','퍼즐 입장'],['puzzleMoves','유효 퍼즐 이동'],['partsEarned','획득 부품'],['toiletCrafts','화장실 제작'],['tokensSpent','사용 토큰'],['tokensReceived','획득 토큰'],['discovered','발견한 똥'],['toiletLevel','화장실 단계(0부터)'],['gold','보유 영양분'],['tokens','보유 토큰'],['parts','보유 부품']];
  try {
    const first=await getAnalyticsUsers(filters,{page:1,pageSize:500});
    response.set({'Content-Type':'text/csv; charset=utf-8','Content-Disposition':`attachment; filename="poop-analytics-${filters.from}-${filters.to}.csv"`});
    response.write('\uFEFF'+fields.map(([,label])=>csvCell(label)).join(',')+'\r\n');
    let page=1, users=first;
    while (users.length && !response.destroyed) {
      for (const user of users) response.write(fields.map(([key])=>csvCell(user[key])).join(',')+'\r\n');
      if (users.length<500) break;
      users=await getAnalyticsUsers(filters,{page:++page,pageSize:500});
    }
    response.end();
  } catch (error) {
    console.error(error);
    if (response.headersSent) response.destroy();
    else response.status(503).json({error:'admin_export_failed'});
  }
});

const normalizeLevelArray = (value, maxLength) => {
  if (!Array.isArray(value) || value.length > maxLength) return null;
  const normalized = value.map((level) => normalizeScoreNumber(level, 100000));
  return normalized.some((level) => level === null) ? null : normalized;
};

app.get('/api/game-save', requireUser, async (request, response) => {
  try {
    const growth = await transactGrowth(request.authUser.id);
    const saved = await getGameSave(request.authUser.id);
    const save = saved ? { ...saved, gold: growth.state.gold, cumulativeLevel: growth.state.level, totalAssets: growth.state.totalAssets } : null;
    const economy = await transactEconomy(request.authUser.id);
    return response.json({ save: save ? { ...save, cosmetics: availableCosmetics(save.cosmetics, getWardrobeRewards(economy)), toiletLevel: economy.toiletLevel, toiletSchemaVersion: 2 } : null });
  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: 'game_save_load_failed' });
  }
});

app.post('/api/game-save', requireUser, async (request, response) => {
  const save = {
    gold: normalizeScoreNumber(request.body.gold, Number.MAX_SAFE_INTEGER),
    toiletLevel: normalizeScoreNumber(request.body.toiletLevel, 100),
    toiletSchemaVersion: normalizeScoreNumber(request.body.toiletSchemaVersion ?? 1, 10),
    poopLevels: normalizeLevelArray(request.body.poopLevels, 20),
    selectedPoopId: normalizeScoreNumber(request.body.selectedPoopId, 100),
    itemLevels: normalizeLevelArray(request.body.itemLevels, 20),
    cosmetics: normalizeCosmetics(request.body.cosmetics),
  };
  if (Object.values(save).some((value) => value === null)) {
    return response.status(400).json({ error: 'invalid_game_save' });
  }
  try {
    const {state:growth} = await transactGrowth(request.authUser.id);
    Object.assign(save,{gold:Math.min(Number.MAX_SAFE_INTEGER,growth.gold),poopLevels:growth.poopLevels,itemLevels:growth.itemLevels,selectedPoopId:growth.selectedPoopId});
    const economy = await transactEconomy(request.authUser.id);
    save.cosmetics = availableCosmetics(save.cosmetics, getWardrobeRewards(economy));
    save.toiletLevel = economy.toiletLevel;
    save.toiletSchemaVersion = 2;
    await saveGame(request.authUser.id, save);
    return response.status(204).end();
  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: 'game_save_store_failed' });
  }
});

const currentFile = fileURLToPath(import.meta.url);
const distPath = path.resolve(path.dirname(currentFile), '..', 'dist');
// Express hides dot directories by default; Android verifies this exact URL.
app.get('/.well-known/assetlinks.json', (_request, response) => {
  response.set('Cache-Control', 'public, max-age=300');
  return response.sendFile(path.join(distPath, '.well-known', 'assetlinks.json'), { dotfiles: 'allow' });
});
// Content hashes change the URL whenever a skin changes; cached files stay valid.
app.use('/skins', express.static(path.join(distPath, 'skins'), { maxAge: '1y', immutable: true }));
app.use('/skins', (_request, response) => response.status(404).end());
app.use(express.static(distPath));
app.use((_request, response) => response.sendFile(path.join(distPath, 'index.html')));

try {
  const { mode } = await initializeDatabase();
  setInterval(()=>purgeResolvedFeedback().catch(()=>console.error('Feedback retention cleanup failed')),60*60*1000).unref();
  app.listen(port, process.env.HOST || '0.0.0.0', () => {
    console.log(`Game server running at http://localhost:${port}`);
    console.log(`Database mode: ${mode}`);
    if (!isConfigured()) console.log('Kakao login is waiting for values in .env');
  });
} catch (error) {
  console.error('Failed to initialize database:', error);
  process.exit(1);
}
