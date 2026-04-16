import {
  Game,
  GameData,
  Hole,
  HoleData,
  Score,
  ScoreData,
  Player,
  PlayerData,
  Course,
  CourseData,
  CourseHole,
} from "../../types";
import { CONSTANTS } from "../../utils/constants";
import {
  generateId,
  serializeStoredGame,
  deserializeStoredGame,
  serializeCourse,
  deserializeCourse,
  isGameExpired,
  StorageKeys,
  StoredGame,
} from "./storageUtils";

/**
 * Helper to get all localStorage keys.
 * Browser localStorage doesn't have a getAllKeys() method,
 * so we iterate over its numeric indices.
 */
function getAllKeys(): string[] {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key !== null) {
      keys.push(key);
    }
  }
  return keys;
}

/**
 * Helper to remove multiple keys at once (mirrors AsyncStorage.multiRemove).
 */
function multiRemove(keys: string[]): void {
  for (const key of keys) {
    localStorage.removeItem(key);
  }
}

class LocalStorageService {
  // GAME OPERATIONS

  async createGame(
    playerIds: string[],
    userId?: string,
    courseId?: string,
    courseName?: string,
  ): Promise<string> {
    const gameId = generateId();
    const now = new Date();

    const game: Game = {
      id: gameId,
      date: now,
      status: "active",
      playerIds,
      createdAt: now,
      createdBy: userId,
      courseId,
      courseName,
    };

    const storedGame: StoredGame = {
      game,
      holes: [],
      scores: [],
    };

    localStorage.setItem(
      StorageKeys.game(gameId),
      serializeStoredGame(storedGame),
    );

    // Add to games index
    await this.addToGamesIndex(userId || "default", gameId);

    return gameId;
  }

  async getGame(gameId: string): Promise<Game | null> {
    try {
      const stored = localStorage.getItem(StorageKeys.game(gameId));
      if (!stored) return null;

      const { game } = deserializeStoredGame(stored);
      return game;
    } catch (error) {
      console.error("Error getting game:", error);
      return null;
    }
  }

  async updateGame(gameId: string, updates: Partial<GameData>): Promise<void> {
    const stored = localStorage.getItem(StorageKeys.game(gameId));
    if (!stored) {
      throw new Error("Game not found");
    }

    const storedGame = deserializeStoredGame(stored);
    storedGame.game = {
      ...storedGame.game,
      ...updates,
    };

    localStorage.setItem(
      StorageKeys.game(gameId),
      serializeStoredGame(storedGame),
    );
  }

  async completeGame(gameId: string): Promise<void> {
    await this.updateGame(gameId, {
      status: "completed",
      completedAt: new Date(),
    });

    // Get the game to find userId
    const game = await this.getGame(gameId);
    if (game && game.createdBy) {
      // Update index to ensure it's sorted by completion date
      await this.updateGamesIndex(game.createdBy);
      // Enforce game limit after completion
      await this.enforceGameLimit(game.createdBy, 5);
    }
  }

  async deleteGame(gameId: string): Promise<void> {
    // Get game to find userId
    const game = await this.getGame(gameId);
    const userId = game?.createdBy || "default";

    // Delete game data
    localStorage.removeItem(StorageKeys.game(gameId));

    // Remove from index
    await this.removeFromGamesIndex(userId, gameId);
  }

  async getActiveGamesForUser(userId: string): Promise<Game[]> {
    const allGames = await this.getGamesForUser(userId);
    return allGames
      .filter((game) => game.status === "active")
      .sort((a, b) => {
        const aTime = a.createdAt?.getTime() || 0;
        const bTime = b.createdAt?.getTime() || 0;
        return bTime - aTime; // descending order (most recent first)
      });
  }

  async getGamesForUser(userId: string): Promise<Game[]> {
    try {
      const indexKey = StorageKeys.gamesIndex(userId);
      const indexData = localStorage.getItem(indexKey);

      if (!indexData) {
        return [];
      }

      const gameIds: string[] = JSON.parse(indexData);
      const games: Game[] = [];

      for (const gameId of gameIds) {
        const game = await this.getGame(gameId);
        if (game) {
          games.push(game);
        }
      }

      return games.sort((a, b) => b.date.getTime() - a.date.getTime());
    } catch (error) {
      console.error("Error getting games for user:", error);
      return [];
    }
  }

  async getGameWithDetails(gameId: string): Promise<{
    game: Game;
    holes: Hole[];
    scores: Score[];
    players: Player[];
  } | null> {
    try {
      const stored = localStorage.getItem(StorageKeys.game(gameId));
      if (!stored) return null;

      const storedGame = deserializeStoredGame(stored);
      const players = await this.getPlayersForGame(storedGame.game);

      return {
        game: storedGame.game,
        holes: storedGame.holes,
        scores: storedGame.scores,
        players,
      };
    } catch (error) {
      console.error("Error getting game with details:", error);
      return null;
    }
  }

  async deleteGamesOlderThan(userId: string, days: number): Promise<number> {
    const games = await this.getGamesForUser(userId);
    const gamesToDelete = games.filter((game) => isGameExpired(game, days));

    for (const game of gamesToDelete) {
      await this.deleteGame(game.id);
    }

    return gamesToDelete.length;
  }

  /**
   * Enforce maximum number of completed games for a user
   * Deletes oldest completed games if limit exceeded
   */
  async enforceGameLimit(userId: string, maxGames: number): Promise<void> {
    const games = await this.getGamesForUser(userId);
    const completedGames = games
      .filter((game) => game.status === "completed")
      .sort((a, b) => {
        const aTime = a.completedAt?.getTime() || 0;
        const bTime = b.completedAt?.getTime() || 0;
        return bTime - aTime; // descending (newest first)
      });

    if (completedGames.length > maxGames) {
      const gamesToDelete = completedGames.slice(maxGames);
      for (const game of gamesToDelete) {
        await this.deleteGame(game.id);
      }
    }
  }

  // HOLE OPERATIONS

  async createHole(holeData: HoleData): Promise<string> {
    const holeId = generateId();
    const hole: Hole = {
      id: holeId,
      ...holeData,
    };

    // Get the game and add hole to it
    const stored = localStorage.getItem(StorageKeys.game(holeData.gameId));
    if (!stored) {
      throw new Error("Game not found");
    }

    const storedGame = deserializeStoredGame(stored);
    storedGame.holes.push(hole);

    localStorage.setItem(
      StorageKeys.game(holeData.gameId),
      serializeStoredGame(storedGame),
    );

    return holeId;
  }

  async updateHole(holeId: string, updates: Partial<HoleData>): Promise<void> {
    // Find the game that contains this hole
    const allKeys = getAllKeys();
    const gameKeys = allKeys.filter((key) => key.startsWith("@game:"));

    for (const gameKey of gameKeys) {
      const stored = localStorage.getItem(gameKey);
      if (!stored) continue;

      const storedGame = deserializeStoredGame(stored);
      const holeIndex = storedGame.holes.findIndex((h) => h.id === holeId);

      if (holeIndex !== -1) {
        storedGame.holes[holeIndex] = {
          ...storedGame.holes[holeIndex],
          ...updates,
        };
        localStorage.setItem(gameKey, serializeStoredGame(storedGame));
        return;
      }
    }

    throw new Error("Hole not found");
  }

  async batchUpdateHoles(
    holeUpdates: Array<{ holeId: string; updates: Partial<HoleData> }>,
  ): Promise<void> {
    for (const { holeId, updates } of holeUpdates) {
      await this.updateHole(holeId, updates);
    }
  }

  async getHolesForGame(gameId: string): Promise<Hole[]> {
    const stored = localStorage.getItem(StorageKeys.game(gameId));
    if (!stored) return [];

    const storedGame = deserializeStoredGame(stored);
    return storedGame.holes.sort((a, b) => a.holeNumber - b.holeNumber);
  }

  async initializeHolesForGame(gameId: string): Promise<void> {
    const holes: Hole[] = [];

    for (let i = 0; i < CONSTANTS.HOLES_PER_GAME; i++) {
      const hole: Hole = {
        id: generateId(),
        gameId,
        holeNumber: i + 1,
        par: CONSTANTS.STANDARD_PARS[i],
        index: i + 1,
        isUp: false,
        isBurn: false,
        confirmed: false,
      };
      holes.push(hole);
    }

    // Get the game and add holes
    const stored = localStorage.getItem(StorageKeys.game(gameId));
    if (!stored) {
      throw new Error("Game not found");
    }

    const storedGame = deserializeStoredGame(stored);
    storedGame.holes = holes;

    localStorage.setItem(
      StorageKeys.game(gameId),
      serializeStoredGame(storedGame),
    );
  }

  async initializeHolesForGameFromCourse(
    gameId: string,
    courseId: string,
  ): Promise<void> {
    const course = await this.getCourse(courseId);
    if (!course) {
      throw new Error("Course not found");
    }

    const holes: Hole[] = [];

    for (const courseHole of course.holes) {
      const hole: Hole = {
        id: generateId(),
        gameId,
        holeNumber: courseHole.holeNumber,
        par: courseHole.par,
        index: courseHole.index || courseHole.holeNumber,
        isUp: false,
        isBurn: false,
        confirmed: false,
      };
      holes.push(hole);
    }

    // Get the game and add holes
    const stored = localStorage.getItem(StorageKeys.game(gameId));
    if (!stored) {
      throw new Error("Game not found");
    }

    const storedGame = deserializeStoredGame(stored);
    storedGame.holes = holes;

    localStorage.setItem(
      StorageKeys.game(gameId),
      serializeStoredGame(storedGame),
    );
  }

  // SCORE OPERATIONS

  async upsertScore(scoreData: ScoreData): Promise<string> {
    const scoreId = `${scoreData.holeId}_${scoreData.playerId}`;

    // Find the game and update/add score
    const gameId = scoreData.gameId;
    if (!gameId) {
      throw new Error("gameId is required in scoreData");
    }

    const stored = localStorage.getItem(StorageKeys.game(gameId));
    if (!stored) {
      throw new Error("Game not found");
    }

    const storedGame = deserializeStoredGame(stored);
    const existingScoreIndex = storedGame.scores.findIndex(
      (s) => s.id === scoreId,
    );

    const score: Score = {
      id: scoreId,
      ...scoreData,
    };

    if (existingScoreIndex !== -1) {
      storedGame.scores[existingScoreIndex] = score;
    } else {
      storedGame.scores.push(score);
    }

    localStorage.setItem(
      StorageKeys.game(gameId),
      serializeStoredGame(storedGame),
    );

    return scoreId;
  }

  async batchUpsertScores(scoresData: ScoreData[]): Promise<void> {
    if (scoresData.length === 0) return;

    // Group scores by gameId
    const scoresByGame = scoresData.reduce(
      (acc, score) => {
        const gameId = score.gameId || "";
        if (!acc[gameId]) {
          acc[gameId] = [];
        }
        acc[gameId].push(score);
        return acc;
      },
      {} as Record<string, ScoreData[]>,
    );

    // Update each game
    for (const [gameId, scores] of Object.entries(scoresByGame)) {
      const stored = localStorage.getItem(StorageKeys.game(gameId));
      if (!stored) continue;

      const storedGame = deserializeStoredGame(stored);

      for (const scoreData of scores) {
        const scoreId = `${scoreData.holeId}_${scoreData.playerId}`;
        const existingScoreIndex = storedGame.scores.findIndex(
          (s) => s.id === scoreId,
        );

        const score: Score = {
          id: scoreId,
          ...scoreData,
        };

        if (existingScoreIndex !== -1) {
          storedGame.scores[existingScoreIndex] = score;
        } else {
          storedGame.scores.push(score);
        }
      }

      localStorage.setItem(
        StorageKeys.game(gameId),
        serializeStoredGame(storedGame),
      );
    }
  }

  async getScoresForHole(holeId: string): Promise<Score[]> {
    // Find all games and search for scores with this holeId
    const allKeys = getAllKeys();
    const gameKeys = allKeys.filter((key) => key.startsWith("@game:"));
    const scores: Score[] = [];

    for (const gameKey of gameKeys) {
      const stored = localStorage.getItem(gameKey);
      if (!stored) continue;

      const storedGame = deserializeStoredGame(stored);
      const holeScores = storedGame.scores.filter((s) => s.holeId === holeId);
      scores.push(...holeScores);
    }

    return scores;
  }

  async getScoresForGame(gameId: string): Promise<Score[]> {
    const stored = localStorage.getItem(StorageKeys.game(gameId));
    if (!stored) return [];

    const storedGame = deserializeStoredGame(stored);
    return storedGame.scores;
  }

  // Stream methods for compatibility with real-time updates
  // Note: These are not true streams since localStorage doesn't support real-time updates
  // They load data once and return an unsubscribe function (no-op)
  streamHolesForGame(
    gameId: string,
    callback: (holes: Hole[]) => void,
  ): () => void {
    // Load holes once and call callback
    this.getHolesForGame(gameId)
      .then(callback)
      .catch((error) => {
        console.error("Error streaming holes:", error);
        callback([]);
      });

    // Return unsubscribe function (no-op for localStorage)
    return () => {
      // No-op: localStorage doesn't have listeners to unsubscribe from
    };
  }

  streamScoresForGame(
    gameId: string,
    callback: (scores: Score[]) => void,
  ): () => void {
    // Load scores once and call callback
    this.getScoresForGame(gameId)
      .then(callback)
      .catch((error) => {
        console.error("Error streaming scores:", error);
        callback([]);
      });

    // Return unsubscribe function (no-op for localStorage)
    return () => {
      // No-op: localStorage doesn't have listeners to unsubscribe from
    };
  }

  // PLAYER OPERATIONS

  async createPlayer(playerData: {
    name: string;
    userId: string;
    isGuest?: boolean;
    userNumber?: string;
  }): Promise<string> {
    const playerId = generateId();
    const player: Player = {
      id: playerId,
      name: playerData.name,
      isGuest: playerData.isGuest || false,
      userId: playerData.userId,
      userNumber: playerData.userNumber,
      createdBy: playerData.userId,
    };

    // Get existing players for this user
    const players = await this.getAllPlayers(playerData.userId);
    players.push(player);

    localStorage.setItem(
      StorageKeys.players(playerData.userId),
      JSON.stringify(players),
    );

    return playerId;
  }

  async createPlayerLegacy(
    name: string,
    createdBy?: string,
    userNumber?: string,
    userId?: string,
    isGuest: boolean = false,
  ): Promise<string> {
    const playerId = generateId();
    const player: Player = {
      id: playerId,
      name,
      isGuest,
      createdBy,
      userNumber,
      userId,
    };

    const effectiveUserId = userId || createdBy || "default";
    const players = await this.getAllPlayers(effectiveUserId);
    players.push(player);

    localStorage.setItem(
      StorageKeys.players(effectiveUserId),
      JSON.stringify(players),
    );

    return playerId;
  }

  async getPlayer(playerId: string): Promise<Player | null> {
    // Search through all player lists
    const allKeys = getAllKeys();
    const playerKeys = allKeys.filter((key) => key.startsWith("@players:"));

    for (const key of playerKeys) {
      const stored = localStorage.getItem(key);
      if (!stored) continue;

      const players: Player[] = JSON.parse(stored);
      const player = players.find((p) => p.id === playerId);
      if (player) return player;
    }

    return null;
  }

  async getAllPlayers(userId?: string): Promise<Player[]> {
    try {
      if (userId) {
        const stored = localStorage.getItem(StorageKeys.players(userId));
        if (!stored) return [];
        const players: Player[] = JSON.parse(stored);
        return players.sort((a, b) => a.name.localeCompare(b.name));
      }

      // Get all players from all users
      const allKeys = getAllKeys();
      const playerKeys = allKeys.filter((key) => key.startsWith("@players:"));
      const allPlayers: Player[] = [];

      for (const key of playerKeys) {
        const stored = localStorage.getItem(key);
        if (stored) {
          const players: Player[] = JSON.parse(stored);
          allPlayers.push(...players);
        }
      }

      return allPlayers.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error("Error getting players:", error);
      return [];
    }
  }

  async updatePlayer(
    playerId: string,
    updates: Partial<PlayerData>,
  ): Promise<void> {
    // Find the player and update it
    const allKeys = getAllKeys();
    const playerKeys = allKeys.filter((key) => key.startsWith("@players:"));

    for (const key of playerKeys) {
      const stored = localStorage.getItem(key);
      if (!stored) continue;

      const players: Player[] = JSON.parse(stored);
      const playerIndex = players.findIndex((p) => p.id === playerId);

      if (playerIndex !== -1) {
        players[playerIndex] = {
          ...players[playerIndex],
          ...updates,
        };
        localStorage.setItem(key, JSON.stringify(players));
        return;
      }
    }

    throw new Error("Player not found");
  }

  async deletePlayer(playerId: string): Promise<void> {
    const allKeys = getAllKeys();
    const playerKeys = allKeys.filter((key) => key.startsWith("@players:"));

    for (const key of playerKeys) {
      const stored = localStorage.getItem(key);
      if (!stored) continue;

      const players: Player[] = JSON.parse(stored);
      const filteredPlayers = players.filter((p) => p.id !== playerId);

      if (filteredPlayers.length !== players.length) {
        localStorage.setItem(key, JSON.stringify(filteredPlayers));
        return;
      }
    }
  }

  async getAllRegisteredPlayers(): Promise<Player[]> {
    const allPlayers = await this.getAllPlayers();
    return allPlayers
      .filter((p) => !p.isGuest)
      .sort((a, b) => {
        const numA = parseInt(a.userNumber || "999");
        const numB = parseInt(b.userNumber || "999");
        return numA - numB;
      });
  }

  async searchUsers(searchTerm: string): Promise<Player[]> {
    const allPlayers = await this.getAllRegisteredPlayers();
    const lowerSearch = searchTerm.toLowerCase();

    return allPlayers.filter(
      (player) =>
        player.name.toLowerCase().includes(lowerSearch) ||
        player.userNumber?.includes(searchTerm),
    );
  }

  // COURSE OPERATIONS

  async createCourse(
    name: string,
    holes: CourseHole[],
    userId?: string,
  ): Promise<string> {
    const courseId = generateId();
    const now = new Date();

    const course: Course = {
      id: courseId,
      name,
      holes,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    };

    const effectiveUserId = userId || "default";
    const courses = await this.getAllCourses(effectiveUserId);
    courses.push(course);

    // Store all courses for this user
    localStorage.setItem(
      StorageKeys.courses(effectiveUserId),
      JSON.stringify(
        courses.map((c) => ({
          ...c,
          createdAt: c.createdAt?.toISOString(),
          updatedAt: c.updatedAt?.toISOString(),
        })),
      ),
    );

    return courseId;
  }

  async getCourse(courseId: string): Promise<Course | null> {
    // Search through all course lists
    const allKeys = getAllKeys();
    const courseKeys = allKeys.filter((key) => key.startsWith("@courses:"));

    for (const key of courseKeys) {
      const stored = localStorage.getItem(key);
      if (!stored) continue;

      const coursesData = JSON.parse(stored);
      const courses: Course[] = coursesData.map((c: any) => ({
        ...c,
        createdAt: c.createdAt ? new Date(c.createdAt) : undefined,
        updatedAt: c.updatedAt ? new Date(c.updatedAt) : undefined,
      }));

      const course = courses.find((c) => c.id === courseId);
      if (course) return course;
    }

    return null;
  }

  async updateCourse(
    courseId: string,
    updates: Partial<CourseData>,
  ): Promise<void> {
    const allKeys = getAllKeys();
    const courseKeys = allKeys.filter((key) => key.startsWith("@courses:"));

    for (const key of courseKeys) {
      const stored = localStorage.getItem(key);
      if (!stored) continue;

      const coursesData = JSON.parse(stored);
      const courses: Course[] = coursesData.map((c: any) => ({
        ...c,
        createdAt: c.createdAt ? new Date(c.createdAt) : undefined,
        updatedAt: c.updatedAt ? new Date(c.updatedAt) : undefined,
      }));

      const courseIndex = courses.findIndex((c) => c.id === courseId);

      if (courseIndex !== -1) {
        courses[courseIndex] = {
          ...courses[courseIndex],
          ...updates,
          updatedAt: new Date(),
        };

        localStorage.setItem(
          key,
          JSON.stringify(
            courses.map((c) => ({
              ...c,
              createdAt: c.createdAt?.toISOString(),
              updatedAt: c.updatedAt?.toISOString(),
            })),
          ),
        );
        return;
      }
    }

    throw new Error("Course not found");
  }

  async deleteCourse(courseId: string): Promise<void> {
    const allKeys = getAllKeys();
    const courseKeys = allKeys.filter((key) => key.startsWith("@courses:"));

    for (const key of courseKeys) {
      const stored = localStorage.getItem(key);
      if (!stored) continue;

      const coursesData = JSON.parse(stored);
      const courses: Course[] = coursesData.map((c: any) => ({
        ...c,
        createdAt: c.createdAt ? new Date(c.createdAt) : undefined,
        updatedAt: c.updatedAt ? new Date(c.updatedAt) : undefined,
      }));

      const filteredCourses = courses.filter((c) => c.id !== courseId);

      if (filteredCourses.length !== courses.length) {
        localStorage.setItem(
          key,
          JSON.stringify(
            filteredCourses.map((c) => ({
              ...c,
              createdAt: c.createdAt?.toISOString(),
              updatedAt: c.updatedAt?.toISOString(),
            })),
          ),
        );
        return;
      }
    }
  }

  async getAllCourses(userId?: string): Promise<Course[]> {
    try {
      if (userId) {
        const stored = localStorage.getItem(StorageKeys.courses(userId));
        if (!stored) return [];

        const coursesData = JSON.parse(stored);
        const courses: Course[] = coursesData.map((c: any) => ({
          ...c,
          createdAt: c.createdAt ? new Date(c.createdAt) : undefined,
          updatedAt: c.updatedAt ? new Date(c.updatedAt) : undefined,
        }));

        return courses.sort((a, b) => a.name.localeCompare(b.name));
      }

      // Get all courses from all users
      const allKeys = getAllKeys();
      const courseKeys = allKeys.filter((key) => key.startsWith("@courses:"));
      const allCourses: Course[] = [];

      for (const key of courseKeys) {
        const stored = localStorage.getItem(key);
        if (stored) {
          const coursesData = JSON.parse(stored);
          const courses: Course[] = coursesData.map((c: any) => ({
            ...c,
            createdAt: c.createdAt ? new Date(c.createdAt) : undefined,
            updatedAt: c.updatedAt ? new Date(c.updatedAt) : undefined,
          }));
          allCourses.push(...courses);
        }
      }

      return allCourses.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error("Error getting courses:", error);
      return [];
    }
  }

  // USER OPERATIONS

  async getNextUserNumber(): Promise<string> {
    try {
      const stored = localStorage.getItem("@userCounter");
      const currentNumber = stored ? parseInt(stored) : 0;
      const nextNumber = currentNumber + 1;

      localStorage.setItem("@userCounter", nextNumber.toString());

      return String(nextNumber).padStart(3, "0");
    } catch (error) {
      console.error("Error getting next user number:", error);
      return "001";
    }
  }

  async createUserProfile(
    userId: string,
    email: string,
    displayName: string,
  ): Promise<string> {
    const userNumber = await this.getNextUserNumber();

    const userData = {
      email,
      displayName,
      userNumber,
      createdAt: new Date().toISOString(),
      settings: {
        darkMode: false,
        hapticFeedback: true,
        defaultHandicap: 0,
      },
    };

    localStorage.setItem(`@user:${userId}`, JSON.stringify(userData));

    // Also create a player profile for this user
    await this.createPlayerLegacy(
      displayName,
      userId,
      userNumber,
      userId,
      false,
    );

    return userNumber;
  }

  async getUserProfile(userId: string): Promise<any> {
    try {
      const stored = localStorage.getItem(`@user:${userId}`);
      if (!stored) return null;

      const userData = JSON.parse(stored);
      return {
        id: userId,
        ...userData,
        createdAt: new Date(userData.createdAt),
      };
    } catch (error) {
      console.error("Error getting user profile:", error);
      return null;
    }
  }

  // BATCH OPERATIONS

  async getPlayersForGame(game: Game): Promise<Player[]> {
    if (game.playerIds.length === 0) {
      return [];
    }

    const players: Player[] = [];
    for (const playerId of game.playerIds) {
      const player = await this.getPlayer(playerId);
      if (player) {
        players.push(player);
      }
    }
    return players;
  }

  // HELPER METHODS FOR GAME INDEX MANAGEMENT

  private async addToGamesIndex(userId: string, gameId: string): Promise<void> {
    const indexKey = StorageKeys.gamesIndex(userId);
    const stored = localStorage.getItem(indexKey);
    const gameIds: string[] = stored ? JSON.parse(stored) : [];

    if (!gameIds.includes(gameId)) {
      gameIds.push(gameId);
      localStorage.setItem(indexKey, JSON.stringify(gameIds));
    }
  }

  private async removeFromGamesIndex(
    userId: string,
    gameId: string,
  ): Promise<void> {
    const indexKey = StorageKeys.gamesIndex(userId);
    const stored = localStorage.getItem(indexKey);
    if (!stored) return;

    const gameIds: string[] = JSON.parse(stored);
    const filteredIds = gameIds.filter((id) => id !== gameId);
    localStorage.setItem(indexKey, JSON.stringify(filteredIds));
  }

  private async updateGamesIndex(userId: string): Promise<void> {
    // Refresh and sort the games index by completion date
    const games = await this.getGamesForUser(userId);
    const sortedGameIds = games
      .sort((a, b) => {
        const aTime = a.completedAt?.getTime() || a.createdAt?.getTime() || 0;
        const bTime = b.completedAt?.getTime() || b.createdAt?.getTime() || 0;
        return bTime - aTime; // descending
      })
      .map((g) => g.id);

    localStorage.setItem(
      StorageKeys.gamesIndex(userId),
      JSON.stringify(sortedGameIds),
    );
  }

  // GUEST USER MANAGEMENT

  async createGuestProfile(deviceId: string): Promise<any> {
    const guestUser = {
      uid: deviceId,
      id: deviceId,
      email: null,
      displayName: "Guest",
      userNumber: "GUEST",
      role: "guest" as const,
      approvalStatus: "approved" as const,
      isOffline: true,
      createdAt: new Date(),
      settings: {
        darkMode: false,
        hapticFeedback: true,
        defaultHandicap: 0,
      },
    };

    localStorage.setItem(
      `@user:${deviceId}`,
      JSON.stringify({
        ...guestUser,
        createdAt: guestUser.createdAt.toISOString(),
      }),
    );

    return guestUser;
  }

  async upgradeGuestToUser(guestId: string, userData: any): Promise<void> {
    // This will be implemented when a guest signs up
    // For now, we'll just update the user profile
    localStorage.setItem(`@user:${guestId}`, JSON.stringify(userData));
  }

  // ROLE MANAGEMENT

  async getUserRole(userId: string): Promise<string> {
    try {
      const stored = localStorage.getItem(StorageKeys.userRole(userId));
      if (stored) return stored;

      // Fall back to checking user profile
      const profile = await this.getUserProfile(userId);
      return profile?.role || "user";
    } catch (error) {
      console.error("Error getting user role:", error);
      return "user";
    }
  }

  async setUserRole(userId: string, role: string): Promise<void> {
    localStorage.setItem(StorageKeys.userRole(userId), role);

    // Also update in user profile
    const profile = await this.getUserProfile(userId);
    if (profile) {
      localStorage.setItem(
        `@user:${userId}`,
        JSON.stringify({
          ...profile,
          role,
          createdAt: profile.createdAt?.toISOString
            ? profile.createdAt.toISOString()
            : profile.createdAt,
        }),
      );
    }
  }

  // APPROVAL STATUS MANAGEMENT

  async getApprovalStatus(userId: string): Promise<string> {
    try {
      const stored = localStorage.getItem(StorageKeys.userApprovalData(userId));
      if (stored) {
        const data = JSON.parse(stored);
        return data.status || "approved";
      }

      // Fall back to checking user profile
      const profile = await this.getUserProfile(userId);
      return profile?.approvalStatus || "approved";
    } catch (error) {
      console.error("Error getting approval status:", error);
      return "approved";
    }
  }

  async setApprovalStatus(userId: string, status: string): Promise<void> {
    const approvalData = {
      status,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(
      StorageKeys.userApprovalData(userId),
      JSON.stringify(approvalData),
    );

    // Also update in user profile
    const profile = await this.getUserProfile(userId);
    if (profile) {
      localStorage.setItem(
        `@user:${userId}`,
        JSON.stringify({
          ...profile,
          approvalStatus: status,
          createdAt: profile.createdAt?.toISOString
            ? profile.createdAt.toISOString()
            : profile.createdAt,
        }),
      );
    }
  }

  // PENDING USERS MANAGEMENT

  async addPendingUser(userId: string, userData: any): Promise<void> {
    const pendingUsers = await this.getPendingUsers();

    const pendingUser = {
      id: userId,
      email: userData.email,
      displayName: userData.displayName,
      userNumber: userData.userNumber,
      createdAt: new Date().toISOString(),
      avatarUrl: userData.avatarUrl,
    };

    pendingUsers.push(pendingUser);
    localStorage.setItem(
      StorageKeys.pendingUsers(),
      JSON.stringify(pendingUsers),
    );
  }

  async getPendingUsers(): Promise<any[]> {
    try {
      const stored = localStorage.getItem(StorageKeys.pendingUsers());
      if (!stored) return [];

      const users = JSON.parse(stored);
      return users.map((u: any) => ({
        ...u,
        createdAt: new Date(u.createdAt),
      }));
    } catch (error) {
      console.error("Error getting pending users:", error);
      return [];
    }
  }

  async removePendingUser(userId: string): Promise<void> {
    const pendingUsers = await this.getPendingUsers();
    const filtered = pendingUsers.filter((u) => u.id !== userId);
    localStorage.setItem(
      StorageKeys.pendingUsers(),
      JSON.stringify(
        filtered.map((u) => ({
          ...u,
          createdAt: u.createdAt?.toISOString
            ? u.createdAt.toISOString()
            : u.createdAt,
        })),
      ),
    );
  }

  async approvePendingUser(userId: string): Promise<void> {
    await this.setApprovalStatus(userId, "approved");
    await this.removePendingUser(userId);
  }

  async rejectPendingUser(userId: string): Promise<void> {
    await this.setApprovalStatus(userId, "rejected");
    await this.removePendingUser(userId);
  }

  // MIGRATION AND INITIALIZATION

  async migrateExistingUsers(): Promise<void> {
    try {
      const allKeys = getAllKeys();
      const userKeys = allKeys.filter(
        (key) =>
          key.startsWith("@user:") &&
          !key.includes(":approval:") &&
          !key.includes(":role:"),
      );

      for (const key of userKeys) {
        const stored = localStorage.getItem(key);
        if (!stored) continue;

        const userData = JSON.parse(stored);

        // Skip if already migrated (has role field)
        if (userData.role !== undefined) continue;

        // Add new fields
        const migrated = {
          ...userData,
          role: "user", // Default to regular user
          approvalStatus: "approved", // Existing users are auto-approved
          isOffline:
            userData.isOffline !== undefined ? userData.isOffline : false,
        };

        localStorage.setItem(key, JSON.stringify(migrated));

        // Set role in separate storage too
        const userId = key.replace("@user:", "");
        await this.setUserRole(userId, "user");
        await this.setApprovalStatus(userId, "approved");
      }

      console.log("User migration completed");
    } catch (error) {
      console.error("Error migrating users:", error);
    }
  }

  async initializeSuperAdmin(): Promise<void> {
    try {
      const allKeys = getAllKeys();
      const userKeys = allKeys.filter(
        (key) =>
          key.startsWith("@user:") &&
          !key.includes(":approval:") &&
          !key.includes(":role:"),
      );

      for (const key of userKeys) {
        const stored = localStorage.getItem(key);
        if (!stored) continue;

        const userData = JSON.parse(stored);

        // Check if this is KP by email or if already user 001
        if (
          userData.email === "kp.tey@outlook.com" ||
          userData.userNumber === "001"
        ) {
          const userId = key.replace("@user:", "");
          await this.setUserRole(userId, "super_admin");

          // Update user profile with super_admin role and user number 001
          const updated = {
            ...userData,
            userNumber: "001",
            role: "super_admin",
            approvalStatus: "approved",
          };
          localStorage.setItem(key, JSON.stringify(updated));

          console.log("Super admin initialized:", userData.email);
          break;
        }
      }
    } catch (error) {
      console.error("Error initializing super admin:", error);
    }
  }

  async clearAllUsers(): Promise<{ success: boolean; message: string }> {
    try {
      console.log("Clearing all users...");

      const allKeys = getAllKeys();
      const userKeys = allKeys.filter(
        (key) =>
          key.startsWith("@user:") ||
          key.startsWith("@userCounter") ||
          key.startsWith("@auth:pendingUsers"),
      );

      console.log(`Found ${userKeys.length} user-related keys to delete`);

      // Delete all user-related keys
      multiRemove(userKeys);

      // Reset user counter to 0
      localStorage.setItem("@userCounter", "0");

      console.log("All users cleared. Next signup will be User #001");

      return {
        success: true,
        message:
          "All users cleared successfully. Next signup will be User #001 (super admin)",
      };
    } catch (error) {
      console.error("Error clearing users:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // USER MANAGEMENT

  async getAllUsers(): Promise<any[]> {
    try {
      const allKeys = getAllKeys();
      const userKeys = allKeys.filter(
        (key) =>
          key.startsWith("@user:") &&
          !key.includes(":approval:") &&
          !key.includes(":role:"),
      );

      const users = [];
      for (const key of userKeys) {
        const stored = localStorage.getItem(key);
        if (!stored) continue;

        const userData = JSON.parse(stored);
        const userId = key.replace("@user:", "");

        // Skip guest users
        if (userData.role === "guest" || userData.isOffline) continue;

        users.push({
          id: userId,
          email: userData.email,
          displayName: userData.displayName,
          userNumber: userData.userNumber,
          role: userData.role || "user",
          approvalStatus: userData.approvalStatus || "approved",
          createdAt: userData.createdAt
            ? new Date(userData.createdAt)
            : new Date(),
        });
      }

      // Sort by user number
      return users.sort((a, b) => {
        const numA = parseInt(a.userNumber);
        const numB = parseInt(b.userNumber);
        return numA - numB;
      });
    } catch (error) {
      console.error("Error getting all users:", error);
      return [];
    }
  }

  async getUserStats(userId: string): Promise<any> {
    try {
      const games = await this.getGamesForUser(userId);
      const completedGames = games.filter((g) => g.status === "completed");

      let totalPoints = 0;
      let wins = 0;
      let losses = 0;

      for (const game of completedGames) {
        const gameDetails = await this.getGameWithDetails(game.id);
        if (!gameDetails) continue;

        const { holes, scores, players } = gameDetails;

        // Calculate total points for this user
        const scoresByHoleId: Record<string, any[]> = {};
        scores.forEach((score) => {
          if (!scoresByHoleId[score.holeId]) scoresByHoleId[score.holeId] = [];
          scoresByHoleId[score.holeId].push(score);
        });

        let gamePoints = 0;
        holes.forEach((hole) => {
          const holeScores = scoresByHoleId[hole.id] || [];
          const userScore = holeScores.find((s) => s.playerId === userId);
          if (userScore) {
            // Simple points calculation (you can enhance this based on your scoring logic)
            gamePoints += userScore.points || 0;
          }
        });

        totalPoints += gamePoints;

        // Determine if this was a win (simple: positive points)
        if (gamePoints > 0) wins++;
        else if (gamePoints < 0) losses++;
      }

      return {
        gamesPlayed: completedGames.length,
        totalPoints,
        wins,
        losses,
        winRate:
          completedGames.length > 0
            ? ((wins / completedGames.length) * 100).toFixed(1)
            : "0.0",
      };
    } catch (error) {
      console.error("Error getting user stats:", error);
      return {
        gamesPlayed: 0,
        totalPoints: 0,
        wins: 0,
        losses: 0,
        winRate: "0.0",
      };
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      // Delete user profile
      localStorage.removeItem(`@user:${userId}`);

      // Delete user's approval data
      localStorage.removeItem(StorageKeys.userApprovalData(userId));

      // Delete user's role data
      localStorage.removeItem(StorageKeys.userRole(userId));

      // Delete user's games
      const games = await this.getGamesForUser(userId);
      for (const game of games) {
        await this.deleteGame(game.id);
      }

      // Delete user's games index
      localStorage.removeItem(StorageKeys.gamesIndex(userId));

      // Delete user's players
      localStorage.removeItem(StorageKeys.players(userId));

      // Delete user's courses
      localStorage.removeItem(StorageKeys.courses(userId));

      // Remove from pending users if present
      await this.removePendingUser(userId);

      console.log(`Deleted user ${userId} and all associated data`);
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  }
}

export const localStorageService = new LocalStorageService();
