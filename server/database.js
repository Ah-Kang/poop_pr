import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const dataDirectory = path.resolve('data');
fs.mkdirSync(dataDirectory, { recursive: true });

const database = new DatabaseSync(path.join(dataDirectory, 'game.db'));
database.exec(`
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
`);

const upsertUserStatement = database.prepare(`
  INSERT INTO users (kakao_id, nickname, profile_image)
  VALUES (?, ?, ?)
  ON CONFLICT(kakao_id) DO UPDATE SET
    nickname = excluded.nickname,
    profile_image = excluded.profile_image,
    updated_at = CURRENT_TIMESTAMP
`);

const upsertScoreStatement = database.prepare(`
  INSERT INTO scores (kakao_id, gold, dps, toilet_level, poop_level)
  VALUES (?, ?, ?, ?, ?)
  ON CONFLICT(kakao_id) DO UPDATE SET
    gold = excluded.gold,
    dps = excluded.dps,
    toilet_level = excluded.toilet_level,
    poop_level = excluded.poop_level,
    updated_at = CURRENT_TIMESTAMP
`);

const rankingStatement = database.prepare(`
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
`);

const getGameSaveStatement = database.prepare(`
  SELECT
    gold,
    toilet_level AS toiletLevel,
    poop_levels AS poopLevels,
    selected_poop_id AS selectedPoopId,
    item_levels AS itemLevels,
    updated_at AS updatedAt
  FROM game_saves
  WHERE kakao_id = ?
`);

const upsertGameSaveStatement = database.prepare(`
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
`);

export const saveUser = (user) => {
  upsertUserStatement.run(user.id, user.nickname, user.profileImage);
};

export const saveScore = (kakaoId, score) => {
  upsertScoreStatement.run(
    kakaoId,
    score.gold,
    score.dps,
    score.toiletLevel,
    score.poopLevel,
  );
};

export const getRanking = (limit = 50) => rankingStatement.all(limit).map((row) => ({
  ...row,
  selectedPoopId: row.selectedPoopId ?? 0,
  poopLevels: row.poopLevels ? JSON.parse(row.poopLevels) : [],
  itemLevels: row.itemLevels ? JSON.parse(row.itemLevels) : [],
}));

export const getGameSave = (kakaoId) => {
  const row = getGameSaveStatement.get(kakaoId);
  if (!row) return null;
  return {
    ...row,
    poopLevels: JSON.parse(row.poopLevels),
    itemLevels: JSON.parse(row.itemLevels),
  };
};

export const saveGame = (kakaoId, save) => {
  upsertGameSaveStatement.run(
    kakaoId,
    save.gold,
    save.toiletLevel,
    JSON.stringify(save.poopLevels),
    save.selectedPoopId,
    JSON.stringify(save.itemLevels),
  );
};
