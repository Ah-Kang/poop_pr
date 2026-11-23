import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { fileURLToPath } from 'node:url';

let child, directory, base, cookie = '';
const request = async (route, body, expected = 200, session = cookie) => {
  const response = await fetch(`${base}${route}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: session },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(5000),
  });
  const text = await response.text();
  assert.equal(response.status, expected, `${route}: ${text}`);
  if (response.headers.get('set-cookie')) cookie = response.headers.get('set-cookie').split(';')[0];
  return text ? JSON.parse(text) : null;
};
const act = (type, payload = {}, expected = 200) => request('/api/economy/actions', { id: randomUUID(), type, ...payload }, expected);

test('equipped skin persists across login and hashed images have immutable caching', async () => {
  await request('/api/auth/local/register', { loginId: 'skin_save_test', password: 'test-only-123', displayNickname: '스킨테스트' }, 201, '');
  const cosmetics = { material: 'berry', expression: 'wink', outfit: 'none', hat: 'none', aura: 'none', titleText: '' };
  const save = { gold: 0, toiletLevel: 0, toiletSchemaVersion: 2, poopLevels: [1,...Array(19).fill(0)], selectedPoopId: 0, itemLevels: Array(6).fill(0), cosmetics: { ...cosmetics, material: 'mint', expression: 'sleepy', outfit: 'royal' }, wardrobe: { visits: 3, combos: 9999, upgrades: 3 } };
  await request('/api/game-save', save, 204);
  assert.deepEqual((await request('/api/game-save')).save.cosmetics, { ...cosmetics, material: 'original', expression: 'default' });
  assert.equal((await request('/api/economy')).state.wardrobe.visits, 1);
  // Existing character progress grants the corresponding styles, but toilet
  // skins still require actual wallet upgrades, not a supplied toilet level.
  await request('/api/game-save', { ...save, toiletLevel: 19, poopLevels: [1,1,1,1,1,...Array(15).fill(0)], cosmetics: { ...cosmetics, outfit: 'royal' } }, 204);
  await request('/api/logout', {}, 204);
  await request('/api/auth/local/login', { loginId: 'skin_save_test', password: 'test-only-123' });
  assert.deepEqual((await request('/api/game-save')).save.cosmetics, cosmetics);
  await act('reset_progress');
  await request('/api/game-save', { ...save, cosmetics }, 204);
  assert.deepEqual((await request('/api/game-save')).save.cosmetics, cosmetics);
  const catalog = JSON.parse(await readFile(new URL('../src/cosmetics/skin-catalog.json', import.meta.url), 'utf8'));
  const image = await fetch(base + catalog[0].image);
  assert.equal(image.status,200);
  assert.match(image.headers.get('content-type'), /image\/webp/);
  assert.match(image.headers.get('cache-control'), /max-age=31536000/);
  assert.match(image.headers.get('cache-control'), /immutable/);
  assert.equal((await fetch(base+'/skins/missing.image.0000000000000000.webp')).status,404);
});
before(async () => {
  directory = await mkdtemp(path.join(tmpdir(), 'poop-economy-test-'));
  const reservation = net.createServer();
  await new Promise((resolve) => reservation.listen(0, '127.0.0.1', resolve));
  const port = reservation.address().port;
  await new Promise((resolve) => reservation.close(resolve));
  base = `http://127.0.0.1:${port}`;
  child = spawn(process.execPath, ['server/index.js'], {
    cwd: fileURLToPath(new URL('..', import.meta.url)),
    env: { ...process.env, DATABASE_URL: '', NODE_ENV: 'development', SQLITE_PATH: path.join(directory, 'test.db'),
      PORT: String(port), HOST: '127.0.0.1', SESSION_SECRET: 'temporary-test-secret',
      KAKAO_REST_API_KEY: '', KAKAO_CLIENT_SECRET: '', ENABLE_ECONOMY_DEMO: 'true' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Test server did not start')), 10000);
    child.on('error', reject);
    child.on('exit', (code) => { clearTimeout(timer); reject(new Error(`Test server exited ${code}`)); });
    child.stdout.on('data', (chunk) => { if (String(chunk).includes('Game server running')) { clearTimeout(timer); resolve(); } });
    child.stderr.on('data', () => {});
  });
});
after(async () => {
  if (child && child.exitCode === null && child.signalCode === null) {
    await new Promise((resolve) => { child.once('exit', resolve); child.kill('SIGTERM'); });
  }
  if (directory) await rm(directory, { recursive: true, force: true });
});

test('account economy is persistent, transactional, and isolated from client saves', async () => {
  await request('/api/economy', undefined, 401, '');
  await request('/api/auth/local/register', { loginId: 'wallet_test', password: 'test-only-123', displayNickname: '재화테스트' }, 201, '');
  let response = await request('/api/economy');
  assert.equal(response.state.tokens, 30);
  assert.equal(response.capabilities.demo, true);
  const duplicateId = randomUUID();
  const gifts = await Promise.all(Array.from({ length: 5 }, () => act('claim_daily', { id: duplicateId })));
  assert.ok(gifts.every((item) => item.state.tokens === 54));
  await act('claim_daily', {}, 409);
  await act('complete_run', {}, 403);
  await act('claim_ad', {}, 403);
  await act('purchase', { tokens: 10000 }, 403);

  const entries = await Promise.all(Array.from({ length: 4 }, () => fetch(`${base}/api/economy/actions`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ id: randomUUID(), type: 'start_run', difficulty: 'normal' }),
  })));
  assert.equal(entries.filter((item) => item.status === 200).length, 1);
  assert.equal(entries.filter((item) => item.status === 409).length, 3);
  response = await request('/api/economy');
  assert.equal(response.state.tokens, 46);
  const runId = response.state.activeRun.id;
  response = await act('demo_complete', { runId, outcome: 'won', stars: 3, score: 100 });
  assert.equal(response.state.parts, 5);
  const results = await Promise.all(Array.from({ length: 4 }, () => act('demo_complete', { runId, outcome: 'won', stars: 3, score: 100 })));
  assert.ok(results.every((item) => item.state.parts === 5));
  response = await act('start_run', { difficulty: 'normal' });
  response = await act('demo_complete', { runId: response.state.activeRun.id, outcome: 'lost', stars: 0, score: 20 });
  assert.equal(response.state.parts, 7);
  response = await act('craft_toilet', { toiletLevel: 1 });
  assert.equal(response.state.parts, 1);
  await act('craft_toilet', { toiletLevel: 2 }, 409);
  const save = { gold: 777, toiletLevel: 19, toiletSchemaVersion: 2, poopLevels: [1], selectedPoopId: 0, itemLevels: [0], cosmetics: {} };
  await request('/api/game-save', save, 204);
  const loaded = await request('/api/game-save');
  assert.equal(loaded.save.toiletLevel, 1);
  assert.equal(loaded.save.gold, 777);
  response = await request('/api/economy');
  assert.equal(response.state.toiletLevel, 1);
  assert.equal(response.state.tokens, 38);

  response = await act('reset_progress');
  assert.equal(response.state.tokens, 38);
  assert.equal(response.state.toiletLevel, 0);
  await act('claim_daily', {}, 409);
  // Permanent account idempotency survives the small client-facing recent-action list.
  await Promise.all(Array.from({ length: 105 }, () => act('reset_progress')));
  response = await act('start_run', { id: runId, difficulty: 'normal' });
  assert.equal(response.state.tokens, 38);
  assert.equal(response.state.activeRun, null);
  await act('claim_daily', { id: [] }, 409);
  await request('/api/logout', {}, 204);
  await request('/api/auth/local/login', { loginId: 'wallet_test', password: 'test-only-123' });
  assert.equal((await request('/api/economy')).state.tokens, 38);
  await request('/api/auth/local/register', { loginId: 'wallet_other', password: 'test-only-123', displayNickname: '다른계정' }, 201, '');
  assert.equal((await request('/api/economy')).state.tokens, 30);
});

test('account puzzle validates moves and atomically awards parts once', async () => {
  const { findMove, bankCombo } = await import('../shared/match3.js');
  const { resolvePuzzleMove } = await import('../shared/puzzle.js');
  await request('/api/auth/local/register', { loginId: 'puzzle_test', password: 'test-only-123', displayNickname: '퍼즐테스트' }, 201, '');
  await act('puzzle_start', { difficulty: 'expert' }, 409);
  let response = await act('puzzle_start', { stage: 1, difficulty: 'normal', tokens: 9999 });
  assert.equal(response.capabilities.minigame, true);
  assert.equal(response.state.tokens, 22);
  const runId = response.state.activeRun.id;
  assert.deepEqual((await request('/api/economy')).state.activeRun, response.state.activeRun);
  await act('puzzle_move', { runId, turn: 0, a: 7, b: 8 }, 409);
  await act('demo_complete', { runId, outcome: 'won', stars: 3, score: 9999 }, 409);
  let finalAction;
  for (let i = 0; i < 20; i++) {
    const round = response.state.activeRun.puzzle;
    const [a, b] = findMove(round.board);
    const reward = bankCombo(response.state.comboProgress, resolvePuzzleMove(round, a, b).comboGained);
    const expectedCombos = response.state.wardrobe.combos + resolvePuzzleMove(round, a, b).comboGained;
    const previousParts = response.state.parts;
    finalAction = { id: randomUUID(), runId, turn: round.turn, a, b, parts: 9999, score: 99999, comboGained: 9999, comboProgress: 9 };
    const copies = await Promise.all([act('puzzle_move', finalAction), act('puzzle_move', finalAction)]);
    assert.deepEqual(copies[0].state, copies[1].state);
    response = copies[0];
    assert.equal(response.state.comboProgress, reward.progress);
    assert.equal(response.state.parts, previousParts + reward.parts);
    assert.equal(response.state.wardrobe.combos, expectedCombos);
    if (response.state.activeRun) await act('puzzle_move', { ...finalAction, id: randomUUID() }, 409);
  }
  assert.equal(response.state.totalRuns, 0);
  assert.equal(response.state.activeRun.puzzle.turn, 20);
  assert.equal(response.state.tokens, 22);
  assert.equal(response.state.parts, response.state.activeRun.puzzle.partsEarned);
  assert.ok(response.state.bestScore < 99999);
  const settled = await act('puzzle_move', finalAction);
  assert.deepEqual(settled.state, response.state);
  await request('/api/logout', {}, 204);
  await request('/api/auth/local/login', { loginId: 'puzzle_test', password: 'test-only-123' });
  assert.deepEqual((await request('/api/economy')).state, response.state);
  const earned = response.state.parts;
  const savedCombo = response.state.comboProgress;
  const exitId = randomUUID();
  const exits = await Promise.all([act('puzzle_exit', { id: exitId, runId }), act('puzzle_exit', { id: exitId, runId })]);
  assert.deepEqual(exits[0].state, exits[1].state);
  assert.equal(exits[0].state.parts, earned);
  assert.equal(exits[0].state.totalRuns, 1);
  assert.equal(exits[0].state.activeRun, null);
  await act('puzzle_move', { ...finalAction, id: randomUUID() }, 409);
  response = await act('puzzle_start', { difficulty: 'normal' });
  assert.equal(response.state.tokens, 14);
  assert.equal(response.state.parts, earned);
  assert.equal(response.state.comboProgress, savedCombo);
});


test('development account token grants are fixed, persistent and paid once per action', async () => {
  await request('/api/economy/actions', { id: randomUUID(), type: 'demo_tokens' }, 401, '');
  await request('/api/auth/local/register', { loginId: 'dev_token_test', password: 'test-only-123', displayNickname: '토큰테스트' }, 201, '');
  const id = randomUUID();
  const copies = await Promise.all(Array.from({ length: 4 }, () => act('demo_tokens', { id, amount: 999999 })));
  assert.ok(copies.every((r) => r.state.tokens === 1030));
  assert.ok(copies.every((r) => r.state.lastDailyClaim === null));
  const second = await act('demo_tokens');
  assert.equal(second.state.tokens, 2030);
  await request('/api/logout', {}, 204);
  await request('/api/auth/local/login', { loginId: 'dev_token_test', password: 'test-only-123' });
  assert.equal((await request('/api/economy')).state.tokens, 2030);
});
