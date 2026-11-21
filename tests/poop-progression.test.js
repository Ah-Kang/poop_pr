import test from 'node:test';
import assert from 'node:assert/strict';
import { poopProgression, getPoopStats, getPoopUpgradePrice } from '../shared/poop-progression.js';

test('early evolution is progressive and first evolution takes fewer than 60 base clicks', () => {
  assert.deepEqual(poopProgression.slice(0, 5).map(p => p.evolutionLevel), [5, 10, 15, 20, 25]);
  const first = poopProgression[0];
  let clicks = 0;
  for (let level = 1; level < first.evolutionLevel; level++) {
    clicks += Math.ceil(getPoopUpgradePrice(first, level) / getPoopStats(first, level).clickPower);
  }
  assert.ok(clicks < 60);
  assert.equal(poopProgression.at(-1).evolutionLevel, null);
});

test('all 19 evolutions improve click power and automatic production by at least 30%', () => {
  const levels = [];
  for (let id = 0; id < poopProgression.length - 1; id++) {
    const stage = poopProgression[id];
    levels[id] = stage.evolutionLevel;
    const before = getPoopStats(stage, levels[id], levels);
    const after = getPoopStats(poopProgression[id + 1], 1, levels);
    assert.ok(after.clickPower >= Math.ceil(before.clickPower * 1.3), `click stage ${id}`);
    assert.ok(after.dps >= Math.ceil(before.dps * 1.3), `production stage ${id}`);
    assert.ok(after.dps > before.dps);
  }
});

test('overleveled legacy saves retain strength through evolution and reload', () => {
  const levels = poopProgression.map(() => 250);
  const snapshot = JSON.stringify(levels);
  for (let id = 0; id < 19; id++) {
    const before = getPoopStats(poopProgression[id], levels[id], levels);
    const after = getPoopStats(poopProgression[id + 1], 1, levels);
    assert.ok(after.clickPower >= Math.ceil(before.clickPower * 1.3));
    assert.ok(after.dps >= Math.ceil(before.dps * 1.3));
    assert.deepEqual(after, getPoopStats(poopProgression[id + 1], 1, JSON.parse(snapshot)));
  }
  assert.equal(JSON.stringify(levels), snapshot);
});

test('existing characters never lose their old base strength at the same level', () => {
  for (const stage of poopProgression) {
    for (const level of [1, 100, 250]) {
      const stats = getPoopStats(stage, level);
      assert.ok(stats.clickPower >= Math.floor(stage.baseClickPower + stage.clickGrowth * (level - 1)));
      assert.ok(stats.dps >= Math.floor(stage.baseDps + stage.dpsGrowth * (level - 1)));
    }
  }
});

test('prices remain finite and grow with levels; final character can keep growing', () => {
  for (const stage of poopProgression) {
    let last = 0;
    for (let level = 1; level <= 100; level++) {
      const price = getPoopUpgradePrice(stage, level);
      assert.ok(Number.isSafeInteger(price) && price >= last && price > 0);
      last = price;
    }
  }
  const final = poopProgression.at(-1);
  assert.ok(getPoopStats(final, 101).clickPower > getPoopStats(final, 100).clickPower);
});
