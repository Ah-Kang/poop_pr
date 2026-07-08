import React, { useState, useEffect, useRef } from 'react';
import villageToiletImage from './assets/toilet-village.jpg';
import subwayToiletImage from './assets/toilet-subway.jpg';
import powderRoomImage from './assets/toilet-powder-room.jpg';
import hotelToiletImage from './assets/toilet-hotel.jpg';
import spaceToiletImage from './assets/toilet-space.jpg';
import goldenPalaceImage from './assets/toilet-golden-palace.jpg';
import cleanerBrushSwingImage from './assets/cleaner-brush-swing.png';
import waterPoopImage from './assets/PoopImage/waterpoop.png';
import softPoopImage from './assets/PoopImage/softpoop.png';
import healthyPoopImage from './assets/PoopImage/healtypoop.png';
import firePoopImage from './assets/PoopImage/firepoop.png';
import diamondPoopImage from './assets/PoopImage/diamondpoop.png';
import goldPoopImage from './assets/PoopImage/goldpoop.png';

// ==================== 화장실 데이터 배열 ====================
// 각 화장실의 정보: 이름, 가격, dps 보너스, 배경색
const toilets = [
  {
    id: 0,
    name: '시골 푸세식 화장실',
    price: 0,
    dpsBonus: 0,
    cleanerPenaltyRate: 0.1,
    bgColor: 'bg-amber-100',
    bgGradient: 'from-amber-200 to-amber-100',
    image: villageToiletImage
  },
  {
    id: 1,
    name: '지하철 공중화장실',
    price: 300,
    dpsBonus: 5,
    cleanerPenaltyRate: 0.2,
    bgColor: 'bg-gray-200',
    bgGradient: 'from-gray-300 to-gray-200',
    image: subwayToiletImage
  },
  {
    id: 2,
    name: '백화점 파우더룸',
    price: 3000,
    dpsBonus: 50,
    cleanerPenaltyRate: 0.22,
    bgColor: 'bg-pink-200',
    bgGradient: 'from-pink-300 to-pink-200',
    image: powderRoomImage
  },
  {
    id: 3,
    name: '7성급 호텔 화장실',
    price: 45000,
    dpsBonus: 250,
    cleanerPenaltyRate: 0.25,
    bgColor: 'bg-slate-300',
    bgGradient: 'from-slate-400 to-slate-300',
    image: hotelToiletImage
  },
  {
    id: 4,
    name: '우주선 무중력 화장실',
    price: 750000,
    dpsBonus: 1000,
    cleanerPenaltyRate: 0.27,
    bgColor: 'bg-indigo-300',
    bgGradient: 'from-indigo-400 to-indigo-300',
    image: spaceToiletImage
  },
  {
    id: 5,
    name: '순금 황제 변기궁전',
    price: 12000000,
    dpsBonus: 2500,
    cleanerPenaltyRate: 0.3,
    bgColor: 'bg-yellow-200',
    bgGradient: 'from-yellow-300 to-yellow-200',
    image: goldenPalaceImage
  }
];

// 반복 구매형 생산 장비: 이전 장비 5레벨 달성 시 다음 장비 해금
const cleaningItems = [
  { id: 0, name: '두루마리 휴지', emoji: '🧻', basePrice: 10, dps: 1, description: '기본 중의 기본. 꾸준히 생산해요.', placement: { left: '1%', top: '16%' } },
  { id: 1, name: '뚫어뽕', emoji: '🪠', basePrice: 75, dps: 5, description: '막힘을 뚫고 생산 흐름을 높여요.', placement: { right: '1%', top: '16%' } },
  { id: 2, name: '화장실 솔', emoji: '🧹', basePrice: 400, dps: 20, description: '변기를 반짝이게 닦아 생산성을 올려요.', placement: { left: '0%', top: '48%' } },
  { id: 3, name: '강력 세정제', emoji: '🧴', basePrice: 2000, dps: 75, description: '묵은 때까지 녹이는 강력한 장비예요.', placement: { right: '0%', top: '48%' } },
  { id: 4, name: '자동 비데', emoji: '🚿', basePrice: 10000, dps: 300, description: '자동화의 시작. 생산량이 크게 뛰어요.', placement: { left: '9%', bottom: '7%' } },
  { id: 5, name: '청소 로봇', emoji: '🤖', basePrice: 50000, dps: 1200, description: '24시간 쉬지 않는 최종 청소 장비예요.', placement: { right: '9%', bottom: '7%' } },
];

const initialItemLevels = cleaningItems.map(() => 0);
const getItemPrice = (item, level) => Math.ceil(item.basePrice * Math.pow(1.18, level));
const cleanerEventDuration = 9;
const cleanerRequiredBlocks = 6;
const cleanerEventMinDelay = 45000;
const cleanerEventMaxDelay = 90000;
const cleanerEventMinGold = 5000;
const itemUnlockRequiredLevel = 15;
const getRandomCleanerDelay = () =>
  Math.floor(
    cleanerEventMinDelay + Math.random() * (cleanerEventMaxDelay - cleanerEventMinDelay)
  );

// 똥 캐릭터 진화 단계: 똥 레벨이 특정 구간에 도달하면 자동으로 외형과 기본 능력치가 상승
const poopCharacters = [
  { id: 0, name: '물똥', badge: '💧', requiredLevel: 1, baseClickPower: 1, baseDps: 0, clickGrowth: 1, dpsGrowth: 0, gradient: 'from-sky-300 to-blue-600', image: waterPoopImage, description: '아직 힘이 없는 촉촉한 초보 똥' },
  { id: 1, name: '말랑똥', badge: '🫧', requiredLevel: 10, baseClickPower: 12, baseDps: 2, clickGrowth: 2, dpsGrowth: 1, gradient: 'from-cyan-300 to-teal-500', image: softPoopImage, description: '형태를 갖추기 시작한 말랑한 똥' },
  { id: 2, name: '건강똥', badge: '🌿', requiredLevel: 25, baseClickPower: 45, baseDps: 10, clickGrowth: 4, dpsGrowth: 2, gradient: 'from-lime-300 to-emerald-600', image: healthyPoopImage, description: '균형 잡힌 영양으로 단단해진 똥' },
  { id: 3, name: '불꽃똥', badge: '🔥', requiredLevel: 50, baseClickPower: 180, baseDps: 45, clickGrowth: 8, dpsGrowth: 5, gradient: 'from-orange-400 to-red-600', image: firePoopImage, description: '뜨거운 생산력을 뿜어내는 똥' },
  { id: 4, name: '다이아똥', badge: '💎', requiredLevel: 80, baseClickPower: 520, baseDps: 160, clickGrowth: 18, dpsGrowth: 12, gradient: 'from-cyan-300 to-violet-600', image: diamondPoopImage, description: '보석처럼 단단하고 희귀한 똥' },
  { id: 5, name: '황금똥', badge: '👑', requiredLevel: 120, baseClickPower: 1400, baseDps: 600, clickGrowth: 40, dpsGrowth: 28, gradient: 'from-yellow-300 to-amber-600', image: goldPoopImage, description: '모든 변기가 꿈꾸는 전설의 황금똥' },
];
const getPoopUpgradePrice = (level) => Math.ceil(25 * Math.pow(1.14, level - 1));
const getPoopStageByLevel = (level) =>
  [...poopCharacters].reverse().find((poop) => level >= poop.requiredLevel) ?? poopCharacters[0];
const getSavedPoopLevel = (parsed) => {
  if (Number.isFinite(parsed.poopLevel)) return Math.max(1, parsed.poopLevel);

  const legacyPoop = poopCharacters[Math.min(parsed.currentPoopLevel ?? 0, poopCharacters.length - 1)];
  return legacyPoop?.requiredLevel ?? 1;
};

const App = () => {
  // ==================== 게임 상태(State) 관리 ====================
  // 현재 보유한 영양분 코인 수량
  const [gold, setGold] = useState(0);
  
  // 현재 매입한 화장실 단계 (0 = 시골 푸세식, 5 = 순금 황제 변기궁전)
  const [currentToiletLevel, setCurrentToiletLevel] = useState(0);

  // 현재 똥 강화 레벨
  const [poopLevel, setPoopLevel] = useState(1);

  // 현재 사용 중인 똥 단계. 해금된 이전 단계도 선택 가능
  const [selectedPoopId, setSelectedPoopId] = useState(0);

  // 청소 장비별 보유 레벨
  const [itemLevels, setItemLevels] = useState(initialItemLevels);
  
  // 화장실 매입 상점 팝업창의 열림/닫힘 상태
  const [isShopOpen, setIsShopOpen] = useState(false);

  // 청소 장비 상점 팝업창의 열림/닫힘 상태
  const [isItemShopOpen, setIsItemShopOpen] = useState(false);

  // 똥 캐릭터 진화 상점 팝업창의 열림/닫힘 상태
  const [isPoopShopOpen, setIsPoopShopOpen] = useState(false);
  
  // 클릭 애니메이션 트리거 (팝핑 효과)
  const [isClicking, setIsClicking] = useState(false);

  // 게임 초기화 확인 팝업 노출 상태
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // 저장 데이터를 읽기 전에 초기값이 덮어쓰는 것을 방지
  const [isSaveLoaded, setIsSaveLoaded] = useState(false);

  // 청소 직원 습격 이벤트 상태
  const [cleanerEvent, setCleanerEvent] = useState(null);
  const [cleanerMessage, setCleanerMessage] = useState('');
  const [cleanerSpawnAttempt, setCleanerSpawnAttempt] = useState(0);
  const goldRef = useRef(gold);

  const localStorageKey = 'poop-pr-save';

  const itemDps = cleaningItems.reduce(
    (total, item, index) => total + item.dps * (itemLevels[index] ?? 0),
    0
  );
  const activeCleaningItems = cleaningItems.filter(
    (_, index) => (itemLevels[index] ?? 0) > 0
  );
  const toiletDps = toilets[currentToiletLevel]?.dpsBonus ?? 0;
  const currentCleanerPenaltyRate = toilets[currentToiletLevel]?.cleanerPenaltyRate ?? 0.1;
  const unlockedPoop = getPoopStageByLevel(poopLevel);
  const currentPoopLevel = unlockedPoop.id;
  const selectedPoop = poopCharacters.find((poop) => poop.id === selectedPoopId) ?? unlockedPoop;
  const currentPoop = selectedPoop.requiredLevel <= poopLevel ? selectedPoop : unlockedPoop;
  const currentPoopStageLevel = Math.max(0, poopLevel - currentPoop.requiredLevel);
  const nextPoop = poopCharacters.find((poop) => poop.requiredLevel > poopLevel);
  const poopUpgradePrice = getPoopUpgradePrice(poopLevel);
  const clickPower = currentPoop.baseClickPower + currentPoop.clickGrowth * currentPoopStageLevel;
  const characterDps = currentPoop.baseDps + currentPoop.dpsGrowth * currentPoopStageLevel;
  const dps = toiletDps + characterDps + itemDps;

  useEffect(() => {
    goldRef.current = gold;
  }, [gold]);

  // ==================== 로컬 저장/불러오기 ====================
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(localStorageKey);
      if (!savedData) return;

      const parsed = JSON.parse(savedData);
      const savedToiletLevel = parsed.currentToiletLevel ?? 0;

      setGold(parsed.gold ?? 0);
      setCurrentToiletLevel(savedToiletLevel);
      const savedPoopLevel = getSavedPoopLevel(parsed);
      const savedUnlockedPoop = getPoopStageByLevel(savedPoopLevel);
      const savedSelectedPoopId = Number.isFinite(parsed.selectedPoopId)
        ? parsed.selectedPoopId
        : savedUnlockedPoop.id;

      setPoopLevel(savedPoopLevel);
      setSelectedPoopId(
        poopCharacters.some((poop) => poop.id === savedSelectedPoopId && savedPoopLevel >= poop.requiredLevel)
          ? savedSelectedPoopId
          : savedUnlockedPoop.id
      );
      setItemLevels(
        Array.isArray(parsed.itemLevels)
          ? cleaningItems.map((_, index) => parsed.itemLevels[index] ?? 0)
          : initialItemLevels
      );
    } catch (error) {
      console.warn('저장된 게임 데이터를 불러오는 중 오류가 발생했습니다.', error);
    } finally {
      setIsSaveLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!isSaveLoaded) return;

    try {
      const saveData = {
        gold,
        currentToiletLevel,
        currentPoopLevel,
        poopLevel,
        selectedPoopId: currentPoop.id,
        itemLevels,
      };
      localStorage.setItem(localStorageKey, JSON.stringify(saveData));
    } catch (error) {
      console.warn('게임 데이터를 저장하는 중 오류가 발생했습니다.', error);
    }
  }, [gold, currentToiletLevel, currentPoopLevel, poopLevel, currentPoop.id, itemLevels, isSaveLoaded]);

  useEffect(() => {
    if (currentPoop.requiredLevel > poopLevel) {
      setSelectedPoopId(unlockedPoop.id);
    }
  }, [currentPoop.requiredLevel, poopLevel, unlockedPoop.id]);

  // ==================== useEffect: 자동 수집 시스템 ====================
  // 1초마다 dps만큼 gold를 자동으로 증가시키는 타이머 로직
  useEffect(() => {
    // dps가 0이면 타이머를 실행할 필요 없음
    if (dps === 0) return;

    // 1000ms(1초)마다 실행되는 인터벌 설정
    const interval = setInterval(() => {
      setGold(prevGold => prevGold + dps);
    }, 1000);

    // 컴포넌트 언마운트 또는 dps 변경 시 인터벌 정리 (메모리 누수 방지)
    return () => clearInterval(interval);
  }, [dps]); // dps가 변경될 때마다 useEffect 재실행

  // ==================== 청소 직원 습격 이벤트 ====================
  useEffect(() => {
    if (!isSaveLoaded || cleanerEvent) return;

    const timeout = setTimeout(() => {
      if (goldRef.current < cleanerEventMinGold) {
        setCleanerSpawnAttempt(prevAttempt => prevAttempt + 1);
        return;
      }

      setCleanerEvent(prevEvent => {
        if (prevEvent) return prevEvent;

        setCleanerMessage('');
        return {
          timeLeft: cleanerEventDuration,
          blocks: 0,
        };
      });
    }, getRandomCleanerDelay());

    return () => clearTimeout(timeout);
  }, [isSaveLoaded, cleanerEvent, cleanerSpawnAttempt]);

  useEffect(() => {
    if (!cleanerEvent) return;

    const timeout = setTimeout(() => {
      setCleanerEvent(prevEvent => {
        if (!prevEvent) return prevEvent;

        const nextTimeLeft = prevEvent.timeLeft - 1;

        if (nextTimeLeft > 0) {
          return {
            ...prevEvent,
            timeLeft: nextTimeLeft,
          };
        }

        const penalty = Math.min(
          goldRef.current,
          Math.max(5, Math.ceil(goldRef.current * currentCleanerPenaltyRate))
        );

        setGold(prevGold => Math.max(0, prevGold - penalty));
        setCleanerMessage(`청소 직원에게 들켰어요. 영양분 -${formatNumber(penalty)}`);
        setTimeout(() => setCleanerMessage(''), 2200);
        return null;
      });
    }, 1000);

    return () => clearTimeout(timeout);
  }, [cleanerEvent, currentCleanerPenaltyRate]);

  // ==================== 클릭 핸들러 함수 ====================
  // 똥 캐릭터 버튼 클릭 시 gold 증가 및 애니메이션 실행
  const handlePoopClick = () => {
    // gold에 clickPower만큼 추가
    setGold(prevGold => prevGold + clickPower);
    
    // 팝핑 애니메이션 트리거
    setIsClicking(true);
    
    // 300ms 후 애니메이션 상태 초기화
    setTimeout(() => setIsClicking(false), 300);
  };

  const handleCleanerBlock = () => {
    setCleanerEvent(prevEvent => {
      if (!prevEvent) return prevEvent;

      const nextBlocks = prevEvent.blocks + 1;

      if (nextBlocks >= cleanerRequiredBlocks) {
        setCleanerMessage('방해 성공! 청소 직원이 그냥 지나갔어요.');
        setTimeout(() => setCleanerMessage(''), 1800);
        return null;
      }

      return {
        ...prevEvent,
        blocks: nextBlocks,
      };
    });
  };

  // ==================== 화장실 매입 핸들러 ====================
  // 화장실을 매입했을 때 호출되는 함수
  const handleToiletPurchase = (toiletId) => {
    const toilet = toilets[toiletId];
    
    // 매입 조건 재확인 (방어 코드)
    if (gold < toilet.price) return;
    if (toiletId > 0 && currentToiletLevel < toiletId - 1) return;

    // 1. 코인 차감
    setGold(prevGold => prevGold - toilet.price);
    
    // 2. 현재 화장실 단계 업데이트
    setCurrentToiletLevel(toiletId);
    
    // 3. 모달 자동 닫기 (매입 성공 후)
    setIsShopOpen(false);
  };

  // ==================== 청소 장비 구매 핸들러 ====================
  const handleItemPurchase = (itemId) => {
    const item = cleaningItems[itemId];
    const currentLevel = itemLevels[itemId] ?? 0;
    const price = getItemPrice(item, currentLevel);
    const isUnlocked = itemId === 0 || (itemLevels[itemId - 1] ?? 0) >= itemUnlockRequiredLevel;

    if (!isUnlocked || gold < price) return;

    setGold(prevGold => prevGold - price);
    setItemLevels(prevLevels =>
      prevLevels.map((level, index) => index === itemId ? level + 1 : level)
    );
  };

  // ==================== 똥 레벨 강화 핸들러 ====================
  const handlePoopLevelUp = () => {
    if (gold < poopUpgradePrice) return;

    setGold(prevGold => prevGold - poopUpgradePrice);
    setPoopLevel(prevLevel => prevLevel + 1);
  };

  const handlePoopSelect = (poopId) => {
    const poop = poopCharacters[poopId];
    if (!poop || poopLevel < poop.requiredLevel) return;

    setSelectedPoopId(poopId);
  };

  // ==================== 게임 초기화 리셋 핸들러 ====================
  const handleResetGame = () => {
    setGold(0);
    setCurrentToiletLevel(0);
    setPoopLevel(1);
    setSelectedPoopId(0);
    setItemLevels(initialItemLevels);
    setIsShopOpen(false);
    setIsItemShopOpen(false);
    setIsPoopShopOpen(false);
    setIsResetConfirmOpen(false);
    localStorage.removeItem(localStorageKey);
  };

  // ==================== 마지막 구매 가능 화장실 인덱스 계산 ====================
  // 사용자가 현재 살 수 있는 화장실 중 가장 높은 단계 계산
  const getMaxAvailableToilet = () => {
    // 사용자가 현재 보유한 다음 단계를 살 수 있는지 확인
    if (currentToiletLevel < toilets.length - 1) {
      return currentToiletLevel + 1;
    }
    // 모든 화장실을 소유한 경우
    return currentToiletLevel;
  };

  // ==================== 숫자 포맷팅 함수 ====================
  // 큰 숫자를 읽기 쉬운 형식으로 표현 (예: 1,234,567)
  const formatNumber = (num) => {
    return Math.floor(num).toLocaleString('ko-KR');
  };

  // ==================== 현재 화장실 배경설정 가져오기 ====================
  const currentToilet = toilets[currentToiletLevel];
  const currentBgGradient = currentToilet.bgGradient;
  const currentBgImage = currentToilet.image;

  // ==================== JSX 렌더링 ====================
  return (
    <div
      className={`
        min-h-[100svh] h-[100svh] w-full max-w-[430px] mx-auto
        bg-gradient-to-b ${currentBgGradient}
        relative flex flex-col items-center justify-between
        p-3 sm:p-5 transition-all duration-500 ease-in-out
        overflow-hidden
      `}
      style={{
        backgroundImage: currentBgImage
          ? `url(${currentBgImage})`
          : `linear-gradient(to bottom, var(--tw-gradient-stops))`,
        backgroundSize: currentBgImage ? 'cover' : undefined,
        backgroundPosition: currentBgImage ? 'center' : undefined,
        backgroundRepeat: currentBgImage ? 'no-repeat' : undefined,
      }}
    >
      {/* ==================== 상단: 고정형 게임 HUD ==================== */}
      <div className="w-full shrink-0 overflow-hidden rounded-2xl border border-white/20 bg-slate-950/85 text-white shadow-2xl backdrop-blur-md">
        <div className="grid grid-cols-2 divide-x divide-white/15">
          <div
            className="px-3 py-2.5 sm:px-4 sm:py-3"
            onDoubleClick={() => setIsResetConfirmOpen(true)}
          >
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-200">
              <span aria-hidden="true">💰</span>
              <span>영양분</span>
            </div>
            <p className="mt-1 truncate text-xl font-black tracking-tight text-white sm:text-2xl">
              {formatNumber(gold)}
            </p>
          </div>

          <div className="px-3 py-2.5 sm:px-4 sm:py-3">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-200">
              <span aria-hidden="true">⚡</span>
              <span>초당 생산량</span>
            </div>
            <p className="mt-1 truncate text-xl font-black tracking-tight text-emerald-300 sm:text-2xl">
              +{formatNumber(dps)}
              <span className="ml-1 text-xs font-bold text-emerald-100">/초</span>
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-white/15 bg-white/5 px-3 py-2 sm:px-4 sm:py-2.5">
          <p className="min-w-0 truncate text-xs font-bold text-slate-100">
            📍 {toilets[currentToiletLevel].name}
          </p>
          <p className="shrink-0 text-[9px] font-semibold text-slate-300 sm:text-[10px]">
            변기 +{formatNumber(toiletDps)} · 캐릭터 +{formatNumber(characterDps)} · 장비 +{formatNumber(itemDps)}
          </p>
        </div>

      </div>

      {/* ==================== 중앙: 똥 클릭 버튼 ==================== */}
      <div
        className="relative flex min-h-0 w-full flex-1 cursor-pointer flex-col items-center justify-center py-1"
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
                <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-white/70 bg-slate-950/75 text-2xl shadow-xl backdrop-blur-md sm:h-14 sm:w-14 sm:text-3xl">
                  <span aria-hidden="true">{item.emoji}</span>
                  <span className="absolute -right-1.5 -top-1.5 rounded-full border border-white/60 bg-emerald-500 px-1.5 py-0.5 text-[9px] font-black text-white shadow">
                    Lv.{level}
                  </span>
                </div>
                <span className="mt-1 max-w-16 truncate rounded-full bg-black/60 px-2 py-0.5 text-[9px] font-bold text-white backdrop-blur-sm">
                  {item.name}
                </span>
              </div>
            );
          })}
        </div>

        {(cleanerEvent || cleanerMessage) && (
          <div className="absolute left-1/2 top-2 z-40 w-[min(100%,360px)] -translate-x-1/2 rounded-2xl border border-red-200/80 bg-red-950/85 p-3 text-white shadow-2xl backdrop-blur-md">
            {cleanerEvent ? (
              <>
                <div className="flex items-center justify-between gap-3">
                  <img
                    src={cleanerBrushSwingImage}
                    alt="솔을 휘두르는 청소 직원"
                    className="h-20 w-20 shrink-0 object-contain drop-shadow-2xl"
                    style={{ animation: 'cleanerSwing 0.78s ease-in-out infinite' }}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-black">🧽 청소 직원 등장!</p>
                    <p className="mt-0.5 text-[11px] font-semibold text-red-100">
                      {cleanerEvent.timeLeft}초 안에 {cleanerRequiredBlocks - cleanerEvent.blocks}번 더 방해하세요
                    </p>
                    <p className="mt-0.5 text-[10px] font-bold text-red-200">
                      실패 시 영양분 {Math.round(currentCleanerPenaltyRate * 100)}% 차감
                    </p>
                  </div>
                  <div className="shrink-0 rounded-full bg-white px-2.5 py-1 text-sm font-black text-red-700">
                    {cleanerEvent.timeLeft}s
                  </div>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/20">
                  <div
                    className="h-full rounded-full bg-red-300 transition-all duration-200"
                    style={{
                      width: `${(cleanerEvent.blocks / cleanerRequiredBlocks) * 100}%`,
                    }}
                  />
                </div>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    handleCleanerBlock();
                  }}
                  className="mt-3 w-full rounded-xl bg-red-500 px-4 py-2.5 text-sm font-black text-white shadow-lg transition-all hover:bg-red-400 active:scale-95"
                >
                  🚧 방해하기
                </button>
              </>
            ) : (
              <p className="text-center text-sm font-black">{cleanerMessage}</p>
            )}
          </div>
        )}

        <div className="relative z-20 mb-2 rounded-full border border-white/40 bg-slate-950/70 px-3 py-1 text-xs font-black text-white shadow-lg backdrop-blur-sm">
          {currentPoop.badge} {currentPoop.name} Lv.{poopLevel} · 클릭 +{formatNumber(clickPower)}
        </div>
        <button
          onClick={(event) => {
            event.stopPropagation();
            handlePoopClick();
          }}
          className={`
            relative z-20 flex h-56 w-56 cursor-pointer touch-manipulation items-center justify-center rounded-full
            text-8xl transition-transform duration-300 ease-out
            filter drop-shadow-lg hover:drop-shadow-2xl
            ${isClicking ? 'scale-125' : 'scale-100'}
          `}
          aria-label={`${currentPoop.name} 터치해서 영양분 얻기`}
          style={{
            transform: isClicking ? 'scale(1.25)' : 'scale(1)',
            filter: isClicking 
              ? 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.3))' 
              : 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2))',
          }}
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
          {currentPoop.image ? (
            <img
              src={currentPoop.image}
              alt={currentPoop.name}
              className="h-48 w-48 object-contain"
              draggable="false"
            />
          ) : (
            <span aria-label={currentPoop.name}>💩</span>
          )}
          <span className="absolute -right-1 -top-2 text-4xl drop-shadow-lg" aria-hidden="true">
            {currentPoop.badge}
          </span>
        </button>

        {activeCleaningItems.length > 0 && (
          <div className="relative z-20 mt-3 rounded-full border border-emerald-200/60 bg-emerald-950/75 px-3 py-1 text-[10px] font-bold text-emerald-100 shadow-lg backdrop-blur-sm">
            🧼 장비 {activeCleaningItems.length}종 작동 중 · +{formatNumber(itemDps)}/초
          </div>
        )}

        {/* 클릭 시 떠오르는 텍스트 효과 (선택사항) */}
        {isClicking && (
          <div
            className="text-2xl font-bold text-green-600 mt-4 animate-bounce"
            style={{
              animation: 'bounce 0.6s ease-out'
            }}
          >
            +{formatNumber(clickPower)} 😊
          </div>
        )}
      </div>

      {/* ==================== 하단: 성장 상점 버튼 ==================== */}
      <div className="grid w-full shrink-0 grid-cols-3 gap-2 pb-[env(safe-area-inset-bottom)]">
        <button
          onClick={() => setIsPoopShopOpen(true)}
          className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-2 py-3 text-[11px] font-bold text-white shadow-lg transition-all hover:from-amber-600 hover:to-orange-600 active:scale-95 sm:py-4 sm:text-xs"
        >
          💩 똥 강화
        </button>
        <button
          onClick={() => setIsItemShopOpen(true)}
          className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-2 py-3 text-[11px] font-bold text-white shadow-lg transition-all hover:from-emerald-600 hover:to-teal-600 active:scale-95 sm:py-4 sm:text-xs"
        >
          🧰 청소 장비
        </button>
        <button
          onClick={() => setIsShopOpen(true)}
          className="rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-2 py-3 text-[11px] font-bold text-white shadow-lg transition-all hover:from-purple-600 hover:to-pink-600 active:scale-95 sm:py-4 sm:text-xs"
        >
          🏢 화장실 매입
        </button>
      </div>

      {isResetConfirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setIsResetConfirmOpen(false)}
        >
          <div
            className="w-full max-w-xs rounded-2xl bg-white p-5 text-gray-900 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="text-lg font-black">게임 초기화</h2>
            <p className="mt-2 text-sm font-semibold text-gray-600">
              저장된 영양분, 똥 레벨, 장비, 화장실을 모두 처음으로 되돌릴까요?
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                onClick={() => setIsResetConfirmOpen(false)}
                className="rounded-xl bg-gray-200 px-4 py-3 text-sm font-bold text-gray-800 transition-colors hover:bg-gray-300"
              >
                취소
              </button>
              <button
                onClick={handleResetGame}
                className="rounded-xl bg-red-500 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-red-600"
              >
                초기화
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 모달: 똥 레벨 강화 ==================== */}
      {isPoopShopOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="flex max-h-[82vh] w-full max-w-sm flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between bg-gradient-to-r from-amber-500 to-orange-500 p-5 text-white">
              <div>
                <h2 className="text-2xl font-black">💩 똥 강화</h2>
                <p className="mt-1 text-xs text-amber-50">레벨을 올리면 특정 구간에서 자동 진화해요</p>
              </div>
              <button
                onClick={() => setIsPoopShopOpen(false)}
                className="text-2xl font-bold hover:text-amber-100"
                aria-label="똥 강화 상점 닫기"
              >
                ✕
              </button>
            </div>

            <div className="border-b bg-amber-50 px-5 py-4 text-sm font-bold text-amber-900">
              <div className="flex items-center justify-between gap-3">
                <span>현재 {currentPoop.badge} {currentPoop.name} Lv.{poopLevel}</span>
                <span className="shrink-0 rounded-full bg-amber-500 px-2.5 py-1 text-xs text-white">
                  +{formatNumber(clickPower)} 클릭
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-2 text-xs text-amber-800">
                <span>자동 +{formatNumber(characterDps)}/초</span>
                <span>{nextPoop ? `${nextPoop.name}까지 ${nextPoop.requiredLevel - poopLevel}레벨` : '최종 진화 완료'}</span>
              </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              <div className="rounded-xl border-2 border-orange-300 bg-orange-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
                    <img
                      src={currentPoop.image}
                      alt={currentPoop.name}
                      className="h-20 w-20 object-contain"
                      draggable="false"
                    />
                    <span className="absolute -right-1 -top-1 text-2xl">{currentPoop.badge}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-black text-gray-900">
                      {currentPoop.name} Lv.{poopLevel}
                    </h3>
                    <p className="mt-1 text-xs font-semibold text-gray-600">
                      다음 강화 비용 {formatNumber(poopUpgradePrice)} 💰
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs font-bold">
                      <span className="rounded bg-blue-50 px-2 py-1 text-blue-700">클릭 +{formatNumber(clickPower)}</span>
                      <span className="rounded bg-emerald-50 px-2 py-1 text-emerald-700">자동 +{formatNumber(characterDps)}/초</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handlePoopLevelUp}
                  disabled={gold < poopUpgradePrice}
                  className={`mt-4 w-full rounded-lg py-2.5 font-bold transition-all ${
                    gold >= poopUpgradePrice
                      ? 'bg-orange-500 text-white hover:bg-orange-600 active:scale-95'
                      : 'cursor-not-allowed bg-gray-200 text-gray-500'
                  }`}
                >
                  Lv.{poopLevel + 1} 강화하기 · {formatNumber(poopUpgradePrice)} 💰
                </button>
              </div>

              {poopCharacters.map((poop) => {
                const isOwned = poopLevel >= poop.requiredLevel;
                const isSelected = currentPoop.id === poop.id;
                const stageLevel = Math.max(0, poopLevel - poop.requiredLevel);
                const stageClickPower = poop.baseClickPower + poop.clickGrowth * stageLevel;
                const stageDps = poop.baseDps + poop.dpsGrowth * stageLevel;

                return (
                  <div
                    key={poop.id}
                    className={`rounded-xl border-2 p-4 ${
                      isSelected
                        ? 'border-amber-400 bg-amber-50'
                        : isOwned
                        ? 'border-emerald-200 bg-emerald-50'
                        : 'border-gray-200 bg-gray-100 opacity-70'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative flex h-16 w-16 shrink-0 items-center justify-center text-4xl">
                        {poop.image ? (
                          <img
                            src={poop.image}
                            alt={poop.name}
                            className="h-14 w-14 object-contain"
                            draggable="false"
                          />
                        ) : (
                          '💩'
                        )}
                        <span className="absolute -right-1 -top-1 text-xl">{poop.badge}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-black text-gray-900">{poop.name}</h3>
                          {isSelected && <span className="rounded-full bg-amber-500 px-2 py-1 text-[10px] font-bold text-white">사용 중</span>}
                          {!isSelected && isOwned && <span className="text-xs font-bold text-emerald-600">✓ 해금</span>}
                        </div>
                        <p className="mt-1 text-xs text-gray-500">{poop.description}</p>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs font-bold">
                          <span className="rounded bg-amber-50 px-2 py-1 text-amber-700">Lv.{poop.requiredLevel} 진화</span>
                          <span className="rounded bg-blue-50 px-2 py-1 text-blue-700">
                            {isOwned ? `클릭 +${formatNumber(stageClickPower)}` : `기본 클릭 +${formatNumber(poop.baseClickPower)}`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {isOwned && !isSelected && (
                      <button
                        onClick={() => handlePoopSelect(poop.id)}
                        className="mt-3 w-full rounded-lg bg-emerald-500 py-2 text-sm font-bold text-white transition-all hover:bg-emerald-600 active:scale-95"
                      >
                        이 똥 사용하기 · 자동 +{formatNumber(stageDps)}/초
                      </button>
                    )}

                    {!isOwned && (
                      <div className="mt-3 rounded-lg bg-gray-200 py-2 text-center text-xs font-bold text-gray-500">
                        🔒 Lv.{poop.requiredLevel} 필요
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ==================== 모달: 청소 장비 상점 ==================== */}
      {isItemShopOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="flex max-h-[80vh] w-full max-w-sm flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between bg-gradient-to-r from-emerald-500 to-teal-500 p-5 text-white">
              <div>
                <h2 className="text-2xl font-bold">🧰 청소 장비</h2>
                <p className="mt-1 text-xs text-emerald-50">장비를 강화해 초당 생산량을 늘리세요</p>
              </div>
              <button
                onClick={() => setIsItemShopOpen(false)}
                className="text-2xl font-bold transition-colors hover:text-emerald-100"
                aria-label="청소 장비 상점 닫기"
              >
                ✕
              </button>
            </div>

            <div className="border-b bg-emerald-50 px-5 py-3 text-sm font-bold text-emerald-800">
              장비 생산량 +{formatNumber(itemDps)} / sec
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {cleaningItems.map((item, index) => {
                const level = itemLevels[index] ?? 0;
                const price = getItemPrice(item, level);
                const isUnlocked = index === 0 || (itemLevels[index - 1] ?? 0) >= itemUnlockRequiredLevel;
                const canPurchase = isUnlocked && gold >= price;

                return (
                  <div
                    key={item.id}
                    className={`rounded-xl border-2 p-4 transition-all ${
                      !isUnlocked
                        ? 'border-gray-200 bg-gray-100 opacity-70'
                        : canPurchase
                        ? 'border-emerald-300 bg-emerald-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-4xl" aria-hidden="true">{item.emoji}</div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-bold text-gray-900">{item.name}</h3>
                          <span className="whitespace-nowrap rounded-full bg-gray-900 px-2 py-1 text-xs font-bold text-white">
                            Lv.{level}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">{item.description}</p>
                        <div className="mt-2 flex justify-between text-sm font-semibold">
                          <span className="text-blue-600">레벨당 +{formatNumber(item.dps)}/초</span>
                          <span className="text-emerald-700">총 +{formatNumber(item.dps * level)}/초</span>
                        </div>
                      </div>
                    </div>

                    {!isUnlocked ? (
                      <div className="mt-3 rounded-lg bg-gray-200 py-2 text-center text-sm font-bold text-gray-600">
                        🔒 {cleaningItems[index - 1].name} Lv.{itemUnlockRequiredLevel} 필요
                      </div>
                    ) : (
                      <button
                        onClick={() => handleItemPurchase(item.id)}
                        disabled={!canPurchase}
                        className={`mt-3 w-full rounded-lg py-2 font-bold transition-all ${
                          canPurchase
                            ? 'bg-emerald-500 text-white hover:bg-emerald-600 active:scale-95'
                            : 'cursor-not-allowed bg-gray-200 text-gray-500'
                        }`}
                      >
                        {formatNumber(price)} 💰 · 구매하기
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ==================== 모달: 화장실 매입 상점 팝업 ==================== */}
      {isShopOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full max-h-96 flex flex-col">
            {/* 모달 헤더 */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6 rounded-t-2xl flex justify-between items-center">
              <h2 className="text-2xl font-bold">🏢 화장실 매입</h2>
              <button
                onClick={() => setIsShopOpen(false)}
                className="text-2xl font-bold hover:text-gray-200 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* 모달 콘텐츠 (스크롤 가능) */}
            <div className="overflow-y-auto flex-1 p-4">
              {toilets.map((toilet) => {
                // 해당 화장실을 구매할 수 있는지 판단
                const canPurchase =
                  gold >= toilet.price && // 충분한 코인 보유
                  (toilet.id === 0 || currentToiletLevel >= toilet.id - 1) && // 이전 단계 보유
                  currentToiletLevel < toilet.id; // 아직 구매하지 않음

                // 이미 구매한 화장실인지 판단
                const isOwned = currentToiletLevel >= toilet.id;

                return (
                  <div
                    key={toilet.id}
                    className={`
                      mb-4 p-4 rounded-lg border-2 transition-all
                      ${isOwned 
                        ? 'bg-green-50 border-green-300' 
                        : canPurchase 
                        ? 'bg-yellow-50 border-yellow-300' 
                        : 'bg-gray-50 border-gray-300'
                      }
                    `}
                  >
                    {toilet.image && (
                      <img
                        src={toilet.image}
                        alt={toilet.name}
                        className="w-full h-32 object-cover rounded-xl mb-4"
                      />
                    )}
                    {/* 화장실 이름 및 상태 배지 */}
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-bold text-gray-900">
                        {toilet.name}
                      </h3>
                      {isOwned && (
                        <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                          ✓ 보유중
                        </span>
                      )}
                    </div>

                    {/* 화장실 정보 */}
                    <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                      <div>
                        <p className="text-gray-600">가격</p>
                        <p className={`font-bold ${gold >= toilet.price && !isOwned ? 'text-green-600' : 'text-gray-900'}`}>
                          {formatNumber(toilet.price)} 💰
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">DPS 보너스</p>
                        <p className="font-bold text-blue-600">
                          +{formatNumber(toilet.dpsBonus)}
                        </p>
                      </div>
                    </div>

                    {/* 매입하기 버튼 또는 소유 표시 */}
                    {isOwned ? (
                      <button
                        disabled
                        className="w-full py-2 bg-green-500 text-white font-bold rounded-lg cursor-default opacity-60"
                      >
                        ✓ 이미 구매함
                      </button>
                    ) : (
                      <button
                        onClick={() => handleToiletPurchase(toilet.id)}
                        disabled={!canPurchase}
                        className={`
                          w-full py-2 font-bold rounded-lg transition-all
                          ${canPurchase
                            ? 'bg-purple-500 text-white hover:bg-purple-600 active:scale-95 cursor-pointer'
                            : 'bg-gray-300 text-gray-600 cursor-not-allowed opacity-50'
                          }
                        `}
                      >
                        {toilet.price === 0
                          ? '선택'
                          : gold < toilet.price
                          ? '코인 부족'
                          : currentToiletLevel < toilet.id - 1
                          ? '이전 단계 필요'
                          : '매입하기'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 모달 푸터 */}
            <div className="border-t p-4 bg-gray-50 rounded-b-2xl">
              <button
                onClick={() => setIsShopOpen(false)}
                className="w-full py-2 px-4 bg-gray-300 text-gray-900 font-bold rounded-lg hover:bg-gray-400 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

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
