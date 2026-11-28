import React, {useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {FEEDBACK_LIMIT} from '../../shared/feedback.js';
import './feedback.css';

export default function FeedbackModal({open,onClose,user}) {
  const [message,setMessage]=useState(''),[pending,setPending]=useState(false),[error,setError]=useState(''),[sent,setSent]=useState(false);
  const panel=useRef(null),input=useRef(null),receipt=useRef(null),closeRef=useRef(onClose),pendingRef=useRef(false);
  closeRef.current=()=>{setSent(false);onClose();};
  useEffect(()=>{if(open&&sent)panel.current?.querySelector('button')?.focus();},[open,sent]);
  useEffect(()=>{
    if(!open)return;
    setSent(false);setError('');
    const before=document.activeElement;input.current?.focus();
    const key=event=>{
      if(event.key==='Escape'&&!pendingRef.current)closeRef.current();
      if(event.key==='Tab'){
        const controls=[...panel.current.querySelectorAll('button:not(:disabled),textarea:not(:disabled),a[href]')];
        const first=controls[0],last=controls.at(-1);
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
      }
    };
    window.addEventListener('keydown',key);
    return()=>{window.removeEventListener('keydown',key);before?.focus();};
  },[open]);
  async function submit(event){
    event.preventDefault();if(pendingRef.current||!message.trim())return;
    const text=message.trim(),owner=user?.id||'guest';
    if(!receipt.current || receipt.current.text!==text || receipt.current.owner!==owner)receipt.current={id:crypto.randomUUID(),text,owner};
    pendingRef.current=true;setPending(true);setError('');
    try{
      const response=await fetch('/api/feedback',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:receipt.current.id,message:text}),signal:AbortSignal.timeout(20000)});
      if(!response.ok)throw new Error(response.status===429?'잠시 쉬었다가 10분 뒤 다시 보내주세요. 급한 문의는 아래 이메일로 보내주세요.':response.status===400?'문의 내용을 1~2,000자로 입력해주세요.':'전송을 확인하지 못했어요. 작성한 글은 유지되니 다시 보내주세요.');
      const result=await response.json();if(result.id!==receipt.current.id)throw new Error('전송을 확인하지 못했어요. 다시 보내주세요.');
      setSent(true);setMessage('');receipt.current=null;
    }catch(failure){setError(failure.name==='TimeoutError'||failure.name==='TypeError'?'연결이 원활하지 않아요. 작성한 글은 유지되니 다시 보내주세요.':failure.message);}
    finally{pendingRef.current=false;setPending(false);}
  }
  if(!open)return null;
  return createPortal(<div className="feedback-backdrop" onClick={event=>{if(event.target===event.currentTarget&&!pending)closeRef.current();}}>
    <section className="feedback-dialog" role="dialog" aria-modal="true" aria-labelledby="feedback-title" ref={panel}>
      <header><div><p>함께 만드는 똥키우기</p><h2 id="feedback-title">💬 문의 · 피드백</h2></div><button type="button" aria-label="문의 창 닫기" disabled={pending} onClick={()=>closeRef.current()}>✕</button></header>
      <div className="feedback-body">
        {sent?<div className="feedback-success" role="status"><span aria-hidden="true">💌</span><h3>개발자에게 전달했어요!</h3><p>보내주신 의견을 확인하고<br/>더 재미있는 게임을 만들게요.</p><button type="button" className="feedback-submit" onClick={()=>closeRef.current()}>확인</button></div>:<form onSubmit={submit}>
          <p className="feedback-intro">불편했던 점이나 게임에 바라는 점을 알려주세요.</p>
          <label htmlFor="feedback-message">문의 내용 <small>{user?`${user.nickname}님으로 보내요`:'로그인 없이도 보낼 수 있어요'}</small></label>
          <textarea id="feedback-message" ref={input} value={message} maxLength={FEEDBACK_LIMIT} disabled={pending} required placeholder="어떤 상황에서 문제가 생겼나요? 떠오른 아이디어도 좋아요." onChange={event=>{setMessage(event.target.value);setError('');}} aria-describedby="feedback-note"/>
          <div className="feedback-count">{message.length.toLocaleString()} / 2,000</div>
          <p id="feedback-note" className="feedback-note">내용은 개발자만 확인해요. 비밀번호 등 민감한 정보는 적지 마세요. 문의 내용과 로그인한 경우 계정 정보가 문의 처리를 위해 저장돼요. <a href="/privacy.html" target="_blank" rel="noreferrer">개인정보처리방침</a></p>
          {error&&<p className="feedback-error" role="alert">{error}</p>}
          <button type="submit" className="feedback-submit" disabled={pending||!message.trim()} aria-busy={pending}>{pending?'전달하는 중…':'개발자에게 보내기'}</button>
        </form>}
        <div className="feedback-email"><strong>자세한 문의나 답변이 필요하다면</strong><p>스크린샷과 함께 이메일로 보내주세요.<br/>게임 안에서는 개별 답변을 받으실 수 없어요.</p><a href="mailto:asdfuffu@gmail.com">asdfuffu@gmail.com ↗</a></div>
      </div>
    </section>
  </div>,document.body);
}
