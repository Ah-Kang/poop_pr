import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import PoopPortrait from './PoopPortrait.jsx';

export default function EvolutionCelebration({ evolution, onClose }) {
  const dialog = useRef(null);
  useEffect(() => {
    const previousFocus = document.activeElement;
    dialog.current.showModal();
    return () => { if (previousFocus?.isConnected) previousFocus.focus(); };
  }, []);
  const { from, to, before, after } = evolution;
  const number = value => value.toLocaleString('ko-KR');
  return createPortal(<dialog ref={dialog} className="evolution-dialog" aria-labelledby="evolution-title" onCancel={event => { event.preventDefault(); onClose(); }}>
    <div className="evolution-card">
      <p className="evolution-eyebrow">새로운 힘을 깨웠어요!</p>
      <h2 id="evolution-title">진화 성공!</h2>
      <div className="evolution-stage" aria-hidden="true">
        <div className="evolution-rays" />
        <div className="evolution-ring" />
        <div className="evolution-ring evolution-ring-late" />
        {Array.from({ length: 12 }, (_, i) => <span className="evolution-spark" key={i} style={{ '--angle': `${i * 30}deg`, '--distance': `${95 + i % 3 * 18}px` }}>✦</span>)}
        <div className="evolution-old"><PoopPortrait poop={from} /></div>
        <div className="evolution-new"><PoopPortrait poop={to} /></div>
      </div>
      <div className="evolution-result">
        <p className="evolution-path">{from.name} →</p>
        <h3>{to.name} <span>Lv.{evolution.level ?? to.unlockLevel}</span></h3>
        <p className="evolution-badge">진화 보너스 +25% · 누적 레벨 유지!</p>
        <div className="evolution-stats">
          <div><span>기본 클릭</span><p>{number(before.clickPower)} → <strong>{number(after.clickPower)}</strong></p><small>+{number(after.clickPower - before.clickPower)}</small></div>
          <div><span>자동 생산 /초</span><p>{number(before.dps)} → <strong>{number(after.dps)}</strong></p><small>+{number(after.dps - before.dps)}</small></div>
        </div>
      </div>
      <button type="button" className="evolution-continue" onClick={onClose}>더 강해진 똥 키우기 ✨</button>
    </div>
  </dialog>, document.body);
}
