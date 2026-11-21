import React, { useState } from 'react';
import { AD_TOKENS, DAILY_AD_LIMIT, DAILY_TOKENS, DEV_TOKEN_GRANT, DIFFICULTIES, ENTRY_COST, TOILET_COSTS, renovationCost } from '../../shared/economy.js';
import { DEMO_ECONOMY } from './client.js';
import poop from '../assets/PoopImage/healthy-poop.png';
import water from '../assets/PoopImage/water-poop.png';
import plunger from '../assets/cleaning-items/plunger.png';
import './economy.css';

const count = (value) => Number(value || 0).toLocaleString('ko-KR');
export function EconomyBar({ economy, onOpen }) {
  return <button type="button" className="economy-bar" onClick={onOpen} aria-label="토큰과 부품 공방 열기">
    <span>💩 똥 토큰 <strong>{economy.state ? count(economy.state.tokens) : '—'}</strong></span>
    <span>🔩 부품 <strong>{economy.state ? count(economy.state.parts) : '—'}</strong></span>
    <span className="economy-bar-arrow">공방 ›</span>
  </button>;
}

export default function EconomyPanel({ economy, toilets, onClose, onLogin }) {
  const [difficulty, setDifficulty] = useState('normal');
  const [notice, setNotice] = useState('');
  const { state, pending, error, act, capabilities = {} } = economy;
  const current = state ? toilets[state.toiletLevel] : null;
  const next = state ? toilets[state.toiletLevel + 1] : null;
  const requiredParts = next ? TOILET_COSTS[next.id] : 0;
  const claimedDaily = Boolean(state?.lastDailyClaim && state.lastDailyClaim >= economy.day);
  const adsUsed = state && state.adDay === economy.day ? state.adClaims : 0;
  const previewStart = Math.max(0, Math.min((state?.toiletLevel || 0) - 2, toilets.length - 4));
  const craft = async () => {
    if (next && await act({ type: 'craft_toilet', toiletLevel: next.id })) setNotice(`${next.name} 완성! 배경과 생산량이 업그레이드됐어요.`);
  };
  const daily = async () => {
    if (await act({ type: 'claim_daily' })) setNotice(`오늘의 무료 토큰 ${DAILY_TOKENS}개를 받았어요!`);
  };
  return <div className="economy-overlay" onClick={onClose}>
    <section className="economy-panel" role="dialog" aria-modal="true" aria-label="화장실 공방" aria-busy={pending} style={current ? { '--workshop-background': `url(${current.image})` } : undefined} onClick={(event) => event.stopPropagation()}>
      <header className="economy-heading">
        <div><p>나만의 화장실을 완성해요</p><h2>🚽 화장실 공방</h2></div>
        <button type="button" onClick={onClose} aria-label="화장실 공방 닫기">×</button>
      </header>
      <div className="economy-wallet"><span><img src={poop} alt="" /> 똥 토큰 <b>{state ? count(state.tokens) : '—'}</b></span><span>🔩 공사 부품 <b>{state ? count(state.parts) : '—'}</b></span></div>
      <div className="economy-content">
        {notice && <p className="economy-reward" role="status">{notice}<button onClick={() => setNotice('')} aria-label="알림 닫기">×</button></p>}
        {error && <div className="economy-error" role="alert">{error}<button type="button" onClick={economy.refresh} disabled={pending}>다시 확인</button></div>}
        {!state && !error && <p className="economy-loading" role="status">공방 정보를 불러오는 중이에요…</p>}
        {state && <>
          {next ? <article className="economy-blueprint">
            <div className="economy-scene"><img src={next.image} alt={next.name} /><span>다음 화장실 · {next.id + 1}/{toilets.length}</span></div>
            <div className="economy-blueprint-body">
              <p className="economy-eyebrow">다음 업그레이드</p><h3>{next.name}</h3>
              <p className="economy-production">초당 생산량 <s>+{count(current.dpsBonus)}</s> <strong>+{count(next.dpsBonus)}</strong></p>
              <div className="economy-progress-label"><span>🔩 공사 부품</span><b>{count(state.parts)} <em>/ {count(requiredParts)}</em></b></div>
              <progress value={Math.min(state.parts, requiredParts)} max={requiredParts} aria-label="화장실 제작 부품 수집" />
              <button className="economy-primary" disabled={pending || state.parts < requiredParts} onClick={craft}>
                {pending ? '처리 중…' : state.parts >= requiredParts ? `🔩 부품 ${count(requiredParts)}개로 제작` : `부품 ${count(requiredParts - state.parts)}개 더 필요해요`}
              </button>
            </div>
          </article> : <article className="economy-finale">
            <span>👑</span><h3>완성 다음은, 나만의 개조</h3><p>개조할 때마다 화장실 기본 생산량 +5%</p>
            <b>개조 Lv.{count(state.renovationLevel)} · 생산량 +{count(state.renovationLevel * 5)}%</b>
            <button className="economy-primary" disabled={pending || state.parts < renovationCost(state.renovationLevel)} onClick={async () => {
              if (await act({ type: 'renovate' })) setNotice('화장실 개조 완료! 생산량이 늘었어요.');
            }}>🔩 {count(renovationCost(state.renovationLevel))}개로 추가 개조</button>
          </article>}
          <div className="economy-actions">
            <button className="economy-play" disabled={pending || !capabilities.minigame} onClick={() => window.location.assign('/minigame')}>
              <span className="economy-play-art"><img src={poop} alt="" /><img src={plunger} alt="" /></span>
              <strong>{state.activeRun?.puzzle ? '미니게임 이어하기' : '미니게임 시작'}</strong><span>부품 모으러 가기 →</span><small>{state.activeRun?.puzzle ? '추가 토큰 없이 이어하기' : `입장 ${ENTRY_COST}토큰 · 이동 무제한`}</small>
            </button>
            <button className="economy-daily" disabled={pending || claimedDaily} onClick={daily}>
              <span className="economy-gift">🎁</span><strong>{claimedDaily ? '받기 완료' : '무료 토큰 받기'}</strong><b>{claimedDaily ? '✓' : `+${DAILY_TOKENS}`}</b><small>{claimedDaily ? '한국 시간 자정에 다시' : '매일 한 번 무료'}</small>
            </button>
          </div>
          <div className="economy-extras">
            <button disabled><span>📺</span><b>광고 +{AD_TOKENS}</b><small>준비 중</small></button>
            <button disabled><span>💩</span><b>토큰 구매</b><small>준비 중</small></button>
          </div>
          <div className="economy-tip"><img src={water} alt="" /><p>{next && state.parts >= requiredParts ? '제작할 부품을 다 모았어요!' : '콤보를 모으면 화장실이 달라져요!'}<small>퍼즐 10콤보마다 부품 1개 · 남은 콤보 {state.comboProgress ?? 0}</small></p></div>
          <div className="economy-collection">
            <div className="economy-collection-heading"><span>나의 화장실</span><b>{state.toiletLevel + 1} / {toilets.length}</b></div>
            <div className="economy-collection-preview">{toilets.slice(previewStart, previewStart + 4).map(toilet => <div key={toilet.id} className={toilet.id > state.toiletLevel ? 'is-locked' : ''}>
              <img src={toilet.image} alt={toilet.name} loading="lazy" /><span>{toilet.id <= state.toiletLevel ? '✓' : '다음'}</span>
            </div>)}</div>
            <details><summary>전체 도감 보기 <span>⌄</span></summary><div className="economy-collection-grid">{toilets.map(toilet => <div key={toilet.id} className={toilet.id > state.toiletLevel ? 'is-locked' : ''}>
              <img src={toilet.image} alt="" loading="lazy" /><span>{toilet.id <= state.toiletLevel ? '✓ 완성' : `🔩 ${count(TOILET_COSTS[toilet.id])}`}</span><b>{toilet.name}</b>
            </div>)}</div></details>
          </div>
          <p className="economy-location">📍 {current.name}</p>
          {DEMO_ECONOMY && capabilities.demo && <details className="economy-demo"><summary>개발자 테스트</summary>
            <p>현재 {economy.isGuest ? '게스트' : '개발 계정'} 지갑 · 로컬 개발 모드 전용</p>
            <button className="economy-secondary" disabled={pending} onClick={async () => {
              if (await act({ type: 'demo_tokens' })) setNotice(`테스트 토큰 ${count(DEV_TOKEN_GRANT)}개를 추가했어요.`);
            }}>테스트 토큰 +{count(DEV_TOKEN_GRANT)}개</button>
            <button className="economy-text" disabled={pending || adsUsed >= DAILY_AD_LIMIT} onClick={() => act({ type: 'demo_ad' })}>개발용 광고 보상 +24 ({adsUsed}/{DAILY_AD_LIMIT})</button>
            {!state.activeRun?.puzzle && <>
              <p>경제 처리 검증용 도전</p>
              {!state.activeRun ? <><label>테스트 난이도<select value={difficulty} onChange={event => setDifficulty(event.target.value)}>{DIFFICULTIES.map(tier => <option key={tier.id} value={tier.id} disabled={state.toiletLevel < tier.requiredToilet}>{tier.name}</option>)}</select></label>
                <button className="economy-secondary" disabled={pending || state.tokens < ENTRY_COST} onClick={() => act({ type: 'start_run', difficulty })}>테스트 입장 · −8토큰</button></> : <>
                <button className="economy-secondary" disabled={pending} onClick={() => act({ type: 'demo_complete', runId: state.activeRun.id, outcome: 'won', stars: 3, score: 100 })}>성공 보상 시험</button>
                <button className="economy-secondary" disabled={pending} onClick={() => act({ type: 'demo_complete', runId: state.activeRun.id, outcome: 'lost', stars: 0, score: 20 })}>실패 보상 시험</button>
                <button className="economy-text" disabled={pending} onClick={() => act({ type: 'abandon_run', runId: state.activeRun.id })}>테스트 중단 · 환불/보상 없음</button>
              </>}
            </>}
          </details>}
          {economy.isGuest && <div className="economy-guest"><span>이 브라우저에 저장 중<br /><small>로그인하면 계정 지갑을 사용해요.<br />체험 재화는 합산되지 않아요.</small></span><button onClick={onLogin}>로그인</button></div>}
        </>}
      </div>
    </section>
  </div>;
}
