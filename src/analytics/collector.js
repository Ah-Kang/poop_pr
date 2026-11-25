import { clientMetrics, shiftDay } from '../../shared/analytics.js';
import { koreaDay } from '../../shared/economy.js';

// Cumulative snapshots make retries and out-of-order delivery idempotent.
// Only counters are collected: no pointer coordinates, typed text or external trackers.
export function createCollector({ userId, screen, now = Date.now, uuid = () => crypto.randomUUID(), storage, send, focused = () => true }) {
  const key = `poop-analytics-pending:${userId}`, sessionKey = `poop-analytics-session:${userId}`;
  const read = (key, fallback) => { try { return JSON.parse(storage.getItem(key)) || fallback; } catch { return fallback; } };
  const write = (key,value) => { try { storage.setItem(key,JSON.stringify(value)); } catch { /* Private/full storage: continue in memory. */ } };
  const oldSession = read(sessionKey,null);
  const sessionId = oldSession && typeof oldSession.id === 'string' && now()-oldSession.at >= 0 && now()-oldSession.at<30*60*1000 ? oldSession.id : uuid();
  write(sessionKey,{id:sessionId,at:now()});
  const streamId = uuid(), days = new Map();
  let last = now(), eligible=focused(), sending=false;
  const readPending = () => {
    const value=read(key,[]);
    return Array.isArray(value)?value.filter(packet=>packet?.counters&&packet?.day>=shiftDay(koreaDay(now()),-7)).slice(-40):[];
  };
  let pending = readPending();
  const merge = (...groups) => {
    const packets=new Map();
    for(const packet of groups.flat()) {
      const id=packet.streamId+'/'+packet.day, prior=packets.get(id);
      packets.set(id,prior?{...packet,counters:Object.fromEntries(clientMetrics.map(metric=>[metric,Math.max(prior.counters[metric]||0,packet.counters[metric]||0)]))}:packet);
    }
    return [...packets.values()].slice(-40);
  };
  const countersFor = day => {
    if (!days.has(day)) days.set(day,Object.fromEntries(clientMetrics.map(metric=>[metric,0])));
    return days.get(day);
  };
  countersFor(koreaDay(now()));
  function sample() {
    const end=now(), start=Math.max(last,end-30000);
    if (eligible && end>=last) {
      let cursor=start;
      while(cursor<end) {
        const day=koreaDay(cursor);
        const midnight=Date.parse(`${shiftDay(day,1)}T00:00:00+09:00`);
        const until=Math.min(end,midnight);
        countersFor(day)[screen==='puzzle'?'puzzleSeconds':'mainSeconds']+=(until-cursor)/1000;
        cursor=until;
      }
    }
    last=end; eligible=focused();
  }
  function stash() {
    pending=merge(pending,readPending());
    for(const [day,counters] of days) {
      const packet={sessionId,streamId,day,counters:Object.fromEntries(clientMetrics.map(metric=>[metric,Math.floor(counters[metric])]))};
      pending=pending.filter(item=>!(item.streamId===streamId&&item.day===day));
      pending.push(packet);
    }
    pending=pending.slice(-40); write(key,pending);
    if (eligible) write(sessionKey,{id:sessionId,at:now()});
  }
  async function flush() {
    sample(); stash();
    if(sending) return;
    sending=true;
    try {
      for(const packet of [...pending]) {
        try {
          const ok=await send(packet);
          if(!ok) break;
          const encoded=JSON.stringify(packet);
          // A newer page/StrictMode mount may have queued another stream while
          // this request was in flight. Never overwrite its unsent snapshot.
          pending=merge(pending,readPending()).filter(item=>JSON.stringify(item)!==encoded);
          write(key,pending);
        } catch { break; }
      }
    } finally { sending=false; }
  }
  return {
    sample, flush,
    record(metric, amount=1) {
      if(!clientMetrics.includes(metric)||metric.endsWith('Seconds')||!Number.isSafeInteger(amount)||amount<1) return;
      sample(); countersFor(koreaDay(now()))[metric]+=amount;
    },
  };
}
