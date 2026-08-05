import React, { useState, useEffect, useRef } from 'react';
import villageToiletImage from './assets/toilet-village-cartoon.webp';
import subwayToiletImage from './assets/toilet-subway-cartoon.webp';
import powderRoomImage from './assets/toilet-powder-room-cartoon.webp';
import hotelToiletImage from './assets/toilet-hotel-cartoon.webp';
import spaceToiletImage from './assets/toilet-space-cartoon.webp';
import goldenPalaceImage from './assets/toilet-golden-palace-cartoon.webp';
import cleanerBrushSwingImage from './assets/cleaner-brush-swing.png';
import waterPoopImage from './assets/PoopImage/waterpoop.png';
import softPoopImage from './assets/PoopImage/softpoop.png';
import healthyPoopImage from './assets/PoopImage/healtypoop.png';
import firePoopImage from './assets/PoopImage/firepoop.png';
import diamondPoopImage from './assets/PoopImage/diamondpoop.png';
import goldPoopImage from './assets/PoopImage/goldpoop.png';
import toiletPaperIcon from './assets/cleaning-items/toilet-paper.png';
import plungerIcon from './assets/cleaning-items/plunger.png';
import toiletBrushIcon from './assets/cleaning-items/toilet-brush.png';
import cleanerSprayIcon from './assets/cleaning-items/cleaner-spray.png';
import bidetIcon from './assets/cleaning-items/bidet.png';
import cleaningRobotIcon from './assets/cleaning-items/cleaning-robot.png';

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
  { id: 0, name: '두루마리 휴지', icon: toiletPaperIcon, basePrice: 10, dps: 1, description: '기본 중의 기본. 꾸준히 생산해요.', placement: { left: '1%', top: '16%' } },
  { id: 1, name: '뚫어뽕', icon: plungerIcon, basePrice: 75, dps: 5, description: '막힘을 뚫고 생산 흐름을 높여요.', placement: { right: '1%', top: '16%' } },
  { id: 2, name: '화장실 솔', icon: toiletBrushIcon, basePrice: 400, dps: 20, description: '변기를 반짝이게 닦아 생산성을 올려요.', placement: { left: '0%', top: '48%' } },
  { id: 3, name: '강력 세정제', icon: cleanerSprayIcon, basePrice: 2000, dps: 75, description: '묵은 때까지 녹이는 강력한 장비예요.', placement: { right: '0%', top: '48%' } },
  { id: 4, name: '자동 비데', icon: bidetIcon, basePrice: 10000, dps: 300, description: '자동화의 시작. 생산량이 크게 뛰어요.', placement: { left: '9%', bottom: '7%' } },
  { id: 5, name: '청소 로봇', icon: cleaningRobotIcon, basePrice: 50000, dps: 1200, description: '24시간 쉬지 않는 최종 청소 장비예요.', placement: { right: '9%', bottom: '7%' } },
];

const initialItemLevels = cleaningItems.map(() => 0);
const getItemPrice = (item, level) => Math.ceil(item.basePrice * Math.pow(1.18, level));
const cleanerEventDuration = 9;
const cleanerRequiredBlocks = 6;
const cleanerEventMinDelay = 45000;
const cleanerEventMaxDelay = 90000;
const cleanerEventMinGold = 5000;
const itemUnlockRequiredLevel = 15;
const developerGoldAmount = 999999999999;
const activeClickDpsBonusRate = 0.18;
const getRandomCleanerDelay = () =>
  Math.floor(
    cleanerEventMinDelay + Math.random() * (cleanerEventMaxDelay - cleanerEventMinDelay)
  );

// 똥 캐릭터 진화 단계: 각 똥은 자기 레벨 1부터 성장하고, 진화 레벨에 도달하면 다음 똥이 해금
const poopCharacters = [
  { id: 0, name: '물똥', badge: '💧', legacyRequiredLevel: 1, evolutionLevel: 25, upgradeBasePrice: 20, upgradeGrowth: 1.2, baseClickPower: 1, baseDps: 0, clickGrowth: 1, dpsGrowth: 0, gradient: 'from-sky-300 to-blue-600', image: waterPoopImage, description: '아직 힘이 없는 촉촉한 초보 똥' },
  { id: 1, name: '말랑똥', badge: '🫧', legacyRequiredLevel: 10, evolutionLevel: 25, upgradeBasePrice: 110, upgradeGrowth: 1.18, baseClickPower: 12, baseDps: 2, clickGrowth: 2, dpsGrowth: 1, gradient: 'from-cyan-300 to-teal-500', image: softPoopImage, description: '형태를 갖추기 시작한 말랑한 똥' },
  { id: 2, name: '건강똥', badge: '🌿', legacyRequiredLevel: 25, evolutionLevel: 30, upgradeBasePrice: 1100, upgradeGrowth: 1.17, baseClickPower: 45, baseDps: 10, clickGrowth: 4, dpsGrowth: 2, gradient: 'from-lime-300 to-emerald-600', image: healthyPoopImage, description: '균형 잡힌 영양으로 단단해진 똥' },
  { id: 3, name: '불꽃똥', badge: '🔥', legacyRequiredLevel: 50, evolutionLevel: 35, upgradeBasePrice: 14000, upgradeGrowth: 1.16, baseClickPower: 180, baseDps: 45, clickGrowth: 8, dpsGrowth: 5, gradient: 'from-orange-400 to-red-600', image: firePoopImage, description: '뜨거운 생산력을 뿜어내는 똥' },
  { id: 4, name: '다이아똥', badge: '💎', legacyRequiredLevel: 80, evolutionLevel: 45, upgradeBasePrice: 180000, upgradeGrowth: 1.15, baseClickPower: 520, baseDps: 160, clickGrowth: 18, dpsGrowth: 12, gradient: 'from-cyan-300 to-violet-600', image: diamondPoopImage, description: '보석처럼 단단하고 희귀한 똥' },
  { id: 5, name: '황금똥', badge: '👑', legacyRequiredLevel: 120, evolutionLevel: null, upgradeBasePrice: 2500000, upgradeGrowth: 1.14, baseClickPower: 1400, baseDps: 600, clickGrowth: 40, dpsGrowth: 28, gradient: 'from-yellow-300 to-amber-600', image: goldPoopImage, description: '모든 변기가 꿈꾸는 전설의 황금똥' },
];
const initialPoopLevels = poopCharacters.map((_, index) => index === 0 ? 1 : 0);
const getPoopUpgradePrice = (poop, level) =>
  Math.ceil(poop.upgradeBasePrice * Math.pow(poop.upgradeGrowth, level - 1));
const getPoopStats = (poop, level) => {
  const stageLevel = Math.max(0, level - 1);

  return {
    clickPower: poop.baseClickPower + poop.clickGrowth * stageLevel,
    dps: poop.baseDps + poop.dpsGrowth * stageLevel,
  };
};
const getHighestUnlockedPoopId = (levels) =>
  levels.reduce((highestId, level, index) => level > 0 ? index : highestId, 0);
const getSavedPoopLevels = (parsed) => {
  if (Array.isArray(parsed.poopLevels)) {
    const normalizedLevels = poopCharacters.map((_, index) =>
      Math.max(0, Math.floor(parsed.poopLevels[index] ?? 0))
    );

    return normalizedLevels.some((level) => level > 0) ? normalizedLevels : initialPoopLevels;
  }

  const legacyLevel = Math.max(1, Math.floor(parsed.poopLevel ?? 1));
  const legacyPoop = [...poopCharacters]
    .reverse()
    .find((poop) => legacyLevel >= poop.legacyRequiredLevel) ?? poopCharacters[0];

  return poopCharacters.map((poop) => {
    if (poop.id < legacyPoop.id) return poop.evolutionLevel ?? 1;
    if (poop.id === legacyPoop.id) return Math.max(1, legacyLevel - poop.legacyRequiredLevel + 1);
    return 0;
  });
};

const formatDuration = (seconds) => {
  const totalSeconds = Math.max(0, Math.floor(Number(seconds) || 0));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;

  if (hours > 0) return `${hours}시간 ${minutes}분`;
  if (minutes > 0) return `${minutes}분 ${remainingSeconds}초`;
  return `${remainingSeconds}초`;
};

const formatDateTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const AdminDashboard = () => {
  const [token, setToken] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('token') || localStorage.getItem('poop-pr-admin-token') || '';
  });
  const [draftToken, setDraftToken] = useState(token);
  const [analytics, setAnalytics] = useState(null);
  const [status, setStatus] = useState('idle');

  const loadAnalytics = async (activeToken = token) => {
    if (!activeToken) {
      setStatus('missing-token');
      return;
    }

    setStatus('loading');
    try {
      const response = await fetch('/api/admin/analytics', {
        headers: { 'x-admin-token': activeToken },
      });
      if (!response.ok) throw new Error('analytics_load_failed');
      const data = await response.json();
      setAnalytics(data);
      setStatus('ready');
      localStorage.setItem('poop-pr-admin-token', activeToken);
    } catch {
      setAnalytics(null);
      setStatus('error');
    }
  };

  useEffect(() => {
    loadAnalytics(token);
  }, []);

  const summary = analytics?.summary ?? {};
  const users = analytics?.users ?? [];
  const daily = analytics?.daily ?? [];
  const maxDailySeconds = Math.max(1, ...daily.map((day) => Number(day.playSeconds) || 0));

  return (
    <main className="min-h-screen bg-[#f4efe7] px-4 py-6 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <section className="flex flex-col gap-4 border-b border-slate-300 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-teal-700">Poop PR 운영자</p>
            <h1 className="mt-1 text-3xl font-black">게임 분석 대시보드</h1>
            <p className="mt-2 text-sm font-semibold text-slate-600">
              가입자, 활성 유저, 누적 사용시간, 유저별 성장 데이터를 확인합니다.
            </p>
          </div>
          <a
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-900 px-4 text-sm font-black text-white"
          >
            게임으로 이동
          </a>
        </section>

        <section className="mt-5 flex flex-col gap-2 rounded-lg border border-slate-300 bg-white p-4 sm:flex-row">
          <input
            type="password"
            value={draftToken}
            onChange={(event) => setDraftToken(event.target.value)}
            placeholder="ADMIN_TOKEN 입력"
            className="min-h-11 flex-1 rounded-md border border-slate-300 px-3 text-sm font-semibold outline-none focus:border-teal-600"
          />
          <button
            type="button"
            onClick={() => {
              setToken(draftToken);
              loadAnalytics(draftToken);
            }}
            className="min-h-11 rounded-md bg-teal-600 px-5 text-sm font-black text-white"
          >
            조회
          </button>
          <button
            type="button"
            onClick={() => loadAnalytics(token)}
            className="min-h-11 rounded-md border border-slate-300 px-5 text-sm font-black text-slate-800"
          >
            새로고침
          </button>
        </section>

        {status === 'missing-token' && (
          <p className="mt-4 rounded-lg bg-amber-100 px-4 py-3 text-sm font-bold text-amber-900">
            Render 환경변수에 넣은 ADMIN_TOKEN을 입력하면 운영자 데이터를 볼 수 있어요.
          </p>
        )}
        {status === 'error' && (
          <p className="mt-4 rounded-lg bg-red-100 px-4 py-3 text-sm font-bold text-red-800">
            조회에 실패했어요. 토큰이 맞는지, Render 환경변수에 ADMIN_TOKEN이 들어갔는지 확인해주세요.
          </p>
        )}

        <section className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['전체 가입자', `${summary.totalUsers ?? 0}명`],
            ['오늘 가입자', `${summary.newUsersToday ?? 0}명`],
            ['7일 활성 유저', `${summary.activeUsers7d ?? 0}명`],
            ['누적 사용시간', formatDuration(summary.totalPlaySeconds)],
            ['평균 사용시간', formatDuration(summary.averagePlaySeconds)],
            ['최고 영양분', Number(summary.topGold ?? 0).toLocaleString('ko-KR')],
            ['최고 초당 생산량', `+${Number(summary.topDps ?? 0).toLocaleString('ko-KR')}/초`],
            ['최근 집계 일수', `${daily.length}일`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-slate-300 bg-white p-4">
              <p className="text-xs font-black text-slate-500">{label}</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
            </div>
          ))}
        </section>

        <section className="mt-5 rounded-lg border border-slate-300 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-black">최근 14일 사용시간</h2>
            <p className="text-xs font-bold text-slate-500">일별 합산</p>
          </div>
          <div className="mt-4 grid min-h-44 grid-cols-7 items-end gap-2 sm:grid-cols-14">
            {daily.length === 0 ? (
              <p className="col-span-full py-10 text-center text-sm font-bold text-slate-500">아직 사용시간 데이터가 없어요.</p>
            ) : daily.map((day) => {
              const seconds = Number(day.playSeconds) || 0;
              const height = Math.max(8, Math.round((seconds / maxDailySeconds) * 140));
              return (
                <div key={day.date} className="flex min-w-0 flex-col items-center gap-2">
                  <div
                    className="w-full rounded-t-md bg-teal-500"
                    style={{ height }}
                    title={`${day.date}: ${formatDuration(seconds)}`}
                  />
                  <p className="w-full truncate text-center text-[10px] font-bold text-slate-500">
                    {String(day.date).slice(5)}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-5 overflow-hidden rounded-lg border border-slate-300 bg-white">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
            <h2 className="text-lg font-black">가입자별 데이터</h2>
            <p className="text-xs font-bold text-slate-500">최근 접속순 최대 100명</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[840px] text-left text-sm">
              <thead className="bg-slate-100 text-xs font-black text-slate-600">
                <tr>
                  <th className="px-4 py-3">유저</th>
                  <th className="px-4 py-3">가입일</th>
                  <th className="px-4 py-3">마지막 접속</th>
                  <th className="px-4 py-3">사용시간</th>
                  <th className="px-4 py-3">세션</th>
                  <th className="px-4 py-3">영양분</th>
                  <th className="px-4 py-3">DPS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-10 text-center font-bold text-slate-500">
                      아직 가입자 데이터가 없어요.
                    </td>
                  </tr>
                ) : users.map((user) => (
                  <tr key={user.id} className="hover:bg-teal-50/60">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {user.profileImage ? (
                          <img src={user.profileImage} alt="" className="h-8 w-8 rounded-full object-cover" />
                        ) : (
                          <span className="grid h-8 w-8 place-items-center rounded-full bg-slate-200 text-xs">유저</span>
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-black">{user.nickname}</p>
                          <p className="truncate text-xs text-slate-500">{user.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold">{formatDateTime(user.createdAt)}</td>
                    <td className="px-4 py-3 font-semibold">{formatDateTime(user.lastSeenAt)}</td>
                    <td className="px-4 py-3 font-black text-teal-700">{formatDuration(user.totalPlaySeconds)}</td>
                    <td className="px-4 py-3 font-semibold">{user.sessionCount ?? 0}</td>
                    <td className="px-4 py-3 font-semibold">{Number(user.gold ?? 0).toLocaleString('ko-KR')}</td>
                    <td className="px-4 py-3 font-semibold">+{Number(user.dps ?? 0).toLocaleString('ko-KR')}/초</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
};

const App = () => {
  if (window.location.pathname === '/admin') {
    return <AdminDashboard />;
  }

  const [authUser, setAuthUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isRankingOpen, setIsRankingOpen] = useState(false);
  const [rankings, setRankings] = useState([]);
  const [isRankingLoading, setIsRankingLoading] = useState(false);
  const [cloudSaveStatus, setCloudSaveStatus] = useState('idle');
  const cloudSaveOwnerRef = useRef(null);
  // ==================== 게임 상태(State) 관리 ====================
  // 현재 보유한 영양분 코인 수량
  const [gold, setGold] = useState(0);
  
  // 현재 매입한 화장실 단계 (0 = 시골 푸세식, 5 = 순금 황제 변기궁전)
  const [currentToiletLevel, setCurrentToiletLevel] = useState(0);

  // 똥 캐릭터별 강화 레벨 (0 = 잠김, 1 이상 = 해금)
  const [poopLevels, setPoopLevels] = useState(initialPoopLevels);

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

  // 초기화 모달 안의 숨겨진 테스트 모드 상태
  const [isDeveloperModeOpen, setIsDeveloperModeOpen] = useState(false);
  const resetClickCountRef = useRef(0);
  const resetTimerRef = useRef(null);

  // 저장 데이터를 읽기 전에 초기값이 덮어쓰는 것을 방지
  const [isSaveLoaded, setIsSaveLoaded] = useState(false);

  // 청소 직원 습격 이벤트 상태
  const [cleanerEvent, setCleanerEvent] = useState(null);
  const [cleanerMessage, setCleanerMessage] = useState('');
  const [cleanerSpawnAttempt, setCleanerSpawnAttempt] = useState(0);
  const goldRef = useRef(gold);

  const localStorageKey = 'poop-pr-save';

  useEffect(() => {
    let isMounted = true;
    fetch('/api/me')
      .then((response) => response.ok ? response.json() : { user: null })
      .then(({ user }) => {
        if (isMounted) setAuthUser(user);
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

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    setAuthUser(null);
    setCloudSaveStatus('idle');
    cloudSaveOwnerRef.current = null;
  };

  const itemDps = cleaningItems.reduce(
    (total, item, index) => total + item.dps * (itemLevels[index] ?? 0),
    0
  );
  const activeCleaningItems = cleaningItems.filter(
    (_, index) => (itemLevels[index] ?? 0) > 0
  );
  const toiletDps = toilets[currentToiletLevel]?.dpsBonus ?? 0;
  const currentCleanerPenaltyRate = toilets[currentToiletLevel]?.cleanerPenaltyRate ?? 0.1;
  const currentPoopLevel = getHighestUnlockedPoopId(poopLevels);
  const unlockedPoop = poopCharacters[currentPoopLevel] ?? poopCharacters[0];
  const selectedPoop = poopCharacters.find((poop) => poop.id === selectedPoopId && (poopLevels[poop.id] ?? 0) > 0) ?? unlockedPoop;
  const currentPoop = selectedPoop;
  const poopLevel = poopLevels[currentPoop.id] ?? 1;
  const nextPoop = poopCharacters[currentPoop.id + 1] ?? null;
  const canEvolvePoop = Boolean(nextPoop && (poopLevels[nextPoop.id] ?? 0) === 0 && poopLevel >= currentPoop.evolutionLevel);
  const poopUpgradePrice = getPoopUpgradePrice(currentPoop, poopLevel);
  const { clickPower: baseClickPower, dps: characterDps } = getPoopStats(currentPoop, poopLevel);
  const dps = toiletDps + characterDps + itemDps;
  const activeClickBonus = Math.floor(dps * activeClickDpsBonusRate);
  const clickPower = baseClickPower + activeClickBonus;
  const scoreRef = useRef({ gold, dps, toiletLevel: currentToiletLevel, poopLevel });
  const gameSaveRef = useRef({
    gold,
    toiletLevel: currentToiletLevel,
    poopLevels,
    selectedPoopId: currentPoop.id,
    itemLevels,
  });

  useEffect(() => {
    scoreRef.current = { gold, dps, toiletLevel: currentToiletLevel, poopLevel };
  }, [gold, dps, currentToiletLevel, poopLevel]);

  useEffect(() => {
    gameSaveRef.current = {
      gold,
      toiletLevel: currentToiletLevel,
      poopLevels,
      selectedPoopId: currentPoop.id,
      itemLevels,
    };
  }, [gold, currentToiletLevel, poopLevels, currentPoop.id, itemLevels]);

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
          const savedPoopLevels = poopCharacters.map((_, index) => save.poopLevels[index] ?? 0);
          const savedItemLevels = cleaningItems.map((_, index) => save.itemLevels[index] ?? 0);
          setGold(save.gold);
          setCurrentToiletLevel(Math.min(toilets.length - 1, save.toiletLevel));
          setPoopLevels(savedPoopLevels.some((level) => level > 0) ? savedPoopLevels : initialPoopLevels);
          setSelectedPoopId(save.selectedPoopId);
          setItemLevels(savedItemLevels);
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

  useEffect(() => {
    if (!authUser || !isSaveLoaded) return;

    const syncScore = () => {
      fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scoreRef.current),
      }).catch(() => {});
    };

    syncScore();
    const interval = setInterval(syncScore, 10000);
    return () => clearInterval(interval);
  }, [authUser, isSaveLoaded]);

  useEffect(() => {
    if (!authUser || !isSaveLoaded) return;

    let lastActiveAt = Date.now();
    let hasSentSessionStart = false;

    const sendActivity = (seconds) => {
      const roundedSeconds = Math.max(0, Math.min(300, Math.round(seconds)));
      fetch('/api/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seconds: roundedSeconds,
          sessionStart: !hasSentSessionStart,
        }),
        keepalive: true,
      }).catch(() => {});
      hasSentSessionStart = true;
    };

    sendActivity(0);

    const interval = setInterval(() => {
      const now = Date.now();
      if (document.visibilityState === 'hidden') {
        lastActiveAt = now;
        return;
      }

      sendActivity((now - lastActiveAt) / 1000);
      lastActiveAt = now;
    }, 30000);

    const handleVisibilityChange = () => {
      lastActiveAt = Date.now();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [authUser, isSaveLoaded]);

  const handleRankingOpen = async () => {
    setIsRankingOpen(true);
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
      const savedToiletLevel = parsed.currentToiletLevel ?? 0;

      setGold(parsed.gold ?? 0);
      setCurrentToiletLevel(savedToiletLevel);
      const savedPoopLevels = getSavedPoopLevels(parsed);
      const savedUnlockedPoopId = getHighestUnlockedPoopId(savedPoopLevels);
      const savedUnlockedPoop = poopCharacters[savedUnlockedPoopId] ?? poopCharacters[0];
      const savedSelectedPoopId = Number.isFinite(parsed.selectedPoopId)
        ? parsed.selectedPoopId
        : savedUnlockedPoop.id;

      setPoopLevels(savedPoopLevels);
      setSelectedPoopId(
        poopCharacters.some((poop) => poop.id === savedSelectedPoopId && (savedPoopLevels[poop.id] ?? 0) > 0)
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
        poopLevels,
        selectedPoopId: currentPoop.id,
        itemLevels,
      };
      localStorage.setItem(localStorageKey, JSON.stringify(saveData));
    } catch (error) {
      console.warn('게임 데이터를 저장하는 중 오류가 발생했습니다.', error);
    }
  }, [gold, currentToiletLevel, currentPoopLevel, poopLevel, poopLevels, currentPoop.id, itemLevels, isSaveLoaded]);

  useEffect(() => {
    if ((poopLevels[selectedPoopId] ?? 0) === 0) {
      setSelectedPoopId(unlockedPoop.id);
    }
  }, [selectedPoopId, poopLevels, unlockedPoop.id]);

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
    setPoopLevels(prevLevels =>
      prevLevels.map((level, index) => index === currentPoop.id ? level + 1 : level)
    );
  };

  const handlePoopEvolve = () => {
    if (!canEvolvePoop || !nextPoop) return;

    setPoopLevels(prevLevels =>
      prevLevels.map((level, index) => index === nextPoop.id ? 1 : level)
    );
    setSelectedPoopId(nextPoop.id);
  };

  const handlePoopSelect = (poopId) => {
    const poop = poopCharacters[poopId];
    if (!poop || (poopLevels[poopId] ?? 0) === 0) return;

    setSelectedPoopId(poopId);
  };

  // ==================== 게임 초기화 리셋 핸들러 ====================
  const handleResetGame = () => {
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
    resetClickCountRef.current = 0;
    setGold(0);
    setCurrentToiletLevel(0);
    setPoopLevels(initialPoopLevels);
    setSelectedPoopId(0);
    setItemLevels(initialItemLevels);
    setIsShopOpen(false);
    setIsItemShopOpen(false);
    setIsPoopShopOpen(false);
    setIsResetConfirmOpen(false);
    setIsDeveloperModeOpen(false);
    localStorage.removeItem(localStorageKey);
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

    if (resetClickCountRef.current >= 3) {
      resetClickCountRef.current = 0;
      setIsDeveloperModeOpen(true);
      return;
    }

    resetTimerRef.current = setTimeout(() => {
      resetTimerRef.current = null;
      handleResetGame();
    }, 500);
  };

  const handleDeveloperGoldCharge = () => {
    setGold(prevGold => prevGold + developerGoldAmount);
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
  const evolutionProgress = currentPoop.evolutionLevel
    ? Math.min(100, (poopLevel / currentPoop.evolutionLevel) * 100)
    : 100;

  // ==================== JSX 렌더링 ====================
  return (
    <div
      className={`
        min-h-[100svh] h-[100svh] w-full max-w-[440px] mx-auto
        bg-gradient-to-b ${currentBgGradient}
        relative flex flex-col items-center justify-between
        p-3 transition-all duration-500 ease-in-out
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
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-cyan-950/10 via-transparent to-slate-950/30" />

      {/* ==================== 상단: 고정형 게임 HUD ==================== */}
      <div className="relative z-30 w-full shrink-0 space-y-2">
        <div className="flex min-h-10 items-center justify-between gap-2 rounded-2xl border-[3px] border-amber-950/70 bg-[#fff7df] px-2.5 py-1.5 shadow-[0_4px_0_#78350f,0_7px_14px_rgba(0,0,0,0.18)]">
          {authUser ? (
            <>
              <div className="flex min-w-0 items-center gap-2">
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
                </div>
              </div>
              <div className="flex shrink-0 gap-1.5">
                <button type="button" onClick={handleRankingOpen} className="rounded-xl bg-amber-400 px-2.5 py-1.5 text-[10px] font-black text-amber-950 shadow-[0_2px_0_#92400e] active:translate-y-0.5 active:shadow-none">
                  🏆 랭킹
                </button>
                <button type="button" onClick={handleLogout} className="rounded-xl bg-slate-700 px-2.5 py-1.5 text-[10px] font-black text-white shadow-[0_2px_0_#0f172a] active:translate-y-0.5 active:shadow-none">
                  로그아웃
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-[10px] font-black text-slate-700">로그인하면 랭킹에 참여할 수 있어요</p>
              <div className="flex shrink-0 gap-1.5">
                <button type="button" onClick={handleRankingOpen} className="rounded-xl bg-amber-400 px-2.5 py-1.5 text-[10px] font-black text-amber-950 shadow-[0_2px_0_#92400e] active:translate-y-0.5 active:shadow-none">🏆</button>
                <button type="button" onClick={handleKakaoLogin} disabled={isAuthLoading} className="rounded-xl border-2 border-[#3c1e1e] bg-[#FEE500] px-3 py-1.5 text-[10px] font-black text-[#191919] shadow-[0_2px_0_#3c1e1e] active:translate-y-0.5 active:shadow-none disabled:opacity-50">
                  카카오 로그인
                </button>
              </div>
            </>
          )}
        </div>

        <div className="grid grid-cols-2 divide-x-[3px] divide-cyan-950/40 overflow-hidden rounded-[1.4rem] border-[3px] border-cyan-950/70 bg-gradient-to-b from-cyan-300 via-cyan-400 to-cyan-600 text-white shadow-[0_7px_0_rgba(8,51,68,0.9),0_12px_24px_rgba(0,0,0,0.3)]">
          <div
            className="relative px-4 py-3 before:pointer-events-none before:absolute before:inset-x-2 before:top-1 before:h-1/3 before:rounded-full before:bg-white/20"
            onDoubleClick={handleResetModalOpen}
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
          </p>
        </div>
      </div>

      {/* ==================== 중앙: 똥 클릭 버튼 ==================== */}
      <div
        className="relative z-20 flex min-h-0 w-full flex-1 cursor-pointer flex-col items-center justify-center py-2"
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
          <div className="absolute left-1/2 top-2 z-40 w-[min(100%,360px)] -translate-x-1/2 rounded-lg border border-red-200/80 bg-red-950/85 p-3 text-white shadow-2xl backdrop-blur-md">
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
      <div className="relative z-30 grid w-full shrink-0 grid-cols-3 gap-2 pb-[calc(env(safe-area-inset-bottom)+0.45rem)]">
        <button
          onClick={() => setIsPoopShopOpen(true)}
          className="flex min-h-[66px] flex-col items-center justify-center rounded-[1.35rem] border-[3px] border-amber-700 bg-gradient-to-b from-yellow-300 via-amber-300 to-amber-500 px-2 py-2 text-[11px] font-black text-amber-950 shadow-[0_7px_0_#92400e,0_11px_18px_rgba(0,0,0,0.28)] transition-all hover:brightness-105 active:translate-y-1 active:shadow-[0_2px_0_#92400e]"
        >
          <span className="text-2xl drop-shadow-sm" aria-hidden="true">💩</span>
          <span className="mt-0.5">똥 강화</span>
        </button>
        <button
          onClick={() => setIsItemShopOpen(true)}
          className="flex min-h-[66px] flex-col items-center justify-center rounded-[1.35rem] border-[3px] border-teal-800 bg-gradient-to-b from-cyan-300 via-teal-300 to-teal-500 px-2 py-2 text-[11px] font-black text-teal-950 shadow-[0_7px_0_#115e59,0_11px_18px_rgba(0,0,0,0.28)] transition-all hover:brightness-105 active:translate-y-1 active:shadow-[0_2px_0_#115e59]"
        >
          <span className="text-2xl drop-shadow-sm" aria-hidden="true">🧹</span>
          <span className="mt-0.5">청소 장비</span>
        </button>
        <button
          onClick={() => setIsShopOpen(true)}
          className="flex min-h-[66px] flex-col items-center justify-center rounded-[1.35rem] border-[3px] border-orange-800 bg-gradient-to-b from-orange-300 via-orange-300 to-red-400 px-2 py-2 text-[11px] font-black text-red-950 shadow-[0_7px_0_#9a3412,0_11px_18px_rgba(0,0,0,0.28)] transition-all hover:brightness-105 active:translate-y-1 active:shadow-[0_2px_0_#9a3412]"
        >
          <span className="text-2xl drop-shadow-sm" aria-hidden="true">🚽</span>
          <span className="mt-0.5">화장실 매입</span>
        </button>
      </div>

      {isRankingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setIsRankingOpen(false)}>
          <div className="w-full max-w-sm overflow-hidden rounded-[1.75rem] border-[3px] border-amber-950 bg-[#fff8e8] shadow-[0_8px_0_#78350f,0_18px_40px_rgba(0,0,0,0.4)]" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b-[3px] border-amber-950 bg-gradient-to-b from-yellow-300 to-amber-400 px-4 py-3">
              <div>
                <h2 className="text-lg font-black text-amber-950">🏆 전체 랭킹</h2>
                <p className="text-[10px] font-bold text-amber-900">현재 보유 영양분 기준</p>
              </div>
              <button type="button" onClick={() => setIsRankingOpen(false)} className="rounded-xl border-2 border-amber-950 bg-white/80 px-2.5 py-1 text-lg font-black text-amber-950 shadow-[0_3px_0_#78350f]">✕</button>
            </div>
            <div className="max-h-[55vh] space-y-2 overflow-y-auto p-3">
              {isRankingLoading ? (
                <p className="py-8 text-center text-sm font-bold text-slate-500">랭킹을 불러오는 중...</p>
              ) : rankings.length === 0 ? (
                <p className="py-8 text-center text-sm font-bold text-slate-500">아직 등록된 점수가 없어요.</p>
              ) : rankings.map((entry, index) => {
                const rankingPoop = poopCharacters[entry.selectedPoopId] ?? poopCharacters[0];
                const rankingPoopLevel = entry.poopLevels?.[rankingPoop.id] ?? entry.poopLevel ?? 1;
                const rankingToilet = toilets[entry.toiletLevel] ?? toilets[0];
                const ownedItems = cleaningItems.filter((item) => (entry.itemLevels?.[item.id] ?? 0) > 0);

                return (
                  <div key={entry.id} className={`rounded-2xl border-2 px-3 py-2 ${entry.id === authUser?.id ? 'border-amber-500 bg-yellow-100' : 'border-amber-900/20 bg-white'}`}>
                    <div className="flex items-center gap-2">
                      <span className="w-7 shrink-0 text-center text-base font-black text-amber-900">{index < 3 ? ['🥇', '🥈', '🥉'][index] : index + 1}</span>
                      {entry.profileImage ? <img src={entry.profileImage} alt="" className="h-9 w-9 rounded-full border-2 border-amber-800 object-cover" /> : <span className="grid h-9 w-9 place-items-center rounded-full bg-amber-200">👤</span>}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-black text-slate-800">{entry.nickname}{entry.id === authUser?.id ? ' (나)' : ''}</p>
                        <p className="text-[9px] font-bold text-slate-500">초당 +{formatNumber(entry.dps)}</p>
                      </div>
                      <p className="shrink-0 text-sm font-black text-amber-700">{formatNumber(entry.gold)} 💰</p>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-1.5 border-t border-amber-900/15 pt-2 text-[9px] font-bold text-slate-700">
                      <div className="flex min-w-0 items-center gap-1.5 rounded-lg bg-amber-100/80 px-2 py-1">
                        <img src={rankingPoop.image} alt="" className="h-7 w-7 shrink-0 object-contain" />
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
                  </div>
                );
              })}
            </div>
          </div>
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
            <h2 className="text-lg font-black">게임 초기화</h2>
            <p className="mt-2 text-sm font-semibold text-gray-600">
              저장된 영양분, 똥 레벨, 장비, 화장실을 모두 처음으로 되돌릴까요?
            </p>
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
                onClick={handleResetButtonClick}
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
          <div className="flex max-h-[86vh] w-full max-w-[440px] flex-col overflow-hidden rounded-t-[1.75rem] border-[3px] border-b-0 border-cyan-950 bg-[#fff8e8] shadow-2xl">
            <div className="flex items-center justify-between border-b-[3px] border-cyan-950 bg-gradient-to-b from-cyan-400 to-cyan-600 p-4 text-white">
              <div>
                <h2 className="text-xl font-black">💩 똥 강화</h2>
                <p className="mt-1 text-xs font-semibold text-cyan-950">각 똥은 Lv.1부터 성장하고 조건 달성 시 진화해요</p>
              </div>
              <button
                onClick={() => setIsPoopShopOpen(false)}
                className="rounded-xl border-2 border-cyan-950 bg-white/80 px-2.5 py-1 text-xl font-black text-cyan-950 shadow-[0_3px_0_#083344] active:translate-y-0.5"
                aria-label="똥 강화 상점 닫기"
              >
                ✕
              </button>
            </div>

            <div className="border-b border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900">
              <div className="flex items-center justify-between gap-3">
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
                    : `${nextPoop.name}까지 ${currentPoop.evolutionLevel - poopLevel}레벨`
                    : '최종 진화 완료'}
                </span>
              </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              <div className="rounded-2xl border-[3px] border-amber-700 bg-amber-50 p-4 shadow-[0_5px_0_#92400e]">
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
                    disabled={gold < poopUpgradePrice}
                    className={`mt-4 w-full rounded-2xl border-[3px] py-2.5 font-black transition-all ${
                      gold >= poopUpgradePrice
                        ? 'border-orange-800 bg-gradient-to-b from-orange-300 to-red-400 text-red-950 shadow-[0_5px_0_#9a3412] active:translate-y-1 active:shadow-[0_1px_0_#9a3412]'
                        : 'cursor-not-allowed border-slate-300 bg-gray-200 text-gray-500'
                    }`}
                  >
                    Lv.{poopLevel + 1} 강화하기 · {formatNumber(poopUpgradePrice)} 💰
                  </button>
                )}
              </div>

              {poopCharacters.map((poop) => {
                const ownedLevel = poopLevels[poop.id] ?? 0;
                const isOwned = ownedLevel > 0;
                const isSelected = currentPoop.id === poop.id;
                const stageStats = getPoopStats(poop, Math.max(1, ownedLevel));

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
                          {!isSelected && isOwned && <span className="text-xs font-bold text-emerald-600">✓ Lv.{ownedLevel}</span>}
                        </div>
                        <p className="mt-1 text-xs text-gray-500">{poop.description}</p>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs font-bold">
                          <span className="rounded bg-amber-50 px-2 py-1 text-amber-700">
                            {poop.evolutionLevel ? `Lv.${poop.evolutionLevel} 진화` : '최종 단계'}
                          </span>
                          <span className="rounded bg-blue-50 px-2 py-1 text-blue-700">
                            {isOwned ? `클릭 +${formatNumber(stageStats.clickPower)}` : `기본 클릭 +${formatNumber(poop.baseClickPower)}`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {isOwned && !isSelected && (
                      <button
                        onClick={() => handlePoopSelect(poop.id)}
	                        className="mt-3 w-full rounded-2xl border-[3px] border-teal-800 bg-gradient-to-b from-teal-300 to-teal-500 py-2 text-sm font-black text-teal-950 shadow-[0_4px_0_#115e59] transition-all active:translate-y-1 active:shadow-[0_1px_0_#115e59]"
                      >
                        이 똥 사용하기 · 자동 +{formatNumber(stageStats.dps)}/초
                      </button>
                    )}

                    {!isOwned && (
                      <div className="mt-3 rounded-lg bg-gray-200 py-2 text-center text-xs font-bold text-gray-500">
                        🔒 이전 똥 진화 필요
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
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-3">
          <div className="flex max-h-[86vh] w-full max-w-[440px] flex-col overflow-hidden rounded-t-[1.75rem] border-[3px] border-b-0 border-cyan-950 bg-[#fff8e8] shadow-2xl">
            <div className="flex items-center justify-between border-b-[3px] border-cyan-950 bg-gradient-to-b from-cyan-400 to-cyan-600 p-4 text-white">
              <div>
                <h2 className="text-xl font-black">🧰 청소 장비</h2>
                <p className="mt-1 text-xs font-semibold text-cyan-950">장비를 강화해 초당 생산량을 늘리세요</p>
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
                        className={`mt-3 w-full rounded-2xl border-[3px] py-2 font-black transition-all ${
                          canPurchase
                            ? 'border-teal-800 bg-gradient-to-b from-teal-300 to-teal-500 text-teal-950 shadow-[0_4px_0_#115e59] active:translate-y-1 active:shadow-[0_1px_0_#115e59]'
                            : 'cursor-not-allowed border-slate-300 bg-gray-200 text-gray-500'
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
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-3">
          <div className="flex max-h-[86vh] w-full max-w-[440px] flex-col overflow-hidden rounded-t-[1.75rem] border-[3px] border-b-0 border-cyan-950 bg-[#fff8e8] shadow-2xl">
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between border-b-[3px] border-cyan-950 bg-gradient-to-b from-cyan-400 to-cyan-600 p-4 text-white">
              <div>
                <h2 className="text-xl font-black">🏢 화장실 매입</h2>
                <p className="mt-1 text-xs font-semibold text-cyan-950">배경과 기본 생산량을 업그레이드해요</p>
              </div>
              <button
                onClick={() => setIsShopOpen(false)}
                className="rounded-xl border-2 border-cyan-950 bg-white/80 px-2.5 py-1 text-xl font-black text-cyan-950 shadow-[0_3px_0_#083344] active:translate-y-0.5"
                aria-label="화장실 매입 상점 닫기"
              >
                ✕
              </button>
            </div>

            {/* 모달 콘텐츠 (스크롤 가능) */}
            <div className="flex-1 overflow-y-auto p-4">
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
	                      mb-3 rounded-2xl border-[3px] p-3 shadow-[0_4px_0_rgba(15,23,42,0.22)] transition-all
	                      ${isOwned
	                        ? 'border-emerald-300 bg-emerald-50'
	                        : canPurchase
	                        ? 'border-amber-300 bg-amber-50'
	                        : 'border-slate-200 bg-white'
	                      }
	                    `}
	                  >
	                    {toilet.image && (
	                      <img
	                        src={toilet.image}
	                        alt={toilet.name}
	                        className="mb-3 h-28 w-full rounded-lg object-cover"
	                      />
	                    )}
	                    {/* 화장실 이름 및 상태 배지 */}
	                    <div className="mb-2 flex items-center justify-between gap-2">
	                      <h3 className="min-w-0 truncate text-base font-black text-slate-900">
	                        {toilet.name}
	                      </h3>
	                      {isOwned && (
	                        <span className="shrink-0 rounded bg-emerald-500 px-2 py-1 text-xs font-bold text-white">
	                          ✓ 보유중
	                        </span>
	                      )}
                    </div>

                    {/* 화장실 정보 */}
	                    <div className="mb-3 grid grid-cols-2 gap-2 text-sm">
	                      <div>
	                        <p className="text-xs font-bold text-slate-500">가격</p>
	                        <p className={`font-black ${gold >= toilet.price && !isOwned ? 'text-emerald-600' : 'text-slate-900'}`}>
	                          {formatNumber(toilet.price)} 💰
	                        </p>
	                      </div>
	                      <div>
	                        <p className="text-xs font-bold text-slate-500">DPS 보너스</p>
	                        <p className="font-black text-sky-600">
	                          +{formatNumber(toilet.dpsBonus)}
	                        </p>
	                      </div>
                    </div>

                    {/* 매입하기 버튼 또는 소유 표시 */}
                    {isOwned ? (
	                      <button
	                        disabled
	                        className="w-full cursor-default rounded-lg bg-emerald-500 py-2 font-bold text-white opacity-70"
	                      >
	                        ✓ 이미 구매함
	                      </button>
                    ) : (
                      <button
                        onClick={() => handleToiletPurchase(toilet.id)}
                        disabled={!canPurchase}
                        className={`
	                          w-full rounded-2xl border-[3px] py-2 font-black transition-all
	                          ${canPurchase
	                            ? 'cursor-pointer border-cyan-800 bg-gradient-to-b from-cyan-300 to-cyan-500 text-cyan-950 shadow-[0_4px_0_#155e75] active:translate-y-1 active:shadow-[0_1px_0_#155e75]'
	                            : 'cursor-not-allowed border-slate-300 bg-slate-200 text-slate-500 opacity-70'
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
            <div className="border-t border-slate-200 bg-white p-3">
              <button
                onClick={() => setIsShopOpen(false)}
                className="w-full rounded-lg bg-slate-200 px-4 py-2 text-sm font-bold text-slate-900 transition-colors hover:bg-slate-300"
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
