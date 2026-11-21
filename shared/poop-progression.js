// Each stage starts at Lv.1. Saved levels remain untouched when balance changes.
export const evolutionLevels = [5, 10, 15, 20, 25, 30, 35, 40, 50, 60, 70, 80, 90, 100, 100, 100, 100, 100, 100, null];
export const evolutionMultiplier = 1.3;
const seeds = [
  [1, 0, 1, 0],
  [4, 0, 1, 0],
  [7, 1, 1, 0.2],
  [10, 1, 1, 0.4],
  [14, 2, 2, 0.8],
  [24, 4, 2, 1.2],
  [38, 7, 3, 1.6],
  [58, 12, 4, 2],
  [86, 20, 6, 3],
  [124, 34, 8, 4],
  [176, 55, 11, 6],
  [250, 86, 15, 8],
  [350, 130, 20, 11],
  [480, 190, 26, 15],
  [650, 280, 34, 20],
  [880, 400, 44, 27],
  [1180, 570, 56, 36],
  [1560, 800, 72, 48],
  [2050, 1120, 92, 64],
  [2700, 1550, 120, 84],
];

export const poopProgression = seeds.map(([baseClickPower, baseDps, clickGrowth, dpsGrowth], id) => ({
  id, evolutionLevel: evolutionLevels[id], baseClickPower, baseDps, clickGrowth, dpsGrowth,
}));

// Inherit actual previous-stage strength, including older saves above the new threshold.
// Derive from saved levels instead of saving a bonus that could be applied twice on reload.
export function getPoopStats(poop, level, ownedLevels = []) {
  let previous;
  for (let id = 0; id <= poop.id; id += 1) {
    const stage = poopProgression[id];
    const stageLevel = id === poop.id ? Math.max(1, level) : Math.max(stage.evolutionLevel, ownedLevels[id] || 1);
    const clickBase = previous ? Math.max(stage.baseClickPower, Math.ceil(previous.clickPower * evolutionMultiplier)) : stage.baseClickPower;
    const dpsBase = previous ? Math.max(stage.baseDps, Math.ceil(previous.dps * evolutionMultiplier), previous.dps + 1) : stage.baseDps;
    previous = {
      clickPower: Math.floor(clickBase + stage.clickGrowth * (stageLevel - 1)),
      dps: Math.floor(dpsBase + stage.dpsGrowth * (stageLevel - 1)),
    };
  }
  return previous;
}

export function getPoopUpgradePrice(poop, level) {
  // Keep early upgrades near 20 base clicks; grow the cost gradually within each stage.
  const startingPower = getPoopStats(poop, 1).clickPower;
  return Math.ceil(20 * startingPower * Math.pow(1.025, Math.max(0, level - 1)));
}
