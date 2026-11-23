import React, { useEffect, useState } from 'react';
import { materials, expressions, outfits } from '../../shared/cosmetics.js';
import { getSkin } from './skins.js';
import VisibleSkin from './VisibleSkin.jsx';
import './skins.css';

const categories = [
  { id: 'material', label: '색상·재질', options: materials },
  { id: 'expression', label: '표정', options: expressions },
  { id: 'outfit', label: '의상', options: outfits },
];
const sameStyle = (a, b) => categories.every(({ id }) => a[id] === b[id]);
const destinationLabel = { growth: '똥 키우러 가기', puzzle: '퍼즐 하러 가기', workshop: '화장실 공방 가기', visit: '내일 또 만나요' };

export default function SkinPicker({ poop, cosmetics, rewards, ready, onEquip, onGoal }) {
  const [category, setCategory] = useState('material');
  const [draft, setDraft] = useState(cosmetics);
  const [notice, setNotice] = useState('');
  const [equipping, setEquipping] = useState(false);
  useEffect(() => { setDraft(cosmetics); }, [cosmetics.material, cosmetics.expression, cosmetics.outfit]);
  const selectedCategory = categories.find(item => item.id === category);
  const preview = getSkin(poop.id, draft);
  const selectedReward = rewards.find(reward => reward.category === category && reward.value === draft[category]);
  const locked = rewards.filter(reward => !reward.unlocked && draft[reward.category] === reward.value);
  const blocking = locked.find(reward => reward.category === category) || locked[0];
  const nextReward = rewards.filter(reward => !reward.unlocked).sort((a, b) => b.progress / b.target - a.progress / a.target)[0];
  const detail = blocking || selectedReward || nextReward;
  const isWorn = sameStyle(draft, cosmetics);
  const earned = rewards.filter(reward => reward.unlocked).length;
  return <section className="skin-picker" aria-label={`${poop.name}의 옷장`}>
    <div className="skin-collection-line"><strong>{poop.name}의 옷장</strong><span>꾸미기 수집 {earned}/6</span></div>
    <div className="skin-preview">
      <span className={`skin-preview-badge ${locked.length ? 'locked' : ''}`}>{!ready ? '기록 확인 중' : locked.length ? '잠긴 스타일 · 미리보기' : isWorn ? '✓ 현재 착용 중' : '입어보는 중'}</span>
      <img src={preview.image} alt={`${poop.name} 꾸미기 미리보기`} decoding="async" />
      <p>{categories.map(({ id, options }) => options.find(([value]) => value === draft[id])[1]).join(' · ')}</p>
      {!isWorn && <button className="skin-preview-reset" onClick={() => { setDraft(cosmetics); setNotice(''); }} aria-label="현재 착용한 모습으로 되돌리기">↶</button>}
    </div>
    <div className="skin-picker-scroll">
      <div className="skin-categories" role="tablist" aria-label="꾸미기 종류">
        {categories.map(item => <button key={item.id} id={`skin-tab-${item.id}`} role="tab" aria-selected={item.id === category} aria-controls="skin-options" tabIndex={item.id === category ? 0 : -1} onClick={() => setCategory(item.id)} onKeyDown={event => {
          if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
          event.preventDefault();
          const index = categories.findIndex(option => option.id === category);
          const next = event.key === 'Home' ? 0 : event.key === 'End' ? 2 : (index + (event.key === 'ArrowRight' ? 1 : 2)) % 3;
          setCategory(categories[next].id);
          document.getElementById(`skin-tab-${categories[next].id}`)?.focus();
        }}>{item.label}</button>)}
      </div>
      <div id="skin-options" role="tabpanel" aria-labelledby={`skin-tab-${category}`} className="skin-options">
        {selectedCategory.options.map(([value, name]) => {
          const reward = rewards.find(item => item.category === category && item.value === value);
          const unlocked = !reward || reward.unlocked;
          const skin = getSkin(poop.id, { ...draft, [category]: value });
          return <button type="button" disabled={equipping} key={`${category}/${value}`} className={`skin-option ${draft[category] === value ? 'selected' : ''}`} aria-pressed={draft[category] === value} aria-label={`${name}${unlocked ? ' 선택' : ` 미리보기, ${reward.goal}, ${reward.progress}/${reward.target}`}`} onClick={() => { setDraft(previous => ({ ...previous, [category]: value })); setNotice(''); }}>
            <VisibleSkin key={skin.key} src={skin.thumb} alt="" className="skin-option-image" />
            <strong>{name}</strong><span>{!ready ? '확인 중' : !unlocked ? `🔒 ${reward.progress}/${reward.target}` : cosmetics[category] === value ? '착용 중' : '보유 중'}</span>
          </button>;
        })}
      </div>
      {detail ? <div className={`skin-mission ${detail.unlocked ? 'complete' : ''}`} aria-live="polite">
        <div><span>{detail.unlocked ? '✓ 해금 완료' : '🔒 해금 미션'}</span><strong>{detail.name}</strong><b>{detail.progress}/{detail.target}</b></div>
        <p>{detail.goal}{detail.destination === 'visit' ? ' · 연속 방문이 아니어도 괜찮아요' : ''}</p>
        <progress aria-label={`${detail.name} 해금 진행률`} value={detail.progress} max={detail.target} />
      </div> : <div className="skin-mission complete"><strong>✨ 모든 꾸미기를 모았어요!</strong><p>새로운 똥으로 진화해도 계속 입을 수 있어요.</p></div>}
      {nextReward && nextReward !== detail && <button className="skin-next-reward" onClick={() => {
        setCategory(nextReward.category);
        setDraft(previous => ({ ...previous, [nextReward.category]: nextReward.value }));
        setNotice('');
      }}>다음 수집 목표 · {nextReward.name} <span>{nextReward.progress}/{nextReward.target} →</span></button>}
    </div>
    <div className="skin-actions">
      <p role="status">{notice || (blocking ? '미리보기는 자유롭게, 조건을 달성하면 내 옷으로!' : '한 번 해금하면 모든 똥에게 입힐 수 있어요.')}</p>
      <button className="skin-equip" disabled={equipping || !ready || (blocking ? blocking.destination === 'visit' : isWorn)} onClick={async () => {
        if (blocking) { onGoal(blocking.destination); return; }
        setEquipping(true);
        try {
          const saved = await onEquip({ ...draft, hat: 'none' });
          setNotice(saved ? '✓ 입혔어요! 진화해도 선택한 스타일이 이어져요.' : '저장하지 못했어요. 연결을 확인하고 다시 시도해주세요.');
        } finally { setEquipping(false); }
      }}>{equipping ? '옷장에 저장하는 중…' : !ready ? '기록을 불러오는 중…' : blocking ? destinationLabel[blocking.destination] : isWorn ? '✓ 착용 중' : '이 모습으로 입히기'}</button>
    </div>
  </section>;
}
