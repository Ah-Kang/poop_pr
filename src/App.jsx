import { CLEANER_REQUIRED_HELPS, CLEANER_COOLDOWN_MS, CLEANER_MIN_GOLD } from '../shared/growth.js';
import { useGrowth } from './growth/useGrowth.js';
import { useTelemetry } from './analytics/useTelemetry.js';
import { defaultCosmetics, normalizeCosmetics } from '../shared/cosmetics.js';
import { availableCosmetics, getWardrobeRewards } from '../shared/wardrobe.js';
import { getSkin } from './cosmetics/skins.js';
import SkinPicker from './cosmetics/SkinPicker.jsx';
import VisibleSkin from './cosmetics/VisibleSkin.jsx';
import EvolutionCelebration from './scene/EvolutionCelebration.jsx';
import PoopPortrait from './scene/PoopPortrait.jsx';
import { poopProgression, getPoopStats, getPoopUpgradePrice, equipment, getEquipmentPrice, stageForLevel } from '../shared/poop-progression.js';
import { toilets } from './data/toilets.js';
import React, { useState, useEffect, useRef } from 'react';
import cleanerBrushSwingImage from './assets/cleaner-brush-swing.png';
import plankPoopImage from './assets/PoopImage/plank-poop.png';
import shrimpPoopImage from './assets/PoopImage/shrimp-poop.png';
import minnowPoopImage from './assets/PoopImage/minnow-poop.png';
import rabbitPoopImage from './assets/PoopImage/rabbit-poop.png';
import waterPoopImage from './assets/PoopImage/water-poop.png';
import softPoopImage from './assets/PoopImage/soft-poop.png';
import puddingPoopImage from './assets/PoopImage/pudding-poop.png';
import tteokPoopImage from './assets/PoopImage/tteok-poop.png';
import healthyPoopImage from './assets/PoopImage/healthy-poop.png';
import hardPoopImage from './assets/PoopImage/hard-poop.png';
import musclePoopImage from './assets/PoopImage/muscle-poop.png';
import steelPoopImage from './assets/PoopImage/steel-poop.png';
import firePoopImage from './assets/PoopImage/fire-poop.png';
import volcanoPoopImage from './assets/PoopImage/volcano-poop.png';
import lavaPoopImage from './assets/PoopImage/lava-poop.png';
import platinumPoopImage from './assets/PoopImage/platinum-poop.png';
import emeraldPoopImage from './assets/PoopImage/emerald-poop.png';
import diamondPoopImage from './assets/PoopImage/diamond-poop.png';
import kingPoopImage from './assets/PoopImage/king-poop.png';
import goldPoopImage from './assets/PoopImage/golden-poop.png';
import toiletPaperIcon from './assets/cleaning-items/toilet-paper.png';
import plungerIcon from './assets/cleaning-items/plunger.png';
import toiletBrushIcon from './assets/cleaning-items/toilet-brush.png';
import cleanerSprayIcon from './assets/cleaning-items/cleaner-spray.png';
import bidetIcon from './assets/cleaning-items/bidet.png';
import cleaningRobotIcon from './assets/cleaning-items/cleaning-robot.png';
import packageJson from '../package.json';
import EconomyPanel from './economy/EconomyPanel.jsx';
import { useEconomy } from './economy/useEconomy.js';
import SeatedPoop from './scene/SeatedPoop.jsx';

const toiletSchemaVersion = 2;
const legacyToiletIdMap = {
  0: 1,
  1: 3,
  2: 7,
  3: 9,
  4: 13,
  5: 19,
};
const normalizeToiletLevel = (level, schemaVersion = 1) => {
  const normalizedLevel = Math.max(0, Math.floor(Number(level) || 0));
  if (Number(schemaVersion) >= toiletSchemaVersion) return normalizedLevel;
  return legacyToiletIdMap[normalizedLevel] ?? normalizedLevel;
};

// ==================== 화장실 데이터 배열 ====================
// 화장실 외형과 생산량. 제작 비용은 shared/economy.js에서 관리합니다.


// Artwork and placements; shared progression owns prices, unlocks and production.
const cleaningItems = [
  { id: 0, name: '두루마리 휴지', icon: toiletPaperIcon, description: '기본 중의 기본. 꾸준히 생산해요.', placement: { left: '1%', top: '16%' } },
  { id: 1, name: '뚫어뽕', icon: plungerIcon, description: '막힘을 뚫고 생산 흐름을 높여요.', placement: { right: '1%', top: '16%' } },
  { id: 2, name: '화장실 솔', icon: toiletBrushIcon, description: '변기를 반짝이게 닦아 생산성을 올려요.', placement: { left: '0%', top: '48%' } },
  { id: 3, name: '강력 세정제', icon: cleanerSprayIcon, description: '묵은 때까지 녹이는 강력한 장비예요.', placement: { right: '0%', top: '48%' } },
  { id: 4, name: '자동 비데', icon: bidetIcon, description: '자동화의 시작. 생산량이 크게 뛰어요.', placement: { left: '9%', bottom: '7%' } },
  { id: 5, name: '청소 로봇', icon: cleaningRobotIcon, description: '24시간 쉬지 않는 최종 청소 장비예요.', placement: { right: '9%', bottom: '7%' } },
];

const initialItemLevels = cleaningItems.map(() => 0);
const getItemPrice = (item, level) => getEquipmentPrice(item.id, level);
const cleanerRequiredHelps = CLEANER_REQUIRED_HELPS;
const cleanerEventMinDelay = CLEANER_COOLDOWN_MS;
const cleanerEventMaxDelay = 90000;
const cleanerEventMinGold = CLEANER_MIN_GOLD;
const developerGoldAmount = 999999999999;
const developerModeTapWindow = 1000;
const activeClickDpsBonusRate = 0.05;
const appVersion = packageJson.version;
const getRandomCleanerDelay = () =>
  Math.floor(
    cleanerEventMinDelay + Math.random() * (cleanerEventMaxDelay - cleanerEventMinDelay)
  );

// Character artwork follows cumulative evolution milestones.
const poopCharacters = [
  { id: 0, name: '플랑크똥', badge: '✦', image: plankPoopImage, legacyRequiredLevel: 1, gradient: 'from-stone-200 to-amber-500', description: '눈에 보일 듯 말 듯한 우주 먼지급 똥' },
  { id: 1, name: '새우똥', badge: '🦐', image: shrimpPoopImage, legacyRequiredLevel: 1, gradient: 'from-orange-200 to-rose-400', description: '새우만큼 작고 살짝 굽은 하찮은 똥' },
  { id: 2, name: '피래미똥', badge: '🐟', image: minnowPoopImage, legacyRequiredLevel: 1, gradient: 'from-sky-200 to-stone-500', description: '피래미처럼 작고 미끄러운 초소형 똥' },
  { id: 3, name: '토끼똥', badge: '🐰', image: rabbitPoopImage, legacyRequiredLevel: 1, gradient: 'from-amber-200 to-stone-600', description: '동글동글 알갱이처럼 모여 있는 똥' },
  { id: 4, name: '물똥', badge: '💧', legacyRequiredLevel: 1, gradient: 'from-sky-300 to-blue-600', image: waterPoopImage, description: '아직 힘이 없는 촉촉한 초보 똥' },
  { id: 5, name: '말랑똥', badge: '🫧', legacyRequiredLevel: 10, gradient: 'from-cyan-300 to-teal-500', image: softPoopImage, description: '형태를 갖추기 시작한 말랑한 똥' },
  { id: 6, name: '푸딩똥', badge: '🍮', image: puddingPoopImage, legacyRequiredLevel: 10, gradient: 'from-yellow-200 to-amber-400', description: '카라멜처럼 반짝이는 탱글한 똥' },
  { id: 7, name: '찰떡똥', badge: '🍡', image: tteokPoopImage, legacyRequiredLevel: 10, gradient: 'from-stone-100 to-orange-200', description: '쫀득하게 늘어나는 찰진 똥' },
  { id: 8, name: '건강똥', badge: '🌿', legacyRequiredLevel: 25, gradient: 'from-lime-300 to-emerald-600', image: healthyPoopImage, description: '균형 잡힌 영양으로 단단해진 똥' },
  { id: 9, name: '단단똥', badge: '🪨', image: hardPoopImage, legacyRequiredLevel: 25, gradient: 'from-stone-400 to-amber-800', description: '표면이 갈라질 만큼 단단해진 똥' },
  { id: 10, name: '근육똥', badge: '💪', image: musclePoopImage, legacyRequiredLevel: 25, gradient: 'from-orange-300 to-amber-800', description: '작은 팔까지 생긴 힘센 똥' },
  { id: 11, name: '강철똥', badge: '⚙️', image: steelPoopImage, legacyRequiredLevel: 25, gradient: 'from-slate-300 to-zinc-700', description: '철판과 리벳으로 무장한 똥' },
  { id: 12, name: '불꽃똥', badge: '🔥', legacyRequiredLevel: 50, gradient: 'from-orange-400 to-red-600', image: firePoopImage, description: '뜨거운 생산력을 뿜어내는 똥' },
  { id: 13, name: '화산똥', badge: '🌋', image: volcanoPoopImage, legacyRequiredLevel: 50, gradient: 'from-zinc-700 to-red-600', description: '금 간 표면 사이로 열기가 새어 나오는 똥' },
  { id: 14, name: '용암똥', badge: '♨️', image: lavaPoopImage, legacyRequiredLevel: 50, gradient: 'from-red-500 to-orange-500', description: '용암 줄기가 흐르는 후끈한 똥' },
  { id: 15, name: '플래티넘똥', badge: '🥈', image: platinumPoopImage, legacyRequiredLevel: 80, gradient: 'from-slate-100 to-zinc-400', description: '은백색 광택이 도는 고급 똥' },
  { id: 16, name: '에메랄드똥', badge: '🟢', image: emeraldPoopImage, legacyRequiredLevel: 80, gradient: 'from-emerald-300 to-green-700', description: '초록 결정 조각이 박힌 보석 똥' },
  { id: 17, name: '다이아똥', badge: '💎', legacyRequiredLevel: 80, gradient: 'from-cyan-300 to-violet-600', image: diamondPoopImage, description: '보석처럼 단단하고 희귀한 똥' },
  { id: 18, name: '왕똥', badge: '👑', image: kingPoopImage, legacyRequiredLevel: 120, gradient: 'from-red-300 to-amber-600', description: '작은 왕관을 쓴 당당한 똥' },
  { id: 19, name: '황금똥', badge: '🏆', legacyRequiredLevel: 120, gradient: 'from-yellow-300 to-amber-600', image: goldPoopImage, description: '모든 변기가 꿈꾸는 전설의 황금똥' },
].map((poop) => ({ ...poop, ...poopProgression[poop.id] }));
const legacyPoopNames = ['물똥', '말랑똥', '건강똥', '불꽃똥', '다이아똥', '황금똥'];
const getPoopIdByName = (name) => poopCharacters.find((poop) => poop.name === name)?.id ?? 0;
const initialPoopLevels = poopCharacters.map((_, index) => index === 0 ? 1 : 0);
const initialGameSave = {
  gold: 0,
  toiletLevel: 0,
  toiletSchemaVersion,
  poopLevels: initialPoopLevels,
  selectedPoopId: 0,
  itemLevels: initialItemLevels,
  cosmetics: defaultCosmetics,
};
const initialScore = {
  gold: 0,
  dps: 0,
  toiletLevel: 0,
  toiletSchemaVersion,
  poopLevel: 1,
};
const getHighestUnlockedPoopId = (levels) =>
  levels.reduce((highestId, level, index) => level > 0 ? index : highestId, 0);
const migrateLegacyPoopLevels = (legacyLevels = []) => {
  const migratedLevels = poopCharacters.map(() => 0);

  legacyPoopNames.forEach((name, legacyId) => {
    const newId = getPoopIdByName(name);
    migratedLevels[newId] = Math.max(0, Math.floor(legacyLevels[legacyId] ?? 0));
  });

  const highestUnlockedId = getHighestUnlockedPoopId(migratedLevels);
  if (migratedLevels[highestUnlockedId] <= 0) return initialPoopLevels;

  return migratedLevels.map((level, index) => {
    if (index < highestUnlockedId) return Math.max(level, 100); // Preserve the old migration baseline.
    return level;
  });
};
const normalizePoopLevels = (levels) => {
  if (!Array.isArray(levels)) return null;
  if (levels.length === legacyPoopNames.length) return migrateLegacyPoopLevels(levels);

  const normalizedLevels = poopCharacters.map((_, index) =>
    Math.max(0, Math.floor(levels[index] ?? 0))
  );

  return normalizedLevels.some((level) => level > 0) ? normalizedLevels : initialPoopLevels;
};
const normalizePoopProgress = (source = {}) => {
  const sourceLevels = source.poopLevels;
  const levels = normalizePoopLevels(sourceLevels);

  if (levels) {
    return {
      poopLevels: levels,
      selectedPoopId: getHighestUnlockedPoopId(levels),
    };
  }

  const legacyLevel = Math.max(1, Math.floor(source.poopLevel ?? 1));
  const legacyPoop = [...poopCharacters]
    .reverse()
    .find((poop) => legacyLevel >= poop.legacyRequiredLevel) ?? poopCharacters[0];
  const legacyLevels = poopCharacters.map((poop) => {
    if (poop.id < legacyPoop.id) return 100; // Legacy saves used a uniform Lv.100 evolution.
    if (poop.id === legacyPoop.id) return Math.max(1, legacyLevel - poop.legacyRequiredLevel + 1);
    return 0;
  });

  return {
    poopLevels: legacyLevels,
    selectedPoopId: legacyPoop.id,
  };
};
const getPoopLevelByName = (levels, name) => levels[getPoopIdByName(name)] ?? 0;
const getPoopVisual = (poop, className = '') => {
  if (poop.image) {
    return <img src={poop.image} alt="" className={className} draggable="false" />;
  }

  return (
    <span className={`${className} grid place-items-center rounded-full bg-amber-100 text-2xl`} aria-hidden="true">
      {poop.emoji ?? '💩'}
    </span>
  );
};

// ==================== 숫자 포맷팅 함수 ====================
// 큰 숫자를 읽기 쉬운 형식으로 표현 (예: 1,234,567)
const formatNumber = (num) => {
  const number = Math.max(0, Math.floor(Number(num) || 0));
  const units = [
    { value: 1_000_000_000_000, label: '조' },
    { value: 100_000_000, label: '억' },
    { value: 10_000, label: '만' },
  ];
  const unit = units.find(({ value }) => number >= value);

  if (!unit) return number.toLocaleString('ko-KR');

  const scaled = number / unit.value;
  const formatted = scaled >= 100 || Number.isInteger(scaled)
    ? Math.floor(scaled).toLocaleString('ko-KR')
    : scaled >= 10
    ? scaled.toFixed(1)
    : scaled.toFixed(2);

  return `${formatted.replace(/\.0+$/, '').replace(/(\.\d)0$/, '$1')}${unit.label}`;
};

const GrowthRoadmap = React.memo(function GrowthRoadmap({poopLevel, selectedId}) {
  return poopCharacters.map((poop) => {
    const isOwned = poopLevel >= poop.unlockLevel;
    const isSelected = selectedId === poop.id;
    const stageStats = getPoopStats(poop, isOwned ? poopLevel : poop.unlockLevel);

    return (
      <div
        key={poop.id}
        className={`rounded-2xl border-[3px] p-4 shadow-[0_4px_0_rgba(15,23,42,0.22)] ${
          isSelected
            ? 'border-amber-300 bg-amber-50'
            : isOwned
            ? 'border-emerald-200 bg-white'
            : 'border-slate-200 bg-slate-100 opacity-70'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="relative flex h-16 w-16 shrink-0 items-center justify-center text-4xl">
            {poop.image ? (
              <VisibleSkin
                src={getSkin(poop.id, defaultCosmetics)?.thumb ?? poop.image}
                alt={poop.name}
                className="growth-roadmap-thumb"
              />
            ) : (
              <span className="grid h-14 w-14 place-items-center text-4xl" aria-hidden="true">
                {poop.emoji ?? '💩'}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-black text-gray-900">{poop.name}</h3>
              {isSelected && <span className="rounded-full bg-amber-500 px-2 py-1 text-[10px] font-bold text-white">현재 진화</span>}
              {!isSelected && isOwned && <span className="text-xs font-bold text-emerald-600">✓ 발견 완료</span>}
            </div>
            <p className="mt-1 text-xs text-gray-500">{poop.description}</p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs font-bold">
              <span className="rounded bg-amber-50 px-2 py-1 text-amber-700">
                {`누적 Lv.${poop.unlockLevel} 해금`}
              </span>
              <span className="rounded bg-blue-50 px-2 py-1 text-blue-700">
                {isOwned ? `클릭 +${formatNumber(stageStats.clickPower)}` : `기본 클릭 +${formatNumber(stageStats.clickPower)}`}
              </span>
            </div>
          </div>
        </div>

        {!isOwned && (
          <div className="mt-3 rounded-lg bg-gray-200 py-2 text-center text-xs font-bold text-gray-500">
            🔒 누적 Lv.{poop.unlockLevel}에 해금
          </div>
        )}
      </div>
    );
  });
});

const App = () => {
  const [authUser, setAuthUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isLoginOpen, setIsLoginOpen] = useState(() => {
    try {
      return sessionStorage.getItem('poop-pr-guest-mode') !== 'true';
    } catch {
      return true;
    }
  });
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileNicknameDraft, setProfileNicknameDraft] = useState('');
  const [profileSaveStatus, setProfileSaveStatus] = useState('idle');
  const [localAuthMode, setLocalAuthMode] = useState('hidden');
  const [localLoginId, setLocalLoginId] = useState('');
  const [localPassword, setLocalPassword] = useState('');
  const [localNickname, setLocalNickname] = useState('');
  const [localAuthStatus, setLocalAuthStatus] = useState('idle');
  const [isRankingOpen, setIsRankingOpen] = useState(false);
  const [selectedRankingUser, setSelectedRankingUser] = useState(null);
  const [rankings, setRankings] = useState([]);
  const [isRankingLoading, setIsRankingLoading] = useState(false);
  const [cloudSaveStatus, setCloudSaveStatus] = useState('idle');
  const cloudSaveOwnerRef = useRef(null);
  // ==================== 게임 상태(State) 관리 ====================
  // 현재 보유한 영양분 코인 수량
  const [legacyGold, setGold] = useState(0);
  
  // 기존 저장의 화장실 단계. 공방 로드 후에는 공통 경제 상태를 사용합니다.
  const [legacyToiletLevel, setCurrentToiletLevel] = useState(0);

  // 똥 캐릭터별 강화 레벨 (0 = 잠김, 1 이상 = 해금)
  const [legacyPoopLevels, setPoopLevels] = useState(initialPoopLevels);


  // 청소 장비별 보유 레벨
  const [legacyItemLevels, setItemLevels] = useState(initialItemLevels);

  // 똥 꾸미기 장착 상태
  const [cosmetics, setCosmetics] = useState(defaultCosmetics);
  
  // 화장실 공방 팝업창의 열림/닫힘 상태
  const [isShopOpen, setIsShopOpen] = useState(() => new URLSearchParams(window.location.search).get('workshop') === '1');

  // 청소 장비 상점 팝업창의 열림/닫힘 상태
  const [isItemShopOpen, setIsItemShopOpen] = useState(false);

  // 똥 캐릭터 진화 상점 팝업창의 열림/닫힘 상태
  const [isPoopShopOpen, setIsPoopShopOpen] = useState(false);

  // 똥 강화 모달 상단 탭
  const [evolution, setEvolution] = useState(null);
  const evolutionLock = useRef(false);
  const [poopShopTab, setPoopShopTab] = useState('upgrade');
  
  // 클릭 애니메이션 트리거 (팝핑 효과)
  const [isClicking, setIsClicking] = useState(false);

  // 게임 초기화 확인 팝업 노출 상태
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // 초기화 모달 안의 숨겨진 테스트 모드 상태
  const [isDeveloperModeOpen, setIsDeveloperModeOpen] = useState(false);
  const resetClickCountRef = useRef(0);
  const resetTimerRef = useRef(null);
  const nutrientTapTimeRef = useRef(0);

  // 저장 데이터를 읽기 전에 초기값이 덮어쓰는 것을 방지
  const [isSaveLoaded, setIsSaveLoaded] = useState(false);

  // 청소 도움 이벤트 상태
  const [cleanerEvent, setCleanerEvent] = useState(null);
  const [cleanerMessage, setCleanerMessage] = useState('');
  const [cleanerSpawnAttempt, setCleanerSpawnAttempt] = useState(0);
  const cleanerStarting = useRef(false);
  const cleanerHelping = useRef(false);
  const cleanerReceipt = useRef(null);
  const goldRef = useRef(0);

  const localStorageKey = 'poop-pr-save';
  const economy = useEconomy({ authUser, isAuthLoading, isSaveLoaded });
  const currentToiletLevel = economy.state?.toiletLevel ?? legacyToiletLevel;
  const growth = useGrowth({authUser,isAuthLoading,ready:isSaveLoaded && Boolean(economy.state)});
  const gold = growth.state ? growth.gold : legacyGold;
  const poopLevels = growth.state?.poopLevels ?? legacyPoopLevels;
  const itemLevels = growth.state?.itemLevels ?? legacyItemLevels;
  const [upgradeCount,setUpgradeCount] = useState(1);

  const track = useTelemetry(isSaveLoaded ? authUser?.id : null, 'main');
  useEffect(()=>{if(growth.state)growth.refresh();},[currentToiletLevel,economy.state?.renovationLevel]);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/me')
      .then((response) => response.ok ? response.json() : { user: null })
      .then(({ user }) => {
        if (isMounted) {
          setAuthUser(user);
          setProfileNicknameDraft(user?.displayNickname || user?.nickname || '');
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setIsAuthLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleKakaoLogin = () => {
    window.location.href = '/auth/kakao';
  };

  const resetLocalAuthForm = () => {
    setLocalPassword('');
    setLocalNickname('');
    setLocalAuthStatus('idle');
  };

  const handleGuestPlay = () => {
    setIsLoginOpen(false);
    setLocalAuthMode('hidden');
    resetLocalAuthForm();
    try {
      sessionStorage.setItem('poop-pr-guest-mode', 'true');
    } catch {
      // 브라우저 저장소가 제한되어도 비로그인 플레이는 허용합니다.
    }
  };

  const handleLocalAuthSubmit = async () => {
    const loginId = localLoginId.trim().toLowerCase();
    const password = localPassword;
    const displayNickname = localAuthMode === 'register'
      ? localNickname.trim().replace(/\s+/g, ' ')
      : undefined;

    if (!/^[a-z0-9_]{4,20}$/.test(loginId)) {
      setLocalAuthStatus('invalid_id');
      return;
    }
    if (password.length < 6 || password.length > 72) {
      setLocalAuthStatus('invalid_password');
      return;
    }
    if (localAuthMode === 'register' && (!displayNickname || displayNickname.length < 2 || displayNickname.length > 12)) {
      setLocalAuthStatus('invalid_nickname');
      return;
    }

    setLocalAuthStatus('loading');
    try {
      const response = await fetch(
        localAuthMode === 'register' ? '/api/auth/local/register' : '/api/auth/local/login',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ loginId, password, displayNickname }),
        }
      );
      const data = response.ok ? await response.json() : await response.json().catch(() => ({}));
      if (!response.ok || !data?.user) {
        setLocalAuthStatus(data?.error === 'login_id_taken' ? 'taken' : 'error');
        return;
      }

      setAuthUser(data.user);
      setProfileNicknameDraft(data.user.displayNickname || data.user.nickname || '');
      setLocalAuthMode('hidden');
      setLocalLoginId('');
      resetLocalAuthForm();
    } catch {
      setLocalAuthStatus('error');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    setAuthUser(null);
    setIsLoginOpen(true);
    setIsProfileOpen(false);
    setProfileNicknameDraft('');
    setProfileSaveStatus('idle');
    setLocalAuthMode('hidden');
    setLocalLoginId('');
    resetLocalAuthForm();
    setCloudSaveStatus('idle');
    cloudSaveOwnerRef.current = null;
  };

  const handleProfileOpen = () => {
    if (!authUser) return;
    setProfileNicknameDraft(authUser.displayNickname || authUser.nickname || '');
    setProfileSaveStatus('idle');
    setIsProfileOpen(true);
  };

  const handleProfileSave = async () => {
    const displayNickname = profileNicknameDraft.trim().replace(/\s+/g, ' ');
    if (displayNickname.length < 2 || displayNickname.length > 12) {
      setProfileSaveStatus('invalid');
      return;
    }

    setProfileSaveStatus('saving');
    try {
      const response = await fetch('/api/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayNickname }),
      });
      const data = response.ok ? await response.json() : null;
      if (!response.ok || !data?.user) throw new Error('profile_save_failed');

      setAuthUser(data.user);
      setProfileNicknameDraft(data.user.displayNickname || data.user.nickname || '');
      setProfileSaveStatus('saved');
      setRankings((prevRankings) =>
        prevRankings.map((entry) =>
          entry.id === data.user.id
            ? { ...entry, nickname: data.user.nickname, displayNickname: data.user.displayNickname }
            : entry
        )
      );
    } catch {
      setProfileSaveStatus('error');
    }
  };

  const itemDps = growth.state?.itemDps ?? 0;
  const activeCleaningItems = cleaningItems.filter(item => (itemLevels[item.id]??0)>0);
  const toiletDps = growth.state?.toiletDps ?? 0;
  const currentPoopLevel = getHighestUnlockedPoopId(poopLevels);
  const unlockedPoop = poopCharacters[currentPoopLevel] ?? poopCharacters[0];
  const currentPoop = unlockedPoop;
  const wardrobeReady = Boolean(isSaveLoaded && economy.state && (!authUser || ['saved', 'saving'].includes(cloudSaveStatus)));
  const wardrobeRewards = getWardrobeRewards(economy.state, wardrobeReady ? poopLevels : undefined);
  const equippedCosmetics = wardrobeReady ? availableCosmetics(cosmetics, wardrobeRewards) : cosmetics;
  const currentSkin = getSkin(currentPoop.id, equippedCosmetics);
  useEffect(() => {
    if (wardrobeReady && JSON.stringify(equippedCosmetics) !== JSON.stringify(cosmetics)) setCosmetics(equippedCosmetics);
  }, [wardrobeReady, JSON.stringify(equippedCosmetics), cosmetics]);
  const poopLevel = growth.state?.level ?? 1;
  const nextPoop = poopCharacters[unlockedPoop.id + 1] ?? null;
  const canEvolvePoop = false; // Evolution happens when the cumulative level crosses a milestone.
  const poopUpgradePrice = getPoopUpgradePrice(currentPoop, poopLevel);
  const { clickPower: baseClickPower, dps: characterDps } = getPoopStats(currentPoop, poopLevel, poopLevels);
  const nextPoopStats = nextPoop ? getPoopStats(nextPoop, nextPoop.unlockLevel) : null;
  const dps = growth.state?.dps ?? 0;
  const activeClickBonus = Math.floor(dps * activeClickDpsBonusRate);
  const clickPower = baseClickPower + activeClickBonus;
  const totalItemLevels = itemLevels.reduce((total, level) => total + (level ?? 0), 0);
  const recommendedEquipment = cleaningItems.filter(item => poopLevel >= equipment[item.id].unlockLevel && itemLevels[item.id] < 5)
    .sort((a,b) => getItemPrice(a,itemLevels[a.id])/equipment[a.id].bonus - getItemPrice(b,itemLevels[b.id])/equipment[b.id].bonus)[0];

  const cosmeticOptions = {
    hat: [
      { id: 'none', name: '없음', icon: '', requirement: '기본', unlocked: true },
      { id: 'crown', name: '왕관', icon: '👑', requirement: '왕똥 해금', unlocked: getPoopLevelByName(poopLevels, '왕똥') > 0 },
      { id: 'hardhat', name: '안전모', icon: '⛑️', requirement: '장비 총 Lv.30', unlocked: totalItemLevels >= 30 },
      { id: 'flower', name: '꽃핀', icon: '🌸', requirement: '말랑똥 Lv.50', unlocked: getPoopLevelByName(poopLevels, '말랑똥') >= 50 },
      { id: 'sunglasses', name: '선글라스', icon: '🕶️', requirement: '불꽃똥 해금', unlocked: getPoopLevelByName(poopLevels, '불꽃똥') > 0 },
      { id: 'wizard', name: '마법사 모자', icon: '🧙', requirement: '건강똥 Lv.70', unlocked: getPoopLevelByName(poopLevels, '건강똥') >= 70 },
      { id: 'ribbon', name: '리본', icon: '🎀', requirement: '물똥 Lv.20', unlocked: getPoopLevelByName(poopLevels, '물똥') >= 20 },
      { id: 'toiletLid', name: '변기뚜껑 모자', icon: '🚽', requirement: '화장실 2단계', unlocked: currentToiletLevel >= 1 },
      { id: 'halo', name: '천사 링', icon: '😇', requirement: '장비 총 Lv.30', unlocked: totalItemLevels >= 30 },
      { id: 'devilHorns', name: '악마 뿔', icon: '😈', requirement: '불꽃똥 Lv.40', unlocked: getPoopLevelByName(poopLevels, '불꽃똥') >= 40 },
      { id: 'spaceHelmet', name: '우주 헬멧', icon: '🪐', requirement: '우주 화장실 해금', unlocked: currentToiletLevel >= 4 },
    ],
    aura: [
      { id: 'none', name: '없음', icon: '', requirement: '기본', unlocked: true },
      { id: 'sparkle', name: '반짝이', icon: '✨', requirement: '물똥 Lv.30', unlocked: getPoopLevelByName(poopLevels, '물똥') >= 30 },
      { id: 'water', name: '물방울', icon: '💧', requirement: '물똥 Lv.60', unlocked: getPoopLevelByName(poopLevels, '물똥') >= 60 },
      { id: 'fire', name: '불꽃', icon: '🔥', requirement: '불꽃똥 해금', unlocked: getPoopLevelByName(poopLevels, '불꽃똥') > 0 },
      { id: 'diamond', name: '다이아 빛', icon: '💎', requirement: '다이아똥 해금', unlocked: getPoopLevelByName(poopLevels, '다이아똥') > 0 },
      { id: 'heartBubble', name: '하트 버블', icon: '🫧', requirement: '말랑똥 Lv.80', unlocked: getPoopLevelByName(poopLevels, '말랑똥') >= 80 },
      { id: 'steam', name: '구름 김', icon: '☁️', requirement: '화장실 3단계', unlocked: currentToiletLevel >= 2 },
      { id: 'rainbow', name: '무지개 링', icon: '🌈', requirement: '건강똥 Lv.100', unlocked: getPoopLevelByName(poopLevels, '건강똥') >= 100 },
      { id: 'constellation', name: '별자리', icon: '🌙', requirement: '우주 화장실 해금', unlocked: currentToiletLevel >= 4 },
      { id: 'goldCoin', name: '골드 코인', icon: '🪙', requirement: '100만 영양분', unlocked: gold >= 1000000 },
      { id: 'cleanFoam', name: '소독 거품', icon: '🧼', requirement: '장비 총 Lv.25', unlocked: totalItemLevels >= 25 },
    ],
  };
  const getCosmeticOption = (slot, id) =>
    cosmeticOptions[slot]?.find((option) => option.id === id) ?? cosmeticOptions[slot]?.[0];
  const handleCosmeticEquip = (slot, option) => {
    if (!option.unlocked) return;
    setCosmetics((prevCosmetics) => ({
      ...prevCosmetics,
      [slot]: option.id,
    }));
  };
  const renderCosmeticVisual = (option, slot, mode = 'avatar') => {
    if (!option || option.id === 'none') {
      return mode === 'picker' ? <span className="text-[10px] font-black text-slate-400">OFF</span> : null;
    }

    const isPicker = mode === 'picker';
    const emojiClass = isPicker ? 'text-2xl leading-none' : 'text-4xl leading-none';
    const hatFrameClass = isPicker ? 'h-9 w-10' : 'h-12 w-16';
    const auraFrameClass = isPicker ? 'h-9 w-9' : 'h-full w-full';

    if (slot === 'hat') {
      if (option.id === 'spaceHelmet') {
        return (
          <span className={`relative block ${hatFrameClass}`} aria-hidden="true">
            <span className="absolute inset-x-1 top-1 h-8 rounded-full border-[6px] border-stone-100 bg-transparent shadow-[inset_0_0_0_2px_rgba(14,165,233,0.5),0_2px_5px_rgba(15,23,42,0.35)]" />
            <span className="absolute left-0 top-4 h-4 w-3 rounded-full bg-amber-300 shadow-[0_1px_0_#92400e]" />
            <span className="absolute right-0 top-4 h-4 w-3 rounded-full bg-amber-300 shadow-[0_1px_0_#92400e]" />
            <span className="absolute bottom-1 left-1/2 h-2 w-8 -translate-x-1/2 rounded-full bg-stone-100 shadow-[0_1px_0_#94a3b8]" />
            <span className="absolute right-1 top-2 h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_6px_rgba(34,211,238,0.9)]" />
          </span>
        );
      }

      return <span className={emojiClass} aria-hidden="true">{option.icon}</span>;
    }

    const auraBase = `pointer-events-none ${isPicker ? 'relative' : 'absolute -inset-8'} ${auraFrameClass}`;
    const sparkleBase = 'absolute rounded-full opacity-90';

    if (option.id === 'sparkle') {
      return (
        <span className={auraBase} aria-hidden="true">
          <span className="absolute left-1 top-0 text-xl text-amber-300">✦</span>
          <span className="absolute right-0 top-5 text-lg text-yellow-200">✦</span>
          <span className="absolute bottom-1 left-4 text-base text-amber-200">✦</span>
        </span>
      );
    }

    if (option.id === 'water' || option.id === 'heartBubble' || option.id === 'cleanFoam') {
      const bubbleColor = option.id === 'heartBubble' ? 'bg-pink-200/80' : option.id === 'cleanFoam' ? 'bg-cyan-100/90' : 'bg-sky-200/80';
      const symbol = option.id === 'heartBubble' ? '♥' : option.id === 'cleanFoam' ? '+' : '';
      return (
        <span className={auraBase} aria-hidden="true">
          {[0, 1, 2, 3, 4].map((bubble) => (
            <span
              key={bubble}
              className={`${sparkleBase} ${bubbleColor} grid place-items-center border border-white/80 text-[9px] font-black text-white`}
              style={{
                left: `${14 + bubble * 15}%`,
                top: `${bubble % 2 === 0 ? 18 : 58}%`,
                width: `${isPicker ? 10 : 16}px`,
                height: `${isPicker ? 10 : 16}px`,
              }}
            >
              {symbol}
            </span>
          ))}
        </span>
      );
    }

    if (option.id === 'fire') {
      return (
        <span className={auraBase} aria-hidden="true">
          <span className="absolute inset-x-3 bottom-0 h-4/5 rounded-full bg-gradient-to-t from-orange-500/80 via-red-400/45 to-transparent blur-[1px]" />
          <span className="absolute left-1/2 top-1 -translate-x-1/2 text-3xl">🔥</span>
        </span>
      );
    }

    if (option.id === 'diamond') {
      return (
        <span className={auraBase} aria-hidden="true">
          <span className="absolute inset-2 rounded-full bg-cyan-200/25 shadow-[0_0_18px_rgba(103,232,249,0.9)]" />
          <span className="absolute left-0 top-3 text-lg">💎</span>
          <span className="absolute right-1 top-0 text-base">💎</span>
          <span className="absolute bottom-1 left-1/2 text-sm">💎</span>
        </span>
      );
    }

    if (option.id === 'steam') {
      return (
        <span className={auraBase} aria-hidden="true">
          <span className="absolute left-0 top-2 text-xl opacity-80">☁️</span>
          <span className="absolute right-1 top-5 text-lg opacity-70">☁️</span>
          <span className="absolute bottom-1 left-4 text-base opacity-60">☁️</span>
        </span>
      );
    }

    if (option.id === 'rainbow') {
      return (
        <span className={auraBase} aria-hidden="true">
          <span className="absolute inset-1 rounded-full border-[5px] border-pink-300 shadow-[inset_0_0_0_4px_#fde68a,0_0_0_4px_#67e8f9,0_0_14px_rgba(244,114,182,0.55)]" />
        </span>
      );
    }

    if (option.id === 'constellation') {
      return (
        <span className={auraBase} aria-hidden="true">
          <span className="absolute inset-2 rounded-full border border-indigo-300/80 shadow-[0_0_16px_rgba(129,140,248,0.75)]" />
          <span className="absolute left-2 top-1 text-sm text-yellow-200">★</span>
          <span className="absolute right-2 top-4 text-xs text-yellow-100">★</span>
          <span className="absolute bottom-2 left-1/2 text-sm text-yellow-200">★</span>
        </span>
      );
    }

    if (option.id === 'goldCoin') {
      return (
        <span className={auraBase} aria-hidden="true">
          <span className="absolute left-1 top-3 text-lg">🪙</span>
          <span className="absolute right-1 top-0 text-base">🪙</span>
          <span className="absolute bottom-2 left-1/2 text-sm">🪙</span>
        </span>
      );
    }

    return <span className={emojiClass} aria-hidden="true">{option.icon}</span>;
  };
  const renderPoopAvatar = (
    poop,
    level,
    cosmeticState = defaultCosmetics,
    imageClassName = 'h-48 w-48 object-contain',
    showTitle = true
  ) => {
    const normalizedCosmetics = normalizeCosmetics(cosmeticState);
    const skin = getSkin(poop.id, normalizedCosmetics);
    const hat = getCosmeticOption('hat', normalizedCosmetics.hat);
    const aura = getCosmeticOption('aura', normalizedCosmetics.aura);
    const titleText = normalizedCosmetics.titleText.trim();

    return (
      <>
        {renderCosmeticVisual(aura, 'aura')}
        {poop.image ? (
          <img
            src={skin?.image ?? poop.image}
            alt={poop.name}
            decoding="async"
            className={`relative z-10 ${imageClassName}`}
            draggable="false"
          />
        ) : (
          <span className={`relative z-10 grid place-items-center ${imageClassName}`} aria-label={poop.name}>
            {poop.emoji ?? '💩'}
          </span>
        )}
        {normalizedCosmetics.outfit === 'none' && hat?.id !== 'none' && (
          <span className="absolute -top-5 left-1/2 z-20 -translate-x-1/2 drop-shadow-lg" aria-hidden="true">
            {renderCosmeticVisual(hat, 'hat')}
          </span>
        )}
        {showTitle && titleText && (
          <span className="absolute -bottom-4 left-1/2 max-w-44 -translate-x-1/2 truncate rounded-full border-2 border-amber-950 bg-white/90 px-3 py-1 text-[10px] font-black text-amber-950 shadow-[0_2px_0_#78350f]">
            🏷️ {titleText} · Lv.{level}
          </span>
        )}
      </>
    );
  };
  const scoreRef = useRef({ gold, dps, toiletLevel: currentToiletLevel, poopLevel });
  const gameSaveRef = useRef({
    gold,
    toiletLevel: currentToiletLevel,
    toiletSchemaVersion,
    poopLevels,
    selectedPoopId: currentPoop.id,
    itemLevels,
    cosmetics,
  });

  useEffect(() => {
    scoreRef.current = { gold, dps, toiletLevel: currentToiletLevel, toiletSchemaVersion, poopLevel };
  }, [gold, dps, currentToiletLevel, poopLevel]);

  useEffect(() => {
    gameSaveRef.current = {
      gold,
      toiletLevel: currentToiletLevel,
      toiletSchemaVersion,
      poopLevels,
      selectedPoopId: currentPoop.id,
      itemLevels,
      cosmetics,
    };
  }, [gold, currentToiletLevel, poopLevels, currentPoop.id, itemLevels, cosmetics]);

  useEffect(() => {
    if (!authUser || !isSaveLoaded || cloudSaveOwnerRef.current === authUser.id) return;
    cloudSaveOwnerRef.current = authUser.id;
    setCloudSaveStatus('loading');

    fetch('/api/game-save')
      .then(async (response) => {
        if (!response.ok) throw new Error('cloud_load_failed');
        return response.json();
      })
      .then(async ({ save }) => {
        if (save) {
          const savedPoopProgress = normalizePoopProgress(save);
          const savedItemLevels = cleaningItems.map((_, index) => save.itemLevels?.[index] ?? 0);
          setGold(save.gold);
          setCurrentToiletLevel(Math.min(toilets.length - 1, normalizeToiletLevel(save.toiletLevel, save.toiletSchemaVersion)));
          setPoopLevels(savedPoopProgress.poopLevels);
          setItemLevels(savedItemLevels);
          setCosmetics(normalizeCosmetics(save.cosmetics));
        } else {
          const uploadResponse = await fetch('/api/game-save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(gameSaveRef.current),
          });
          if (!uploadResponse.ok) throw new Error('cloud_upload_failed');
        }
        setCloudSaveStatus('saved');
      })
      .catch(() => {
        cloudSaveOwnerRef.current = null;
        setCloudSaveStatus('error');
      });
  }, [authUser, isSaveLoaded]);

  useEffect(() => {
    if (!authUser || cloudSaveStatus !== 'saved') return;

    const syncGameSave = async () => {
      setCloudSaveStatus('saving');
      try {
        const response = await fetch('/api/game-save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(gameSaveRef.current),
        });
        setCloudSaveStatus(response.ok ? 'saved' : 'error');
      } catch {
        setCloudSaveStatus('error');
      }
    };

    const interval = setInterval(syncGameSave, 10000);
    return () => clearInterval(interval);
  }, [authUser, cloudSaveStatus]);

  const handleRankingOpen = async () => {
    setIsRankingOpen(true);
    setSelectedRankingUser(null);
    setIsRankingLoading(true);
    try {
      const response = await fetch('/api/ranking');
      const data = response.ok ? await response.json() : { ranking: [] };
      setRankings(data.ranking ?? []);
    } catch {
      setRankings([]);
    } finally {
      setIsRankingLoading(false);
    }
  };

  useEffect(() => {
    goldRef.current = gold;
  }, [gold]);

  useEffect(() => () => {
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
    }
  }, []);

  // ==================== 로컬 저장/불러오기 ====================
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(localStorageKey);
      if (!savedData) return;

      const parsed = JSON.parse(savedData);
      const savedToiletLevel = Math.min(
        toilets.length - 1,
        normalizeToiletLevel(parsed.currentToiletLevel ?? 0, parsed.toiletSchemaVersion)
      );

      setGold(parsed.gold ?? 0);
      setCurrentToiletLevel(savedToiletLevel);
      const savedPoopProgress = normalizePoopProgress(parsed);
      const savedPoopLevels = savedPoopProgress.poopLevels;
      setPoopLevels(savedPoopLevels);
      setItemLevels(
        Array.isArray(parsed.itemLevels)
          ? cleaningItems.map((_, index) => parsed.itemLevels[index] ?? 0)
          : initialItemLevels
      );
      setCosmetics(normalizeCosmetics(parsed.cosmetics));
    } catch (error) {
      console.warn('저장된 게임 데이터를 불러오는 중 오류가 발생했습니다.', error);
    } finally {
      setIsSaveLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!isSaveLoaded || !growth.state || authUser) return;

    try {
      const saveData = {
        growth: growth.state,
        gold: growth.state.gold,
        currentToiletLevel,
        toiletSchemaVersion,
        currentPoopLevel,
        poopLevel,
        poopLevels,
        selectedPoopId: currentPoop.id,
        itemLevels,
        cosmetics,
      };
      localStorage.setItem(localStorageKey, JSON.stringify(saveData));
    } catch (error) {
      console.warn('게임 데이터를 저장하는 중 오류가 발생했습니다.', error);
    }
  }, [currentToiletLevel, currentPoopLevel, poopLevel, poopLevels, currentPoop.id, itemLevels, cosmetics, isSaveLoaded, growth.state, authUser]);

  // Refresh wardrobe only when an evolution discovers a character, not every
  // click batch/heartbeat (each snapshot contains a new poopLevels array).
  useEffect(() => {
    if (isSaveLoaded && !authUser) economy.refresh();
  }, [currentPoopLevel, isSaveLoaded, authUser, economy.refresh]);

  useEffect(() => {
    const visibility = () => { if(document.visibilityState !== 'visible')setCleanerEvent(null); else setCleanerSpawnAttempt(n=>n+1); };
    document.addEventListener('visibilitychange',visibility);
    return()=>document.removeEventListener('visibilitychange',visibility);
  },[]);
  // The shared wallet issues the event and pays once, including across tabs/retries.
  const savedCleaner = growth.state?.cleaner;
  useEffect(() => {
    if (!savedCleaner) { setCleanerEvent(null); return; }
    if (savedCleaner.completed) {
      setCleanerEvent(null);
      if (cleanerReceipt.current === savedCleaner.id) {
        setCleanerMessage(`청소 완료! 고마워요 💚 영양분 +${formatNumber(savedCleaner.reward)}`);
        cleanerReceipt.current = null;
      }
      return;
    }
    const remaining = savedCleaner.endsAt - growth.state.lastAt;
    if (remaining <= 0 || document.visibilityState !== 'visible') return;
    cleanerReceipt.current = savedCleaner.id;
    setCleanerMessage('');
    setCleanerEvent({id:savedCleaner.id, helps:savedCleaner.helps, deadline:Date.now()+remaining, timeLeft:Math.ceil(remaining/1000)});
  }, [savedCleaner?.id, savedCleaner?.helps, savedCleaner?.completed]);

  useEffect(() => {
    if (!growth.state || cleanerEvent || document.visibilityState !== 'visible') return;
    const timeout = setTimeout(async () => {
      if (document.visibilityState !== 'visible' || cleanerStarting.current) return;
      if (goldRef.current < cleanerEventMinGold) { setCleanerSpawnAttempt(n=>n+1); return; }
      cleanerStarting.current = true;
      try { await growth.act({type:'cleaner_start'}); }
      finally { cleanerStarting.current = false; setCleanerSpawnAttempt(n=>n+1); }
    }, getRandomCleanerDelay());
    return () => clearTimeout(timeout);
  }, [Boolean(growth.state), cleanerEvent?.id, cleanerSpawnAttempt]);

  useEffect(() => {
    if (!cleanerEvent) return;
    const timer=setInterval(()=>{
      const timeLeft=Math.max(0,Math.ceil((cleanerEvent.deadline-Date.now())/1000));
      if (!timeLeft) {
        setCleanerEvent(null);
        setCleanerMessage('다음에 또 도와주세요! 영양분은 그대로예요.');
      } else setCleanerEvent(event=>event?.id===cleanerEvent.id?{...event,timeLeft}:event);
    },100);
    return()=>clearInterval(timer);
  },[cleanerEvent?.id,cleanerEvent?.deadline]);
  useEffect(()=>{
    if(!cleanerMessage)return;
    const timeout=setTimeout(()=>setCleanerMessage(''),3500);
    return()=>clearTimeout(timeout);
  },[cleanerMessage]);

  // ==================== 클릭 핸들러 함수 ====================
  // 똥 캐릭터 버튼 클릭 시 gold 증가 및 애니메이션 실행
  const handlePoopClick = () => {
    if (!growth.click()) return;
    track('clicks');
    
    // 팝핑 애니메이션 트리거
    setIsClicking(true);
    
    // 300ms 후 애니메이션 상태 초기화
    setTimeout(() => setIsClicking(false), 300);
  };

  const handleCleanerHelp = async () => {
    if(!cleanerEvent || cleanerHelping.current || growth.pending)return;
    cleanerHelping.current=true;
    try { await growth.act({type:'cleaner_help',eventId:cleanerEvent.id}); }
    finally { cleanerHelping.current=false; }
  };

  // ==================== 청소 장비 구매 핸들러 ====================
  const handleItemPurchase = async itemId => {
    const result = await growth.act({type:'equipment',itemId});
    if(result)track('itemUpgrades');
  };
  const [upgradeFeedback, setUpgradeFeedback] = useState(null);
  useEffect(() => {
    if (!upgradeFeedback) return;
    const timer = setTimeout(() => setUpgradeFeedback(null), 1100);
    return () => clearTimeout(timer);
  }, [upgradeFeedback]);
  const handlePoopLevelUp = async () => {
    const before = getPoopStats(null,poopLevel);
    const result = await growth.act({type:'upgrade',count:upgradeCount});
    if(!result)return;
    setUpgradeFeedback({level:result.state.level, count:result.upgrades});
    for(let i=0;i<result.upgrades;i++)track('poopUpgrades');
    if(result.evolutions){
      for(let i=0;i<result.evolutions;i++)track('evolutions');
      setEvolution({from:unlockedPoop,to:poopCharacters[stageForLevel(result.state.level)],level:result.state.level,before,after:getPoopStats(null,result.state.level)});
      economy.refresh();
    }
  };
  const handlePoopEvolve = handlePoopLevelUp;

  // ==================== 게임 초기화 리셋 핸들러 ====================
  const handleResetGame = async () => {
    const resetEconomy = await economy.act({ type: 'reset_progress' });
    if (!resetEconomy) return;
    if (!await growth.act({type:'reset'})) return;
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
    resetClickCountRef.current = 0;
    setGold(0);
    setCurrentToiletLevel(0);
    setPoopLevels(initialPoopLevels);
    setItemLevels(initialItemLevels);
    setCosmetics(defaultCosmetics);
    setIsShopOpen(false);
    setIsItemShopOpen(false);
    setIsPoopShopOpen(false);
    setIsResetConfirmOpen(false);
    setIsDeveloperModeOpen(false);
    localStorage.removeItem(localStorageKey);

    scoreRef.current = initialScore;
    gameSaveRef.current = initialGameSave;

    if (!authUser) return;

    setCloudSaveStatus('saving');
    try {
      const [saveResponse, scoreResponse] = await Promise.all([
        fetch('/api/game-save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(initialGameSave),
        }),
        fetch('/api/score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(initialScore),
        }),
      ]);

      setCloudSaveStatus(saveResponse.ok && scoreResponse.ok ? 'saved' : 'error');
    } catch {
      setCloudSaveStatus('error');
    }
  };

  const handleResetModalOpen = () => {
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
    resetClickCountRef.current = 0;
    setIsDeveloperModeOpen(false);
    setIsResetConfirmOpen(true);
  };

  const handleNutrientPanelClick = () => {
    const now = Date.now();
    if (now - nutrientTapTimeRef.current <= 400) {
      nutrientTapTimeRef.current = 0;
      handleResetModalOpen();
      return;
    }

    nutrientTapTimeRef.current = now;
  };

  const handleResetModalClose = () => {
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
    resetClickCountRef.current = 0;
    setIsResetConfirmOpen(false);
    setIsDeveloperModeOpen(false);
  };

  const handleResetButtonClick = () => {
    if (isDeveloperModeOpen) {
      handleResetGame();
      return;
    }

    resetClickCountRef.current += 1;

    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }

    if (import.meta.env.DEV && resetClickCountRef.current >= 3) {
      resetClickCountRef.current = 0;
      setIsDeveloperModeOpen(true);
      return;
    }

    resetTimerRef.current = setTimeout(() => {
      resetTimerRef.current = null;
      handleResetGame();
    }, developerModeTapWindow);
  };

  const handleDeveloperGoldCharge = () => {
    growth.act({type:'demo_gold'});
  };

  // ==================== 현재 화장실 배경설정 가져오기 ====================
  const currentToilet = toilets[currentToiletLevel];
  const currentBgGradient = currentToilet.bgGradient;
  const currentBgImage = currentToilet.image;
  const evolutionProgress = unlockedPoop.evolutionLevel
    ? Math.min(100, ((poopLevel-unlockedPoop.unlockLevel) / (unlockedPoop.evolutionLevel-unlockedPoop.unlockLevel)) * 100)
    : 100;

  useEffect(() => {
    const backgroundValue = currentBgImage ? `url(${currentBgImage})` : 'none';
    document.documentElement.style.setProperty('--game-background-image', backgroundValue);
    document.body.style.setProperty('--game-background-image', backgroundValue);
    document.body.style.backgroundImage = backgroundValue;
    document.body.style.backgroundSize = '100% 100%';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundRepeat = 'no-repeat';

    return () => {
      document.documentElement.style.removeProperty('--game-background-image');
      document.body.style.removeProperty('--game-background-image');
      document.body.style.removeProperty('background-image');
      document.body.style.removeProperty('background-size');
      document.body.style.removeProperty('background-position');
      document.body.style.removeProperty('background-repeat');
    };
  }, [currentBgImage]);

  // ==================== JSX 렌더링 ====================
  return (
    <div
      className={`
        game-shell
        bg-gradient-to-b ${currentBgGradient}
        flex flex-col items-center justify-between
        px-3 transition-all duration-500 ease-in-out
        overflow-hidden overscroll-none
      `}
      style={{
        backgroundImage: currentBgImage
          ? `url(${currentBgImage})`
          : `linear-gradient(to bottom, var(--tw-gradient-stops))`,
        backgroundSize: currentBgImage ? '100% 100%' : undefined,
        backgroundPosition: currentBgImage ? 'center' : undefined,
        backgroundRepeat: currentBgImage ? 'no-repeat' : undefined,
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-cyan-950/10 via-transparent to-slate-950/30" />

      {/* ==================== 상단: 고정형 게임 HUD ==================== */}
      <div className="relative z-30 w-full shrink-0 space-y-2">
        <div className="flex min-h-10 items-center justify-between gap-2 rounded-2xl border-[3px] border-amber-950/70 bg-[#fff7df] px-2.5 py-1.5 shadow-[0_4px_0_#78350f,0_7px_14px_rgba(0,0,0,0.18)]">
          {authUser ? (
            <>
              <button
                type="button"
                onClick={handleProfileOpen}
                className="flex min-w-0 items-center gap-2 rounded-xl px-1 py-1 text-left active:scale-[0.99]"
              >
                {authUser.profileImage ? (
                  <img className="h-8 w-8 shrink-0 rounded-full border-2 border-amber-900 object-cover" src={authUser.profileImage} alt="" />
                ) : (
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-amber-300 text-sm" aria-hidden="true">👤</span>
                )}
                <div className="min-w-0">
                  <p className="truncate text-xs font-black text-slate-800">{authUser.nickname}</p>
                  <p className={`text-[8px] font-black ${cloudSaveStatus === 'error' ? 'text-red-600' : 'text-teal-700'}`}>
                    {cloudSaveStatus === 'loading' && '☁️ 불러오는 중'}
                    {cloudSaveStatus === 'saving' && '☁️ 저장 중'}
                    {cloudSaveStatus === 'saved' && '☁️ 저장됨'}
                    {cloudSaveStatus === 'error' && '⚠️ 저장 실패'}
                  </p>
                  {cosmetics.titleText?.trim() && (
                    <p className="truncate text-[8px] font-black text-amber-700">
                      🏷️ {cosmetics.titleText.trim()}
                    </p>
                  )}
                </div>
              </button>
              <div className="flex shrink-0 gap-1.5">
                <button type="button" onClick={handleRankingOpen} className="rounded-xl bg-amber-400 px-2.5 py-1.5 text-[10px] font-black text-amber-950 shadow-[0_2px_0_#92400e] active:translate-y-0.5 active:shadow-none">
                  🏆 랭킹
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-[10px] font-black text-slate-700">로그인하면 랭킹에 참여할 수 있어요</p>
              <div className="flex shrink-0 gap-1.5">
                <button type="button" onClick={handleRankingOpen} className="rounded-xl bg-amber-400 px-2.5 py-1.5 text-[10px] font-black text-amber-950 shadow-[0_2px_0_#92400e] active:translate-y-0.5 active:shadow-none">🏆</button>
                <button type="button" onClick={() => setIsLoginOpen(true)} disabled={isAuthLoading} className="rounded-xl border-2 border-[#3c1e1e] bg-[#FEE500] px-3 py-1.5 text-[10px] font-black text-[#191919] shadow-[0_2px_0_#3c1e1e] active:translate-y-0.5 active:shadow-none disabled:opacity-50">
                  로그인
                </button>
              </div>
            </>
          )}
        </div>

        <div className="grid grid-cols-2 divide-x-[3px] divide-cyan-950/40 overflow-hidden rounded-[1.4rem] border-[3px] border-cyan-950/70 bg-gradient-to-b from-cyan-300 via-cyan-400 to-cyan-600 text-white shadow-[0_7px_0_rgba(8,51,68,0.9),0_12px_24px_rgba(0,0,0,0.3)]">
          <div
            className="relative cursor-pointer px-4 py-3 before:pointer-events-none before:absolute before:inset-x-2 before:top-1 before:h-1/3 before:rounded-full before:bg-white/20"
            role="button"
            tabIndex={0}
            onClick={handleNutrientPanelClick}
            onDoubleClick={handleResetModalOpen}
            onKeyDown={(event) => {
              if (event.key === 'Enter') handleResetModalOpen();
            }}
          >
            <div className="relative flex items-center gap-1.5 text-[10px] font-black uppercase text-cyan-950">
              <span aria-hidden="true">💰</span>
              <span>영양분</span>
            </div>
            <p className="relative mt-0.5 truncate text-2xl font-black text-white drop-shadow-[0_2px_0_#155e75]">
              {formatNumber(gold)}
            </p>
          </div>

          <div className="relative px-4 py-3 before:pointer-events-none before:absolute before:inset-x-2 before:top-1 before:h-1/3 before:rounded-full before:bg-white/20">
            <div className="relative flex items-center gap-1.5 text-[10px] font-black uppercase text-cyan-950">
              <span aria-hidden="true">⚡</span>
              <span>초당 생산량</span>
            </div>
            <p className="relative mt-0.5 truncate text-2xl font-black text-lime-200 drop-shadow-[0_2px_0_#166534]">
              +{formatNumber(dps)}
              <span className="ml-1 text-xs font-bold text-cyan-50">/초</span>
            </p>
          </div>
        </div>

        <div className="rounded-2xl border-[3px] border-amber-950/70 bg-gradient-to-b from-white to-[#fff2dc] px-3 py-2 text-slate-900 shadow-[0_5px_0_#78350f,0_9px_18px_rgba(0,0,0,0.22)]">
          <div className="flex items-center justify-between gap-2">
            <p className="min-w-0 truncate text-xs font-black text-slate-800">
              {currentPoop.badge} {currentPoop.name} Lv.{poopLevel}
            </p>
            <p className="shrink-0 rounded-full bg-orange-400 px-2 py-0.5 text-[10px] font-black text-white shadow-[0_2px_0_#9a3412]">
              클릭 +{formatNumber(clickPower)}
            </p>
          </div>
          <div className="mt-1.5 h-2.5 overflow-hidden rounded-full border-2 border-slate-800/70 bg-slate-200 shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-300 to-orange-400 transition-all duration-300"
              style={{ width: `${evolutionProgress}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 rounded-xl border-[3px] border-red-900/80 bg-gradient-to-b from-orange-300 to-red-400 px-3 py-2 text-red-950 shadow-[0_4px_0_#7f1d1d]">
          <p className="min-w-0 truncate text-[10px] font-black">
            📍 {toilets[currentToiletLevel].name}
          </p>
          <p className="shrink-0 text-[9px] font-bold">
            변기 +{formatNumber(toiletDps)} · 캐릭터 +{formatNumber(characterDps)} · 장비 {activeCleaningItems.length}종 +{formatNumber(itemDps)}/초
            <span className="block mt-1">총자산 {formatNumber(growth.state?.totalAssets ?? gold)} · 투자 {formatNumber(growth.state?.invested ?? 0)}</span>
          </p>
        </div>
      </div>

      {/* ==================== 중앙: 똥 클릭 버튼 ==================== */}
      <div
        className="relative flex min-h-0 w-full flex-1 cursor-pointer flex-col items-center justify-center py-2"
        onClick={handlePoopClick}
      >
        {/* 구매한 청소 장비가 변기 주변 슬롯에 나타나는 전시 레이어 */}
        <div className="pointer-events-none absolute inset-0 z-10" aria-label="사용 중인 청소 장비">
          {activeCleaningItems.map((item) => {
            const level = itemLevels[item.id] ?? 0;

            return (
              <div
                key={item.id}
                className="absolute flex flex-col items-center"
                style={{
                  ...item.placement,
                  animation: 'equipmentFloat 2.8s ease-in-out infinite',
                  animationDelay: `${item.id * -0.35}s`,
                }}
              >
                <img
                  src={item.icon}
                  alt=""
                  className="h-14 w-14 object-contain drop-shadow-[0_8px_10px_rgba(0,0,0,0.45)] sm:h-16 sm:w-16"
                  aria-hidden="true"
                />
                <span className="mt-0.5 max-w-20 truncate rounded bg-slate-950/65 px-2 py-0.5 text-[9px] font-black text-white shadow-lg backdrop-blur-sm">
                  Lv.{level} · {item.name}
                </span>
              </div>
            );
          })}
        </div>

        {(cleanerEvent || cleanerMessage) && (
          <div className="pointer-events-auto absolute left-1/2 top-2 z-40 w-[min(100%,360px)] -translate-x-1/2 rounded-lg border border-emerald-200/80 bg-emerald-950/90 p-3 text-white shadow-2xl backdrop-blur-md">
            {cleanerEvent ? (
              <>
                <div className="flex items-center justify-between gap-3">
                  <img
                    src={cleanerBrushSwingImage}
                    alt="함께 청소하는 청소 아주머니"
                    className="h-20 w-20 shrink-0 object-contain drop-shadow-2xl"
                    style={{ animation: 'cleanerSwing 0.78s ease-in-out infinite' }}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-black">🧽 청소를 도와주세요!</p>
                    <p className="mt-0.5 text-[11px] font-semibold text-emerald-100">
                      {cleanerEvent.timeLeft}초 안에 {cleanerRequiredHelps - cleanerEvent.helps}번 더 도와주세요
                    </p>
                    <p className="mt-0.5 text-[10px] font-bold text-emerald-200">
                      완료 시 보유 영양분의 10% 선물!
                    </p>
                  </div>
                  <div className="shrink-0 rounded-full bg-white px-2.5 py-1 text-sm font-black text-emerald-700">
                    {cleanerEvent.timeLeft}s
                  </div>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/20">
                  <div
                    className="h-full rounded-full bg-emerald-300 transition-all duration-200"
                    style={{
                      width: `${(cleanerEvent.helps / cleanerRequiredHelps) * 100}%`,
                    }}
                  />
                </div>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    handleCleanerHelp();
                  }}
                  disabled={growth.pending}
                  className="mt-3 w-full rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-black text-white shadow-lg transition-all hover:bg-emerald-400 active:scale-95 disabled:opacity-60"
                >
                  🧽 청소 도와주기
                </button>
              </>
            ) : (
              <p className="text-center text-sm font-black">{cleanerMessage}</p>
            )}
          </div>
        )}

      </div>

      <SeatedPoop
        toiletId={currentToiletLevel}
        poopId={currentPoop.id}
        spriteBounds={currentSkin?.bounds}
        name={currentPoop.name}
        clicking={isClicking}
        onClick={handlePoopClick}
        feedback={formatNumber(clickPower)}
      >
        {activeCleaningItems.length >= 1 && (
            <>
              <span className="absolute -left-5 top-3 text-2xl" style={{ animation: 'cleaningSparkle 1.8s ease-in-out infinite' }} aria-hidden="true">🫧</span>
              <span className="absolute -right-4 bottom-3 text-xl" style={{ animation: 'cleaningSparkle 1.8s ease-in-out infinite .6s' }} aria-hidden="true">🫧</span>
            </>
        )}
        {activeCleaningItems.length >= 3 && (
            <span className="absolute -right-5 top-8 text-2xl" style={{ animation: 'cleaningSparkle 1.4s ease-in-out infinite .2s' }} aria-hidden="true">✨</span>
        )}
        {activeCleaningItems.length >= 5 && (
            <span className="absolute -left-5 bottom-8 text-2xl" style={{ animation: 'cleaningSparkle 1.2s ease-in-out infinite .4s' }} aria-hidden="true">💨</span>
        )}
        {isSaveLoaded && renderPoopAvatar(currentPoop, poopLevel, equippedCosmetics, 'seat-poop-image')}
      </SeatedPoop>

      {/* ==================== 하단: 성장 상점 버튼 ==================== */}
      <div className="relative z-30 grid w-full shrink-0 grid-cols-3 gap-2">
        <button
          onClick={() => {
            setPoopShopTab('upgrade');
            setIsPoopShopOpen(true);
          }}
          className="flex min-h-[62px] flex-col items-center justify-center rounded-[1.35rem] border-[3px] border-amber-700 bg-gradient-to-b from-yellow-300 via-amber-300 to-amber-500 px-2 py-1.5 text-[11px] font-black text-amber-950 shadow-[0_6px_0_#92400e,0_10px_16px_rgba(0,0,0,0.26)] transition-all hover:brightness-105 active:translate-y-1 active:shadow-[0_2px_0_#92400e]"
        >
          <span className="text-2xl drop-shadow-sm" aria-hidden="true">💩</span>
          <span className="mt-0.5">똥 강화</span>
        </button>
        <button
          onClick={() => setIsItemShopOpen(true)}
          className="flex min-h-[62px] flex-col items-center justify-center rounded-[1.35rem] border-[3px] border-teal-800 bg-gradient-to-b from-cyan-300 via-teal-300 to-teal-500 px-2 py-1.5 text-[11px] font-black text-teal-950 shadow-[0_6px_0_#115e59,0_10px_16px_rgba(0,0,0,0.26)] transition-all hover:brightness-105 active:translate-y-1 active:shadow-[0_2px_0_#115e59]"
        >
          <span className="text-2xl drop-shadow-sm" aria-hidden="true">🧹</span>
          <span className="mt-0.5">청소 장비</span>
        </button>
        <button
          onClick={() => setIsShopOpen(true)}
          className="flex min-h-[62px] flex-col items-center justify-center rounded-[1.35rem] border-[3px] border-orange-800 bg-gradient-to-b from-orange-300 via-orange-300 to-red-400 px-2 py-1.5 text-[11px] font-black text-red-950 shadow-[0_6px_0_#9a3412,0_10px_16px_rgba(0,0,0,0.26)] transition-all hover:brightness-105 active:translate-y-1 active:shadow-[0_2px_0_#9a3412]"
        >
          <span className="text-2xl drop-shadow-sm" aria-hidden="true">🚽</span>
          <span className="mt-0.5">화장실 공방</span>
        </button>
      </div>

      {!isAuthLoading && !authUser && isLoginOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/65 p-4">
          <div className="max-h-[88vh] w-full max-w-sm overflow-y-auto rounded-[1.75rem] border-[3px] border-amber-950 bg-[#fff8e8] p-5 text-center text-slate-900 shadow-[0_8px_0_#78350f,0_18px_40px_rgba(0,0,0,0.45)]">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border-[3px] border-amber-800 bg-amber-200 text-3xl shadow-[0_4px_0_#92400e]">
              💩
            </div>
            <h2 className="mt-4 text-xl font-black">카카오 로그인</h2>
            <p className="mt-2 break-keep text-sm font-bold text-slate-600">
              로그인하면 온라인 저장과 랭킹을 이용할 수 있어요.
            </p>
            <button
              type="button"
              onClick={handleKakaoLogin}
              disabled={isAuthLoading}
              className="mt-5 w-full rounded-2xl border-2 border-[#3c1e1e] bg-[#FEE500] px-4 py-3 text-sm font-black text-[#191919] shadow-[0_4px_0_#3c1e1e] active:translate-y-0.5 active:shadow-none disabled:opacity-50"
            >
              카카오톡으로 시작하기
            </button>
            <button
              type="button"
              onClick={() => {
                setLocalAuthMode(localAuthMode === 'hidden' ? 'login' : 'hidden');
                resetLocalAuthForm();
              }}
              className="mt-3 w-full rounded-2xl border-2 border-amber-950 bg-white px-4 py-3 text-sm font-black text-amber-950 shadow-[0_4px_0_#78350f] active:translate-y-0.5 active:shadow-none"
            >
              다른 계정으로 시작하기
            </button>
            <button
              type="button"
              onClick={handleGuestPlay}
              className="mt-3 w-full rounded-2xl border-2 border-teal-800 bg-teal-100 px-4 py-3 text-sm font-black text-teal-950 shadow-[0_4px_0_#115e59] active:translate-y-0.5 active:shadow-none"
            >
              로그인 안 하고 게임하기
            </button>
            <p className="mt-3 text-xs font-bold text-slate-500">
              로그인 없이 플레이한 기록은 이 브라우저에 저장돼요. 로그인 플레이의 이용 시간·클릭·진행 기록은 게임 개선을 위해 수집합니다. 닉네임·프로필 사진·성장 정보는 랭킹에 공개됩니다.
            </p>
            <p className="mt-2 text-xs text-amber-900"><a className="underline" href="/privacy.html">개인정보처리방침</a> · <a className="underline" href="/account.html">계정 및 데이터 삭제</a></p>

            {localAuthMode !== 'hidden' && (
              <div className="mt-4 rounded-2xl border-2 border-amber-200 bg-white/80 p-3 text-left">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setLocalAuthMode('login');
                      resetLocalAuthForm();
                    }}
                    className={`rounded-xl px-3 py-2 text-xs font-black ${
                      localAuthMode === 'login'
                        ? 'bg-amber-400 text-amber-950 shadow-[0_2px_0_#92400e]'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    로그인
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLocalAuthMode('register');
                      resetLocalAuthForm();
                    }}
                    className={`rounded-xl px-3 py-2 text-xs font-black ${
                      localAuthMode === 'register'
                        ? 'bg-amber-400 text-amber-950 shadow-[0_2px_0_#92400e]'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    회원가입
                  </button>
                </div>

                <label className="mt-3 block text-[10px] font-black text-slate-700" htmlFor="local-login-id">
                  아이디
                </label>
                <input
                  id="local-login-id"
                  type="text"
                  value={localLoginId}
                  onChange={(event) => {
                    setLocalLoginId(event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20));
                    setLocalAuthStatus('idle');
                  }}
                  placeholder="영문/숫자 4~20자"
                  autoCapitalize="none"
                  autoCorrect="off"
                  className="mt-1 w-full rounded-xl border-2 border-amber-200 bg-white px-3 py-2.5 text-sm font-black text-slate-900 outline-none focus:border-amber-700"
                />

                <label className="mt-2 block text-[10px] font-black text-slate-700" htmlFor="local-password">
                  비밀번호
                </label>
                <input
                  id="local-password"
                  type="password"
                  value={localPassword}
                  onChange={(event) => {
                    setLocalPassword(event.target.value.slice(0, 72));
                    setLocalAuthStatus('idle');
                  }}
                  placeholder="6자 이상"
                  className="mt-1 w-full rounded-xl border-2 border-amber-200 bg-white px-3 py-2.5 text-sm font-black text-slate-900 outline-none focus:border-amber-700"
                />

                {localAuthMode === 'register' && (
                  <>
                    <label className="mt-2 block text-[10px] font-black text-slate-700" htmlFor="local-nickname">
                      랭킹 닉네임
                    </label>
                    <input
                      id="local-nickname"
                      type="text"
                      value={localNickname}
                      onChange={(event) => {
                        setLocalNickname(event.target.value.slice(0, 12));
                        setLocalAuthStatus('idle');
                      }}
                      placeholder="2~12글자"
                      className="mt-1 w-full rounded-xl border-2 border-amber-200 bg-white px-3 py-2.5 text-sm font-black text-slate-900 outline-none focus:border-amber-700"
                      maxLength={12}
                    />
                  </>
                )}

                <p className={`mt-2 min-h-4 text-[10px] font-bold ${
                  ['idle', 'loading'].includes(localAuthStatus) ? 'text-slate-500' : 'text-red-600'
                }`}>
                  {localAuthStatus === 'idle' && '아이디는 영문, 숫자, 밑줄만 사용할 수 있어요.'}
                  {localAuthStatus === 'loading' && '처리 중...'}
                  {localAuthStatus === 'invalid_id' && '아이디는 영문/숫자/밑줄 4~20자로 입력해주세요.'}
                  {localAuthStatus === 'invalid_password' && '비밀번호는 6자 이상 입력해주세요.'}
                  {localAuthStatus === 'invalid_nickname' && '닉네임은 2~12글자로 입력해주세요.'}
                  {localAuthStatus === 'taken' && '이미 사용 중인 아이디예요.'}
                  {localAuthStatus === 'error' && '로그인 또는 회원가입에 실패했어요.'}
                </p>

                <button
                  type="button"
                  onClick={handleLocalAuthSubmit}
                  disabled={localAuthStatus === 'loading'}
                  className="mt-2 w-full rounded-xl bg-slate-800 px-4 py-3 text-sm font-black text-white shadow-[0_3px_0_#0f172a] active:translate-y-0.5 active:shadow-none disabled:opacity-60"
                >
                  {localAuthMode === 'register' ? '회원가입하고 시작하기' : '로그인하고 시작하기'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {isProfileOpen && authUser && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/65 p-4" onClick={() => setIsProfileOpen(false)}>
          <div
            className="w-full max-w-sm rounded-[1.75rem] border-[3px] border-amber-950 bg-[#fff8e8] p-4 text-slate-900 shadow-[0_8px_0_#78350f,0_18px_40px_rgba(0,0,0,0.45)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              {authUser.profileImage ? (
                <img src={authUser.profileImage} alt="" className="h-12 w-12 rounded-full border-2 border-amber-900 object-cover" />
              ) : (
                <span className="grid h-12 w-12 place-items-center rounded-full bg-amber-200 text-lg">👤</span>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-black">{authUser.nickname}</p>
                <p className="truncate text-[10px] font-bold text-slate-500">
                  가입 이름: {authUser.kakaoNickname || authUser.nickname}
                </p>
              </div>
            </div>

            <label className="mt-4 block text-xs font-black text-amber-950" htmlFor="profile-nickname">
              랭킹 닉네임
            </label>
            <input
              id="profile-nickname"
              type="text"
              value={profileNicknameDraft}
              onChange={(event) => {
                setProfileNicknameDraft(event.target.value.slice(0, 12));
                setProfileSaveStatus('idle');
              }}
              className="mt-1 w-full rounded-xl border-2 border-amber-300 bg-white px-3 py-3 text-sm font-black text-slate-900 outline-none focus:border-amber-700"
              maxLength={12}
            />
            <p className={`mt-1 text-[10px] font-bold ${
              profileSaveStatus === 'error' || profileSaveStatus === 'invalid' ? 'text-red-600' : 'text-slate-500'
            }`}>
              {profileSaveStatus === 'saving' && '저장 중...'}
              {profileSaveStatus === 'saved' && '저장됐어요. 랭킹에 이 이름으로 보여요.'}
              {profileSaveStatus === 'invalid' && '닉네임은 2~12글자로 입력해주세요.'}
              {profileSaveStatus === 'error' && '저장에 실패했어요. 잠시 후 다시 시도해주세요.'}
              {profileSaveStatus === 'idle' && '2~12글자까지 사용할 수 있어요.'}
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleProfileSave}
                disabled={profileSaveStatus === 'saving'}
                className="rounded-xl bg-amber-400 px-3 py-3 text-sm font-black text-amber-950 shadow-[0_3px_0_#92400e] active:translate-y-0.5 active:shadow-none disabled:opacity-60"
              >
                저장
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-xl bg-slate-700 px-3 py-3 text-sm font-black text-white shadow-[0_3px_0_#0f172a] active:translate-y-0.5 active:shadow-none"
              >
                로그아웃
              </button>
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-3 text-xs text-amber-900"><a className="underline" href="/privacy.html">개인정보처리방침</a><a className="underline" href="/account.html">계정 및 데이터 삭제</a></div>
          </div>
        </div>
      )}

      {growth.error && <div role="alert" className="fixed bottom-24 left-1/2 z-[90] w-[90%] max-w-sm -translate-x-1/2 rounded-xl bg-red-950 p-3 text-sm text-white">{growth.error}<button onClick={growth.refresh} className="ml-2 underline">다시 연결</button></div>}
      {growth.offlineReward && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-5">
        <section role="dialog" aria-modal="true" aria-label="오프라인 수익" className="w-full max-w-sm rounded-3xl border-4 border-amber-950 bg-amber-50 p-6 text-center shadow-xl">
          <p className="text-4xl">💤💰</p><h2 className="mt-3 text-xl font-black text-amber-950">돌아오셨네요!</h2>
          <p className="mt-2 text-sm text-amber-900">자리를 비운 동안 똥이 코인을 모았어요.</p>
          <p className="my-4 text-3xl font-black text-amber-700">+{formatNumber(growth.offlineReward.gold)}</p>
          <p className="text-xs text-amber-900">이미 잔액에 더했어요. 첫 8시간 50%, 이후 16시간 25% 생산 · 최대 24시간</p>
          <button onClick={growth.dismissOffline} className="mt-5 w-full rounded-xl bg-amber-400 py-3 font-black text-amber-950">확인하고 키우기</button>
        </section></div>}
      {isRankingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => {
          setIsRankingOpen(false);
          setSelectedRankingUser(null);
        }}>
          <div className="w-full max-w-sm overflow-hidden rounded-[1.75rem] border-[3px] border-amber-950 bg-[#fff8e8] shadow-[0_8px_0_#78350f,0_18px_40px_rgba(0,0,0,0.4)]" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b-[3px] border-amber-950 bg-gradient-to-b from-yellow-300 to-amber-400 px-4 py-3">
              <div>
                <h2 className="text-lg font-black text-amber-950">🏆 전체 랭킹</h2>
                <p className="text-[10px] font-bold text-amber-900">누적 레벨순 · 같은 레벨은 총자산순</p>
              </div>
              <button type="button" onClick={() => {
                setIsRankingOpen(false);
                setSelectedRankingUser(null);
              }} className="rounded-xl border-2 border-amber-950 bg-white/80 px-2.5 py-1 text-lg font-black text-amber-950 shadow-[0_3px_0_#78350f]">✕</button>
            </div>
            <div className="max-h-[55vh] space-y-2 overflow-y-auto p-3">
              {isRankingLoading ? (
                <p className="py-8 text-center text-sm font-bold text-slate-500">랭킹을 불러오는 중...</p>
              ) : rankings.length === 0 ? (
                <p className="py-8 text-center text-sm font-bold text-slate-500">아직 등록된 점수가 없어요.</p>
              ) : rankings.map((entry, index) => {
                const rankingPoopProgress = normalizePoopProgress(entry);
                const rankingPoop = poopCharacters[rankingPoopProgress.selectedPoopId] ?? poopCharacters[0];
                const rankingPoopLevel = entry.cumulativeLevel ?? entry.poopLevel ?? 1;
                const rankingToilet = toilets[normalizeToiletLevel(entry.toiletLevel, entry.toiletSchemaVersion)] ?? toilets[0];
                const ownedItems = cleaningItems.filter((item) => (entry.itemLevels?.[item.id] ?? 0) > 0);
                const rankingCosmetics = normalizeCosmetics(entry.cosmetics);
                const rankingHat = getCosmeticOption('hat', rankingCosmetics.hat);
                const rankingSkin = getSkin(rankingPoop.id, rankingCosmetics);
                const rankingTitleText = rankingCosmetics.titleText.trim();

                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => setSelectedRankingUser(entry)}
                    className={`w-full rounded-2xl border-2 px-3 py-2 text-left transition-transform active:scale-[0.99] ${entry.id === authUser?.id ? 'border-amber-500 bg-yellow-100' : 'border-amber-900/20 bg-white'}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-7 shrink-0 text-center text-base font-black text-amber-900">{index < 3 ? ['🥇', '🥈', '🥉'][index] : index + 1}</span>
                      {entry.profileImage ? <img src={entry.profileImage} alt="" className="h-9 w-9 rounded-full border-2 border-amber-800 object-cover" /> : <span className="grid h-9 w-9 place-items-center rounded-full bg-amber-200">👤</span>}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-black text-slate-800">{entry.nickname}{entry.id === authUser?.id ? ' (나)' : ''}</p>
                        <p className="truncate text-[9px] font-bold text-slate-500">
                          {rankingTitleText ? `🏷️ ${rankingTitleText} · ` : ''}총자산 {formatNumber(entry.totalAssets)} 💰
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-black text-amber-700">Lv.{rankingPoopLevel}</p>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-1.5 border-t border-amber-900/15 pt-2 text-[9px] font-bold text-slate-700">
                      <div className="flex min-w-0 items-center gap-1.5 rounded-lg bg-amber-100/80 px-2 py-1">
                        <span className="relative flex h-7 w-7 shrink-0 items-center justify-center">
                          <VisibleSkin key={rankingSkin.key} src={rankingSkin.thumb} alt={rankingPoop.name} className="skin-thumb" />
                          {rankingCosmetics.outfit === 'none' && rankingHat?.id !== 'none' && (
                            <span className="absolute -right-2 -top-3 scale-50">
                              {renderCosmeticVisual(rankingHat, 'hat')}
                            </span>
                          )}
                        </span>
                        <span className="truncate">{rankingPoop.name} Lv.{rankingPoopLevel}</span>
                      </div>
                      <div className="flex min-w-0 items-center gap-1.5 rounded-lg bg-cyan-100/80 px-2 py-1">
                        <span className="text-lg" aria-hidden="true">🚽</span>
                        <span className="truncate">{rankingToilet.name}</span>
                      </div>
                    </div>
                    <div className="mt-1.5 flex min-h-8 items-center gap-1 rounded-lg bg-teal-50 px-2 py-1">
                      <span className="mr-0.5 shrink-0 text-[8px] font-black text-teal-800">장비</span>
                      {ownedItems.length > 0 ? ownedItems.map((item) => (
                        <span key={item.id} className="relative" title={`${item.name} Lv.${entry.itemLevels[item.id]}`}>
                          <img src={item.icon} alt={item.name} className="h-7 w-7 object-contain" />
                          <span className="absolute -bottom-1 -right-1 rounded bg-teal-800 px-1 text-[7px] font-black text-white">{entry.itemLevels[item.id]}</span>
                        </span>
                      )) : <span className="text-[8px] font-bold text-slate-400">보유 장비 없음</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedRankingUser && (() => {
            const profilePoopProgress = normalizePoopProgress(selectedRankingUser);
            const profilePoop = poopCharacters[profilePoopProgress.selectedPoopId] ?? poopCharacters[0];
            const profilePoopLevel = selectedRankingUser.cumulativeLevel ?? selectedRankingUser.poopLevel ?? 1;
            const profileToilet = toilets[normalizeToiletLevel(selectedRankingUser.toiletLevel, selectedRankingUser.toiletSchemaVersion)] ?? toilets[0];
            const profileItems = cleaningItems.filter((item) => (selectedRankingUser.itemLevels?.[item.id] ?? 0) > 0);
            const profileCosmetics = normalizeCosmetics(selectedRankingUser.cosmetics);
            const profileTitleText = profileCosmetics.titleText.trim();

            return (
              <div
                className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"
                onClick={() => setSelectedRankingUser(null)}
              >
                <div
                  className="max-h-[86vh] w-full max-w-sm overflow-hidden rounded-[1.75rem] border-[3px] border-cyan-950 bg-[#fff8e8] text-slate-900 shadow-[0_8px_0_#083344,0_18px_40px_rgba(0,0,0,0.45)]"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div
                    className="relative min-h-56 overflow-hidden border-b-[3px] border-cyan-950 p-4"
                    style={{
                      backgroundImage: profileToilet.image ? `url(${profileToilet.image})` : undefined,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-black/45" />
                    <div className="relative z-10 flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2 rounded-2xl bg-white/90 px-3 py-2 shadow-lg">
                        {selectedRankingUser.profileImage ? (
                          <img src={selectedRankingUser.profileImage} alt="" className="h-9 w-9 rounded-full border-2 border-amber-900 object-cover" />
                        ) : (
                          <span className="grid h-9 w-9 place-items-center rounded-full bg-amber-200 text-sm">👤</span>
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black">{selectedRankingUser.nickname}</p>
                          <p className="truncate text-[10px] font-bold text-slate-500">
                            {profileTitleText ? `🏷️ ${profileTitleText}` : '대표 화장실'}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedRankingUser(null)}
                        className="rounded-xl border-2 border-cyan-950 bg-white/90 px-2.5 py-1 text-lg font-black text-cyan-950 shadow-[0_3px_0_#083344]"
                        aria-label="유저 쇼룸 닫기"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="relative z-10 mt-8 flex flex-col items-center">
                      <div className="relative flex h-36 w-36 items-center justify-center">
                        {renderPoopAvatar(
                          profilePoop,
                          profilePoopLevel,
                          profileCosmetics,
                          'h-32 w-32 object-contain drop-shadow-[0_12px_18px_rgba(0,0,0,0.45)]',
                          'absolute -right-1 -top-1 text-3xl drop-shadow-lg',
                          false
                        )}
                      </div>
                      <span className="mt-2 rounded-full border-2 border-amber-950 bg-amber-300 px-3 py-1 text-xs font-black text-amber-950 shadow-[0_3px_0_#78350f]">
                        {profilePoop.badge} {profilePoop.name} Lv.{profilePoopLevel}
                      </span>
                    </div>
                  </div>

                  <div className="max-h-[42vh] overflow-y-auto p-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-2xl bg-cyan-100 px-3 py-2">
                        <p className="text-[10px] font-black text-cyan-800">영양분</p>
                        <p className="mt-1 text-base font-black">{formatNumber(selectedRankingUser.gold)}</p>
                      </div>
                      <div className="rounded-2xl bg-lime-100 px-3 py-2">
                        <p className="text-[10px] font-black text-lime-800">초당 생산량</p>
                        <p className="mt-1 text-base font-black">+{formatNumber(selectedRankingUser.dps)}/초</p>
                      </div>
                    </div>

                    <div className="mt-3 rounded-2xl border-2 border-orange-200 bg-orange-50 p-3">
                      <p className="text-[10px] font-black text-orange-800">화장실</p>
                      <p className="mt-1 text-sm font-black">{profileToilet.name}</p>
                      <p className="mt-0.5 text-xs font-bold text-orange-700">화장실 생산 보너스 +{profileToilet.id * 5}%</p>
                    </div>

                    <div className="mt-3 rounded-2xl border-2 border-teal-200 bg-teal-50 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[10px] font-black text-teal-800">장착 장비</p>
                        <p className="text-[10px] font-bold text-teal-700">{profileItems.length}종 보유</p>
                      </div>
                      <div className="mt-2 grid grid-cols-3 gap-2">
                        {profileItems.length > 0 ? profileItems.map((item) => (
                          <div key={item.id} className="flex flex-col items-center rounded-xl bg-white px-2 py-2">
                            <img src={item.icon} alt="" className="h-10 w-10 object-contain" />
                            <p className="mt-1 max-w-full truncate text-[9px] font-black text-slate-700">{item.name}</p>
                            <p className="text-[9px] font-bold text-teal-700">Lv.{selectedRankingUser.itemLevels[item.id]}</p>
                          </div>
                        )) : (
                          <p className="col-span-3 py-4 text-center text-xs font-bold text-slate-400">아직 전시할 장비가 없어요.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {isResetConfirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={handleResetModalClose}
        >
          <div
            className="w-full max-w-xs rounded-[1.75rem] border-[3px] border-cyan-950 bg-[#fff8e8] p-5 text-gray-900 shadow-[0_8px_0_#083344,0_18px_40px_rgba(0,0,0,0.4)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-black">게임 초기화</h2>
              <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-black text-white">
                v{appVersion}
              </span>
            </div>
            <p className="mt-2 text-sm font-semibold text-gray-600">
              영양분, 똥 레벨, 장비, 부품과 화장실을 처음으로 되돌릴까요? 똥 토큰과 무료 보상 수령 기록은 유지돼요.
            </p>
            {economy.error && <p className="mt-2 text-xs font-bold text-emerald-700" role="alert">{economy.error}</p>}
            {isDeveloperModeOpen && (
              <div className="mt-4 rounded-xl border-2 border-yellow-300 bg-yellow-50 p-3">
                <p className="text-sm font-black text-yellow-900">개발자 모드</p>
                <p className="mt-1 text-xs font-semibold text-yellow-800">
                  밸런스 테스트용 영양분을 즉시 충전해요.
                </p>
                <button
                  onClick={handleDeveloperGoldCharge}
                  className="mt-3 w-full rounded-lg bg-yellow-500 px-4 py-2.5 text-sm font-black text-white transition-colors hover:bg-yellow-600 active:scale-95"
                >
                  영양분 {formatNumber(developerGoldAmount)} 받기
                </button>
              </div>
            )}
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                onClick={handleResetModalClose}
                className="rounded-lg bg-gray-200 px-4 py-3 text-sm font-bold text-gray-800 transition-colors hover:bg-gray-300"
              >
                취소
              </button>
              <button
                onPointerUp={(event) => {
                  event.preventDefault();
                  handleResetButtonClick();
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') handleResetButtonClick();
                }}
                className="rounded-lg bg-red-500 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-red-600"
              >
                {isDeveloperModeOpen ? '게임 초기화' : '초기화'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 모달: 똥 레벨 강화 ==================== */}
      {isPoopShopOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-3">
          <div className={`flex w-full max-w-[440px] flex-col overflow-hidden rounded-t-[1.75rem] border-[3px] border-b-0 border-cyan-950 bg-[#fff8e8] shadow-2xl ${poopShopTab === 'cosmetics' ? 'skin-dialog' : 'max-h-[86vh]'}`}>
            <div className="flex shrink-0 items-center justify-between border-b-[3px] border-cyan-950 bg-gradient-to-b from-cyan-400 to-cyan-600 px-4 py-3 text-white">
              <div>
                <h2 className="text-xl font-black">{poopShopTab === 'cosmetics' ? '🎀 똥 꾸미기' : '💩 똥 강화'}</h2>
                <p className="mt-1 text-xs font-semibold text-cyan-950">{poopShopTab === 'cosmetics' ? '키우고, 놀고, 나만의 스타일을 모아요' : '레벨은 계속 이어지고, 진화하면 더 강해져요'}</p>
              </div>
              <button
                onClick={() => setIsPoopShopOpen(false)}
                className="rounded-xl border-2 border-cyan-950 bg-white/80 px-2.5 py-1 text-xl font-black text-cyan-950 shadow-[0_3px_0_#083344] active:translate-y-0.5"
                aria-label="똥 강화 상점 닫기"
              >
                ✕
              </button>
            </div>

            <div className="shrink-0 border-b border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-900">
              <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setPoopShopTab('upgrade')}
                  className={`rounded-xl px-3 py-2 text-xs font-black transition-all ${
                    poopShopTab === 'upgrade'
                      ? 'bg-cyan-500 text-white shadow-[0_3px_0_#155e75]'
                      : 'text-slate-500'
                  }`}
                >
                  똥 강화
                </button>
                <button
                  type="button"
                  onClick={() => { if (poopShopTab !== 'cosmetics') track('wardrobeOpens'); setPoopShopTab('cosmetics'); }}
                  className={`rounded-xl px-3 py-2 text-xs font-black transition-all ${
                    poopShopTab === 'cosmetics'
                      ? 'bg-teal-500 text-white shadow-[0_3px_0_#115e59]'
                      : 'text-slate-500'
                  }`}
                >
                  똥 꾸미기
                </button>
              </div>
              {poopShopTab === 'upgrade' && <><div className="mt-3 flex items-center justify-between gap-3">
                <span>현재 {currentPoop.badge} {currentPoop.name} Lv.{poopLevel}</span>
                <span className="shrink-0 rounded bg-amber-400 px-2.5 py-1 text-xs text-slate-950">
                  +{formatNumber(clickPower)} 클릭
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-2 text-xs text-slate-500">
                <span>기본 클릭 +{formatNumber(baseClickPower)} · 자동 보너스 +{formatNumber(activeClickBonus)}</span>
                <span>
                  {nextPoop
                    ? canEvolvePoop
                    ? `${nextPoop.name} 진화 가능`
                    : `${nextPoop.name}까지 ${unlockedPoop.evolutionLevel - poopLevel}레벨`
                    : '황금똥 · 레벨 제한 없이 계속 성장'}
                </span>
              </div></>}
            </div>

            <div className={poopShopTab === 'cosmetics' ? 'min-h-0 flex-1 overflow-hidden p-3' : 'flex-1 space-y-3 overflow-y-auto p-4'}>
              {poopShopTab === 'cosmetics' && (
                <SkinPicker key={currentPoop.id} poop={currentPoop} cosmetics={equippedCosmetics} rewards={wardrobeRewards} ready={wardrobeReady}
                  onEquip={async style => {
                    if (!wardrobeReady) return false;
                    const next = availableCosmetics(style, wardrobeRewards);
                    if (authUser) {
                      setCloudSaveStatus('saving');
                      try {
                        const response = await fetch('/api/game-save', {
                          method: 'POST', headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ ...gameSaveRef.current, cosmetics: next }),
                        });
                        if (!response.ok) throw new Error('skin_save_failed');
                        setCloudSaveStatus('saved');
                      } catch {
                        // Keep the previously saved outfit; the picker reports
                        // this failed attempt and remains available for retry.
                        setCloudSaveStatus('saved');
                        return false;
                      }
                    }
                    setCosmetics(next);
                    track('skinEquips');
                    return true;
                  }}
                  onGoal={destination => {
                    if (destination === 'growth') setPoopShopTab('upgrade');
                    if (destination === 'workshop') { setIsPoopShopOpen(false); setIsShopOpen(true); }
                    if (destination === 'puzzle') window.location.assign('/minigame');
                  }} />
              )}

              {poopShopTab === 'upgrade' && (
              <>
              <div className="rounded-2xl border-[3px] border-amber-700 bg-amber-50 p-4 shadow-[0_5px_0_#92400e]">
                <div className="flex items-center gap-3">
                  <div className="poop-upgrade-portrait">
                    <PoopPortrait poop={{...currentPoop, image: currentSkin?.image ?? currentPoop.image}} spriteBounds={currentSkin?.bounds} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-black text-gray-900">
                      {currentPoop.name} Lv.{poopLevel}
                    </h3>
                    <p className="mt-1 text-xs font-semibold text-gray-600">
                      다음 강화 비용 {formatNumber(poopUpgradePrice)} 💰
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs font-bold">
                      <span className="rounded bg-sky-50 px-2 py-1 text-sky-700">클릭 +{formatNumber(clickPower)}</span>
                      <span className="rounded bg-emerald-50 px-2 py-1 text-emerald-700">자동 +{formatNumber(characterDps)}/초</span>
                    </div>
                    {activeClickBonus > 0 && (
                      <p className="mt-2 text-[11px] font-bold text-slate-500">
                        직접 클릭 보정: 자동 생산량의 {Math.round(activeClickDpsBonusRate * 100)}%가 클릭에 추가돼요.
                      </p>
                    )}
                  </div>
                </div>

                {nextPoopStats && (poopLevels[nextPoop.id] ?? 0) === 0 && (
                  <div className="mt-3 rounded-xl bg-amber-100 p-3 text-xs font-bold text-amber-950">
                    <p>Lv.{unlockedPoop.evolutionLevel} 달성 시 {nextPoop.name}으로 자동 진화</p>
                    <p className="mt-1">진화 보너스 +25% · 누적 레벨과 투자 자산 유지</p>
                    <p className="mt-1">기본 클릭 {formatNumber(baseClickPower)} → {formatNumber(nextPoopStats.clickPower)} · 자동 {formatNumber(characterDps)} → {formatNumber(nextPoopStats.dps)}/초</p>
                  </div>
                )}
                <div className="mt-3 flex gap-2" aria-label="한 번에 강화할 레벨 수">
                  {[1,10,100].map(count=><button key={count} onClick={()=>setUpgradeCount(count)} aria-pressed={upgradeCount===count} className={`flex-1 rounded-xl py-2 text-sm font-black ${upgradeCount===count?'bg-amber-500 text-amber-950':'bg-amber-100 text-amber-800'}`}>×{count}</button>)}
                </div>
                <p className="mt-2 text-xs text-slate-600">보유 코인 안에서 강화해요. 사용한 코인은 투자 자산으로 남아요.</p>
                {canEvolvePoop ? (
                  <button
                    onClick={handlePoopEvolve}
                    className="mt-4 w-full rounded-2xl border-[3px] border-amber-700 bg-gradient-to-b from-amber-300 to-amber-500 py-2.5 font-black text-amber-950 shadow-[0_5px_0_#92400e] transition-all active:translate-y-1 active:shadow-[0_1px_0_#92400e]"
                  >
                    {nextPoop.badge} {nextPoop.name}으로 진화하기
                  </button>
                ) : (
                  <button
                    onClick={handlePoopLevelUp}
                    aria-busy={growth.pendingAction === 'upgrade'}
                    disabled={!growth.state || growth.pending || gold < poopUpgradePrice}
                    className={`mt-4 w-full rounded-2xl border-[3px] py-2.5 font-black transition-all ${
                      gold >= poopUpgradePrice
                        ? 'border-orange-800 bg-gradient-to-b from-orange-300 to-red-400 text-red-950 shadow-[0_5px_0_#9a3412] active:translate-y-1 active:shadow-[0_1px_0_#9a3412]'
                        : 'cursor-not-allowed border-slate-300 bg-gray-200 text-gray-500'
                    }`}
                  >
                    {growth.pendingAction === 'upgrade' ? '강화 중…' : <>{upgradeCount === 1 ? `Lv.${poopLevel + 1} 강화` : `최대 ${upgradeCount}레벨 강화`} · {formatNumber(poopUpgradePrice)} 💰부터</>}
                  </button>
                )}
              </div>

              <div className="h-5 text-center text-sm font-black text-emerald-700" role="status" aria-live="polite">
                {upgradeFeedback && <span key={upgradeFeedback.level} className="upgrade-feedback">강화 성공! +{upgradeFeedback.count}레벨 · Lv.{upgradeFeedback.level}</span>}
              </div>
              <GrowthRoadmap poopLevel={poopLevel} selectedId={currentPoop.id} />
              </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== 모달: 청소 장비 상점 ==================== */}
      {isItemShopOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-3">
          <div className="flex max-h-[86vh] w-full max-w-[440px] flex-col overflow-hidden rounded-t-[1.75rem] border-[3px] border-b-0 border-cyan-950 bg-[#fff8e8] shadow-2xl">
            <div className="flex items-center justify-between border-b-[3px] border-cyan-950 bg-gradient-to-b from-cyan-400 to-cyan-600 px-4 py-3 text-white">
              <div>
                <h2 className="text-xl font-black">🧰 청소 장비</h2>
                <p className="mt-1 text-xs font-semibold text-cyan-950">캐릭터가 성장하면 장비 효과도 함께 커져요</p>
              </div>
              <button
                onClick={() => setIsItemShopOpen(false)}
                className="rounded-xl border-2 border-cyan-950 bg-white/80 px-2.5 py-1 text-xl font-black text-cyan-950 shadow-[0_3px_0_#083344] active:translate-y-0.5"
                aria-label="청소 장비 상점 닫기"
              >
                ✕
              </button>
            </div>

            <div className="border-b border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900">
              장비 보너스 +{Math.round((growth.state?.equipmentBonus ?? 0)*100)}% · +{formatNumber(itemDps)}/초
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {recommendedEquipment && <div className="rounded-2xl border-2 border-teal-700 bg-teal-50 p-3 text-sm text-teal-950">
                <p className="font-black">추천 투자 · {recommendedEquipment.name}</p>
                <p className="mt-1 text-xs">구매 비용 대비 생산 증가가 가장 큰 장비예요. 투자액은 총자산에 남아요.</p>
                <button className="mt-2 w-full rounded-xl bg-teal-700 p-2 font-bold text-white disabled:opacity-40" disabled={growth.pending || gold < getItemPrice(recommendedEquipment,itemLevels[recommendedEquipment.id])} onClick={()=>handleItemPurchase(recommendedEquipment.id)}>추천 장비 강화 · {formatNumber(getItemPrice(recommendedEquipment,itemLevels[recommendedEquipment.id]))} 💰</button>
              </div>}
              {cleaningItems.map((item, index) => {
                const level = itemLevels[index] ?? 0;
                const price = getItemPrice(item, level);
                const isUnlocked = poopLevel >= equipment[index].unlockLevel;
                const canPurchase = isUnlocked && level < 5 && gold >= price && !growth.pending;

                return (
                  <div
                    key={item.id}
	                    className={`rounded-2xl border-[3px] p-4 shadow-[0_4px_0_rgba(15,23,42,0.22)] transition-all ${
	                      !isUnlocked
	                        ? 'border-slate-200 bg-slate-100 opacity-70'
	                        : canPurchase
	                        ? 'border-emerald-300 bg-emerald-50'
	                        : 'border-slate-200 bg-white'
	                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={item.icon}
                        alt=""
                        className="h-16 w-16 shrink-0 object-contain"
                        aria-hidden="true"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-bold text-gray-900">{item.name}</h3>
                          <span className="whitespace-nowrap rounded-full bg-gray-900 px-2 py-1 text-xs font-bold text-white">
                            Lv.{level}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">{item.description}</p>
                        <div className="mt-2 flex justify-between text-sm font-semibold">
                          <span className="text-blue-600">단계당 +{Math.round(equipment[index].bonus*100)}%</span>
                          <span className="text-emerald-700">총 +{Math.round(equipment[index].bonus*level*100)}%</span>
                        </div>
                      </div>
                    </div>

                    {!isUnlocked ? (
                      <div className="mt-3 rounded-lg bg-gray-200 py-2 text-center text-sm font-bold text-gray-600">
                        🔒 누적 Lv.{equipment[index].unlockLevel} 필요
                      </div>
                    ) : (
                      <button
                        onClick={() => handleItemPurchase(item.id)}
                        disabled={!canPurchase}
                        className={`mt-3 w-full rounded-2xl border-[3px] py-2 font-black transition-all ${
                          canPurchase
                            ? 'border-teal-800 bg-gradient-to-b from-teal-300 to-teal-500 text-teal-950 shadow-[0_4px_0_#115e59] active:translate-y-1 active:shadow-[0_1px_0_#115e59]'
                            : 'cursor-not-allowed border-slate-300 bg-gray-200 text-gray-500'
                        }`}
                      >
                        {level >= 5 ? '최대 5단계 달성' : `${formatNumber(price)} 💰 · 강화하기`}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {isShopOpen && (
        <EconomyPanel
          economy={economy}
          toilets={toilets}
          onClose={() => setIsShopOpen(false)}
          onLogin={() => { setIsShopOpen(false); setIsLoginOpen(true); }}
        />
      )}

      {evolution && <EvolutionCelebration evolution={evolution} onClose={() => {
        setEvolution(null);
        evolutionLock.current = false;
      }} />}

      {/* ==================== CSS 애니메이션 정의 ==================== */}
      <style>{`
        @keyframes bounce {
          0% {
            transform: translateY(0);
            opacity: 1;
          }
          100% {
            transform: translateY(-40px);
            opacity: 0;
          }
        }
        @keyframes equipmentFloat {
          0%, 100% {
            transform: translateY(0) rotate(-2deg);
          }
          50% {
            transform: translateY(-8px) rotate(2deg);
          }
        }
        @keyframes cleaningSparkle {
          0%, 100% {
            transform: scale(0.75) translateY(2px);
            opacity: 0.45;
          }
          50% {
            transform: scale(1.15) translateY(-4px);
            opacity: 1;
          }
        }
        @keyframes cleanerSwing {
          0%, 100% {
            transform: rotate(-5deg) translateY(1px);
          }
          50% {
            transform: rotate(7deg) translateY(-3px);
          }
        }
      `}</style>
    </div>
  );
};

export default App;
