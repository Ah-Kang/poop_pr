// Isolated, development-only mockups. All sample interactions stay in React memory.
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { toilets } from '../data/toilets.js';
import poop from '../assets/PoopImage/healthy-poop.png';
import water from '../assets/PoopImage/water-poop.png';
import plunger from '../assets/cleaning-items/plunger.png';
import paper from '../assets/cleaning-items/toilet-paper.png';
import '../minigames/design-preview.css';
import './design-preview.css';

const concepts = [
  { id:'a',name:'다음 화장실이 주인공',tag:'목표 중심',sub:'만들고 싶은 화장실부터 보여줘요',desc:'다음 화장실을 크게 보고, 부족한 부품은 바로 아래 미니게임 버튼으로 모아요. 무료 토큰도 같은 화면에서 받아요.',traits:['큰 완성 모습','목표 → 플레이'] },
  { id:'b',name:'위에서 아래로 한 번에',tag:'안내 중심',sub:'무엇부터 해야 할지 고민 없이',desc:'토큰 받기 → 퍼즐로 부품 모으기 → 화장실 제작. 세 단계를 한 페이지에 펼쳐 처음 들어와도 흐름을 알 수 있어요.',traits:['순서가 보이는 화면','처음 플레이할 때 편함'] },
  { id:'c',name:'모든 버튼을 한눈에',tag:'추천',sub:'가장 적은 탐색으로 바로 실행',desc:'작은 제작 카드와 큰 바로가기 버튼을 배치해요. 미니게임과 무료 토큰을 한 번에 찾고, 나머지 기능은 아래에 조용히 둡니다.',traits:['간결한 대시보드','즉시 실행'] },
];
function Workshop({id,ready,small}) {
  const [tokens,setTokens]=useState(30),[claimed,setClaimed]=useState(false),[crafted,setCrafted]=useState(false),[notice,setNotice]=useState('');
  const parts=crafted?0:ready?24:13;
  const next=toilets[crafted?5:4];
  const cost=crafted?34:24;
  const claim=()=>{ if(!claimed){setClaimed(true);setTokens(tokens+24);setNotice('무료 토큰 +24 · 시안에서만 반영돼요');} };
  const play=()=>setNotice('이 버튼에서 퍼즐로 바로 이동해요 · 입장 8토큰');
  const craft=()=>{setCrafted(true);setNotice('편의점 화장실 완성! · 시안에서만 반영돼요');};
  const buildButton=<button className="ws-build" disabled={parts<cost} onClick={craft}>{parts>=cost?'🔩 부품 24개로 제작하기':`부품 ${cost-parts}개 더 필요해요`}</button>;
  const progress=<div className="ws-progress"><div><span>🔩 공사 부품</span><b>{parts} <em>/ {cost}</em></b></div><progress aria-label="제작 부품" max={cost} value={parts}/></div>;
  const goal=<section className="ws-goal"><div className="ws-goal-photo"><img src={next.image} alt={next.name}/><span>다음 화장실 · {next.id+1}/20</span></div><div className="ws-goal-copy"><small>다음 업그레이드</small><h3>{next.name}</h3><p>초당 생산량 <s>+{crafted?32:14}</s> <strong>+{next.dpsBonus}</strong></p>{progress}{buildButton}</div></section>;
  const playCard=<button className="ws-play" onClick={play}><div className="ws-mini-art"><img src={poop} alt=""/><img src={paper} alt=""/><img src={plunger} alt=""/></div><span><strong>미니게임으로 부품 모으기</strong><small>입장 8토큰 · 이동 무제한</small></span><b>›</b></button>;
  const freeCard=<button className="ws-free" disabled={claimed} onClick={claim}><span>🎁</span><span><strong>{claimed?'오늘의 토큰 받기 완료':'오늘의 무료 토큰'}</strong><small>{claimed?'내일 다시 받을 수 있어요':'매일 한 번, +24토큰'}</small></span><b>{claimed?'✓':'받기'}</b></button>;
  const extras=<div className="ws-extras"><button disabled><span>📺</span><b>광고 +24</b><small>준비 중</small></button><button disabled><span>💩</span><b>토큰 구매</b><small>준비 중</small></button></div>;
  return <div className={`ws-phone ws-${id} ${small?'ws-small':''}`} style={{'--ws-background':`url(${toilets[crafted?4:3].image})`}}>
    <div className="ws-screen">
      <header className="ws-header"><div><small>나만의 화장실을 완성해요</small><h2>🚽 화장실 공방</h2></div><button aria-label="공방 닫기 시안" onClick={()=>setNotice('여기서 메인 똥 키우기 화면으로 돌아가요')}>×</button></header>
      <div className="ws-wallet"><span><img src={poop} alt=""/> 똥 토큰 <b>{tokens}</b></span><span>🔩 공사 부품 <b>{parts}</b></span></div>
      <div className="ws-content">
        {id==='a'&&<>{goal}{playCard}{freeCard}{extras}</>}
        {id==='b'&&<><div className="ws-flow-caption">토큰 <i>→</i> 부품 <i>→</i> 더 좋은 화장실</div><section className="ws-step"><div className="ws-step-heading"><b>1</b><h3>토큰 챙기기</h3><span>하루 한 번 무료</span></div>{freeCard}</section><section className="ws-step"><div className="ws-step-heading"><b>2</b><h3>퍼즐로 부품 모으기</h3><span>10콤보 = 부품 1개</span></div>{playCard}</section><section className="ws-step"><div className="ws-step-heading"><b>3</b><h3>새 화장실 만들기</h3><span>순서대로 업그레이드</span></div>{goal}</section>{extras}</>}
        {id==='c'&&<>{goal}<div className="ws-action-grid"><button className="ws-main-action" onClick={play}><div className="ws-action-art"><img src={poop} alt=""/><img src={plunger} alt=""/></div><strong>미니게임 시작</strong><span>부품 모으러 가기 →</span><small>입장 8토큰 · 무제한</small></button><button className="ws-daily-action" disabled={claimed} onClick={claim}><span className="ws-gift">🎁</span><strong>{claimed?'받기 완료':'무료 토큰 받기'}</strong><b>{claimed?'✓':'+24'}</b><small>{claimed?'내일 다시 만나요':'매일 한 번 무료'}</small></button></div>{extras}<div className="ws-tip"><img src={water} alt=""/><p>{parts>=cost?'제작할 부품을 다 모았어요!':'콤보를 모으면 화장실이 달라져요!'}<small>퍼즐 10콤보마다 부품 1개</small></p></div></>}
        <div className="ws-collection"><span>나의 화장실 <b>{crafted?5:4} / 20</b></span><div>{toilets.slice(1,5).map(t=><div key={t.id} className={t.id===4&&!crafted?'ws-locked':''}><img src={t.image} alt={t.name}/><span>{t.id===4&&!crafted?'다음':'✓'}</span></div>)}</div></div>
      </div>
      <footer className="ws-footer">📍 {toilets[crafted?4:3].name} <span>· 샘플 화면</span></footer>
      {notice&&<button className="ws-toast" role="status" onClick={()=>setNotice('')} aria-label="시안 안내 닫기">{notice}<b>×</b></button>}
    </div>
  </div>;
}
function Gallery(){
  const [focus,setFocus]=useState(()=>{const v=new URLSearchParams(location.search).get('view');return ['a','b','c'].includes(v)?v:'all';});
  const [ready,setReady]=useState(false),[small,setSmall]=useState(false),[revision,setRevision]=useState(0);
  return <div className="design-gallery ws-gallery"><header className="gallery-header"><div><span className="gallery-kicker">POOP PR / WORKSHOP STUDIES</span><h1>탭 없이, 한 페이지에서</h1><p>제작 · 미니게임 · 토큰 받기를 한눈에. 메인과 같은 크림색 패널과 입체 버튼.</p></div><div className="gallery-options"><span className="preview-badge">선택용 시안 · 실제 게임 재화는 바뀌지 않아요</span><label><input type="checkbox" checked={ready} onChange={e=>{setReady(e.target.checked);setRevision(revision+1);}}/>제작 가능한 상태 보기</label><label><input type="checkbox" checked={small} onChange={e=>setSmall(e.target.checked)}/>작은 화면으로 보기</label></div></header>
    <nav className="gallery-nav" aria-label="시안 보기">{[['all','세 가지 비교'],...concepts.map((d,i)=>[d.id,`${i+1} · ${d.name}`])].map(([id,name])=><button key={id} aria-pressed={focus===id} onClick={()=>setFocus(id)}>{name}</button>)}<span>{small?'375 × 620':'375 × 740'}</span></nav>
    <main className={`concepts ${focus==='all'?'':'single-concept'}`}>{concepts.filter(d=>focus==='all'||focus===d.id).map(d=><article className="concept-card" key={d.id}><div className="concept-heading"><span className="concept-letter">{d.id.toUpperCase()}</span><div><h2>{d.name}</h2><p>{d.sub}</p></div><b>{d.tag}</b></div><Workshop key={revision} id={d.id} ready={ready} small={small}/><div className="concept-description"><p>{d.desc}</p><div>{d.traits.map(t=><span key={t}>{t}</span>)}</div><button onClick={()=>setFocus(focus==='all'?d.id:'all')}>{focus==='all'?'크게 보기 ↗':'← 세 가지 다시 비교'}</button></div></article>)}</main>
    <footer className="gallery-footer">무료 토큰 받기와 제작 완료 모습을 눌러볼 수 있어요. 광고와 구매는 현재 게임과 동일하게 준비 중입니다.</footer>
  </div>;
}
if(import.meta.env.DEV){const root=import.meta.hot?.data.root??createRoot(document.getElementById('workshop-design-root'));if(import.meta.hot)import.meta.hot.data.root=root;root.render(<Gallery/>);}
