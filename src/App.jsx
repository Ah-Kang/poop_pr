import React, { useState, useEffect } from 'react';
import villageToiletImage from './assets/poop_gr1.png';

// ==================== 화장실 데이터 배열 ====================
// 각 화장실의 정보: 이름, 가격, dps 보너스, 배경색
const toilets = [
  {
    id: 0,
    name: '시골 푸세식 화장실',
    price: 0,
    dpsBonus: 0,
    bgColor: 'bg-amber-100',
    bgGradient: 'from-amber-200 to-amber-100',
    image: villageToiletImage
  },
  {
    id: 1,
    name: '지하철 공중화장실',
    price: 100,
    dpsBonus: 5,
    bgColor: 'bg-gray-200',
    bgGradient: 'from-gray-300 to-gray-200'
  },
  {
    id: 2,
    name: '백화점 파우더룸',
    price: 1000,
    dpsBonus: 50,
    bgColor: 'bg-pink-200',
    bgGradient: 'from-pink-300 to-pink-200'
  },
  {
    id: 3,
    name: '7성급 호텔 화장실',
    price: 10000,
    dpsBonus: 250,
    bgColor: 'bg-slate-300',
    bgGradient: 'from-slate-400 to-slate-300'
  },
  {
    id: 4,
    name: '우주선 무중력 화장실',
    price: 50000,
    dpsBonus: 1000,
    bgColor: 'bg-indigo-300',
    bgGradient: 'from-indigo-400 to-indigo-300'
  },
  {
    id: 5,
    name: '순금 황제 변기궁전',
    price: 200000,
    dpsBonus: 2500,
    bgColor: 'bg-yellow-200',
    bgGradient: 'from-yellow-300 to-yellow-200'
  }
];

const App = () => {
  // ==================== 게임 상태(State) 관리 ====================
  // 현재 보유한 영양분 코인 수량
  const [gold, setGold] = useState(0);
  
  // 한 번 클릭할 때 얻는 영양분 수량
  const [clickPower, setClickPower] = useState(1);
  
  // 초당 자동으로 생산되는 영양분 수량
  const [dps, setDps] = useState(0);
  
  // 현재 매입한 화장실 단계 (0 = 시골 푸세식, 5 = 순금 황제 변기궁전)
  const [currentToiletLevel, setCurrentToiletLevel] = useState(0);
  
  // 화장실 매입 상점 팝업창의 열림/닫힘 상태
  const [isShopOpen, setIsShopOpen] = useState(false);
  
  // 클릭 애니메이션 트리거 (팝핑 효과)
  const [isClicking, setIsClicking] = useState(false);

  // 숨겨진 리셋 버튼 노출 상태
  const [showResetButton, setShowResetButton] = useState(false);

  const localStorageKey = 'poop-pr-save';

  // ==================== 로컬 저장/불러오기 ====================
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(localStorageKey);
      if (!savedData) return;

      const parsed = JSON.parse(savedData);
      const savedToiletLevel = parsed.currentToiletLevel ?? 0;

      setGold(parsed.gold ?? 0);
      setClickPower(parsed.clickPower ?? 1);
      setCurrentToiletLevel(savedToiletLevel);
      setDps(toilets[savedToiletLevel]?.dpsBonus ?? 0);
    } catch (error) {
      console.warn('저장된 게임 데이터를 불러오는 중 오류가 발생했습니다.', error);
    }
  }, []);

  useEffect(() => {
    try {
      const saveData = {
        gold,
        clickPower,
        currentToiletLevel,
      };
      localStorage.setItem(localStorageKey, JSON.stringify(saveData));
    } catch (error) {
      console.warn('게임 데이터를 저장하는 중 오류가 발생했습니다.', error);
    }
  }, [gold, clickPower, dps, currentToiletLevel]);

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
    
    // 3. DPS 업데이트 (해당 화장실의 dps로 설정, 누적되지 않음)
    setDps(toilet.dpsBonus);
    
    // 4. 모달 자동 닫기 (매입 성공 후)
    setIsShopOpen(false);
  };

  // ==================== 게임 초기화 리셋 핸들러 ====================
  const handleResetGame = () => {
    setGold(0);
    setClickPower(1);
    setDps(0);
    setCurrentToiletLevel(0);
    setIsShopOpen(false);
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

  const handleSecretDoubleClick = () => {
    setShowResetButton(true);
  };

  // ==================== JSX 렌더링 ====================
  return (
    <div
      className={`
        min-h-screen w-full max-w-md mx-auto
        bg-gradient-to-b ${currentBgGradient}
        flex flex-col items-center justify-between
        p-6 transition-all duration-500 ease-in-out
        overflow-hidden
      `}
      style={{
        aspectRatio: '9 / 16',
        backgroundImage: currentBgImage
          ? `url(${currentBgImage})`
          : `linear-gradient(to bottom, var(--tw-gradient-stops))`,
        backgroundSize: currentBgImage ? 'cover' : undefined,
        backgroundPosition: currentBgImage ? 'center' : undefined,
        backgroundRepeat: currentBgImage ? 'no-repeat' : undefined,
      }}
    >
      <div
        className="absolute top-3 right-3 w-16 h-16 z-20"
        onDoubleClick={handleSecretDoubleClick}
      />
      {/* ==================== 상단: 스탯 표시 영역 ==================== */}
      <div className="w-full text-center pt-4">
        {/* 현재 보유 코인 */}
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-1">
            영양분 💰
          </p>
          <p className="text-4xl font-bold text-gray-900">
            {formatNumber(gold)}
          </p>
        </div>

        {/* 초당 생산량 (DPS) */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-1">
            초당 생산량 ⚡
          </p>
          <p className="text-2xl font-bold text-green-600">
            +{formatNumber(dps)} / sec
          </p>
        </div>

        {/* 현재 화장실 단계 표시 */}
        <div className="mt-4 inline-block px-4 py-2 bg-white bg-opacity-60 rounded-lg">
          <p className="text-xs font-semibold text-gray-800">
            📍 {toilets[currentToiletLevel].name}
          </p>
        </div>
      </div>

      {/* ==================== 중앙: 똥 클릭 버튼 ==================== */}
      <div className="flex flex-col items-center justify-center flex-1">
        <button
          onClick={handlePoopClick}
          className={`
            text-9xl cursor-pointer transition-transform duration-300 ease-out
            filter drop-shadow-lg hover:drop-shadow-2xl
            ${isClicking ? 'scale-125' : 'scale-100'}
          `}
          style={{
            transform: isClicking ? 'scale(1.25)' : 'scale(1)',
            filter: isClicking 
              ? 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.3))' 
              : 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2))',
          }}
        >
          💩
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

      {/* ==================== 하단: 화장실 매입 버튼 ==================== */}
      <button
        onClick={() => setIsShopOpen(true)}
        className={`
          w-full py-4 px-6 rounded-lg font-bold text-lg
          transition-all duration-300 ease-in-out
          ${isShopOpen 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-2xl transform hover:scale-105 active:scale-95'
          }
        `}
        disabled={isShopOpen}
      >
        🏢 화장실 매입 상점
      </button>

      {showResetButton && (
        <div className="w-full space-y-3">
          <button
            onClick={handleResetGame}
            className="w-full py-4 px-6 rounded-lg font-bold text-lg bg-white text-gray-900 border border-gray-200 hover:bg-gray-100 transition-all duration-300"
          >
            ♻️ 게임 리셋
          </button>
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
      `}</style>
    </div>
  );
};

export default App;
