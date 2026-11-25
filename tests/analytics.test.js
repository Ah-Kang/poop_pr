import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeTelemetry, counterDelta, analyticsFilters, csvCell } from '../shared/analytics.js';
import { createCollector } from '../src/analytics/collector.js';

const now=Date.parse('2026-11-23T14:59:50Z');
const packet={sessionId:'test-session',streamId:'test-stream',day:'2026-11-23',counters:{clicks:10,mainSeconds:30}};
test('telemetry allows bounded counters only and rejects future dates and forged reward metrics',()=>{
  const normalized=normalizeTelemetry(packet,now);
  assert.equal(normalized.counters.clicks,10);
  assert.equal(normalized.counters.puzzleSeconds,0);
  for(const change of [{day:'2026-11-24'},{day:'2026-11-01'},{day:'2026-02-30'},{sessionId:'bad'},{counters:{clicks:-1}},{counters:{puzzleEntries:1}},{counters:{clicks:1.5}},{counters:{mainSeconds:Infinity}}])assert.throws(()=>normalizeTelemetry({...packet,...change},now),/invalid_telemetry/);
  assert.equal(counterDelta({clicks:20},normalized.counters).clicks,0);
});
test('date range and sort filters are bounded, CSV protects spreadsheet formulas',()=>{
  assert.equal(analyticsFilters({from:'2026-11-01',to:'2026-11-23'},now).page,1);
  for(const filters of [{from:'2026-01-01'},{sort:'DROP TABLE users'},{provider:'fake'},{page:-1},{from:'2026-11-24'}])assert.throws(()=>analyticsFilters(filters,now));
  assert.equal(csvCell('=1+1'),'"\'=1+1"');
  assert.equal(csvCell(' \t@SUM(1)'), '"\' \t@SUM(1)"');
  assert.equal(csvCell('이름 "하나"'),'"이름 ""하나"""');
});
test('collector counts focused time, separates Korea midnight, retains failed snapshots and retries cumulatively',async()=>{
  let time=now,focus=true,id=0,fail=true;
  const memory=new Map(),sent=[];
  const storage={getItem:key=>memory.get(key),setItem:(key,value)=>memory.set(key,value)};
  const collector=createCollector({userId:'u1',screen:'main',now:()=>time,focused:()=>focus,uuid:()=>`uuid-test-${++id}`,storage,send:async p=>{sent.push(structuredClone(p));return !fail;}});
  collector.record('clicks');time+=5000;await collector.flush();
  assert.equal(sent[0].counters.mainSeconds,5);
  collector.record('clicks');time+=10000;fail=false;await collector.flush();
  const prior=sent.findLast(p=>p.day==='2026-11-23'),today=sent.findLast(p=>p.day==='2026-11-24');
  assert.equal(prior.counters.mainSeconds,10);assert.equal(prior.counters.clicks,2);assert.equal(today.counters.mainSeconds,5);
  focus=false;collector.sample();time+=60000;collector.sample();focus=true;collector.sample();time+=5000;await collector.flush();
  assert.equal(sent.at(-1).counters.mainSeconds,10);
  assert.equal(JSON.parse(memory.get('poop-analytics-pending:u1')).length,0);
  const puzzle=createCollector({userId:'u1',screen:'puzzle',now:()=>time,focused:()=>focus,uuid:()=>`uuid-test-${++id}`,storage,send:async p=>{sent.push(p);return true;}});
  time+=5000;await puzzle.flush();
  assert.equal(sent.at(-1).sessionId,prior.sessionId);assert.equal(sent.at(-1).counters.puzzleSeconds,5);
  const other=createCollector({userId:'u2',screen:'main',now:()=>time,uuid:()=>`uuid-test-${++id}`,storage,send:async p=>{sent.push(p);return true;}});await other.flush();
  assert.notEqual(sent.at(-1).sessionId,prior.sessionId);
});

test('an older in-flight collector does not erase a newer page pending snapshot',async()=>{
  const memory=new Map(),storage={getItem:key=>memory.get(key),setItem:(key,value)=>memory.set(key,value)};
  let finish,id=0;
  const first=createCollector({userId:'same-user',screen:'main',now:()=>now,uuid:()=>`stream-${++id}`,storage,send:()=>new Promise(resolve=>{finish=resolve;})});
  const work=first.flush();
  const next=createCollector({userId:'same-user',screen:'puzzle',now:()=>now+1000,uuid:()=>`stream-${++id}`,storage,send:async()=>false});
  next.record('wardrobeOpens');await next.flush();finish(true);await work;
  const pending=JSON.parse(memory.get('poop-analytics-pending:same-user'));
  assert.ok(pending.some(packet=>packet.counters.wardrobeOpens===1));
});
