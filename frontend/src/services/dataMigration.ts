import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  Timestamp,
  collection,
  query,
  where,
} from "firebase/firestore";
import { firestore } from "./firebase/config";
import { localStorageService } from "./storage/LocalStorageService";
import { StorageKeys, serializeStoredGame } from "./storage/storageUtils";
import { connectivityManager } from "./connectivity";
import { Game, Hole, Score, Player, Course } from "../types";

const MIGRATION_KEY_PREFIX = "@migrated:";

export async function migrateLocalDataToFirestore(
  userId: string,
): Promise<void> {
  try {
    // Check migration flag
    const migrated = localStorage.getItem(`${MIGRATION_KEY_PREFIX}${userId}`);
    if (migrated) return;

    console.log(`Starting data migration to Firestore for user ${userId}...`);

    // 1. Migrate courses
    const localCourses = await localStorageService.getAllCourses(userId);
    for (const course of localCourses) {
      await setDoc(doc(firestore, "courses", course.id), {
        name: course.name,
        holes: course.holes,
        createdBy: course.createdBy || userId,
        createdAt: course.createdAt
          ? Timestamp.fromDate(course.createdAt)
          : Timestamp.now(),
        updatedAt: course.updatedAt
          ? Timestamp.fromDate(course.updatedAt)
          : Timestamp.now(),
      });
    }
    console.log(`Migrated ${localCourses.length} courses`);

    // 2. Migrate players
    const localPlayers = await localStorageService.getAllPlayers(userId);
    for (const player of localPlayers) {
      const playerData: Record<string, any> = {
        name: player.name,
        isGuest: player.isGuest || false,
        userId: player.userId || userId,
        createdBy: player.createdBy || userId,
      };
      if (player.userNumber) playerData.userNumber = player.userNumber;

      await setDoc(doc(firestore, "players", player.id), playerData);
    }
    console.log(`Migrated ${localPlayers.length} players`);

    // 3. Migrate games (with holes and scores)
    const localGames = await localStorageService.getGamesForUser(userId);
    for (const game of localGames) {
      const details = await localStorageService.getGameWithDetails(game.id);
      if (!details) continue;

      // Write game doc
      const gameData: Record<string, any> = {
        date: Timestamp.fromDate(game.date),
        status: game.status,
        playerIds: game.playerIds,
        createdBy: game.createdBy || userId,
        createdAt: game.createdAt
          ? Timestamp.fromDate(game.createdAt)
          : Timestamp.now(),
      };
      if (game.completedAt)
        gameData.completedAt = Timestamp.fromDate(game.completedAt);
      if (game.courseId) gameData.courseId = game.courseId;
      if (game.courseName) gameData.courseName = game.courseName;
      if (game.handicaps) gameData.handicaps = game.handicaps;

      await setDoc(doc(firestore, "games", game.id), gameData);

      // Write holes
      for (const hole of details.holes) {
        await setDoc(doc(firestore, "holes", hole.id), {
          gameId: hole.gameId,
          holeNumber: hole.holeNumber,
          par: hole.par,
          index: hole.index,
          isUp: hole.isUp || false,
          isBurn: hole.isBurn || false,
          confirmed: hole.confirmed || false,
        });
      }

      // Write scores
      for (const score of details.scores) {
        const scoreDoc: Record<string, any> = {
          holeId: score.holeId,
          playerId: score.playerId,
          gameId: score.gameId,
          strokes: score.strokes,
          handicap: score.handicap || 0,
        };
        if (score.multiplier !== undefined) {
          scoreDoc.multiplier = score.multiplier;
        }
        await setDoc(doc(firestore, "scores", score.id), scoreDoc);
      }
    }
    console.log(`Migrated ${localGames.length} games with holes and scores`);

    // 4. Migrate user profile
    const profile = await localStorageService.getUserProfile(userId);
    if (profile) {
      await setDoc(
        doc(firestore, "users", userId),
        {
          email: profile.email,
          displayName: profile.displayName,
          userNumber: profile.userNumber,
          role: profile.role || "user",
          approvalStatus: profile.approvalStatus || "approved",
          createdAt: profile.createdAt
            ? Timestamp.fromDate(new Date(profile.createdAt))
            : Timestamp.now(),
          settings: profile.settings || {
            darkMode: false,
            hapticFeedback: true,
            defaultHandicap: 0,
          },
        },
        { merge: true },
      );
    }
    console.log("Migrated user profile");

    // 5. Set migration flag
    localStorage.setItem(`${MIGRATION_KEY_PREFIX}${userId}`, "true");

    console.log("Data migration to Firestore completed successfully");
  } catch (error) {
    console.error("Error during data migration to Firestore:", error);
    // Don't set the migration flag so it can be retried
  }
}

/**
 * One-time reverse seed: pull Firestore data into local storage so offline reads work.
 * Only runs once per user, only when online.
 */
export async function seedLocalCacheFromFirestore(
  userId: string,
): Promise<void> {
  try {
    const seededKey = StorageKeys.cacheSeeded(userId);
    const alreadySeeded = localStorage.getItem(seededKey);
    if (alreadySeeded) return;

    if (!connectivityManager.isOnline) return;

    console.log(`Seeding local cache from Firestore for user ${userId}...`);

    // Helper to convert Firestore Timestamp to Date
    const toDate = (ts: any): Date => {
      if (ts?.toDate) return ts.toDate();
      return new Date(ts);
    };

    // 1. Seed courses
    const coursesQuery = query(
      collection(firestore, "courses"),
      where("createdBy", "==", userId),
    );
    const coursesSnapshot = await getDocs(coursesQuery);
    const courses: Course[] = coursesSnapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        name: data.name,
        holes: data.holes,
        createdBy: data.createdBy,
        createdAt: data.createdAt ? toDate(data.createdAt) : undefined,
        updatedAt: data.updatedAt ? toDate(data.updatedAt) : undefined,
      };
    });

    if (courses.length > 0) {
      localStorage.setItem(
        StorageKeys.courses(userId),
        JSON.stringify(
          courses.map((c) => ({
            ...c,
            createdAt: c.createdAt?.toISOString(),
            updatedAt: c.updatedAt?.toISOString(),
          })),
        ),
      );
    }
    console.log(`Seeded ${courses.length} courses`);

    // 2. Seed players
    const playersQuery = query(
      collection(firestore, "players"),
      where("userId", "==", userId),
    );
    const playersSnapshot = await getDocs(playersQuery);
    const players: Player[] = playersSnapshot.docs.map(
      (d) =>
        ({
          id: d.id,
          ...d.data(),
        }) as Player,
    );

    if (players.length > 0) {
      localStorage.setItem(
        StorageKeys.players(userId),
        JSON.stringify(players),
      );
    }
    console.log(`Seeded ${players.length} players`);

    // 3. Seed games (with holes and scores as StoredGame)
    const gamesQuery = query(
      collection(firestore, "games"),
      where("createdBy", "==", userId),
    );
    const gamesSnapshot = await getDocs(gamesQuery);
    const gameIds: string[] = [];

    for (const gameDoc of gamesSnapshot.docs) {
      const gData = gameDoc.data();
      const game: Game = {
        id: gameDoc.id,
        date: toDate(gData.date),
        status: gData.status,
        playerIds: gData.playerIds,
        createdBy: gData.createdBy,
        createdAt: gData.createdAt ? toDate(gData.createdAt) : undefined,
        completedAt: gData.completedAt ? toDate(gData.completedAt) : undefined,
        courseId: gData.courseId,
        courseName: gData.courseName,
        handicaps: gData.handicaps,
      };

      // Fetch holes for this game
      const holesQuery = query(
        collection(firestore, "holes"),
        where("gameId", "==", gameDoc.id),
      );
      const holesSnapshot = await getDocs(holesQuery);
      const holes: Hole[] = holesSnapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }) as Hole)
        .sort((a, b) => a.holeNumber - b.holeNumber);

      // Fetch scores for this game
      const scoresQuery = query(
        collection(firestore, "scores"),
        where("gameId", "==", gameDoc.id),
      );
      const scoresSnapshot = await getDocs(scoresQuery);
      const scores: Score[] = scoresSnapshot.docs.map(
        (d) =>
          ({
            id: d.id,
            ...d.data(),
          }) as Score,
      );

      localStorage.setItem(
        StorageKeys.game(gameDoc.id),
        serializeStoredGame({ game, holes, scores }),
      );
      gameIds.push(gameDoc.id);
    }

    // Update games index
    if (gameIds.length > 0) {
      const existingIndex = localStorage.getItem(
        StorageKeys.gamesIndex(userId),
      );
      const existingIds: string[] = existingIndex
        ? JSON.parse(existingIndex)
        : [];
      const mergedIds = [...new Set([...existingIds, ...gameIds])];
      localStorage.setItem(
        StorageKeys.gamesIndex(userId),
        JSON.stringify(mergedIds),
      );
    }
    console.log(`Seeded ${gameIds.length} games with holes and scores`);

    // 4. Seed user profile
    const userDoc = await getDoc(doc(firestore, "users", userId));
    if (userDoc.exists()) {
      const uData = userDoc.data();
      localStorage.setItem(
        `@user:${userId}`,
        JSON.stringify({
          email: uData.email,
          displayName: uData.displayName,
          userNumber: uData.userNumber,
          role: uData.role || "user",
          approvalStatus: uData.approvalStatus || "approved",
          createdAt: uData.createdAt
            ? toDate(uData.createdAt).toISOString()
            : new Date().toISOString(),
          settings: uData.settings || {
            darkMode: false,
            hapticFeedback: true,
            defaultHandicap: 0,
          },
        }),
      );
    }
    console.log("Seeded user profile");

    // 5. Set seeded flag
    localStorage.setItem(seededKey, "true");
    console.log("Local cache seeding from Firestore completed successfully");
  } catch (error) {
    console.error("Error seeding local cache from Firestore:", error);
    // Don't set the flag so it can be retried
  }
}
