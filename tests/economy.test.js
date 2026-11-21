import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { applyEconomyAction, createEconomy, developmentEconomyEnabled, koreaDay, migrateToiletLevel, renovationCost, renovationMultiplier } from '../shared/economy.js';

const now = Date.parse('2026-09-21T12:00:00Z');
const apply = (state, type, payload = {}, options = {}) => applyEconomyAction(state,
  { id: randomUUID(), type, ...payload }, { now, ...options });
const start = (state) => apply(state, 'start_run', { difficulty: 'normal' });
const complete = (state, outcome = 'won') => apply(state, 'complete_run', {
  runId: state.activeRun.id, outcome, stars: outcome === 'won' ? 3 : 0, score: 100,
}, { verifiedCompletion: true });

test('welcome balance and existing toilet migration', () => {
  assert.equal(createEconomy().tokens, 30);
  assert.equal(createEconomy(12).toiletLevel, 12);
  assert.equal(migrateToiletLevel(5, 1), 19);
  assert.equal(migrateToiletLevel(0, 2), 0);
});
test('daily gift is once per Korea date, including midnight boundary', () => {
  const before = Date.parse('2026-09-21T14:59:59Z');
  let state = apply(createEconomy(), 'claim_daily', {}, { now: before });
  assert.equal(state.tokens, 54);
  assert.throws(() => apply(state, 'claim_daily', {}, { now: before }), /daily_already_claimed/);
  assert.throws(() => apply(state, 'claim_daily', {}, { now: before - 86400000 }), /daily_already_claimed/);
  state = apply(state, 'claim_daily', {}, { now: before + 1000 });
  assert.equal(state.tokens, 78);
  assert.equal(koreaDay(before + 1000), '2026-09-22');
});
test('paid entry, duplicate entry, reload/resume and insufficient funds', () => {
  const action = { id: randomUUID(), type: 'start_run', difficulty: 'normal' };
  let state = applyEconomyAction(createEconomy(), action, { now });
  assert.equal(state.tokens, 22);
  assert.deepEqual(applyEconomyAction(state, action), state);
  assert.equal(JSON.parse(JSON.stringify(state)).activeRun.id, action.id);
  assert.throws(() => start(state), /run_in_progress/);
  state = complete(state);
  state = complete(start(state));
  state = complete(start(state));
  assert.equal(state.tokens, 6);
  assert.throws(() => start(state), /not_enough_tokens/);
});
test('normal failure grants 2; successful result is capped and paid once', () => {
  let state = start(createEconomy());
  const firstRun = state.activeRun.id;
  state = complete(state, 'lost');
  assert.equal(state.parts, 2);
  assert.equal(state.totalRuns, 1);
  const duplicate = apply(state, 'complete_run', { runId: firstRun, outcome: 'won', stars: 3, score: 900 }, { verifiedCompletion: true });
  assert.deepEqual(duplicate, state);
  state = start(state);
  assert.throws(() => apply(state, 'complete_run', { runId: state.activeRun.id, outcome: 'won', stars: 99, score: 0 }, { verifiedCompletion: true }), /invalid_result/);
  state = complete(state);
  assert.equal(state.parts, 7);
});
test('unverified completion and ad rewards cannot mint tokens or parts', () => {
  const state = start(createEconomy());
  assert.throws(() => apply(state, 'complete_run', { runId: state.activeRun.id, outcome: 'won', stars: 3, score: 0 }), /completion_unavailable/);
  assert.throws(() => apply(state, 'demo_complete', {}), /completion_unavailable/);
  assert.throws(() => apply(state, 'demo_ad'), /ads_unavailable/);
  assert.throws(() => apply(state, 'claim_ad'), /ads_unavailable/);
});
test('ad demo is explicit, limited, and resets by Korea date', () => {
  let state = createEconomy();
  for (let i = 0; i < 3; i++) state = apply(state, 'demo_ad', {}, { allowDemo: true });
  assert.equal(state.tokens, 102);
  assert.throws(() => apply(state, 'demo_ad', {}, { allowDemo: true }), /ad_limit_reached/);
  state = apply(state, 'demo_ad', {}, { allowDemo: true, now: now + 86400000 });
  assert.equal(state.tokens, 126);
  assert.equal(state.adClaims, 1);
});
test('toilets consume parts in order; tokens are not construction currency', () => {
  let state = { ...createEconomy(), parts: 16 };
  assert.throws(() => apply(state, 'craft_toilet', { toiletLevel: 2 }), /previous_toilet_required/);
  state = apply(state, 'craft_toilet', { toiletLevel: 1 });
  assert.equal(state.parts, 10);
  assert.equal(state.tokens, 30);
  assert.throws(() => apply(state, 'craft_toilet', { toiletLevel: 1 }), /previous_toilet_required/);
  state = apply(state, 'craft_toilet', { toiletLevel: 2 });
  assert.equal(state.parts, 0);
  assert.throws(() => apply(state, 'craft_toilet', { toiletLevel: 3 }), /not_enough_parts/);
});
test('difficulty unlocks and endless renovation are driven by toilet progression', () => {
  assert.throws(() => apply(createEconomy(), 'start_run', { difficulty: 'hard' }), /difficulty_locked/);
  let state = apply(createEconomy(5), 'start_run', { difficulty: 'hard' });
  state = complete(state);
  assert.equal(state.parts, 10);
  assert.throws(() => apply(state, 'renovate'), /final_toilet_required/);
  state = apply({ ...createEconomy(19), parts: 500 }, 'renovate');
  assert.equal(state.parts, 300);
  assert.equal(renovationCost(state.renovationLevel), 300);
  state = apply(state, 'renovate');
  assert.equal(state.renovationLevel, 2);
  assert.equal(renovationMultiplier(2), 1.1);
});
test('reset preserves token balance and claim history, never regrants welcome reward', () => {
  let state = apply(createEconomy(19), 'claim_daily');
  state = apply(state, 'demo_ad', {}, { allowDemo: true });
  state = start(state);
  const tokens = state.tokens;
  state = apply(state, 'reset_progress');
  assert.equal(state.tokens, tokens);
  assert.equal(state.toiletLevel, 0);
  assert.equal(state.parts, 0);
  assert.equal(state.activeRun, null);
  assert.equal(state.adClaims, 1);
  assert.throws(() => apply(state, 'claim_daily'), /daily_already_claimed/);
});
test('invalid action and non-finite balances are rejected', () => {
  assert.throws(() => applyEconomyAction(createEconomy(), { type: 'claim_daily' }), /invalid_action_id/);
  assert.throws(() => apply({ ...createEconomy(), tokens: Infinity }, 'claim_daily'), /invalid_wallet/);
});


test('test tokens require development mode and explicit enablement, preserve progress, and deduplicate', () => {
  for (const mode of ['production', 'test', undefined]) {
    const allowDemo = developmentEconomyEnabled(mode, 'true');
    assert.equal(allowDemo, false);
    assert.throws(() => apply(createEconomy(), 'demo_tokens', {}, { allowDemo }), /integration_not_ready/);
  }
  assert.equal(developmentEconomyEnabled('development', 'false'), false);
  assert.equal(developmentEconomyEnabled('development', undefined), false);
  assert.throws(() => apply(createEconomy(), 'demo_tokens'), /integration_not_ready/);
  const initial = start(apply(createEconomy(), 'claim_daily'));
  const grant = { id: randomUUID(), type: 'demo_tokens', amount: 999999, tokens: 999999 };
  const options = { allowDemo: developmentEconomyEnabled('development', 'true') };
  const received = applyEconomyAction(initial, grant, options);
  assert.equal(received.tokens, initial.tokens + 1000);
  assert.deepEqual(received.activeRun, initial.activeRun);
  assert.equal(received.lastDailyClaim, initial.lastDailyClaim);
  assert.equal(received.parts, initial.parts);
  assert.deepEqual(applyEconomyAction(received, grant, options), received);
  assert.equal(apply(received, 'demo_tokens', {}, options).tokens, initial.tokens + 2000);
  assert.equal(createEconomy().tokens, 30);
});
