import {
  closeDatabase,
  getDatabaseMode,
  getRanking,
  initializeDatabase,
} from './database.js';

try {
  await initializeDatabase();
  const ranking = await getRanking(1);
  console.log(`Database connection OK (${getDatabaseMode()})`);
  console.log(`Ranking query OK (${ranking.length} row sample)`);
} catch (error) {
  console.error('Database connection failed.');
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await closeDatabase();
}
