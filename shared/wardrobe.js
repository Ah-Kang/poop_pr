import { normalizeCosmetics } from './cosmetics.js';

export const wardrobeRewards = [
  { category: 'expression', value: 'wink', name: '윙크', goal: '첫 진화 달성', metric: 'evolutions', target: 1, destination: 'growth' },
  { category: 'outfit', value: 'ribbon', name: '분홍 리본', goal: '퍼즐에서 첫 콤보 모으기', metric: 'combos', target: 1, destination: 'puzzle' },
  { category: 'material', value: 'mint', name: '민트 크림', goal: '퍼즐 콤보 누적 30', metric: 'combos', target: 30, destination: 'puzzle' },
  { category: 'expression', value: 'sleepy', name: '졸려', goal: '누적 3일 방문하기', metric: 'visits', target: 3, destination: 'visit' },
  { category: 'material', value: 'berry', name: '딸기 크림', goal: '서로 다른 똥 5종 발견', metric: 'discovered', target: 5, destination: 'growth' },
  { category: 'outfit', value: 'royal', name: '왕관과 망토', goal: '화장실 업그레이드 누적 3회', metric: 'upgrades', target: 3, destination: 'workshop' },
];
const count = n => Number.isSafeInteger(n) && n >= 0 ? n : 0;
const discoveredIds = levels => Array.isArray(levels) ? levels.slice(0, 20).flatMap((level, id) => level > 0 ? [id] : []) : [];
const validIds = ids => Array.isArray(ids) ? ids.filter(id => Number.isInteger(id) && id >= 0 && id < 20) : [];

// Called inside the same wallet lock as puzzle rewards. Account callers supply
// saved growth and server time; request bodies cannot provide achievement totals.
export function updateWardrobe(state, { poopLevels, now = Date.now() } = {}) {
  const old = state.wardrobe || {};
  const day = new Date(now + 9 * 3600000).toISOString().slice(0, 10);
  const lastVisit = typeof old.lastVisit === 'string' ? old.lastVisit : '';
  const wardrobe = {
    discoveredIds: [...new Set([0, ...validIds(old.discoveredIds), ...discoveredIds(poopLevels)])].sort((a, b) => a - b),
    // Legacy combo remainder is a known lower bound; never infer combos from
    // purchased/developer-granted parts or scores from the old stage game.
    combos: count(old.combos ?? state.comboProgress),
    upgrades: Math.max(count(old.upgrades), count(state.toiletLevel)),
    visits: Math.min(3, count(old.visits) + (day > lastVisit ? 1 : 0)),
    lastVisit: day > lastVisit ? day : lastVisit,
  };
  return JSON.stringify(old) === JSON.stringify(wardrobe) ? state : { ...state, wardrobe };
}

export function getWardrobeRewards(state, poopLevels) {
  const progress = state?.wardrobe || {};
  const ids = new Set([0, ...validIds(progress.discoveredIds), ...discoveredIds(poopLevels)]);
  const metrics = {
    evolutions: [...ids].some(id => id > 0) ? 1 : 0,
    discovered: ids.size,
    combos: count(progress.combos ?? state?.comboProgress),
    upgrades: Math.max(count(progress.upgrades), count(state?.toiletLevel)),
    visits: count(progress.visits),
  };
  return wardrobeRewards.map(reward => ({ ...reward, progress: Math.min(reward.target, metrics[reward.metric]), unlocked: metrics[reward.metric] >= reward.target }));
}

export function availableCosmetics(value, rewards) {
  const result = normalizeCosmetics(value);
  for (const reward of rewards) {
    if (!reward.unlocked && result[reward.category] === reward.value) {
      result[reward.category] = { material: 'original', expression: 'default', outfit: 'none' }[reward.category];
    }
  }
  return result;
}
