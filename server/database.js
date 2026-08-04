import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import pg from 'pg';

const { Pool, types } = pg;
types.setTypeParser(types.builtins.INT8, (value) => Number(value));

const databaseUrl = process.env.DATABASE_URL?.trim();
const usePostgres = Boolean(databaseUrl);
let sqliteDatabase = null;
let sqliteStatements = null;
let postgresPool = null;
let databaseMode = 'sqlite';

const sqliteSchema = `
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS users (
    kakao_id TEXT PRIMARY KEY,
    nickname TEXT NOT NULL,
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
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`;

const postgresSchema = `
  CREATE TABLE IF NOT EXISTS public.users (
    kakao_id text PRIMARY KEY,
    nickname text NOT NULL,
    profile_image text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  );

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
    updated_at timestamptz NOT NULL DEFAULT now()
  );
`;

const shouldUseSsl = () => {
  if (process.env.DATABASE_SSL === 'false') return false;
  return databaseUrl?.includes('supabase.') || databaseUrl?.includes('sslmode=require');
};

const initializeSqlite = () => {
  const dataDirectory = path.resolve('data');
  fs.mkdirSync(dataDirectory, { recursive: true });

  sqliteDatabase = new DatabaseSync(path.join(dataDirectory, 'game.db'));
  sqliteDatabase.exec(sqliteSchema);
  sqliteStatements = {
    upsertUser: sqliteDatabase.prepare(`
      INSERT INTO users (kakao_id, nickname, profile_image)
      VALUES (?, ?, ?)
      ON CONFLICT(kakao_id) DO UPDATE SET
        nickname = excluded.nickname,
        profile_image = excluded.profile_image,
        updated_at = CURRENT_TIMESTAMP
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
        users.nickname,
        users.profile_image AS profileImage,
        scores.gold,
        scores.dps,
        scores.toilet_level AS toiletLevel,
        scores.poop_level AS poopLevel,
        game_saves.selected_poop_id AS selectedPoopId,
        game_saves.poop_levels AS poopLevels,
        game_saves.item_levels AS itemLevels,
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
        updated_at AS updatedAt
      FROM game_saves
      WHERE kakao_id = ?
    `),
    upsertGameSave: sqliteDatabase.prepare(`
      INSERT INTO game_saves (
        kakao_id, gold, toilet_level, poop_levels, selected_poop_id, item_levels
      ) VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(kakao_id) DO UPDATE SET
        gold = excluded.gold,
        toilet_level = excluded.toilet_level,
        poop_levels = excluded.poop_levels,
        selected_poop_id = excluded.selected_poop_id,
        item_levels = excluded.item_levels,
        updated_at = CURRENT_TIMESTAMP
    `),
  };
  databaseMode = 'sqlite';
};

const parseJsonArray = (value) => {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  return JSON.parse(value);
};

const normalizePostgresRow = (row) => ({
  id: row.id,
  nickname: row.nickname,
  profileImage: row.profileimage ?? row.profileImage ?? null,
  gold: row.gold,
  dps: row.dps,
  toiletLevel: row.toiletlevel ?? row.toiletLevel,
  poopLevel: row.pooplevel ?? row.poopLevel,
  selectedPoopId: row.selectedpoopid ?? row.selectedPoopId ?? 0,
  poopLevels: parseJsonArray(row.pooplevels ?? row.poopLevels),
  itemLevels: parseJsonArray(row.itemlevels ?? row.itemLevels),
  updatedAt: row.updatedat ?? row.updatedAt,
});

export const initializeDatabase = async () => {
  if (!usePostgres) {
    initializeSqlite();
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
    await postgresPool.query(`
      INSERT INTO public.users (kakao_id, nickname, profile_image)
      VALUES ($1, $2, $3)
      ON CONFLICT(kakao_id) DO UPDATE SET
        nickname = excluded.nickname,
        profile_image = excluded.profile_image,
        updated_at = now()
    `, [user.id, user.nickname, user.profileImage]);
    return;
  }

  sqliteStatements.upsertUser.run(user.id, user.nickname, user.profileImage);
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
        users.nickname,
        users.profile_image AS "profileImage",
        scores.gold,
        scores.dps,
        scores.toilet_level AS "toiletLevel",
        scores.poop_level AS "poopLevel",
        game_saves.selected_poop_id AS "selectedPoopId",
        game_saves.poop_levels AS "poopLevels",
        game_saves.item_levels AS "itemLevels",
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
  };
};

export const saveGame = async (kakaoId, save) => {
  if (postgresPool) {
    await postgresPool.query(`
      INSERT INTO public.game_saves (
        kakao_id, gold, toilet_level, poop_levels, selected_poop_id, item_levels
      ) VALUES ($1, $2, $3, $4::jsonb, $5, $6::jsonb)
      ON CONFLICT(kakao_id) DO UPDATE SET
        gold = excluded.gold,
        toilet_level = excluded.toilet_level,
        poop_levels = excluded.poop_levels,
        selected_poop_id = excluded.selected_poop_id,
        item_levels = excluded.item_levels,
        updated_at = now()
    `, [
      kakaoId,
      save.gold,
      save.toiletLevel,
      JSON.stringify(save.poopLevels),
      save.selectedPoopId,
      JSON.stringify(save.itemLevels),
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
  );
};
