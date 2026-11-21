import { COMBO_TARGET, bankCombo } from './match3.js';
import { createComboPuzzle, asComboPuzzle, resolvePuzzleMove } from './puzzle.js';
// Shared rules for guest play, the account API, and minigame adapters.
export const ECONOMY_VERSION = 1;
export const STARTER_TOKENS = 30;
export const DEV_TOKEN_GRANT = 1000;
export const developmentEconomyEnabled = (mode, flag) => mode === 'development' && flag === 'true';
export const ENTRY_COST = 8;
export const DAILY_TOKENS = 24;
export const AD_TOKENS = 24;
export const DAILY_AD_LIMIT = 3;
export const TOILET_COSTS = [0, 6, 10, 16, 24, 34, 46, 62, 82, 106, 136, 172, 216, 270, 336, 416, 512, 628, 766, 930];
export const DIFFICULTIES = [
  { id: 'normal', name: '일반', requiredToilet: 0, multiplier: 1 },
  { id: 'hard', name: '어려움', requiredToilet: 5, multiplier: 2 },
  { id: 'expert', name: '전문가', requiredToilet: 12, multiplier: 3 },
];
export class EconomyError extends Error {
  constructor(code) { super(code); this.code = code; }
}
const fail = (code) => { throw new EconomyError(code); };
export const koreaDay = (now = Date.now()) => new Date(now + 9 * 3600000).toISOString().slice(0, 10);
export const renovationCost = (level) => 200 + level * 100;
export const renovationMultiplier = (level) => 1 + level * 0.05;
export const migrateToiletLevel = (level = 0, schemaVersion = 2) => {
  const legacy = [1, 3, 7, 9, 13, 19];
  const n = Math.max(0, Math.floor(Number(level) || 0));
  return Math.min(TOILET_COSTS.length - 1, schemaVersion < 2 ? (legacy[n] ?? n) : n);
};
export const createEconomy = (toiletLevel = 0) => ({
  version: ECONOMY_VERSION, tokens: STARTER_TOKENS, parts: 0, comboProgress: 0,
  toiletLevel: migrateToiletLevel(toiletLevel), renovationLevel: 0,
  lastDailyClaim: null, adDay: null, adClaims: 0,
  totalRuns: 0, bestScore: 0, activeRun: null, lastResult: null, recentActions: [],
  nextStage: 1, stageStars: {},
});

export function validateEconomy(value) {
  if (!value || value.version !== ECONOMY_VERSION) fail('invalid_wallet');
  for (const key of ['tokens', 'parts', 'toiletLevel', 'renovationLevel', 'adClaims', 'totalRuns', 'bestScore']) {
    if (!Number.isSafeInteger(value[key]) || value[key] < 0) fail('invalid_wallet');
  }
  if (value.comboProgress !== undefined && (!Number.isSafeInteger(value.comboProgress) || value.comboProgress < 0 || value.comboProgress >= COMBO_TARGET)) fail('invalid_wallet');
  if (value.toiletLevel >= TOILET_COSTS.length || !Array.isArray(value.recentActions)) fail('invalid_wallet');
  return value;
}

// The host verifies completion. Raw client scores must never grant production rewards.
export function completionReward({ outcome, stars = 0 }, difficulty = 'normal') {
  if (!['won', 'lost'].includes(outcome) || !Number.isInteger(stars) || stars < 0 || stars > 3) fail('invalid_result');
  const tier = DIFFICULTIES.find((item) => item.id === difficulty);
  if (!tier) fail('invalid_difficulty');
  return (outcome === 'won' ? 2 + Math.max(1, stars) : 2) * tier.multiplier;
}

export function applyEconomyAction(previous, action, { now = Date.now(), allowDemo = false, verifiedCompletion = false, verifiedAd = false } = {}) {
  validateEconomy(previous);
  if (!action || typeof action.id !== 'string' || !/^[\w-]{8,80}$/.test(action.id)) fail('invalid_action_id');
  if (previous.recentActions.includes(action.id)) return previous;
  const next = structuredClone(previous);
  const day = koreaDay(now);
  switch (action.type) {
    case 'demo_tokens':
      if (!allowDemo) fail('integration_not_ready');
      next.tokens += DEV_TOKEN_GRANT;
      break;
    case 'puzzle_start': {
      if (next.activeRun) fail('run_in_progress');
      const tier = DIFFICULTIES.find((item) => item.id === action.difficulty);
      if (!tier || next.toiletLevel < tier.requiredToilet) fail('difficulty_locked');
      if (next.tokens < ENTRY_COST) fail('not_enough_tokens');
      next.tokens -= ENTRY_COST;
      next.activeRun = { id: action.id, difficulty: tier.id, startedAt: now,
        puzzle: createComboPuzzle(tier.id) };
      break;
    }
    case 'puzzle_move': {
      const run = next.activeRun;
      if (!run?.puzzle || run.id !== action.runId) fail('run_not_found');
      if (action.turn !== run.puzzle.turn) fail('stale_turn');
      const resolved = resolvePuzzleMove(asComboPuzzle(run.puzzle), action.a, action.b);
      if (!resolved) fail('invalid_move');
      run.puzzle = resolved.round;
      const reward = bankCombo(next.comboProgress ?? 0, resolved.comboGained);
      next.comboProgress = reward.progress;
      next.parts += reward.parts;
      run.puzzle.partsEarned = (run.puzzle.partsEarned || 0) + reward.parts;
      next.bestScore = Math.max(next.bestScore, run.puzzle.score);
      break;
    }
    case 'puzzle_exit': {
      const run = next.activeRun;
      if (!run?.puzzle || run.id !== action.runId) fail('run_not_found');
      const round = asComboPuzzle(run.puzzle);
      next.totalRuns++;
      next.lastResult = { runId: run.id, parts: round.partsEarned, outcome: 'ended', score: round.score };
      next.activeRun = null;
      break;
    }
    case 'claim_daily':
      if (next.lastDailyClaim && next.lastDailyClaim >= day) fail('daily_already_claimed');
      next.tokens += DAILY_TOKENS;
      next.lastDailyClaim = day;
      break;
    case 'claim_ad':
    case 'demo_ad':
      if (!(action.type === 'demo_ad' && allowDemo) && !(action.type === 'claim_ad' && verifiedAd)) fail('ads_unavailable');
      if (next.adDay === day && next.adClaims >= DAILY_AD_LIMIT) fail('ad_limit_reached');
      next.adClaims = next.adDay === day ? next.adClaims + 1 : 1;
      next.adDay = day;
      next.tokens += AD_TOKENS;
      break;
    case 'start_run': {
      if (next.activeRun) fail('run_in_progress');
      const tier = DIFFICULTIES.find((item) => item.id === action.difficulty);
      if (!tier || next.toiletLevel < tier.requiredToilet) fail('difficulty_locked');
      if (next.tokens < ENTRY_COST) fail('not_enough_tokens');
      next.tokens -= ENTRY_COST;
      next.activeRun = { id: action.id, difficulty: tier.id, startedAt: now };
      break;
    }
    case 'complete_run':
    case 'demo_complete': {
      if (!(action.type === 'demo_complete' && allowDemo) && !(action.type === 'complete_run' && verifiedCompletion)) fail('completion_unavailable');
      if (next.lastResult?.runId === action.runId) return previous;
      if (!next.activeRun || next.activeRun.id !== action.runId) fail('run_not_found');
      if (next.activeRun.puzzle) fail('completion_unavailable');
      if (!Number.isSafeInteger(action.score) || action.score < 0 || action.score > 1000000) fail('invalid_result');
      const reward = completionReward(action, next.activeRun.difficulty);
      next.parts += reward;
      next.totalRuns += 1;
      next.bestScore = Math.max(next.bestScore, action.score);
      next.lastResult = { runId: action.runId, parts: reward, outcome: action.outcome, score: action.score };
      next.activeRun = null;
      break;
    }
    case 'abandon_run':
      if (!next.activeRun || next.activeRun.id !== action.runId) fail('run_not_found');
      next.activeRun = null;
      break;
    case 'craft_toilet': {
      if (action.toiletLevel !== next.toiletLevel + 1 || action.toiletLevel >= TOILET_COSTS.length) fail('previous_toilet_required');
      const cost = TOILET_COSTS[action.toiletLevel];
      if (next.parts < cost) fail('not_enough_parts');
      next.parts -= cost;
      next.toiletLevel = action.toiletLevel;
      break;
    }
    case 'renovate': {
      if (next.toiletLevel !== TOILET_COSTS.length - 1) fail('final_toilet_required');
      const cost = renovationCost(next.renovationLevel);
      if (next.parts < cost) fail('not_enough_parts');
      next.parts -= cost;
      next.renovationLevel += 1;
      break;
    }
    case 'reset_progress':
      // Resetting the game must never regrant welcome/daily/ad rewards.
      next.parts = 0;
      next.comboProgress = 0;
      next.toiletLevel = 0;
      next.renovationLevel = 0;
      next.activeRun = null;
      next.lastResult = null;
      next.nextStage = 1;
      next.stageStars = {};
      break;
    default: fail('unknown_action');
  }
  next.recentActions = [...next.recentActions, action.id].slice(-100);
  return validateEconomy(next);
}
