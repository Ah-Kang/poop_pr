import test from 'node:test';
import assert from 'node:assert/strict';
import {createGrowthClient,GROWTH_KEY} from '../src/growth/client.js';
import {createGrowth,applyGrowthAction,growthSnapshot} from '../shared/growth.js';
const storage=new Map();
globalThis.localStorage={getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)};
Object.defineProperty(globalThis,'navigator',{value:{},configurable:true});
test('a lost account response retries the same receipt before the next action without double credit',async()=>{
  storage.clear();let state=createGrowth(),lost=false;const seen=new Set(),packets=[];
  globalThis.fetch=async(_url,options)=>{
    const packet=JSON.parse(options.body);packets.push(packet);
    const response=applyGrowthAction(state,seen.has(packet.id)?{type:'sync'}:packet);
    state=response.state;if(packet.id)seen.add(packet.id);
    if(packet.type==='click'&&!lost){lost=true;throw Error('lost response after commit');}
    return {ok:true,json:async()=>({...response,state:growthSnapshot(state)})};
  };
  let client=createGrowthClient('owner-A');
  await assert.rejects(client.send({type:'click',count:10}),/lost response/);
  client=createGrowthClient('owner-A'); // Reopening the page retains the pending receipt.
  const recovered=await client.send({type:'sync'});
  assert.equal(recovered.state.gold,10);assert.equal(packets[0].id,packets[1].id);
  assert.ok(packets.every(p=>p.owner==='owner-A'));
  assert.equal(storage.get('poop-pr-growth-pending:owner-A'),undefined);
});
test('guest clients share one balance and use current production for purchases',async()=>{
  storage.clear();storage.set(GROWTH_KEY,JSON.stringify(createGrowth()));
  const a=createGrowthClient(null),b=createGrowthClient(null);
  await Promise.all([a.send({type:'click',count:10}),b.send({type:'click',count:10})]);
  const upgraded=await a.send({type:'upgrade',count:100});
  assert.equal(upgraded.state.level,2);assert.equal(upgraded.state.gold,3);assert.equal(upgraded.state.invested,17);
  assert.equal((await b.send({type:'sync'})).state.level,2);
});
