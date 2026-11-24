import { useCallback, useEffect, useRef } from 'react';
import { createCollector } from './collector.js';

export function useTelemetry(userId, screen) {
  const ref=useRef(null);
  useEffect(()=>{
    if(!userId) return;
    const collector=createCollector({userId,screen,storage:{getItem:key=>window.sessionStorage.getItem(key),setItem:(key,value)=>window.sessionStorage.setItem(key,value)},
      focused:()=>document.visibilityState==='visible'&&document.hasFocus(),
      send:async packet=>{
        const response=await fetch('/api/telemetry',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(packet),keepalive:true});
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
  },[userId,screen]);
  return useCallback(metric=>ref.current?.record(metric),[]);
}
