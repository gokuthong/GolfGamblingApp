import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  WriteBatch,
  writeBatch,
  Unsubscribe,
} from "firebase/firestore";
import { firestore } from "./config";
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
} from "../../types";
import { CONSTANTS } from "../../utils/constants";

class FirestoreService {
  // Collections
  private gamesCollection = collection(firestore, "games");
  private holesCollection = collection(firestore, "holes");
  private scoresCollection = collection(firestore, "scores");
  private playersCollection = collection(firestore, "players");
  private coursesCollection = collection(firestore, "courses");
  private usersCollection = collection(firestore, "users");
  private countersCollection = collection(firestore, "counters");

  // Helper to convert Firestore Timestamp to Date
  private timestampToDate(timestamp: any): Date {
    if (timestamp?.toDate) {
      return timestamp.toDate();
    }
    return new Date(timestamp);
  }

  // GAME OPERATIONS

  async createGame(
    playerIds: string[],
    userId?: string,
    courseId?: string,
    courseName?: string,
  ): Promise<string> {
    const gameData: GameData = {
      date: Timestamp.now(),
      status: "active",
      playerIds,
      createdAt: Timestamp.now(),
    };

    // Only add createdBy if userId is provided
    if (userId) {
      gameData.createdBy = userId;
    }

    // Add courseId and courseName if provided
    if (courseId) {
      gameData.courseId = courseId;
    }
    if (courseName) {
      gameData.courseName = courseName;
    }

    const docRef = await addDoc(this.gamesCollection, gameData);
    return docRef.id;
  }

  async getGame(gameId: string): Promise<Game | null> {
    const docRef = doc(firestore, "games", gameId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data() as GameData;
    return {
      id: docSnap.id,
      date: this.timestampToDate(data.date),
      status: data.status,
      playerIds: data.playerIds,
      createdBy: data.createdBy,
      createdAt: data.createdAt
        ? this.timestampToDate(data.createdAt)
        : undefined,
      completedAt: data.completedAt
        ? this.timestampToDate(data.completedAt)
        : undefined,
      courseId: data.courseId,
      courseName: data.courseName,
      handicaps: data.handicaps,
    };
  }

  async updateGame(gameId: string, updates: Partial<GameData>): Promise<void> {
    const docRef = doc(firestore, "games", gameId);
    await updateDoc(docRef, updates);
  }

  async completeGame(gameId: string): Promise<void> {
    await this.updateGame(gameId, {
      status: "completed",
      completedAt: Timestamp.now(),
    });
  }

  async deleteGame(gameId: string): Promise<void> {
    const batch = writeBatch(firestore);

    // Delete game document
    const gameRef = doc(firestore, "games", gameId);
    batch.delete(gameRef);

    // Delete all holes for this game
    const holesQuery = query(
      this.holesCollection,
      where("gameId", "==", gameId),
    );
    const holesSnapshot = await getDocs(holesQuery);
    holesSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Delete all scores for this game
    const scoresQuery = query(
      this.scoresCollection,
      where("gameId", "==", gameId),
    );
    const scoresSnapshot = await getDocs(scoresQuery);
    scoresSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
  }

  async deleteGamesOlderThanTwoWeeks(userId: string): Promise<number> {
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const twoWeeksAgoTimestamp = Timestamp.fromDate(twoWeeksAgo);

    // Query games created by this user
    const q = query(this.gamesCollection, where("createdBy", "==", userId));
    const snapshot = await getDocs(q);

    const gamesToDelete: string[] = [];

    snapshot.docs.forEach((doc) => {
      const data = doc.data() as GameData;
      const gameDate = data.completedAt || data.createdAt || data.date;

      if (gameDate && gameDate.toMillis() < twoWeeksAgoTimestamp.toMillis()) {
        gamesToDelete.push(doc.id);
      }
    });

    // Delete games in batches (Firestore allows max 500 operations per batch)
    for (const gameId of gamesToDelete) {
      await this.deleteGame(gameId);
    }

    return gamesToDelete.length;
  }

  streamGame(
    gameId: string,
    callback: (game: Game | null) => void,
  ): Unsubscribe {
    const docRef = doc(firestore, "games", gameId);
    return onSnapshot(docRef, (docSnap) => {
      if (!docSnap.exists()) {
        callback(null);
        return;
      }

      const data = docSnap.data() as GameData;
      callback({
        id: docSnap.id,
        date: this.timestampToDate(data.date),
        status: data.status,
        playerIds: data.playerIds,
        createdBy: data.createdBy,
        createdAt: data.createdAt
          ? this.timestampToDate(data.createdAt)
          : undefined,
        completedAt: data.completedAt
          ? this.timestampToDate(data.completedAt)
          : undefined,
      });
    });
  }

  streamAllGames(callback: (games: Game[]) => void): Unsubscribe {
    const q = query(this.gamesCollection, orderBy("date", "desc"));
    return onSnapshot(q, (snapshot) => {
      const games: Game[] = snapshot.docs.map((doc) => {
        const data = doc.data() as GameData;
        return {
          id: doc.id,
          date: this.timestampToDate(data.date),
          status: data.status,
          playerIds: data.playerIds,
          createdBy: data.createdBy,
          createdAt: data.createdAt
            ? this.timestampToDate(data.createdAt)
            : undefined,
          completedAt: data.completedAt
            ? this.timestampToDate(data.completedAt)
            : undefined,
        };
      });
      callback(games);
    });
  }

  streamCompletedGames(
    userId: string,
    callback: (games: Game[]) => void,
  ): Unsubscribe {
    // Query only by createdBy to avoid needing a composite index
    const q = query(this.gamesCollection, where("createdBy", "==", userId));
    return onSnapshot(q, (snapshot) => {
      const allGames: Game[] = snapshot.docs.map((doc) => {
        const data = doc.data() as GameData;
        return {
          id: doc.id,
          date: this.timestampToDate(data.date),
          status: data.status,
          playerIds: data.playerIds,
          createdBy: data.createdBy,
          createdAt: data.createdAt
            ? this.timestampToDate(data.createdAt)
            : undefined,
          completedAt: data.completedAt
            ? this.timestampToDate(data.completedAt)
            : undefined,
        };
      });

      // Filter for completed games and sort in memory
      const completedGames = allGames
        .filter((game) => game.status === "completed")
        .sort((a, b) => {
          const aTime = a.completedAt?.getTime() || 0;
          const bTime = b.completedAt?.getTime() || 0;
          return bTime - aTime; // descending order
        });

      callback(completedGames);
    });
  }

  async getActiveGamesForUser(userId: string): Promise<Game[]> {
    const q = query(this.gamesCollection, where("createdBy", "==", userId));
    const snapshot = await getDocs(q);

    const allGames: Game[] = snapshot.docs.map((doc) => {
      const data = doc.data() as GameData;
      return {
        id: doc.id,
        date: this.timestampToDate(data.date),
        status: data.status,
        playerIds: data.playerIds,
        createdBy: data.createdBy,
        createdAt: data.createdAt
          ? this.timestampToDate(data.createdAt)
          : undefined,
        completedAt: data.completedAt
          ? this.timestampToDate(data.completedAt)
          : undefined,
        handicaps: data.handicaps,
      };
    });

    // Filter for active games and sort by creation date (most recent first)
    const activeGames = allGames
      .filter((game) => game.status === "active")
      .sort((a, b) => {
        const aTime = a.createdAt?.getTime() || 0;
        const bTime = b.createdAt?.getTime() || 0;
        return bTime - aTime; // descending order (most recent first)
      });

    return activeGames;
  }

  async getGamesForUser(userId: string): Promise<Game[]> {
    // Query only by createdBy to avoid needing a composite index
    const q = query(this.gamesCollection, where("createdBy", "==", userId));
    const snapshot = await getDocs(q);
    const games = snapshot.docs.map((doc) => {
      const data = doc.data() as GameData;
      return {
        id: doc.id,
        date: this.timestampToDate(data.date),
        status: data.status,
        playerIds: data.playerIds,
        createdBy: data.createdBy,
        createdAt: data.createdAt
          ? this.timestampToDate(data.createdAt)
          : undefined,
        completedAt: data.completedAt
          ? this.timestampToDate(data.completedAt)
          : undefined,
        courseId: data.courseId,
        courseName: data.courseName,
        handicaps: data.handicaps,
      };
    });

    // Sort in memory by date descending
    return games.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async getGameWithDetails(gameId: string): Promise<{
    game: Game;
    holes: Hole[];
    scores: Score[];
    players: Player[];
  } | null> {
    const game = await this.getGame(gameId);
    if (!game) {
      return null;
    }

    const [holes, scores, players] = await Promise.all([
      this.getHolesForGame(gameId),
      this.getScoresForGame(gameId),
      this.getPlayersForGame(game),
    ]);

    return { game, holes, scores, players };
  }

  // HOLE OPERATIONS

  async createHole(holeData: HoleData): Promise<string> {
    const docRef = await addDoc(this.holesCollection, holeData);
    return docRef.id;
  }

  async updateHole(holeId: string, updates: Partial<HoleData>): Promise<void> {
    const docRef = doc(firestore, "holes", holeId);
    await updateDoc(docRef, updates);
  }

  async batchUpdateHoles(
    holeUpdates: Array<{ holeId: string; updates: Partial<HoleData> }>,
  ): Promise<void> {
    if (holeUpdates.length === 0) return;

    // Firestore allows max 500 operations per batch
    const batchSize = 500;
    for (let i = 0; i < holeUpdates.length; i += batchSize) {
      const batch = writeBatch(firestore);
      const batchData = holeUpdates.slice(i, i + batchSize);

      batchData.forEach(({ holeId, updates }) => {
        const docRef = doc(firestore, "holes", holeId);
        batch.update(docRef, updates);
      });

      await batch.commit();
    }
  }

  async getHolesForGame(gameId: string): Promise<Hole[]> {
    const q = query(
      this.holesCollection,
      where("gameId", "==", gameId),
      orderBy("holeNumber", "asc"),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Hole);
  }

  streamHolesForGame(
    gameId: string,
    callback: (holes: Hole[]) => void,
  ): Unsubscribe {
    const q = query(
      this.holesCollection,
      where("gameId", "==", gameId),
      orderBy("holeNumber", "asc"),
    );
    return onSnapshot(q, (snapshot) => {
      const holes: Hole[] = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as Hole,
      );
      callback(holes);
    });
  }

  async initializeHolesForGame(gameId: string): Promise<void> {
    const batch = writeBatch(firestore);

    for (let i = 0; i < CONSTANTS.HOLES_PER_GAME; i++) {
      const holeData: HoleData = {
        gameId,
        holeNumber: i + 1,
        par: CONSTANTS.STANDARD_PARS[i],
        index: i + 1, // Default index same as hole number
        isUp: false,
        isBurn: false,
        confirmed: false,
      };
      const docRef = doc(this.holesCollection);
      batch.set(docRef, holeData);
    }

    await batch.commit();
  }

  async initializeHolesForGameFromCourse(
    gameId: string,
    courseId: string,
  ): Promise<void> {
    const course = await this.getCourse(courseId);
    if (!course) {
      throw new Error("Course not found");
    }

    const batch = writeBatch(firestore);

    for (const courseHole of course.holes) {
      const holeData: HoleData = {
        gameId,
        holeNumber: courseHole.holeNumber,
        par: courseHole.par,
        index: courseHole.index || courseHole.holeNumber, // Default to hole number if no index
        isUp: false,
        isBurn: false,
        confirmed: false,
      };
      const docRef = doc(this.holesCollection);
      batch.set(docRef, holeData);
    }

    await batch.commit();
  }

  // SCORE OPERATIONS

  async upsertScore(scoreData: ScoreData): Promise<string> {
    // Use a deterministic document ID to prevent race conditions
    // This ensures concurrent calls update the same document instead of creating duplicates
    const docId = `${scoreData.holeId}_${scoreData.playerId}`;
    const docRef = doc(this.scoresCollection, docId);

    // setDoc with merge will create or update atomically
    await setDoc(docRef, scoreData, { merge: true });
    return docId;
  }

  async batchUpsertScores(scoresData: ScoreData[]): Promise<void> {
    if (scoresData.length === 0) return;

    // Firestore allows max 500 operations per batch
    const batchSize = 500;
    for (let i = 0; i < scoresData.length; i += batchSize) {
      const batch = writeBatch(firestore);
      const batchData = scoresData.slice(i, i + batchSize);

      batchData.forEach((scoreData) => {
        const docId = `${scoreData.holeId}_${scoreData.playerId}`;
        const docRef = doc(this.scoresCollection, docId);
        batch.set(docRef, scoreData, { merge: true });
      });

      await batch.commit();
    }
  }

  async getScoresForHole(holeId: string): Promise<Score[]> {
    const q = query(this.scoresCollection, where("holeId", "==", holeId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Score);
  }

  async getScoresForGame(gameId: string): Promise<Score[]> {
    const q = query(this.scoresCollection, where("gameId", "==", gameId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Score);
  }

  streamScoresForGame(
    gameId: string,
    callback: (scores: Score[]) => void,
  ): Unsubscribe {
    const q = query(this.scoresCollection, where("gameId", "==", gameId));
    return onSnapshot(q, (snapshot) => {
      const scores: Score[] = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as Score,
      );
      callback(scores);
    });
  }

  // PLAYER OPERATIONS

  async createPlayer(playerData: {
    name: string;
    userId: string;
    isGuest?: boolean;
    userNumber?: string;
  }): Promise<string> {
    const data: PlayerData = {
      name: playerData.name,
      isGuest: playerData.isGuest || false,
      userId: playerData.userId,
    };

    // Add user number if provided
    if (playerData.userNumber) {
      data.userNumber = playerData.userNumber;
    }

    // Set createdBy to userId for consistency
    data.createdBy = playerData.userId;

    const docRef = await addDoc(this.playersCollection, data);
    return docRef.id;
  }

  // Legacy method for backward compatibility
  async createPlayerLegacy(
    name: string,
    createdBy?: string,
    userNumber?: string,
    userId?: string,
    isGuest: boolean = false,
  ): Promise<string> {
    const playerData: PlayerData = {
      name,
      isGuest,
    };

    // Only add createdBy if provided
    if (createdBy) {
      playerData.createdBy = createdBy;
    }

    // Add user number and userId for registered users
    if (userNumber) {
      playerData.userNumber = userNumber;
    }

    if (userId) {
      playerData.userId = userId;
    }

    const docRef = await addDoc(this.playersCollection, playerData);
    return docRef.id;
  }

  async getPlayer(playerId: string): Promise<Player | null> {
    const docRef = doc(firestore, "players", playerId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return { id: docSnap.id, ...docSnap.data() } as Player;
  }

  async getAllPlayers(): Promise<Player[]> {
    const q = query(this.playersCollection, orderBy("name", "asc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as Player,
    );
  }

  async updatePlayer(
    playerId: string,
    updates: Partial<PlayerData>,
  ): Promise<void> {
    const docRef = doc(firestore, "players", playerId);
    await updateDoc(docRef, updates);
  }

  async deletePlayer(playerId: string): Promise<void> {
    const docRef = doc(firestore, "players", playerId);
    await deleteDoc(docRef);
  }

  streamAllPlayers(callback: (players: Player[]) => void): Unsubscribe {
    const q = query(this.playersCollection, orderBy("name", "asc"));
    return onSnapshot(q, (snapshot) => {
      const players: Player[] = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as Player,
      );
      callback(players);
    });
  }

  streamPlayersForUser(
    userId: string,
    callback: (players: Player[]) => void,
  ): Unsubscribe {
    // Query by userId only, then sort in memory to avoid needing a composite index
    const q = query(this.playersCollection, where("userId", "==", userId));
    return onSnapshot(q, (snapshot) => {
      const players: Player[] = snapshot.docs
        .map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            }) as Player,
        )
        .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically in memory
      callback(players);
    });
  }

  // COURSE OPERATIONS

  async createCourse(
    name: string,
    holes: { holeNumber: number; par: number }[],
    userId?: string,
  ): Promise<string> {
    const courseData: CourseData = {
      name,
      holes,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    // Only add createdBy if userId is provided
    if (userId) {
      courseData.createdBy = userId;
    }

    const docRef = await addDoc(this.coursesCollection, courseData);
    return docRef.id;
  }

  async getCourse(courseId: string): Promise<Course | null> {
    const docRef = doc(firestore, "courses", courseId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data() as CourseData;
    return {
      id: docSnap.id,
      name: data.name,
      holes: data.holes,
      createdBy: data.createdBy,
      createdAt: data.createdAt
        ? this.timestampToDate(data.createdAt)
        : undefined,
      updatedAt: data.updatedAt
        ? this.timestampToDate(data.updatedAt)
        : undefined,
    };
  }

  async updateCourse(
    courseId: string,
    updates: Partial<CourseData>,
  ): Promise<void> {
    const docRef = doc(firestore, "courses", courseId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  }

  async deleteCourse(courseId: string): Promise<void> {
    const docRef = doc(firestore, "courses", courseId);
    await deleteDoc(docRef);
  }

  async getAllCourses(userId?: string): Promise<Course[]> {
    let q;
    if (userId) {
      q = query(
        this.coursesCollection,
        where("createdBy", "==", userId),
        orderBy("name", "asc"),
      );
    } else {
      q = query(this.coursesCollection, orderBy("name", "asc"));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      name: doc.data().name,
      holes: doc.data().holes,
      createdBy: doc.data().createdBy,
      createdAt: doc.data().createdAt
        ? this.timestampToDate(doc.data().createdAt)
        : undefined,
      updatedAt: doc.data().updatedAt
        ? this.timestampToDate(doc.data().updatedAt)
        : undefined,
    }));
  }

  streamAllCourses(
    callback: (courses: Course[]) => void,
    userId?: string,
  ): Unsubscribe {
    let q;
    if (userId) {
      q = query(
        this.coursesCollection,
        where("createdBy", "==", userId),
        orderBy("name", "asc"),
      );
    } else {
      q = query(this.coursesCollection, orderBy("name", "asc"));
    }

    return onSnapshot(q, (snapshot) => {
      const courses: Course[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
        holes: doc.data().holes,
        createdBy: doc.data().createdBy,
        createdAt: doc.data().createdAt
          ? this.timestampToDate(doc.data().createdAt)
          : undefined,
        updatedAt: doc.data().updatedAt
          ? this.timestampToDate(doc.data().updatedAt)
          : undefined,
      }));
      callback(courses);
    });
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

  // USER OPERATIONS

  async getNextUserNumber(): Promise<string> {
    const counterRef = doc(this.countersCollection, "userNumbers");

    try {
      const counterSnap = await getDoc(counterRef);

      if (!counterSnap.exists()) {
        // Initialize counter if it doesn't exist
        await setDoc(counterRef, { current: 1 });
        return "001";
      }

      const currentNumber = counterSnap.data().current || 0;
      const nextNumber = currentNumber + 1;

      // Update the counter
      await updateDoc(counterRef, { current: nextNumber });

      // Format as 3-digit string
      return String(nextNumber).padStart(3, "0");
    } catch (error) {
      // If document doesn't exist, create it
      await setDoc(counterRef, { current: 1 });
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
      createdAt: Timestamp.now(),
      settings: {
        darkMode: false,
        hapticFeedback: true,
        defaultHandicap: 0,
      },
    };

    await setDoc(doc(this.usersCollection, userId), userData);

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
    const docRef = doc(this.usersCollection, userId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
      createdAt: this.timestampToDate(docSnap.data().createdAt),
    };
  }

  async searchUsers(searchTerm: string): Promise<Player[]> {
    // Get all players (registered users only)
    const q = query(this.playersCollection, where("isGuest", "==", false));
    const snapshot = await getDocs(q);

    const allPlayers = snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as Player,
    );

    // Filter by name or user number
    const lowerSearch = searchTerm.toLowerCase();
    return allPlayers.filter(
      (player) =>
        player.name.toLowerCase().includes(lowerSearch) ||
        player.userNumber?.includes(searchTerm),
    );
  }

  async getAllRegisteredPlayers(): Promise<Player[]> {
    const q = query(this.playersCollection, where("isGuest", "!=", true));
    const snapshot = await getDocs(q);

    return snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }) as Player)
      .sort((a, b) => {
        // Sort by user number
        const numA = parseInt(a.userNumber || "999");
        const numB = parseInt(b.userNumber || "999");
        return numA - numB;
      });
  }

  // GAME MANAGEMENT - Extended methods

  async deleteGamesOlderThan(userId: string, days: number): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffTimestamp = Timestamp.fromDate(cutoff);

    const q = query(this.gamesCollection, where("createdBy", "==", userId));
    const snapshot = await getDocs(q);

    const gamesToDelete: string[] = [];

    snapshot.docs.forEach((docSnap) => {
      const data = docSnap.data() as GameData;
      const gameDate = data.completedAt || data.createdAt || data.date;

      if (gameDate && gameDate.toMillis() < cutoffTimestamp.toMillis()) {
        gamesToDelete.push(docSnap.id);
      }
    });

    for (const gameId of gamesToDelete) {
      await this.deleteGame(gameId);
    }

    return gamesToDelete.length;
  }

  async enforceGameLimit(userId: string, maxGames: number): Promise<void> {
    const q = query(this.gamesCollection, where("createdBy", "==", userId));
    const snapshot = await getDocs(q);

    const completedGames = snapshot.docs
      .map((docSnap) => {
        const data = docSnap.data() as GameData;
        return {
          id: docSnap.id,
          completedAt: data.completedAt,
          status: data.status,
        };
      })
      .filter((g) => g.status === "completed")
      .sort((a, b) => {
        const aTime = a.completedAt?.toMillis() || 0;
        const bTime = b.completedAt?.toMillis() || 0;
        return bTime - aTime; // newest first
      });

    if (completedGames.length > maxGames) {
      const gamesToDelete = completedGames.slice(maxGames);
      for (const game of gamesToDelete) {
        await this.deleteGame(game.id);
      }
    }
  }

  // USER ROLE & APPROVAL

  async getUserRole(userId: string): Promise<string> {
    try {
      const docRef = doc(this.usersCollection, userId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) return "user";
      return docSnap.data().role || "user";
    } catch (error) {
      console.error("Error getting user role:", error);
      return "user";
    }
  }

  async setUserRole(userId: string, role: string): Promise<void> {
    const docRef = doc(this.usersCollection, userId);
    await setDoc(docRef, { role }, { merge: true });
  }

  async getApprovalStatus(userId: string): Promise<string> {
    try {
      const docRef = doc(this.usersCollection, userId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) return "approved";
      return docSnap.data().approvalStatus || "approved";
    } catch (error) {
      console.error("Error getting approval status:", error);
      return "approved";
    }
  }

  async setApprovalStatus(userId: string, status: string): Promise<void> {
    const docRef = doc(this.usersCollection, userId);
    await setDoc(docRef, { approvalStatus: status }, { merge: true });
  }

  // PENDING USERS MANAGEMENT

  private pendingUsersCollection = collection(firestore, "pendingUsers");

  async addPendingUser(userId: string, userData: any): Promise<void> {
    const pendingUserData = {
      email: userData.email,
      displayName: userData.displayName,
      userNumber: userData.userNumber,
      createdAt: Timestamp.now(),
      avatarUrl: userData.avatarUrl || null,
    };

    await setDoc(doc(this.pendingUsersCollection, userId), pendingUserData);
  }

  async getPendingUsers(): Promise<any[]> {
    try {
      const snapshot = await getDocs(this.pendingUsersCollection);
      return snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt
          ? this.timestampToDate(docSnap.data().createdAt)
          : new Date(),
      }));
    } catch (error) {
      console.error("Error getting pending users:", error);
      return [];
    }
  }

  async removePendingUser(userId: string): Promise<void> {
    await deleteDoc(doc(this.pendingUsersCollection, userId));
  }

  async approvePendingUser(userId: string): Promise<void> {
    await this.setApprovalStatus(userId, "approved");
    await this.removePendingUser(userId);
  }

  async rejectPendingUser(userId: string): Promise<void> {
    await this.setApprovalStatus(userId, "rejected");
    await this.removePendingUser(userId);
  }

  // USER MANAGEMENT

  async getAllUsers(): Promise<any[]> {
    try {
      const snapshot = await getDocs(this.usersCollection);
      const users: any[] = [];

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();

        // Skip guest users
        if (data.role === "guest" || data.isOffline) continue;

        users.push({
          id: docSnap.id,
          email: data.email,
          displayName: data.displayName,
          userNumber: data.userNumber,
          role: data.role || "user",
          approvalStatus: data.approvalStatus || "approved",
          createdAt: data.createdAt
            ? this.timestampToDate(data.createdAt)
            : new Date(),
        });
      }

      return users.sort((a, b) => {
        const numA = parseInt(a.userNumber || "999");
        const numB = parseInt(b.userNumber || "999");
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

        const { holes, scores } = gameDetails;

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
            gamePoints += userScore.points || 0;
          }
        });

        totalPoints += gamePoints;

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
      // Delete user's games and associated data
      const games = await this.getGamesForUser(userId);
      for (const game of games) {
        await this.deleteGame(game.id);
      }

      // Delete user's players
      const playersQuery = query(
        this.playersCollection,
        where("userId", "==", userId),
      );
      const playersSnapshot = await getDocs(playersQuery);
      for (const docSnap of playersSnapshot.docs) {
        await deleteDoc(docSnap.ref);
      }

      // Delete user's courses
      const coursesQuery = query(
        this.coursesCollection,
        where("createdBy", "==", userId),
      );
      const coursesSnapshot = await getDocs(coursesQuery);
      for (const docSnap of coursesSnapshot.docs) {
        await deleteDoc(docSnap.ref);
      }

      // Remove from pending users
      await this.removePendingUser(userId);

      // Delete user profile
      await deleteDoc(doc(this.usersCollection, userId));

      console.log(
        `Deleted user ${userId} and all associated data from Firestore`,
      );
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  }
}

export const firestoreService = new FirestoreService();
