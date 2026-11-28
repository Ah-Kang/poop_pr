import { initializeGrowth, getGrowthRanking } from './growth.js';
import { initializeFeedback } from './feedback.js';
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';
import { randomUUID } from 'node:crypto';
import { applyEconomyAction, createEconomy, EconomyError, migrateToiletLevel, migratePuzzleTimer } from '../shared/economy.js';
import { updateWardrobe } from '../shared/wardrobe.js';
import { initializeAnalytics, recordEconomyAnalyticsPg, recordEconomyAnalyticsSqlite } from './analytics.js';

const { Pool, types } = pg;
types.setTypeParser(types.builtins.INT8, (value) => Number(value));

const databaseUrl = process.env.DATABASE_URL?.trim();
const usePostgres = Boolean(databaseUrl);
const isProduction = process.env.NODE_ENV === 'production';
let sqliteDatabase = null;
let sqliteStatements = null;
let postgresPool = null;
let databaseMode = 'sqlite';

const sqliteSchema = `
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS users (
    kakao_id TEXT PRIMARY KEY,
    nickname TEXT NOT NULL,
    display_nickname TEXT,
    login_id TEXT UNIQUE,
    password_hash TEXT,
    session_version TEXT NOT NULL DEFAULT '',
    auth_provider TEXT NOT NULL DEFAULT 'kakao',
    profile_image TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS scores (
    kakao_id TEXT PRIMARY KEY REFERENCES users(kakao_id) ON DELETE CASCADE,
    gold INTEGER NOT NULL DEFAULT 0,
    dps INTEGER NOT NULL DEFAULT 0,
    toilet_level INTEGER NOT NULL DEFAULT 0,
    toilet_schema_version INTEGER NOT NULL DEFAULT 1,
    poop_level INTEGER NOT NULL DEFAULT 1,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS game_saves (
    kakao_id TEXT PRIMARY KEY REFERENCES users(kakao_id) ON DELETE CASCADE,
    gold INTEGER NOT NULL DEFAULT 0,
    toilet_level INTEGER NOT NULL DEFAULT 0,
    toilet_schema_version INTEGER NOT NULL DEFAULT 1,
    poop_levels TEXT NOT NULL,
    selected_poop_id INTEGER NOT NULL DEFAULT 0,
    item_levels TEXT NOT NULL,
    cosmetics TEXT NOT NULL DEFAULT '{}',
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS user_activity (
    kakao_id TEXT PRIMARY KEY REFERENCES users(kakao_id) ON DELETE CASCADE,
    total_play_seconds INTEGER NOT NULL DEFAULT 0,
    session_count INTEGER NOT NULL DEFAULT 0,
    last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS daily_activity (
    kakao_id TEXT NOT NULL REFERENCES users(kakao_id) ON DELETE CASCADE,
    activity_date TEXT NOT NULL,
    play_seconds INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (kakao_id, activity_date)
  );
  CREATE TABLE IF NOT EXISTS player_economy (
    kakao_id TEXT PRIMARY KEY REFERENCES users(kakao_id) ON DELETE CASCADE,
    state TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS economy_actions (
    kakao_id TEXT NOT NULL REFERENCES users(kakao_id) ON DELETE CASCADE,
    action_id TEXT NOT NULL,
    PRIMARY KEY (kakao_id, action_id)
  );
`;

const postgresSchema = `
  CREATE TABLE IF NOT EXISTS public.users (
    kakao_id text PRIMARY KEY,
    nickname text NOT NULL,
    display_nickname text,
    login_id text UNIQUE,
    password_hash text,
    session_version text NOT NULL DEFAULT '',
    auth_provider text NOT NULL DEFAULT 'kakao',
    profile_image text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  );

  ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS display_nickname text;
  ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS login_id text;
  ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS password_hash text;
  ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS auth_provider text NOT NULL DEFAULT 'kakao';
  ALTER TABLE public.users ADD COLUMN IF NOT EXISTS session_version text NOT NULL DEFAULT '';
  CREATE UNIQUE INDEX IF NOT EXISTS users_login_id_unique
    ON public.users (login_id)
    WHERE login_id IS NOT NULL;

  CREATE TABLE IF NOT EXISTS public.scores (
    kakao_id text PRIMARY KEY REFERENCES public.users(kakao_id) ON DELETE CASCADE,
    gold bigint NOT NULL DEFAULT 0,
    dps bigint NOT NULL DEFAULT 0,
    toilet_level integer NOT NULL DEFAULT 0,
    toilet_schema_version integer NOT NULL DEFAULT 1,
    poop_level integer NOT NULL DEFAULT 1,
    updated_at timestamptz NOT NULL DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS public.game_saves (
    kakao_id text PRIMARY KEY REFERENCES public.users(kakao_id) ON DELETE CASCADE,
    gold bigint NOT NULL DEFAULT 0,
    toilet_level integer NOT NULL DEFAULT 0,
    toilet_schema_version integer NOT NULL DEFAULT 1,
    poop_levels jsonb NOT NULL DEFAULT '[]'::jsonb,
    selected_poop_id integer NOT NULL DEFAULT 0,
    item_levels jsonb NOT NULL DEFAULT '[]'::jsonb,
    cosmetics jsonb NOT NULL DEFAULT '{}'::jsonb,
    updated_at timestamptz NOT NULL DEFAULT now()
  );

  ALTER TABLE public.game_saves
    ADD COLUMN IF NOT EXISTS cosmetics jsonb NOT NULL DEFAULT '{}'::jsonb;
  ALTER TABLE public.scores
    ADD COLUMN IF NOT EXISTS toilet_schema_version integer NOT NULL DEFAULT 1;
  ALTER TABLE public.game_saves
    ADD COLUMN IF NOT EXISTS toilet_schema_version integer NOT NULL DEFAULT 1;

  CREATE TABLE IF NOT EXISTS public.user_activity (
    kakao_id text PRIMARY KEY REFERENCES public.users(kakao_id) ON DELETE CASCADE,
    total_play_seconds bigint NOT NULL DEFAULT 0,
    session_count integer NOT NULL DEFAULT 0,
    last_seen_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS public.daily_activity (
    kakao_id text NOT NULL REFERENCES public.users(kakao_id) ON DELETE CASCADE,
    activity_date date NOT NULL DEFAULT current_date,
    play_seconds bigint NOT NULL DEFAULT 0,
    PRIMARY KEY (kakao_id, activity_date)
  );
  CREATE TABLE IF NOT EXISTS public.player_economy (
    kakao_id text PRIMARY KEY REFERENCES public.users(kakao_id) ON DELETE CASCADE,
    state jsonb NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now()
  );
  ALTER TABLE public.player_economy ENABLE ROW LEVEL SECURITY;
  CREATE TABLE IF NOT EXISTS public.economy_actions (
    kakao_id text NOT NULL REFERENCES public.users(kakao_id) ON DELETE CASCADE,
    action_id text NOT NULL,
    PRIMARY KEY (kakao_id, action_id)
  );
  ALTER TABLE public.economy_actions ENABLE ROW LEVEL SECURITY;
`;

const shouldUseSsl = () => {
  if (process.env.DATABASE_SSL === 'false') return false;
  return databaseUrl?.includes('supabase.') || databaseUrl?.includes('sslmode=require');
};

const initializeSqlite = async () => {
  const { DatabaseSync } = await import('node:sqlite');
  const databasePath = path.resolve(process.env.SQLITE_PATH || 'data/game.db');
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });

  sqliteDatabase = new DatabaseSync(databasePath);
  sqliteDatabase.exec(sqliteSchema);
  const userColumns = sqliteDatabase.prepare('PRAGMA table_info(users)').all();
  if (!userColumns.some((column) => column.name === 'session_version')) {
    sqliteDatabase.exec("ALTER TABLE users ADD COLUMN session_version TEXT NOT NULL DEFAULT ''");
  }
  if (!userColumns.some((column) => column.name === 'display_nickname')) {
    sqliteDatabase.exec('ALTER TABLE users ADD COLUMN display_nickname TEXT');
  }
  if (!userColumns.some((column) => column.name === 'login_id')) {
    sqliteDatabase.exec('ALTER TABLE users ADD COLUMN login_id TEXT');
  }
  if (!userColumns.some((column) => column.name === 'password_hash')) {
    sqliteDatabase.exec('ALTER TABLE users ADD COLUMN password_hash TEXT');
  }
  if (!userColumns.some((column) => column.name === 'auth_provider')) {
    sqliteDatabase.exec("ALTER TABLE users ADD COLUMN auth_provider TEXT NOT NULL DEFAULT 'kakao'");
  }
  sqliteDatabase.exec('CREATE UNIQUE INDEX IF NOT EXISTS users_login_id_unique ON users(login_id) WHERE login_id IS NOT NULL');
  const scoreColumns = sqliteDatabase.prepare('PRAGMA table_info(scores)').all();
  if (!scoreColumns.some((column) => column.name === 'toilet_schema_version')) {
    sqliteDatabase.exec('ALTER TABLE scores ADD COLUMN toilet_schema_version INTEGER NOT NULL DEFAULT 1');
  }
  const gameSaveColumns = sqliteDatabase.prepare('PRAGMA table_info(game_saves)').all();
  if (!gameSaveColumns.some((column) => column.name === 'toilet_schema_version')) {
    sqliteDatabase.exec('ALTER TABLE game_saves ADD COLUMN toilet_schema_version INTEGER NOT NULL DEFAULT 1');
  }
  if (!gameSaveColumns.some((column) => column.name === 'cosmetics')) {
    sqliteDatabase.exec("ALTER TABLE game_saves ADD COLUMN cosmetics TEXT NOT NULL DEFAULT '{}'");
  }
  sqliteStatements = {
    upsertUser: sqliteDatabase.prepare(`
      INSERT INTO users (kakao_id, nickname, profile_image)
      VALUES (?, ?, ?)
      ON CONFLICT(kakao_id) DO UPDATE SET
        nickname = excluded.nickname,
        display_nickname = COALESCE(users.display_nickname, excluded.nickname),
        profile_image = excluded.profile_image,
        updated_at = CURRENT_TIMESTAMP
    `),
    updateDisplayNickname: sqliteDatabase.prepare(`
      UPDATE users
      SET display_nickname = ?, updated_at = CURRENT_TIMESTAMP
      WHERE kakao_id = ?
    `),
    createLocalUser: sqliteDatabase.prepare(`
      INSERT INTO users (
        kakao_id, nickname, display_nickname, login_id, password_hash, auth_provider
      ) VALUES (?, ?, ?, ?, ?, 'local')
    `),
    getLocalUserByLoginId: sqliteDatabase.prepare(`
      SELECT
        kakao_id AS id,
        nickname AS kakaoNickname,
        COALESCE(display_nickname, nickname) AS nickname,
        COALESCE(display_nickname, nickname) AS displayNickname,
        profile_image AS profileImage,
        password_hash AS passwordHash
      FROM users
      WHERE login_id = ?
    `),
    upsertScore: sqliteDatabase.prepare(`
      INSERT INTO scores (kakao_id, gold, dps, toilet_level, toilet_schema_version, poop_level)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(kakao_id) DO UPDATE SET
        gold = excluded.gold,
        dps = excluded.dps,
        toilet_level = excluded.toilet_level,
        toilet_schema_version = excluded.toilet_schema_version,
        poop_level = excluded.poop_level,
        updated_at = CURRENT_TIMESTAMP
    `),
    getGameSave: sqliteDatabase.prepare(`
      SELECT
        gold,
        toilet_level AS toiletLevel,
        toilet_schema_version AS toiletSchemaVersion,
        poop_levels AS poopLevels,
        selected_poop_id AS selectedPoopId,
        item_levels AS itemLevels,
        cosmetics,
        updated_at AS updatedAt
      FROM game_saves
      WHERE kakao_id = ?
    `),
    upsertGameSave: sqliteDatabase.prepare(`
      INSERT INTO game_saves (
        kakao_id, gold, toilet_level, toilet_schema_version, poop_levels, selected_poop_id, item_levels, cosmetics
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(kakao_id) DO UPDATE SET
        gold = excluded.gold,
        toilet_level = excluded.toilet_level,
        toilet_schema_version = excluded.toilet_schema_version,
        poop_levels = excluded.poop_levels,
        selected_poop_id = excluded.selected_poop_id,
        item_levels = excluded.item_levels,
        cosmetics = excluded.cosmetics,
        updated_at = CURRENT_TIMESTAMP
    `),
    recordActivity: sqliteDatabase.prepare(`
      INSERT INTO user_activity (
        kakao_id, total_play_seconds, session_count, last_seen_at
      ) VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(kakao_id) DO UPDATE SET
        total_play_seconds = total_play_seconds + excluded.total_play_seconds,
        session_count = session_count + excluded.session_count,
        last_seen_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    `),
    recordDailyActivity: sqliteDatabase.prepare(`
      INSERT INTO daily_activity (kakao_id, activity_date, play_seconds)
      VALUES (?, date('now'), ?)
      ON CONFLICT(kakao_id, activity_date) DO UPDATE SET
        play_seconds = play_seconds + excluded.play_seconds
    `),

  };
  databaseMode = 'sqlite';
};

const parseJsonArray = (value) => {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  return JSON.parse(value);
};

const parseJsonObject = (value) => {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value;
  if (!value) return {};
  return JSON.parse(value);
};

const normalizePostgresRow = (row) => ({
  id: row.id,
  nickname: row.nickname,
  kakaoNickname: row.kakaonickname ?? row.kakaoNickname,
  displayNickname: row.displaynickname ?? row.displayNickname,
  profileImage: row.profileimage ?? row.profileImage ?? null,
  authProvider: row.authprovider ?? row.authProvider,
  loginId: row.loginid ?? row.loginId,
  gold: row.gold,
  dps: row.dps,
  toiletLevel: row.toiletlevel ?? row.toiletLevel,
  toiletSchemaVersion: row.toiletschemaversion ?? row.toiletSchemaVersion ?? 1,
  poopLevel: row.pooplevel ?? row.poopLevel,
  selectedPoopId: row.selectedpoopid ?? row.selectedPoopId ?? 0,
  poopLevels: parseJsonArray(row.pooplevels ?? row.poopLevels),
  itemLevels: parseJsonArray(row.itemlevels ?? row.itemLevels),
  cosmetics: parseJsonObject(row.cosmetics),
  updatedAt: row.updatedat ?? row.updatedAt,
});

export const initializeDatabase = async () => {
  if (!usePostgres) {
    if (isProduction) {
      throw new Error('DATABASE_URL is required when NODE_ENV=production.');
    }

    await initializeSqlite();
    await initializeAnalytics(null, sqliteDatabase);
    await initializeGrowth(null, sqliteDatabase);
    await initializeFeedback(null, sqliteDatabase);
    return { mode: databaseMode };
  }

  postgresPool = new Pool({
    connectionString: databaseUrl,
    ssl: shouldUseSsl() ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 10_000,
    statement_timeout: 15_000,
    query_timeout: 20_000,
  });
  postgresPool.on('error', (error) => {
    console.error('Idle database connection failed:', error.code || 'unknown');
  });
  await postgresPool.query(postgresSchema);
  await initializeAnalytics(postgresPool, null);
  await initializeGrowth(postgresPool, null);
  await initializeFeedback(postgresPool, null);
  databaseMode = 'postgres';
  return { mode: databaseMode };
};

export const getDatabaseMode = () => databaseMode;

// Each account incarnation has a different version. A cookie from a deleted
// account must never authenticate a later signup with the same login ID.
export const ensureAccountVersion = async (id) => {
  const version = randomUUID();
  if (postgresPool) {
    const { rows } = await postgresPool.query("UPDATE users SET session_version=COALESCE(NULLIF(session_version,''),$2) WHERE kakao_id=$1 RETURNING session_version", [id, version]);
    return rows[0]?.session_version;
  }
  return sqliteDatabase.prepare("UPDATE users SET session_version=COALESCE(NULLIF(session_version,''),?) WHERE kakao_id=? RETURNING session_version").get(version,id)?.session_version;
};

export const accountSessionExists = async (id, version) => {
  if (!version) return false;
  if (postgresPool) return (await postgresPool.query('SELECT 1 FROM users WHERE kakao_id=$1 AND session_version=$2', [id,version])).rowCount > 0;
  return Boolean(sqliteDatabase.prepare('SELECT 1 FROM users WHERE kakao_id=? AND session_version=?').get(id,version));
};

export const deleteAccount = async (id, version) => {
  // All account-owned save, wallet, ranking and analytics tables cascade.
  if (postgresPool) return (await postgresPool.query('DELETE FROM users WHERE kakao_id=$1 AND session_version=$2', [id,version])).rowCount > 0;
  return sqliteDatabase.prepare('DELETE FROM users WHERE kakao_id=? AND session_version=?').run(id,version).changes > 0;
};

export const checkDatabaseConnection = async () => {
  if (postgresPool) {
    await postgresPool.query('SELECT 1');
  } else {
    if (!sqliteDatabase) throw new Error('Database is not initialized.');
    sqliteDatabase.prepare('SELECT 1').get();
  }
};

export const closeDatabase = async () => {
  if (postgresPool) await postgresPool.end();
  if (sqliteDatabase) sqliteDatabase.close();
};

// Serialize every wallet mutation. Concurrent tabs cannot spend the same balance
// or claim the same daily gift twice. Account state never comes from localStorage.
export const transactEconomy = async (kakaoId, action = null, options = {}) => {
  if (action && (typeof action.id !== 'string' || !/^[\w-]{8,80}$/.test(action.id))) throw new EconomyError('invalid_action_id');
  const seed = (row) => createEconomy(row
    ? migrateToiletLevel(row.toilet_level, row.toilet_schema_version ?? 1) : 0);
  if (postgresPool) {
    const client = await postgresPool.connect();
    try {
      await client.query('BEGIN');
      const { rows: saves } = await client.query(
        'SELECT toilet_level, toilet_schema_version, poop_levels FROM public.game_saves WHERE kakao_id = $1', [kakaoId]);
      await client.query('INSERT INTO public.player_economy (kakao_id, state) VALUES ($1, $2::jsonb) ON CONFLICT DO NOTHING',
        [kakaoId, JSON.stringify(seed(saves[0]))]);
      const { rows } = await client.query('SELECT state FROM public.player_economy WHERE kakao_id = $1 FOR UPDATE', [kakaoId]);
      const duplicate = action && (await client.query('SELECT 1 FROM public.economy_actions WHERE kakao_id = $1 AND action_id = $2', [kakaoId, action.id])).rowCount > 0;
      const previous = migratePuzzleTimer(updateWardrobe(rows[0].state, { ...options, poopLevels: options.poopLevels ?? parseJsonArray(saves[0]?.poop_levels) }), options.now);
      const state = action && !duplicate ? applyEconomyAction(previous, action, options) : previous;
      if (state !== rows[0].state) {
        await client.query('UPDATE public.player_economy SET state = $2::jsonb, updated_at = now() WHERE kakao_id = $1', [kakaoId, JSON.stringify(state)]);
      }
      if (action && !duplicate) {
        await recordEconomyAnalyticsPg(client, kakaoId, previous, state, action);
        await client.query('INSERT INTO public.economy_actions (kakao_id, action_id) VALUES ($1, $2)', [kakaoId, action.id]);
      }
      await client.query('COMMIT');
      return state;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally { client.release(); }
  }
  sqliteDatabase.exec('BEGIN IMMEDIATE');
  try {
    const saved = sqliteDatabase.prepare('SELECT toilet_level, toilet_schema_version, poop_levels FROM game_saves WHERE kakao_id = ?').get(kakaoId);
    let row = sqliteDatabase.prepare('SELECT state FROM player_economy WHERE kakao_id = ?').get(kakaoId);
    if (!row) {
      row = { state: JSON.stringify(seed(saved)) };
      sqliteDatabase.prepare('INSERT INTO player_economy (kakao_id, state) VALUES (?, ?)').run(kakaoId, row.state);
    }
    const duplicate = action && sqliteDatabase.prepare('SELECT 1 FROM economy_actions WHERE kakao_id = ? AND action_id = ?').get(kakaoId, action.id ?? null);
    const original = JSON.parse(row.state);
    const previous = migratePuzzleTimer(updateWardrobe(original, { ...options, poopLevels: options.poopLevels ?? parseJsonArray(saved?.poop_levels) }), options.now);
    const state = action && !duplicate ? applyEconomyAction(previous, action, options) : previous;
    if (state !== original) {
      sqliteDatabase.prepare('UPDATE player_economy SET state = ?, updated_at = CURRENT_TIMESTAMP WHERE kakao_id = ?').run(JSON.stringify(state), kakaoId);
    }
    if (action && !duplicate) {
      recordEconomyAnalyticsSqlite(sqliteDatabase, kakaoId, previous, state, action);
      sqliteDatabase.prepare('INSERT INTO economy_actions (kakao_id, action_id) VALUES (?, ?)').run(kakaoId, action.id);
    }
    sqliteDatabase.exec('COMMIT');
    return state;
  } catch (error) {
    sqliteDatabase.exec('ROLLBACK');
    throw error;
  }
};

export const saveUser = async (user) => {
  if (postgresPool) {
    const { rows } = await postgresPool.query(`
      INSERT INTO public.users (kakao_id, nickname, profile_image)
      VALUES ($1, $2, $3)
      ON CONFLICT(kakao_id) DO UPDATE SET
        nickname = excluded.nickname,
        display_nickname = COALESCE(public.users.display_nickname, excluded.nickname),
        profile_image = excluded.profile_image,
        updated_at = now()
      RETURNING
        kakao_id AS id,
        nickname AS "kakaoNickname",
        COALESCE(display_nickname, nickname) AS nickname,
        COALESCE(display_nickname, nickname) AS "displayNickname",
        profile_image AS "profileImage"
    `, [user.id, user.nickname, user.profileImage]);
    return rows[0];
  }

  sqliteStatements.upsertUser.run(user.id, user.nickname, user.profileImage);
  return sqliteDatabase.prepare(`
    SELECT
      kakao_id AS id,
      nickname AS kakaoNickname,
      COALESCE(display_nickname, nickname) AS nickname,
      COALESCE(display_nickname, nickname) AS displayNickname,
      profile_image AS profileImage
    FROM users
    WHERE kakao_id = ?
  `).get(user.id);
};

export const createLocalUser = async (user) => {
  if (postgresPool) {
    const { rows } = await postgresPool.query(`
      INSERT INTO public.users (
        kakao_id, nickname, display_nickname, login_id, password_hash, auth_provider
      ) VALUES ($1, $2, $2, $3, $4, 'local')
      RETURNING
        kakao_id AS id,
        nickname AS "kakaoNickname",
        COALESCE(display_nickname, nickname) AS nickname,
        COALESCE(display_nickname, nickname) AS "displayNickname",
        profile_image AS "profileImage"
    `, [user.id, user.nickname, user.loginId, user.passwordHash]);
    return rows[0];
  }

  sqliteStatements.createLocalUser.run(
    user.id,
    user.nickname,
    user.nickname,
    user.loginId,
    user.passwordHash,
  );
  const row = sqliteStatements.getLocalUserByLoginId.get(user.loginId);
  if (!row) return null;
  const { passwordHash, ...safeUser } = row;
  return safeUser;
};

export const getLocalUserByLoginId = async (loginId) => {
  if (postgresPool) {
    const { rows } = await postgresPool.query(`
      SELECT
        kakao_id AS id,
        nickname AS "kakaoNickname",
        COALESCE(display_nickname, nickname) AS nickname,
        COALESCE(display_nickname, nickname) AS "displayNickname",
        profile_image AS "profileImage",
        password_hash AS "passwordHash"
      FROM public.users
      WHERE login_id = $1
    `, [loginId]);
    return rows[0] ?? null;
  }

  return sqliteStatements.getLocalUserByLoginId.get(loginId) ?? null;
};

export const updateUserProfile = async (kakaoId, profile) => {
  if (postgresPool) {
    const { rows } = await postgresPool.query(`
      UPDATE public.users
      SET display_nickname = $2, updated_at = now()
      WHERE kakao_id = $1
      RETURNING
        kakao_id AS id,
        nickname AS "kakaoNickname",
        COALESCE(display_nickname, nickname) AS nickname,
        COALESCE(display_nickname, nickname) AS "displayNickname",
        profile_image AS "profileImage"
    `, [kakaoId, profile.displayNickname]);
    return rows[0] ?? null;
  }

  sqliteStatements.updateDisplayNickname.run(profile.displayNickname, kakaoId);
  const row = sqliteDatabase.prepare(`
    SELECT
      kakao_id AS id,
      nickname AS kakaoNickname,
      COALESCE(display_nickname, nickname) AS nickname,
      COALESCE(display_nickname, nickname) AS displayNickname,
      profile_image AS profileImage
    FROM users
    WHERE kakao_id = ?
  `).get(kakaoId);
  return row ?? null;
};

export const saveScore = async (kakaoId, score) => {
  if (postgresPool) {
    await postgresPool.query(`
      INSERT INTO public.scores (kakao_id, gold, dps, toilet_level, toilet_schema_version, poop_level)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT(kakao_id) DO UPDATE SET
        gold = excluded.gold,
        dps = excluded.dps,
        toilet_level = excluded.toilet_level,
        toilet_schema_version = excluded.toilet_schema_version,
        poop_level = excluded.poop_level,
        updated_at = now()
    `, [kakaoId, score.gold, score.dps, score.toiletLevel, score.toiletSchemaVersion, score.poopLevel]);
    return;
  }

  sqliteStatements.upsertScore.run(
    kakaoId,
    score.gold,
    score.dps,
    score.toiletLevel,
    score.toiletSchemaVersion,
    score.poopLevel,
  );
};

export const getRanking = async (limit = 50) => getGrowthRanking(limit);

export const getGameSave = async (kakaoId) => {
  if (postgresPool) {
    const { rows } = await postgresPool.query(`
      SELECT
        gold,
        toilet_level AS "toiletLevel",
        toilet_schema_version AS "toiletSchemaVersion",
        poop_levels AS "poopLevels",
        selected_poop_id AS "selectedPoopId",
        item_levels AS "itemLevels",
        cosmetics,
        updated_at AS "updatedAt"
      FROM public.game_saves
      WHERE kakao_id = $1
    `, [kakaoId]);
    if (rows.length === 0) return null;
    return normalizePostgresRow(rows[0]);
  }

  const row = sqliteStatements.getGameSave.get(kakaoId);
  if (!row) return null;
  return {
    ...row,
    poopLevels: parseJsonArray(row.poopLevels),
    itemLevels: parseJsonArray(row.itemLevels),
    cosmetics: parseJsonObject(row.cosmetics),
  };
};

export const saveGame = async (kakaoId, save) => {
  if (postgresPool) {
    await postgresPool.query(`
      INSERT INTO public.game_saves (
        kakao_id, gold, toilet_level, toilet_schema_version, poop_levels, selected_poop_id, item_levels, cosmetics
      ) VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7::jsonb, $8::jsonb)
      ON CONFLICT(kakao_id) DO UPDATE SET
        gold = excluded.gold,
        toilet_level = excluded.toilet_level,
        toilet_schema_version = excluded.toilet_schema_version,
        poop_levels = excluded.poop_levels,
        selected_poop_id = excluded.selected_poop_id,
        item_levels = excluded.item_levels,
        cosmetics = excluded.cosmetics,
        updated_at = now()
    `, [
      kakaoId,
      save.gold,
      save.toiletLevel,
      save.toiletSchemaVersion,
      JSON.stringify(save.poopLevels),
      save.selectedPoopId,
      JSON.stringify(save.itemLevels),
      JSON.stringify(save.cosmetics),
    ]);
    return;
  }

  sqliteStatements.upsertGameSave.run(
    kakaoId,
    save.gold,
    save.toiletLevel,
    save.toiletSchemaVersion,
    JSON.stringify(save.poopLevels),
    save.selectedPoopId,
    JSON.stringify(save.itemLevels),
    JSON.stringify(save.cosmetics),
  );
};

export const recordActivity = async (kakaoId, activity) => {
  const seconds = Math.min(300, Math.max(0, Math.floor(activity.seconds)));
  const sessionStart = activity.sessionStart ? 1 : 0;
  if (seconds <= 0 && sessionStart === 0) return;

  if (postgresPool) {
    await postgresPool.query(`
      INSERT INTO public.user_activity (
        kakao_id, total_play_seconds, session_count, last_seen_at
      ) VALUES ($1, $2, $3, now())
      ON CONFLICT(kakao_id) DO UPDATE SET
        total_play_seconds = public.user_activity.total_play_seconds + excluded.total_play_seconds,
        session_count = public.user_activity.session_count + excluded.session_count,
        last_seen_at = now(),
        updated_at = now()
    `, [kakaoId, seconds, sessionStart]);

    if (seconds > 0) {
      await postgresPool.query(`
        INSERT INTO public.daily_activity (kakao_id, activity_date, play_seconds)
        VALUES ($1, current_date, $2)
        ON CONFLICT(kakao_id, activity_date) DO UPDATE SET
          play_seconds = public.daily_activity.play_seconds + excluded.play_seconds
      `, [kakaoId, seconds]);
    }
    return;
  }

  sqliteStatements.recordActivity.run(kakaoId, seconds, sessionStart);
  if (seconds > 0) sqliteStatements.recordDailyActivity.run(kakaoId, seconds);
};
