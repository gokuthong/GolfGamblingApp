/**
 * Utility functions for managing player-vs-player per-hole handicaps
 */

/**
 * Creates a directional key for a player pair
 * @param fromPlayerId Player giving strokes
 * @param toPlayerId Player receiving strokes
 * @returns A key in format "fromPlayerId_toPlayerId" (NOT alphabetically sorted - directional!)
 */
export function createHandicapKey(
  fromPlayerId: string,
  toPlayerId: string,
): string {
  return `${fromPlayerId}_${toPlayerId}`;
}

/**
 * Gets the handicap strokes for a specific hole and matchup
 * @param handicaps The handicaps map from the game
 * @param holeNumber The hole number
 * @param fromPlayerId Player giving strokes
 * @param toPlayerId Player receiving strokes
 * @returns The number of strokes toPlayerId receives from fromPlayerId on this hole
 */
export function getHandicapForHole(
  handicaps:
    | { [pairKey: string]: { [holeNumber: string]: number } }
    | undefined,
  holeNumber: number,
  fromPlayerId: string,
  toPlayerId: string,
): number {
  if (!handicaps) return 0;

  const key = createHandicapKey(fromPlayerId, toPlayerId);
  const pairHandicaps = handicaps[key];

  if (!pairHandicaps) return 0;

  return pairHandicaps[holeNumber.toString()] || 0;
}

/**
 * Sets the handicap for a specific hole and player pair
 * @param handicaps Current handicaps map
 * @param holeNumber The hole number
 * @param fromPlayerId Player giving strokes
 * @param toPlayerId Player receiving strokes
 * @param strokes Number of strokes (0-9)
 * @returns Updated handicaps map
 */
export function setHandicapForHole(
  handicaps: { [pairKey: string]: { [holeNumber: string]: number } } = {},
  holeNumber: number,
  fromPlayerId: string,
  toPlayerId: string,
  strokes: number,
): { [pairKey: string]: { [holeNumber: string]: number } } {
  const key = createHandicapKey(fromPlayerId, toPlayerId);
  const holeKey = holeNumber.toString();

  const pairHandicaps = { ...(handicaps[key] || {}) };

  if (strokes === 0) {
    // Remove the hole entry if strokes is 0
    delete pairHandicaps[holeKey];
  } else {
    pairHandicaps[holeKey] = strokes;
  }

  // If no holes have handicaps for this pair, remove the pair entirely
  if (Object.keys(pairHandicaps).length === 0) {
    const { [key]: _, ...rest } = handicaps;
    return rest;
  }

  return {
    ...handicaps,
    [key]: pairHandicaps,
  };
}

/**
 * Gets all handicaps for a specific player pair across all holes
 * @param handicaps The handicaps map from the game
 * @param fromPlayerId Player giving strokes
 * @param toPlayerId Player receiving strokes
 * @returns Object mapping hole numbers to strokes
 */
export function getHandicapsForPair(
  handicaps:
    | { [pairKey: string]: { [holeNumber: string]: number } }
    | undefined,
  fromPlayerId: string,
  toPlayerId: string,
): { [holeNumber: string]: number } {
  if (!handicaps) return {};

  const key = createHandicapKey(fromPlayerId, toPlayerId);
  return handicaps[key] || {};
}

/**
 * Gets the total strokes a player receives across all holes in a matchup
 * @param handicaps The handicaps map from the game
 * @param fromPlayerId Player giving strokes
 * @param toPlayerId Player receiving strokes
 * @returns Total number of strokes across all holes
 */
export function getTotalHandicapForMatchup(
  handicaps:
    | { [pairKey: string]: { [holeNumber: string]: number } }
    | undefined,
  fromPlayerId: string,
  toPlayerId: string,
): number {
  const pairHandicaps = getHandicapsForPair(
    handicaps,
    fromPlayerId,
    toPlayerId,
  );
  return Object.values(pairHandicaps).reduce(
    (sum, strokes) => sum + strokes,
    0,
  );
}

/**
 * Gets all handicap relationships for a specific player
 * @param handicaps The handicaps map from the game
 * @param playerId The player ID
 * @param allPlayerIds All player IDs in the game
 * @returns Array of { opponentId, totalStrokesReceived, totalStrokesGiven }
 */
export function getPlayerHandicaps(
  handicaps:
    | { [pairKey: string]: { [holeNumber: string]: number } }
    | undefined,
  playerId: string,
  allPlayerIds: string[],
): Array<{
  opponentId: string;
  totalStrokesReceived: number;
  totalStrokesGiven: number;
}> {
  return allPlayerIds
    .filter((id) => id !== playerId)
    .map((opponentId) => ({
      opponentId,
      totalStrokesReceived: getTotalHandicapForMatchup(
        handicaps,
        opponentId,
        playerId,
      ),
      totalStrokesGiven: getTotalHandicapForMatchup(
        handicaps,
        playerId,
        opponentId,
      ),
    }));
}

/**
 * Compatibility function for old handicap system
 * @deprecated Use getTotalHandicapForMatchup instead
 */
export function getHandicapForMatchup(
  handicaps:
    | { [pairKey: string]: { [holeNumber: string]: number } }
    | undefined,
  fromPlayerId: string,
  toPlayerId: string,
): number {
  return getTotalHandicapForMatchup(handicaps, fromPlayerId, toPlayerId);
}

/**
 * Compatibility function for old handicap system
 * @deprecated Use setHandicapForHole instead
 */
export function setHandicapForPair(
  handicaps: { [pairKey: string]: { [holeNumber: string]: number } } = {},
  fromPlayerId: string,
  toPlayerId: string,
  strokes: number,
): { [pairKey: string]: { [holeNumber: string]: number } } {
  // This is a compatibility shim - it doesn't make sense in the new system
  // Just return the handicaps unchanged
  console.warn(
    "setHandicapForPair is deprecated - use setHandicapForHole instead",
  );
  return handicaps;
}
