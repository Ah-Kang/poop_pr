import { createGrowth, applyGrowthAction, growthSnapshot, GrowthError } from '../shared/growth.js';
import { createEconomy, migrateToiletLevel } from '../shared/economy.js';
import { updateWardrobe } from '../shared/wardrobe.js';
let pool,db;
const parse=(value,fallback={})=>value ? typeof value==='string'?JSON.parse(value):value : fallback;
const safeDb=n=>Math.min(Number.MAX_SAFE_INTEGER,Math.max(0,Math.floor(n)));
const legacy=row=>row?{gold:row.gold,poopLevels:parse(row.poop_levels,[]),itemLevels:parse(row.item_levels,[]),selectedPoopId:row.selected_poop_id,toiletLevel:migrateToiletLevel(row.toilet_level,row.toilet_schema_version)}:{};
const schema=`CREATE TABLE IF NOT EXISTS player_growth (kakao_id TEXT PRIMARY KEY REFERENCES users(kakao_id) ON DELETE CASCADE,state TEXT NOT NULL,level BIGINT NOT NULL,total_assets REAL NOT NULL,ranked INTEGER NOT NULL DEFAULT 1);
CREATE TABLE IF NOT EXISTS growth_actions (kakao_id TEXT NOT NULL REFERENCES users(kakao_id) ON DELETE CASCADE,action_id TEXT NOT NULL,PRIMARY KEY(kakao_id,action_id));`;
export async function initializeGrowth(pg,sqlite){
  pool=pg;db=sqlite;
  if(pool){
    await pool.query(schema.replace('state TEXT','state JSONB').replace('total_assets REAL','total_assets NUMERIC'));
    await pool.query('ALTER TABLE player_growth ENABLE ROW LEVEL SECURITY; ALTER TABLE growth_actions ENABLE ROW LEVEL SECURITY; CREATE INDEX IF NOT EXISTS growth_ranking ON player_growth (ranked,level DESC,total_assets DESC)');
    const {rows}=await pool.query('SELECT u.kakao_id FROM users u LEFT JOIN player_growth g ON g.kakao_id=u.kakao_id WHERE g.kakao_id IS NULL');
    for(const row of rows)await transactGrowth(row.kakao_id);
  }else{
    db.exec(schema+'CREATE INDEX IF NOT EXISTS growth_ranking ON player_growth (ranked,level DESC,total_assets DESC);');
    const rows=db.prepare('SELECT u.kakao_id FROM users u LEFT JOIN player_growth g ON g.kakao_id=u.kakao_id WHERE g.kakao_id IS NULL').all();
    for(const row of rows)await transactGrowth(row.kakao_id);
  }
}
function compute(old,saved,wallet,action,duplicate,options){
  const now=options.now??Date.now();
  const state=old?parse(old.state):createGrowth(legacy(saved),now);
  const economy=wallet?parse(wallet.state):createEconomy(state.toiletLevel);
  const result=applyGrowthAction(state,duplicate?{type:'sync'}:action||{type:'sync'},{...options,now,economy});
  const snapshot=growthSnapshot(result.state);
  return {...result,snapshot,economy:updateWardrobe(economy,{poopLevels:snapshot.poopLevels,now})};
}
const mirrorArgs=(id,r)=>[id,safeDb(r.state.gold),r.state.toiletLevel,JSON.stringify(r.snapshot.poopLevels),r.state.selectedPoopId,JSON.stringify(r.state.itemLevels)];
const mirrorSql=`INSERT INTO game_saves (kakao_id,gold,toilet_level,toilet_schema_version,poop_levels,selected_poop_id,item_levels,cosmetics) VALUES (?,?,?,2,?,?,?,'{}') ON CONFLICT(kakao_id) DO UPDATE SET gold=excluded.gold,toilet_level=excluded.toilet_level,toilet_schema_version=2,poop_levels=excluded.poop_levels,selected_poop_id=excluded.selected_poop_id,item_levels=excluded.item_levels,updated_at=CURRENT_TIMESTAMP`;
const scoreSql=`INSERT INTO scores (kakao_id,gold,dps,toilet_level,toilet_schema_version,poop_level) VALUES (?,?,?,?,2,?) ON CONFLICT(kakao_id) DO UPDATE SET gold=excluded.gold,dps=excluded.dps,toilet_level=excluded.toilet_level,toilet_schema_version=2,poop_level=excluded.poop_level,updated_at=CURRENT_TIMESTAMP`;
const parameters=sql=>{let i=0;return sql.replace(/\?/g,()=>`$${++i}`);};
const mutationTypes=new Set(['click','upgrade','equipment','cleaner_start','cleaner_help','demo_gold','reset']);
export async function transactGrowth(id,action=null,options={}){
  const mutation=action&&mutationTypes.has(action.type);
  if(mutation&&(!/^[\w-]{8,80}$/.test(action.id||'')))throw new GrowthError('invalid_action_id');
  if(pool){
    const client=await pool.connect();
    try{
      await client.query('BEGIN');
      // User lock serializes first-time migration as well as subsequent purchases.
      await client.query('SELECT kakao_id FROM users WHERE kakao_id=$1 FOR NO KEY UPDATE',[id]);
      const old=(await client.query('SELECT state FROM player_growth WHERE kakao_id=$1',[id])).rows[0];
      const saved=old?null:(await client.query('SELECT * FROM game_saves WHERE kakao_id=$1',[id])).rows[0];
      const wallet=(await client.query('SELECT state FROM player_economy WHERE kakao_id=$1 FOR UPDATE',[id])).rows[0];
      const duplicate=mutation&&(await client.query('SELECT 1 FROM growth_actions WHERE kakao_id=$1 AND action_id=$2',[id,action.id])).rowCount>0;
      const r=compute(old,saved,wallet,action,duplicate,options);
      await client.query('INSERT INTO player_growth (kakao_id,state,level,total_assets,ranked) VALUES ($1,$2,$3,$4,$5) ON CONFLICT(kakao_id) DO UPDATE SET state=excluded.state,level=excluded.level,total_assets=excluded.total_assets,ranked=excluded.ranked',[id,JSON.stringify(r.state),r.state.level,r.snapshot.totalAssets,r.state.unranked?0:1]);
      await client.query(parameters(mirrorSql),mirrorArgs(id,r));
      await client.query(parameters(scoreSql),[id,safeDb(r.state.gold),safeDb(r.snapshot.dps),r.state.toiletLevel,Math.min(2147483647,r.state.level)]);
      await client.query('INSERT INTO player_economy (kakao_id,state) VALUES ($1,$2) ON CONFLICT(kakao_id) DO UPDATE SET state=excluded.state',[id,JSON.stringify(r.economy)]);
      if(mutation&&!duplicate)await client.query('INSERT INTO growth_actions (kakao_id,action_id) VALUES ($1,$2)',[id,action.id]);
      await client.query('COMMIT');
      return {state:r.snapshot,offlineReward:r.offlineReward,upgrades:r.upgrades,evolutions:r.evolutions};
    }catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}
  }
  db.exec('BEGIN IMMEDIATE');
  try{
    const old=db.prepare('SELECT state FROM player_growth WHERE kakao_id=?').get(id);
    const saved=old?null:db.prepare('SELECT * FROM game_saves WHERE kakao_id=?').get(id);
    const wallet=db.prepare('SELECT state FROM player_economy WHERE kakao_id=?').get(id);
    const duplicate=mutation&&db.prepare('SELECT 1 FROM growth_actions WHERE kakao_id=? AND action_id=?').get(id,action.id);
    const r=compute(old,saved,wallet,action,duplicate,options);
    db.prepare('INSERT INTO player_growth (kakao_id,state,level,total_assets,ranked) VALUES (?,?,?,?,?) ON CONFLICT(kakao_id) DO UPDATE SET state=excluded.state,level=excluded.level,total_assets=excluded.total_assets,ranked=excluded.ranked').run(id,JSON.stringify(r.state),r.state.level,r.snapshot.totalAssets,r.state.unranked?0:1);
    db.prepare(mirrorSql).run(...mirrorArgs(id,r));
    db.prepare(scoreSql).run(id,safeDb(r.state.gold),safeDb(r.snapshot.dps),r.state.toiletLevel,r.state.level);
    db.prepare('INSERT INTO player_economy (kakao_id,state) VALUES (?,?) ON CONFLICT(kakao_id) DO UPDATE SET state=excluded.state').run(id,JSON.stringify(r.economy));
    if(mutation&&!duplicate)db.prepare('INSERT INTO growth_actions (kakao_id,action_id) VALUES (?,?)').run(id,action.id);
    db.exec('COMMIT');
    return {state:r.snapshot,offlineReward:r.offlineReward,upgrades:r.upgrades,evolutions:r.evolutions};
  }catch(error){db.exec('ROLLBACK');throw error;}
}
export async function getGrowthRanking(limit=50){
  const sql=`SELECT u.kakao_id AS id,COALESCE(u.display_nickname,u.nickname) AS nickname,u.profile_image,g.state,s.cosmetics FROM player_growth g JOIN users u ON u.kakao_id=g.kakao_id LEFT JOIN game_saves s ON s.kakao_id=g.kakao_id WHERE g.ranked=1 ORDER BY g.level DESC,g.total_assets DESC,u.kakao_id ASC LIMIT ?`;
  const rows=pool?(await pool.query(parameters(sql),[limit])).rows:db.prepare(sql).all(limit);
  return rows.map(row=>{const state=growthSnapshot(parse(row.state));return {id:row.id,nickname:row.nickname,profileImage:row.profile_image,gold:state.gold,dps:state.dps,toiletLevel:state.toiletLevel,toiletSchemaVersion:2,poopLevel:state.level,cumulativeLevel:state.level,totalAssets:state.totalAssets,selectedPoopId:state.selectedPoopId,poopLevels:state.poopLevels,itemLevels:state.itemLevels,cosmetics:parse(row.cosmetics)};});
}
