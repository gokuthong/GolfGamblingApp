import {
  Hole,
  Score,
  Player,
  HoleResult,
  PlayerHoleResult,
  MultiplierInfo,
  MatchupResult,
} from "../types";
import { getHandicapForHole } from "./handicapUtils";

export class ScoreCalculator {
  /**
   * Calculate net score (strokes - handicap)
   * @deprecated Use calculateNetScoreForMatchup instead for player-vs-player handicaps
   */
  static calculateNetScore(score: Score): number {
    return score.strokes - score.handicap;
  }

  /**
   * Calculate net score for a player in a specific matchup
   * @param score The player's score
   * @param holeNumber The hole number
   * @param opponentId The opponent's player ID
   * @param gameHandicaps The game-level handicaps map
   * @returns Net score (strokes - handicap received from opponent on this hole)
   */
  static calculateNetScoreForMatchup(
    score: Score,
    holeNumber: number,
    opponentId: string,
    gameHandicaps?: { [pairKey: string]: { [holeNumber: string]: number } },
  ): number {
    // Get handicap strokes this player receives from opponent on this specific hole
    const handicapStrokes = getHandicapForHole(
      gameHandicaps,
      holeNumber,
      opponentId,
      score.playerId,
    );
    return score.strokes - handicapStrokes;
  }

  /**
   * Calculate points for all players on a single hole
   * Returns a map of playerId -> points earned on this hole
   */
  static calculateHolePoints(
    hole: Hole,
    scoresForHole: Score[],
    allPlayers: Player[],
    gameHandicaps?: { [pairKey: string]: { [holeNumber: string]: number } },
  ): Record<string, number> {
    // Initialize points map for all players
    const playerPoints: Record<string, number> = {};
    allPlayers.forEach((player) => {
      playerPoints[player.id] = 0;
    });

    if (allPlayers.length < 2) {
      return playerPoints;
    }

    // Build complete scores list - use existing scores or create virtual scores at par
    const existingScoresByPlayer = new Map<string, Score>();
    scoresForHole.forEach((score) => {
      existingScoresByPlayer.set(score.playerId, score);
    });

    const completeScores: Score[] = allPlayers.map((player) => {
      const existingScore = existingScoresByPlayer.get(player.id);
      if (existingScore) {
        return existingScore;
      }
      // Create virtual score at par for players without existing scores
      return {
        id: `virtual_${player.id}`,
        holeId: hole.id,
        playerId: player.id,
        gameId: hole.gameId,
        strokes: hole.par,
        handicap: 0,
        isUp: false,
        isBurn: false,
        multiplier: 1,
      };
    });

    // Compare every player against every other player (round-robin)
    for (let i = 0; i < completeScores.length; i++) {
      for (let j = i + 1; j < completeScores.length; j++) {
        const score1 = completeScores[i];
        const score2 = completeScores[j];

        // Calculate net scores using per-hole player-vs-player handicaps
        const netScore1 = this.calculateNetScoreForMatchup(
          score1,
          hole.holeNumber,
          score2.playerId,
          gameHandicaps,
        );
        const netScore2 = this.calculateNetScoreForMatchup(
          score2,
          hole.holeNumber,
          score1.playerId,
          gameHandicaps,
        );

        // Calculate each player's personal multiplier
        // Use new multiplier field if available, otherwise fall back to isUp/isBurn
        const player1Mult =
          score1.multiplier && score1.multiplier > 1
            ? score1.multiplier
            : (score1.isUp ? 2.0 : 1.0) * (score1.isBurn ? 3.0 : 1.0);
        const player2Mult =
          score2.multiplier && score2.multiplier > 1
            ? score2.multiplier
            : (score2.isUp ? 2.0 : 1.0) * (score2.isBurn ? 3.0 : 1.0);

        // Calculate birdie/eagle/albatross/hole-in-one multiplier for THIS MATCHUP ONLY
        // Only applies if one of the TWO players in this specific matchup achieved the special score
        const matchupBirdieEagleMultiplier =
          this.calculateBirdieEagleMultiplier(hole, [score1, score2]);

        // STACK all multipliers: player1 × player2 × birdie/eagle (for this matchup only)
        const matchupValue =
          player1Mult * player2Mult * matchupBirdieEagleMultiplier;

        // Determine winner and award points
        if (netScore1 < netScore2) {
          // Player 1 wins
          playerPoints[score1.playerId] += matchupValue;
          playerPoints[score2.playerId] -= matchupValue;
        } else if (netScore2 < netScore1) {
          // Player 2 wins
          playerPoints[score2.playerId] += matchupValue;
          playerPoints[score1.playerId] -= matchupValue;
        }
        // If netScore1 === netScore2, it's a draw, no points awarded
      }
    }

    return playerPoints;
  }

  /**
   * Calculate the multiplier for birdie/eagle/albatross/hole-in-one only (no Up/Burn)
   * Priority: Hole-in-one > Albatross > Eagle > Birdie
   */
  static calculateBirdieEagleMultiplier(hole: Hole, scores: Score[]): number {
    let multiplier = 1.0;

    // Check for Hole-in-one (1 stroke on any hole) - highest priority
    // IMPORTANT: Only count valid scores (strokes > 0)
    const hasHoleInOne = scores.some((score) => score.strokes === 1);
    if (hasHoleInOne) {
      multiplier *= 12.0;
      return multiplier;
    }

    // Check for Albatross (2 strokes on par 5) - second priority
    // IMPORTANT: Only count valid scores (strokes > 0)
    const hasAlbatross =
      hole.par === 5 && scores.some((score) => score.strokes === 2);
    if (hasAlbatross) {
      multiplier *= 6.0;
      return multiplier;
    }

    // Check for Eagle (2 or more strokes under par) - third priority
    // IMPORTANT: Only count valid scores (strokes > 0)
    const hasEagle = scores.some(
      (score) => score.strokes > 0 && score.strokes <= hole.par - 2,
    );
    if (hasEagle) {
      multiplier *= 3.0;
    } else {
      // Check for Birdie (exactly 1 stroke under par)
      // IMPORTANT: Only count valid scores (strokes > 0)
      const hasBirdie = scores.some(
        (score) => score.strokes > 0 && score.strokes === hole.par - 1,
      );
      if (hasBirdie) {
        multiplier *= 2.0;
      }
    }

    return multiplier;
  }

  /**
   * Calculate the multiplier for a hole based on status and special scores
   * @deprecated Use calculateBirdieEagleMultiplier and per-player multipliers instead
   */
  static calculateHoleMultiplier(hole: Hole, scores: Score[]): number {
    let multiplier = 1.0;

    // Apply "Up" multiplier (x2)
    if (hole.isUp) {
      multiplier *= 2.0;
    }

    // Apply "Burn" multiplier (x3)
    if (hole.isBurn) {
      multiplier *= 3.0;
    }

    // Check for Birdie (exactly 1 stroke under par)
    // IMPORTANT: Only count valid scores (strokes > 0)
    const hasBirdie = scores.some(
      (score) => score.strokes > 0 && score.strokes === hole.par - 1,
    );
    if (hasBirdie) {
      multiplier *= 2.0;
    }

    // Check for Eagle (2 or more strokes under par)
    // IMPORTANT: Only count valid scores (strokes > 0)
    const hasEagle = scores.some(
      (score) => score.strokes > 0 && score.strokes <= hole.par - 2,
    );
    if (hasEagle) {
      multiplier *= 3.0;
    }

    return multiplier;
  }

  /**
   * Get multiplier info for a specific player's score
   */
  static getMultiplierInfo(hole: Hole, score: Score): MultiplierInfo {
    // IMPORTANT: Only count valid scores (strokes > 0) for special scores
    const isHoleInOne = score.strokes === 1;
    const isAlbatross = hole.par === 5 && score.strokes === 2;
    const isBirdie = score.strokes > 0 && score.strokes === hole.par - 1;
    const isEagle =
      score.strokes > 0 &&
      score.strokes <= hole.par - 2 &&
      !isAlbatross &&
      !isHoleInOne;

    // Use new multiplier field if available, otherwise fall back to isUp/isBurn
    let playerMultiplier = 1.0;
    if (score.multiplier && score.multiplier > 1) {
      playerMultiplier = score.multiplier;
    } else {
      if (score.isUp) playerMultiplier *= 2.0;
      if (score.isBurn) playerMultiplier *= 3.0;
    }

    let totalMultiplier = playerMultiplier;
    if (isHoleInOne) {
      totalMultiplier *= 12.0;
    } else if (isAlbatross) {
      totalMultiplier *= 6.0;
    } else if (isEagle) {
      totalMultiplier *= 3.0;
    } else if (isBirdie) {
      totalMultiplier *= 2.0;
    }

    return {
      isUp: score.isUp || false,
      isBurn: score.isBurn || false,
      isBirdie,
      isEagle,
      isAlbatross,
      isHoleInOne,
      totalMultiplier,
    };
  }

  /**
   * Calculate accumulated points for all players across all holes
   * Only includes points from confirmed holes (where confirmed = true)
   */
  static calculateTotalPoints(
    holes: Hole[],
    scoresByHoleId: Record<string, Score[]>,
    allPlayers: Player[],
    gameHandicaps?: { [pairKey: string]: { [holeNumber: string]: number } },
  ): Record<string, number> {
    const totalPoints: Record<string, number> = {};
    allPlayers.forEach((player) => {
      totalPoints[player.id] = 0;
    });

    holes.forEach((hole) => {
      // Only include confirmed holes in cumulative totals
      // Use === false to preserve backward compatibility (undefined = confirmed for legacy data)
      if (hole.confirmed === false) {
        return;
      }

      const scoresForHole = scoresByHoleId[hole.id] || [];
      const holePoints = this.calculateHolePoints(
        hole,
        scoresForHole,
        allPlayers,
        gameHandicaps,
      );

      // Add hole points to total points
      Object.entries(holePoints).forEach(([playerId, points]) => {
        totalPoints[playerId] += points;
      });
    });

    return totalPoints;
  }

  /**
   * Get detailed results for each hole (useful for debugging and display)
   */
  static getDetailedHoleResults(
    holes: Hole[],
    scoresByHoleId: Record<string, Score[]>,
    allPlayers: Player[],
    gameHandicaps?: { [pairKey: string]: { [holeNumber: string]: number } },
  ): HoleResult[] {
    const results: HoleResult[] = [];

    holes.forEach((hole) => {
      const scoresForHole = scoresByHoleId[hole.id] || [];
      const holePoints = this.calculateHolePoints(
        hole,
        scoresForHole,
        allPlayers,
        gameHandicaps,
      );
      const multiplier = this.calculateHoleMultiplier(hole, scoresForHole);

      const playerResults: PlayerHoleResult[] = scoresForHole.map((score) => {
        const player = allPlayers.find((p) => p.id === score.playerId);
        // Sum up all handicap strokes this player receives from all opponents on this hole
        const strokesReceived = allPlayers
          .filter((p) => p.id !== score.playerId)
          .reduce(
            (sum, p) =>
              sum +
              getHandicapForHole(
                gameHandicaps,
                hole.holeNumber,
                p.id,
                score.playerId,
              ),
            0,
          );
        const netScore = score.strokes - strokesReceived;
        const points = holePoints[score.playerId] || 0;
        const multipliers = this.getMultiplierInfo(hole, score);

        return {
          playerId: score.playerId,
          playerName: player?.name || "Unknown",
          strokes: score.strokes,
          handicap: strokesReceived,
          netScore,
          points,
          multipliers,
        };
      });

      results.push({
        holeNumber: hole.holeNumber,
        par: hole.par,
        isUp: hole.isUp,
        isBurn: hole.isBurn,
        playerResults,
      });
    });

    return results;
  }

  /**
   * Calculate running total points up to a specific hole
   */
  static calculateRunningTotal(
    holesUpTo: Hole[],
    scoresByHoleId: Record<string, Score[]>,
    allPlayers: Player[],
    gameHandicaps?: { [pairKey: string]: { [holeNumber: string]: number } },
  ): Record<string, number> {
    return this.calculateTotalPoints(
      holesUpTo,
      scoresByHoleId,
      allPlayers,
      gameHandicaps,
    );
  }

  /**
   * Calculate running totals for all holes (array of cumulative totals)
   */
  static calculateRunningTotals(
    holes: Hole[],
    scoresByHoleId: Record<string, Score[]>,
    allPlayers: Player[],
    gameHandicaps?: { [pairKey: string]: { [holeNumber: string]: number } },
  ): Record<string, number>[] {
    const runningTotals: Record<string, number>[] = [];

    holes.forEach((_, index) => {
      const holesUpTo = holes.slice(0, index + 1);
      const totals = this.calculateRunningTotal(
        holesUpTo,
        scoresByHoleId,
        allPlayers,
        gameHandicaps,
      );
      runningTotals.push(totals);
    });

    return runningTotals;
  }

  /**
   * Get matchup results for a hole (who beat whom)
   */
  static getHoleMatchups(
    hole: Hole,
    scoresForHole: Score[],
    gameHandicaps?: { [pairKey: string]: { [holeNumber: string]: number } },
  ): MatchupResult[] {
    const matchups: MatchupResult[] = [];

    for (let i = 0; i < scoresForHole.length; i++) {
      for (let j = i + 1; j < scoresForHole.length; j++) {
        const score1 = scoresForHole[i];
        const score2 = scoresForHole[j];

        const net1 = this.calculateNetScoreForMatchup(
          score1,
          hole.holeNumber,
          score2.playerId,
          gameHandicaps,
        );
        const net2 = this.calculateNetScoreForMatchup(
          score2,
          hole.holeNumber,
          score1.playerId,
          gameHandicaps,
        );

        let winnerId: string | undefined;
        if (net1 < net2) {
          winnerId = score1.playerId;
        } else if (net2 < net1) {
          winnerId = score2.playerId;
        }

        matchups.push({
          player1Id: score1.playerId,
          player2Id: score2.playerId,
          player1Net: net1,
          player2Net: net2,
          winnerId,
          basePoints: 1.0,
        });
      }
    }

    return matchups;
  }
}
