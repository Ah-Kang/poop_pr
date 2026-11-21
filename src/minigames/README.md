# 변기뚫기 대작전

`/minigame` is the integrated 8×8 match-3 game. The main game's workshop links to it;
`/?workshop=1` returns directly to the workshop.

## Rules

- 64 cells, six tile types, adjacent tap or swipe. Invalid swaps cost no moves.
- Ten introductory stages: total clears, individual/two-type collection, and dirt underneath cells.
- Stage settings live in `shared/puzzle.js`. Normal stages allow 18–22 valid moves.
- Dirt stays at its cell and clears once when that cell is matched. It does not block swapping.
- Goals are checked after the whole cascade, before the final-move loss check.
- After stage ten, seven tested objective/layout templates repeat with fresh random boards.
  This is repeat play, not an infinite set of hand-designed levels or an increasing difficulty curve.
- Tile score is 10 × cascade index; winning adds 30 points per unused move.
- Wins give 1 star (2 from 800 points, 3 from 1,200 points); normal rewards are 3/4/5 parts.
- A completed loss gives 2 parts. Hard/expert unlock with toilet progression and multiply parts
  by 2/3, with 2/4 fewer moves. Abandoning a run has no reward or refund.
- The shared wallet supplies 30 starter tokens, 8-token entry and daily 24-token claims.
  Real ad and purchase integrations remain disabled.

## Persistence and authority

`shared/match3.js` is the board engine and `shared/puzzle.js` owns deterministic seeded turns.
`shared/economy.js` handles `puzzle_start` and `puzzle_move` in the same wallet transaction
as token spends, stage unlocks and final rewards. Clients send a run ID, turn number and two
cell indices, never an authoritative score or reward. Account moves are executed by the server;
guest moves use the same reducer in the shared browser wallet.

An active run stores the board and RNG state. Every move is persisted before the animation.
Reload resumes without another entry fee. Retrying an uncertain request uses its original ID;
turn numbers reject stale concurrent moves. Account action IDs are durably deduplicated.
The server rejects externally claimed `complete_run` and prevents demo completion of a real puzzle.

The old `poop-pr-toilet-puzzle-v1` prototype save is left untouched, but its separate wallet and
7×7 round are no longer read or added to the common wallet. `puzzle-save.js` is the unused legacy
reader, retained for reference. Existing common wallets retain their balances and start at stage 1.
Guest progress is not transferred into an account wallet.

## Validation

```sh
npm run test:puzzle
npm run test:economy
npm run check:server
npm run build
```

Automated checks cover all stage templates, deterministic resume, final-move wins, dirt counting,
row boundaries, invalid exchanges, entry and settlement idempotency, forged client scores,
stage locks, server persistence and common-wallet crafting.
