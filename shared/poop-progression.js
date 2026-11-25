// One permanent level; selecting an earlier appearance never changes strength.
export const evolutionThresholds = [1,5,10,20,35,55,80,110,150,200,260,320,390,460,540,620,710,800,900,1000];
export const evolutionLevels = evolutionThresholds.map((_, i) => evolutionThresholds[i + 1] ?? null);
export const evolutionMultiplier = 1.25;
export const poopProgression = evolutionThresholds.map((unlockLevel,id) => ({ id, unlockLevel, evolutionLevel: evolutionLevels[id] }));
export const stageForLevel = level => Math.max(0, evolutionThresholds.findLastIndex(n => level >= n));
export const levelsForLevel = level => evolutionThresholds.map(n => level >= n ? level : 0);
export const safeAmount = n => Math.max(0, Math.min(1e300, Number.isFinite(n) ? n : n > 0 ? 1e300 : 0));
export function getPoopStats(_poop, level = 1) {
  const l = Math.max(1, Math.floor(level));
  const clickPower = Math.round(l ** 1.35 * 1.25 ** stageForLevel(l));
  return { clickPower, dps: Math.round(2 * Math.log10(l) * clickPower) };
}
export function getPoopUpgradePrice(poop, level) {
  const l = Math.max(1, level), { clickPower, dps } = getPoopStats(poop, l);
  const seconds = l <= 1000 ? 8 + .12*l : 128 + 40*Math.log2(l/1000);
  const pacing = 1 + 60*Math.max(0, (Math.min(l,1000)-80)/920)**1.3;
  return Math.ceil(safeAmount((2*(clickPower+Math.floor(.05*dps))+dps)*seconds*pacing));
}
export const equipment = [
  { id:0, unlockLevel:10, bonus:.05 }, { id:1, unlockLevel:35, bonus:.08 },
  { id:2, unlockLevel:80, bonus:.10 }, { id:3, unlockLevel:200, bonus:.12 },
  { id:4, unlockLevel:390, bonus:.15 }, { id:5, unlockLevel:620, bonus:.20 },
];
export const MAX_EQUIPMENT_RANK = 5;
export function getEquipmentPrice(id, rank) {
  const item = equipment[id];
  return Math.ceil(getPoopStats(null,item.unlockLevel).dps*item.bonus*7200*1.8**rank);
}
export function production(state) {
  const base = getPoopStats(null,state.level);
  const equipmentBonus = equipment.reduce((sum,item) => sum + (state.itemLevels[item.id] || 0)*item.bonus,0);
  const toiletBonus = .05*(state.toiletLevel || 0) + .05*(state.renovationLevel || 0);
  const equippedDps = Math.floor(base.dps*(1+equipmentBonus));
  const dps = Math.floor(base.dps*(1+equipmentBonus)*(1+toiletBonus));
  return { baseClick:base.clickPower, characterDps:base.dps, itemDps:equippedDps-base.dps,
    toiletDps:dps-equippedDps, equipmentBonus, toiletBonus, dps, clickPower:base.clickPower+Math.floor(.05*dps) };
}

// Preserve the existing cleaner event balance across the growth migration.
export const cleanerPenaltyRates = [.1,.12,.15,.18,.2,.21,.22,.23,.24,.25,.25,.26,.26,.27,.27,.28,.28,.29,.29,.3];
