let pool, db;
const retentionMs = 30 * 24 * 60 * 60 * 1000;
const sqlParams = sql => { let n=0; return sql.replace(/\?/g,()=>`$${++n}`); };
const rows = async (sql,args=[]) => pool ? (await pool.query(sqlParams(sql),args)).rows : db.prepare(sql).all(...args);
export async function initializeFeedback(pg,sqlite) {
  pool=pg;db=sqlite;
  const schema=`CREATE TABLE IF NOT EXISTS player_feedback (
    id TEXT PRIMARY KEY, kakao_id TEXT REFERENCES users(kakao_id) ON DELETE CASCADE,
    message TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new','resolved')),
    created_at BIGINT NOT NULL, resolved_at BIGINT
  ); CREATE INDEX IF NOT EXISTS feedback_status_created ON player_feedback(status,created_at DESC);`;
  if(pool){await pool.query(schema);await pool.query('ALTER TABLE player_feedback ENABLE ROW LEVEL SECURITY');}
  else db.exec(schema);
  await purgeResolvedFeedback();
}
export async function purgeResolvedFeedback(now=Date.now()) {
  await rows('DELETE FROM player_feedback WHERE resolved_at IS NOT NULL AND resolved_at <= ? RETURNING id',[now-retentionMs]);
}
export async function findFeedback(id) {
  return (await rows('SELECT id,kakao_id,message FROM player_feedback WHERE id=?',[id]))[0];
}
export async function saveFeedback({id,message},userId=null,now=Date.now()) {
  await rows('INSERT INTO player_feedback(id,kakao_id,message,created_at) VALUES (?,?,?,?) ON CONFLICT(id) DO NOTHING RETURNING id',[id,userId,message,now]);
  const saved=await findFeedback(id);
  if(saved.kakao_id!==userId || saved.message!==message) throw new Error('feedback_conflict');
  return {id:saved.id};
}
export async function listFeedback({status='all',page=1}={}) {
  await purgeResolvedFeedback();
  const where=status==='all'?'':'WHERE f.status=?',args=status==='all'?[]:[status];
  const [items,counts]=await Promise.all([
    rows(`SELECT f.id,f.message,f.status,f.created_at AS "createdAt",f.resolved_at AS "resolvedAt",
      f.kakao_id AS "userId",COALESCE(u.display_nickname,u.nickname,'게스트') AS nickname
      FROM player_feedback f LEFT JOIN users u ON u.kakao_id=f.kakao_id ${where}
      ORDER BY f.created_at DESC,f.id DESC LIMIT 20 OFFSET ?`,[...args,(page-1)*20]),
    rows("SELECT COUNT(*) AS total,COUNT(CASE WHEN status='new' THEN 1 END) AS unread FROM player_feedback"),
  ]);
  const total=Number(counts[0].total),unread=Number(counts[0].unread);
  return {items:items.map(item=>({...item,createdAt:Number(item.createdAt),resolvedAt:item.resolvedAt===null?null:Number(item.resolvedAt)})),total,unread,filteredTotal:status==='new'?unread:status==='resolved'?total-unread:total,page};
}
export async function updateFeedback(id,status,now=Date.now()) {
  const result=await rows('UPDATE player_feedback SET status=?,resolved_at=? WHERE id=? RETURNING id',[status,status==='resolved'?now:null,id]);
  return Boolean(result.length);
}
