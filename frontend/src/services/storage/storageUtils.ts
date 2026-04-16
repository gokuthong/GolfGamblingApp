import { Game, GameData } from "../../types/game";
import { Hole, HoleData } from "../../types/hole";
import { Score, ScoreData } from "../../types/score";
import { Player, PlayerData } from "../../types/player";
import { Course, CourseData } from "../../types/course";

/**
 * Generate a unique ID (UUID v4)
 */
export function generateId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Serialize a Game object for storage (convert Dates to ISO strings)
 */
export function serializeGame(game: Game): string {
  const serialized = {
    ...game,
    date: game.date.toISOString(),
    createdAt: game.createdAt?.toISOString(),
    completedAt: game.completedAt?.toISOString(),
  };
  return JSON.stringify(serialized);
}

/**
 * Deserialize a Game object from storage (convert ISO strings to Dates)
 */
export function deserializeGame(json: string): Game {
  const parsed = JSON.parse(json);
  return {
    ...parsed,
    date: new Date(parsed.date),
    createdAt: parsed.createdAt ? new Date(parsed.createdAt) : undefined,
    completedAt: parsed.completedAt ? new Date(parsed.completedAt) : undefined,
  };
}

/**
 * Serialize a Course object for storage (convert Dates to ISO strings)
 */
export function serializeCourse(course: Course): string {
  const serialized = {
    ...course,
    createdAt: course.createdAt?.toISOString(),
    updatedAt: course.updatedAt?.toISOString(),
  };
  return JSON.stringify(serialized);
}

/**
 * Deserialize a Course object from storage (convert ISO strings to Dates)
 */
export function deserializeCourse(json: string): Course {
  const parsed = JSON.parse(json);
  return {
    ...parsed,
    createdAt: parsed.createdAt ? new Date(parsed.createdAt) : undefined,
    updatedAt: parsed.updatedAt ? new Date(parsed.updatedAt) : undefined,
  };
}

/**
 * Check if a game has expired (older than specified days)
 */
export function isGameExpired(game: Game, days: number): boolean {
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() - days);

  // Check completedAt first, fall back to createdAt, then date
  const gameDate = game.completedAt || game.createdAt || game.date;
  return gameDate < expirationDate;
}

/**
 * Storage key generators
 */
export const StorageKeys = {
  gamesIndex: (userId: string) => `@games:index:${userId}`,
  game: (gameId: string) => `@game:${gameId}`,
  players: (userId: string) => `@players:${userId}`,
  courses: (userId: string) => `@courses:${userId}`,
  offlineMode: () => "@auth:offlineMode",
  deviceId: () => "@auth:deviceId",
  pendingUsers: () => "@auth:pendingUsers",
  userApprovalData: (userId: string) => `@user:approval:${userId}`,
  userRole: (userId: string) => `@user:role:${userId}`,
  syncDirtyEntities: () => "@sync:dirtyEntities",
  syncPendingDeletes: () => "@sync:pendingDeletes",
  cacheSeeded: (userId: string) => `@cache:seeded:${userId}`,
};

/**
 * Interface for stored game with embedded data
 */
export interface StoredGame {
  game: Game;
  holes: Hole[];
  scores: Score[];
}

/**
 * Serialize a complete game with holes and scores
 */
export function serializeStoredGame(data: StoredGame): string {
  const serialized = {
    game: {
      ...data.game,
      date: data.game.date.toISOString(),
      createdAt: data.game.createdAt?.toISOString(),
      completedAt: data.game.completedAt?.toISOString(),
    },
    holes: data.holes,
    scores: data.scores,
  };
  return JSON.stringify(serialized);
}

/**
 * Deserialize a complete game with holes and scores
 */
export function deserializeStoredGame(json: string): StoredGame {
  const parsed = JSON.parse(json);
  return {
    game: {
      ...parsed.game,
      date: new Date(parsed.game.date),
      createdAt: parsed.game.createdAt
        ? new Date(parsed.game.createdAt)
        : undefined,
      completedAt: parsed.game.completedAt
        ? new Date(parsed.game.completedAt)
        : undefined,
    },
    holes: parsed.holes || [],
    scores: parsed.scores || [],
  };
}
