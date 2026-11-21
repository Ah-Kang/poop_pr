// Development-only visual calibration page. Not referenced by the production entry.
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import SeatedPoop from './SeatedPoop.jsx';
import { toilets, poops } from './preview-data.json';

function Preview() {
  const [poopId, setPoopId] = useState(4);
  const [short, setShort] = useState(false);
  const [clicking, setClicking] = useState(false);
  const poop = poops[poopId];
  return <><header><h1>화장실 20단계 배치 점검</h1><p>게임 저장과 재화에 영향을 주지 않는 로컬 미리보기</p>
    <label>캐릭터 <select value={poopId} onChange={e => setPoopId(Number(e.target.value))}>{poops.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
    <label><input type="checkbox" checked={short} onChange={e => setShort(e.target.checked)} /> 짧은 화면 비율 (440×630)</label>
    <label><input type="checkbox" checked={clicking} onChange={e => setClicking(e.target.checked)} /> 눌린 모양 유지</label>
  </header><div className="preview-grid">{toilets.map(toilet => <article key={toilet.id}><h2>{toilet.id + 1}. {toilet.name}</h2>
    <div className="preview-scene" style={{height: short ? 315 : 391, backgroundImage: `url(${toilet.image})`}}>
      <SeatedPoop toiletId={toilet.id} poopId={poopId} name={poop.name} clicking={clicking} onClick={() => setClicking(!clicking)} feedback="14"><img className="seat-poop-image" src={poop.image} alt={poop.name} /></SeatedPoop>
    </div></article>)}</div></>;
}
if (import.meta.env.DEV) createRoot(document.getElementById('preview-root')).render(<Preview />);
