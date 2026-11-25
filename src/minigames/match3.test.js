import test from 'node:test';
import assert from 'node:assert/strict';
import { SIZE, TYPES, blastMatches, matchPatterns, frameCombo, bankCombo, adjacent, findMatches, collapse, findMove, playTurn, createBoard } from './match3.js';
import { createPuzzle, createComboPuzzle, asComboPuzzle, resolvePuzzleMove, seededRandom, STAGES, stageDefinition, goalProgress } from '../../shared/puzzle.js';
import { applyEconomyAction, createEconomy, migratePuzzleTimer, PUZZLE_DURATION_MS } from '../../shared/economy.js';
import { economyMetrics } from '../../shared/analytics.js';

const action = (type, payload = {}) => ({ id: crypto.randomUUID(), type, ...payload });
test('90-second deadline preserves the last accepted cascade and refuses late rewards', () => {
  const now = 1_800_000_000_000;
  let state = applyEconomyAction(createEconomy(), action('puzzle_start', { difficulty:'normal', endsAt:now+999999 }), {now});
  const runId = state.activeRun.id;
  assert.equal(state.activeRun.endsAt, now + PUZZLE_DURATION_MS);
  state.activeRun.puzzle = createComboPuzzle('normal',5);
  const round = state.activeRun.puzzle, [a,b] = findMove(round.board);
  const prediction = resolvePuzzleMove(round,a,b);
  state = applyEconomyAction(state, action('puzzle_move',{runId,turn:0,a,b}), {now:now+89999});
  assert.equal(state.activeRun.puzzle.score,prediction.round.score);
  assert.equal(state.activeRun.endsAt,now+90000);
  const before = structuredClone(state), move = findMove(state.activeRun.puzzle.board);
  const late = action('puzzle_move',{runId,turn:1,a:move[0],b:move[1],endsAt:now+999999});
  state = applyEconomyAction(state,late,{now:now+90000});
  assert.equal(state.activeRun,null);
  assert.equal(state.lastResult.outcome,'timed_out');
  assert.equal(state.parts,before.parts);
  assert.equal(state.comboProgress,before.comboProgress);
  assert.equal(state.lastResult.score,before.activeRun.puzzle.score);
  assert.equal(state.totalRuns,1);
  assert.deepEqual(economyMetrics(before,state,late),{tokensSpent:0,tokensReceived:0});
  const duplicate = applyEconomyAction(state,action('puzzle_exit',{runId}),{now:now+100000});
  assert.equal(duplicate.totalRuns,1);
  const restarted = applyEconomyAction(duplicate,action('puzzle_start',{difficulty:'normal'}),{now:now+100000});
  assert.equal(restarted.tokens,14);
  assert.equal(restarted.activeRun.endsAt,now+190000);
});
test('old paid puzzles receive one persisted deadline, not a new timer on reload', () => {
  const old = createEconomy();
  old.tokens = 22;
  old.activeRun = {id:'old-paid-puzzle',puzzle:createComboPuzzle('normal',5),startedAt:1};
  const migrated = migratePuzzleTimer(old,1000);
  assert.equal(migrated.activeRun.endsAt,91000);
  assert.equal(migrated.tokens,22);
  assert.equal(old.activeRun.endsAt,undefined);
  const reload = migratePuzzleTimer(JSON.parse(JSON.stringify(migrated)),92000);
  assert.equal(reload.activeRun.endsAt,91000);
  const ended = applyEconomyAction(reload,action('puzzle_exit',{runId:old.activeRun.id}),{now:92000});
  assert.equal(ended.lastResult.outcome,'timed_out');
  assert.equal(ended.tokens,22);
});
test('8×8 boundaries, crossing matches, and gravity preserve the grid', () => {
  assert.equal(SIZE, 8);
  for (const pair of [[7, 8], [0, 9], [-1, 0], [63, 64]]) assert.equal(adjacent(...pair), false);
  assert.ok(adjacent(0, 8)); assert.ok(adjacent(0, 1));
  const cross = Array(64).fill(null);
  for (const index of [19, 27, 35, 26, 28]) cross[index] = 2;
  assert.deepEqual(findMatches(cross).sort((a, b) => a - b), [19, 26, 27, 28, 35]);
  assert.deepEqual(findMatches(Array(64).fill(null)), []);
  const board = Array.from({ length: 64 }, (_, i) => Math.floor(i / SIZE) % TYPES);
  const result = collapse(board, [8, 32], () => .99);
  assert.deepEqual(Array.from({ length: SIZE }, (_, r) => result[r * SIZE]), [5, 5, 0, 2, 3, 5, 0, 1]);
  assert.equal(board[8], 1);
});
test('invalid swaps do not mutate a round or spend a move', () => {
  const round = createPuzzle(1, 'normal', 91);
  const original = structuredClone(round);
  let checked = false;
  for (let i = 0; i < 63; i++) if (adjacent(i, i + 1) && !playTurn(round.board, i, i + 1, seededRandom(31))) {
    assert.equal(resolvePuzzleMove(round, i, i + 1), null); checked = true; break;
  }
  assert.ok(checked); assert.deepEqual(round, original);
});
test('all ten stages and repeat layouts resolve stable, resumable seeded rounds', () => {
  for (let stage = 1; stage <= 17; stage++) for (let seed = 1; seed <= 10; seed++) {
    let round = createPuzzle(stage, 'normal', seed);
    assert.equal(round.board.length, 64);
    assert.deepEqual(findMatches(round.board), []);
    while (round.status === 'playing') {
      const move = findMove(round.board);
      assert.ok(move);
      const result = resolvePuzzleMove(round, ...move);
      assert.deepEqual(result, resolvePuzzleMove(JSON.parse(JSON.stringify(round)), ...move));
      assert.equal(result.round.moves, round.moves - 1);
      assert.ok(result.round.collected.every((n, i) => n >= round.collected[i]));
      assert.deepEqual(findMatches(result.round.board), []);
      assert.ok(findMove(result.round.board));
      round = result.round;
    }
    const met = stageDefinition(stage).goals.every((goal) => goalProgress(round, goal) >= goal.target);
    assert.equal(round.status, met ? 'won' : 'lost');
    assert.equal(round.collected.reduce((a, b) => a + b, 0), round.cleared);
    assert.ok(round.stars >= 0 && round.stars <= 3);
  }
  assert.equal(STAGES.length, 10);
  assert.equal(stageDefinition(11).goals.length, 2);
  assert.equal(stageDefinition(100000).moves, stageDefinition(100000 - 7).moves);
});
test('a final-move goal wins, a missed goal loses, and dirt clears only once', () => {
  let round = createPuzzle(1, 'normal', 8);
  const move = findMove(round.board);
  const won = resolvePuzzleMove({ ...round, moves: 1, cleared: 29 }, ...move).round;
  assert.equal(won.status, 'won'); assert.equal(won.bonus, 0);
  const lost = resolvePuzzleMove({ ...round, stage: 10, moves: 1, dirt: [0], cleaned: 0 }, ...move).round;
  assert.equal(lost.status, 'lost'); assert.equal(lost.stars, 0);
  round = createPuzzle(5, 'normal', 10);
  const nextMove = findMove(round.board);
  const raw = playTurn(round.board, ...nextMove, seededRandom(round.seed));
  const dirty = [...new Set(raw.frames.flatMap((frame) => frame.removed))].slice(0, 3);
  const cleaned = resolvePuzzleMove({ ...round, dirt: dirty }, ...nextMove).round;
  assert.equal(cleaned.cleaned, dirty.length); assert.deepEqual(cleaned.dirt, []);
});
test('combo wallet pays each move once, keeps playing, exits without another reward', () => {
  let state = createEconomy();
  assert.throws(() => applyEconomyAction(state, action('puzzle_start', { difficulty: 'expert' })), /difficulty_locked/);
  const start = action('puzzle_start', { difficulty: 'normal', seed: 0, tokens: 9000 });
  state = applyEconomyAction(state, start);
  assert.equal(state.tokens, 22);
  assert.deepEqual(applyEconomyAction(state, start), state);
  assert.throws(() => applyEconomyAction(state, action('complete_run', { runId: start.id, outcome: 'won', stars: 3, score: 1000 }), { verifiedCompletion: true }), /completion_unavailable/);
  state.activeRun.puzzle = createComboPuzzle('normal', 5);
  let earned = 0;
  for (let i = 0; i < 40; i++) {
    const round = state.activeRun.puzzle;
    const [a, b] = findMove(round.board);
    const prediction = resolvePuzzleMove(round, a, b);
    const banked = bankCombo(state.comboProgress, prediction.comboGained);
    earned += banked.parts;
    const move = action('puzzle_move', { runId: start.id, turn: round.turn, a, b, score: 999999, parts: 10000 });
    state = applyEconomyAction(state, move);
    assert.equal(state.parts, earned);
    assert.equal(state.comboProgress, banked.progress);
    assert.equal(state.activeRun.puzzle.partsEarned, earned);
    assert.deepEqual(applyEconomyAction(state, move), state);
    assert.throws(() => applyEconomyAction(state, { ...move, id: crypto.randomUUID() }), /stale_turn/);
    assert.equal(state.activeRun.puzzle.status, 'playing');
    assert.equal(state.activeRun.puzzle.moves, null);
    assert.deepEqual(findMatches(state.activeRun.puzzle.board), []);
  }
  assert.ok(earned > 0); assert.equal(state.tokens, 22);
  const exit = action('puzzle_exit', { runId: start.id, parts: 99999 });
  state = applyEconomyAction(state, exit);
  assert.equal(state.parts, earned); assert.equal(state.totalRuns, 1);
  assert.equal(state.activeRun, null); assert.equal(state.lastResult.parts, earned);
  assert.deepEqual(applyEconomyAction(state, exit), state);
  const reentry = applyEconomyAction(state, action('puzzle_start', { difficulty: 'normal' }));
  assert.equal(reentry.tokens, 14); assert.equal(reentry.parts, earned);
  assert.equal(reentry.activeRun.puzzle.partsEarned, 0);
  assert.equal(reentry.comboProgress, state.comboProgress);
});
test('legacy common wallets gain stages without receiving a second starter gift', () => {
  const old = createEconomy(); delete old.nextStage; delete old.stageStars; old.tokens = 8;
  const next = applyEconomyAction(old, action('puzzle_start', { stage: 1, difficulty: 'normal' }));
  assert.equal(next.tokens, 0); assert.equal(next.activeRun.puzzle.board.length, 64);
  const reset = applyEconomyAction(next, action('reset_progress'));
  assert.equal(reset.tokens, 0); assert.equal(reset.nextStage, 1); assert.deepEqual(reset.stageStars, {});
});

const shapeBoard = (cells) => { const board = Array(64).fill(null); for (const cell of cells) board[cell] = 2; return board; };
test('lines, squares and all four elbow orientations detect distinct blast shapes', () => {
  for (const [cells, kind, parts] of [
    [[25,26,27,28], 'line', 1], [[11,19,27,35,43], 'color', 3],
    [[27,28,35,36], 'square2', 2], [[18,19,20,26,27,28,34,35,36], 'square3', 5],
    [[27,28,29,35,43], 'elbow', 2], [[27,26,25,35,43], 'elbow', 2],
    [[27,28,29,19,11], 'elbow', 2], [[27,26,25,19,11], 'elbow', 2],
  ]) {
    const patterns = matchPatterns(shapeBoard(cells));
    assert.equal(patterns.length, 1); assert.equal(patterns[0].kind, kind);
    assert.equal(frameCombo(blastMatches(shapeBoard(cells)), 1), parts + 1);
    assert.deepEqual(findMatches(shapeBoard(cells)).sort((a,b) => a-b), [...cells].sort((a,b) => a-b));
  }
  assert.deepEqual(findMatches(shapeBoard([7,8,15,16])), []); // no row wrapping
  assert.deepEqual(findMatches(shapeBoard([27,28,35])), []); // short elbow isn't five tiles
});
test('blast ranges include neighbors, color sweep, deduplicate overlaps and clamp edges', () => {
  const base = Array.from({ length: 64 }, (_, i) => (Math.floor(i / 8) * 2 + i % 8) % 6);
  const board = (cells) => { const copy = [...base]; cells.forEach((cell) => { copy[cell] = 9; }); return copy; };
  const line = blastMatches(board([25,26,27,28]));
  assert.deepEqual(line.removed.sort((a,b) => a-b), [24,25,26,27,28,29,30,31]);
  const square = blastMatches(board([27,28,35,36]));
  assert.equal(square.removed.length, 16);
  const large = blastMatches(board([18,19,20,26,27,28,34,35,36]));
  assert.equal(large.removed.length, 25);
  assert.equal(large.effects.length, 1);
  const corner = blastMatches(board([0,1,8,9])); assert.equal(corner.removed.length, 9);
  const color = blastMatches(board([10,11,12,13,14,61])); assert.ok(color.removed.includes(61));
  const elbow = blastMatches(board([27,28,29,35,43]));
  assert.ok([18,19,20,26,27,28,34,35,36,29,43].every((cell) => elbow.removed.includes(cell)));
  assert.equal(frameCombo(large, 1), 6); assert.equal(frameCombo(large, 2), 7);
  assert.equal(frameCombo(large, 9), 9);
});
test('saved paid stage upgrades to combo mode without charging tokens or paying old goals', () => {
  const state = createEconomy(); state.tokens = 3;
  state.activeRun = { id: 'legacy-run', difficulty: 'normal', puzzle: createPuzzle(1, 'normal', 22) };
  const before = asComboPuzzle(state.activeRun.puzzle);
  const move = findMove(before.board);
  const expected = resolvePuzzleMove(before, ...move);
  const next = applyEconomyAction(state, action('puzzle_move', { runId: 'legacy-run', turn: before.turn, a: move[0], b: move[1] }));
  assert.equal(next.tokens, 3); assert.equal(next.parts, Math.floor(expected.comboGained / 10));
  assert.equal(next.activeRun.puzzle.mode, 'combo'); assert.equal(next.totalRuns, 0);
  assert.deepEqual(next.activeRun.puzzle, { ...expected.round, partsEarned: next.parts });
});

test('combo milestones preserve overflow and bank multiple parts from a big chain', () => {
  assert.deepEqual(bankCombo(0, 1), { parts: 0, progress: 1 });
  assert.deepEqual(bankCombo(8, 1), { parts: 0, progress: 9 });
  assert.deepEqual(bankCombo(9, 1), { parts: 1, progress: 0 });
  assert.deepEqual(bankCombo(8, 27), { parts: 3, progress: 5 });
  assert.equal(frameCombo({ effects: [] }, 1), 1);
  assert.equal(frameCombo({ effects: [] }, 2), 2);
});
test('legacy wallets start at zero combo, invalid swaps and exit keep accumulated combo', () => {
  let state = createEconomy(); delete state.comboProgress;
  state = applyEconomyAction(state, action('puzzle_start', { difficulty: 'normal' }));
  state.activeRun.puzzle = createComboPuzzle('normal', 5);
  const round = state.activeRun.puzzle;
  const [a,b] = findMove(round.board);
  const move = action('puzzle_move', { runId: state.activeRun.id, turn: round.turn, a,b, comboProgress: 999, comboGained: 9999 });
  const expected = bankCombo(0, resolvePuzzleMove(round,a,b).comboGained);
  state = applyEconomyAction(state, move);
  assert.equal(state.comboProgress, expected.progress);
  assert.equal(state.parts, expected.parts);
  assert.deepEqual(applyEconomyAction(state, move), state);
  const original = structuredClone(state);
  assert.throws(() => applyEconomyAction(state, action('puzzle_move', { runId: state.activeRun.id, turn: state.activeRun.puzzle.turn, a: 7, b: 8 })), /invalid_move/);
  assert.deepEqual(state, original);
  const exited = applyEconomyAction(state, action('puzzle_exit', { runId: state.activeRun.id }));
  assert.equal(exited.comboProgress, state.comboProgress);
  assert.equal(exited.parts, state.parts);
  assert.equal(applyEconomyAction(exited, action('reset_progress')).comboProgress, 0);
  assert.throws(() => applyEconomyAction({ ...state, comboProgress: 10 }, action('claim_daily')), /invalid_wallet/);
});
