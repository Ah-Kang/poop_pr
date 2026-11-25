import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {getPoopUpgradePrice} from '../shared/poop-progression.js';
let store,growth,directory;
before(async()=>{
  directory=await mkdtemp(path.join(tmpdir(),'poop-growth-test-'));
  process.env.DATABASE_URL='';process.env.SQLITE_PATH=path.join(directory,'test.db');process.env.NODE_ENV='test';
  store=await import('../server/database.js');growth=await import('../server/growth.js');await store.initializeDatabase();
});
after(async()=>{await store.closeDatabase();await rm(directory,{recursive:true,force:true});});
const now=2000000000000;
async function legacyUser(id,level,gold=0){
  await store.saveUser({id,nickname:id,profileImage:null});
  await store.saveGame(id,{gold,toiletLevel:0,toiletSchemaVersion:2,poopLevels:[level,...Array(19).fill(0)],selectedPoopId:0,itemLevels:[0,0,0,0,0,0],cosmetics:{}});
  return growth.transactGrowth(id,null,{now});
}
test('migration and a 24-hour offline award survive reload and concurrent claims exactly once',async()=>{
  const seeded=await legacyUser('offline-account',150);
  const dps=seeded.state.dps;
  const replies=await Promise.all(Array.from({length:4},(_,i)=>growth.transactGrowth('offline-account',{type:'presence',session:`tab${i}`,active:true},{now:now+86400000})));
  assert.ok(replies.every(r=>r.state.gold===dps*28800));
  assert.equal(replies.filter(r=>r.offlineReward).length,1);
  await store.closeDatabase();await store.initializeDatabase();
  const again=await growth.transactGrowth('offline-account',{type:'sync'},{now:now+86400000});
  assert.equal(again.state.gold,dps*28800);assert.equal(again.state.level,150);
});
test('same receipt cannot purchase twice, two distinct purchases cannot overspend, and rank ties use assets',async()=>{
  const price=getPoopUpgradePrice(null,1);
  await legacyUser('rank-small',1,price);await legacyUser('rank-large',1,price+50);
  const action={id:randomUUID(),type:'upgrade',count:1};
  const replies=await Promise.all(Array.from({length:5},()=>growth.transactGrowth('rank-small',action,{now})));
  assert.ok(replies.every(r=>r.state.level===2&&r.state.invested===price&&r.state.gold===0));
  await assert.rejects(growth.transactGrowth('rank-small',{id:randomUUID(),type:'upgrade',count:1},{now}),/not_enough_gold/);
  await growth.transactGrowth('rank-large',{id:randomUUID(),type:'upgrade',count:1},{now});
  const rank=await growth.getGrowthRanking();
  assert.ok(rank.findIndex(r=>r.id==='rank-large')<rank.findIndex(r=>r.id==='rank-small'));
  assert.equal(rank.find(r=>r.id==='rank-small').totalAssets,price);
});

test('cleaner taps and rewards are paid once across concurrent requests and persistent receipts',async()=>{
  await legacyUser('cleaner-account',1,10000);
  let result=await growth.transactGrowth('cleaner-account',{type:'cleaner_start',id:'cleaner-persistent'},{now:now+45000});
  for(let step=0;step<6;step++){
    const action={type:'cleaner_help',id:randomUUID(),eventId:'cleaner-persistent'};
    const copies=await Promise.all(Array.from({length:3},()=>growth.transactGrowth('cleaner-account',action,{now:now+45000+step*100})));
    assert.ok(copies.every(r=>r.state.cleaner.helps===step+1));
    result=copies[0];
  }
  assert.equal(result.state.gold,11000);assert.equal(result.state.cleaner.reward,1000);
  await assert.rejects(growth.transactGrowth('cleaner-account',{type:'cleaner_help',id:randomUUID(),eventId:'cleaner-persistent'},{now:now+46000}),/cleaner_finished/);
  const final=await growth.transactGrowth('cleaner-account',null,{now:now+46000});
  assert.equal(final.state.gold,11000);
});
