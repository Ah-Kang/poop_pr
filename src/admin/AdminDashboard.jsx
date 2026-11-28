import React, { useEffect, useRef, useState } from 'react';
import { koreaDay } from '../../shared/economy.js';
import { shiftDay, serverMetrics } from '../../shared/analytics.js';
import { demoAnalytics } from './demo.js';
import FeedbackInbox from './FeedbackInbox.jsx';
import './admin.css';

const names=['플랑크똥','새우똥','피래미똥','토끼똥','물똥','말랑똥','푸딩똥','찰떡똥','건강똥','단단똥','근육똥','강철똥','불꽃똥','화산똥','용암똥','플래티넘똥','에메랄드똥','다이아똥','왕똥','황금똥'];
const providerLabel=value=>({kakao:'카카오',local:'일반 계정',guest:'게스트'}[value]||value);
const number=n=>Number(n||0).toLocaleString('ko-KR');
const metricValue=(provider,key,value)=>provider==='guest'&&serverMetrics.includes(key)?'미수집':number(value);
const duration=n=>Number(n)<60?`${Math.floor(n||0)}초`:Number(n)<3600?`${Math.floor(n/60)}분`:`${Math.floor(n/3600)}시간 ${Math.floor(n%3600/60)}분`;
const date=value=>{if(!value)return '기록 없음';const iso=/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)?value.replace(' ','T')+'Z':value;return new Date(iso).toLocaleString('ko-KR',{timeZone:'Asia/Seoul',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});};
const query=filters=>new URLSearchParams(filters).toString();
const initialFilters=()=>({from:shiftDay(koreaDay(),-29),to:koreaDay(),provider:'all',search:'',sort:'lastSeen',page:1});
const eventLabels=[['clicks','캐릭터 클릭'],['poopUpgrades','똥 강화'],['evolutions','진화'],['itemUpgrades','장비 강화'],['wardrobeOpens','옷장 열기'],['skinEquips','스킨 착용'],['puzzleEntries','퍼즐 입장'],['puzzleMoves','유효 퍼즐 이동'],['partsEarned','획득 부품'],['toiletCrafts','화장실 제작']];

function DailyChart({daily,metric}) {
  const max=Math.max(1,...daily.map(day=>Number(day[metric])));
  const label={activeUsers:'활성 사용자',playSeconds:'플레이 시간',clicks:'캐릭터 클릭'}[metric];
  return <div className="admin-chart" role="group" aria-label={`일별 ${label} 추이. 각 막대에서 날짜별 수치를 확인할 수 있습니다.`}>
    <div className="admin-chart-bars">{daily.map((day,i)=><div className="admin-chart-column" key={day.day}>
      <button className="admin-chart-bar" style={{height:`${Math.max(1,Number(day[metric])/max*100)}%`}} aria-label={`${day.day} ${label} ${metric==='playSeconds'?duration(day[metric]):number(day[metric])}`} title={`${day.day} · ${metric==='playSeconds'?duration(day[metric]):number(day[metric])}`}><span>{metric==='playSeconds'?duration(day[metric]):number(day[metric])}</span></button>
      {(i===0||i===daily.length-1||i%Math.max(1,Math.floor(daily.length/6))===0)&&<small>{day.day.slice(5)}</small>}
    </div>)}</div>
  </div>;
}

export default function AdminDashboard() {
  const [view,setView]=useState(()=>location.hash==='#feedback'?'feedback':'analytics');
  const [session,setSession]=useState(null),[password,setPassword]=useState(''),[authError,setAuthError]=useState('');
  const [draft,setDraft]=useState(initialFilters),[data,setData]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const [demo,setDemo]=useState(false),[metric,setMetric]=useState('activeUsers'),[detail,setDetail]=useState(null),[detailBusy,setDetailBusy]=useState(false),[detailError,setDetailError]=useState('');
  const [exporting,setExporting]=useState(false),version=useRef(0),detailVersion=useRef(0);
  const detailCloseRef=useRef(null),detailPanelRef=useRef(null);
  const detailOpen=Boolean(detail||detailBusy||detailError);
  async function load(filters=draft,isDemo=demo) {
    const request=++version.current;setBusy(true);setError('');setDetail(null);detailVersion.current++;
    try {
      let next;
      if(isDemo) next=demoAnalytics(filters);
      else {
        const response=await fetch('/api/admin/analytics?'+query(filters),{cache:'no-store'});
        if(response.status===403){if(request===version.current){setSession(previous=>({...previous,authenticated:false}));setData(null);}throw new Error('관리자 인증이 만료됐어요. 다시 로그인해주세요.');}
        if(!response.ok)throw new Error(response.status===400?'조회 기간은 오늘까지, 최대 90일로 선택해주세요.':'데이터를 불러오지 못했어요. 잠시 후 다시 시도해주세요.');
        next=await response.json();
      }
      if(request===version.current){setData(next);setDraft(filters);}
    }catch(failure){if(request===version.current)setError(failure.message);}
    finally{if(request===version.current)setBusy(false);}
  }
  useEffect(()=>{
    // Retire the old URL/localStorage password flow. The new password lives only
    // in the login request; the browser receives an HttpOnly session cookie.
    try{localStorage.removeItem('poop-pr-admin-token');}catch{}
    if(new URLSearchParams(location.search).has('token'))history.replaceState(null,'','/admin');
    let active=true;
    fetch('/api/admin/session',{cache:'no-store'}).then(async response=>{if(!response.ok)throw new Error();return response.json();})
      .then(value=>{if(!active)return;setSession(value);if(value.authenticated)load(initialFilters(),false);})
      .catch(()=>{if(active){setSession({authenticated:false,configured:true});setAuthError('서버 연결을 확인하지 못했어요. 다시 시도해주세요.');}});
    return()=>{active=false;version.current++;detailVersion.current++;};
  },[]);
  useEffect(()=>{
    if(!detailOpen)return;
    const previousFocus=document.activeElement;
    detailCloseRef.current?.focus();
    const key=event=>{
      if(event.key==='Escape'){detailVersion.current++;setDetail(null);setDetailBusy(false);setDetailError('');}
      if(event.key==='Tab'){
        const controls=[...detailPanelRef.current.querySelectorAll('button:not([disabled]),a[href],input,select,[tabindex="0"]')];
        const first=controls[0],last=controls.at(-1);
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
      }
    };
    window.addEventListener('keydown',key);return()=>{window.removeEventListener('keydown',key);previousFocus?.focus();};
  },[detailOpen]);
  async function login(event){
    event.preventDefault();setAuthError('');setBusy(true);
    try{
      const response=await fetch('/api/admin/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password})});
      if(!response.ok)throw new Error(response.status===429?'잠시 쉬었다가 10분 뒤 다시 시도해주세요.':response.status===503?'관리자 비밀번호가 아직 설정되지 않았어요.':'관리자 비밀번호를 확인해주세요.');
      setPassword('');setDemo(false);setSession({authenticated:true,configured:true});await load(initialFilters(),false);
    }catch(failure){setAuthError(failure.message);}finally{setBusy(false);}
  }
  async function logout(){
    if(!demo){const response=await fetch('/api/admin/logout',{method:'POST'});if(!response.ok){setError('로그아웃하지 못했어요. 다시 시도해주세요.');return;}}
    version.current++;detailVersion.current++;setDemo(false);setData(null);setDetail(null);setSession(previous=>({...previous,authenticated:false}));setError('');
  }
  async function openUser(user){
    const request=++detailVersion.current;setDetail(null);setDetailBusy(true);setDetailError('');
    try{
      let value;
      if(demo)value={user,daily:data.daily.map(day=>({...day,activeUsers:1,clicks:Math.round(day.clicks/27),playSeconds:Math.round(day.playSeconds/27)}))};
      else{const response=await fetch(`/api/admin/users/${encodeURIComponent(user.id)}?${query(data.filters)}`,{cache:'no-store'});if(!response.ok)throw new Error();value=await response.json();}
      if(request===detailVersion.current)setDetail(value);
    }catch{if(request===detailVersion.current)setDetailError('사용자 상세 정보를 불러오지 못했어요.');}
    finally{if(request===detailVersion.current)setDetailBusy(false);}
  }
  async function download(){
    setExporting(true);setError('');
    try{
      const response=await fetch('/api/admin/export.csv?'+query(data.filters),{cache:'no-store'});
      if(!response.ok)throw new Error();
      const url=URL.createObjectURL(await response.blob()),a=document.createElement('a');
      a.href=url;a.download=`poop-analytics-${data.filters.from}-${data.filters.to}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    }catch{setError('CSV를 내려받지 못했어요. 관리자 인증과 연결을 확인해주세요.');}finally{setExporting(false);}
  }
  const allowed=demo||session?.authenticated,s=data?.summary||{},totalPages=Math.max(1,Math.ceil((s.totalUsers||0)/20));
  return <main className="admin-app">
    <aside className="admin-sidebar"><a className="admin-brand" href="/">💩 <span>POOP PR<small>DEVELOPER STUDIO</small></span></a><div className="admin-nav-label">게임 운영</div><span className="admin-nav-active">{view==='feedback'?'💬 문의함':'▦ 플레이 분석'}</span><p>플레이어를 이해하고,<br/>더 재미있는 게임을 만들어요.</p><a className="admin-back" href="/">← 게임으로 돌아가기</a></aside>
    <div className="admin-content">
      <header className="admin-header"><div><p className="admin-eyebrow">PLAYER INSIGHTS</p><h1>{view==='feedback'?'플레이어의 목소리':'플레이 기록을 한눈에'}</h1><p>{view==='feedback'?'게임에서 도착한 문의와 의견을 확인하세요.':'접속부터 성장까지, 플레이 기록을 한곳에서 확인하세요.'}</p></div>{allowed&&<button className="admin-secondary" onClick={logout}>{demo?'예시 닫기':'관리자 로그아웃'}</button>}</header>
      {!allowed ? <section className="admin-login"><span className="admin-lock">🔒</span><h2>개발자 전용 대시보드</h2><p>플레이 기록과 문의 내용은 관리자만 볼 수 있어요.</p>
        <form onSubmit={login}><label>관리자 비밀번호<input type="password" autoComplete="current-password" value={password} onChange={event=>setPassword(event.target.value)} required /></label><button className="admin-primary" disabled={busy||!session}>{busy?'확인 중…':'대시보드 열기'}</button></form>
        {!session&&<p role="status">서버 연결을 확인하고 있어요.</p>}{session?.configured===false&&<p className="admin-notice">서버에 관리자 비밀번호를 설정하면 실제 데이터를 볼 수 있어요.</p>}{authError&&<p className="admin-error" role="alert">{authError}</p>}
        {import.meta.env.DEV&&<button className="admin-demo-button" onClick={()=>{setDemo(true);load(initialFilters(),true);}}>예시 데이터로 둘러보기 →</button>}
      </section>:<>
        {demo&&<div className="admin-demo-banner">예시 화면입니다 · 실제 사용자 기록이 아닙니다. 데이터는 저장되지 않습니다.</div>}
        <nav className="admin-view-switch" aria-label="대시보드 메뉴"><button type="button" aria-pressed={view==='analytics'} onClick={()=>setView('analytics')}>▦ 플레이 분석</button><button type="button" aria-pressed={view==='feedback'} onClick={()=>setView('feedback')}>💬 문의함</button></nav>
        {view==='feedback'&&<FeedbackInbox demo={demo} onAuthExpired={()=>{setSession(previous=>({...previous,authenticated:false}));setData(null);setAuthError('관리자 인증이 만료됐어요. 다시 로그인해주세요.');}}/>}
        <div hidden={view!=='analytics'}>
        <form className="admin-filter" onSubmit={event=>{event.preventDefault();load({...draft,page:1});}}>
          <div className="admin-date-presets">{[7,30,90].map(days=><button type="button" key={days} className={draft.from===shiftDay(draft.to,1-days)?'active':''} onClick={()=>load({...draft,from:shiftDay(koreaDay(),1-days),to:koreaDay(),page:1})}>최근 {days}일</button>)}</div>
          <label>시작일<input type="date" value={draft.from} max={draft.to} onChange={event=>setDraft({...draft,from:event.target.value})} required /></label><label>종료일<input type="date" value={draft.to} min={draft.from} max={koreaDay()} onChange={event=>setDraft({...draft,to:event.target.value})} required /></label>
          <label>플레이어 유형<select value={draft.provider} onChange={event=>setDraft({...draft,provider:event.target.value})}><option value="all">전체 플레이어</option><option value="kakao">카카오 계정</option><option value="local">일반 계정</option><option value="guest">게스트</option></select></label>
          <button className="admin-primary" disabled={busy}>{busy?'불러오는 중…':'조회하기'}</button>
        </form>
        {error&&<p className="admin-error" role="alert">{error}</p>}
        {data&&<>
          <div className="admin-range"><span>{data.filters.from} — {data.filters.to} · 한국 시간 기준</span><span>{demo?'예시':'최근 집계'} {date(data.generatedAt)} <button onClick={()=>load(data.filters)} disabled={busy} aria-label="데이터 새로고침">↻</button></span></div>
          <p className="admin-note">게스트는 익명 기기 기준이며 현재 레벨은 기기에서 보고한 값입니다. 접속·클릭 기록은 약 30초마다 전송돼요. 최신 기록은 새로고침으로 확인하세요.</p>
          <section className="admin-kpis" aria-label="주요 지표">{[
            ['활성 플레이어',`${number(s.activeUsers)}명`,'선택 기간에 접속한 계정·게스트'],['플레이 시간',duration(s.playSeconds),'메인 + 퍼즐 + 기존 시간 기록'],['캐릭터 클릭',`${number(s.clicks)}회`,'똥을 직접 누른 횟수'],['1인 평균 플레이',duration(s.activeUsers?s.playSeconds/s.activeUsers:0),'활성 플레이어 기준'],
          ].map(([label,value,help],index)=><article key={label} className={`admin-kpi tone-${index}`}><span>{label}</span><strong>{value}</strong><small>{help}</small></article>)}</section>
          <div className="admin-secondary-stats"><span>전체 플레이어 <b>{number(s.totalUsers)}</b></span><span>기간 내 첫 접속·가입 <b>{number(s.newUsers)}</b></span><span>2일 이상 재방문 <b>{number(s.returningUsers)}</b></span><span>퍼즐 참여자 <b>{number(s.puzzleUsers)}</b></span><span>접속 세션 <b>{number(s.sessions)}</b></span></div>
          <div className="admin-overview-grid"><section className="admin-panel"><div className="admin-panel-heading"><div><h2>플레이 흐름</h2><p>어떤 날 더 많이 찾아오고, 더 오래 머물렀을까요?</p></div><select aria-label="추이 차트 지표" value={metric} onChange={event=>setMetric(event.target.value)}><option value="activeUsers">활성 사용자</option><option value="playSeconds">플레이 시간</option><option value="clicks">클릭 수</option></select></div><DailyChart daily={data.daily} metric={metric}/>{!s.activeUsers&&<p className="admin-empty">이 기간에는 아직 플레이 기록이 없어요.</p>}</section>
          <section className="admin-panel"><h2>어디에서 시간을 보낼까?</h2><p className="admin-muted">화면이 보이고 활성화된 시간</p><div className="admin-time-total">{duration(Number(s.mainSeconds)+Number(s.puzzleSeconds))}</div>{[['mainSeconds','똥 키우기'],['puzzleSeconds','퍼즐 게임']].map(([key,label])=><div className="admin-time-row" key={key}><span>{label}</span><b>{duration(s[key])}</b><progress value={s[key]||0} max={Math.max(1,Number(s.mainSeconds)+Number(s.puzzleSeconds))} aria-label={label+' 이용 시간 비율'}/></div>)}<p className="admin-note">기존 기록 {duration(s.legacySeconds)}은 화면별 구분이 없어 위 비율에서 제외했어요.</p></section></div>
          <div className="admin-overview-grid"><section className="admin-panel"><h2>플레이어가 한 행동</h2><p className="admin-muted">기간 내 누적 · 퍼즐 보상·제작·토큰은 로그인 계정만 집계</p><div className="admin-event-grid">{eventLabels.map(([key,label])=><div key={key}><span>{label}</span><b>{metricValue(data.filters.provider,key,s[key])}</b></div>)}</div><div className="admin-token-flow">똥토큰 사용 <b>{metricValue(data.filters.provider,'tokensSpent',s.tokensSpent)}</b><span> / </span>획득 <b>{metricValue(data.filters.provider,'tokensReceived',s.tokensReceived)}</b></div></section>
          <section className="admin-panel"><h2>현재 어떤 똥을 키울까?</h2><p className="admin-muted">기간 내 활성 플레이어의 현재 선택 · 진화 전환율과는 달라요</p><div className="admin-stage-list">{data.distribution.length?data.distribution.map(row=><div key={row.stage??0}><span>{names[row.stage??0]||'기록 없음'}</span><progress value={row.users} max={Math.max(1,s.activeUsers)} aria-label={`${names[row.stage??0]} ${row.users}명`}/><b>{row.users}명</b></div>):<p className="admin-empty">성장 기록을 기다리고 있어요.</p>}</div></section></div>
          <section className="admin-panel admin-users"><div className="admin-panel-heading"><div><h2>플레이어 살펴보기 <span>{number(s.totalUsers)}</span></h2><p>기간 내 활동과 현재 성장 상태를 함께 확인하세요.</p></div><button className="admin-secondary" disabled={demo||exporting} onClick={download}>{exporting?'파일 준비 중…':'↓ 전체 조회 결과 CSV'}</button></div>
            <form className="admin-user-filter" onSubmit={event=>{event.preventDefault();load({...draft,page:1});}}><input aria-label="사용자 검색" placeholder="게임 닉네임 또는 사용자 ID 검색" value={draft.search} onChange={event=>setDraft({...draft,search:event.target.value})}/><select aria-label="사용자 정렬" value={draft.sort} onChange={event=>setDraft({...draft,sort:event.target.value})}><option value="lastSeen">최근 활동순</option><option value="clicks">클릭 많은 순</option><option value="playSeconds">오래 플레이한 순</option></select><button className="admin-secondary" disabled={busy}>검색</button></form>
            <div className="admin-table-scroll"><table><thead><tr>{['플레이어','최근 기록','플레이 시간','클릭','현재 똥','화장실','살펴보기'].map(label=><th key={label}>{label}</th>)}</tr></thead><tbody>{data.users.length?data.users.map(user=><tr key={user.id}><td><strong>{user.nickname}</strong><small>{providerLabel(user.provider)} · {user.activeDays}일 활동</small></td><td>{date(user.lastSeen)}</td><td>{duration(user.playSeconds)}</td><td>{number(user.clicks)}</td><td>{names[user.selectedPoopId]}<small>Lv.{number(user.level||1)} · {user.discovered}종 발견</small></td><td>{user.toiletLevel+1}단계</td><td><button onClick={()=>openUser(user)} aria-label={`${user.nickname} 상세 보기`}>상세 →</button></td></tr>):<tr><td colSpan="7" className="admin-empty">조건에 맞는 플레이어가 없어요.</td></tr>}</tbody></table></div>
            <div className="admin-pagination"><span>전체 {number(s.totalUsers)}명 · CSV에는 모든 페이지를 포함해요</span><div><button disabled={data.filters.page<=1||busy} onClick={()=>load({...data.filters,page:data.filters.page-1})}>이전</button><b>{data.filters.page} / {totalPages}</b><button disabled={data.filters.page>=totalPages||busy} onClick={()=>load({...data.filters,page:data.filters.page+1})}>다음</button></div></div>
          </section>
          <details className="admin-definitions"><summary>집계 기준과 기록 시작일</summary><ul><li>카카오·일반 계정과 익명 게스트를 구분해 조회합니다. 게스트의 동일 기기·브라우저 기록은 묶지만, 저장소 삭제나 다른 기기는 별도 사용자로 집계될 수 있습니다.</li><li>게스트 기록 시작: {date(data.guestTrackingStartedAt)}. 이전 클릭·이용 시간은 복원하지 않으며 현재 레벨부터 기록합니다. 게스트 기록은 마지막 활동 후 90일이 지나면 삭제합니다.</li><li>신규 상세 기록 시작: {date(data.trackingStartedAt)}. 이전 클릭과 퍼즐 행동은 소급해서 복원하지 않습니다.</li><li>이용 시간은 화면이 보이고 활성화된 구간을 30초 단위로 전송합니다. 네트워크 실패 기록은 같은 탭에서 재전송하지만, 탭을 완전히 닫으면 마지막 기록이 일부 누락될 수 있습니다.</li><li>같은 탭의 30분 이내 재진입은 같은 접속 세션으로 묶습니다. 재방문은 선택 기간 중 서로 다른 날짜에 2회 이상 활동한 플레이어입니다.</li><li>이전 사용시간 기록은 유지하며 당시 날짜 기준을 따릅니다. 새 기록은 한국 날짜로 집계합니다.</li><li>클릭·성장·꾸미기 행동은 클라이언트 집계입니다. 로그인 계정의 퍼즐 입장·유효 이동·부품·토큰·화장실 제작은 서버에서 확정한 결과입니다. 게스트는 이용 시간·클릭·강화와 기기에서 보고한 성장 정보만 수집하며 퍼즐 보상 등 서버 확정 지표는 수집하지 않습니다. 개발자 지급 토큰은 제외합니다.</li></ul></details>
        </>}
        </div>
      </>}
    </div>
    {(detail||detailBusy||detailError)&&<div className="admin-detail-backdrop" onClick={()=>{detailVersion.current++;setDetail(null);setDetailBusy(false);setDetailError('');}}><section className="admin-detail" ref={detailPanelRef} role="dialog" aria-modal="true" aria-label="플레이어 상세" onClick={event=>event.stopPropagation()}><button className="admin-detail-close" ref={detailCloseRef} aria-label="플레이어 상세 닫기" onClick={()=>{detailVersion.current++;setDetail(null);setDetailBusy(false);setDetailError('');}}>✕</button>{detailBusy?<p role="status">플레이 기록을 불러오고 있어요…</p>:detailError?<p role="alert">{detailError}</p>:<><p className="admin-eyebrow">PLAYER PROFILE</p><h2>{detail.user.nickname}</h2><p className="admin-muted">{providerLabel(detail.user.provider)} · {detail.user.provider==='guest'?'첫 기록':'가입'} {date(detail.user.createdAt)}</p><p className="admin-user-id">{detail.user.id}</p><div className="admin-detail-summary"><div><span>플레이</span><b>{duration(detail.user.playSeconds)}</b></div><div><span>클릭</span><b>{number(detail.user.clicks)}</b></div><div><span>활동 일수</span><b>{detail.user.activeDays}일</b></div></div>{detail.user.provider==='guest'&&<p className="admin-note">익명 기기의 자체 보고 기록입니다. 실제 이름·이메일은 수집하지 않으며 로그인 계정 및 공식 랭킹과 별개입니다.</p>}<h3>현재 성장과 보유 재화</h3><div className="admin-detail-growth"><span>{names[detail.user.selectedPoopId]} · Lv.{number(detail.user.level||1)}</span><span>발견한 똥 {detail.user.discovered}/20</span><span>화장실 {detail.user.toiletLevel+1}단계</span><span>영양분 {number(detail.user.gold)}</span>{detail.user.provider!=='guest'&&<><span>똥토큰 {number(detail.user.tokens)}</span><span>부품 {number(detail.user.parts)}</span></>}</div><h3>기간 내 행동</h3><div className="admin-event-grid">{eventLabels.map(([key,label])=><div key={key}><span>{label}</span><b>{metricValue(detail.user.provider,key,detail.user[key])}</b></div>)}</div><h3>날짜별 플레이 시간</h3><DailyChart daily={detail.daily} metric="playSeconds"/><p className="admin-note">{data.filters.from} — {data.filters.to} · {demo?'예시 데이터':'조회 기간 기준'}</p></>}</section></div>}
  </main>;
}
