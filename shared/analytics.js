import { koreaDay } from './economy.js';

export const clientMetrics = ['mainSeconds', 'puzzleSeconds', 'clicks', 'poopUpgrades', 'evolutions', 'itemUpgrades', 'wardrobeOpens', 'skinEquips'];
export const serverMetrics = ['puzzleEntries', 'puzzleMoves', 'partsEarned', 'toiletCrafts', 'tokensSpent', 'tokensReceived'];
export const metricKeys = [...clientMetrics, ...serverMetrics, 'sessions'];
export const metricColumn = key => key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
export const zeroMetrics = () => Object.fromEntries(metricKeys.map(key => [key, 0]));
export const shiftDay = (day, amount) => new Date(Date.parse(`${day}T00:00:00Z`) + amount * 86400000).toISOString().slice(0,10);
export const validDay = day => typeof day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(day) && !Number.isNaN(Date.parse(day)) && new Date(day).toISOString().slice(0,10) === day;

export function normalizeTelemetry(value, now = Date.now()) {
  const today = koreaDay(now);
  if (!value || ![value.sessionId, value.streamId].every(id => typeof id === 'string' && /^[a-zA-Z0-9_-]{8,80}$/.test(id))
    || !validDay(value.day) || value.day > today || value.day < shiftDay(today, -7)
    || !value.counters || typeof value.counters !== 'object' || Array.isArray(value.counters)
    || Object.keys(value.counters).some(key => !clientMetrics.includes(key))) throw new Error('invalid_telemetry');
  const counters = {};
  for (const key of clientMetrics) {
    const n = value.counters[key] ?? 0;
    const max = key.endsWith('Seconds') ? 86400 : 1000000;
    if (!Number.isSafeInteger(n) || n < 0 || n > max) throw new Error('invalid_telemetry');
    counters[key] = n;
  }
  return { sessionId: value.sessionId, streamId: value.streamId, day: value.day, counters };
}

export function counterDelta(previous = {}, incoming) {
  return Object.fromEntries(clientMetrics.map(key => [key, Math.max(0, incoming[key] - (previous[key] || 0))]));
}

export function economyMetrics(previous, next, action) {
  const delta = {};
  if (action.type === 'puzzle_start') delta.puzzleEntries = 1;
  if (action.type === 'puzzle_move') {
    delta.puzzleMoves = 1;
    delta.partsEarned = Math.max(0, next.parts - previous.parts);
  }
  if (['craft_toilet', 'renovate'].includes(action.type)) delta.toiletCrafts = 1;
  if (!action.type.startsWith('demo_') && action.type !== 'reset_progress') {
    delta.tokensSpent = Math.max(0, previous.tokens - next.tokens);
    delta.tokensReceived = Math.max(0, next.tokens - previous.tokens);
  }
  return delta;
}

export function analyticsFilters(query = {}, now = Date.now()) {
  const to = query.to || koreaDay(now);
  const from = query.from || shiftDay(to, -29);
  if (!validDay(from) || !validDay(to) || from > to || (Date.parse(to)-Date.parse(from))/86400000 > 89 || to > koreaDay(now)) throw new Error('invalid_range');
  const provider = query.provider || 'all';
  const sort = query.sort || 'lastSeen';
  if (!['all','kakao','local'].includes(provider) || !['lastSeen','clicks','playSeconds'].includes(sort)) throw new Error('invalid_filter');
  const page = Number(query.page || 1);
  if (!Number.isSafeInteger(page) || page < 1 || page > 100000) throw new Error('invalid_filter');
  return { from, to, provider, sort, search: String(query.search || '').trim().slice(0,60), page };
}

// Prevent spreadsheet applications from interpreting user-controlled nicknames as formulas.
export const csvCell = value => {
  let text = String(value ?? '');
  if (/^[\s\uFEFF]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"','""')}"`;
};
