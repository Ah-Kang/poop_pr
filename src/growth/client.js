import { applyGrowthAction, createGrowth, growthSnapshot, GrowthError } from '../../shared/growth.js';
import { createEconomy, migrateToiletLevel } from '../../shared/economy.js';
export const GROWTH_KEY='poop-pr-growth-v2';
const mutationTypes=new Set(['click','upgrade','equipment','cleaner_start','cleaner_help','demo_gold','reset']);
let guestQueue=Promise.resolve();
const lock=work=>{
  if(navigator.locks?.request)return navigator.locks.request(GROWTH_KEY,work);
  const promise=guestQueue.then(work,work);guestQueue=promise.catch(()=>{});return promise;
};
export function createGrowthClient(userId){
  const pendingKey=`poop-pr-growth-pending:${userId||'guest'}`;
  let queue=Promise.resolve();
  async function request(action,keepalive=false){
    if(userId){
      const response=await fetch('/api/growth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...action,owner:userId}),keepalive,signal:AbortSignal.timeout(12000)});
      const result=await response.json();
      if(!response.ok){const error=new Error(result.error||'growth_unavailable');error.definitive=response.status>=400&&response.status<500;throw error;}
      return result;
    }
    return lock(()=>{
      const saved=JSON.parse(localStorage.getItem('poop-pr-save')||'{}');
      const raw=localStorage.getItem(GROWTH_KEY);
      const old=raw?JSON.parse(raw):saved.growth?.version===2?saved.growth:createGrowth({...saved,toiletLevel:migrateToiletLevel(saved.currentToiletLevel||0,saved.toiletSchemaVersion)});
      const economy=JSON.parse(localStorage.getItem('poop-pr-guest-economy-v1')||'null')||createEconomy(old.toiletLevel);
      const ids=old.actionIds||[];
      let result;
      try{result=applyGrowthAction(old,action.id&&ids.includes(action.id)?{type:'sync'}:action,{economy,allowDemo:import.meta.env?.DEV ?? false});}
      catch(error){if(error instanceof GrowthError)error.definitive=true;throw error;}
      result.state.actionIds=action.id?[...ids.filter(id=>id!==action.id),action.id].slice(-256):ids;
      localStorage.setItem(GROWTH_KEY,JSON.stringify(result.state));
      return {...result,state:growthSnapshot(result.state)};
    });
  }
  async function send(action,keepalive){
    // A timed-out purchase is retried with its original receipt before any new action.
    const pending=JSON.parse(localStorage.getItem(pendingKey)||'null');
    if(pending){try{await request(pending,keepalive);localStorage.removeItem(pendingKey);}catch(error){if(error.definitive)localStorage.removeItem(pendingKey);else throw error;}}
    const mutation=mutationTypes.has(action.type);
    const packet=mutation?{...action,id:action.id||crypto.randomUUID()}:action;
    if(mutation)localStorage.setItem(pendingKey,JSON.stringify(packet));
    try{const result=await request(packet,keepalive);if(mutation)localStorage.removeItem(pendingKey);return result;}
    catch(error){if(mutation&&error.definitive)localStorage.removeItem(pendingKey);throw error;}
  }
  return {send(action,keepalive=false){const job=queue.then(()=>send(action,keepalive));queue=job.catch(()=>{});return job;}};
}
