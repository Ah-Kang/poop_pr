import { createBoard, playTurn, turnScore, frameCombo, findMatches } from './match3.js';

const total = (target) => ({ kind: 'total', target, label: '그림 모으기' });
const collect = (tile, target, label) => ({ kind: 'tile', tile, target, label });
const dirt = (target) => ({ kind: 'dirt', target, label: '찌든 때 청소' });
export const STAGES = [
  { name: '첫 번째 대청소', moves: 18, goals: [total(30)] },
  { name: '휴지를 부탁해', moves: 18, goals: [collect(3, 12, '휴지')] },
  { name: '반짝이는 하루', moves: 18, goals: [collect(2, 12, '황금똥')] },
  { name: '청소 도구 챙기기', moves: 20, goals: [collect(4, 9, '뚫어뽕'), collect(5, 9, '세정제')] },
  { name: '구석구석 깨끗이', moves: 20, goals: [dirt(6)] },
  { name: '시원한 물청소', moves: 20, goals: [collect(1, 15, '물똥'), total(60)] },
  { name: '청소의 달인', moves: 22, goals: [dirt(8), collect(5, 10, '세정제')] },
  { name: '넉넉한 비품', moves: 20, goals: [collect(3, 15, '휴지'), collect(4, 12, '뚫어뽕')] },
  { name: '반짝반짝 화장실', moves: 22, goals: [dirt(10), collect(2, 12, '황금똥')] },
  { name: '대청소 마무리', moves: 22, goals: [dirt(12), total(90)] },
];
const dirtCells = [27, 28, 35, 36, 19, 44, 26, 37, 20, 43, 18, 45];

export function stageDefinition(number, difficulty = 'normal') {
  if (!Number.isSafeInteger(number) || number < 1) throw new Error('invalid_stage');
  // Repeat tested layouts after stage ten; difficulty never grows without a bound.
  const index = number <= 10 ? number - 1 : 3 + ((number - 11) % 7);
  const stage = STAGES[index];
  return { ...stage, number, name: number > 10 ? `반복 도전 ${number - 10} · ${stage.name}` : stage.name,
    moves: stage.moves - (difficulty === 'expert' ? 4 : difficulty === 'hard' ? 2 : 0),
    goals: stage.goals.map((goal) => ({ ...goal })) };
}

export function seededRandom(seed) {
  let state = seed >>> 0;
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
  random.state = () => state;
  return random;
}

export function createPuzzle(number, difficulty, seed = Math.floor(Math.random() * 2 ** 32)) {
  const stage = stageDefinition(number, difficulty);
  const random = seededRandom(seed);
  const board = createBoard(random);
  return { stage: number, difficulty, board, seed: random.state(), moves: stage.moves, turn: 0,
    score: 0, cleared: 0, collected: Array(6).fill(0), cleaned: 0,
    dirt: dirtCells.slice(0, stage.goals.find((goal) => goal.kind === 'dirt')?.target || 0),
    bestChain: 0, status: 'playing', stars: 0, bonus: 0 };
}

export const goalProgress = (round, goal) => goal.kind === 'total' ? round.cleared
  : goal.kind === 'dirt' ? round.cleaned : round.collected[goal.tile];

export function resolvePuzzleMove(round, a, b) {
  if (round.status !== 'playing' || (round.mode !== 'combo' && round.moves <= 0)) return null;
  const random = seededRandom(round.seed);
  const result = playTurn(round.board, a, b, random);
  if (!result) return null;
  const collected = [...round.collected];
  const dirty = new Set(round.dirt);
  for (const frame of result.frames) for (const index of frame.removed) {
    collected[frame.board[index]]++;
    dirty.delete(index);
  }
  const next = { ...round, board: result.board, seed: random.state(), moves: round.moves - 1,
    turn: round.turn + 1, score: round.score + turnScore(result), collected,
    cleared: round.cleared + result.cleared, dirt: [...dirty],
    cleaned: round.cleaned + round.dirt.length - dirty.size,
    bestChain: Math.max(round.bestChain, result.chains) };
  if (round.mode === 'combo') {
    const multiplier = round.difficulty === 'expert' ? 3 : round.difficulty === 'hard' ? 2 : 1;
    const comboGained = result.frames.reduce((sum, frame, index) => sum + frameCombo(frame, index + 1), 0) * multiplier;
    next.moves = null;
    return { round: next, frames: result.frames, shuffled: result.shuffled, comboGained };
  }
  const stage = stageDefinition(round.stage, round.difficulty);
  if (stage.goals.every((goal) => goalProgress(next, goal) >= goal.target)) {
    next.status = 'won';
    next.bonus = next.moves * 30;
    next.score += next.bonus;
    next.stars = next.score >= 1200 ? 3 : next.score >= 800 ? 2 : 1;
  } else if (!next.moves) next.status = 'lost';
  return { round: next, frames: result.frames, shuffled: result.shuffled };
}

// Existing paid rounds convert without another entry fee or a completion payout.
export function asComboPuzzle(round) {
  if (round.mode === 'combo') return round;
  const random = seededRandom(round.seed);
  const board = findMatches(round.board).length ? createBoard(random) : round.board;
  return { ...round, mode: 'combo', board, seed: random.state(), moves: null,
    status: 'playing', dirt: [], partsEarned: 0, stars: 0, bonus: 0 };
}
export function createComboPuzzle(difficulty, seed) {
  return asComboPuzzle(createPuzzle(1, difficulty, seed));
}
