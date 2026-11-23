import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import Avatar, { materials, expressions, costumes } from './Avatar';
import room from '../assets/toilet-stages/toilet-subway-public.webp';
import './style.css';

const defaults = { material: 'custard', expression: 'happy', costume: 'none' };
const label = (items, id) => items.find(item => item.id === id)?.name;

function Lab() {
  const [look, setLook] = useState({ material: 'mint', expression: 'wink', costume: 'royal' });
  const [background, setBackground] = useState('light');
  const [moving, setMoving] = useState(false);
  const [original, setOriginal] = useState(false);
  const [small, setSmall] = useState(false);
  const [bounce, setBounce] = useState(0);
  const [showGrid, setShowGrid] = useState(false);
  const choose = (key, value) => { setOriginal(false); setLook(current => ({ ...current, [key]: value })); };
  const selection = `${label(materials, look.material)} · ${label(expressions, look.expression)} · ${label(costumes, look.costume)}`;

  return <main className="lab">
    <header className="lab-header">
      <div><p className="eyebrow">POOP LAB / 01</p><h1>내 푸딩, 내 취향대로.</h1><p className="intro">하나씩 고르고, 함께 입혀봐요.</p></div>
      <a className="back-link" href="/cosmetics-fitting.html">20종 의상 피팅 <span>↗</span></a>
    </header>
    <div className="workspace">
      <section className="preview-panel" aria-label="캐릭터 미리보기">
        <div className="preview-top"><span className="pill">꾸미기 테스트</span><span className="preview-caption">푸딩똥 · Lv.1</span></div>
        <div className={`stage stage-${background} ${small ? 'stage-small' : ''}`} style={{ '--room': `url(${room})` }}>
          <div className="stage-glow"/>
          <button className="avatar-touch" onClick={() => setBounce(n => n + 1)} aria-label="캐릭터 눌러보기">
            <span className={`avatar-idle ${moving ? 'is-moving' : ''}`}>
              <span key={bounce} className={bounce ? 'avatar-bounce' : 'avatar-still'}><Avatar {...look} isOriginal={original}/></span>
            </span>
          </button>
          <div className="stage-floor"/>
          <div className="stage-hint">{original ? '현재 게임의 원본 이미지' : '캐릭터를 눌러보세요'}</div>
        </div>
        <div className="preview-tools">
          <div className="background-options" role="group" aria-label="배경">
            {[['light','밝은 배경'],['dark','어두운 배경'],['game','게임 배경']].map(([id,name]) => <button key={id} className={`background-${id}`} aria-label={name} aria-pressed={background === id} onClick={() => setBackground(id)} title={name}>{background === id ? '✓' : ''}</button>)}
          </div>
          <div className="tool-buttons"><button aria-pressed={small} onClick={() => setSmall(value => !value)}>작게 보기</button><button aria-pressed={moving} onClick={() => setMoving(value => !value)}>움직임</button><button aria-pressed={original} onClick={() => setOriginal(value => !value)}>원본 비교</button></div>
        </div>
        <div className="current-look" aria-live="polite"><span>{original ? '원본' : '지금 조합'}</span><strong>{original ? '기본 푸딩 · 기존 얼굴 · 의상 없음' : selection}</strong></div>
      </section>
      <aside className="controls" aria-label="꾸미기 선택">
        <div className="controls-title"><div><p className="eyebrow">MIX & MATCH</p><h2>어떤 모습이 좋을까?</h2></div><button className="reset" onClick={() => { setLook(defaults); setOriginal(false); }} aria-label="꾸미기 초기화">↺</button></div>
        <fieldset><legend><span>01</span> 재질 <small>색감과 광택</small></legend><div className="choice-row">
          {materials.map(item => <button key={item.id} className="choice" aria-pressed={look.material === item.id} onClick={() => choose('material', item.id)}><Avatar material={item.id}/><span>{item.name}</span></button>)}
        </div></fieldset>
        <fieldset><legend><span>02</span> 표정 <small>오늘의 기분</small></legend><div className="choice-row">
          {expressions.map(item => <button key={item.id} className="choice" aria-pressed={look.expression === item.id} onClick={() => choose('expression', item.id)}><Avatar material={look.material} expression={item.id}/><span>{item.name}</span></button>)}
        </div></fieldset>
        <fieldset><legend><span>03</span> 의상 <small>마지막 한 끗</small></legend><div className="choice-row">
          {costumes.map(item => <button key={item.id} className="choice" aria-pressed={look.costume === item.id} onClick={() => choose('costume', item.id)}><Avatar material={look.material} expression={look.expression} costume={item.id}/><span>{item.name}</span></button>)}
        </div></fieldset>
        <div className="mini-check"><div className="mini-avatar"><Avatar {...look}/></div><div><strong>작아져도 같은 모습</strong><p>목록에서 보이는 크기도 함께 확인해요.</p></div></div>
        <button className="all-combinations" aria-expanded={showGrid} onClick={() => setShowGrid(value => !value)}>{showGrid ? '조합 모아보기 닫기' : '27가지 조합 한눈에 보기'} <span>{showGrid ? '−' : '+'}</span></button>
        <p className="preview-note">미리보기 전용 · 게임 저장 데이터에는 반영되지 않아요.</p>
      </aside>
    </div>
    {showGrid && <section className="combination-gallery" aria-label="27가지 조합"><h2>같은 부품, 27가지 모습.</h2><p>마음에 드는 조합을 누르면 큰 화면에 입혀져요.</p>{materials.map(material => <div className="material-group" key={material.id}><h3>{material.name}</h3><div className="combination-grid">{expressions.flatMap(expression => costumes.map(costume => <button key={`${expression.id}-${costume.id}`} onClick={() => { setOriginal(false); setLook({ material: material.id, expression: expression.id, costume: costume.id }); }} aria-label={`${material.name}, ${expression.name}, ${costume.name}`}><Avatar material={material.id} expression={expression.id} costume={costume.id}/><span>{expression.name} · {costume.name}</span></button>))}</div></div>)}</section>}
    <footer>푸딩똥으로 먼저 맞춰보는 실험이에요. 다른 체형의 똥은 별도로 피팅할 예정입니다.</footer>
  </main>;
}

// Keep one React root when Vite reloads this standalone preview entry.
const root = import.meta.hot?.data.root ?? createRoot(document.getElementById('root'));
if (import.meta.hot) import.meta.hot.data.root = root;
root.render(<Lab/>);
