import { firestoreService } from "./firebase/firestore";
import { localStorageService } from "./storage/LocalStorageService";
import { StorageKeys } from "./storage/storageUtils";
import { connectivityManager } from "./connectivity";
import { syncService } from "./sync";
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
} from "../types";

type ServiceMode = "online" | "offline";

class DataService {
  private mode: ServiceMode = "offline";
  private userId: string | null = null;

  setMode(mode: ServiceMode, userId?: string) {
    this.mode = mode;
    this.userId = userId || null;
  }

  getMode(): ServiceMode {
    return this.mode;
  }

  private get isOnline(): boolean {
    return this.mode === "online";
  }

  /**
   * Try to sync an entity to Firestore. If offline or on error, mark dirty for later sync.
   */
  private async syncToFirestore(
    entityType: string,
    entityId: string,
    firestoreOp: () => Promise<void>,
  ): Promise<void> {
    if (!connectivityManager.isOnline) {
      await syncService.markDirty({ entityType, entityId });
      return;
    }
    try {
      await firestoreOp();
    } catch (error) {
      console.error(
        `DataService: Firestore sync failed for ${entityType}:${entityId}, marking dirty`,
        error,
      );
      await syncService.markDirty({ entityType, entityId });
    }
  }

  /**
   * Try to delete from Firestore. If offline or on error, queue for later delete.
   */
  private async syncDeleteToFirestore(
    entityType: string,
    entityId: string,
    firestoreOp: () => Promise<void>,
  ): Promise<void> {
    if (!connectivityManager.isOnline) {
      await syncService.markDelete({ entityType, entityId });
      return;
    }
    try {
      await firestoreOp();
    } catch (error) {
      console.error(
        `DataService: Firestore delete failed for ${entityType}:${entityId}, queuing`,
        error,
      );
      await syncService.markDelete({ entityType, entityId });
    }
  }

  /**
   * Read with local-first strategy (default).
   *
   * In dual-write mode local storage is always written first, so it has
   * the freshest data for the current user's entities.  Firestore may lag
   * behind because sync is fire-and-forget.
   *
   * Default (local-first):
   *   1. Read from local storage.
   *   2. If local returned null/undefined/empty-array, try Firestore.
   *
   * With `preferFirestore` (for multi-user queries where local may not
   * have other users' data):
   *   1. Read from Firestore.
   *   2. On error, fall back to local.
   */
  private async readWithFallback<T>(
    firestoreOp: () => Promise<T>,
    localOp: () => Promise<T>,
    options?: { preferFirestore?: boolean },
  ): Promise<T> {
    if (!connectivityManager.isOnline) {
      return localOp();
    }

    if (options?.preferFirestore) {
      // Firestore-first for multi-user data
      try {
        return await firestoreOp();
      } catch (error) {
        console.warn(
          "DataService: Firestore read failed, falling back to local",
          error,
        );
        return localOp();
      }
    }

    // Default: local-first
    const localResult = await localOp();

    // If local has meaningful data, return it
    if (localResult !== null && localResult !== undefined) {
      if (!Array.isArray(localResult) || localResult.length > 0) {
        return localResult;
      }
    }

    // Local returned null/undefined/empty-array — try Firestore
    try {
      return await firestoreOp();
    } catch (error) {
      console.warn("DataService: Firestore read also failed", error);
      return localResult;
    }
  }

  // ========== GAME OPERATIONS ==========

  async createGame(
    playerIds: string[],
    userId?: string,
    courseId?: string,
    courseName?: string,
  ): Promise<string> {
    if (!this.isOnline) {
      return localStorageService.createGame(
        playerIds,
        userId,
        courseId,
        courseName,
      );
    }

    // Always write to local first (generates a UUID)
    const gameId = await localStorageService.createGame(
      playerIds,
      userId,
      courseId,
      courseName,
    );

    // Mark dirty and let SyncService push with setDoc using the same UUID.
    // Do NOT call firestoreService.createGame — it uses addDoc which generates a different ID.
    await syncService.markDirty({ entityType: "game", entityId: gameId });
    syncService.syncAll();

    return gameId;
  }

  async getGame(gameId: string): Promise<Game | null> {
    if (!this.isOnline) {
      return localStorageService.getGame(gameId);
    }

    return this.readWithFallback(
      () => firestoreService.getGame(gameId),
      () => localStorageService.getGame(gameId),
    );
  }

  async updateGame(gameId: string, updates: Partial<GameData>): Promise<void> {
    if (!this.isOnline) {
      return localStorageService.updateGame(gameId, updates);
    }

    await localStorageService.updateGame(gameId, updates);

    this.syncToFirestore("game", gameId, async () => {
      await firestoreService.updateGame(gameId, updates);
    });
  }

  async completeGame(gameId: string): Promise<void> {
    if (!this.isOnline) {
      return localStorageService.completeGame(gameId);
    }

    await localStorageService.completeGame(gameId);

    // Push the full game (game doc + holes + scores) to Firestore via setDoc.
    // updateDoc-based completion only writes status+completedAt, and individual
    // upsertScore writes are fire-and-forget — so without this, scores entered
    // on this device can fail to reach Firestore and other devices read 0s.
    if (connectivityManager.isOnline) {
      try {
        await syncService.pushGame(gameId);
        return;
      } catch (error) {
        console.error(
          "DataService: pushGame failed during completeGame, marking dirty for later sync",
          error,
        );
      }
    }
    await syncService.markDirty({ entityType: "game", entityId: gameId });
  }

  async deleteGame(gameId: string): Promise<void> {
    if (!this.isOnline) {
      return localStorageService.deleteGame(gameId);
    }

    await localStorageService.deleteGame(gameId);

    this.syncDeleteToFirestore("game", gameId, async () => {
      await firestoreService.deleteGame(gameId);
    });
  }

  async getActiveGamesForUser(userId: string): Promise<Game[]> {
    if (!this.isOnline) {
      return localStorageService.getActiveGamesForUser(userId);
    }

    // Prefer Firestore so completed games disappear from active list immediately
    return this.readWithFallback(
      () => firestoreService.getActiveGamesForUser(userId),
      () => localStorageService.getActiveGamesForUser(userId),
      { preferFirestore: true },
    );
  }

  async getGamesForUser(userId: string): Promise<Game[]> {
    if (!this.isOnline) {
      return localStorageService.getGamesForUser(userId);
    }

    // Prefer Firestore for game lists — local-first can return stale status
    // (e.g. game still shows "active" locally when Firestore has "completed")
    return this.readWithFallback(
      () => firestoreService.getGamesForUser(userId),
      () => localStorageService.getGamesForUser(userId),
      { preferFirestore: true },
    );
  }

  async getGameWithDetails(gameId: string): Promise<{
    game: Game;
    holes: Hole[];
    scores: Score[];
    players: Player[];
  } | null> {
    if (!this.isOnline) {
      return localStorageService.getGameWithDetails(gameId);
    }

    return this.readWithFallback(
      () => firestoreService.getGameWithDetails(gameId),
      () => localStorageService.getGameWithDetails(gameId),
    );
  }

  async deleteGamesOlderThan(userId: string, days: number): Promise<number> {
    if (!this.isOnline) {
      return localStorageService.deleteGamesOlderThan(userId, days);
    }

    // Delete from local first
    const localDeleted = await localStorageService.deleteGamesOlderThan(
      userId,
      days,
    );

    // Try Firestore cleanup too
    if (connectivityManager.isOnline) {
      try {
        await firestoreService.deleteGamesOlderThan(userId, days);
      } catch (error) {
        console.warn(
          "DataService: Firestore deleteGamesOlderThan failed",
          error,
        );
      }
    }

    return localDeleted;
  }

  async enforceGameLimit(userId: string, maxGames: number): Promise<void> {
    if (!this.isOnline) {
      return localStorageService.enforceGameLimit(userId, maxGames);
    }

    await localStorageService.enforceGameLimit(userId, maxGames);

    if (connectivityManager.isOnline) {
      try {
        await firestoreService.enforceGameLimit(userId, maxGames);
      } catch (error) {
        console.warn("DataService: Firestore enforceGameLimit failed", error);
      }
    }
  }

  // ========== HOLE OPERATIONS ==========

  async createHole(holeData: HoleData): Promise<string> {
    if (!this.isOnline) {
      return localStorageService.createHole(holeData);
    }

    const holeId = await localStorageService.createHole(holeData);

    // Mark the parent game as dirty — SyncService pushes the full game (with holes) using setDoc
    await syncService.markDirty({
      entityType: "game",
      entityId: holeData.gameId,
    });
    syncService.syncAll();

    return holeId;
  }

  async updateHole(holeId: string, updates: Partial<HoleData>): Promise<void> {
    if (!this.isOnline) {
      return localStorageService.updateHole(holeId, updates);
    }

    await localStorageService.updateHole(holeId, updates);

    // We need the gameId to mark dirty. Updates include gameId sometimes, otherwise
    // we mark dirty after the Firestore op or on failure.
    const gameId = updates.gameId;
    if (gameId) {
      this.syncToFirestore("game", gameId, async () => {
        await firestoreService.updateHole(holeId, updates);
      });
    } else {
      // Try Firestore directly; on failure mark dirty via the hole lookup
      if (connectivityManager.isOnline) {
        try {
          await firestoreService.updateHole(holeId, updates);
        } catch (error) {
          // We don't know the gameId here — try to find it from local storage
          const holesGame = await this.findGameIdForHole(holeId);
          if (holesGame) {
            await syncService.markDirty({
              entityType: "game",
              entityId: holesGame,
            });
          }
        }
      } else {
        const holesGame = await this.findGameIdForHole(holeId);
        if (holesGame) {
          await syncService.markDirty({
            entityType: "game",
            entityId: holesGame,
          });
        }
      }
    }
  }

  async batchUpdateHoles(
    holeUpdates: Array<{ holeId: string; updates: Partial<HoleData> }>,
  ): Promise<void> {
    if (!this.isOnline) {
      return localStorageService.batchUpdateHoles(holeUpdates);
    }

    await localStorageService.batchUpdateHoles(holeUpdates);

    // Collect unique gameIds from updates
    const gameIds = new Set<string>();
    for (const { updates } of holeUpdates) {
      if (updates.gameId) gameIds.add(updates.gameId);
    }

    if (connectivityManager.isOnline) {
      try {
        await firestoreService.batchUpdateHoles(holeUpdates);
      } catch (error) {
        // Mark all affected games as dirty
        for (const gameId of gameIds) {
          await syncService.markDirty({ entityType: "game", entityId: gameId });
        }
        // If we couldn't determine gameIds from updates, try to find them
        if (gameIds.size === 0 && holeUpdates.length > 0) {
          const foundGameId = await this.findGameIdForHole(
            holeUpdates[0].holeId,
          );
          if (foundGameId) {
            await syncService.markDirty({
              entityType: "game",
              entityId: foundGameId,
            });
          }
        }
      }
    } else {
      for (const gameId of gameIds) {
        await syncService.markDirty({ entityType: "game", entityId: gameId });
      }
      if (gameIds.size === 0 && holeUpdates.length > 0) {
        const foundGameId = await this.findGameIdForHole(holeUpdates[0].holeId);
        if (foundGameId) {
          await syncService.markDirty({
            entityType: "game",
            entityId: foundGameId,
          });
        }
      }
    }
  }

  async getHolesForGame(gameId: string): Promise<Hole[]> {
    if (!this.isOnline) {
      return localStorageService.getHolesForGame(gameId);
    }

    return this.readWithFallback(
      () => firestoreService.getHolesForGame(gameId),
      () => localStorageService.getHolesForGame(gameId),
    );
  }

  async initializeHolesForGame(gameId: string): Promise<void> {
    if (!this.isOnline) {
      return localStorageService.initializeHolesForGame(gameId);
    }

    await localStorageService.initializeHolesForGame(gameId);

    // Mark game dirty — SyncService pushes full game+holes using setDoc
    await syncService.markDirty({ entityType: "game", entityId: gameId });
    syncService.syncAll();
  }

  async initializeHolesForGameFromCourse(
    gameId: string,
    courseId: string,
  ): Promise<void> {
    if (!this.isOnline) {
      return localStorageService.initializeHolesForGameFromCourse(
        gameId,
        courseId,
      );
    }

    // The course must exist locally for local initialization.
    // If it doesn't (e.g. only in Firestore), fetch it first.
    let localCourse = await localStorageService.getCourse(courseId);
    if (!localCourse && connectivityManager.isOnline) {
      try {
        const firestoreCourse = await firestoreService.getCourse(courseId);
        if (firestoreCourse) {
          // Seed this course into local storage so initializeHolesForGameFromCourse works
          const userId = firestoreCourse.createdBy || this.userId || "default";
          const courses = await localStorageService.getAllCourses(userId);
          if (!courses.find((c) => c.id === firestoreCourse.id)) {
            courses.push(firestoreCourse);
            localStorage.setItem(
              StorageKeys.courses(userId),
              JSON.stringify(
                courses.map((c) => ({
                  ...c,
                  createdAt: c.createdAt?.toISOString?.() || c.createdAt,
                  updatedAt: c.updatedAt?.toISOString?.() || c.updatedAt,
                })),
              ),
            );
          }
          localCourse = firestoreCourse;
        }
      } catch (error) {
        console.error(
          "DataService: Failed to fetch course from Firestore for local seeding",
          error,
        );
      }
    }

    if (!localCourse) {
      throw new Error("Course not found");
    }

    await localStorageService.initializeHolesForGameFromCourse(
      gameId,
      courseId,
    );

    // Mark game dirty — SyncService pushes full game+holes using setDoc
    await syncService.markDirty({ entityType: "game", entityId: gameId });
    syncService.syncAll();
  }

  // ========== SCORE OPERATIONS ==========

  async upsertScore(scoreData: ScoreData): Promise<string> {
    if (!this.isOnline) {
      return localStorageService.upsertScore(scoreData);
    }

    const scoreId = await localStorageService.upsertScore(scoreData);

    // Mark the parent game as dirty
    if (scoreData.gameId) {
      this.syncToFirestore("game", scoreData.gameId, async () => {
        await firestoreService.upsertScore(scoreData);
      });
    }

    return scoreId;
  }

  async batchUpsertScores(scoresData: ScoreData[]): Promise<void> {
    if (!this.isOnline) {
      return localStorageService.batchUpsertScores(scoresData);
    }

    await localStorageService.batchUpsertScores(scoresData);

    // Collect unique gameIds
    const gameIds = new Set<string>();
    for (const s of scoresData) {
      if (s.gameId) gameIds.add(s.gameId);
    }

    if (connectivityManager.isOnline) {
      try {
        await firestoreService.batchUpsertScores(scoresData);
      } catch (error) {
        for (const gameId of gameIds) {
          await syncService.markDirty({ entityType: "game", entityId: gameId });
        }
      }
    } else {
      for (const gameId of gameIds) {
        await syncService.markDirty({ entityType: "game", entityId: gameId });
      }
    }
  }

  async getScoresForHole(holeId: string): Promise<Score[]> {
    if (!this.isOnline) {
      return localStorageService.getScoresForHole(holeId);
    }

    return this.readWithFallback(
      () => firestoreService.getScoresForHole(holeId),
      () => localStorageService.getScoresForHole(holeId),
    );
  }

  async getScoresForGame(gameId: string): Promise<Score[]> {
    if (!this.isOnline) {
      return localStorageService.getScoresForGame(gameId);
    }

    return this.readWithFallback(
      () => firestoreService.getScoresForGame(gameId),
      () => localStorageService.getScoresForGame(gameId),
    );
  }

  // ========== PLAYER OPERATIONS ==========

  async createPlayer(playerData: {
    name: string;
    userId: string;
    isGuest?: boolean;
    userNumber?: string;
  }): Promise<string> {
    if (!this.isOnline) {
      return localStorageService.createPlayer(playerData);
    }

    const playerId = await localStorageService.createPlayer(playerData);

    // Mark dirty — SyncService pushes with setDoc using the same UUID
    await syncService.markDirty({ entityType: "player", entityId: playerId });
    syncService.syncAll();

    return playerId;
  }

  async createPlayerLegacy(
    name: string,
    createdBy?: string,
    userNumber?: string,
    userId?: string,
    isGuest: boolean = false,
  ): Promise<string> {
    if (!this.isOnline) {
      return localStorageService.createPlayerLegacy(
        name,
        createdBy,
        userNumber,
        userId,
        isGuest,
      );
    }

    const playerId = await localStorageService.createPlayerLegacy(
      name,
      createdBy,
      userNumber,
      userId,
      isGuest,
    );

    // Mark dirty — SyncService pushes with setDoc using the same UUID
    await syncService.markDirty({ entityType: "player", entityId: playerId });
    syncService.syncAll();

    return playerId;
  }

  async getPlayer(playerId: string): Promise<Player | null> {
    if (!this.isOnline) {
      return localStorageService.getPlayer(playerId);
    }

    return this.readWithFallback(
      () => firestoreService.getPlayer(playerId),
      () => localStorageService.getPlayer(playerId),
    );
  }

  async getAllPlayers(userId?: string): Promise<Player[]> {
    if (!this.isOnline) {
      return localStorageService.getAllPlayers(userId);
    }

    return this.readWithFallback(
      () => firestoreService.getAllPlayers(),
      () => localStorageService.getAllPlayers(userId),
    );
  }

  async updatePlayer(
    playerId: string,
    updates: Partial<PlayerData>,
  ): Promise<void> {
    if (!this.isOnline) {
      return localStorageService.updatePlayer(playerId, updates);
    }

    await localStorageService.updatePlayer(playerId, updates);

    this.syncToFirestore("player", playerId, async () => {
      await firestoreService.updatePlayer(playerId, updates);
    });
  }

  async deletePlayer(playerId: string): Promise<void> {
    if (!this.isOnline) {
      return localStorageService.deletePlayer(playerId);
    }

    await localStorageService.deletePlayer(playerId);

    this.syncDeleteToFirestore("player", playerId, async () => {
      await firestoreService.deletePlayer(playerId);
    });
  }

  async getAllRegisteredPlayers(): Promise<Player[]> {
    if (!this.isOnline) {
      return localStorageService.getAllRegisteredPlayers();
    }

    return this.readWithFallback(
      () => firestoreService.getAllRegisteredPlayers(),
      () => localStorageService.getAllRegisteredPlayers(),
      { preferFirestore: true },
    );
  }

  async searchUsers(searchTerm: string): Promise<Player[]> {
    if (!this.isOnline) {
      return localStorageService.searchUsers(searchTerm);
    }

    return this.readWithFallback(
      () => firestoreService.searchUsers(searchTerm),
      () => localStorageService.searchUsers(searchTerm),
      { preferFirestore: true },
    );
  }

  // ========== COURSE OPERATIONS ==========

  async createCourse(
    name: string,
    holes: CourseHole[] | { holeNumber: number; par: number }[],
    userId?: string,
  ): Promise<string> {
    if (!this.isOnline) {
      return localStorageService.createCourse(
        name,
        holes as CourseHole[],
        userId,
      );
    }

    const courseId = await localStorageService.createCourse(
      name,
      holes as CourseHole[],
      userId,
    );

    // Mark dirty — SyncService pushes with setDoc using the same UUID
    await syncService.markDirty({ entityType: "course", entityId: courseId });
    syncService.syncAll();

    return courseId;
  }

  async getCourse(courseId: string): Promise<Course | null> {
    if (!this.isOnline) {
      return localStorageService.getCourse(courseId);
    }

    return this.readWithFallback(
      () => firestoreService.getCourse(courseId),
      () => localStorageService.getCourse(courseId),
    );
  }

  async updateCourse(
    courseId: string,
    updates: Partial<CourseData>,
  ): Promise<void> {
    if (!this.isOnline) {
      return localStorageService.updateCourse(courseId, updates);
    }

    await localStorageService.updateCourse(courseId, updates);

    this.syncToFirestore("course", courseId, async () => {
      await firestoreService.updateCourse(courseId, updates);
    });
  }

  async deleteCourse(courseId: string): Promise<void> {
    if (!this.isOnline) {
      return localStorageService.deleteCourse(courseId);
    }

    await localStorageService.deleteCourse(courseId);

    this.syncDeleteToFirestore("course", courseId, async () => {
      await firestoreService.deleteCourse(courseId);
    });
  }

  async getAllCourses(userId?: string): Promise<Course[]> {
    if (!this.isOnline) {
      return localStorageService.getAllCourses(userId);
    }

    return this.readWithFallback(
      () => firestoreService.getAllCourses(userId),
      () => localStorageService.getAllCourses(userId),
    );
  }

  // ========== BATCH OPERATIONS ==========

  async getPlayersForGame(game: Game): Promise<Player[]> {
    if (!this.isOnline) {
      return localStorageService.getPlayersForGame(game);
    }

    // Merge from both sources: local has recently-created guests that may
    // not have synced yet, Firestore has other registered players.
    const localPlayers = await localStorageService.getPlayersForGame(game);

    if (connectivityManager.isOnline) {
      try {
        const firestorePlayers = await firestoreService.getPlayersForGame(game);
        // Merge: local overwrites Firestore (local is more up-to-date for recent writes)
        const playerMap = new Map<string, Player>();
        for (const p of firestorePlayers) playerMap.set(p.id, p);
        for (const p of localPlayers) playerMap.set(p.id, p);
        return Array.from(playerMap.values());
      } catch (error) {
        console.warn("DataService: Firestore getPlayersForGame failed", error);
      }
    }

    return localPlayers;
  }

  // ========== USER OPERATIONS ==========

  async getNextUserNumber(): Promise<string> {
    if (!this.isOnline) {
      return localStorageService.getNextUserNumber();
    }

    return this.readWithFallback(
      () => firestoreService.getNextUserNumber(),
      () => localStorageService.getNextUserNumber(),
      { preferFirestore: true },
    );
  }

  async createUserProfile(
    userId: string,
    email: string,
    displayName: string,
  ): Promise<string> {
    if (!this.isOnline) {
      return localStorageService.createUserProfile(userId, email, displayName);
    }

    // For user profiles, Firestore is the source of truth for user numbers
    // (uses a counter doc). Try Firestore first when online.
    if (connectivityManager.isOnline) {
      try {
        const userNumber = await firestoreService.createUserProfile(
          userId,
          email,
          displayName,
        );
        // Also write to local so offline reads work
        await localStorageService.createUserProfile(userId, email, displayName);
        return userNumber;
      } catch (error) {
        console.warn(
          "DataService: Firestore createUserProfile failed, falling back to local",
          error,
        );
      }
    }

    // Fallback: create locally and mark dirty
    const userNumber = await localStorageService.createUserProfile(
      userId,
      email,
      displayName,
    );
    await syncService.markDirty({ entityType: "user", entityId: userId });
    syncService.syncAll();
    return userNumber;
  }

  async getUserProfile(userId: string): Promise<any> {
    if (!this.isOnline) {
      return localStorageService.getUserProfile(userId);
    }

    return this.readWithFallback(
      () => firestoreService.getUserProfile(userId),
      () => localStorageService.getUserProfile(userId),
    );
  }

  // ========== USER ROLE & APPROVAL ==========

  async getUserRole(userId: string): Promise<string> {
    if (!this.isOnline) {
      return localStorageService.getUserRole(userId);
    }

    return this.readWithFallback(
      () => firestoreService.getUserRole(userId),
      () => localStorageService.getUserRole(userId),
    );
  }

  async setUserRole(userId: string, role: string): Promise<void> {
    if (!this.isOnline) {
      return localStorageService.setUserRole(userId, role);
    }

    await localStorageService.setUserRole(userId, role);

    this.syncToFirestore("user", userId, async () => {
      await firestoreService.setUserRole(userId, role);
    });
  }

  async getApprovalStatus(userId: string): Promise<string> {
    if (!this.isOnline) {
      return localStorageService.getApprovalStatus(userId);
    }

    return this.readWithFallback(
      () => firestoreService.getApprovalStatus(userId),
      () => localStorageService.getApprovalStatus(userId),
    );
  }

  async setApprovalStatus(userId: string, status: string): Promise<void> {
    if (!this.isOnline) {
      return localStorageService.setApprovalStatus(userId, status);
    }

    await localStorageService.setApprovalStatus(userId, status);

    this.syncToFirestore("user", userId, async () => {
      await firestoreService.setApprovalStatus(userId, status);
    });
  }

  // ========== PENDING USERS ==========

  async addPendingUser(userId: string, userData: any): Promise<void> {
    if (!this.isOnline) {
      return localStorageService.addPendingUser(userId, userData);
    }

    await localStorageService.addPendingUser(userId, userData);

    // Pending users use setDoc with userId as the doc ID, so no ID mismatch issue
    this.syncToFirestore("pendingUser", userId, async () => {
      await firestoreService.addPendingUser(userId, userData);
    });
  }

  async getPendingUsers(): Promise<any[]> {
    if (!this.isOnline) {
      return localStorageService.getPendingUsers();
    }

    return this.readWithFallback(
      () => firestoreService.getPendingUsers(),
      () => localStorageService.getPendingUsers(),
      { preferFirestore: true },
    );
  }

  async removePendingUser(userId: string): Promise<void> {
    if (!this.isOnline) {
      return localStorageService.removePendingUser(userId);
    }

    await localStorageService.removePendingUser(userId);

    this.syncDeleteToFirestore("pendingUser", userId, async () => {
      await firestoreService.removePendingUser(userId);
    });
  }

  async approvePendingUser(userId: string): Promise<void> {
    if (!this.isOnline) {
      return localStorageService.approvePendingUser(userId);
    }

    await localStorageService.approvePendingUser(userId);

    this.syncToFirestore("user", userId, async () => {
      await firestoreService.approvePendingUser(userId);
    });
  }

  async rejectPendingUser(userId: string): Promise<void> {
    if (!this.isOnline) {
      return localStorageService.rejectPendingUser(userId);
    }

    await localStorageService.rejectPendingUser(userId);

    this.syncToFirestore("user", userId, async () => {
      await firestoreService.rejectPendingUser(userId);
    });
  }

  // ========== USER MANAGEMENT ==========

  async getAllUsers(): Promise<any[]> {
    if (!this.isOnline) {
      return localStorageService.getAllUsers();
    }

    return this.readWithFallback(
      () => firestoreService.getAllUsers(),
      () => localStorageService.getAllUsers(),
      { preferFirestore: true },
    );
  }

  async getUserStats(userId: string): Promise<any> {
    if (!this.isOnline) {
      return localStorageService.getUserStats(userId);
    }

    return this.readWithFallback(
      () => firestoreService.getUserStats(userId),
      () => localStorageService.getUserStats(userId),
      { preferFirestore: true },
    );
  }

  async deleteUser(userId: string): Promise<void> {
    if (!this.isOnline) {
      return localStorageService.deleteUser(userId);
    }

    await localStorageService.deleteUser(userId);

    this.syncDeleteToFirestore("user", userId, async () => {
      await firestoreService.deleteUser(userId);
    });
  }

  // ========== HELPERS ==========

  /**
   * Find the gameId that contains a given hole by searching local storage.
   */
  private async findGameIdForHole(holeId: string): Promise<string | null> {
    try {
      if (!this.userId) return null;
      const games = await localStorageService.getGamesForUser(this.userId);
      for (const game of games) {
        const gameHoles = await localStorageService.getHolesForGame(game.id);
        if (gameHoles.some((h) => h.id === holeId)) {
          return game.id;
        }
      }
      return null;
    } catch {
      return null;
    }
  }
}

export const dataService = new DataService();
