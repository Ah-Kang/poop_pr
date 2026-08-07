import React, { useState, useEffect, useRef } from 'react';
import roadsidePitToiletImage from './assets/toilet-stages/toilet-roadside-pit.webp';
import ruralOuthouseToiletImage from './assets/toilet-stages/toilet-rural-outhouse.webp';
import oldSchoolToiletImage from './assets/toilet-stages/toilet-old-school.webp';
import subwayPublicToiletImage from './assets/toilet-stages/toilet-subway-public.webp';
import convenienceStoreToiletImage from './assets/toilet-stages/toilet-convenience-store.webp';
import jjimjilbangToiletImage from './assets/toilet-stages/toilet-jjimjilbang.webp';
import cozyCafeToiletImage from './assets/toilet-stages/toilet-cozy-cafe.webp';
import departmentPowderToiletImage from './assets/toilet-stages/toilet-department-powder.webp';
import hotelSuiteToiletImage from './assets/toilet-stages/toilet-hotel-suite.webp';
import sevenStarHotelToiletImage from './assets/toilet-stages/toilet-seven-star-hotel.webp';
import presidentialPrivateToiletImage from './assets/toilet-stages/toilet-presidential-private.webp';
import royalPalaceToiletImage from './assets/toilet-stages/toilet-royal-palace.webp';
import deepSeaSubmarineToiletImage from './assets/toilet-stages/toilet-deep-sea-submarine.webp';
import spaceshipZeroGToiletImage from './assets/toilet-stages/toilet-spaceship-zero-g.webp';
import moonBaseToiletImage from './assets/toilet-stages/toilet-moon-base.webp';
import marsColonyToiletImage from './assets/toilet-stages/toilet-mars-colony.webp';
import galaxyTrainToiletImage from './assets/toilet-stages/toilet-galaxy-train.webp';
import heavenCloudToiletImage from './assets/toilet-stages/toilet-heaven-cloud.webp';
import sacredTempleToiletImage from './assets/toilet-stages/toilet-sacred-temple.webp';
import goldEmperorPalaceToiletImage from './assets/toilet-stages/toilet-gold-emperor-palace.webp';
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
// 각 화장실의 정보: 이름, 가격, dps 보너스, 배경색
const toilets = [
  {
    id: 0,
    name: '길가 구덩이 화장실',
    price: 0,
    dpsBonus: 0,
    cleanerPenaltyRate: 0.1,
    bgColor: 'bg-stone-100',
    bgGradient: 'from-lime-200 to-amber-100',
    image: roadsidePitToiletImage
  },
  {
    id: 1,
    name: '시골 푸세식 화장실',
    price: 180,
    dpsBonus: 2,
    cleanerPenaltyRate: 0.12,
    bgColor: 'bg-amber-100',
    bgGradient: 'from-amber-200 to-amber-100',
    image: ruralOuthouseToiletImage
  },
  {
    id: 2,
    name: '학교 낡은 화장실',
    price: 650,
    dpsBonus: 6,
    cleanerPenaltyRate: 0.15,
    bgColor: 'bg-emerald-100',
    bgGradient: 'from-emerald-200 to-stone-200',
    image: oldSchoolToiletImage
  },
  {
    id: 3,
    name: '지하철 공중화장실',
    price: 1800,
    dpsBonus: 14,
    cleanerPenaltyRate: 0.18,
    bgColor: 'bg-gray-200',
    bgGradient: 'from-gray-300 to-gray-200',
    image: subwayPublicToiletImage
  },
  {
    id: 4,
    name: '편의점 화장실',
    price: 5200,
    dpsBonus: 32,
    cleanerPenaltyRate: 0.2,
    bgColor: 'bg-orange-100',
    bgGradient: 'from-orange-200 to-stone-100',
    image: convenienceStoreToiletImage
  },
  {
    id: 5,
    name: '찜질방 화장실',
    price: 14000,
    dpsBonus: 75,
    cleanerPenaltyRate: 0.21,
    bgColor: 'bg-amber-100',
    bgGradient: 'from-amber-300 to-orange-100',
    image: jjimjilbangToiletImage
  },
  {
    id: 6,
    name: '카페 감성 화장실',
    price: 38000,
    dpsBonus: 150,
    cleanerPenaltyRate: 0.22,
    bgColor: 'bg-lime-100',
    bgGradient: 'from-lime-200 to-amber-100',
    image: cozyCafeToiletImage
  },
  {
    id: 7,
    name: '백화점 파우더룸',
    price: 95000,
    dpsBonus: 300,
    cleanerPenaltyRate: 0.23,
    bgColor: 'bg-pink-200',
    bgGradient: 'from-pink-300 to-pink-100',
    image: departmentPowderToiletImage
  },
  {
    id: 8,
    name: '호텔 스위트 화장실',
    price: 240000,
    dpsBonus: 560,
    cleanerPenaltyRate: 0.24,
    bgColor: 'bg-stone-200',
    bgGradient: 'from-stone-300 to-amber-100',
    image: hotelSuiteToiletImage
  },
  {
    id: 9,
    name: '7성급 호텔 화장실',
    price: 600000,
    dpsBonus: 1000,
    cleanerPenaltyRate: 0.25,
    bgColor: 'bg-slate-300',
    bgGradient: 'from-slate-400 to-yellow-200',
    image: sevenStarHotelToiletImage
  },
  {
    id: 10,
    name: '대통령 전용 화장실',
    price: 1500000,
    dpsBonus: 1750,
    cleanerPenaltyRate: 0.25,
    bgColor: 'bg-blue-200',
    bgGradient: 'from-blue-300 to-amber-100',
    image: presidentialPrivateToiletImage
  },
  {
    id: 11,
    name: '왕궁 황금 화장실',
    price: 3600000,
    dpsBonus: 3000,
    cleanerPenaltyRate: 0.26,
    bgColor: 'bg-yellow-200',
    bgGradient: 'from-yellow-300 to-red-200',
    image: royalPalaceToiletImage
  },
  {
    id: 12,
    name: '심해 잠수함 화장실',
    price: 8500000,
    dpsBonus: 5100,
    cleanerPenaltyRate: 0.26,
    bgColor: 'bg-cyan-200',
    bgGradient: 'from-cyan-400 to-slate-600',
    image: deepSeaSubmarineToiletImage
  },
  {
    id: 13,
    name: '우주선 무중력 화장실',
    price: 20000000,
    dpsBonus: 8500,
    cleanerPenaltyRate: 0.27,
    bgColor: 'bg-indigo-300',
    bgGradient: 'from-indigo-400 to-slate-700',
    image: spaceshipZeroGToiletImage
  },
  {
    id: 14,
    name: '달 기지 화장실',
    price: 46000000,
    dpsBonus: 14000,
    cleanerPenaltyRate: 0.27,
    bgColor: 'bg-slate-300',
    bgGradient: 'from-slate-400 to-blue-200',
    image: moonBaseToiletImage
  },
  {
    id: 15,
    name: '화성 개척지 화장실',
    price: 105000000,
    dpsBonus: 23000,
    cleanerPenaltyRate: 0.28,
    bgColor: 'bg-orange-200',
    bgGradient: 'from-orange-400 to-red-200',
    image: marsColonyToiletImage
  },
  {
    id: 16,
    name: '은하철도 화장실',
    price: 240000000,
    dpsBonus: 38000,
    cleanerPenaltyRate: 0.28,
    bgColor: 'bg-violet-200',
    bgGradient: 'from-violet-500 to-amber-200',
    image: galaxyTrainToiletImage
  },
  {
    id: 17,
    name: '천국 구름 화장실',
    price: 540000000,
    dpsBonus: 62000,
    cleanerPenaltyRate: 0.29,
    bgColor: 'bg-sky-100',
    bgGradient: 'from-sky-200 to-yellow-100',
    image: heavenCloudToiletImage
  },
  {
    id: 18,
    name: '신전의 성스러운 변기',
    price: 1200000000,
    dpsBonus: 100000,
    cleanerPenaltyRate: 0.29,
    bgColor: 'bg-stone-300',
    bgGradient: 'from-stone-500 to-cyan-200',
    image: sacredTempleToiletImage
  },
  {
    id: 19,
    name: '순금 황제 변기궁전',
    price: 2700000000,
    dpsBonus: 160000,
    cleanerPenaltyRate: 0.3,
    bgColor: 'bg-yellow-200',
    bgGradient: 'from-yellow-300 to-amber-600',
    image: goldEmperorPalaceToiletImage
  },
];

// 반복 구매형 생산 장비: 이전 장비 5레벨 달성 시 다음 장비 해금
const cleaningItems = [
  { id: 0, name: '두루마리 휴지', icon: toiletPaperIcon, basePrice: 25, dps: 1, description: '기본 중의 기본. 꾸준히 생산해요.', placement: { left: '1%', top: '16%' } },
  { id: 1, name: '뚫어뽕', icon: plungerIcon, basePrice: 180, dps: 5, description: '막힘을 뚫고 생산 흐름을 높여요.', placement: { right: '1%', top: '16%' } },
  { id: 2, name: '화장실 솔', icon: toiletBrushIcon, basePrice: 950, dps: 20, description: '변기를 반짝이게 닦아 생산성을 올려요.', placement: { left: '0%', top: '48%' } },
  { id: 3, name: '강력 세정제', icon: cleanerSprayIcon, basePrice: 5200, dps: 75, description: '묵은 때까지 녹이는 강력한 장비예요.', placement: { right: '0%', top: '48%' } },
  { id: 4, name: '자동 비데', icon: bidetIcon, basePrice: 28000, dps: 300, description: '자동화의 시작. 생산량이 크게 뛰어요.', placement: { left: '9%', bottom: '7%' } },
  { id: 5, name: '청소 로봇', icon: cleaningRobotIcon, basePrice: 150000, dps: 1200, description: '24시간 쉬지 않는 최종 청소 장비예요.', placement: { right: '9%', bottom: '7%' } },
];

const initialItemLevels = cleaningItems.map(() => 0);
const getItemPrice = (item, level) => Math.ceil(item.basePrice * Math.pow(1.24, level));
const cleanerEventDuration = 9;
const cleanerRequiredBlocks = 6;
const cleanerEventMinDelay = 45000;
const cleanerEventMaxDelay = 90000;
const cleanerEventMinGold = 5000;
const itemUnlockRequiredLevel = 15;
const developerGoldAmount = 999999999999;
const developerModeTapWindow = 1000;
const poopEvolutionLevel = 100;
const poopUpgradeBasePrice = 20;
const poopUpgradeGrowth = 1.011;
const activeClickDpsBonusRate = 0.05;
const appVersion = packageJson.version;
const defaultCosmetics = {
  hat: 'none',
  aura: 'none',
  titleText: '',
};
const getRandomCleanerDelay = () =>
  Math.floor(
    cleanerEventMinDelay + Math.random() * (cleanerEventMaxDelay - cleanerEventMinDelay)
  );

// 똥 캐릭터 진화 단계: 각 똥은 자기 레벨 1부터 성장하고, 진화 레벨에 도달하면 다음 똥이 해금
const poopCharacters = [
  { id: 0, name: '플랑크똥', badge: '✦', image: plankPoopImage, legacyRequiredLevel: 1, evolutionLevel: poopEvolutionLevel, baseClickPower: 1, baseDps: 0, clickGrowth: 1, dpsGrowth: 0, gradient: 'from-stone-200 to-amber-500', description: '눈에 보일 듯 말 듯한 우주 먼지급 똥' },
  { id: 1, name: '새우똥', badge: '🦐', image: shrimpPoopImage, legacyRequiredLevel: 1, evolutionLevel: poopEvolutionLevel, baseClickPower: 4, baseDps: 0, clickGrowth: 1, dpsGrowth: 0, gradient: 'from-orange-200 to-rose-400', description: '새우만큼 작고 살짝 굽은 하찮은 똥' },
  { id: 2, name: '피래미똥', badge: '🐟', image: minnowPoopImage, legacyRequiredLevel: 1, evolutionLevel: poopEvolutionLevel, baseClickPower: 7, baseDps: 1, clickGrowth: 1, dpsGrowth: 0.2, gradient: 'from-sky-200 to-stone-500', description: '피래미처럼 작고 미끄러운 초소형 똥' },
  { id: 3, name: '토끼똥', badge: '🐰', image: rabbitPoopImage, legacyRequiredLevel: 1, evolutionLevel: poopEvolutionLevel, baseClickPower: 10, baseDps: 1, clickGrowth: 1, dpsGrowth: 0.4, gradient: 'from-amber-200 to-stone-600', description: '동글동글 알갱이처럼 모여 있는 똥' },
  { id: 4, name: '물똥', badge: '💧', legacyRequiredLevel: 1, evolutionLevel: poopEvolutionLevel, baseClickPower: 14, baseDps: 2, clickGrowth: 2, dpsGrowth: 0.8, gradient: 'from-sky-300 to-blue-600', image: waterPoopImage, description: '아직 힘이 없는 촉촉한 초보 똥' },
  { id: 5, name: '말랑똥', badge: '🫧', legacyRequiredLevel: 10, evolutionLevel: poopEvolutionLevel, baseClickPower: 24, baseDps: 4, clickGrowth: 2, dpsGrowth: 1.2, gradient: 'from-cyan-300 to-teal-500', image: softPoopImage, description: '형태를 갖추기 시작한 말랑한 똥' },
  { id: 6, name: '푸딩똥', badge: '🍮', image: puddingPoopImage, legacyRequiredLevel: 10, evolutionLevel: poopEvolutionLevel, baseClickPower: 38, baseDps: 7, clickGrowth: 3, dpsGrowth: 1.6, gradient: 'from-yellow-200 to-amber-400', description: '카라멜처럼 반짝이는 탱글한 똥' },
  { id: 7, name: '찰떡똥', badge: '🍡', image: tteokPoopImage, legacyRequiredLevel: 10, evolutionLevel: poopEvolutionLevel, baseClickPower: 58, baseDps: 12, clickGrowth: 4, dpsGrowth: 2, gradient: 'from-stone-100 to-orange-200', description: '쫀득하게 늘어나는 찰진 똥' },
  { id: 8, name: '건강똥', badge: '🌿', legacyRequiredLevel: 25, evolutionLevel: poopEvolutionLevel, baseClickPower: 86, baseDps: 20, clickGrowth: 6, dpsGrowth: 3, gradient: 'from-lime-300 to-emerald-600', image: healthyPoopImage, description: '균형 잡힌 영양으로 단단해진 똥' },
  { id: 9, name: '단단똥', badge: '🪨', image: hardPoopImage, legacyRequiredLevel: 25, evolutionLevel: poopEvolutionLevel, baseClickPower: 124, baseDps: 34, clickGrowth: 8, dpsGrowth: 4, gradient: 'from-stone-400 to-amber-800', description: '표면이 갈라질 만큼 단단해진 똥' },
  { id: 10, name: '근육똥', badge: '💪', image: musclePoopImage, legacyRequiredLevel: 25, evolutionLevel: poopEvolutionLevel, baseClickPower: 176, baseDps: 55, clickGrowth: 11, dpsGrowth: 6, gradient: 'from-orange-300 to-amber-800', description: '작은 팔까지 생긴 힘센 똥' },
  { id: 11, name: '강철똥', badge: '⚙️', image: steelPoopImage, legacyRequiredLevel: 25, evolutionLevel: poopEvolutionLevel, baseClickPower: 250, baseDps: 86, clickGrowth: 15, dpsGrowth: 8, gradient: 'from-slate-300 to-zinc-700', description: '철판과 리벳으로 무장한 똥' },
  { id: 12, name: '불꽃똥', badge: '🔥', legacyRequiredLevel: 50, evolutionLevel: poopEvolutionLevel, baseClickPower: 350, baseDps: 130, clickGrowth: 20, dpsGrowth: 11, gradient: 'from-orange-400 to-red-600', image: firePoopImage, description: '뜨거운 생산력을 뿜어내는 똥' },
  { id: 13, name: '화산똥', badge: '🌋', image: volcanoPoopImage, legacyRequiredLevel: 50, evolutionLevel: poopEvolutionLevel, baseClickPower: 480, baseDps: 190, clickGrowth: 26, dpsGrowth: 15, gradient: 'from-zinc-700 to-red-600', description: '금 간 표면 사이로 열기가 새어 나오는 똥' },
  { id: 14, name: '용암똥', badge: '♨️', image: lavaPoopImage, legacyRequiredLevel: 50, evolutionLevel: poopEvolutionLevel, baseClickPower: 650, baseDps: 280, clickGrowth: 34, dpsGrowth: 20, gradient: 'from-red-500 to-orange-500', description: '용암 줄기가 흐르는 후끈한 똥' },
  { id: 15, name: '플래티넘똥', badge: '🥈', image: platinumPoopImage, legacyRequiredLevel: 80, evolutionLevel: poopEvolutionLevel, baseClickPower: 880, baseDps: 400, clickGrowth: 44, dpsGrowth: 27, gradient: 'from-slate-100 to-zinc-400', description: '은백색 광택이 도는 고급 똥' },
  { id: 16, name: '에메랄드똥', badge: '🟢', image: emeraldPoopImage, legacyRequiredLevel: 80, evolutionLevel: poopEvolutionLevel, baseClickPower: 1180, baseDps: 570, clickGrowth: 56, dpsGrowth: 36, gradient: 'from-emerald-300 to-green-700', description: '초록 결정 조각이 박힌 보석 똥' },
  { id: 17, name: '다이아똥', badge: '💎', legacyRequiredLevel: 80, evolutionLevel: poopEvolutionLevel, baseClickPower: 1560, baseDps: 800, clickGrowth: 72, dpsGrowth: 48, gradient: 'from-cyan-300 to-violet-600', image: diamondPoopImage, description: '보석처럼 단단하고 희귀한 똥' },
  { id: 18, name: '왕똥', badge: '👑', image: kingPoopImage, legacyRequiredLevel: 120, evolutionLevel: poopEvolutionLevel, baseClickPower: 2050, baseDps: 1120, clickGrowth: 92, dpsGrowth: 64, gradient: 'from-red-300 to-amber-600', description: '작은 왕관을 쓴 당당한 똥' },
  { id: 19, name: '황금똥', badge: '🏆', legacyRequiredLevel: 120, evolutionLevel: null, baseClickPower: 2700, baseDps: 1550, clickGrowth: 120, dpsGrowth: 84, gradient: 'from-yellow-300 to-amber-600', image: goldPoopImage, description: '모든 변기가 꿈꾸는 전설의 황금똥' },
];
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
const getPoopUpgradeIndex = (poop, level) =>
  (poop.id * poopEvolutionLevel) + Math.max(0, level - 1);
const getPoopUpgradePrice = (poop, level) =>
  Math.ceil(poopUpgradeBasePrice * Math.pow(poopUpgradeGrowth, getPoopUpgradeIndex(poop, level)));
const getPoopStats = (poop, level) => {
  const stageLevel = Math.max(0, level - 1);

  return {
    clickPower: Math.floor(poop.baseClickPower + poop.clickGrowth * stageLevel),
    dps: Math.floor(poop.baseDps + poop.dpsGrowth * stageLevel),
  };
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
    if (index < highestUnlockedId) return poopCharacters[index].evolutionLevel ?? 1;
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
const normalizeSelectedPoopId = (selectedPoopId, levels, sourceLevels) => {
  const selectedId = Math.floor(Number(selectedPoopId));
  const migratedSelectedId = Array.isArray(sourceLevels) && sourceLevels.length === legacyPoopNames.length
    ? getPoopIdByName(legacyPoopNames[selectedId])
    : selectedId;
  const highestUnlockedId = getHighestUnlockedPoopId(levels);

  return poopCharacters.some((poop) => poop.id === migratedSelectedId && (levels[poop.id] ?? 0) > 0)
    ? migratedSelectedId
    : highestUnlockedId;
};
const normalizePoopProgress = (source = {}) => {
  const sourceLevels = source.poopLevels;
  const levels = normalizePoopLevels(sourceLevels);

  if (levels) {
    return {
      poopLevels: levels,
      selectedPoopId: normalizeSelectedPoopId(source.selectedPoopId, levels, sourceLevels),
    };
  }

  const legacyLevel = Math.max(1, Math.floor(source.poopLevel ?? 1));
  const legacyPoop = [...poopCharacters]
    .reverse()
    .find((poop) => legacyLevel >= poop.legacyRequiredLevel) ?? poopCharacters[0];
  const legacyLevels = poopCharacters.map((poop) => {
    if (poop.id < legacyPoop.id) return poop.evolutionLevel ?? 1;
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
const normalizeCosmetics = (value) => ({
  hat: typeof value?.hat === 'string' ? value.hat : defaultCosmetics.hat,
  aura: typeof value?.aura === 'string' ? value.aura : defaultCosmetics.aura,
  titleText: typeof value?.titleText === 'string'
    ? value.titleText
    : typeof value?.title === 'string' && value.title !== 'none'
    ? value.title
    : defaultCosmetics.titleText,
});
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
                  <th className="px-4 py-3">게임 닉네임</th>
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
                    <td colSpan="8" className="px-4 py-10 text-center font-bold text-slate-500">
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
                          <p className="truncate font-black">{user.kakaoNickname ?? user.nickname}</p>
                          <p className="truncate text-[10px] font-bold text-slate-400">가입 이름</p>
                          <p className="truncate text-xs text-slate-500">{user.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-black text-amber-700">{user.displayNickname ?? user.nickname}</td>
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
  const [gold, setGold] = useState(0);
  
  // 현재 매입한 화장실 단계 (0 = 시골 푸세식, 5 = 순금 황제 변기궁전)
  const [currentToiletLevel, setCurrentToiletLevel] = useState(0);

  // 똥 캐릭터별 강화 레벨 (0 = 잠김, 1 이상 = 해금)
  const [poopLevels, setPoopLevels] = useState(initialPoopLevels);

  // 현재 사용 중인 똥 단계. 해금된 이전 단계도 선택 가능
  const [selectedPoopId, setSelectedPoopId] = useState(0);

  // 청소 장비별 보유 레벨
  const [itemLevels, setItemLevels] = useState(initialItemLevels);

  // 똥 꾸미기 장착 상태
  const [cosmetics, setCosmetics] = useState(defaultCosmetics);
  
  // 화장실 매입 상점 팝업창의 열림/닫힘 상태
  const [isShopOpen, setIsShopOpen] = useState(false);

  // 청소 장비 상점 팝업창의 열림/닫힘 상태
  const [isItemShopOpen, setIsItemShopOpen] = useState(false);

  // 똥 캐릭터 진화 상점 팝업창의 열림/닫힘 상태
  const [isPoopShopOpen, setIsPoopShopOpen] = useState(false);

  // 똥 강화 모달 상단 탭
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
  const totalItemLevels = itemLevels.reduce((total, level) => total + (level ?? 0), 0);
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
      { id: 'halo', name: '천사 링', icon: '😇', requirement: '장비 총 Lv.60', unlocked: totalItemLevels >= 60 },
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
      { id: 'cleanFoam', name: '소독 거품', icon: '🧼', requirement: '장비 총 Lv.45', unlocked: totalItemLevels >= 45 },
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
    const hat = getCosmeticOption('hat', normalizedCosmetics.hat);
    const aura = getCosmeticOption('aura', normalizedCosmetics.aura);
    const titleText = normalizedCosmetics.titleText.trim();

    return (
      <>
        {renderCosmeticVisual(aura, 'aura')}
        {poop.image ? (
          <img
            src={poop.image}
            alt={poop.name}
            className={`relative z-10 ${imageClassName}`}
            draggable="false"
          />
        ) : (
          <span className={`relative z-10 grid place-items-center ${imageClassName}`} aria-label={poop.name}>
            {poop.emoji ?? '💩'}
          </span>
        )}
        {hat?.id !== 'none' && (
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
          setSelectedPoopId(savedPoopProgress.selectedPoopId);
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
      const savedUnlockedPoopId = getHighestUnlockedPoopId(savedPoopLevels);
      const savedUnlockedPoop = poopCharacters[savedUnlockedPoopId] ?? poopCharacters[0];
      const savedSelectedPoopId = savedPoopProgress.selectedPoopId;

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
      setCosmetics(normalizeCosmetics(parsed.cosmetics));
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
  }, [gold, currentToiletLevel, currentPoopLevel, poopLevel, poopLevels, currentPoop.id, itemLevels, cosmetics, isSaveLoaded]);

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
  const handleResetGame = async () => {
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

    if (resetClickCountRef.current >= 3) {
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

  // ==================== 현재 화장실 배경설정 가져오기 ====================
  const currentToilet = toilets[currentToiletLevel];
  const currentBgGradient = currentToilet.bgGradient;
  const currentBgImage = currentToilet.image;
  const evolutionProgress = currentPoop.evolutionLevel
    ? Math.min(100, (poopLevel / currentPoop.evolutionLevel) * 100)
    : 100;

  useEffect(() => {
    const backgroundValue = currentBgImage ? `url(${currentBgImage})` : 'none';
    document.documentElement.style.setProperty('--game-background-image', backgroundValue);
    document.body.style.setProperty('--game-background-image', backgroundValue);
    document.body.style.backgroundImage = backgroundValue;
    document.body.style.backgroundSize = 'cover';
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
                <button type="button" onClick={handleKakaoLogin} disabled={isAuthLoading} className="rounded-xl border-2 border-[#3c1e1e] bg-[#FEE500] px-3 py-1.5 text-[10px] font-black text-[#191919] shadow-[0_2px_0_#3c1e1e] active:translate-y-0.5 active:shadow-none disabled:opacity-50">
                  카카오 로그인
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
          {renderPoopAvatar(currentPoop, poopLevel, cosmetics)}
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
          <span className="mt-0.5">화장실 매입</span>
        </button>
      </div>

      {!isAuthLoading && !authUser && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/65 p-4">
          <div className="max-h-[88vh] w-full max-w-sm overflow-y-auto rounded-[1.75rem] border-[3px] border-amber-950 bg-[#fff8e8] p-5 text-center text-slate-900 shadow-[0_8px_0_#78350f,0_18px_40px_rgba(0,0,0,0.45)]">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border-[3px] border-amber-800 bg-amber-200 text-3xl shadow-[0_4px_0_#92400e]">
              💩
            </div>
            <h2 className="mt-4 text-xl font-black">카카오 로그인</h2>
            <p className="mt-2 text-sm font-bold text-slate-600">
              저장, 랭킹, 똥 꾸미기를 사용하려면 먼저 로그인해주세요.
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
          </div>
        </div>
      )}

      {isRankingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => {
          setIsRankingOpen(false);
          setSelectedRankingUser(null);
        }}>
          <div className="w-full max-w-sm overflow-hidden rounded-[1.75rem] border-[3px] border-amber-950 bg-[#fff8e8] shadow-[0_8px_0_#78350f,0_18px_40px_rgba(0,0,0,0.4)]" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b-[3px] border-amber-950 bg-gradient-to-b from-yellow-300 to-amber-400 px-4 py-3">
              <div>
                <h2 className="text-lg font-black text-amber-950">🏆 전체 랭킹</h2>
                <p className="text-[10px] font-bold text-amber-900">카드를 누르면 화장실을 구경할 수 있어요</p>
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
                const rankingPoopLevel = rankingPoopProgress.poopLevels[rankingPoop.id] ?? entry.poopLevel ?? 1;
                const rankingToilet = toilets[normalizeToiletLevel(entry.toiletLevel, entry.toiletSchemaVersion)] ?? toilets[0];
                const ownedItems = cleaningItems.filter((item) => (entry.itemLevels?.[item.id] ?? 0) > 0);
                const rankingCosmetics = normalizeCosmetics(entry.cosmetics);
                const rankingHat = getCosmeticOption('hat', rankingCosmetics.hat);
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
                          {rankingTitleText ? `🏷️ ${rankingTitleText} · ` : ''}초당 +{formatNumber(entry.dps)}
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-black text-amber-700">{formatNumber(entry.gold)} 💰</p>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-1.5 border-t border-amber-900/15 pt-2 text-[9px] font-bold text-slate-700">
                      <div className="flex min-w-0 items-center gap-1.5 rounded-lg bg-amber-100/80 px-2 py-1">
                        <span className="relative flex h-7 w-7 shrink-0 items-center justify-center">
                          {getPoopVisual(rankingPoop, 'h-7 w-7 object-contain')}
                          {rankingHat?.id !== 'none' && (
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
            const profilePoopLevel = profilePoopProgress.poopLevels[profilePoop.id] ?? selectedRankingUser.poopLevel ?? 1;
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
                      <p className="mt-0.5 text-xs font-bold text-orange-700">변기 보너스 +{formatNumber(profileToilet.dpsBonus)}/초</p>
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
              <div className="mb-3 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
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
                  onClick={() => setPoopShopTab('cosmetics')}
                  className={`rounded-xl px-3 py-2 text-xs font-black transition-all ${
                    poopShopTab === 'cosmetics'
                      ? 'bg-teal-500 text-white shadow-[0_3px_0_#115e59]'
                      : 'text-slate-500'
                  }`}
                >
                  똥 꾸미기
                </button>
              </div>
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
              {poopShopTab === 'cosmetics' && (
              <div className="rounded-2xl border-[3px] border-teal-700 bg-teal-50 p-4 shadow-[0_5px_0_#115e59]">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="font-black text-teal-950">🎨 똥 꾸미기</h3>
                    <p className="mt-0.5 text-xs font-bold text-teal-700">꾸민 똥은 랭킹 쇼룸에도 같이 보여요</p>
                  </div>
                  <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
                    {renderPoopAvatar(
                      currentPoop,
                      poopLevel,
                      cosmetics,
                      'h-14 w-14 object-contain',
                      'absolute -right-1 -top-1 text-xl drop-shadow-lg',
                      false
                    )}
                  </div>
                </div>

                {[
                  { slot: 'hat', label: '모자' },
                  { slot: 'aura', label: '오라' },
                ].map(({ slot, label }) => (
                  <div key={slot} className="mt-3">
                    <p className="mb-1.5 text-xs font-black text-teal-900">{label}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {cosmeticOptions[slot].map((option) => {
                        const isEquipped = cosmetics[slot] === option.id;

                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => handleCosmeticEquip(slot, option)}
                            disabled={!option.unlocked}
                            className={`min-h-[48px] rounded-xl border-2 px-2 py-1.5 text-left transition-all ${
                              isEquipped
                                ? 'border-amber-700 bg-amber-200 text-amber-950 shadow-[0_3px_0_#92400e]'
                                : option.unlocked
                                ? 'border-teal-200 bg-white text-slate-800 active:scale-[0.98]'
                                : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                            }`}
                          >
                            <span className="flex min-w-0 items-center gap-2">
                              <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/70">
                                {renderCosmeticVisual(option, slot, 'picker')}
                              </span>
                              <span className="block min-w-0 truncate text-xs font-black">{option.name}</span>
                            </span>
                            <span className="mt-0.5 block truncate text-[9px] font-bold">
                              {option.unlocked ? (isEquipped ? '장착 중' : '장착 가능') : option.requirement}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                <div className="mt-3">
                  <p className="mb-1.5 text-xs font-black text-teal-900">칭호</p>
                  <input
                    type="text"
                    value={cosmetics.titleText}
                    onChange={(event) => {
                      const titleText = event.target.value.slice(0, 12);
                      setCosmetics((prevCosmetics) => ({
                        ...prevCosmetics,
                        titleText,
                      }));
                    }}
                    placeholder="예: 최강 물똥"
                    className="w-full rounded-xl border-2 border-teal-200 bg-white px-3 py-3 text-sm font-black text-slate-900 outline-none focus:border-teal-600"
                    maxLength={12}
                  />
                  <p className="mt-1 text-[10px] font-bold text-teal-700">
                    최대 12글자까지 자유롭게 작성할 수 있어요.
                  </p>
                </div>
              </div>
              )}

              {poopShopTab === 'upgrade' && (
              <>
              <div className="rounded-2xl border-[3px] border-amber-700 bg-amber-50 p-4 shadow-[0_5px_0_#92400e]">
                <div className="flex items-center gap-3">
                  <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
                    {renderPoopAvatar(
                      currentPoop,
                      poopLevel,
                      cosmetics,
                      'h-20 w-20 object-contain',
                      'absolute -right-1 -top-1 text-2xl',
                      false
                    )}
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
                          <span className="grid h-14 w-14 place-items-center text-4xl" aria-hidden="true">
                            {poop.emoji ?? '💩'}
                          </span>
                        )}
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
