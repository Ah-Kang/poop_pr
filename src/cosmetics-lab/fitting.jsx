import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { characters } from './fitting-data';
import FittingAvatar from './FittingAvatar';
import './fitting.css';

const statusNames = { adjust:'위치·크기 보정', custom:'전용 처리 권장', base:'원본 분리 필요' };
function Fitting() {
  const [costume,setCostume] = useState('royal');
  const [page,setPage] = useState(0);
  const [dark,setDark] = useState(false);
  const [moving,setMoving] = useState(false);
  const [small,setSmall] = useState(false);
  const [selected,setSelected] = useState(null);
  const current = characters.slice(page * 5, page * 5 + 5);
  const renderComparison = character => <div className={`fit-comparison ${small ? 'fit-small' : ''}`}>
    {['original','common','fitted'].map((mode,i) => <div className={`fit-cell ${dark ? 'fit-dark' : ''}`} key={mode}><span className={moving ? 'fit-moving' : ''}><FittingAvatar character={character} costume={costume} mode={mode}/></span><p>{mode === 'fitted' && character.fit.level === 'base' && costume === 'royal' ? '보정 보류 · 원본 유지' : ['원본','일괄 적용','체형별 보정'][i]}</p></div>)}
  </div>;
  return <main className="fitting-lab">
    <header><div><p className="fit-eyebrow">WARDROBE / FIT CHECK</p><h1>모두에게 잘 맞을까?</h1><p className="fit-intro">푸딩똥 포함 20종 · 같은 의상 2종 · 원본과 나란히 비교</p></div><a href="/cosmetics-complete.html">새 완성형 의상 3종 ↗</a></header>
    <section className="fit-summary"><strong>한 벌을 공유해도, 맞추는 작업은 각각.</strong><p>위치·크기 보정안입니다. 귀·팔·꼬리·불꽃·연기와의 겹침은 전용 그림이나 별도 가림 처리가 필요할 수 있어요.</p></section>
    <nav className="fit-toolbar" aria-label="피팅 보기 설정"><div className="fit-outfits"><button aria-pressed={costume==='royal'} onClick={()=>setCostume('royal')}>왕관·망토</button><button aria-pressed={costume==='ribbon'} onClick={()=>setCostume('ribbon')}>리본</button></div><div className="fit-options"><button aria-pressed={dark} onClick={()=>setDark(!dark)}>어두운 배경</button><button aria-pressed={small} onClick={()=>setSmall(!small)}>작게 보기</button><button aria-pressed={moving} onClick={()=>setMoving(!moving)}>움직임</button></div></nav>
    <nav className="fit-pagination" aria-label="캐릭터 묶음">{[0,1,2,3].map(p=><button key={p} aria-pressed={page===p} onClick={()=>setPage(p)}>{p*5+1}–{p*5+5}번</button>)}<span>{page*5+1}–{page*5+5} / {characters.length}</span></nav>
    <section className="fit-list" aria-label="의상 비교 목록">{current.map(character=><article className="fit-row" key={character.id} data-character={character.id}>
      <div className="fit-row-heading"><h2><span>{String(character.id+1).padStart(2,'0')}</span> {character.name}</h2><div><span className={`fit-status ${character.fit.level}`}>{statusNames[character.fit.level]}</span><button onClick={()=>setSelected(character)} aria-label={`${character.name} 크게 보기`}>확대 ↗</button></div></div>
      {renderComparison(character)}<p className="fit-note">{character.fit.note}</p>
    </article>)}</section>
    <section className="fit-decision"><h2>전부 그리기 vs 조합하기</h2><div><article><h3>완성 이미지 540장</h3><p>20종 × 재질 3 × 표정 3 × 의상 3. 원하는 모양을 개별적으로 다듬기 좋지만, 새 의상 하나마다 180장을 추가해야 해요.</p></article><article><h3>공통 부품 + 전용 세트</h3><p>단순 장식은 공유하고, 몸을 감싸거나 특수 효과와 닿는 의상은 전용 그림으로 제작. 중요한 스킨의 완성도와 제작량을 함께 관리해요.</p></article></div></section>
    <footer>검토용 미리보기 · 본 게임, 캐릭터 원본, 저장 데이터는 변경하지 않습니다. 표정·재질의 20종 확장은 이번 범위에 포함하지 않았어요.</footer>
    {selected && <div className="fit-modal" role="dialog" aria-modal="true" aria-label={`${selected.name} 의상 확대`} onClick={()=>setSelected(null)}><div onClick={event=>event.stopPropagation()}><button autoFocus className="fit-close" onClick={()=>setSelected(null)} onKeyDown={event=>{if(event.key==='Escape')setSelected(null);}}>닫기 ×</button><h2>{selected.name}</h2>{renderComparison(selected)}<p className="fit-note">{selected.fit.note}</p></div></div>}
  </main>;
}
const root = import.meta.hot?.data.root ?? createRoot(document.getElementById('root'));
if (import.meta.hot) import.meta.hot.data.root = root;
root.render(<Fitting/>);
