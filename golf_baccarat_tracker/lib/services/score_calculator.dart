import '../models/hole.dart';
import '../models/score.dart';
import '../models/player.dart';

class PlayerPoints {
  final String playerId;
  final double points;

  PlayerPoints({required this.playerId, required this.points});
}

class HoleResult {
  final int holeNumber;
  final Map<String, double> playerPoints;
  final double multiplier;
  final bool hasBirdie;
  final bool hasEagle;

  HoleResult({
    required this.holeNumber,
    required this.playerPoints,
    required this.multiplier,
    this.hasBirdie = false,
    this.hasEagle = false,
  });
}

class ScoreCalculator {
  /// Calculate points for all players on a single hole
  /// Returns a map of playerId -> points earned on this hole
  static Map<String, double> calculateHolePoints({
    required Hole hole,
    required List<Score> scoresForHole,
    required List<Player> allPlayers,
  }) {
    // Initialize points map for all players
    final Map<String, double> playerPoints = {
      for (var player in allPlayers) player.id: 0.0
    };

    if (scoresForHole.isEmpty) {
      return playerPoints;
    }

    // Calculate the multiplier for this hole
    final double multiplier = _calculateHoleMultiplier(
      hole: hole,
      scores: scoresForHole,
    );

    // Compare every player against every other player (round-robin)
    for (int i = 0; i < scoresForHole.length; i++) {
      for (int j = i + 1; j < scoresForHole.length; j++) {
        final score1 = scoresForHole[i];
        final score2 = scoresForHole[j];

        // Calculate net scores
        final netScore1 = score1.netScore;
        final netScore2 = score2.netScore;

        // Determine winner and award points
        if (netScore1 < netScore2) {
          // Player 1 wins
          playerPoints[score1.playerId] =
              playerPoints[score1.playerId]! + (1.0 * multiplier);
          playerPoints[score2.playerId] =
              playerPoints[score2.playerId]! - (1.0 * multiplier);
        } else if (netScore2 < netScore1) {
          // Player 2 wins
          playerPoints[score2.playerId] =
              playerPoints[score2.playerId]! + (1.0 * multiplier);
          playerPoints[score1.playerId] =
              playerPoints[score1.playerId]! - (1.0 * multiplier);
        }
        // If netScore1 == netScore2, it's a draw, no points awarded
      }
    }

    return playerPoints;
  }

  /// Calculate the multiplier for a hole based on status and special scores
  static double _calculateHoleMultiplier({
    required Hole hole,
    required List<Score> scores,
  }) {
    double multiplier = 1.0;

    // Apply "Up" multiplier (x2)
    if (hole.isUp) {
      multiplier *= 2.0;
    }

    // Apply "Burn" multiplier (x3)
    if (hole.isBurn) {
      multiplier *= 3.0;
    }

    // Check for Birdie (exactly 1 stroke under par)
    final hasBirdie = scores.any((score) => score.strokes == hole.par - 1);
    if (hasBirdie) {
      multiplier *= 2.0;
    }

    // Check for Eagle (2 or more strokes under par)
    final hasEagle = scores.any((score) => score.strokes <= hole.par - 2);
    if (hasEagle) {
      multiplier *= 3.0;
    }

    return multiplier;
  }

  /// Calculate accumulated points for all players across all holes
  static Map<String, double> calculateTotalPoints({
    required List<Hole> holes,
    required Map<String, List<Score>> scoresByHoleId,
    required List<Player> allPlayers,
  }) {
    final Map<String, double> totalPoints = {
      for (var player in allPlayers) player.id: 0.0
    };

    for (var hole in holes) {
      final scoresForHole = scoresByHoleId[hole.id] ?? [];
      final holePoints = calculateHolePoints(
        hole: hole,
        scoresForHole: scoresForHole,
        allPlayers: allPlayers,
      );

      // Add hole points to total points
      holePoints.forEach((playerId, points) {
        totalPoints[playerId] = totalPoints[playerId]! + points;
      });
    }

    return totalPoints;
  }

  /// Get detailed results for each hole (useful for debugging and display)
  static List<HoleResult> getDetailedHoleResults({
    required List<Hole> holes,
    required Map<String, List<Score>> scoresByHoleId,
    required List<Player> allPlayers,
  }) {
    final results = <HoleResult>[];

    for (var hole in holes) {
      final scoresForHole = scoresByHoleId[hole.id] ?? [];
      final holePoints = calculateHolePoints(
        hole: hole,
        scoresForHole: scoresForHole,
        allPlayers: allPlayers,
      );

      final multiplier = _calculateHoleMultiplier(
        hole: hole,
        scores: scoresForHole,
      );

      final hasBirdie = scoresForHole.any((s) => s.strokes == hole.par - 1);
      final hasEagle = scoresForHole.any((s) => s.strokes <= hole.par - 2);

      results.add(HoleResult(
        holeNumber: hole.holeNumber,
        playerPoints: holePoints,
        multiplier: multiplier,
        hasBirdie: hasBirdie,
        hasEagle: hasEagle,
      ));
    }

    return results;
  }

  /// Calculate running total points up to a specific hole
  static Map<String, double> calculateRunningTotal({
    required List<Hole> holesUpTo,
    required Map<String, List<Score>> scoresByHoleId,
    required List<Player> allPlayers,
  }) {
    return calculateTotalPoints(
      holes: holesUpTo,
      scoresByHoleId: scoresByHoleId,
      allPlayers: allPlayers,
    );
  }
}
