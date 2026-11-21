import React, { useEffect, useMemo, useRef, useState } from 'react';
import poop from '../assets/PoopImage/healthy-poop.png';
import water from '../assets/PoopImage/water-poop.png';
import gold from '../assets/PoopImage/golden-poop.png';
import paper from '../assets/cleaning-items/toilet-paper.png';
import plunger from '../assets/cleaning-items/plunger.png';
import spray from '../assets/cleaning-items/cleaner-spray.png';
import { SIZE, adjacent, findMove, swap, frameCombo, bankCombo, COMBO_TARGET } from './match3.js';
import { createComboPuzzle, asComboPuzzle, resolvePuzzleMove } from '../../shared/puzzle.js';
import { DIFFICULTIES, ENTRY_COST, TOILET_COSTS, renovationCost } from '../../shared/economy.js';
import { useEconomy } from '../economy/useEconomy.js';
import { toilets } from '../data/toilets.js';
import './toilet-puzzle.css';

const tiles = [
  { name: '건강한 똥', image: poop, color: 'peach' },
  { name: '물똥', image: water, color: 'blue' },
  { name: '황금똥', image: gold, color: 'yellow' },
  { name: '휴지', image: paper, color: 'pink' },
  { name: '뚫어뽕', image: plunger, color: 'purple' },
  { name: '세정제', image: spray, color: 'mint' },
];
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const count = (value) => new Intl.NumberFormat('ko-KR', { notation: value >= 10000 ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(value);
const toWorkshop = () => window.location.assign('/?workshop=1');

export default function ToiletPuzzle() {
  const [auth, setAuth] = useState({ loading: true, user: null, error: false });
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/me', { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(12000)]) }).then(async (response) => {
      if (!response.ok && response.status !== 401) throw new Error('auth_unavailable');
      const data = await response.json();
      setAuth({ loading: false, user: response.ok ? data.user : null, error: false });
    }).catch((error) => { if (error.name !== 'AbortError') setAuth({ loading: true, user: null, error: true }); });
    return () => controller.abort();
  }, []);
  const economy = useEconomy({ authUser: auth.user, isAuthLoading: auth.loading, isSaveLoaded: true });
  const { state, pending, error } = economy;
  const [difficulty, setDifficulty] = useState('normal');
  const [selected, setSelected] = useState(null);
  const [removed, setRemoved] = useState([]);
  const [animation, setAnimation] = useState(null);
  const [swapMotion, setSwapMotion] = useState(null);
  const [drops, setDrops] = useState([]);
  const [visualCombo, setVisualCombo] = useState(null);
  const [hint, setHint] = useState([]);
  const [visualBoard, setVisualBoard] = useState(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const alive = useRef(true);
  const pointer = useRef(null);
  const ignoreClick = useRef(false);
  const [message, setMessage] = useState('크게 맞추고, 연쇄를 이어 부품을 모아요!');
  const [sheet, setSheet] = useState(null);
  const [retryAction, setRetryAction] = useState(null);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const activeRun = state?.activeRun;
  const active = Boolean(activeRun?.puzzle);
  const preview = useMemo(() => createComboPuzzle(difficulty, 317), [difficulty]);
  const round = active ? asComboPuzzle(activeRun.puzzle) : preview;
  const board = visualBoard || round.board;
  const locked = busy || pending || Boolean(retryAction);
  const nextCost = state ? (TOILET_COSTS[state.toiletLevel + 1] ?? renovationCost(state.renovationLevel)) : 0;
  const partsLeft = Math.max(0, nextCost - (state?.parts || 0));
  const multiplier = DIFFICULTIES.find((tier) => tier.id === round.difficulty)?.multiplier || 1;
  const comboProgress = visualCombo ?? state?.comboProgress ?? 0;
  const toilet = state ? (toilets[state.toiletLevel] || toilets[0]) : null;
  const dailyClaimed = state?.lastDailyClaim >= economy.day;

  const perform = async (action) => {
    const request = { ...action, id: action.id || crypto.randomUUID() };
    const snapshot = await economy.act(request);
    if (!alive.current) return null;
    setRetryAction(snapshot ? null : request);
    if (snapshot && action.type === 'puzzle_exit') toWorkshop();
    return snapshot;
  };
  const start = async () => {
    if (busyRef.current || pending || retryAction || activeRun || !state) return;
    if (state.tokens < ENTRY_COST) { setSheet('tokens'); return; }
    busyRef.current = true; setBusy(true);
    const snapshot = await perform({ type: 'puzzle_start', difficulty });
    if (snapshot) {
      setSelected(null); setHint([]); setVisualBoard(null);
      setMessage('이동 무제한! 콤보 10을 쌓을 때마다 부품을 받아요!');
    }
    busyRef.current = false; setBusy(false);
  };
  const trySwap = async (a, b) => {
    if (busyRef.current || pending || retryAction || !active || !adjacent(a, b)) return;
    busyRef.current = true; setBusy(true); setSelected(null); setHint([]);
    // Prediction is only for animation. The account server resolves the same move itself.
    const predicted = resolvePuzzleMove(round, a, b);
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setVisualBoard(round.board);
    if (!reducedMotion) {
      setSwapMotion({ a, b });
      await pause(180);
    }
    setSwapMotion(null);
    setVisualBoard(swap(round.board, a, b));
    if (!predicted) {
      setMessage('같은 그림 3개, 사각형 또는 ㄱ·ㄴ 모양으로 맞춰봐요.');
      if (!reducedMotion) { setSwapMotion({ a, b }); await pause(180); }
    } else {
      let comboCarry = state.comboProgress ?? 0;
      setVisualCombo(comboCarry);
      const snapshot = await perform({ type: 'puzzle_move', runId: activeRun.id, turn: round.turn, a, b });
      if (snapshot && alive.current) {
        if (!reducedMotion) for (let index = 0; index < predicted.frames.length; index++) {
          if (!alive.current) break;
          const frame = predicted.frames[index];
          const combo = frameCombo(frame, index + 1) * multiplier;
          const reward = bankCombo(comboCarry, combo);
          comboCarry = reward.progress;
          const parts = reward.parts;
          setVisualCombo(comboCarry);
          setVisualBoard(frame.board); setRemoved(frame.removed);
          setAnimation({ frame, chain: index + 1, parts, combo, key: `${round.turn}-${index}` });
          setMessage(`${index + 1}연쇄 · 콤보 +${combo}${parts ? ` · 부품 +${parts}` : ''}!`);
          await pause(380);
          setRemoved([]); setAnimation(null);
          setVisualBoard(frame.nextBoard); setDrops(frame.drops);
          await pause(280);
          setDrops([]);
        }
        const earned = snapshot.state.activeRun?.puzzle?.partsEarned - round.partsEarned;
        setMessage(`콤보 +${predicted.comboGained} 적립! ${earned > 0 ? `🔩 부품 +${earned}개 받았어요!` : `부품까지 ${COMBO_TARGET - (snapshot.state.comboProgress ?? 0)}콤보 남았어요.`}${predicted.shuffled ? ' 판을 새로 섞었어요.' : ''}`);
      }
    }
    if (alive.current) {
      setVisualBoard(null); setRemoved([]); setAnimation(null); setSwapMotion(null); setDrops([]); setVisualCombo(null); setBusy(false);
    }
    busyRef.current = false;
  };
  const choose = (index) => {
    if (ignoreClick.current) { ignoreClick.current = false; return; }
    if (!active || locked) return;
    if (selected === index) setSelected(null);
    else if (selected !== null && adjacent(selected, index)) trySwap(selected, index);
    else { setSelected(index); setHint([]); }
  };
  const swipe = (event, index) => {
    const from = pointer.current; pointer.current = null;
    if (!from || from.index !== index) return;
    const dx = event.clientX - from.x, dy = event.clientY - from.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return;
    ignoreClick.current = true;
    const to = index + (Math.abs(dx) > Math.abs(dy) ? Math.sign(dx) : Math.sign(dy) * SIZE);
    if (adjacent(index, to)) trySwap(index, to);
  };


  return <main className="tp-page" style={toilet ? { '--puzzle-background': `url(${toilet.image})` } : undefined} data-toilet-level={state?.toiletLevel}>
    <div className="tp-shell" inert={sheet ? true : undefined}>
      <header className="tp-header">
        <button className="tp-icon-button" disabled={locked} onClick={() => active ? setSheet('exit') : toWorkshop()} aria-label="화장실 공방으로 돌아가기">‹</button>
        <div className="tp-title"><h1>변기뚫기 대작전</h1></div>
        <button className="tp-icon-button" onClick={() => setSheet('help')} aria-label="게임 방법">?</button>
      </header>
      <section className="tp-compact-info" aria-label="재화와 누적 콤보">
        <div className="tp-wallet">
          <button disabled={!state} onClick={() => setSheet('tokens')} aria-label={`똥 토큰 ${state?.tokens ?? 0}개, 충전 안내`}><img src={poop} alt="" /><span>똥 토큰 <strong>{state ? count(state.tokens) : '—'}</strong></span><b>＋</b></button>
          <div aria-label={`공사 부품 ${state?.parts ?? 0}개`}><span aria-hidden="true">🔩</span><span>공사 부품 <strong>{state ? count(state.parts) : '—'}</strong></span></div>
          <span className="tp-infinite">이동 ∞</span>
        </div>
        <div className="tp-combo-meter" aria-label="부품 교환 콤보">
          <div><strong>콤보 <b>{comboProgress}<em>/{COMBO_TARGET}</em></b></strong><span>가득 채우면 <b>🔩 +1</b></span></div>
          <progress value={comboProgress} max={COMBO_TARGET} aria-label="누적 콤보" />
          <div className="tp-combo-track" aria-hidden="true"><i style={{ width: `${comboProgress / COMBO_TARGET * 100}%` }} />{Array.from({ length: COMBO_TARGET - 1 }, (_, i) => <span key={i} style={{ left: `${(i + 1) / COMBO_TARGET * 100}%` }} />)}</div>
        </div>
      </section>
      {(auth.error || error) && <div className="tp-storage-error" role="alert">{auth.error ? '로그인 상태를 확인하지 못했어요. 연결 후 다시 확인해주세요.' : error}
        {retryAction && <button disabled={pending || busy} onClick={() => perform(retryAction)}>같은 요청 다시 시도</button>}
        <button onClick={() => window.location.reload()}>저장 상태 다시 확인</button>
      </div>}
      {!state ? <div className="tp-loading" role="status">퍼즐과 지갑을 불러오는 중이에요…</div> : <>
        {activeRun && !active && <div className="tp-storage-error">진행 중인 개발용 도전을 먼저 종료해주세요.<button disabled={locked} onClick={() => perform({ type: 'abandon_run', runId: activeRun.id })}>개발용 도전 종료 · 환불/보상 없음</button></div>}
        <div className="tp-play-area">
        <section className="tp-puzzle" aria-label="그림 맞추기 퍼즐">
          <div className="tp-board-toolbar"><span><i />{active ? `이번 입장 🔩 +${round.partsEarned}` : '같은 그림을 맞춰요'}</span><b>BEST {round.bestChain}연쇄</b></div>
          <div className={`tp-board ${animation?.frame.effects.length ? 'tp-impact' : ''}`} aria-label="8행 8열 퍼즐판" aria-busy={busy}>
            {board.map((type, index) => <button key={index} type="button"
              className={`tp-tile tp-${tiles[type].color} ${drops[index] ? 'tp-falling' : ''} ${selected === index ? 'tp-selected' : ''} ${removed.includes(index) ? 'tp-clearing' : ''} ${hint.includes(index) ? 'tp-hint' : ''}`}
              aria-label={`${Math.floor(index / SIZE) + 1}행 ${index % SIZE + 1}열 ${tiles[type].name}`}
              style={{ '--drop': drops[index] || 0,
                ...(swapMotion && (index === swapMotion.a || index === swapMotion.b) ? {
                  transform: `translate(calc(${(index === swapMotion.a ? swapMotion.b % SIZE - swapMotion.a % SIZE : swapMotion.a % SIZE - swapMotion.b % SIZE)} * (100% + var(--tile-gap))), calc(${(index === swapMotion.a ? Math.floor(swapMotion.b / SIZE) - Math.floor(swapMotion.a / SIZE) : Math.floor(swapMotion.a / SIZE) - Math.floor(swapMotion.b / SIZE))} * (100% + var(--tile-gap))))`, zIndex: 2 } : {}) }}
              aria-pressed={selected === index} disabled={!active || locked}
              onClick={() => choose(index)}
              onPointerDown={(event) => { ignoreClick.current = false; pointer.current = { x: event.clientX, y: event.clientY, index }; event.currentTarget.setPointerCapture(event.pointerId); }}
              onPointerUp={(event) => swipe(event, index)} onPointerCancel={() => { pointer.current = null; }}>
              <img className={type < 3 ? 'tp-poop-image' : undefined} src={tiles[type].image} alt="" draggable="false" />
            </button>)}
            {animation && <div className="tp-burst-layer" key={animation.key} aria-hidden="true">
              {animation.frame.removed.map((cell) => <span key={cell} className="tp-burst-cell" style={{ gridRow: Math.floor(cell / SIZE) + 1, gridColumn: cell % SIZE + 1 }}><i /><b>✦</b></span>)}
              {animation.frame.effects.map((effect, i) => <span className={`tp-shockwave tp-shockwave-${effect.kind}`} key={`effect-${i}`} style={{ gridRow: Math.floor(effect.center / SIZE) + 1, gridColumn: effect.center % SIZE + 1 }} />)}
              <div className="tp-combo-pop"><strong>{animation.chain > 1 ? `${animation.chain}연쇄!` : animation.frame.effects.length ? 'BOOM!' : 'POP!'}</strong>
                {animation.frame.effects.length > 0 && <span>{({ color: '같은 그림 싹쓸이', line: '한 줄 폭발', elbow: 'ㄱ·ㄴ 폭발', square2: '사각 폭발', square3: '대형 사각 폭발' })[animation.frame.effects.reduce((best, effect) => effect.comboBonus > best.comboBonus ? effect : best).kind]}</span>}
                <span className="tp-combo-gain">콤보 +{animation.combo}</span>
                {animation.parts > 0 && <b>🔩 +{animation.parts}</b>}
              </div>
            </div>}
            {!active && <div className="tp-start-cover"><span className="tp-start-icon">💥</span><h2>끝없이 터뜨려요!</h2><p>입장 한 번으로 이동 무제한.<br />콤보 10을 쌓을 때마다 부품 1개!</p>
              <label className="tp-difficulty">콤보 적립 등급<select value={difficulty} disabled={locked} onChange={(event) => setDifficulty(event.target.value)}>{DIFFICULTIES.map((tier) => <option key={tier.id} value={tier.id} disabled={state.toiletLevel < tier.requiredToilet}>{tier.name} · ×{tier.multiplier}{state.toiletLevel < tier.requiredToilet ? ` (화장실 ${tier.requiredToilet + 1}단계)` : ''}</option>)}</select></label><button className="tp-primary" disabled={locked || Boolean(activeRun)} onClick={start}>입장하기 <span>💩 −8</span></button><small>공방으로 나가면 종료 · 재입장 8토큰</small></div>}

          </div>
          <div className="tp-feedback" role="status">{busy && pending ? '이동을 저장하는 중…' : message}</div>
        </section>
        </div>
        <div className="tp-mascot-note"><img src={water} alt="" /><span>{partsLeft ? `다음 ${state.toiletLevel < 19 ? '화장실' : '개조'}까지 부품 ${count(partsLeft)}개!` : '화장실을 만들 부품이 모였어요!'}<small>콤보는 다음 입장에도 이어져요</small></span></div>
        <footer className="tp-controls">
          <button className="tp-control-workshop" disabled={locked} onClick={() => active ? setSheet('exit') : toWorkshop()}>🚽 공방</button>
          <button className="tp-control-hint" disabled={!active || locked} onClick={() => { setSelected(null); setHint(findMove(round.board) || []); setMessage('반짝이는 두 그림을 바꿔보세요!'); }}>💡 힌트</button>
          <button className="tp-control-records" onClick={() => setSheet('records')}>🏆 기록</button>
        </footer>

      </>}
    </div>
    {sheet && <div className="tp-overlay"><section className="tp-sheet" role="dialog" aria-modal="true" aria-labelledby="tp-sheet-title" onKeyDown={(event) => { if (event.key === 'Escape') setSheet(null); }}>
      {error && <div role="alert"><p>{error}</p>{retryAction && <button className="tp-secondary" disabled={pending || busy} onClick={() => perform(retryAction)}>같은 요청 다시 시도</button>}<button className="tp-text-button" onClick={() => window.location.reload()}>저장 상태 다시 확인</button></div>}
      {sheet === 'tokens' ? <><span className="tp-sheet-icon">💩</span><h2 id="tp-sheet-title">도전할 힘을 채워요</h2><p>보유 토큰 <strong>{state?.tokens ?? '—'}개</strong><br />24토큰이면 세 번 더 입장할 수 있어요.</p><button className="tp-primary" disabled={!state || locked || dailyClaimed} onClick={async () => { if (await perform({ type: 'claim_daily' })) setSheet(null); }}>{dailyClaimed ? '오늘의 무료 토큰 받기 완료' : '오늘의 무료 토큰 +24개'}</button><p className="tp-fine">한국 시간 자정에 다시 받을 수 있어요.</p><button className="tp-secondary" disabled>광고 보고 +24개 · 준비 중</button><button className="tp-text-button" disabled>토큰 구매 · 준비 중</button></>
        : sheet === 'records' ? <><span className="tp-sheet-icon">🏆</span><h2 id="tp-sheet-title">나의 퍼즐 기록</h2><dl className="tp-records"><div><dt>이번 입장 부품</dt><dd>🔩 {round.partsEarned}개</dd></div><div><dt>누적 콤보</dt><dd>{state?.comboProgress ?? 0} / {COMBO_TARGET}</dd></div><div><dt>최고 연쇄</dt><dd>{round.bestChain}연쇄</dd></div><div><dt>현재 점수</dt><dd>{round.score.toLocaleString()}점</dd></div><div><dt>내 최고 점수</dt><dd>{state?.bestScore.toLocaleString()}점</dd></div><div><dt>교환 횟수</dt><dd>{round.turn}회</dd></div></dl><p className="tp-fine">📍 {toilet?.name}<br />{economy.isGuest ? '게스트 진행은 이 브라우저에 저장돼요.' : '진행은 계정에 저장돼요.'}</p></>
        : sheet === 'help' ? <><span className="tp-sheet-icon">💥</span><h2 id="tp-sheet-title">콤보로 부품 모으기</h2><ol>
          <li>입장 8토큰, 이동은 무제한! 공방으로 나가면 종료돼요. 새로고침·연결 끊김은 무료 이어하기예요.</li>
          <li>같은 그림을 가로나 세로로 3개 맞추면 콤보 +1! 안 맞는 교환은 원래대로 돌아와요.</li>
          <li>4개 연결: 한 줄 전체 폭발 (콤보 +2). 5개 이상: 같은 그림 전체 폭발 (콤보 +4).</li>
          <li>2×2 사각형: 주변 한 겹까지 폭발 (콤보 +3). 3×3 사각형: 주변 한 겹까지 더 크게 폭발 (콤보 +6).</li>
          <li>ㄱ·ㄴ 모양: 각 팔 3칸, 총 5개 이상! 네 방향 모두 인식하고 모서리 주변 3×3을 폭발시켜요 (콤보 +3).</li>
          <li>2연쇄는 콤보 +1, 3연쇄 +2, 4연쇄 이상 +3을 추가해요. 같은 폭발에서는 가장 큰 모양 기준으로 적립하고, 적립 등급 배수도 적용돼요.</li>
          <li>누적 10콤보마다 부품 1개로 자동 교환해요. 남은 콤보는 실패한 교환·새로고침·퇴장에도 유지돼요. 콤보와 부품은 이동마다 저장해요.</li></ol></>
        : <><h2 id="tp-sheet-title">공방으로 돌아갈까요?</h2><p>이번 입장에서 모은 부품 <strong>{round.partsEarned}개</strong>는<br />이미 저장돼 있어요.<br />남은 콤보 {state?.comboProgress ?? 0}도 다음 입장에 이어져요.<br />나가면 종료되며 다음 입장은 8토큰이에요.</p><button className="tp-primary" disabled={locked} onClick={() => perform({ type: 'puzzle_exit', runId: activeRun.id })}>종료하고 공방으로</button></>}

      <button autoFocus className="tp-text-button" onClick={() => setSheet(null)}>{sheet === 'exit' ? '계속하기' : '닫기'}</button>
    </section></div>}
  </main>;
}
