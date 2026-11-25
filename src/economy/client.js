import { applyEconomyAction, createEconomy, koreaDay, migrateToiletLevel, migratePuzzleTimer, validateEconomy } from '../../shared/economy.js';
import { updateWardrobe } from '../../shared/wardrobe.js';

export const GUEST_ECONOMY_KEY = 'poop-pr-guest-economy-v1';
export const ECONOMY_EVENT = 'poop-pr-economy-changed';
export const DEMO_ECONOMY = import.meta.env.DEV && import.meta.env.VITE_ECONOMY_DEMO === 'true';
const capabilities = { demo: DEMO_ECONOMY, ads: false, purchases: false, minigame: true };
let guestQueue = Promise.resolve();
function guestLock(work) {
  if (navigator.locks?.request) return navigator.locks.request(GUEST_ECONOMY_KEY, work);
  // Older browsers still serialize rapid actions within a tab.
  const result = guestQueue.then(work, work);
  guestQueue = result.catch(() => {});
  return result;
}
function readGuest(legacyLevel) {
  const raw = localStorage.getItem(GUEST_ECONOMY_KEY);
  if (raw) return validateEconomy(JSON.parse(raw));
  const save = JSON.parse(localStorage.getItem('poop-pr-save') || 'null');
  const state = createEconomy(save
    ? migrateToiletLevel(save.currentToiletLevel, save.toiletSchemaVersion ?? 1) : legacyLevel);
  localStorage.setItem(GUEST_ECONOMY_KEY, JSON.stringify(state));
  return state;
}

// A minigame should use the same client and wallet, never a second token balance.
// userId must be the authenticated /api/me user id, or null for guest play.
export function createEconomyClient({ userId = null, legacyToiletLevel = 0 } = {}) {
  const send = async (action) => {
    if (userId) {
      const response = await fetch(action ? '/api/economy/actions' : '/api/economy', {
        method: action ? 'POST' : 'GET',
        headers: action ? { 'Content-Type': 'application/json' } : {},
        body: action ? JSON.stringify(action) : undefined,
        signal: AbortSignal.timeout(12000),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'economy_unavailable');
      return { ...result, receivedAt: performance.now() };
    }
    return guestLock(() => {
      let state = readGuest(legacyToiletLevel);
      const save = JSON.parse(localStorage.getItem('poop-pr-save') || 'null');
      const updated = migratePuzzleTimer(updateWardrobe(state, { poopLevels: save?.poopLevels }));
      if (updated !== state) localStorage.setItem(GUEST_ECONOMY_KEY, JSON.stringify(updated));
      state = updated;
      if (action) {
        if (['start_run', 'demo_ad', 'demo_complete', 'demo_tokens'].includes(action.type) && !DEMO_ECONOMY) throw new Error('integration_not_ready');
        state = applyEconomyAction(state, action, { allowDemo: DEMO_ECONOMY });
        // Persist first: a failed write must not present a successful spend/reward.
        localStorage.setItem(GUEST_ECONOMY_KEY, JSON.stringify(state));
      }
      return { state, day: koreaDay(), serverNow: Date.now(), receivedAt: performance.now(), capabilities };
    });
  };
  return {
    load: () => send(),
    act: async (action) => {
      const result = await send({ ...action, id: action.id || crypto.randomUUID() });
      window.dispatchEvent(new CustomEvent(ECONOMY_EVENT));
      return result;
    },
  };
}

export const economyErrorMessage = (code) => ({
  stage_locked: '아직 열리지 않은 스테이지예요.',
  stale_turn: '다른 창에서 진행된 판이에요. 최신 상태를 다시 불러와주세요.',
  invalid_move: '같은 그림 3개, 사각형 또는 ㄱ·ㄴ 모양으로 맞춰주세요.',
  daily_already_claimed: '오늘의 무료 토큰을 이미 받았어요. 내일 다시 만나요!',
  not_enough_tokens: '똥 토큰이 부족해요. 무료 토큰을 받아보세요.',
  not_enough_parts: '공사 부품이 부족해요. 미니게임에서 모아보세요.',
  previous_toilet_required: '바로 이전 화장실부터 제작해주세요.',
  difficulty_locked: '화장실을 더 업그레이드하면 열려요.',
  run_in_progress: '진행 중인 도전이 있어요.',
  run_not_found: '이미 종료됐거나 찾을 수 없는 도전이에요.',
  ad_limit_reached: '오늘의 광고 보상을 모두 받았어요.',
  integration_not_ready: '아직 연결 준비 중이에요.',
  completion_unavailable: '미니게임 보상 연결을 준비 중이에요.',
  login_required: '로그인이 만료됐어요. 다시 로그인해주세요.',
  invalid_wallet: '저장 정보를 읽을 수 없어요. 페이지를 새로고침해주세요.',
}[code] || '저장하거나 연결하지 못했어요. 잠시 후 다시 시도해주세요.');
