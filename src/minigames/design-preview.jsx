// Development-only design comparison. No account, wallet or gameplay writes.
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import poop from '../assets/PoopImage/healthy-poop.png';
import water from '../assets/PoopImage/water-poop.png';
import gold from '../assets/PoopImage/golden-poop.png';
import paper from '../assets/cleaning-items/toilet-paper.png';
import plunger from '../assets/cleaning-items/plunger.png';
import spray from '../assets/cleaning-items/cleaner-spray.png';
import bathroom from '../assets/toilet-stages/toilet-subway-public.webp';
import './design-preview.css';

const images = [poop, water, gold, paper, plunger, spray];
const types = ['살구', '하늘', '노랑', '분홍', '보라', '연두'];
const board = [0,1,3,2,4,1,5,0,3,5,2,0,1,4,0,3,1,2,0,3,5,0,2,4,4,0,5,1,2,3,1,5,0,3,1,2,4,5,3,0,2,4,5,0,3,1,2,4,5,1,3,4,0,2,5,1,3,0,2,5,1,4,0,3];
const designs = [
  { id: 'a', letter: 'A', name: '메인 그대로', subtitle: '익숙한 색감, 같은 게임의 다음 화면', tag: '추천',
    description: '메인의 청록색 재화판과 크림색 패널을 그대로 연결해요. 퍼즐판에도 진한 테두리와 입체감을 줍니다.', traits: ['메인과 높은 통일감', '선명한 콤보 게이지'] },
  { id: 'b', letter: 'B', name: '퍼즐에 몰입', subtitle: '조용한 배경, 더 또렷한 퍼즐', tag: '몰입형',
    description: '화장실 배경을 어둡게 깔고 정보는 작은 배지에 담아요. 청록색 테두리 안에서 그림과 폭발이 돋보입니다.', traits: ['낮은 배경 대비', '눈에 띄는 폭발 효과'] },
  { id: 'c', letter: 'C', name: '작고 명료하게', subtitle: '정보는 위로, 손가락은 퍼즐로', tag: '컴팩트',
    description: '재화와 콤보를 하나의 크림색 패널에 모아요. 넓은 칸과 간결한 버튼으로 작은 휴대폰에서도 보기 편해요.', traits: ['가장 작은 정보 영역', '큰 퍼즐 칸'] },
];

function Phone({ design, short }) {
  const [burst, setBurst] = useState(false);
  const [selected, setSelected] = useState(null);
  const [hint, setHint] = useState(false);
  const [help, setHelp] = useState(false);
  const combo = burst ? 1 : 6;
  const animate = () => setBurst((value) => !value);
  return <div className={`concept-phone concept-${design.id} ${short ? 'concept-short' : ''}`} style={{ '--bathroom': `url(${bathroom})` }}>
    <div className="concept-screen">
      <header className="game-top"><button aria-label="공방 안내" onClick={() => setHelp(true)}>‹</button><div><small>똥 키우기 · 미니게임</small><h2>변기뚫기 대작전</h2></div><button aria-label="게임 방법" onClick={() => setHelp(true)}>?</button></header>
      <section className="compact-info" aria-label="상단 게임 정보">
        <div className="resource-row"><div><img src={poop} alt=""/><span>똥 토큰 <b>966</b></span></div><div><span className="part-icon">🔩</span><span>공사 부품 <b>{burst ? 14 : 13}</b></span></div><span className="infinite">이동 ∞</span></div>
        <div className="combo-strip"><div className="combo-label"><b>콤보 <strong>{combo}<em>/10</em></strong></b><span>가득 채우면 <b>🔩 +1</b></span></div><div className="combo-track" role="progressbar" aria-label="누적 콤보" aria-valuenow={combo} aria-valuemin={0} aria-valuemax={10}><i style={{width: `${combo * 10}%`}}/>{Array.from({length:9},(_,i)=><span key={i} style={{left:`${(i+1)*10}%`}}/>)}</div></div>
      </section>
      <div className="play-zone">
        <div className="board-wrap">
          <div className="board-caption"><span><i/> {burst ? '콤보 적립 완료' : '같은 그림을 맞춰요'}</span><b>{burst ? 'BEST 5연쇄' : 'BEST 4연쇄'}</b></div>
          <div className={`concept-board ${burst ? 'is-burst' : ''}`} aria-label={`${design.letter} 시안 8행 8열 퍼즐판`}>
            {board.map((type, index) => <button className={`concept-tile tile-${type} ${selected === index ? 'is-selected' : ''} ${hint && [26,27].includes(index) ? 'is-hint' : ''} ${burst && [18,19,20,26,27,28,34,35,36].includes(index) ? 'is-hit' : ''}`} key={index} aria-label={`${Math.floor(index/8)+1}행 ${index%8+1}열 ${types[type]} 그림`} onClick={()=>setSelected(index)}><img className={type < 3 ? 'poop-tile' : ''} src={images[type]} alt=""/></button>)}
            {burst && <div className="concept-explosion"><div className="blast-ring"/><strong>5 COMBO!</strong><span>콤보 +5</span><b>🔩 부품 +1</b><i className="spark s1">✦</i><i className="spark s2">✦</i><i className="spark s3">✧</i></div>}
          </div>
          <div className="board-note">{burst ? '부품 1개 획득 · 남은 콤보 1 저장!' : '밀어서 맞추고, 콤보를 쌓아요'}</div>
        </div>
        {design.id === 'c' && <div className="mascot-note"><img src={water} alt="물똥 캐릭터"/><span>한 번 더 터뜨려볼까?<small>콤보는 다음 입장에도 이어져요</small></span></div>}
      </div>
      <footer className="game-controls"><button className="workshop" onClick={() => setHelp(true)}>🚽 <span>공방</span></button><button className="hint" onClick={() => setHint(!hint)}>💡 <span>힌트</span></button><button className="effect" onClick={animate}>✦ <span>{burst ? '연출 되돌리기' : '콤보 연출 보기'}</span></button></footer>
      {help && <div className="concept-help"><section><h3>디자인 미리보기</h3><p>실제 게임 재화와 저장에는<br/>영향이 없는 UI 시안이에요.</p><p>그림을 눌러 선택하거나<br/>콤보 연출을 확인해 보세요.</p><button onClick={()=>setHelp(false)}>확인</button></section></div>}
    </div>
  </div>;
}
function DesignGallery() {
  const [focus, setFocus] = useState(() => { const view = new URLSearchParams(window.location.search).get('view'); return ['a','b','c'].includes(view) ? view : 'all'; });
  const [short, setShort] = useState(false);
  return <div className="design-gallery">
    <header className="gallery-header"><div><span className="gallery-kicker">POOP PR / UI STUDIES</span><h1>퍼즐 하나에 집중하는 화면</h1><p>같은 8×8 퍼즐, 세 가지 인상. 메인의 색과 입체감을 가져왔어요.</p></div><div className="gallery-options"><span className="preview-badge">선택 전 시안 · 게임에는 미적용</span><label><input type="checkbox" checked={short} onChange={e=>setShort(e.target.checked)}/> 작은 화면으로 보기</label></div></header>
    <nav className="gallery-nav" aria-label="시안 보기">{[['all','세 가지 비교'],...designs.map(d=>[d.id,`${d.letter} · ${d.name}`])].map(([id,label])=><button key={id} aria-pressed={focus===id} onClick={()=>setFocus(id)}>{label}</button>)}<span>샘플 화면 {short ? '375 × 600' : '375 × 700'}</span></nav>
    <main className={`concepts ${focus !== 'all' ? 'single-concept' : ''}`}>{designs.filter(d=>focus==='all'||focus===d.id).map(design=><article className="concept-card" key={design.id}>
      <div className="concept-heading"><span className="concept-letter">{design.letter}</span><div><h2>{design.name}</h2><p>{design.subtitle}</p></div><b>{design.tag}</b></div>
      <Phone design={design} short={short}/>
      <div className="concept-description"><p>{design.description}</p><div>{design.traits.map(trait=><span key={trait}>{trait}</span>)}</div><button onClick={()=>setFocus(focus==='all'?design.id:'all')}>{focus==='all'?'크게 보기 ↗':'← 세 가지 다시 비교'}</button></div>
    </article>)}</main>
    <footer className="gallery-footer">A는 메인과의 통일감, B는 퍼즐의 대비, C는 정보의 간결함을 우선했어요. 마음에 드는 안이나 섞고 싶은 요소를 알려주세요.</footer>
  </div>;
}
if (import.meta.env.DEV) {
  const root = import.meta.hot?.data.root ?? createRoot(document.getElementById('design-root'));
  if (import.meta.hot) import.meta.hot.data.root = root;
  root.render(<DesignGallery/>);
}
