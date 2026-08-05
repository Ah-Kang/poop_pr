import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';

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
  CREATE TABLE IF NOT EXISTS users (
    kakao_id TEXT PRIMARY KEY,
    nickname TEXT NOT NULL,
    display_nickname TEXT,
    profile_image TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS scores (
    kakao_id TEXT PRIMARY KEY REFERENCES users(kakao_id) ON DELETE CASCADE,
    gold INTEGER NOT NULL DEFAULT 0,
    dps INTEGER NOT NULL DEFAULT 0,
    toilet_level INTEGER NOT NULL DEFAULT 0,
    poop_level INTEGER NOT NULL DEFAULT 1,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS game_saves (
    kakao_id TEXT PRIMARY KEY REFERENCES users(kakao_id) ON DELETE CASCADE,
    gold INTEGER NOT NULL DEFAULT 0,
    toilet_level INTEGER NOT NULL DEFAULT 0,
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
`;

const postgresSchema = `
  CREATE TABLE IF NOT EXISTS public.users (
    kakao_id text PRIMARY KEY,
    nickname text NOT NULL,
    display_nickname text,
    profile_image text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  );

  ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS display_nickname text;

  CREATE TABLE IF NOT EXISTS public.scores (
    kakao_id text PRIMARY KEY REFERENCES public.users(kakao_id) ON DELETE CASCADE,
    gold bigint NOT NULL DEFAULT 0,
    dps bigint NOT NULL DEFAULT 0,
    toilet_level integer NOT NULL DEFAULT 0,
    poop_level integer NOT NULL DEFAULT 1,
    updated_at timestamptz NOT NULL DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS public.game_saves (
    kakao_id text PRIMARY KEY REFERENCES public.users(kakao_id) ON DELETE CASCADE,
    gold bigint NOT NULL DEFAULT 0,
    toilet_level integer NOT NULL DEFAULT 0,
    poop_levels jsonb NOT NULL DEFAULT '[]'::jsonb,
    selected_poop_id integer NOT NULL DEFAULT 0,
    item_levels jsonb NOT NULL DEFAULT '[]'::jsonb,
    cosmetics jsonb NOT NULL DEFAULT '{}'::jsonb,
    updated_at timestamptz NOT NULL DEFAULT now()
  );

  ALTER TABLE public.game_saves
    ADD COLUMN IF NOT EXISTS cosmetics jsonb NOT NULL DEFAULT '{}'::jsonb;

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
`;

const shouldUseSsl = () => {
  if (process.env.DATABASE_SSL === 'false') return false;
  return databaseUrl?.includes('supabase.') || databaseUrl?.includes('sslmode=require');
};

const initializeSqlite = async () => {
  const { DatabaseSync } = await import('node:sqlite');
  const dataDirectory = path.resolve('data');
  fs.mkdirSync(dataDirectory, { recursive: true });

  sqliteDatabase = new DatabaseSync(path.join(dataDirectory, 'game.db'));
  sqliteDatabase.exec(sqliteSchema);
  const userColumns = sqliteDatabase.prepare('PRAGMA table_info(users)').all();
  if (!userColumns.some((column) => column.name === 'display_nickname')) {
    sqliteDatabase.exec('ALTER TABLE users ADD COLUMN display_nickname TEXT');
  }
  const gameSaveColumns = sqliteDatabase.prepare('PRAGMA table_info(game_saves)').all();
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
    upsertScore: sqliteDatabase.prepare(`
      INSERT INTO scores (kakao_id, gold, dps, toilet_level, poop_level)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(kakao_id) DO UPDATE SET
        gold = excluded.gold,
        dps = excluded.dps,
        toilet_level = excluded.toilet_level,
        poop_level = excluded.poop_level,
        updated_at = CURRENT_TIMESTAMP
    `),
    ranking: sqliteDatabase.prepare(`
      SELECT
        users.kakao_id AS id,
        COALESCE(users.display_nickname, users.nickname) AS nickname,
        users.profile_image AS profileImage,
        scores.gold,
        scores.dps,
        scores.toilet_level AS toiletLevel,
        scores.poop_level AS poopLevel,
        game_saves.selected_poop_id AS selectedPoopId,
        game_saves.poop_levels AS poopLevels,
        game_saves.item_levels AS itemLevels,
        game_saves.cosmetics AS cosmetics,
        scores.updated_at AS updatedAt
      FROM scores
      JOIN users ON users.kakao_id = scores.kakao_id
      LEFT JOIN game_saves ON game_saves.kakao_id = scores.kakao_id
      ORDER BY scores.gold DESC, scores.dps DESC, scores.updated_at ASC
      LIMIT ?
    `),
    getGameSave: sqliteDatabase.prepare(`
      SELECT
        gold,
        toilet_level AS toiletLevel,
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
        kakao_id, gold, toilet_level, poop_levels, selected_poop_id, item_levels, cosmetics
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(kakao_id) DO UPDATE SET
        gold = excluded.gold,
        toilet_level = excluded.toilet_level,
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
    adminSummary: sqliteDatabase.prepare(`
      SELECT
        (SELECT COUNT(*) FROM users) AS totalUsers,
        (SELECT COUNT(*) FROM users WHERE date(created_at) = date('now')) AS newUsersToday,
        (SELECT COUNT(*) FROM user_activity WHERE datetime(last_seen_at) >= datetime('now', '-7 days')) AS activeUsers7d,
        (SELECT COALESCE(SUM(total_play_seconds), 0) FROM user_activity) AS totalPlaySeconds,
        (SELECT COALESCE(AVG(total_play_seconds), 0) FROM user_activity) AS averagePlaySeconds,
        (SELECT COALESCE(MAX(gold), 0) FROM scores) AS topGold,
        (SELECT COALESCE(MAX(dps), 0) FROM scores) AS topDps
    `),
    adminUsers: sqliteDatabase.prepare(`
      SELECT
        users.kakao_id AS id,
        users.nickname AS kakaoNickname,
        COALESCE(users.display_nickname, users.nickname) AS displayNickname,
        users.profile_image AS profileImage,
        users.created_at AS createdAt,
        users.updated_at AS updatedAt,
        COALESCE(user_activity.total_play_seconds, 0) AS totalPlaySeconds,
        COALESCE(user_activity.session_count, 0) AS sessionCount,
        user_activity.last_seen_at AS lastSeenAt,
        COALESCE(scores.gold, 0) AS gold,
        COALESCE(scores.dps, 0) AS dps,
        COALESCE(scores.toilet_level, 0) AS toiletLevel,
        COALESCE(scores.poop_level, 1) AS poopLevel
      FROM users
      LEFT JOIN user_activity ON user_activity.kakao_id = users.kakao_id
      LEFT JOIN scores ON scores.kakao_id = users.kakao_id
      ORDER BY user_activity.last_seen_at DESC NULLS LAST, users.created_at DESC
      LIMIT ?
    `),
    adminDailyActivity: sqliteDatabase.prepare(`
      SELECT
        activity_date AS date,
        COUNT(*) AS activeUsers,
        COALESCE(SUM(play_seconds), 0) AS playSeconds
      FROM daily_activity
      WHERE date(activity_date) >= date('now', '-13 days')
      GROUP BY activity_date
      ORDER BY activity_date ASC
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
  gold: row.gold,
  dps: row.dps,
  toiletLevel: row.toiletlevel ?? row.toiletLevel,
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
    return { mode: databaseMode };
  }

  postgresPool = new Pool({
    connectionString: databaseUrl,
    ssl: shouldUseSsl() ? { rejectUnauthorized: false } : false,
  });
  await postgresPool.query(postgresSchema);
  databaseMode = 'postgres';
  return { mode: databaseMode };
};

export const getDatabaseMode = () => databaseMode;

export const closeDatabase = async () => {
  if (postgresPool) await postgresPool.end();
  if (sqliteDatabase) sqliteDatabase.close();
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
      INSERT INTO public.scores (kakao_id, gold, dps, toilet_level, poop_level)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT(kakao_id) DO UPDATE SET
        gold = excluded.gold,
        dps = excluded.dps,
        toilet_level = excluded.toilet_level,
        poop_level = excluded.poop_level,
        updated_at = now()
    `, [kakaoId, score.gold, score.dps, score.toiletLevel, score.poopLevel]);
    return;
  }

  sqliteStatements.upsertScore.run(
    kakaoId,
    score.gold,
    score.dps,
    score.toiletLevel,
    score.poopLevel,
  );
};

export const getRanking = async (limit = 50) => {
  if (postgresPool) {
    const { rows } = await postgresPool.query(`
      SELECT
        users.kakao_id AS id,
        COALESCE(users.display_nickname, users.nickname) AS nickname,
        users.profile_image AS "profileImage",
        scores.gold,
        scores.dps,
        scores.toilet_level AS "toiletLevel",
        scores.poop_level AS "poopLevel",
        game_saves.selected_poop_id AS "selectedPoopId",
        game_saves.poop_levels AS "poopLevels",
        game_saves.item_levels AS "itemLevels",
        game_saves.cosmetics AS cosmetics,
        scores.updated_at AS "updatedAt"
      FROM public.scores
      JOIN public.users ON users.kakao_id = scores.kakao_id
      LEFT JOIN public.game_saves ON game_saves.kakao_id = scores.kakao_id
      ORDER BY scores.gold DESC, scores.dps DESC, scores.updated_at ASC
      LIMIT $1
    `, [limit]);
    return rows.map(normalizePostgresRow);
  }

  return sqliteStatements.ranking.all(limit).map((row) => ({
    ...row,
    selectedPoopId: row.selectedPoopId ?? 0,
    poopLevels: parseJsonArray(row.poopLevels),
    itemLevels: parseJsonArray(row.itemLevels),
    cosmetics: parseJsonObject(row.cosmetics),
  }));
};

export const getGameSave = async (kakaoId) => {
  if (postgresPool) {
    const { rows } = await postgresPool.query(`
      SELECT
        gold,
        toilet_level AS "toiletLevel",
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
        kakao_id, gold, toilet_level, poop_levels, selected_poop_id, item_levels, cosmetics
      ) VALUES ($1, $2, $3, $4::jsonb, $5, $6::jsonb, $7::jsonb)
      ON CONFLICT(kakao_id) DO UPDATE SET
        gold = excluded.gold,
        toilet_level = excluded.toilet_level,
        poop_levels = excluded.poop_levels,
        selected_poop_id = excluded.selected_poop_id,
        item_levels = excluded.item_levels,
        cosmetics = excluded.cosmetics,
        updated_at = now()
    `, [
      kakaoId,
      save.gold,
      save.toiletLevel,
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

export const getAdminAnalytics = async () => {
  if (postgresPool) {
    const [summaryResult, usersResult, dailyResult] = await Promise.all([
      postgresPool.query(`
        SELECT
          (SELECT COUNT(*) FROM public.users) AS "totalUsers",
          (SELECT COUNT(*) FROM public.users WHERE created_at >= date_trunc('day', now())) AS "newUsersToday",
          (SELECT COUNT(*) FROM public.user_activity WHERE last_seen_at >= now() - interval '7 days') AS "activeUsers7d",
          (SELECT COALESCE(SUM(total_play_seconds), 0) FROM public.user_activity) AS "totalPlaySeconds",
          (SELECT COALESCE(AVG(total_play_seconds), 0) FROM public.user_activity) AS "averagePlaySeconds",
          (SELECT COALESCE(MAX(gold), 0) FROM public.scores) AS "topGold",
          (SELECT COALESCE(MAX(dps), 0) FROM public.scores) AS "topDps"
      `),
      postgresPool.query(`
        SELECT
          users.kakao_id AS id,
          users.nickname AS "kakaoNickname",
          COALESCE(users.display_nickname, users.nickname) AS "displayNickname",
          users.profile_image AS "profileImage",
          users.created_at AS "createdAt",
          users.updated_at AS "updatedAt",
          COALESCE(user_activity.total_play_seconds, 0) AS "totalPlaySeconds",
          COALESCE(user_activity.session_count, 0) AS "sessionCount",
          user_activity.last_seen_at AS "lastSeenAt",
          COALESCE(scores.gold, 0) AS gold,
          COALESCE(scores.dps, 0) AS dps,
          COALESCE(scores.toilet_level, 0) AS "toiletLevel",
          COALESCE(scores.poop_level, 1) AS "poopLevel"
        FROM public.users
        LEFT JOIN public.user_activity ON user_activity.kakao_id = users.kakao_id
        LEFT JOIN public.scores ON scores.kakao_id = users.kakao_id
        ORDER BY user_activity.last_seen_at DESC NULLS LAST, users.created_at DESC
        LIMIT 100
      `),
      postgresPool.query(`
        SELECT
          activity_date AS date,
          COUNT(*) AS "activeUsers",
          COALESCE(SUM(play_seconds), 0) AS "playSeconds"
        FROM public.daily_activity
        WHERE activity_date >= current_date - interval '13 days'
        GROUP BY activity_date
        ORDER BY activity_date ASC
      `),
    ]);

    return {
      summary: summaryResult.rows[0],
      users: usersResult.rows,
      daily: dailyResult.rows,
    };
  }

  return {
    summary: sqliteStatements.adminSummary.get(),
    users: sqliteStatements.adminUsers.all(100),
    daily: sqliteStatements.adminDailyActivity.all(),
  };
};
