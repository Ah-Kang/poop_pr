// Contact points on the current 1080×1920 background art (not viewport pixels).
// width is the visible character width, excluding transparent PNG padding.
export const SCENE_SIZE = { width: 1080, height: 1920 };
export const TOILET_PLACEMENTS = [
  { x: 540, y: 1220, width: 185, shadowWidth: 170, shadowHeight: 27 }, // 01 roadside pit
  { x: 540, y: 1150, width: 170, shadowWidth: 155, shadowHeight: 23 }, // 02 outhouse
  { x: 540, y: 1132, width: 190, shadowWidth: 177, shadowHeight: 23 }, // 03 school lid
  { x: 540, y: 1180, width: 170, shadowWidth: 154, shadowHeight: 21 }, // 04 subway rim
  { x: 540, y: 1200, width: 187, shadowWidth: 171, shadowHeight: 23 }, // 05 convenience store
  { x: 540, y: 1010, width: 193, shadowWidth: 179, shadowHeight: 23 }, // 06 sauna lid
  { x: 540, y: 1145, width: 220, shadowWidth: 204, shadowHeight: 27 }, // 07 cafe lid
  { x: 540, y: 1162, width: 146, shadowWidth: 134, shadowHeight: 19 }, // 08 powder room
  { x: 543, y: 1138, width: 177, shadowWidth: 162, shadowHeight: 23 }, // 09 hotel suite
  { x: 540, y: 1020, width: 164, shadowWidth: 150, shadowHeight: 21 }, // 10 seven-star hotel
  { x: 540, y: 1140, width: 151, shadowWidth: 139, shadowHeight: 20 }, // 11 presidential
  { x: 540, y: 1120, width: 180, shadowWidth: 166, shadowHeight: 22 }, // 12 royal palace lid
  { x: 540, y: 1090, width: 195, shadowWidth: 179, shadowHeight: 24 }, // 13 submarine
  { x: 540, y: 1100, width: 216, shadowWidth: 198, shadowHeight: 26 }, // 14 spaceship
  { x: 540, y: 1158, width: 188, shadowWidth: 173, shadowHeight: 22 }, // 15 moon base
  { x: 540, y: 1125, width: 210, shadowWidth: 193, shadowHeight: 24 }, // 16 mars
  { x: 535, y: 1170, width: 178, shadowWidth: 164, shadowHeight: 23 }, // 17 galaxy train lid
  { x: 538, y: 995, width: 135, shadowWidth: 124, shadowHeight: 18 }, // 18 heaven
  { x: 540, y: 1040, width: 170, shadowWidth: 156, shadowHeight: 22 }, // 19 temple
  { x: 540, y: 1085, width: 172, shadowWidth: 158, shadowHeight: 22 }, // 20 emperor
];

export function placementStyle(toiletId, bounds) {
  const point = TOILET_PLACEMENTS[toiletId] || TOILET_PLACEMENTS[0];
  return {
    '--seat-x': `${point.x / SCENE_SIZE.width * 100}%`,
    '--seat-y': `${point.y / SCENE_SIZE.height * 100}%`,
    '--poop-width': `${point.width / SCENE_SIZE.width * 100}%`,
    '--poop-ratio': `${bounds.width} / ${bounds.height}`,
    '--sprite-width': `${bounds.canvasWidth / bounds.width * 100}%`,
    '--sprite-height': `${bounds.canvasHeight / bounds.height * 100}%`,
    '--sprite-left': `${-bounds.left / bounds.width * 100}%`,
    '--sprite-top': `${-bounds.top / bounds.height * 100}%`,
    '--shadow-width': `${point.shadowWidth / SCENE_SIZE.width * 100}%`,
    '--shadow-height': `${point.shadowHeight / SCENE_SIZE.height * 100}%`,
  };
}
