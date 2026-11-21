import roadsidePitToiletImage from '../assets/toilet-stages/toilet-roadside-pit.webp';
import ruralOuthouseToiletImage from '../assets/toilet-stages/toilet-rural-outhouse.webp';
import oldSchoolToiletImage from '../assets/toilet-stages/toilet-old-school.webp';
import subwayPublicToiletImage from '../assets/toilet-stages/toilet-subway-public.webp';
import convenienceStoreToiletImage from '../assets/toilet-stages/toilet-convenience-store.webp';
import jjimjilbangToiletImage from '../assets/toilet-stages/toilet-jjimjilbang.webp';
import cozyCafeToiletImage from '../assets/toilet-stages/toilet-cozy-cafe.webp';
import departmentPowderToiletImage from '../assets/toilet-stages/toilet-department-powder.webp';
import hotelSuiteToiletImage from '../assets/toilet-stages/toilet-hotel-suite.webp';
import sevenStarHotelToiletImage from '../assets/toilet-stages/toilet-seven-star-hotel.webp';
import presidentialPrivateToiletImage from '../assets/toilet-stages/toilet-presidential-private.webp';
import royalPalaceToiletImage from '../assets/toilet-stages/toilet-royal-palace.webp';
import deepSeaSubmarineToiletImage from '../assets/toilet-stages/toilet-deep-sea-submarine.webp';
import spaceshipZeroGToiletImage from '../assets/toilet-stages/toilet-spaceship-zero-g.webp';
import moonBaseToiletImage from '../assets/toilet-stages/toilet-moon-base.webp';
import marsColonyToiletImage from '../assets/toilet-stages/toilet-mars-colony.webp';
import galaxyTrainToiletImage from '../assets/toilet-stages/toilet-galaxy-train.webp';
import heavenCloudToiletImage from '../assets/toilet-stages/toilet-heaven-cloud.webp';
import sacredTempleToiletImage from '../assets/toilet-stages/toilet-sacred-temple.webp';
import goldEmperorPalaceToiletImage from '../assets/toilet-stages/toilet-gold-emperor-palace.webp';

// Shared stage catalog for the main game and puzzle backgrounds.
export const toilets = [
  {
    id: 0,
    name: '길가 구덩이 화장실',
    dpsBonus: 0,
    cleanerPenaltyRate: 0.1,
    bgColor: 'bg-stone-100',
    bgGradient: 'from-lime-200 to-amber-100',
    image: roadsidePitToiletImage
  },
  {
    id: 1,
    name: '시골 푸세식 화장실',
    dpsBonus: 2,
    cleanerPenaltyRate: 0.12,
    bgColor: 'bg-amber-100',
    bgGradient: 'from-amber-200 to-amber-100',
    image: ruralOuthouseToiletImage
  },
  {
    id: 2,
    name: '학교 낡은 화장실',
    dpsBonus: 6,
    cleanerPenaltyRate: 0.15,
    bgColor: 'bg-emerald-100',
    bgGradient: 'from-emerald-200 to-stone-200',
    image: oldSchoolToiletImage
  },
  {
    id: 3,
    name: '지하철 공중화장실',
    dpsBonus: 14,
    cleanerPenaltyRate: 0.18,
    bgColor: 'bg-gray-200',
    bgGradient: 'from-gray-300 to-gray-200',
    image: subwayPublicToiletImage
  },
  {
    id: 4,
    name: '편의점 화장실',
    dpsBonus: 32,
    cleanerPenaltyRate: 0.2,
    bgColor: 'bg-orange-100',
    bgGradient: 'from-orange-200 to-stone-100',
    image: convenienceStoreToiletImage
  },
  {
    id: 5,
    name: '찜질방 화장실',
    dpsBonus: 75,
    cleanerPenaltyRate: 0.21,
    bgColor: 'bg-amber-100',
    bgGradient: 'from-amber-300 to-orange-100',
    image: jjimjilbangToiletImage
  },
  {
    id: 6,
    name: '카페 감성 화장실',
    dpsBonus: 150,
    cleanerPenaltyRate: 0.22,
    bgColor: 'bg-lime-100',
    bgGradient: 'from-lime-200 to-amber-100',
    image: cozyCafeToiletImage
  },
  {
    id: 7,
    name: '백화점 파우더룸',
    dpsBonus: 300,
    cleanerPenaltyRate: 0.23,
    bgColor: 'bg-pink-200',
    bgGradient: 'from-pink-300 to-pink-100',
    image: departmentPowderToiletImage
  },
  {
    id: 8,
    name: '호텔 스위트 화장실',
    dpsBonus: 560,
    cleanerPenaltyRate: 0.24,
    bgColor: 'bg-stone-200',
    bgGradient: 'from-stone-300 to-amber-100',
    image: hotelSuiteToiletImage
  },
  {
    id: 9,
    name: '7성급 호텔 화장실',
    dpsBonus: 1000,
    cleanerPenaltyRate: 0.25,
    bgColor: 'bg-slate-300',
    bgGradient: 'from-slate-400 to-yellow-200',
    image: sevenStarHotelToiletImage
  },
  {
    id: 10,
    name: '대통령 전용 화장실',
    dpsBonus: 1750,
    cleanerPenaltyRate: 0.25,
    bgColor: 'bg-blue-200',
    bgGradient: 'from-blue-300 to-amber-100',
    image: presidentialPrivateToiletImage
  },
  {
    id: 11,
    name: '왕궁 황금 화장실',
    dpsBonus: 3000,
    cleanerPenaltyRate: 0.26,
    bgColor: 'bg-yellow-200',
    bgGradient: 'from-yellow-300 to-red-200',
    image: royalPalaceToiletImage
  },
  {
    id: 12,
    name: '심해 잠수함 화장실',
    dpsBonus: 5100,
    cleanerPenaltyRate: 0.26,
    bgColor: 'bg-cyan-200',
    bgGradient: 'from-cyan-400 to-slate-600',
    image: deepSeaSubmarineToiletImage
  },
  {
    id: 13,
    name: '우주선 무중력 화장실',
    dpsBonus: 8500,
    cleanerPenaltyRate: 0.27,
    bgColor: 'bg-indigo-300',
    bgGradient: 'from-indigo-400 to-slate-700',
    image: spaceshipZeroGToiletImage
  },
  {
    id: 14,
    name: '달 기지 화장실',
    dpsBonus: 14000,
    cleanerPenaltyRate: 0.27,
    bgColor: 'bg-slate-300',
    bgGradient: 'from-slate-400 to-blue-200',
    image: moonBaseToiletImage
  },
  {
    id: 15,
    name: '화성 개척지 화장실',
    dpsBonus: 23000,
    cleanerPenaltyRate: 0.28,
    bgColor: 'bg-orange-200',
    bgGradient: 'from-orange-400 to-red-200',
    image: marsColonyToiletImage
  },
  {
    id: 16,
    name: '은하철도 화장실',
    dpsBonus: 38000,
    cleanerPenaltyRate: 0.28,
    bgColor: 'bg-violet-200',
    bgGradient: 'from-violet-500 to-amber-200',
    image: galaxyTrainToiletImage
  },
  {
    id: 17,
    name: '천국 구름 화장실',
    dpsBonus: 62000,
    cleanerPenaltyRate: 0.29,
    bgColor: 'bg-sky-100',
    bgGradient: 'from-sky-200 to-yellow-100',
    image: heavenCloudToiletImage
  },
  {
    id: 18,
    name: '신전의 성스러운 변기',
    dpsBonus: 100000,
    cleanerPenaltyRate: 0.29,
    bgColor: 'bg-stone-300',
    bgGradient: 'from-stone-500 to-cyan-200',
    image: sacredTempleToiletImage
  },
  {
    id: 19,
    name: '순금 황제 변기궁전',
    dpsBonus: 160000,
    cleanerPenaltyRate: 0.3,
    bgColor: 'bg-yellow-200',
    bgGradient: 'from-yellow-300 to-amber-600',
    image: goldEmperorPalaceToiletImage
  },
];
