import test from 'node:test';
import assert from 'node:assert/strict';
import { evolutionThresholds, stageForLevel, getPoopStats, getPoopUpgradePrice, production, getEquipmentPrice } from '../shared/poop-progression.js';
import { createGrowth, settleGrowth, applyGrowthAction, growthSnapshot, offlineEquivalentSeconds } from '../shared/growth.js';
const start=1000000;
const apply=(state,action,now=start,extra={})=>applyGrowthAction(state,action,{now,...extra});
test('all evolution milestones keep a single level and add at least 25% strength',()=>{
  for(const level of evolutionThresholds.slice(1)){
    const a=getPoopStats(null,level-1),b=getPoopStats(null,level);
    assert.ok(b.clickPower>=a.clickPower*1.25-1);
    assert.ok(b.dps>=a.dps*1.25-1);
  }
  assert.equal(stageForLevel(999),18);assert.equal(stageForLevel(1000),19);assert.equal(stageForLevel(10000000),19);
  for(const level of [1000,1001,10000,1000000,10000000]){
    assert.ok(Number.isFinite(getPoopUpgradePrice(null,level)));
    assert.ok(getPoopUpgradePrice(null,level+1)>getPoopUpgradePrice(null,level));
  }
});
test('approved balance values and equipment multipliers match the model',()=>{
  assert.equal(getPoopUpgradePrice(null,10),1344);
  assert.equal(getPoopUpgradePrice(null,80),154071);
  assert.equal(getPoopUpgradePrice(null,1000),52279166720);
  assert.equal(getEquipmentPrice(0,0),25200);
  const stats=production({level:1000,itemLevels:[5,5,5,5,5,5],toiletLevel:7});
  assert.equal(stats.dps,28378402);assert.equal(stats.clickPower,2197477);
});
test('legacy conversion preserves unlocked characters, excess upgrades, coins and paid assets',()=>{
  const old={gold:700,poopLevels:[5,10,15,20,25,30,35,40,1,...Array(11).fill(0)],itemLevels:[20,0,0,0,0,0],selectedPoopId:8};
  const s=createGrowth(old,start);
  assert.ok(s.level>=150);assert.equal(s.gold,700);assert.equal(s.selectedPoopId,stageForLevel(s.level));
  assert.equal(s.itemLevels[0],5);assert.ok(s.invested>0);assert.deepEqual(s.legacy.poopLevels,old.poopLevels);
  assert.equal(s.lastAt,start);assert.equal(s.offlineBank,0);
  const ancient=createGrowth({poopLevels:[1,1,1,1,1,1],selectedPoopId:5},start);
  assert.ok(ancient.level>=1000);assert.equal(ancient.selectedPoopId,19);
});
test('purchases conserve assets and character appearance always follows cumulative level',()=>{
  let s=createGrowth({},start);s.gold=1e12;s.level=999;s.lastDps=production(s).dps;
  const assets=growthSnapshot(s).totalAssets;
  const result=apply(s,{type:'upgrade',count:10});s=result.state;
  assert.equal(s.level,1009);assert.equal(result.evolutions,1);assert.equal(s.selectedPoopId,19);
  assert.equal(growthSnapshot(s).totalAssets,assets);
  const before=production(s);
  assert.throws(()=>apply(s,{type:'appearance',poopId:0}),/invalid_action/);
  const stale={...s,selectedPoopId:0};
  assert.equal(growthSnapshot(stale).selectedPoopId,19); // Ranking and reload ignore old selections.
  assert.equal(apply(stale,{type:'sync'}).state.selectedPoopId,19);
  assert.deepEqual(production(stale),before);
  s=apply(s,{type:'equipment',itemId:0}).state;assert.equal(growthSnapshot(s).totalAssets,assets);
  assert.ok(production(s).dps>before.dps);
});
test('offline income is frozen, tiered, capped and cannot be reclaimed',()=>{
  let s=createGrowth({},start);s.level=150;s.lastDps=production(s).dps;
  const dps=s.lastDps;
  for(const [hours,equivalent] of [[8,4],[12,5],[24,8],[48,8]]){
    const r=settleGrowth(s,start+hours*3600000);assert.equal(r.gold,dps*equivalent*3600);assert.equal(r.level,150);
  }
  const r=apply(s,{type:'presence',session:'tab1',active:true},start+24*3600000);
  assert.equal(r.offlineReward.gold,dps*8*3600);
  const again=apply(r.state,{type:'presence',session:'tab1',active:true},start+24*3600000);
  assert.equal(again.offlineReward,null);assert.equal(again.state.gold,r.state.gold);
  assert.equal(offlineEquivalentSeconds(-1),0);
  assert.equal(settleGrowth(s,start-1000).gold,0);
});
test('repeated hidden updates preserve the same offline 24-hour cap',()=>{
  let s=createGrowth({},start);s.level=80;s.lastDps=production(s).dps;
  const expected=s.lastDps*8*3600;
  for(let hour=1;hour<=48;hour++)s=apply(s,{type:'presence',session:'hidden',active:false},start+hour*3600000).state;
  assert.equal(s.gold,expected);
});
test('main and puzzle share one online production stream; closing one tab keeps the other active',()=>{
  let s=createGrowth({},start);s.level=80;s.lastDps=production(s).dps;
  const dps=s.lastDps;
  s=apply(s,{type:'presence',session:'main',active:true}).state;
  s=apply(s,{type:'presence',session:'puzzle',active:true}).state;
  s=apply(s,{type:'presence',session:'main',active:false},start+5000).state;
  s=apply(s,{type:'presence',session:'puzzle',active:true},start+10000).state;
  assert.equal(s.gold,dps*10);
  assert.equal(s.level,80);
});
test('newly crafted toilets never boost previously accrued offline income',()=>{
  let s=createGrowth({},start);s.level=80;s.lastDps=production(s).dps;const old=s.lastDps;
  s=apply(s,{type:'sync'},start+3600000,{economy:{toiletLevel:10}}).state;
  assert.equal(s.gold,old*1800);assert.equal(s.lastDps,Math.floor(old*1.5));
});
test('equipment gates, partial bulk upgrades, demo exclusion and reset',()=>{
  let s=createGrowth({},start);s.gold=17;
  s=apply(s,{type:'upgrade',count:100}).state;assert.equal(s.level,2);assert.equal(s.gold,0);
  assert.throws(()=>apply(s,{type:'equipment',itemId:0}),/equipment_locked/);
  assert.throws(()=>apply(s,{type:'demo_gold'}),/demo_disabled/);
  s=apply(s,{type:'demo_gold'},start,{allowDemo:true}).state;assert.equal(s.unranked,true);
  s=apply(s,{type:'reset'}).state;assert.equal(s.unranked,true);assert.equal(s.level,1);assert.equal(s.invested,0);
});

test('helping the cleaner pays 10% of the completion balance and keeps investment assets',()=>{
  let s=createGrowth({},start);s.gold=10000;s.invested=50000;
  const when=start+45000;
  s=apply(s,{type:'cleaner_start',id:'cleaner-event-1'},when).state;
  for(let n=0;n<5;n++)s=apply(s,{type:'cleaner_help',eventId:'cleaner-event-1'},when+n*100).state;
  assert.equal(s.gold,10000);assert.equal(s.cleaner.completed,false);
  // The current balance at completion, including clicks/spending, sets the reward.
  s.gold=12345;
  s=apply(s,{type:'cleaner_help',eventId:'cleaner-event-1',reward:999999999},when+500).state;
  assert.equal(s.cleaner.reward,1234);assert.equal(s.gold,13579);assert.equal(s.invested,50000);
  assert.throws(()=>apply(s,{type:'cleaner_help',eventId:'cleaner-event-1'},when+600),/cleaner_finished/);
  assert.throws(()=>apply(s,{type:'cleaner_start',id:'another-event'},when+600),/cleaner_cooldown/);
});
test('missed and expired cleaner events never take coins; old penalty and fake claims are rejected',()=>{
  let s=createGrowth({},start);s.gold=10000;
  assert.throws(()=>apply(s,{type:'cleaner_help',eventId:'fake-event'}),/cleaner_not_found/);
  assert.throws(()=>apply(s,{type:'cleaner_start',id:'cleaner-event-2'}),/cleaner_cooldown/);
  s=apply(s,{type:'cleaner_start',id:'cleaner-event-2'},start+45000).state;
  assert.throws(()=>apply(s,{type:'cleaner_help',eventId:'cleaner-event-2'},start+54000),/cleaner_expired/);
  s=apply(s,{type:'sync'},start+54000).state;assert.equal(s.gold,10000);
  assert.throws(()=>apply(s,{type:'cleaner'},start+54000),/invalid_action/);
  assert.equal(s.gold,10000);
});
