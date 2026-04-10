/**
 * Database cleanup utilities for fixing multiplier issues
 * Run these if you're experiencing incorrect point calculations
 */

import { firestoreService } from '../services/firebase';

/**
 * Resets all hole-level multiplier flags (isUp, isBurn) to false for a game
 * This fixes issues from the old hole-level multiplier system
 */
export async function resetHoleMultipliers(gameId: string): Promise<void> {
  console.log(`Resetting hole multipliers for game ${gameId}...`);

  const holes = await firestoreService.getHolesForGame(gameId);

  for (const hole of holes) {
    await firestoreService.updateHole(hole.id, {
      isUp: false,
      isBurn: false,
    });
  }

  console.log(`Reset ${holes.length} holes`);
}

/**
 * Ensures all scores have the new per-player multiplier fields
 * Sets isUp and isBurn to false if they don't exist
 */
export async function initializeScoreMultipliers(gameId: string): Promise<void> {
  console.log(`Initializing score multipliers for game ${gameId}...`);

  const scores = await firestoreService.getScoresForGame(gameId);

  for (const score of scores) {
    // Only update if the fields are missing
    if (score.isUp === undefined || score.isBurn === undefined) {
      await firestoreService.upsertScore({
        holeId: score.holeId,
        playerId: score.playerId,
        gameId: score.gameId,
        strokes: score.strokes,
        handicap: score.handicap,
        isUp: score.isUp || false,
        isBurn: score.isBurn || false,
      });
    }
  }

  console.log(`Initialized ${scores.length} scores`);
}

/**
 * Complete cleanup for a game - resets everything to clean state
 */
export async function cleanupGame(gameId: string): Promise<void> {
  console.log(`Running complete cleanup for game ${gameId}...`);

  await resetHoleMultipliers(gameId);
  await initializeScoreMultipliers(gameId);

  console.log('Cleanup complete!');
}
