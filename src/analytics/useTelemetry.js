import { useCallback, useEffect, useRef, useMemo } from 'react';
import { createCollector } from './collector.js';
import { guestAnalyticsKey } from './guest.js';

export function useTelemetry(userId, screen, {enabled=true,progress=null}={}) {
  const ref=useRef(null);
  const guestKey=useMemo(()=>guestAnalyticsKey(),[]);
  const owner=userId||`guest:${guestKey}`;
  const latest=useRef(null);latest.current={owner,progress,enabled};
  useEffect(()=>{
    if(!enabled)return;
    const collector=createCollector({userId:owner,screen,storage:{getItem:key=>window.sessionStorage.getItem(key),setItem:(key,value)=>window.sessionStorage.setItem(key,value)},
      focused:()=>document.visibilityState==='visible'&&document.hasFocus(),
      getProgress:!userId?()=>{
        const current=latest.current;
        if(current.owner!==owner||!current.enabled||!current.progress)return null;
        const {level,gold,dps,toiletLevel}=current.progress;
        return {level,gold,dps,toiletLevel};
      }:undefined,
      send:async packet=>{
        // Each collector keeps its original destination even if login changes
        // while an old request or pagehide flush is still in flight.
        const response=await fetch(userId?'/api/telemetry':'/api/guest/telemetry',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(userId?{...packet,owner:userId}:{...packet,guestKey}),keepalive:true});
        return response.ok;
      },
    });
    ref.current=collector;
    collector.flush();
    const sample=setInterval(collector.sample,5000);
    const flush=setInterval(collector.flush,30000);
    const boundary=()=>collector.flush();
    window.addEventListener('focus',boundary); window.addEventListener('blur',boundary);
    window.addEventListener('pagehide',boundary); window.addEventListener('online',boundary);
    document.addEventListener('visibilitychange',boundary);
    return ()=>{
      clearInterval(sample);clearInterval(flush);
      window.removeEventListener('focus',boundary);window.removeEventListener('blur',boundary);
      window.removeEventListener('pagehide',boundary);window.removeEventListener('online',boundary);
      document.removeEventListener('visibilitychange',boundary);
      collector.flush();ref.current=null;
    };
  },[userId,owner,guestKey,screen,enabled]);
  return useCallback(metric=>ref.current?.record(metric),[]);
}
