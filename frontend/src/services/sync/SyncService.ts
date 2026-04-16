import {
  doc,
  setDoc,
  deleteDoc,
  Timestamp,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import { firestore } from "../firebase/config";
import { connectivityManager } from "../connectivity";
import { localStorageService } from "../storage/LocalStorageService";
import { StorageKeys, deserializeStoredGame } from "../storage/storageUtils";

interface DirtyEntity {
  entityType: string;
  entityId: string;
}

interface PendingDelete {
  entityType: string;
  entityId: string;
}

class SyncService {
  private syncing = false;
  private removeConnectivityListener: (() => void) | null = null;

  initialize(): void {
    this.removeConnectivityListener = connectivityManager.addListener(
      (isOnline) => {
        if (isOnline) {
          this.syncAll();
        }
      },
    );
  }

  dispose(): void {
    if (this.removeConnectivityListener) {
      this.removeConnectivityListener();
      this.removeConnectivityListener = null;
    }
  }

  async markDirty(entity: DirtyEntity): Promise<void> {
    const dirtySet = await this.getDirtyEntities();
    const key = `${entity.entityType}:${entity.entityId}`;
    dirtySet[key] = entity;
    localStorage.setItem(
      StorageKeys.syncDirtyEntities(),
      JSON.stringify(dirtySet),
    );
  }

  async markDelete(entity: PendingDelete): Promise<void> {
    const deletes = await this.getPendingDeletes();
    const key = `${entity.entityType}:${entity.entityId}`;
    // Avoid duplicates
    if (!deletes.find((d) => `${d.entityType}:${d.entityId}` === key)) {
      deletes.push(entity);
      localStorage.setItem(
        StorageKeys.syncPendingDeletes(),
        JSON.stringify(deletes),
      );
    }
  }

  async hasPendingChanges(): Promise<boolean> {
    const dirtySet = await this.getDirtyEntities();
    const deletes = await this.getPendingDeletes();
    return Object.keys(dirtySet).length > 0 || deletes.length > 0;
  }

  async syncAll(): Promise<void> {
    if (this.syncing || !connectivityManager.isOnline) return;
    this.syncing = true;

    try {
      await this.syncDirtyEntities();
      await this.syncPendingDeletes();
    } catch (error) {
      console.error("SyncService: error during syncAll:", error);
    } finally {
      this.syncing = false;
    }
  }

  private async getDirtyEntities(): Promise<Record<string, DirtyEntity>> {
    try {
      const stored = localStorage.getItem(StorageKeys.syncDirtyEntities());
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  private async getPendingDeletes(): Promise<PendingDelete[]> {
    try {
      const stored = localStorage.getItem(StorageKeys.syncPendingDeletes());
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private async syncDirtyEntities(): Promise<void> {
    const dirtySet = await this.getDirtyEntities();
    const keys = Object.keys(dirtySet);
    if (keys.length === 0) return;

    console.log(`SyncService: syncing ${keys.length} dirty entities`);
    const remaining: Record<string, DirtyEntity> = {};

    for (const key of keys) {
      const entity = dirtySet[key];
      try {
        switch (entity.entityType) {
          case "game":
            await this.syncGame(entity.entityId);
            break;
          case "player":
            await this.syncPlayer(entity.entityId);
            break;
          case "course":
            await this.syncCourse(entity.entityId);
            break;
          case "user":
            await this.syncUser(entity.entityId);
            break;
          case "pendingUser":
            await this.syncPendingUser(entity.entityId);
            break;
          default:
            console.warn(
              `SyncService: unknown entity type ${entity.entityType}`,
            );
        }
      } catch (error) {
        console.error(`SyncService: failed to sync ${key}:`, error);
        remaining[key] = entity;
      }
    }

    localStorage.setItem(
      StorageKeys.syncDirtyEntities(),
      JSON.stringify(remaining),
    );
  }

  private async syncPendingDeletes(): Promise<void> {
    const deletes = await this.getPendingDeletes();
    if (deletes.length === 0) return;

    console.log(`SyncService: processing ${deletes.length} pending deletes`);
    const remaining: PendingDelete[] = [];

    for (const del of deletes) {
      try {
        switch (del.entityType) {
          case "game":
            await this.deleteGameFromFirestore(del.entityId);
            break;
          case "player":
            await deleteDoc(doc(firestore, "players", del.entityId));
            break;
          case "course":
            await deleteDoc(doc(firestore, "courses", del.entityId));
            break;
          case "pendingUser":
            await deleteDoc(doc(firestore, "pendingUsers", del.entityId));
            break;
          case "user":
            // Full user deletion is complex — just delete the profile doc
            await deleteDoc(doc(firestore, "users", del.entityId));
            break;
          default:
            console.warn(`SyncService: unknown delete type ${del.entityType}`);
        }
      } catch (error) {
        console.error(
          `SyncService: failed to delete ${del.entityType}:${del.entityId}:`,
          error,
        );
        remaining.push(del);
      }
    }

    localStorage.setItem(
      StorageKeys.syncPendingDeletes(),
      JSON.stringify(remaining),
    );
  }

  private async syncGame(gameId: string): Promise<void> {
    const stored = localStorage.getItem(StorageKeys.game(gameId));
    if (!stored) return; // Game was deleted locally, nothing to sync

    const { game, holes, scores } = deserializeStoredGame(stored);

    // Write game doc
    const gameData: Record<string, any> = {
      date: Timestamp.fromDate(game.date),
      status: game.status,
      playerIds: game.playerIds,
      createdAt: game.createdAt
        ? Timestamp.fromDate(game.createdAt)
        : Timestamp.now(),
    };
    if (game.createdBy) gameData.createdBy = game.createdBy;
    if (game.completedAt)
      gameData.completedAt = Timestamp.fromDate(game.completedAt);
    if (game.courseId) gameData.courseId = game.courseId;
    if (game.courseName) gameData.courseName = game.courseName;
    if (game.handicaps) gameData.handicaps = game.handicaps;

    await setDoc(doc(firestore, "games", gameId), gameData);

    // Write holes
    for (const hole of holes) {
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
    for (const score of scores) {
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

  private async syncPlayer(playerId: string): Promise<void> {
    const player = await localStorageService.getPlayer(playerId);
    if (!player) return;

    const playerData: Record<string, any> = {
      name: player.name,
      isGuest: player.isGuest || false,
    };
    if (player.userId) playerData.userId = player.userId;
    if (player.createdBy) playerData.createdBy = player.createdBy;
    if (player.userNumber) playerData.userNumber = player.userNumber;

    await setDoc(doc(firestore, "players", playerId), playerData);
  }

  private async syncCourse(courseId: string): Promise<void> {
    const course = await localStorageService.getCourse(courseId);
    if (!course) return;

    const courseData: Record<string, any> = {
      name: course.name,
      holes: course.holes,
      createdAt: course.createdAt
        ? Timestamp.fromDate(course.createdAt)
        : Timestamp.now(),
      updatedAt: course.updatedAt
        ? Timestamp.fromDate(course.updatedAt)
        : Timestamp.now(),
    };
    if (course.createdBy) courseData.createdBy = course.createdBy;

    await setDoc(doc(firestore, "courses", courseId), courseData);
  }

  private async syncUser(userId: string): Promise<void> {
    const profile = await localStorageService.getUserProfile(userId);
    if (!profile) return;

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

  private async syncPendingUser(userId: string): Promise<void> {
    // Pending users are stored in a list — find this one
    const pendingUsers = await localStorageService.getPendingUsers();
    const user = pendingUsers.find((u: any) => u.id === userId);
    if (!user) return;

    await setDoc(doc(firestore, "pendingUsers", userId), {
      email: user.email,
      displayName: user.displayName,
      userNumber: user.userNumber,
      createdAt: user.createdAt
        ? Timestamp.fromDate(new Date(user.createdAt))
        : Timestamp.now(),
      avatarUrl: user.avatarUrl || null,
    });
  }

  private async deleteGameFromFirestore(gameId: string): Promise<void> {
    const batch = writeBatch(firestore);

    // Delete game document
    batch.delete(doc(firestore, "games", gameId));

    // Delete all holes for this game
    const holesQuery = query(
      collection(firestore, "holes"),
      where("gameId", "==", gameId),
    );
    const holesSnapshot = await getDocs(holesQuery);
    holesSnapshot.docs.forEach((d) => {
      batch.delete(d.ref);
    });

    // Delete all scores for this game
    const scoresQuery = query(
      collection(firestore, "scores"),
      where("gameId", "==", gameId),
    );
    const scoresSnapshot = await getDocs(scoresQuery);
    scoresSnapshot.docs.forEach((d) => {
      batch.delete(d.ref);
    });

    await batch.commit();
  }
}

export const syncService = new SyncService();
