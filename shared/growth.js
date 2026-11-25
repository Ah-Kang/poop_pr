import { equipment, getEquipmentPrice, getPoopUpgradePrice, production, stageForLevel, levelsForLevel, evolutionThresholds, safeAmount } from './poop-progression.js';
import { poopProgression as oldStages, getPoopStats as oldStats } from './legacy-poop-progression.js';
export const GROWTH_VERSION = 2;
export const PRESENCE_MS = 15000;
export const CLEANER_DURATION_MS = 9000;
export const CLEANER_REQUIRED_HELPS = 6;
export const CLEANER_COOLDOWN_MS = 45000;
export const CLEANER_MIN_GOLD = 5000;
export class GrowthError extends Error {}
const integer = (n, fallback=0) => Number.isSafeInteger(n) && n>=0 ? n : fallback;
const legacyIds = [4,5,8,12,17,19];
export function createGrowth(save = {}, now = Date.now()) {
  let levels = Array.isArray(save.poopLevels) ? save.poopLevels : [1];
  if (levels.length===6) { const old=levels; levels=Array(20).fill(0); old.forEach((n,i)=>levels[legacyIds[i]]=integer(n)); }
  const highest = levels.reduce((id,n,i)=>n>0 ? i : id,0);
  const level = Math.max(evolutionThresholds[Math.min(19,highest)], 1+levels.reduce((s,n)=>s+Math.max(0,integer(n)-1),0));
  const oldItems = (save.itemLevels || []).slice(0,6);
  const legacyPrices = [25,180,950,5200,28000,150000];
  let invested = 0;
  levels.slice(0,20).forEach((n,i)=>{const count=Math.max(0,integer(n)-1);if(count)invested=safeAmount(invested+20*oldStats(oldStages[i],1).clickPower*(1.025**count-1)/.025);});
  oldItems.forEach((n,i)=>{invested=safeAmount(invested+legacyPrices[i]*(1.24**integer(n)-1)/.24);});
  const state = { version:GROWTH_VERSION, level, gold:safeAmount(Number(save.gold)||0), invested,
    itemLevels:equipment.map((_,i)=>Math.min(5,integer(oldItems[i]))), selectedPoopId:stageForLevel(level),
    toiletLevel:integer(save.toiletLevel), renovationLevel:0, lastAt:now, onlineUntil:now, sessions:{},
    cleaner:null, cleanerAvailableAt:now+CLEANER_COOLDOWN_MS,
    offlineBank:0, offlineMilliseconds:0, fraction:0, clickCredit:30, creditAt:now, revision:0, unranked:false,
    migrated:Boolean(save.poopLevels), legacy:save.poopLevels ? {poopLevels:save.poopLevels,itemLevels:oldItems} : null };
  state.lastDps=production(state).dps;
  return state;
}
export const offlineEquivalentSeconds = ms => {
  const seconds=Math.max(0,ms)/1000;
  return Math.min(seconds,8*3600)*.5 + Math.min(Math.max(0,seconds-8*3600),16*3600)*.25;
};
export function settleGrowth(previous, now=Date.now()) {
  const state=structuredClone(previous);
  now=Math.max(state.lastAt,now);
  const onlineMs=Math.max(0,Math.min(now,state.onlineUntil)-state.lastAt);
  const offlineFrom=Math.max(state.lastAt,state.onlineUntil);
  const offlineSeconds=offlineEquivalentSeconds(now-state.onlineUntil)-offlineEquivalentSeconds(offlineFrom-state.onlineUntil);
  const offline=safeAmount(state.lastDps*Math.max(0,offlineSeconds));
  const earned=safeAmount(state.lastDps*onlineMs/1000+offline+state.fraction);
  state.gold=safeAmount(state.gold+Math.floor(earned));
  state.fraction=earned-Math.floor(earned);
  state.offlineBank=safeAmount(state.offlineBank+offline);
  state.offlineMilliseconds+=Math.max(0,now-offlineFrom);
  state.lastAt=now;
  state.clickCredit=Math.min(100,state.clickCredit+Math.max(0,now-state.creditAt)/1000*10);
  state.creditAt=now;
  return state;
}
export function applyGrowthAction(previous, action={type:'sync'}, {now=Date.now(), economy={}, allowDemo=false}={}) {
  let state=settleGrowth(previous,now), offlineReward=null;
  state.cleanerAvailableAt ??= now+CLEANER_COOLDOWN_MS;
  // Accrue at the previous production rate before applying newly crafted toilets.
  state.toiletLevel=integer(economy.toiletLevel,state.toiletLevel);
  state.renovationLevel=integer(economy.renovationLevel,state.renovationLevel);
  const beforeStage=stageForLevel(state.level);
  let upgrades=0;
  const spend=price=>{if(state.gold+1e-6<price)throw new GrowthError('not_enough_gold');state.gold=Math.max(0,state.gold-price);state.invested=safeAmount(state.invested+price);};
  switch(action.type) {
    case 'sync': break;
    case 'presence': {
      if(typeof action.session!=='string'||action.session.length>80)throw new GrowthError('invalid_action');
      state.sessions=Object.fromEntries(Object.entries(state.sessions).filter(([,until])=>until>now));
      if(action.active===true){
        if(state.offlineBank>=1&&state.offlineMilliseconds>=60000)offlineReward={gold:Math.floor(state.offlineBank),milliseconds:state.offlineMilliseconds};
        state.offlineBank=0;state.offlineMilliseconds=0;
        state.sessions[action.session]=now+PRESENCE_MS;
        // Limit stored leases, while keeping other visible tabs active.
        state.sessions=Object.fromEntries(Object.entries(state.sessions).sort((a,b)=>b[1]-a[1]).slice(0,16));
      } else delete state.sessions[action.session];
      const until=Math.max(now,...Object.values(state.sessions));
      // Never restart an existing offline interval on repeated hidden messages.
      if(until>now || previous.onlineUntil>now)state.onlineUntil=until;
      break;
    }
    case 'click': {
      const count=integer(action.count);
      if(count<1||count>100||count>Math.floor(state.clickCredit))throw new GrowthError('click_too_fast');
      state.clickCredit-=count;
      state.gold=safeAmount(state.gold+production(state).clickPower*count);
      break;
    }
    case 'upgrade': {
      const count=[1,10,100].includes(action.count)?action.count:1;
      for(let i=0;i<count;i++){
        const price=getPoopUpgradePrice(null,state.level);
        if(state.gold+1e-6<price)break;
        if(!Number.isSafeInteger(state.level+1))throw new GrowthError('level_out_of_range');
        spend(price);state.level++;upgrades++;
      }
      if(!upgrades)throw new GrowthError('not_enough_gold');
      if(stageForLevel(state.level)>beforeStage)state.selectedPoopId=stageForLevel(state.level);
      break;
    }
    case 'equipment': {
      const id=action.itemId,item=equipment[id];
      if(!Number.isInteger(id)||!item)throw new GrowthError('invalid_action');
      if(state.level<item.unlockLevel)throw new GrowthError('equipment_locked');
      if(state.itemLevels[id]>=5)throw new GrowthError('equipment_max');
      spend(getEquipmentPrice(id,state.itemLevels[id]));state.itemLevels[id]++;
      break;
    }
    case 'cleaner_start': {
      if(typeof action.id !== 'string' || !/^[\w-]{8,80}$/.test(action.id))throw new GrowthError('invalid_action_id');
      if(state.cleaner && !state.cleaner.completed && now<state.cleaner.endsAt)throw new GrowthError('cleaner_in_progress');
      if(now<state.cleanerAvailableAt)throw new GrowthError('cleaner_cooldown');
      if(state.gold<CLEANER_MIN_GOLD)throw new GrowthError('not_enough_gold');
      state.cleaner={id:action.id,endsAt:now+CLEANER_DURATION_MS,helps:0,completed:false,reward:0};
      state.cleanerAvailableAt=now+CLEANER_COOLDOWN_MS;
      break;
    }
    case 'cleaner_help': {
      const event=state.cleaner;
      if(!event || event.id!==action.eventId)throw new GrowthError('cleaner_not_found');
      if(event.completed)throw new GrowthError('cleaner_finished');
      if(now>=event.endsAt)throw new GrowthError('cleaner_expired');
      event.helps++;
      if(event.helps>=CLEANER_REQUIRED_HELPS){
        event.reward=Math.floor(state.gold*.1);
        event.completed=true;
        state.gold=safeAmount(state.gold+event.reward);
      }
      break;
    }
    case 'demo_gold':
      if(!allowDemo)throw new GrowthError('demo_disabled');
      state.gold=safeAmount(state.gold+999999999999);state.unranked=true;break;
    case 'reset': {
      const unranked=state.unranked,revision=state.revision;
      state=createGrowth({},now);state.unranked=unranked;state.revision=revision;break;
    }
    default:throw new GrowthError('invalid_action');
  }
  state.selectedPoopId=stageForLevel(state.level);
  state.lastDps=production(state).dps;state.revision++;
  return {state,offlineReward,upgrades,evolutions:Math.max(0,stageForLevel(state.level)-beforeStage)};
}
export const growthSnapshot = state => ({...state,selectedPoopId:stageForLevel(state.level),poopLevels:levelsForLevel(state.level),totalAssets:safeAmount(state.gold+state.invested),...production(state)});
