import { koreaDay, migrateToiletLevel } from '../shared/economy.js';
import { clientMetrics, metricKeys, metricColumn, counterDelta, economyMetrics, zeroMetrics, shiftDay } from '../shared/analytics.js';
import {levelsForLevel,stageForLevel} from '../shared/poop-progression.js';

let pool, sqlite;
const columns = metricKeys.map(metricColumn);
const pgSql = sql => { let i = 0; return sql.replace(/\?/g, () => `$${++i}`); };
const numericKeys = new Set([...metricKeys, 'totalUsers', 'newUsers', 'activeUsers', 'returningUsers', 'puzzleUsers', 'playSeconds', 'legacySeconds', 'activeDays', 'gold', 'dps', 'legacyToiletLevel', 'toiletSchemaVersion', 'selectedPoopId', 'stage', 'users']);
const rows = async (sql, params = []) => {
  const result = pool ? (await pool.query(pgSql(sql), params)).rows : sqlite.prepare(sql).all(...params);
  // PostgreSQL SUM(bigint) returns numeric strings; keep the API consistent with SQLite.
  return result.map(row => Object.fromEntries(Object.entries(row).map(([key,value]) => [key, numericKeys.has(key) && value !== null ? Number(value) : value])));
};
const json = value => typeof value === 'string' ? JSON.parse(value) : value || {};

export async function initializeAnalytics(postgresPool, sqliteDatabase) {
  pool = postgresPool; sqlite = sqliteDatabase;
  const schema = `
    CREATE TABLE IF NOT EXISTS analytics_sessions (
      kakao_id TEXT NOT NULL REFERENCES users(kakao_id) ON DELETE CASCADE,
      session_id TEXT NOT NULL, started_day TEXT NOT NULL, last_seen TEXT NOT NULL,
      PRIMARY KEY(kakao_id, session_id)
    );
    CREATE TABLE IF NOT EXISTS analytics_streams (
      kakao_id TEXT NOT NULL REFERENCES users(kakao_id) ON DELETE CASCADE,
      stream_id TEXT NOT NULL, activity_day TEXT NOT NULL, session_id TEXT NOT NULL,
      counters TEXT NOT NULL, PRIMARY KEY(kakao_id, stream_id, activity_day)
    );
    CREATE TABLE IF NOT EXISTS analytics_daily (
      kakao_id TEXT NOT NULL REFERENCES users(kakao_id) ON DELETE CASCADE,
      activity_day TEXT NOT NULL, last_seen TEXT NOT NULL,
      ${columns.map(col => `${col} BIGINT NOT NULL DEFAULT 0`).join(',')},
      PRIMARY KEY(kakao_id, activity_day)
    );
    CREATE INDEX IF NOT EXISTS analytics_daily_day ON analytics_daily(activity_day);
    CREATE TABLE IF NOT EXISTS analytics_metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);
  `;
  if (pool) {
    await pool.query(schema);
    await pool.query('ALTER TABLE analytics_sessions ENABLE ROW LEVEL SECURITY; ALTER TABLE analytics_streams ENABLE ROW LEVEL SECURITY; ALTER TABLE analytics_daily ENABLE ROW LEVEL SECURITY; ALTER TABLE analytics_metadata ENABLE ROW LEVEL SECURITY;');
    await pool.query("INSERT INTO analytics_metadata(key,value) VALUES ('startedAt',$1) ON CONFLICT DO NOTHING", [new Date().toISOString()]);
  } else {
    sqlite.exec(schema);
    sqlite.prepare("INSERT INTO analytics_metadata(key,value) VALUES ('startedAt',?) ON CONFLICT DO NOTHING").run(new Date().toISOString());
  }
  const guestSchema=`CREATE TABLE IF NOT EXISTS guest_analytics_profiles (
    kakao_id TEXT PRIMARY KEY,nickname TEXT NOT NULL,created_at TEXT NOT NULL,last_seen TEXT NOT NULL,
    snapshot TEXT NOT NULL DEFAULT '{}',snapshot_at BIGINT NOT NULL DEFAULT 0
  );`+schema.slice(0,schema.indexOf('CREATE TABLE IF NOT EXISTS analytics_metadata'))
    .replaceAll('analytics_sessions','guest_analytics_sessions').replaceAll('analytics_streams','guest_analytics_streams')
    .replaceAll('analytics_daily','guest_analytics_daily').replaceAll('REFERENCES users','REFERENCES guest_analytics_profiles');
  if(pool){
    await pool.query(guestSchema);
    await pool.query('ALTER TABLE guest_analytics_profiles ENABLE ROW LEVEL SECURITY; ALTER TABLE guest_analytics_sessions ENABLE ROW LEVEL SECURITY; ALTER TABLE guest_analytics_streams ENABLE ROW LEVEL SECURITY; ALTER TABLE guest_analytics_daily ENABLE ROW LEVEL SECURITY;');
  }else sqlite.exec(guestSchema);
  await rows("INSERT INTO analytics_metadata(key,value) VALUES ('guestStartedAt',?) ON CONFLICT DO NOTHING RETURNING key",[new Date().toISOString()]);
  await purgeGuestAnalytics();
}

export async function purgeGuestAnalytics(now=Date.now()) {
  await rows('DELETE FROM guest_analytics_profiles WHERE last_seen < ? RETURNING kakao_id',[new Date(now-90*86400000).toISOString()]);
}

function dailyStatement(userId, day, delta, now = Date.now()) {
  return {
    sql: `INSERT INTO analytics_daily(kakao_id,activity_day,last_seen,${columns.join(',')})
      VALUES (${Array(columns.length+3).fill('?').join(',')})
      ON CONFLICT(kakao_id,activity_day) DO UPDATE SET last_seen=excluded.last_seen,
      ${columns.map(col => `${col}=analytics_daily.${col}+excluded.${col}`).join(',')}`,
    params: [userId, day, new Date(now).toISOString(), ...metricKeys.map(key => delta[key] || 0)],
  };
}

// Called only inside the existing wallet transaction, after action deduplication.
export async function recordEconomyAnalyticsPg(client, userId, previous, next, action) {
  const delta = economyMetrics(previous, next, action);
  if (!Object.values(delta).some(Boolean)) return;
  const q = dailyStatement(userId, koreaDay(), delta);
  await client.query(pgSql(q.sql), q.params);
}
export function recordEconomyAnalyticsSqlite(db, userId, previous, next, action) {
  const delta = economyMetrics(previous, next, action);
  if (!Object.values(delta).some(Boolean)) return;
  const q = dailyStatement(userId, koreaDay(), delta);
  db.prepare(q.sql).run(...q.params);
}

const streamSelect = 'SELECT counters,session_id FROM analytics_streams WHERE kakao_id=? AND stream_id=? AND activity_day=?';
const sessionInsert = 'INSERT INTO analytics_sessions(kakao_id,session_id,started_day,last_seen) VALUES (?,?,?,?) ON CONFLICT(kakao_id,session_id) DO NOTHING';
const streamUpsert = `INSERT INTO analytics_streams(kakao_id,stream_id,activity_day,session_id,counters) VALUES (?,?,?,?,?)
 ON CONFLICT(kakao_id,stream_id,activity_day) DO UPDATE SET counters=excluded.counters`;
function preparePacket(userId, packet, old, newSession, now) {
  if (old && old.session_id !== packet.sessionId) throw new Error('invalid_telemetry');
  const previous = json(old?.counters);
  const delta = counterDelta(previous, packet.counters);
  const merged = Object.fromEntries(clientMetrics.map(key => [key, Math.max(previous[key] || 0, packet.counters[key])]));
  return { stream: [userId, packet.streamId, packet.day, packet.sessionId, JSON.stringify(merged)],
    daily: dailyStatement(userId, packet.day, { ...delta, sessions: newSession ? 1 : 0 }, now) };
}

export async function recordTelemetry(userId, packet, now = Date.now(), guest = false) {
  const stamp = new Date(now).toISOString();
  const table=sql=>guest?sql.replaceAll('analytics_','guest_analytics_'):sql;
  const profileInsert='INSERT INTO guest_analytics_profiles(kakao_id,nickname,created_at,last_seen) VALUES (?,?,?,?) ON CONFLICT(kakao_id) DO NOTHING';
  const profileArgs=[userId,`게스트 ${userId.slice(6,14).toUpperCase()}`,stamp,stamp];
  const progressUpdate='UPDATE guest_analytics_profiles SET snapshot=?,snapshot_at=? WHERE kakao_id=? AND snapshot_at<=?';
  const progressArgs=packet.progress?[JSON.stringify({...packet.progress,selectedPoopId:stageForLevel(packet.progress.level)}),packet.capturedAt,userId,packet.capturedAt]:null;
  if (pool) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      if(guest)await client.query(pgSql(profileInsert),profileArgs);
      await client.query(`SELECT kakao_id FROM ${guest?'guest_analytics_profiles':'users'} WHERE kakao_id=$1 FOR NO KEY UPDATE`, [userId]);
      const old = (await client.query(pgSql(table(streamSelect)), [userId, packet.streamId, packet.day])).rows[0];
      const session = await client.query(pgSql(table(sessionInsert)) + ' RETURNING session_id', [userId, packet.sessionId, packet.day, stamp]);
      const q = preparePacket(userId, packet, old, session.rowCount > 0, now);
      await client.query(pgSql(table(streamUpsert)), q.stream);
      await client.query(pgSql(table(q.daily.sql)), q.daily.params);
      await client.query(table('UPDATE analytics_sessions SET last_seen=$1 WHERE kakao_id=$2 AND session_id=$3'), [stamp,userId,packet.sessionId]);
      if(guest){
        await client.query('UPDATE guest_analytics_profiles SET last_seen=$1 WHERE kakao_id=$2',[stamp,userId]);
        if(progressArgs)await client.query(pgSql(progressUpdate),progressArgs);
      }
      await client.query('COMMIT');
    } catch (error) { await client.query('ROLLBACK'); throw error; }
    finally { client.release(); }
    return;
  }
  // No awaits inside this synchronous transaction: concurrent requests cannot interleave.
  sqlite.exec('BEGIN IMMEDIATE');
  try {
    if(guest)sqlite.prepare(profileInsert).run(...profileArgs);
    const old = sqlite.prepare(table(streamSelect)).get(userId, packet.streamId, packet.day);
    const session = sqlite.prepare(table(sessionInsert)).run(userId, packet.sessionId, packet.day, stamp);
    const q = preparePacket(userId, packet, old, session.changes > 0, now);
    sqlite.prepare(table(streamUpsert)).run(...q.stream);
    sqlite.prepare(table(q.daily.sql)).run(...q.daily.params);
    sqlite.prepare(table('UPDATE analytics_sessions SET last_seen=? WHERE kakao_id=? AND session_id=?')).run(stamp,userId,packet.sessionId);
    if(guest){
      sqlite.prepare('UPDATE guest_analytics_profiles SET last_seen=? WHERE kakao_id=?').run(stamp,userId);
      if(progressArgs)sqlite.prepare(progressUpdate).run(...progressArgs);
    }
    sqlite.exec('COMMIT');
  } catch (error) { sqlite.exec('ROLLBACK'); throw error; }
}

// Guests exist only in analytics, never in login, cloud saves or public ranking.
const analyticsPopulation=`people AS (
  SELECT kakao_id,nickname,display_nickname,auth_provider,CAST(created_at AS TEXT) AS created_at,NULL AS guest_snapshot FROM users
  UNION ALL SELECT kakao_id,nickname,NULL,'guest',created_at,snapshot FROM guest_analytics_profiles
), combined_daily AS (
  SELECT kakao_id,activity_day,last_seen,${columns.join(',')} FROM analytics_daily
  UNION ALL SELECT kakao_id,activity_day,last_seen,${columns.join(',')} FROM guest_analytics_daily
)`;

function population(filters) {
  const conditions = [], params = [];
  if (filters.provider !== 'all') { conditions.push('u.auth_provider=?'); params.push(filters.provider); }
  if (filters.search) {
    conditions.push('(LOWER(COALESCE(u.display_nickname,u.nickname)) LIKE ? OR u.kakao_id LIKE ?)');
    params.push(`%${filters.search.toLowerCase()}%`, `%${filters.search}%`);
  }
  return { sql: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '', params };
}
function baseQuery(filters) {
  const selected = population(filters);
  const guestField=key=>pool?`(CAST(u.guest_snapshot AS JSONB)->>'${key}')`:`json_extract(u.guest_snapshot,'$.${key}')`;
  const createdDay = pool ? "to_char(CAST(u.created_at AS TIMESTAMPTZ) AT TIME ZONE 'Asia/Seoul','YYYY-MM-DD')" : "strftime('%Y-%m-%d',u.created_at,'+9 hours')";
  return {
    sql: `WITH ${analyticsPopulation}, m AS (
      SELECT kakao_id, ${columns.map(col=>`SUM(${col}) AS ${col}`).join(',')},MAX(last_seen) AS last_seen
      FROM combined_daily WHERE activity_day BETWEEN ? AND ? GROUP BY kakao_id
    ), h AS (
      SELECT kakao_id,SUM(play_seconds) AS seconds FROM daily_activity WHERE CAST(activity_date AS TEXT) BETWEEN ? AND ? GROUP BY kakao_id
    ), days AS (
      SELECT kakao_id,activity_day AS day FROM combined_daily WHERE activity_day BETWEEN ? AND ?
      UNION SELECT kakao_id,CAST(activity_date AS TEXT) AS day FROM daily_activity WHERE CAST(activity_date AS TEXT) BETWEEN ? AND ?
    ), active AS (SELECT kakao_id,COUNT(*) AS active_days FROM days GROUP BY kakao_id),
    base AS (SELECT u.kakao_id AS id, COALESCE(u.display_nickname,u.nickname) AS nickname, u.auth_provider AS provider,
      CAST(u.created_at AS TEXT) AS "createdAt", ${createdDay} AS "createdDay",
      COALESCE(m.last_seen,CAST(ua.last_seen_at AS TEXT)) AS "lastSeen",
      COALESCE(active.active_days,0) AS "activeDays",COALESCE(h.seconds,0) AS "legacySeconds",
      COALESCE(h.seconds,0)+COALESCE(m.main_seconds,0)+COALESCE(m.puzzle_seconds,0) AS "playSeconds",
      ${metricKeys.map((key,i)=>`COALESCE(m.${columns[i]},0) AS "${key}"`).join(',')},
      COALESCE(CAST(${guestField('gold')} AS DOUBLE PRECISION),g.gold,s.gold,0) AS gold, COALESCE(CAST(${guestField('dps')} AS DOUBLE PRECISION),s.dps,0) AS dps,
      COALESCE(g.toilet_level,s.toilet_level,0) AS "legacyToiletLevel",COALESCE(g.toilet_schema_version,s.toilet_schema_version,1) AS "toiletSchemaVersion",
      g.poop_levels AS "poopLevels", COALESCE(CAST(${guestField('selectedPoopId')} AS INTEGER),g.selected_poop_id) AS "selectedPoopId",g.cosmetics, e.state AS wallet,
      u.guest_snapshot,pg.state AS growth
      FROM people u LEFT JOIN m ON m.kakao_id=u.kakao_id LEFT JOIN h ON h.kakao_id=u.kakao_id
      LEFT JOIN active ON active.kakao_id=u.kakao_id LEFT JOIN user_activity ua ON ua.kakao_id=u.kakao_id
      LEFT JOIN game_saves g ON g.kakao_id=u.kakao_id LEFT JOIN scores s ON s.kakao_id=u.kakao_id
      LEFT JOIN player_economy e ON e.kakao_id=u.kakao_id LEFT JOIN player_growth pg ON pg.kakao_id=u.kakao_id ${selected.sql})`,
    params: [...Array(4).fill([filters.from, filters.to]).flat(), ...selected.params],
  };
}
function presentUser(row) {
  if(row.provider==='guest'){
    const progress=json(row.guest_snapshot),level=progress.level||1;
    const {guest_snapshot,growth,wallet,cosmetics,poopLevels,...rest}=row;
    return {...rest,level,gold:progress.gold||0,dps:progress.dps||0,toiletLevel:progress.toiletLevel||0,
      poopLevels:levelsForLevel(level),selectedPoopId:stageForLevel(level),highestPoopId:stageForLevel(level),
      discovered:stageForLevel(level)+1,cosmetics:{},tokens:null,parts:null,wardrobe:null};
  }
  const wallet = json(row.wallet), levels = json(row.poopLevels);
  const list = Array.isArray(levels) ? levels : [];
  const { wallet: _wallet, poopLevels: _levels, cosmetics,guest_snapshot,growth, ...rest } = row;
  return { ...rest,level:json(growth).level||Math.max(1,...list), poopLevels: list, cosmetics: json(cosmetics),
    discovered: list.filter(n=>n>0).length || 1, selectedPoopId: row.selectedPoopId ?? 0,
    highestPoopId: Math.max(0,...list.flatMap((n,i)=>n>0?[i]:[])), toiletLevel: wallet.toiletLevel ?? migrateToiletLevel(row.legacyToiletLevel,row.toiletSchemaVersion),
    tokens: wallet.tokens ?? 0, parts: wallet.parts ?? 0, wardrobe: wallet.wardrobe || null };
}
export async function getAnalyticsUsers(filters, { page = filters.page, pageSize = 20, userId } = {}) {
  const base = baseQuery(filters);
  const order = { lastSeen: '"lastSeen" DESC NULLS LAST', clicks: 'clicks DESC', playSeconds: '"playSeconds" DESC' }[filters.sort];
  const result = await rows(`${base.sql} SELECT * FROM base ${userId ? 'WHERE id=?' : ''} ORDER BY ${order},id LIMIT ? OFFSET ?`,
    [...base.params,...(userId ? [userId]:[]),pageSize,(page-1)*pageSize]);
  return result.map(presentUser);
}
export async function getAnalyticsDaily(filters, userId) {
  const selected = population(filters);
  const conditions = selected.sql ? selected.sql.replace(/^WHERE /,'AND ') : '';
  const userCondition = userId ? 'AND u.kakao_id=?' : '';
  const common = [filters.from,filters.to,...selected.params,...(userId?[userId]:[])];
  const result = await rows(`WITH ${analyticsPopulation},events AS (
    SELECT d.kakao_id,d.activity_day AS day,${columns.map(col=>`d.${col}`).join(',')},0 AS legacy_seconds
    FROM combined_daily d JOIN people u ON u.kakao_id=d.kakao_id
    WHERE d.activity_day BETWEEN ? AND ? ${conditions} ${userCondition}
    UNION ALL
    SELECT d.kakao_id,CAST(d.activity_date AS TEXT) AS day,${columns.map(()=> '0').join(',')},d.play_seconds AS legacy_seconds
    FROM daily_activity d JOIN people u ON u.kakao_id=d.kakao_id
    WHERE CAST(d.activity_date AS TEXT) BETWEEN ? AND ? ${conditions} ${userCondition}
    ) SELECT day,COUNT(DISTINCT kakao_id) AS "activeUsers",SUM(legacy_seconds) AS "legacySeconds",
    ${metricKeys.map((key,i)=>`SUM(${columns[i]}) AS "${key}"`).join(',')}
    FROM events GROUP BY day ORDER BY day`, [...common,...common]);
  const byDay = new Map(result.map(row=>[row.day,row]));
  const daily = [];
  for (let day = filters.from; day <= filters.to; day = shiftDay(day,1)) {
    const item = { day,activeUsers:0,legacySeconds:0,...zeroMetrics(),...byDay.get(day) };
    daily.push({ ...item, playSeconds: Number(item.legacySeconds)+Number(item.mainSeconds)+Number(item.puzzleSeconds) });
  }
  return daily;
}
export async function getDashboardAnalytics(filters) {
  const base = baseQuery(filters);
  const [summaries, users, daily, distribution, metadata] = await Promise.all([
    rows(`${base.sql} SELECT COUNT(*) AS "totalUsers",
      COALESCE(SUM(CASE WHEN "createdDay" BETWEEN ? AND ? THEN 1 ELSE 0 END),0) AS "newUsers",
      COALESCE(SUM(CASE WHEN "activeDays">0 THEN 1 ELSE 0 END),0) AS "activeUsers",
      COALESCE(SUM(CASE WHEN "activeDays">1 THEN 1 ELSE 0 END),0) AS "returningUsers",
      COALESCE(SUM(CASE WHEN "puzzleEntries">0 OR "puzzleSeconds">0 THEN 1 ELSE 0 END),0) AS "puzzleUsers",
      COALESCE(SUM("playSeconds"),0) AS "playSeconds",COALESCE(SUM("legacySeconds"),0) AS "legacySeconds",
      ${metricKeys.map(key=>`COALESCE(SUM("${key}"),0) AS "${key}"`).join(',')}
      FROM base`,[...base.params,filters.from,filters.to]),
    getAnalyticsUsers(filters), getAnalyticsDaily(filters),
    rows(`${base.sql} SELECT "selectedPoopId" AS stage,COUNT(*) AS users FROM base WHERE "activeDays">0 GROUP BY "selectedPoopId" ORDER BY "selectedPoopId"`,base.params),
    rows("SELECT key,value FROM analytics_metadata WHERE key IN ('startedAt','guestStartedAt')"),
  ]);
  return { filters, summary: summaries[0], users, daily, distribution, pageSize:20,
    trackingStartedAt: metadata.find(row=>row.key==='startedAt')?.value,guestTrackingStartedAt:metadata.find(row=>row.key==='guestStartedAt')?.value, generatedAt:new Date().toISOString(), timezone:'Asia/Seoul' };
}
export async function getAnalyticsUserDetail(filters,userId) {
  const users = await getAnalyticsUsers(filters,{userId,page:1,pageSize:1});
  if (!users.length) return null;
  return { user:users[0],daily:await getAnalyticsDaily(filters,userId) };
}
