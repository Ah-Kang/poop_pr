import React,{useEffect,useRef,useState} from 'react';

const time=value=>new Date(value).toLocaleString('ko-KR',{timeZone:'Asia/Seoul',dateStyle:'medium',timeStyle:'short'});
export default function FeedbackInbox({demo,onAuthExpired}) {
  const [filter,setFilter]=useState('all'),[page,setPage]=useState(1),[data,setData]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[changing,setChanging]=useState(null);
  const version=useRef(0),authExpired=useRef(onAuthExpired);authExpired.current=onAuthExpired;
  async function load(status=filter,nextPage=page){
    const request=++version.current;setBusy(true);setError('');
    try{
      const response=await fetch(`/api/admin/feedback?${new URLSearchParams({status,page:String(nextPage)})}`,{cache:'no-store'});
      if(response.status===403){authExpired.current();return;}
      if(!response.ok)throw Error('문의함을 불러오지 못했어요. 다시 시도해주세요.');
      const result=await response.json();if(request===version.current)setData(result);
    }catch(failure){if(request===version.current)setError(failure.message);}
    finally{if(request===version.current)setBusy(false);}
  }
  useEffect(()=>{
    if(!demo)load(filter,page);
    return()=>{version.current++;};
  },[filter,page,demo]);
  async function change(item){
    if(changing)return;setChanging(item.id);setError('');
    try{
      const response=await fetch(`/api/admin/feedback/${encodeURIComponent(item.id)}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:item.status==='new'?'resolved':'new'})});
      if(response.status===403){authExpired.current();return;}
      if(!response.ok)throw Error('처리 상태를 저장하지 못했어요. 다시 시도해주세요.');
      if(page>1&&data.items.length===1&&filter!=='all')setPage(page-1);
      else await load();
    }catch(failure){setError(failure.message);}
    finally{setChanging(null);}
  }
  return <section className="admin-panel admin-inbox" aria-label="사용자 문의함">
    <div className="admin-panel-heading"><div><h2>문의 · 피드백 <span>{data?`${data.unread}건 미처리`:''}</span></h2><p>게임에서 보내주신 의견을 확인하세요. 로그인하지 않은 사용자는 게스트로 표시돼요.</p></div><button className="admin-secondary" onClick={()=>load()} disabled={demo||busy||Boolean(changing)}>문의 새로고침</button></div>
    <div className="admin-inbox-filters">{[['all','전체'],['new','새 문의'],['resolved','처리 완료']].map(([value,label])=><button key={value} type="button" className={filter===value?'admin-primary':'admin-secondary'} aria-pressed={filter===value} disabled={Boolean(changing)} onClick={()=>{setFilter(value);setPage(1);setData(null);}}>{label}</button>)}</div>
    <p className="admin-note">게임 내 답장 기능은 없어요. 자세한 문의는 asdfuffu@gmail.com으로 안내하고 있습니다. 처리 완료한 글은 30일 후 자동 삭제됩니다.</p>
    {error&&<p className="admin-error" role="alert">{error}</p>}
    {busy&&<p role="status" className="admin-empty">문의 내용을 불러오고 있어요…</p>}
    {demo?<p className="admin-empty">실제 문의는 관리자 로그인 후 확인할 수 있어요.</p>:!busy&&data&&<>
      {data.items.length?<div className="admin-inbox-list">{data.items.map(item=><article className="admin-feedback-item" key={item.id}>
        <header><div><strong>{item.nickname}</strong><small>{item.userId?'로그인 사용자':'게스트'} · {time(item.createdAt)}</small></div><span className={item.status==='new'?'feedback-badge-new':'feedback-badge-done'}>{item.status==='new'?'새 문의':'처리 완료'}</span></header>
        <p className="admin-feedback-message">{item.message}</p>
        <footer><small>{item.resolvedAt?`처리 완료 · ${time(item.resolvedAt)}`:'확인을 기다리고 있어요'}</small><button className="admin-secondary" disabled={Boolean(changing)} onClick={()=>change(item)}>{changing===item.id?'저장 중…':item.status==='new'?'처리 완료로 표시':'새 문의로 되돌리기'}</button></footer>
      </article>)}</div>:<p className="admin-empty">{filter==='new'?'새 문의가 없어요.':filter==='resolved'?'처리 완료한 문의가 없어요.':'아직 도착한 문의가 없어요.'}</p>}
      <div className="admin-pagination"><span>총 {data.filteredTotal}건</span><div><button disabled={page<=1||Boolean(changing)} onClick={()=>setPage(page-1)}>이전</button><b>{page} / {Math.max(1,Math.ceil(data.filteredTotal/20))}</b><button disabled={page*20>=data.filteredTotal||Boolean(changing)} onClick={()=>setPage(page+1)}>다음</button></div></div>
    </>}
  </section>;
}
