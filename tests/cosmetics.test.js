import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { normalizeCosmetics, defaultCosmetics } from '../shared/cosmetics.js';
import vm from 'node:vm';

test('legacy saves retain title and accessories; invalid skin values cannot enter URLs', () => {
  assert.deepEqual(normalizeCosmetics(null),defaultCosmetics);
  assert.deepEqual(normalizeCosmetics({hat:'crown',title:'테스트',material:'../../secret',expression:'bad',outfit:7}), {...defaultCosmetics,hat:'crown',titleText:'테스트'});
  const equipped={...defaultCosmetics,material:'mint',expression:'wink',outfit:'royal'};
  assert.deepEqual(normalizeCosmetics(JSON.parse(JSON.stringify(equipped))),equipped);
});

test('all 540 combinations have distinct deployable hashed WebP images and thumbnails', () => {
  const rows=JSON.parse(readFileSync(new URL('../src/cosmetics/skin-catalog.json',import.meta.url)));
  assert.equal(rows.length,540);
  assert.equal(new Set(rows.map(x=>`${x.characterId}/${x.material}/${x.expression}/${x.outfit}`)).size,540);
  for(const item of rows) {
    for(const field of ['image','thumb']) {
      assert.match(item[field],/^\/skins\/[a-z0-9_.-]+\.[a-f0-9]{16}\.webp$/);
      assert.ok(existsSync(new URL('../public'+item[field],import.meta.url)));
    }
    assert.ok(item.bounds.width>0 && item.bounds.height>0);
    assert.ok(Math.max(item.bounds.canvasWidth,item.bounds.canvasHeight)<=512);
  }
});

test('skin cache avoids repeat requests, separates updated URLs and does not cache failures', async () => {
  const stores=new Map(), listeners={}; let requests=0,fail=false;
  const cacheFor=name=>{if(!stores.has(name)) stores.set(name,new Map());const data=stores.get(name);const key=r=>typeof r==='string'?r:r.url;return {match:async r=>data.get(key(r))?.clone(),put:async(r,v)=>data.set(key(r),v),keys:async()=>[...data.keys()],delete:async r=>data.delete(key(r)),addAll:async()=>{}};};
  const context=vm.createContext({URL,Promise,Map,Response, self:{location:{origin:'https://game.test'},addEventListener:(name,fn)=>listeners[name]=fn,skipWaiting(){},clients:{claim(){}}},caches:{open:async name=>cacheFor(name),keys:async()=>[...stores.keys()],delete:async name=>stores.delete(name)},fetch:async()=>{requests++;return new Response('webp',{status:fail?404:200,headers:{'content-type':'image/webp'}});}});
  vm.runInContext(readFileSync(new URL('../public/sw.js',import.meta.url),'utf8'),context);
  const request=async filename=>{let response;listeners.fetch({request:{method:'GET',url:'https://game.test/skins/'+filename},respondWith:p=>response=p});return response;};
  const name='skin.image.0123456789abcdef.webp';
  assert.equal(requests,0);
  await Promise.all([request(name),request(name)]);assert.equal(requests,1);
  await request(name);assert.equal(requests,1);
  await request('skin.image.1123456789abcdef.webp');assert.equal(requests,2);
  let activation;listeners.activate({waitUntil:p=>activation=p});await activation;
  await request(name);assert.equal(requests,2);
  fail=true;
  await request('skin.image.2123456789abcdef.webp');await request('skin.image.2123456789abcdef.webp');assert.equal(requests,4);
});

import { updateWardrobe, getWardrobeRewards, availableCosmetics } from '../shared/wardrobe.js';
import { createEconomy, applyEconomyAction } from '../shared/economy.js';
import { createComboPuzzle, resolvePuzzleMove } from '../shared/puzzle.js';
import { findMove } from '../shared/match3.js';

test('visits count Korea calendar days, not reloads or consecutive attendance', () => {
  const now = Date.parse('2026-11-23T14:59:59Z');
  let state = updateWardrobe(createEconomy(), { now });
  assert.equal(state.wardrobe.visits, 1);
  assert.equal(updateWardrobe(state, { now }), state);
  state = updateWardrobe(state, { now: now + 1000 });
  assert.equal(state.wardrobe.visits, 2);
  state = updateWardrobe(state, { now: now - 86400000 });
  assert.equal(state.wardrobe.visits, 2);
  assert.equal(getWardrobeRewards(state).find(r => r.value === 'sleepy').unlocked, false);
  state = updateWardrobe(state, { now: now + 7 * 86400000 });
  assert.equal(getWardrobeRewards(state).find(r => r.value === 'sleepy').unlocked, true);
});

test('legacy discoveries and toilets unlock styles globally, without granting unknown combo history', () => {
  const state = updateWardrobe({ ...createEconomy(3), parts: 9999, bestScore: 99999 }, { poopLevels: [1, 1, 1, 1, 1] });
  const rewards = getWardrobeRewards(state);
  assert.deepEqual(rewards.filter(r => r.unlocked).map(r => r.value), ['wink', 'berry', 'royal']);
  assert.deepEqual(availableCosmetics({ material: 'mint', expression: 'sleepy', outfit: 'royal' }, rewards), { ...defaultCosmetics, outfit: 'royal' });
  const reset = applyEconomyAction(state, { id: 'reset-wardrobe-test', type: 'reset_progress' });
  assert.deepEqual(getWardrobeRewards(reset, [1]).filter(r => r.unlocked).map(r => r.value), ['wink', 'berry', 'royal']);
});

test('validated puzzle combos grant permanent unlocks once and cannot be supplied by clients', () => {
  let state = updateWardrobe(createEconomy());
  state.activeRun = { id: 'wardrobe-puzzle', difficulty: 'normal', puzzle: createComboPuzzle('normal', 42) };
  let expected = 0;
  for (let turn = 0; turn < 50 && expected < 30; turn++) {
    const round = state.activeRun.puzzle;
    const [a, b] = findMove(round.board);
    expected += resolvePuzzleMove(round, a, b).comboGained;
    const action = { id: `wardrobe-move-${turn}`, type: 'puzzle_move', runId: state.activeRun.id, turn, a, b, combos: 99999, wardrobe: { combos: 99999 } };
    state = applyEconomyAction(state, action);
    assert.equal(state.wardrobe.combos, expected);
    assert.equal(applyEconomyAction(state, action), state);
  }
  assert.ok(expected >= 30);
  assert.ok(getWardrobeRewards(state).find(r => r.value === 'ribbon').unlocked);
  assert.ok(getWardrobeRewards(state).find(r => r.value === 'mint').unlocked);
  const reset = applyEconomyAction(state, { id: 'wardrobe-reset-puzzle', type: 'reset_progress' });
  assert.equal(reset.wardrobe.combos, expected);
});

test('new players only equip defaults; actual upgrades accumulate across resets', () => {
  let state = updateWardrobe(createEconomy());
  assert.equal(getWardrobeRewards(state).filter(r => r.unlocked).length, 0);
  assert.deepEqual(availableCosmetics({ material: 'berry', expression: 'wink', outfit: 'royal' }, getWardrobeRewards(state)), defaultCosmetics);
  state.parts = 16;
  state = applyEconomyAction(state, { id: 'wardrobe-build-1', type: 'craft_toilet', toiletLevel: 1 });
  state = applyEconomyAction(state, { id: 'wardrobe-build-2', type: 'craft_toilet', toiletLevel: 2 });
  assert.equal(getWardrobeRewards(state).find(r => r.value === 'royal').unlocked, false);
  state = applyEconomyAction(state, { id: 'wardrobe-reset-build', type: 'reset_progress' });
  state.parts = 6;
  const action = { id: 'wardrobe-build-3', type: 'craft_toilet', toiletLevel: 1 };
  state = applyEconomyAction(state, action);
  assert.equal(state.wardrobe.upgrades, 3);
  assert.equal(applyEconomyAction(state, action).wardrobe.upgrades, 3);
  assert.equal(getWardrobeRewards(state).find(r => r.value === 'royal').unlocked, true);
});
