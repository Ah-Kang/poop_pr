import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import {
  closeDatabase,
  getDatabaseMode,
  initializeDatabase,
  saveGame,
  saveScore,
  saveUser,
} from './database.js';

const sqlitePath = path.resolve('data/game.db');

if (!process.env.DATABASE_URL?.trim()) {
  console.error('DATABASE_URL is required for PostgreSQL migration.');
  process.exit(1);
}

if (!fs.existsSync(sqlitePath)) {
  console.log('No SQLite database found at data/game.db. Nothing to migrate.');
  process.exit(0);
}

const sqliteDatabase = new DatabaseSync(sqlitePath, { readOnly: true });

const users = sqliteDatabase.prepare(`
  SELECT kakao_id AS id, nickname, profile_image AS profileImage
  FROM users
`).all();

const scores = sqliteDatabase.prepare(`
  SELECT kakao_id AS kakaoId, gold, dps, toilet_level AS toiletLevel, poop_level AS poopLevel
  FROM scores
`).all();

const gameSaves = sqliteDatabase.prepare(`
  SELECT
    kakao_id AS kakaoId,
    gold,
    toilet_level AS toiletLevel,
    poop_levels AS poopLevels,
    selected_poop_id AS selectedPoopId,
    item_levels AS itemLevels
  FROM game_saves
`).all();

try {
  await initializeDatabase();
  if (getDatabaseMode() !== 'postgres') {
    throw new Error('Migration target is not PostgreSQL.');
  }

  for (const user of users) {
    await saveUser(user);
  }

  for (const score of scores) {
    await saveScore(score.kakaoId, score);
  }

  for (const save of gameSaves) {
    await saveGame(save.kakaoId, {
      gold: save.gold,
      toiletLevel: save.toiletLevel,
      poopLevels: JSON.parse(save.poopLevels),
      selectedPoopId: save.selectedPoopId,
      itemLevels: JSON.parse(save.itemLevels),
    });
  }

  console.log(`Migrated ${users.length} users, ${scores.length} scores, ${gameSaves.length} game saves.`);
} catch (error) {
  console.error('SQLite to PostgreSQL migration failed.');
  console.error(error.message);
  process.exitCode = 1;
} finally {
  sqliteDatabase.close();
  await closeDatabase();
}
