import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import EvolutionCelebration from './EvolutionCelebration.jsx';
import pudding from '../assets/PoopImage/pudding-poop.png';
import tteok from '../assets/PoopImage/tteok-poop.png';
import '../index.css';
const sample = { from: { id: 6, name: '푸딩똥', image: pudding }, to: { id: 7, name: '찰떡똥', image: tteok }, before: { clickPower: 1613, dps: 281 }, after: { clickPower: 2097, dps: 366 } };
function Preview() {
  const [show, setShow] = useState(true);
  return <main style={{ padding: 24, color: 'white' }}><h1>진화 연출 미리보기</h1><p>샘플 능력치 · 게임 진행에는 영향이 없어요.</p><button onClick={() => setShow(true)}>진화 연출 다시 보기</button>{show && <EvolutionCelebration evolution={sample} onClose={() => setShow(false)} />}</main>;
}
if (import.meta.env.DEV) createRoot(document.getElementById('root')).render(<Preview />);
