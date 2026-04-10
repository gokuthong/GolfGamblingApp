import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/game.dart';
import '../models/hole.dart';
import '../models/score.dart';
import '../models/player.dart';
import '../services/firestore_service.dart';
import '../services/score_calculator.dart';

// ==================== SERVICE PROVIDERS ====================

final firestoreServiceProvider = Provider<FirestoreService>((ref) {
  return FirestoreService();
});

// ==================== STATE PROVIDERS ====================

/// Current active game ID
final currentGameIdProvider = StateProvider<String?>((ref) => null);

/// Selected players for a new game
final selectedPlayersProvider = StateProvider<List<String>>((ref) => []);

// ==================== STREAM PROVIDERS ====================

/// Stream all players
final allPlayersProvider = StreamProvider<List<Player>>((ref) {
  final service = ref.watch(firestoreServiceProvider);
  return service.streamAllPlayers();
});

/// Stream current game
final currentGameProvider = StreamProvider<Game?>((ref) {
  final gameId = ref.watch(currentGameIdProvider);
  if (gameId == null) return Stream.value(null);

  final service = ref.watch(firestoreServiceProvider);
  return service.streamGame(gameId);
});

/// Stream holes for current game
final holesProvider = StreamProvider<List<Hole>>((ref) {
  final gameId = ref.watch(currentGameIdProvider);
  if (gameId == null) return Stream.value([]);

  final service = ref.watch(firestoreServiceProvider);
  return service.streamHolesForGame(gameId);
});

/// Stream scores for current game
final scoresProvider = StreamProvider<List<Score>>((ref) {
  final gameId = ref.watch(currentGameIdProvider);
  if (gameId == null) return Stream.value([]);

  final holesAsync = ref.watch(holesProvider);

  return holesAsync.when(
    data: (holes) {
      final holeIds = holes.map((h) => h.id).toList();
      if (holeIds.isEmpty) return Stream.value([]);

      final service = ref.watch(firestoreServiceProvider);
      return service.streamScoresForGame(gameId, holeIds);
    },
    loading: () => Stream.value([]),
    error: (_, __) => Stream.value([]),
  );
});

/// Stream players for current game
final gamePlayersProvider = StreamProvider<List<Player>>((ref) {
  final gameAsync = ref.watch(currentGameProvider);

  return gameAsync.when(
    data: (game) async* {
      if (game == null || game.playerIds.isEmpty) {
        yield [];
        return;
      }

      final service = ref.watch(firestoreServiceProvider);
      final players = await service.getPlayers(game.playerIds);
      yield players;
    },
    loading: () => Stream.value([]),
    error: (_, __) => Stream.value([]),
  );
});

// ==================== COMPUTED PROVIDERS ====================

/// Calculate scores by hole ID
final scoresByHoleIdProvider = Provider<Map<String, List<Score>>>((ref) {
  final scoresAsync = ref.watch(scoresProvider);

  return scoresAsync.when(
    data: (scores) {
      final Map<String, List<Score>> scoresByHoleId = {};
      for (var score in scores) {
        if (!scoresByHoleId.containsKey(score.holeId)) {
          scoresByHoleId[score.holeId] = [];
        }
        scoresByHoleId[score.holeId]!.add(score);
      }
      return scoresByHoleId;
    },
    loading: () => {},
    error: (_, __) => {},
  );
});

/// Calculate total points for all players
final totalPointsProvider = Provider<Map<String, double>>((ref) {
  final holesAsync = ref.watch(holesProvider);
  final playersAsync = ref.watch(gamePlayersProvider);
  final scoresByHoleId = ref.watch(scoresByHoleIdProvider);

  return holesAsync.when(
    data: (holes) {
      return playersAsync.when(
        data: (players) {
          if (holes.isEmpty || players.isEmpty) {
            return {};
          }

          return ScoreCalculator.calculateTotalPoints(
            holes: holes,
            scoresByHoleId: scoresByHoleId,
            allPlayers: players,
          );
        },
        loading: () => {},
        error: (_, __) => {},
      );
    },
    loading: () => {},
    error: (_, __) => {},
  );
});

/// Calculate points for each hole
final holePointsProvider = Provider<List<HoleResult>>((ref) {
  final holesAsync = ref.watch(holesProvider);
  final playersAsync = ref.watch(gamePlayersProvider);
  final scoresByHoleId = ref.watch(scoresByHoleIdProvider);

  return holesAsync.when(
    data: (holes) {
      return playersAsync.when(
        data: (players) {
          if (holes.isEmpty || players.isEmpty) {
            return [];
          }

          return ScoreCalculator.getDetailedHoleResults(
            holes: holes,
            scoresByHoleId: scoresByHoleId,
            allPlayers: players,
          );
        },
        loading: () => [],
        error: (_, __) => [],
      );
    },
    loading: () => [],
    error: (_, __) => [],
  );
});

/// Calculate running totals (accumulated points up to each hole)
final runningTotalsProvider = Provider<List<Map<String, double>>>((ref) {
  final holesAsync = ref.watch(holesProvider);
  final playersAsync = ref.watch(gamePlayersProvider);
  final scoresByHoleId = ref.watch(scoresByHoleIdProvider);

  return holesAsync.when(
    data: (holes) {
      return playersAsync.when(
        data: (players) {
          if (holes.isEmpty || players.isEmpty) {
            return [];
          }

          final List<Map<String, double>> runningTotals = [];

          for (int i = 0; i < holes.length; i++) {
            final holesUpTo = holes.sublist(0, i + 1);
            final total = ScoreCalculator.calculateRunningTotal(
              holesUpTo: holesUpTo,
              scoresByHoleId: scoresByHoleId,
              allPlayers: players,
            );
            runningTotals.add(total);
          }

          return runningTotals;
        },
        loading: () => [],
        error: (_, __) => [],
      );
    },
    loading: () => [],
    error: (_, __) => [],
  );
});
