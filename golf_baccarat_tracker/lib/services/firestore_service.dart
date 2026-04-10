import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/game.dart';
import '../models/hole.dart';
import '../models/score.dart';
import '../models/player.dart';

class FirestoreService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  // ==================== GAME OPERATIONS ====================

  /// Create a new game
  Future<String> createGame(Game game) async {
    final docRef = await _firestore.collection('games').add(game.toMap());
    return docRef.id;
  }

  /// Get a game by ID
  Future<Game?> getGame(String gameId) async {
    final doc = await _firestore.collection('games').doc(gameId).get();
    if (!doc.exists) return null;
    return Game.fromMap({...doc.data()!, 'id': doc.id});
  }

  /// Update game
  Future<void> updateGame(Game game) async {
    await _firestore.collection('games').doc(game.id).update(game.toMap());
  }

  /// Stream game updates
  Stream<Game?> streamGame(String gameId) {
    return _firestore.collection('games').doc(gameId).snapshots().map((doc) {
      if (!doc.exists) return null;
      return Game.fromMap({...doc.data()!, 'id': doc.id});
    });
  }

  /// Get all games
  Stream<List<Game>> streamAllGames() {
    return _firestore
        .collection('games')
        .orderBy('date', descending: true)
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => Game.fromMap({...doc.data(), 'id': doc.id}))
            .toList());
  }

  // ==================== HOLE OPERATIONS ====================

  /// Create a new hole
  Future<String> createHole(Hole hole) async {
    final docRef = await _firestore.collection('holes').add(hole.toMap());
    return docRef.id;
  }

  /// Update hole
  Future<void> updateHole(Hole hole) async {
    await _firestore.collection('holes').doc(hole.id).update(hole.toMap());
  }

  /// Get holes for a game
  Future<List<Hole>> getHolesForGame(String gameId) async {
    final snapshot = await _firestore
        .collection('holes')
        .where('gameId', isEqualTo: gameId)
        .orderBy('holeNumber')
        .get();

    return snapshot.docs
        .map((doc) => Hole.fromMap({...doc.data(), 'id': doc.id}))
        .toList();
  }

  /// Stream holes for a game
  Stream<List<Hole>> streamHolesForGame(String gameId) {
    return _firestore
        .collection('holes')
        .where('gameId', isEqualTo: gameId)
        .orderBy('holeNumber')
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => Hole.fromMap({...doc.data(), 'id': doc.id}))
            .toList());
  }

  /// Initialize all 18 holes for a game
  Future<void> initializeHolesForGame(String gameId) async {
    final batch = _firestore.batch();

    // Standard par for most golf courses (customize as needed)
    final List<int> standardPars = [
      4, 4, 3, 5, 4, 4, 3, 4, 5, // Front 9
      4, 3, 4, 5, 4, 4, 3, 5, 4, // Back 9
    ];

    for (int i = 1; i <= 18; i++) {
      final holeRef = _firestore.collection('holes').doc();
      final hole = Hole(
        id: holeRef.id,
        gameId: gameId,
        holeNumber: i,
        par: standardPars[i - 1],
        isUp: false,
        isBurn: false,
      );
      batch.set(holeRef, hole.toMap());
    }

    await batch.commit();
  }

  // ==================== SCORE OPERATIONS ====================

  /// Create or update a score
  Future<void> upsertScore(Score score) async {
    // Check if score exists
    final existing = await _firestore
        .collection('scores')
        .where('holeId', isEqualTo: score.holeId)
        .where('playerId', isEqualTo: score.playerId)
        .get();

    if (existing.docs.isNotEmpty) {
      // Update existing score
      await _firestore
          .collection('scores')
          .doc(existing.docs.first.id)
          .update(score.toMap());
    } else {
      // Create new score
      await _firestore.collection('scores').add(score.toMap());
    }
  }

  /// Get scores for a hole
  Future<List<Score>> getScoresForHole(String holeId) async {
    final snapshot = await _firestore
        .collection('scores')
        .where('holeId', isEqualTo: holeId)
        .get();

    return snapshot.docs
        .map((doc) => Score.fromMap({...doc.data(), 'id': doc.id}))
        .toList();
  }

  /// Stream scores for a game (all holes)
  Stream<List<Score>> streamScoresForGame(String gameId, List<String> holeIds) {
    if (holeIds.isEmpty) {
      return Stream.value([]);
    }

    return _firestore
        .collection('scores')
        .where('holeId', whereIn: holeIds)
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => Score.fromMap({...doc.data(), 'id': doc.id}))
            .toList());
  }

  /// Get all scores for a specific player in a game
  Future<List<Score>> getScoresForPlayer(
      String gameId, String playerId) async {
    // First get all holes for the game
    final holes = await getHolesForGame(gameId);
    final holeIds = holes.map((h) => h.id).toList();

    if (holeIds.isEmpty) return [];

    // Get scores for this player across all holes
    final snapshot = await _firestore
        .collection('scores')
        .where('holeId', whereIn: holeIds)
        .where('playerId', isEqualTo: playerId)
        .get();

    return snapshot.docs
        .map((doc) => Score.fromMap({...doc.data(), 'id': doc.id}))
        .toList();
  }

  // ==================== PLAYER OPERATIONS ====================

  /// Create a new player
  Future<String> createPlayer(Player player) async {
    final docRef = await _firestore.collection('players').add(player.toMap());
    return docRef.id;
  }

  /// Get player by ID
  Future<Player?> getPlayer(String playerId) async {
    final doc = await _firestore.collection('players').doc(playerId).get();
    if (!doc.exists) return null;
    return Player.fromMap({...doc.data()!, 'id': doc.id});
  }

  /// Get multiple players by IDs
  Future<List<Player>> getPlayers(List<String> playerIds) async {
    if (playerIds.isEmpty) return [];

    final snapshot = await _firestore
        .collection('players')
        .where(FieldPath.documentId, whereIn: playerIds)
        .get();

    return snapshot.docs
        .map((doc) => Player.fromMap({...doc.data(), 'id': doc.id}))
        .toList();
  }

  /// Stream all players
  Stream<List<Player>> streamAllPlayers() {
    return _firestore
        .collection('players')
        .orderBy('name')
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => Player.fromMap({...doc.data(), 'id': doc.id}))
            .toList());
  }

  // ==================== BATCH OPERATIONS ====================

  /// Delete a game and all associated data
  Future<void> deleteGame(String gameId) async {
    final batch = _firestore.batch();

    // Delete all holes for this game
    final holes = await getHolesForGame(gameId);
    for (var hole in holes) {
      batch.delete(_firestore.collection('holes').doc(hole.id));

      // Delete all scores for this hole
      final scores = await getScoresForHole(hole.id);
      for (var score in scores) {
        batch.delete(_firestore.collection('scores').doc(score.id));
      }
    }

    // Delete the game itself
    batch.delete(_firestore.collection('games').doc(gameId));

    await batch.commit();
  }
}
