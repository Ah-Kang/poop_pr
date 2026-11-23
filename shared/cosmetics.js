export const materials = [['original', '기본색'], ['mint', '민트 크림'], ['berry', '딸기 크림']];
export const expressions = [['default', '기본 표정'], ['wink', '윙크'], ['sleepy', '졸려']];
export const outfits = [['none', '기본 의상'], ['royal', '왕관과 망토'], ['ribbon', '분홍 리본']];
export const defaultCosmetics = { hat: 'none', aura: 'none', titleText: '', material: 'original', expression: 'default', outfit: 'none' };
const allowed = (value, options) => options.some(([id]) => id === value) ? value : options[0][0];
export function normalizeCosmetics(value) {
  const v = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  return {
    hat: typeof v.hat === 'string' ? v.hat.slice(0,40) : 'none',
    aura: typeof v.aura === 'string' ? v.aura.slice(0,40) : 'none',
    titleText: (typeof v.titleText === 'string' ? v.titleText : typeof v.title === 'string' && v.title !== 'none' ? v.title : '').slice(0,12),
    material: allowed(v.material, materials),
    expression: allowed(v.expression, expressions),
    outfit: allowed(v.outfit, outfits),
  };
}
