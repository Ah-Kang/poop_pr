import { SIZE, TYPES, MOVE_LIMIT, POINTS_PER_TILE, findMatches, findMove } from './match3.js';

export const SAVE_KEY = 'poop-pr-toilet-puzzle-v1';
export const freshSave = () => ({ version: 2, tokens: 24, parts: 0, wins: 0, bestScore: 0, round: null });
const count = (n) => Number.isSafeInteger(n) && n >= 0;

export function normalizeSave(value) {
  if (![1, 2].includes(value?.version) || !count(value.tokens)
    || !count(value.parts) || !count(value.wins)) return freshSave();
  const next = { ...value, version: 2, bestScore: count(value.bestScore) ? value.bestScore : 0 };
  if (!value.round) return { ...next, round: null };
  const round = { ...value.round };
  if (value.version === 1) {
    // Keep paid entries and earned rewards. Old completed rounds are never paid again.
    round.score = round.cleared * POINTS_PER_TILE;
    if (['won', 'lost'].includes(round.status)) round.status = 'finished';
    round.isNewBest = false;
  }
  if (!Array.isArray(round.board) || round.board.length !== SIZE * SIZE
    || !round.board.every((n) => Number.isInteger(n) && n >= 0 && n < TYPES)
    || !count(round.moves) || round.moves > MOVE_LIMIT || !count(round.cleared)
    || !count(round.bestChain) || !count(round.reward) || !count(round.score)
    || !['playing', 'finished'].includes(round.status)
    || findMatches(round.board).length
    || (round.status === 'playing' && (!round.moves || !findMove(round.board)))) {
    return { ...next, round: null };
  }
  return { ...next, round, bestScore: round.status === 'finished'
    ? Math.max(next.bestScore, round.score) : next.bestScore };
}
