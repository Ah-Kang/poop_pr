import test from 'node:test';
import assert from 'node:assert/strict';
import {createGrowthProjection} from '../src/growth/projection.js';
import {createGrowthClient} from '../src/growth/client.js';
import {createGrowth,applyGrowthAction,growthSnapshot} from '../shared/growth.js';

const snapshot=(overrides={})=>({gold:0,dps:0,clickPower:1,fraction:0,lastAt:100000,onlineUntil:115000,revision:1,...overrides});
function start(state=snapshot()){
  const model=createGrowthProjection();model.receive({state},0);return model;
}
function clicks(model,count,id){for(let i=0;i<count;i++)model.click();return model.takeClicks(id);}

test('a delayed presence response and earlier batch preserve later queued and unsent clicks',()=>{
  const model=start();
  clicks(model,30,'batch-a');clicks(model,20,'batch-b');model.click();
  assert.equal(model.gold(4000),51);
  model.receive({state:snapshot({revision:2,lastAt:102000})},4000);
  assert.equal(model.gold(4000),51,'presence must not clear click predictions');
  model.receive({state:snapshot({gold:30,revision:3,lastAt:103000}),settledActionIds:['batch-a']},5000);
  assert.equal(model.gold(5000),51,'only the acknowledged batch is removed');
  model.receive({state:snapshot({gold:50,revision:4,lastAt:104000}),settledActionIds:['batch-b']},6000);
  assert.equal(model.gold(6000),51);
});

test('automatic income remains continuous during delayed responses, including fractional income',()=>{
  const model=start(snapshot({dps:7,fraction:.4}));
  assert.equal(model.gold(3500),24);
  model.receive({state:snapshot({gold:14,dps:7,fraction:.4,lastAt:102000,revision:2})},3500);
  assert.equal(model.gold(3500),24);
  model.receive({state:snapshot({gold:21,dps:7,fraction:.1,lastAt:103100,revision:3})},4300);
  assert.equal(model.gold(4300),29);
});

test('a real purchase lowers the display and older responses cannot roll back its state',()=>{
  const model=start(snapshot({gold:100,dps:2}));
  model.receive({state:snapshot({gold:83,dps:2,lastAt:100000,revision:3})},100);
  assert.equal(model.gold(100),83);
  assert.equal(model.receive({state:snapshot({gold:100,revision:2})},200),false);
  assert.equal(model.gold(200),83);
});

test('hidden time and expired presence leases are not predicted at the full online rate',()=>{
  const model=start(snapshot({dps:10,onlineUntil:102000}));
  assert.equal(model.gold(9000),20);
  model.setVisible(false);assert.equal(model.gold(30000),0);
  model.setVisible(true);assert.equal(model.gold(60000),0);
  model.receive({state:snapshot({gold:310,dps:10,lastAt:160000,onlineUntil:175000,revision:2})},60000);
  assert.equal(model.gold(61000),320);
});

test('a definitive rejection removes only its own batch; unsent recovery failures are rebuffered',()=>{
  const model=start();clicks(model,20,'a');clicks(model,30,'b');
  model.reject({settledActionIds:['a']});assert.equal(model.gold(0),30);
  model.reject({unattemptedActionId:'b'});assert.equal(model.queuedClicks,30);
  assert.equal(model.gold(0),30);
  const packet=model.takeClicks('retry-b');assert.equal(packet.count,30);
  model.receive({state:snapshot({gold:30,revision:2}),settledActionIds:['retry-b']},1000);
  assert.equal(model.gold(1000),30);
});

const storage=new Map();
globalThis.localStorage={getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)};
Object.defineProperty(globalThis,'navigator',{value:{},configurable:true});

test('real client receipts reconcile overlapping batches behind a slow presence request',async()=>{
  storage.clear();const model=start(),client=createGrowthClient('slow-user');
  let state=createGrowth({},100000),revision=1;
  state.revision=revision;
  const deliveries=[];
  globalThis.fetch=async(_url,options)=>{
    const action=JSON.parse(options.body);
    const result=applyGrowthAction(state,action,{now:100000+revision++*1000});state=result.state;
    await new Promise(resolve=>deliveries.push(resolve));
    return {ok:true,json:async()=>({...result,state:growthSnapshot(result.state)})};
  };
  const send=action=>client.send(action).then(result=>{model.receive(result,5000);return result;});
  const presence=send({type:'presence',session:'test',active:true});
  const a=send(clicks(model,10,'receipt-a'));
  const b=send(clicks(model,20,'receipt-b'));
  await new Promise(resolve=>setImmediate(resolve));
  deliveries.shift()();await presence;
  assert.equal(model.gold(5000),30);
  await new Promise(resolve=>setImmediate(resolve));
  deliveries.shift()();const first=await a;
  assert.deepEqual(first.settledActionIds,['receipt-a']);assert.equal(model.gold(5000),30);
  await new Promise(resolve=>setImmediate(resolve));
  deliveries.shift()();await b;
  assert.equal(model.gold(5000),30);assert.equal(state.gold,30);
});

test('lost responses and a failed post-recovery request retain receipts until a confirming snapshot',async()=>{
  storage.clear();const model=start(),client=createGrowthClient('retry-user');
  let state=createGrowth({},100000),calls=0;const seen=new Set();
  globalThis.fetch=async(_url,options)=>{
    const action=JSON.parse(options.body);calls++;
    if(calls===3)throw Error('sync failed after successful recovery');
    const result=applyGrowthAction(state,seen.has(action.id)?{type:'sync'}:action,{now:100000});
    state=result.state;if(action.id)seen.add(action.id);
    if(calls===1)throw Error('response lost after commit');
    return {ok:true,json:async()=>({...result,state:growthSnapshot(state)})};
  };
  await assert.rejects(client.send(clicks(model,10,'lost-receipt')),/response lost/);
  try{await client.send({type:'sync'});assert.fail('must fail');}
  catch(error){model.reject(error);}
  assert.equal(model.gold(0),10);
  const result=await client.send({type:'sync'});
  assert.deepEqual(result.settledActionIds,['lost-receipt']);
  model.receive(result,1000);assert.equal(model.gold(1000),10);assert.equal(state.gold,10);
});

test('a new batch is never lost when an earlier pending receipt cannot be recovered',async()=>{
  storage.clear();const model=start(),client=createGrowthClient('offline-user');
  globalThis.fetch=async()=>{throw Error('offline');};
  await assert.rejects(client.send(clicks(model,10,'pending-a')),/offline/);
  try{await client.send(clicks(model,20,'unsent-b'));assert.fail('must fail');}
  catch(error){model.reject(error);}
  assert.equal(model.gold(0),30);assert.equal(model.queuedClicks,20);
  assert.equal(model.takeClicks('resent-b').count,20);
});
