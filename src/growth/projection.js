// Display-only prediction. Authoritative balances still decide every purchase.
export function createGrowthProjection() {
  let state=null, clicks=0, anchor=0, visible=true, resetAnchor=true;
  const pending=new Map();
  const settleReceipts=ids=>{for(const id of ids||[])pending.delete(id);};
  return {
    get state(){return state;},
    get queuedClicks(){return clicks;},
    click(){clicks++;},
    takeClicks(id){
      if(!clicks)return null;
      const count=Math.min(100,clicks);clicks-=count;pending.set(id,count);
      return {type:'click',count,id};
    },
    setVisible(next){
      if(visible!==next)resetAnchor=true;
      visible=next;
    },
    receive(result,now){
      settleReceipts(result.settledActionIds);
      const next=result.state;
      if(state && next.revision<state.revision)return false;
      // Advance by the time actually settled, not the response arrival time.
      // Otherwise income shown while a response travels disappears on arrival.
      anchor=!state||resetAnchor||next.lastAt<state.lastAt
        ? now : Math.min(now,anchor+next.lastAt-state.lastAt);
      resetAnchor=false;state=next;
      return true;
    },
    reject(error){
      settleReceipts(error.settledActionIds);
      // Recovery of an earlier lost response can fail before this batch is sent.
      // It has no persisted receipt yet, so put those clicks back in the buffer.
      const id=error.unattemptedActionId;
      if(pending.has(id)){clicks+=pending.get(id);pending.delete(id);}
    },
    gold(now){
      if(!state)return 0;
      const seconds=visible&&!resetAnchor
        ? Math.max(0,Math.min(10,(now-anchor)/1000,(state.onlineUntil-state.lastAt)/1000)) : 0;
      const awaiting=clicks+[...pending.values()].reduce((sum,count)=>sum+count,0);
      return state.gold+Math.floor((state.fraction||0)+state.dps*seconds)+awaiting*state.clickPower;
    },
  };
}
