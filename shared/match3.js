export const SIZE = 8;
export const TYPES = 6;
export const ENTRY_COST = 8;
export const AD_REWARD = 24;
export const MOVE_LIMIT = 18;
export const POINTS_PER_TILE = 10;
export const COMBO_TARGET = 10;
export function bankCombo(progress, gained) {
  const total = progress + gained;
  return { parts: Math.floor(total / COMBO_TARGET), progress: total % COMBO_TARGET };
}

export function turnScore(result) {
  return result.frames.reduce((score, frame, index) =>
    score + frame.removed.length * POINTS_PER_TILE * (index + 1), 0);
}
export function scoreReward(score) { return score >= 1200 ? 5 : score >= 800 ? 4 : 3; }
export function frameCombo(frame, chain) {
  return 1 + Math.max(0, ...frame.effects.map((effect) => effect.comboBonus)) + Math.min(3, chain - 1);
}
export function adjacent(a, b) {
  return Number.isInteger(a) && Number.isInteger(b)
    && a >= 0 && b >= 0 && a < SIZE * SIZE && b < SIZE * SIZE
    && Math.abs(Math.floor(a / SIZE) - Math.floor(b / SIZE)) + Math.abs(a % SIZE - b % SIZE) === 1;
}
export function swap(board, a, b) {
  const copy = [...board];
  [copy[a], copy[b]] = [copy[b], copy[a]];
  return copy;
}

// Detect shapes first. Blast cells never count as additional matched shapes.
export function matchPatterns(board) {
  const patterns = [];
  const add = (cells, kind, comboBonus, axis) => {
    if (board[cells[0]] != null && cells.every((cell) => board[cell] === board[cells[0]]))
      patterns.push({ cells, kind, comboBonus, axis, center: cells[Math.floor(cells.length / 2)], type: board[cells[0]] });
  };
  for (let axis = 0; axis < 2; axis++) for (let line = 0; line < SIZE; line++) {
    const at = (offset) => axis === 0 ? line * SIZE + offset : offset * SIZE + line;
    let start = 0;
    while (start < SIZE) {
      let end = start + 1;
      while (end < SIZE && board[at(end)] === board[at(start)]) end++;
      if (end - start >= 3) add(Array.from({ length: end - start }, (_, i) => at(start + i)),
        end - start >= 5 ? 'color' : end - start === 4 ? 'line' : 'match', end - start >= 5 ? 3 : end - start === 4 ? 1 : 0, axis);
      start = end;
    }
  }
  for (let row = 0; row < SIZE; row++) for (let col = 0; col < SIZE; col++) {
    for (const size of [3, 2]) if (row + size <= SIZE && col + size <= SIZE) {
      const cells = Array.from({ length: size * size }, (_, i) => (row + Math.floor(i / size)) * SIZE + col + i % size);
      add(cells, size === 3 ? 'square3' : 'square2', size === 3 ? 5 : 2);
    }
    // Three cells along each arm, including the shared elbow; all four rotations.
    for (const dr of [-1, 1]) for (const dc of [-1, 1]) {
      if (row + 2 * dr < 0 || row + 2 * dr >= SIZE || col + 2 * dc < 0 || col + 2 * dc >= SIZE) continue;
      const corner = row * SIZE + col;
      add([corner + 2 * dc, corner + dc, corner, corner + dr * SIZE, corner + 2 * dr * SIZE], 'elbow', 2);
    }
  }
  // A big square owns its contained little squares/lines/elbows.
  return patterns.filter((pattern) => !patterns.some((other) => other !== pattern && other.cells.length > pattern.cells.length
    && other.comboBonus >= pattern.comboBonus && pattern.cells.every((cell) => other.cells.includes(cell))));
}
export function findMatches(board) {
  return [...new Set(matchPatterns(board).flatMap((pattern) => pattern.cells))];
}
export function blastMatches(board) {
  const patterns = matchPatterns(board);
  const removed = new Set(patterns.flatMap((pattern) => pattern.cells));
  const effects = [];
  for (const pattern of patterns) {
    if (pattern.kind === 'match') continue;
    const cells = new Set(pattern.cells);
    const row = Math.floor(pattern.center / SIZE), col = pattern.center % SIZE;
    const square = pattern.kind.startsWith('square');
    const rows = pattern.cells.map((cell) => Math.floor(cell / SIZE));
    const cols = pattern.cells.map((cell) => cell % SIZE);
    for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
      const index = r * SIZE + c;
      if ((pattern.kind === 'color' && board[index] === pattern.type)
        || (pattern.kind === 'line' && (pattern.axis === 0 ? r === row : c === col))
        || (pattern.kind === 'elbow' && Math.abs(r - row) <= 1 && Math.abs(c - col) <= 1)
        || (square && r >= Math.min(...rows) - 1 && r <= Math.max(...rows) + 1 && c >= Math.min(...cols) - 1 && c <= Math.max(...cols) + 1)) cells.add(index);
    }
    const affected = [...cells].filter((cell) => board[cell] != null);
    affected.forEach((cell) => removed.add(cell));
    effects.push({ kind: pattern.kind, center: pattern.center, cells: affected, comboBonus: pattern.comboBonus, axis: pattern.axis });
  }
  return { removed: [...removed], effects };
}
export function findMove(board) {
  for (let a = 0; a < board.length; a++) for (const b of [a + 1, a + SIZE]) {
    if (adjacent(a, b) && board[a] !== board[b] && findMatches(swap(board, a, b)).length) return [a, b];
  }
  return null;
}
export function createBoard(random = Math.random) {
  for (let attempt = 0; attempt < 128; attempt++) {
    const board = [];
    for (let index = 0; index < SIZE * SIZE; index++) {
      const candidates = Array.from({ length: TYPES }, (_, type) => type).filter((type) =>
        !(index % SIZE >= 2 && board[index - 1] === type && board[index - 2] === type)
        && !(index >= SIZE * 2 && board[index - SIZE] === type && board[index - SIZE * 2] === type)
        && !(index % SIZE >= 1 && index >= SIZE && board[index - 1] === type && board[index - SIZE] === type && board[index - SIZE - 1] === type));
      board.push(candidates[Math.floor(random() * candidates.length)]);
    }
    if (findMove(board)) return board;
  }
  throw new Error('Could not generate a playable board.');
}
export function collapseFrame(board, removed, random = Math.random) {
  const marked = new Set(removed), next = [...board], drops = Array(SIZE * SIZE).fill(0);
  for (let column = 0; column < SIZE; column++) {
    const kept = [];
    for (let row = 0; row < SIZE; row++) {
      const index = row * SIZE + column;
      if (!marked.has(index)) kept.push({ type: board[index], row });
    }
    const missing = SIZE - kept.length;
    for (let row = SIZE - 1; row >= 0; row--) {
      const tile = kept.pop(), index = row * SIZE + column;
      next[index] = tile ? tile.type : Math.floor(random() * TYPES);
      drops[index] = tile ? row - tile.row : missing;
    }
  }
  return { board: next, drops };
}
export function collapse(board, removed, random = Math.random) { return collapseFrame(board, removed, random).board; }
export function playTurn(board, a, b, random = Math.random) {
  if (!adjacent(a, b) || board[a] === board[b]) return null;
  let next = swap(board, a, b), match = blastMatches(next);
  if (!match.removed.length) return null;
  const frames = [];
  let cleared = 0;
  while (match.removed.length && frames.length < 64) {
    const fallen = collapseFrame(next, match.removed, random);
    frames.push({ board: next, ...match, nextBoard: fallen.board, drops: fallen.drops });
    cleared += match.removed.length;
    next = fallen.board;
    match = blastMatches(next);
  }
  const shuffled = match.removed.length > 0 || !findMove(next);
  if (shuffled) next = createBoard(random);
  return { board: next, cleared, chains: frames.length, frames, shuffled };
}
