/**
 * Head-to-Head Holes Won — standalone test for the match-play "up" notation logic.
 *
 * Run with:  npx ts-node src/utils/__tests__/headToHead.test.ts
 *          or:  npx tsx src/utils/__tests__/headToHead.test.ts
 *
 * The function under test mirrors the useMemo in GameSummaryScreen exactly.
 */

// ── Types (minimal, matching the app) ────────────────────────────────

interface Player { id: string; name: string; }
interface Hole   { id: string; holeNumber: number; confirmed?: boolean; }
interface Score  { holeId: string; playerId: string; strokes: number; }
type Handicaps = { [pairKey: string]: { [holeNumber: string]: number } };

interface H2HResult {
  leader: Player;
  trailer: Player;
  advantage: number;
}

// ── Pure calculation (same logic as GameSummaryScreen useMemo) ────────

function getHandicapForHole(
  handicaps: Handicaps | undefined,
  holeNumber: number,
  fromPlayerId: string,
  toPlayerId: string
): number {
  if (!handicaps) return 0;
  const key = `${fromPlayerId}_${toPlayerId}`;
  const pair = handicaps[key];
  if (!pair) return 0;
  return pair[holeNumber.toString()] || 0;
}

function calculateHeadToHead(
  players: Player[],
  holes: Hole[],
  scores: Score[],
  handicaps?: Handicaps
): H2HResult[] {
  if (players.length < 2 || holes.length === 0) return [];

  const pairs: H2HResult[] = [];

  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      const pA = players[i];
      const pB = players[j];
      let aWins = 0;
      let bWins = 0;

      for (const hole of holes) {
        const scoreA = scores.find(s => s.holeId === hole.id && s.playerId === pA.id);
        const scoreB = scores.find(s => s.holeId === hole.id && s.playerId === pB.id);
        if (!scoreA || !scoreB || scoreA.strokes === 0 || scoreB.strokes === 0) continue;

        const bGivesA = getHandicapForHole(handicaps, hole.holeNumber, pB.id, pA.id);
        const aGivesB = getHandicapForHole(handicaps, hole.holeNumber, pA.id, pB.id);

        const netA = scoreA.strokes - bGivesA;
        const netB = scoreB.strokes - aGivesB;

        if (netA < netB) aWins++;
        else if (netB < netA) bWins++;
      }

      const advantage = Math.abs(aWins - bWins);
      if (bWins > aWins) {
        pairs.push({ leader: pB, trailer: pA, advantage });
      } else {
        pairs.push({ leader: pA, trailer: pB, advantage });
      }
    }
  }
  return pairs;
}

// ── Test helpers ─────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`  FAIL: ${message}`);
    failed++;
  } else {
    console.log(`  PASS: ${message}`);
    passed++;
  }
}

/** Find the pair that contains both named players (in either order). */
function findPair(results: H2HResult[], nameA: string, nameB: string) {
  return results.find(
    r =>
      (r.leader.name === nameA && r.trailer.name === nameB) ||
      (r.leader.name === nameB && r.trailer.name === nameA)
  );
}

/** Assert the pair shows leader=expectedLeader, advantage=expectedAdv, trailer gets 0. */
function assertPair(
  results: H2HResult[],
  expectedLeader: string,
  expectedTrailer: string,
  expectedAdv: number,
  label: string
) {
  const pair = findPair(results, expectedLeader, expectedTrailer);
  if (!pair) {
    console.error(`  FAIL [${label}]: pair ${expectedLeader}-${expectedTrailer} not found`);
    failed++;
    return;
  }
  assert(
    pair.leader.name === expectedLeader,
    `${label}: leader should be ${expectedLeader}, got ${pair.leader.name}`
  );
  assert(
    pair.trailer.name === expectedTrailer,
    `${label}: trailer should be ${expectedTrailer}, got ${pair.trailer.name}`
  );
  assert(
    pair.advantage === expectedAdv,
    `${label}: advantage should be ${expectedAdv}, got ${pair.advantage}`
  );
}

// ── Players ──────────────────────────────────────────────────────────

const A: Player = { id: 'a', name: 'A' };
const B: Player = { id: 'b', name: 'B' };
const C: Player = { id: 'c', name: 'C' };
const D: Player = { id: 'd', name: 'D' };
const E: Player = { id: 'e', name: 'E' };

// ── Test 1: User's exact 3-hole, 4-player scenario ──────────────────

console.log('\n=== Test 1: User example — 4 players, 3 holes, handicap on hole 3 ===');
{
  const holes: Hole[] = [
    { id: 'h1', holeNumber: 1 },
    { id: 'h2', holeNumber: 2 },
    { id: 'h3', holeNumber: 3 },
  ];

  const scores: Score[] = [
    // Hole 1: A=3, B=4, C=4, D=4
    { holeId: 'h1', playerId: 'a', strokes: 3 },
    { holeId: 'h1', playerId: 'b', strokes: 4 },
    { holeId: 'h1', playerId: 'c', strokes: 4 },
    { holeId: 'h1', playerId: 'd', strokes: 4 },
    // Hole 2: A=4, B=4, C=4, D=3
    { holeId: 'h2', playerId: 'a', strokes: 4 },
    { holeId: 'h2', playerId: 'b', strokes: 4 },
    { holeId: 'h2', playerId: 'c', strokes: 4 },
    { holeId: 'h2', playerId: 'd', strokes: 3 },
    // Hole 3: A=3, B=4, C=4, D=4  (A gives 1 stroke to B on this hole)
    { holeId: 'h3', playerId: 'a', strokes: 3 },
    { holeId: 'h3', playerId: 'b', strokes: 4 },
    { holeId: 'h3', playerId: 'c', strokes: 4 },
    { holeId: 'h3', playerId: 'd', strokes: 4 },
  ];

  // Handicap: A gives 1 stroke to B on hole 3 only
  const handicaps: Handicaps = {
    'a_b': { '3': 1 },   // B receives 1 stroke from A on hole 3
  };

  // --- After hole 1 only ---
  console.log('\n  -- After hole 1 --');
  const r1 = calculateHeadToHead([A, B, C, D], [holes[0]], scores, handicaps);
  assertPair(r1, 'A', 'B', 1, 'H1 A-B');
  assertPair(r1, 'A', 'C', 1, 'H1 A-C');
  assertPair(r1, 'A', 'D', 1, 'H1 A-D');
  assertPair(r1, 'B', 'C', 0, 'H1 B-C');
  assertPair(r1, 'B', 'D', 0, 'H1 B-D');
  assertPair(r1, 'C', 'D', 0, 'H1 C-D');

  // --- After holes 1 + 2 ---
  console.log('\n  -- After holes 1+2 --');
  const r2 = calculateHeadToHead([A, B, C, D], holes.slice(0, 2), scores, handicaps);
  assertPair(r2, 'A', 'B', 1, 'H1+2 A-B');
  assertPair(r2, 'A', 'C', 1, 'H1+2 A-C');
  // A-D: A won hole1, D won hole2 → net 0 → 0-0, original order kept (A first)
  assertPair(r2, 'A', 'D', 0, 'H1+2 A-D tied');
  assertPair(r2, 'B', 'C', 0, 'H1+2 B-C');
  // B-D: D won hole2 → D leads by 1 → D first
  assertPair(r2, 'D', 'B', 1, 'H1+2 D-B');
  // C-D: D won hole2 → D leads by 1 → D first
  assertPair(r2, 'D', 'C', 1, 'H1+2 D-C');

  // --- After all 3 holes ---
  console.log('\n  -- After all 3 holes (with handicap) --');
  const r3 = calculateHeadToHead([A, B, C, D], holes, scores, handicaps);
  // A-B: H1 A wins (3<4), H2 tie (4=4), H3 A=3, B net=4-1=3 → tie. A: 1 win, B: 0 → adv 1
  assertPair(r3, 'A', 'B', 1, 'H1-3 A-B');
  // A-C: H1 A wins, H2 tie, H3 A wins (3<4). A: 2, C: 0 → adv 2
  assertPair(r3, 'A', 'C', 2, 'H1-3 A-C');
  // A-D: H1 A wins, H2 D wins, H3 A wins (3<4). A: 2, D: 1 → adv 1
  assertPair(r3, 'A', 'D', 1, 'H1-3 A-D');
  // B-C: all ties (no handicap between B and C). 0-0
  assertPair(r3, 'B', 'C', 0, 'H1-3 B-C');
  // B-D: H1 tie, H2 D wins (3<4), H3 tie (4=4). D: 1, B: 0 → adv 1, D leads
  assertPair(r3, 'D', 'B', 1, 'H1-3 D-B');
  // C-D: H1 tie, H2 D wins, H3 tie. D: 1, C: 0 → adv 1, D leads
  assertPair(r3, 'D', 'C', 1, 'H1-3 D-C');
}

// ── Test 2: All ties — every pair should be 0-0 ─────────────────────

console.log('\n=== Test 2: All ties (everyone shoots the same) ===');
{
  const holes: Hole[] = [
    { id: 'h1', holeNumber: 1 },
    { id: 'h2', holeNumber: 2 },
  ];
  const scores: Score[] = [
    { holeId: 'h1', playerId: 'a', strokes: 4 },
    { holeId: 'h1', playerId: 'b', strokes: 4 },
    { holeId: 'h1', playerId: 'c', strokes: 4 },
    { holeId: 'h2', playerId: 'a', strokes: 5 },
    { holeId: 'h2', playerId: 'b', strokes: 5 },
    { holeId: 'h2', playerId: 'c', strokes: 5 },
  ];
  const r = calculateHeadToHead([A, B, C], holes, scores);
  assertPair(r, 'A', 'B', 0, 'AllTie A-B');
  assertPair(r, 'A', 'C', 0, 'AllTie A-C');
  assertPair(r, 'B', 'C', 0, 'AllTie B-C');
}

// ── Test 3: One player dominates ─────────────────────────────────────

console.log('\n=== Test 3: One player wins every hole ===');
{
  const holes: Hole[] = [
    { id: 'h1', holeNumber: 1 },
    { id: 'h2', holeNumber: 2 },
    { id: 'h3', holeNumber: 3 },
  ];
  const scores: Score[] = [];
  for (const h of holes) {
    scores.push({ holeId: h.id, playerId: 'a', strokes: 3 }); // birdie every hole
    scores.push({ holeId: h.id, playerId: 'b', strokes: 5 });
    scores.push({ holeId: h.id, playerId: 'c', strokes: 5 });
  }
  const r = calculateHeadToHead([A, B, C], holes, scores);
  // A wins every hole vs B and C → 3-0 each → advantage 3
  assertPair(r, 'A', 'B', 3, 'Dominate A-B');
  assertPair(r, 'A', 'C', 3, 'Dominate A-C');
  // B and C tie every hole → 0-0
  assertPair(r, 'B', 'C', 0, 'Dominate B-C');
}

// ── Test 4: Alternating wins — net cancels out ───────────────────────

console.log('\n=== Test 4: Alternating wins cancel out ===');
{
  const holes: Hole[] = [
    { id: 'h1', holeNumber: 1 },
    { id: 'h2', holeNumber: 2 },
    { id: 'h3', holeNumber: 3 },
    { id: 'h4', holeNumber: 4 },
  ];
  const scores: Score[] = [
    // H1: A=3, B=4 → A wins
    { holeId: 'h1', playerId: 'a', strokes: 3 },
    { holeId: 'h1', playerId: 'b', strokes: 4 },
    // H2: A=5, B=4 → B wins
    { holeId: 'h2', playerId: 'a', strokes: 5 },
    { holeId: 'h2', playerId: 'b', strokes: 4 },
    // H3: A=3, B=4 → A wins
    { holeId: 'h3', playerId: 'a', strokes: 3 },
    { holeId: 'h3', playerId: 'b', strokes: 4 },
    // H4: A=5, B=4 → B wins
    { holeId: 'h4', playerId: 'a', strokes: 5 },
    { holeId: 'h4', playerId: 'b', strokes: 4 },
  ];
  const r = calculateHeadToHead([A, B], holes, scores);
  // A: 2 wins, B: 2 wins → net 0 → 0-0
  assertPair(r, 'A', 'B', 0, 'Alternate A-B tied');
}

// ── Test 5: 5-player game ────────────────────────────────────────────

console.log('\n=== Test 5: 5-player game ===');
{
  const holes: Hole[] = [
    { id: 'h1', holeNumber: 1 },
    { id: 'h2', holeNumber: 2 },
  ];
  const scores: Score[] = [
    // Hole 1: A=3, B=4, C=5, D=4, E=3
    { holeId: 'h1', playerId: 'a', strokes: 3 },
    { holeId: 'h1', playerId: 'b', strokes: 4 },
    { holeId: 'h1', playerId: 'c', strokes: 5 },
    { holeId: 'h1', playerId: 'd', strokes: 4 },
    { holeId: 'h1', playerId: 'e', strokes: 3 },
    // Hole 2: A=4, B=3, C=4, D=5, E=4
    { holeId: 'h2', playerId: 'a', strokes: 4 },
    { holeId: 'h2', playerId: 'b', strokes: 3 },
    { holeId: 'h2', playerId: 'c', strokes: 4 },
    { holeId: 'h2', playerId: 'd', strokes: 5 },
    { holeId: 'h2', playerId: 'e', strokes: 4 },
  ];
  const r = calculateHeadToHead([A, B, C, D, E], holes, scores);

  // Should have C(5,2)=10 pairs
  assert(r.length === 10, '5-player produces 10 pairs');

  // A-B: H1 A wins(3<4), H2 B wins(3<4) → net 0
  assertPair(r, 'A', 'B', 0, '5P A-B');
  // A-C: H1 A wins(3<5), H2 tie(4=4) → A+1
  assertPair(r, 'A', 'C', 1, '5P A-C');
  // A-D: H1 A wins(3<4), H2 A wins(4<5) → A+2
  assertPair(r, 'A', 'D', 2, '5P A-D');
  // A-E: H1 tie(3=3), H2 tie(4=4) → 0
  assertPair(r, 'A', 'E', 0, '5P A-E');
  // B-C: H1 B wins(4<5), H2 B wins(3<4) → B+2
  assertPair(r, 'B', 'C', 2, '5P B-C');
  // B-D: H1 tie(4=4), H2 B wins(3<5) → B+1
  assertPair(r, 'B', 'D', 1, '5P B-D');
  // B-E: H1 B loses(4>3), H2 B wins(3<4) → net 0
  assertPair(r, 'B', 'E', 0, '5P B-E');
  // C-D: H1 C loses(5>4), H2 C wins(4<5) → net 0
  assertPair(r, 'C', 'D', 0, '5P C-D');
  // C-E: H1 C loses(5>3), H2 tie(4=4) → E+1
  assertPair(r, 'E', 'C', 1, '5P E-C');
  // D-E: H1 D loses(4>3)? no 4>3 → D=4, E=3 → E wins. H2 D=5, E=4 → E wins. → E+2
  assertPair(r, 'E', 'D', 2, '5P E-D');
}

// ── Test 6: Handicap flips a result ──────────────────────────────────

console.log('\n=== Test 6: Handicap flips a hole winner ===');
{
  const holes: Hole[] = [{ id: 'h1', holeNumber: 1 }];
  const scores: Score[] = [
    { holeId: 'h1', playerId: 'a', strokes: 4 },
    { holeId: 'h1', playerId: 'b', strokes: 5 },
  ];
  // Without handicap, A wins (4<5). But B gets 2 strokes from A on hole 1.
  // B net = 5 - 2 = 3, A net = 4. B wins!
  const handicaps: Handicaps = { 'a_b': { '1': 2 } };
  const r = calculateHeadToHead([A, B], holes, scores, handicaps);
  assertPair(r, 'B', 'A', 1, 'Hcap flip B wins');
}

// ── Test 7: Unconfirmed holes WITH scores are now counted ────────────

console.log('\n=== Test 7: Unconfirmed holes with scores ARE counted ===');
{
  const holes: Hole[] = [
    { id: 'h1', holeNumber: 1, confirmed: false },
    { id: 'h2', holeNumber: 2, confirmed: false },
  ];
  const scores: Score[] = [
    { holeId: 'h1', playerId: 'a', strokes: 3 },
    { holeId: 'h1', playerId: 'b', strokes: 4 },
    { holeId: 'h2', playerId: 'a', strokes: 6 },
    { holeId: 'h2', playerId: 'b', strokes: 3 },
  ];
  const r = calculateHeadToHead([A, B], holes, scores);
  // Both holes count (confirmed no longer matters)
  // H1: A wins (3<4), H2: B wins (3<6) → net 0
  assertPair(r, 'A', 'B', 0, 'Unconfirmed counted → tied');
}

// ── Test 7b: Mix of confirmed and unconfirmed ────────────────────────

console.log('\n=== Test 7b: Mix confirmed/unconfirmed — all count ===');
{
  const holes: Hole[] = [
    { id: 'h1', holeNumber: 1, confirmed: true },
    { id: 'h2', holeNumber: 2, confirmed: false },
    { id: 'h3', holeNumber: 3 },  // undefined confirmed
  ];
  const scores: Score[] = [
    { holeId: 'h1', playerId: 'a', strokes: 3 },
    { holeId: 'h1', playerId: 'b', strokes: 5 },
    { holeId: 'h2', playerId: 'a', strokes: 3 },
    { holeId: 'h2', playerId: 'b', strokes: 5 },
    { holeId: 'h3', playerId: 'a', strokes: 3 },
    { holeId: 'h3', playerId: 'b', strokes: 5 },
  ];
  const r = calculateHeadToHead([A, B], holes, scores);
  // A wins all 3 → advantage 3
  assertPair(r, 'A', 'B', 3, 'All confirmed statuses counted');
}

// ── Test 7c: Holes with strokes=0 are skipped ───────────────────────

console.log('\n=== Test 7c: Holes with strokes=0 skipped ===');
{
  const holes: Hole[] = [
    { id: 'h1', holeNumber: 1 },
    { id: 'h2', holeNumber: 2 },
  ];
  const scores: Score[] = [
    { holeId: 'h1', playerId: 'a', strokes: 3 },
    { holeId: 'h1', playerId: 'b', strokes: 4 },
    // Hole 2: scores exist but strokes are 0 (not yet entered)
    { holeId: 'h2', playerId: 'a', strokes: 0 },
    { holeId: 'h2', playerId: 'b', strokes: 0 },
  ];
  const r = calculateHeadToHead([A, B], holes, scores);
  // Only hole 1 counts (hole 2 has strokes=0) → A+1
  assertPair(r, 'A', 'B', 1, 'Strokes=0 skipped');
}

// ── Test 7d: One player has strokes=0, other doesn't ────────────────

console.log('\n=== Test 7d: One player strokes=0 skips that hole ===');
{
  const holes: Hole[] = [
    { id: 'h1', holeNumber: 1 },
    { id: 'h2', holeNumber: 2 },
  ];
  const scores: Score[] = [
    { holeId: 'h1', playerId: 'a', strokes: 3 },
    { holeId: 'h1', playerId: 'b', strokes: 4 },
    { holeId: 'h2', playerId: 'a', strokes: 4 },
    { holeId: 'h2', playerId: 'b', strokes: 0 },  // B didn't enter score
  ];
  const r = calculateHeadToHead([A, B], holes, scores);
  // Only hole 1 counts → A+1
  assertPair(r, 'A', 'B', 1, 'Partial strokes=0 skips hole');
}

// ── Test 8: Missing scores for a player on a hole ────────────────────

console.log('\n=== Test 8: Missing scores for a player ===');
{
  const holes: Hole[] = [
    { id: 'h1', holeNumber: 1 },
    { id: 'h2', holeNumber: 2 },
  ];
  const scores: Score[] = [
    { holeId: 'h1', playerId: 'a', strokes: 3 },
    { holeId: 'h1', playerId: 'b', strokes: 4 },
    // Hole 2: only A has a score, B missing
    { holeId: 'h2', playerId: 'a', strokes: 5 },
  ];
  const r = calculateHeadToHead([A, B], holes, scores);
  // Hole 2 skipped because B has no score → only hole 1 counts → A+1
  assertPair(r, 'A', 'B', 1, 'MissingScore');
}

// ── Test 9: Two players only, no handicaps ───────────────────────────

console.log('\n=== Test 9: Simple 2 player, 2 holes ===');
{
  const holes: Hole[] = [
    { id: 'h1', holeNumber: 1 },
    { id: 'h2', holeNumber: 2 },
  ];
  const scores: Score[] = [
    { holeId: 'h1', playerId: 'a', strokes: 4 },
    { holeId: 'h1', playerId: 'b', strokes: 5 },
    { holeId: 'h2', playerId: 'a', strokes: 4 },
    { holeId: 'h2', playerId: 'b', strokes: 5 },
  ];
  const r = calculateHeadToHead([A, B], holes, scores);
  // A wins both holes → A: 2, B: 0 → advantage 2
  assertPair(r, 'A', 'B', 2, '2p2h A dominates');
}

// ── Test 10: Handicap makes it an exact tie on a hole ────────────────

console.log('\n=== Test 10: Handicap creates exact tie ===');
{
  const holes: Hole[] = [{ id: 'h1', holeNumber: 1 }];
  const scores: Score[] = [
    { holeId: 'h1', playerId: 'a', strokes: 4 },
    { holeId: 'h1', playerId: 'b', strokes: 5 },
  ];
  // B gets 1 stroke → net B = 5-1 = 4 = A's 4 → tie
  const handicaps: Handicaps = { 'a_b': { '1': 1 } };
  const r = calculateHeadToHead([A, B], holes, scores, handicaps);
  assertPair(r, 'A', 'B', 0, 'Hcap exact tie');
}

// ── Test 11: Bidirectional handicaps ─────────────────────────────────

console.log('\n=== Test 11: Both players give strokes to each other on different holes ===');
{
  const holes: Hole[] = [
    { id: 'h1', holeNumber: 1 },
    { id: 'h2', holeNumber: 2 },
  ];
  const scores: Score[] = [
    // Both shoot 4 on both holes (without handicap, all ties)
    { holeId: 'h1', playerId: 'a', strokes: 4 },
    { holeId: 'h1', playerId: 'b', strokes: 4 },
    { holeId: 'h2', playerId: 'a', strokes: 4 },
    { holeId: 'h2', playerId: 'b', strokes: 4 },
  ];
  // On hole 1: A gives 1 to B → B net=3, A net=4 → B wins
  // On hole 2: B gives 1 to A → A net=3, B net=4 → A wins
  const handicaps: Handicaps = {
    'a_b': { '1': 1 },
    'b_a': { '2': 1 },
  };
  const r = calculateHeadToHead([A, B], holes, scores, handicaps);
  // A: 1 win, B: 1 win → net 0
  assertPair(r, 'A', 'B', 0, 'Bidir hcap tied');
}

// ── Test 12: Empty / edge cases ──────────────────────────────────────

console.log('\n=== Test 12: Edge cases ===');
{
  // 0 players
  assert(calculateHeadToHead([], [], []).length === 0, 'No players → empty');
  // 1 player
  assert(calculateHeadToHead([A], [{ id: 'h1', holeNumber: 1 }], []).length === 0, '1 player → empty');
  // No holes
  assert(calculateHeadToHead([A, B], [], []).length === 0, 'No holes → empty');
  // No scores
  const r = calculateHeadToHead(
    [A, B],
    [{ id: 'h1', holeNumber: 1 }],
    []
  );
  assertPair(r, 'A', 'B', 0, 'No scores → 0-0');
}

// ── Test 13: Large advantage with many holes ─────────────────────────

console.log('\n=== Test 13: 9 holes, large advantage ===');
{
  const holes: Hole[] = Array.from({ length: 9 }, (_, i) => ({
    id: `h${i + 1}`,
    holeNumber: i + 1,
  }));
  const scores: Score[] = [];
  for (const h of holes) {
    scores.push({ holeId: h.id, playerId: 'a', strokes: 3 });
    scores.push({ holeId: h.id, playerId: 'b', strokes: 4 });
  }
  const r = calculateHeadToHead([A, B], holes, scores);
  // A wins all 9 → advantage 9
  assertPair(r, 'A', 'B', 9, '9-hole domination');
}

// ── Test 14: Leader ordering with 3 players ──────────────────────────

console.log('\n=== Test 14: Verify leader is always the one who is up ===');
{
  const holes: Hole[] = [
    { id: 'h1', holeNumber: 1 },
    { id: 'h2', holeNumber: 2 },
    { id: 'h3', holeNumber: 3 },
  ];
  const scores: Score[] = [
    // H1: A=5, B=3, C=4
    { holeId: 'h1', playerId: 'a', strokes: 5 },
    { holeId: 'h1', playerId: 'b', strokes: 3 },
    { holeId: 'h1', playerId: 'c', strokes: 4 },
    // H2: A=5, B=3, C=4
    { holeId: 'h2', playerId: 'a', strokes: 5 },
    { holeId: 'h2', playerId: 'b', strokes: 3 },
    { holeId: 'h2', playerId: 'c', strokes: 4 },
    // H3: A=5, B=3, C=4
    { holeId: 'h3', playerId: 'a', strokes: 5 },
    { holeId: 'h3', playerId: 'b', strokes: 3 },
    { holeId: 'h3', playerId: 'c', strokes: 4 },
  ];
  const r = calculateHeadToHead([A, B, C], holes, scores);
  // A-B: B wins all 3 → B is leader
  assertPair(r, 'B', 'A', 3, 'Leader B over A');
  // A-C: C wins all 3 → C is leader
  assertPair(r, 'C', 'A', 3, 'Leader C over A');
  // B-C: B wins all 3 (3<4) → B is leader
  assertPair(r, 'B', 'C', 3, 'Leader B over C');
}

// ── Test 15: Real-game scenario — all holes unconfirmed (user's reported bug) ──

console.log('\n=== Test 15: Real game — all holes confirmed:false, scores exist ===');
{
  // Simulates 4 players playing 7 holes, never pressing "Complete" (only "Next")
  // All holes have confirmed: false, but real scores exist
  const Nick: Player = { id: 'nick', name: 'Nick' };
  const KP: Player = { id: 'kp', name: 'KP' };
  const Mikey: Player = { id: 'mikey', name: 'Mikey' };
  const Danny: Player = { id: 'danny', name: 'Danny' };

  const holes: Hole[] = Array.from({ length: 7 }, (_, i) => ({
    id: `h${i + 1}`,
    holeNumber: i + 1,
    confirmed: false,  // None confirmed — user just pressed "Next"
  }));

  const scores: Score[] = [];
  // Holes 1-4: Nick & KP score 3 (birdie), Mikey & Danny score 5 (bogey)
  for (let h = 1; h <= 4; h++) {
    scores.push({ holeId: `h${h}`, playerId: 'nick', strokes: 3 });
    scores.push({ holeId: `h${h}`, playerId: 'kp', strokes: 3 });
    scores.push({ holeId: `h${h}`, playerId: 'mikey', strokes: 5 });
    scores.push({ holeId: `h${h}`, playerId: 'danny', strokes: 5 });
  }
  // Holes 5-7: Nick scores 3, KP/Mikey/Danny score 4
  for (let h = 5; h <= 7; h++) {
    scores.push({ holeId: `h${h}`, playerId: 'nick', strokes: 3 });
    scores.push({ holeId: `h${h}`, playerId: 'kp', strokes: 4 });
    scores.push({ holeId: `h${h}`, playerId: 'mikey', strokes: 4 });
    scores.push({ holeId: `h${h}`, playerId: 'danny', strokes: 4 });
  }

  const r = calculateHeadToHead([Nick, KP, Mikey, Danny], holes, scores);

  // THIS WAS THE BUG: previously returned 0 for all because confirmed === false
  // Nick vs KP: H1-4 tie (3=3), H5-7 Nick wins (3<4). Nick: 3 wins, KP: 0 → Nick+3
  assertPair(r, 'Nick', 'KP', 3, 'RealGame Nick-KP');
  // Nick vs Mikey: H1-4 Nick wins (3<5), H5-7 Nick wins (3<4). Nick: 7, Mikey: 0 → Nick+7
  assertPair(r, 'Nick', 'Mikey', 7, 'RealGame Nick-Mikey');
  // Nick vs Danny: same as Mikey → Nick+7
  assertPair(r, 'Nick', 'Danny', 7, 'RealGame Nick-Danny');
  // KP vs Mikey: H1-4 KP wins (3<5), H5-7 tie (4=4). KP: 4, Mikey: 0 → KP+4
  assertPair(r, 'KP', 'Mikey', 4, 'RealGame KP-Mikey');
  // KP vs Danny: same → KP+4
  assertPair(r, 'KP', 'Danny', 4, 'RealGame KP-Danny');
  // Mikey vs Danny: all ties → 0
  assertPair(r, 'Mikey', 'Danny', 0, 'RealGame Mikey-Danny');
}

// ── Test 16: Unplayed holes (strokes=0) mixed with played holes ──────

console.log('\n=== Test 16: 18-hole game, only 7 played (rest strokes=0) ===');
{
  const holes: Hole[] = Array.from({ length: 18 }, (_, i) => ({
    id: `h${i + 1}`,
    holeNumber: i + 1,
    confirmed: false,
  }));

  const scores: Score[] = [];
  // Holes 1-7: real scores
  for (let h = 1; h <= 7; h++) {
    scores.push({ holeId: `h${h}`, playerId: 'a', strokes: 3 });
    scores.push({ holeId: `h${h}`, playerId: 'b', strokes: 4 });
  }
  // Holes 8-18: strokes = 0 (not yet played / defaulted)
  for (let h = 8; h <= 18; h++) {
    scores.push({ holeId: `h${h}`, playerId: 'a', strokes: 0 });
    scores.push({ holeId: `h${h}`, playerId: 'b', strokes: 0 });
  }

  const r = calculateHeadToHead([A, B], holes, scores);
  // Only holes 1-7 count (strokes > 0). A wins all 7 → advantage 7
  assertPair(r, 'A', 'B', 7, '18h partial play');
}

// ── Summary ──────────────────────────────────────────────────────────

console.log(`\n${'='.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log('All tests passed!');
}
