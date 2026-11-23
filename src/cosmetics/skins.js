import catalog from './skin-catalog.json';
import { normalizeCosmetics } from '../../shared/cosmetics.js';
export const skinCatalog = catalog;
const key = (id, c) => `${id}/${c.material}/${c.expression}/${c.outfit}`;
const byCombination = new Map(catalog.map(item => [key(item.characterId,item),item]));
export const getSkin = (id, cosmetics) => byCombination.get(key(id,normalizeCosmetics(cosmetics)));
