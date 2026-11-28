export const FEEDBACK_LIMIT = 2000;
export function normalizeFeedback(body) {
  if (!body || typeof body.id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.id)) throw new Error('invalid_feedback');
  if (typeof body.message !== 'string') throw new Error('invalid_feedback');
  const message = body.message.trim();
  if (!message || message.length > FEEDBACK_LIMIT || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(message)) throw new Error('invalid_feedback');
  return { id: body.id.toLowerCase(), message };
}
export function feedbackFilters(query = {}) {
  const status = query.status ?? 'all', page = Number(query.page ?? 1);
  if (!['all','new','resolved'].includes(status) || !Number.isSafeInteger(page) || page < 1 || page > 100000) throw new Error('invalid_feedback_filter');
  return { status, page };
}
