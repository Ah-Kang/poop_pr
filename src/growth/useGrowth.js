import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { createGrowthClient } from './client.js';
import { createGrowthProjection } from './projection.js';
const messages={cleaner_expired:'청소 시간이 끝났어요. 영양분은 줄지 않아요.',cleaner_cooldown:'다음 청소 이벤트를 기다려주세요.',cleaner_finished:'이미 청소 보상을 받았어요.',cleaner_in_progress:'진행 중인 청소를 도와주세요.',not_enough_gold:'코인이 부족해요.',equipment_locked:'누적 레벨을 더 올려주세요.',equipment_max:'이 장비는 최대 단계예요.',click_too_fast:'조금 천천히 눌러주세요.',login_required:'로그인이 만료됐어요. 다시 로그인해주세요.',demo_disabled:'개발 환경에서만 사용할 수 있어요.',account_changed:'계정이 바뀌었어요. 페이지를 새로고침해주세요.'};
export function useGrowth({authUser,isAuthLoading,ready=true}){
  const owner=isAuthLoading?null:authUser?.id||'guest';
  const client=useMemo(()=>createGrowthClient(authUser?.id),[authUser?.id]);
  const projection=useMemo(()=>createGrowthProjection(),[owner]);
  const session=useRef(crypto.randomUUID());
  const ownerRef=useRef(owner);ownerRef.current=owner;
  const [record,setRecord]=useState(null),[error,setError]=useState(''),[pendingAction,setPendingAction]=useState(null),[offlineReward,setOfflineReward]=useState(null),[tick,setTick]=useState(0);
  const busy=useRef(false),lastClick=useRef(0);
  const apply=useCallback(result=>{if(ownerRef.current!==owner)return;if(!projection.receive(result,performance.now()))return;setRecord({owner,state:projection.state});if(result.offlineReward)setOfflineReward(result.offlineReward);setError('');},[owner,projection]);
  const send=useCallback(async(action,keepalive=false)=>{try{const result=await client.send(action,keepalive);apply(result);return result;}catch(failure){projection.reject(failure);throw failure;}},[client,apply,projection]);
  const flush=useCallback(async(keepalive=false)=>{
    const action=projection.takeClicks(crypto.randomUUID());
    if(action)return send(action,keepalive);
  },[send,projection]);
  const act=useCallback(async action=>{
    if(!owner||!ready||busy.current||record?.owner!==owner)return null;
    busy.current=true;setPendingAction(action.type);
    try{do{await flush();}while(projection.queuedClicks);return await send(action);}
    catch(failure){if(action.type.startsWith('cleaner_') && ['cleaner_expired','cleaner_cooldown','cleaner_finished','cleaner_in_progress','cleaner_not_found'].includes(failure.message)){setError('');return null;}setError(messages[failure.message]||'저장 연결을 확인해주세요. 다시 연결하면 이어서 처리합니다.');return null;}
    finally{busy.current=false;setPendingAction(null);}
  },[owner,ready,record?.owner,flush,send,projection]);
  useEffect(()=>{
    setOfflineReward(null);
    if(!owner||!ready)return;
    let alive=true;
    const presence=async()=>{
      projection.setVisible(document.visibilityState==='visible');
      try{await flush(true);if(alive)await send({type:'presence',session:session.current,active:document.visibilityState==='visible'},true);}
      catch(failure){if(alive)setError(messages[failure.message]||'수익을 저장하지 못했어요. 연결을 확인해주세요.');}
    };
    const hide=()=>{flush(true).then(()=>send({type:'presence',session:session.current,active:false},true)).catch(()=>{});};
    presence();
    const heartbeat=setInterval(presence,10000);
    const batch=setInterval(()=>{if(document.visibilityState==='visible')flush().catch(()=>setError('클릭을 저장하지 못했어요. 연결을 확인해주세요.'));},3000);
    const render=setInterval(()=>setTick(n=>n+1),1000);
    window.addEventListener('pagehide',hide);window.addEventListener('online',presence);document.addEventListener('visibilitychange',presence);
    return()=>{alive=false;clearInterval(heartbeat);clearInterval(batch);clearInterval(render);window.removeEventListener('pagehide',hide);window.removeEventListener('online',presence);document.removeEventListener('visibilitychange',presence);hide();};
  },[owner,ready,send,flush,projection]);
  const state=record?.owner===owner?record.state:null;
  const click=()=>{
    if(!state||busy.current||error||projection.queuedClicks>=100||document.visibilityState!=='visible'||performance.now()-lastClick.current<100)return false;
    lastClick.current=performance.now();projection.click();setTick(n=>n+1);return true;
  };
  // Display-only prediction. Purchases, ranking and saved balances use the server result.
  const gold=state?projection.gold(performance.now()):0;
  return {state,gold,act,click,pending:Boolean(pendingAction),pendingAction,error,offlineReward,dismissOffline:()=>setOfflineReward(null),refresh:async()=>{if(!owner||!ready)return;try{await flush();return await send({type:'presence',session:session.current,active:document.visibilityState==='visible'});}catch(failure){setError(messages[failure.message]||'저장 연결을 확인해주세요.');return null;}}};
}
