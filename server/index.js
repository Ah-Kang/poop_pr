import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cookieParser from 'cookie-parser';
import 'dotenv/config';
import express from 'express';
import {
  getDatabaseMode,
  getGameSave,
  getRanking,
  initializeDatabase,
  saveGame,
  saveScore,
  saveUser,
} from './database.js';

const app = express();
const port = Number(process.env.PORT || 3001);
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
const redirectUri = process.env.KAKAO_REDIRECT_URI || `http://localhost:${port}/auth/kakao/callback`;
const sessionSecret = process.env.SESSION_SECRET;
const sessions = new Map();

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

app.get('/api/health', (_request, response) => {
  response.json({ ok: true, kakaoConfigured: isConfigured(), database: getDatabaseMode() });
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
    const user = {
      id: String(kakaoUser.id),
      nickname: profile.nickname || kakaoUser.properties?.nickname || '카카오 사용자',
      profileImage: profile.profile_image_url || kakaoUser.properties?.profile_image || null,
    };
    await saveUser(user);

    const sessionId = crypto.randomBytes(32).toString('hex');
    sessions.set(sessionId, { user, createdAt: Date.now() });
    response.cookie('game_session', sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      signed: true,
    });
    return response.redirect(`${frontendUrl}/?login=success`);
  } catch (loginError) {
    console.error(loginError);
    return response.redirect(`${frontendUrl}/?loginError=server_error`);
  }
});

app.get('/api/me', (request, response) => {
  const sessionId = request.signedCookies.game_session;
  const session = sessionId ? sessions.get(sessionId) : null;
  if (!session) return response.status(401).json({ user: null });
  return response.json({ user: session.user });
});

app.post('/api/logout', (request, response) => {
  const sessionId = request.signedCookies.game_session;
  if (sessionId) sessions.delete(sessionId);
  response.clearCookie('game_session');
  response.status(204).end();
});

const requireUser = (request, response, next) => {
  const sessionId = request.signedCookies.game_session;
  const session = sessionId ? sessions.get(sessionId) : null;
  if (!session) return response.status(401).json({ error: 'login_required' });
  request.authUser = session.user;
  return next();
};

const normalizeScoreNumber = (value, max) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return Math.min(max, Math.max(0, Math.floor(number)));
};

app.post('/api/score', requireUser, async (request, response) => {
  const score = {
    gold: normalizeScoreNumber(request.body.gold, Number.MAX_SAFE_INTEGER),
    dps: normalizeScoreNumber(request.body.dps, Number.MAX_SAFE_INTEGER),
    toiletLevel: normalizeScoreNumber(request.body.toiletLevel, 100),
    poopLevel: normalizeScoreNumber(request.body.poopLevel, 100000),
  };
  if (Object.values(score).some((value) => value === null)) {
    return response.status(400).json({ error: 'invalid_score' });
  }
  try {
    await saveScore(request.authUser.id, score);
    return response.status(204).end();
  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: 'score_save_failed' });
  }
});

app.get('/api/ranking', async (_request, response) => {
  try {
    return response.json({ ranking: await getRanking(50) });
  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: 'ranking_load_failed' });
  }
});

const normalizeLevelArray = (value, maxLength) => {
  if (!Array.isArray(value) || value.length > maxLength) return null;
  const normalized = value.map((level) => normalizeScoreNumber(level, 100000));
  return normalized.some((level) => level === null) ? null : normalized;
};

app.get('/api/game-save', requireUser, async (request, response) => {
  try {
    return response.json({ save: await getGameSave(request.authUser.id) });
  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: 'game_save_load_failed' });
  }
});

app.post('/api/game-save', requireUser, async (request, response) => {
  const save = {
    gold: normalizeScoreNumber(request.body.gold, Number.MAX_SAFE_INTEGER),
    toiletLevel: normalizeScoreNumber(request.body.toiletLevel, 100),
    poopLevels: normalizeLevelArray(request.body.poopLevels, 20),
    selectedPoopId: normalizeScoreNumber(request.body.selectedPoopId, 100),
    itemLevels: normalizeLevelArray(request.body.itemLevels, 20),
  };
  if (Object.values(save).some((value) => value === null)) {
    return response.status(400).json({ error: 'invalid_game_save' });
  }
  try {
    await saveGame(request.authUser.id, save);
    return response.status(204).end();
  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: 'game_save_store_failed' });
  }
});

const currentFile = fileURLToPath(import.meta.url);
const distPath = path.resolve(path.dirname(currentFile), '..', 'dist');
app.use(express.static(distPath));
app.use((_request, response) => response.sendFile(path.join(distPath, 'index.html')));

try {
  const { mode } = await initializeDatabase();
  app.listen(port, () => {
    console.log(`Game server running at http://localhost:${port}`);
    console.log(`Database mode: ${mode}`);
    if (!isConfigured()) console.log('Kakao login is waiting for values in .env');
  });
} catch (error) {
  console.error('Failed to initialize database:', error);
  process.exit(1);
}
