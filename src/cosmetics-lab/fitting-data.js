import data from '../scene/preview-data.json';
import bounds from '../scene/poopBounds.json';

const images = import.meta.glob('../assets/PoopImage/*.png', { eager: true, query: '?url', import: 'default' });

// Positions are fractions of each visible sprite, not its transparent canvas.
// The coordinates are a first fitting pass, not an assertion of art approval.
const profiles = [
  { head:[.51,.31,.25,-4], bow:[.66,.40,.22,15], cape:[.51,.62,.61,.33], note:'반짝임을 머리로 인식하지 않도록 몸통에 맞춰 축소.', level:'adjust' },
  { head:[.36,.16,.29,-8], bow:[.53,.31,.24,16], cape:[.36,.62,.72,.32], note:'꼬리를 제외한 왼쪽 몸통 기준. 망토와 꼬리 접점은 별도 처리 권장.', level:'custom' },
  { head:[.43,.20,.27,-10], bow:[.58,.30,.22,18], cape:[.40,.64,.75,.34], note:'꼬리와 지느러미가 망토보다 앞으로 나와야 자연스러움.', level:'custom' },
  { head:[.49,.33,.28,0], bow:[.69,.27,.25,18], cape:[.50,.65,1.02,.29], note:'왕관은 두 귀 사이, 리본은 오른쪽 귀 아래로 이동.', level:'adjust' },
  { head:[.47,.20,.30,-8], bow:[.62,.29,.23,16], cape:[.49,.66,.96,.26], note:'바닥 물웅덩이를 몸통 폭에서 제외. 물방울과 의상 겹침 확인.', level:'adjust' },
  { head:[.50,.22,.28,-7], bow:[.67,.31,.23,16], cape:[.50,.62,1.00,.30], note:'흔들림 선을 제외한 몸통 기준. 낮은 체형에 맞춰 망토 높이 축소.', level:'adjust' },
  { head:[.50,.09,.35,0], bow:[.80,.17,.29,14], cape:[.50,.48,1.17,.55], note:'납작한 머리와 넓은 몸통. 현재 공통 의상과 가장 가까운 체형.', level:'adjust' },
  { head:[.42,.19,.29,-8], bow:[.57,.32,.25,15], cape:[.44,.64,.93,.29], note:'늘어난 오른쪽 끝과 망토 연결이 어색함. 원본의 투명한 구멍도 보임.', level:'custom' },
  { head:[.65,.12,.29,-12], bow:[.73,.25,.25,20], cape:[.49,.67,1.02,.30], note:'휘어진 꼭대기에 맞춰 오른쪽으로 이동·회전. 원뿔 접촉면은 검수 필요.', level:'adjust' },
  { head:[.57,.10,.30,9], bow:[.70,.22,.24,18], cape:[.50,.70,1.07,.27], note:'각진 꼭대기 방향에 맞춤. 바위의 날카로운 윤곽과 둥근 의상 대비가 큼.', level:'adjust' },
  { head:[.52,.18,.25,-7], bow:[.63,.29,.20,12], cape:[.50,.66,.84,.28], note:'양팔을 제외한 몸통 기준. 팔이 망토 밖으로 나오는 전용 가림 처리가 필요.', level:'custom' },
  { head:[.59,.15,.25,-8], bow:[.69,.27,.21,15], cape:[.56,.71,.94,.22], note:'철띠와 의상 앞장식이 중복되고 외곽 잔여 픽셀이 있음. 원본 정리 권장.', level:'custom' },
  { head:[.76,.46,.28,18], bow:[.78,.43,.24,22], cape:[.50,.72,1.04,.25], note:'정수리 불꽃을 피하면 왕관이 옆으로 기울어짐. 불꽃을 통과시키는 전용 의상 권장.', level:'custom' },
  { head:[.49,.47,.38,0], bow:[.71,.54,.23,18], cape:[.50,.77,1.12,.24], note:'연기를 피해서 분화구에 배치해도 연기·왕관이 겹침. 분리 레이어 또는 전용 그림 필요.', level:'custom' },
  { head:[.57,.21,.31,-12], bow:[.77,.37,.24,20], cape:[.50,.79,1.08,.20], note:'용암의 흐름과 바위가 의상에 가려짐. 열감·빛 반사를 맞춘 전용 의상 권장.', level:'custom' },
  { head:[.52,.17,.31,-9], bow:[.69,.27,.24,16], cape:[.50,.68,1.06,.27], note:'원본 얼굴의 투명한 부분으로 뒤쪽 망토가 비쳐 보임. 원본 투명도 정리가 먼저 필요.', level:'custom' },
  { head:[.54,.16,.29,-8], bow:[.67,.27,.24,16], cape:[.49,.70,1.02,.25], note:'옆 보석을 가리지 않도록 망토를 낮춤. 보석 주변 가림 경계 확인 필요.', level:'adjust' },
  { head:[.52,.18,.31,-8], bow:[.69,.28,.24,16], cape:[.50,.68,1.06,.27], note:'투명한 얼굴 부분으로 망토가 붉은 얼룩처럼 비침. 투명도와 굴절을 따로 다루거나 전용 그림 권장.', level:'custom' },
  { head:[.50,.17,.35,0], bow:[.74,.37,.23,16], cape:[.50,.70,1.10,.27], note:'기본 이미지에 왕관·망토가 이미 있음. 중복 장착을 막고 의상 없는 원본부터 필요.', level:'base' },
  { head:[.50,.19,.28,-8], bow:[.67,.29,.23,16], cape:[.50,.68,1.00,.26], note:'주변 반짝임을 제외하고 피팅. 몸통과 왕관이 같은 금색이라 경계 대비 확인 필요.', level:'adjust' },
];

export const characters = data.poops.map(poop => ({
  ...poop,
  image: images[poop.image.replace('/src/', '../')],
  bounds: bounds[poop.id],
  fit: profiles[poop.id],
}));

export const commonFit = { head:[.50,.09,.35,0], bow:[.80,.17,.29,14], cape:[.50,.48,1.17,.55] };
