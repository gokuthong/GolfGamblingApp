import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pluto_grid/pluto_grid.dart';
import '../models/hole.dart';
import '../models/score.dart';
import '../models/player.dart';
import '../providers/game_providers.dart';

class ScoringScreen extends ConsumerStatefulWidget {
  const ScoringScreen({super.key});

  @override
  ConsumerState<ScoringScreen> createState() => _ScoringScreenState();
}

class _ScoringScreenState extends ConsumerState<ScoringScreen> {
  late PlutoGridStateManager stateManager;
  List<PlutoColumn> columns = [];
  List<PlutoRow> rows = [];

  @override
  Widget build(BuildContext context) {
    final holesAsync = ref.watch(holesProvider);
    final playersAsync = ref.watch(gamePlayersProvider);
    final scoresAsync = ref.watch(scoresProvider);
    final runningTotals = ref.watch(runningTotalsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Golf Baccarat Tracker'),
        backgroundColor: Colors.green[700],
      ),
      body: holesAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(child: Text('Error: $error')),
        data: (holes) {
          return playersAsync.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (error, stack) => Center(child: Text('Error: $error')),
            data: (players) {
              return scoresAsync.when(
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (error, stack) => Center(child: Text('Error: $error')),
                data: (scores) {
                  if (holes.isEmpty || players.isEmpty) {
                    return const Center(
                      child: Text('No game data available'),
                    );
                  }

                  _buildGridData(holes, players, scores, runningTotals);

                  return PlutoGrid(
                    columns: columns,
                    rows: rows,
                    onLoaded: (PlutoGridOnLoadedEvent event) {
                      stateManager = event.stateManager;
                      stateManager.setShowColumnFilter(false);
                    },
                    onChanged: (PlutoGridOnChangedEvent event) {
                      _handleCellChange(event, holes, players);
                    },
                    configuration: PlutoGridConfiguration(
                      style: PlutoGridStyleConfig(
                        gridBorderRadius: BorderRadius.circular(8),
                        enableCellBorderVertical: true,
                        enableCellBorderHorizontal: true,
                        cellTextStyle: const TextStyle(fontSize: 14),
                        columnTextStyle: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      columnSize: const PlutoGridColumnSizeConfig(
                        autoSizeMode: PlutoAutoSizeMode.scale,
                      ),
                    ),
                  );
                },
              );
            },
          );
        },
      ),
    );
  }

  void _buildGridData(
    List<Hole> holes,
    List<Player> players,
    List<Score> scores,
    List<Map<String, double>> runningTotals,
  ) {
    // Build columns
    columns = [];

    // Column 1: Hole Number
    columns.add(
      PlutoColumn(
        title: 'Hole',
        field: 'hole',
        type: PlutoColumnType.number(),
        width: 60,
        enableEditingMode: false,
        backgroundColor: Colors.grey[200],
      ),
    );

    // Column 2: Par
    columns.add(
      PlutoColumn(
        title: 'Par',
        field: 'par',
        type: PlutoColumnType.number(),
        width: 60,
        enableEditingMode: true,
      ),
    );

    // Column 3: Up Toggle
    columns.add(
      PlutoColumn(
        title: 'Up',
        field: 'isUp',
        type: PlutoColumnType.text(),
        width: 60,
        enableEditingMode: true,
        renderer: (rendererContext) {
          final isUp = rendererContext.cell.value == 'true';
          return GestureDetector(
            onTap: () => _toggleHoleStatus(
              holes[rendererContext.rowIdx],
              'isUp',
            ),
            child: Container(
              alignment: Alignment.center,
              color: isUp ? Colors.orange[300] : Colors.transparent,
              child: Text(isUp ? '2X' : ''),
            ),
          );
        },
      ),
    );

    // Column 4: Burn Toggle
    columns.add(
      PlutoColumn(
        title: 'Burn',
        field: 'isBurn',
        type: PlutoColumnType.text(),
        width: 60,
        enableEditingMode: true,
        renderer: (rendererContext) {
          final isBurn = rendererContext.cell.value == 'true';
          return GestureDetector(
            onTap: () => _toggleHoleStatus(
              holes[rendererContext.rowIdx],
              'isBurn',
            ),
            child: Container(
              alignment: Alignment.center,
              color: isBurn ? Colors.red[300] : Colors.transparent,
              child: Text(isBurn ? '3X' : ''),
            ),
          );
        },
      ),
    );

    // Columns for each player (Strokes, Handicap, Points)
    for (var player in players) {
      // Strokes column
      columns.add(
        PlutoColumn(
          title: '${player.name}\nStrokes',
          field: '${player.id}_strokes',
          type: PlutoColumnType.number(),
          width: 80,
          enableEditingMode: true,
        ),
      );

      // Handicap column
      columns.add(
        PlutoColumn(
          title: '${player.name}\nHcp',
          field: '${player.id}_handicap',
          type: PlutoColumnType.number(),
          width: 70,
          enableEditingMode: true,
        ),
      );

      // Points column (calculated, read-only)
      columns.add(
        PlutoColumn(
          title: '${player.name}\nPoints',
          field: '${player.id}_points',
          type: PlutoColumnType.number(),
          width: 80,
          enableEditingMode: false,
          backgroundColor: Colors.blue[50],
          renderer: (rendererContext) {
            final value = rendererContext.cell.value;
            final doubleValue = double.tryParse(value.toString()) ?? 0.0;
            return Container(
              alignment: Alignment.center,
              color: doubleValue > 0
                  ? Colors.green[100]
                  : doubleValue < 0
                      ? Colors.red[100]
                      : Colors.blue[50],
              child: Text(
                doubleValue.toStringAsFixed(1),
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: doubleValue > 0
                      ? Colors.green[900]
                      : doubleValue < 0
                          ? Colors.red[900]
                          : Colors.black,
                ),
              ),
            );
          },
        ),
      );
    }

    // Build rows (18 holes + 1 total row)
    rows = [];

    // Group scores by hole ID for easier lookup
    final Map<String, Map<String, Score>> scoresByHoleAndPlayer = {};
    for (var score in scores) {
      if (!scoresByHoleAndPlayer.containsKey(score.holeId)) {
        scoresByHoleAndPlayer[score.holeId] = {};
      }
      scoresByHoleAndPlayer[score.holeId]![score.playerId] = score;
    }

    // Create rows for each hole
    for (int i = 0; i < holes.length; i++) {
      final hole = holes[i];
      final Map<String, PlutoCell> cells = {
        'hole': PlutoCell(value: hole.holeNumber),
        'par': PlutoCell(value: hole.par),
        'isUp': PlutoCell(value: hole.isUp.toString()),
        'isBurn': PlutoCell(value: hole.isBurn.toString()),
      };

      // Add player data
      for (var player in players) {
        final score = scoresByHoleAndPlayer[hole.id]?[player.id];
        cells['${player.id}_strokes'] = PlutoCell(value: score?.strokes ?? 0);
        cells['${player.id}_handicap'] = PlutoCell(value: score?.handicap ?? 0);

        // Get running total for this hole
        final points = i < runningTotals.length
            ? runningTotals[i][player.id] ?? 0.0
            : 0.0;
        cells['${player.id}_points'] = PlutoCell(value: points);
      }

      rows.add(PlutoRow(cells: cells));
    }

    // Add total row
    final Map<String, PlutoCell> totalCells = {
      'hole': PlutoCell(value: 'Total'),
      'par': PlutoCell(value: holes.fold<int>(0, (sum, hole) => sum + hole.par)),
      'isUp': PlutoCell(value: ''),
      'isBurn': PlutoCell(value: ''),
    };

    for (var player in players) {
      final totalStrokes = scores
          .where((s) => s.playerId == player.id)
          .fold<int>(0, (sum, score) => sum + score.strokes);
      final totalHandicap = scores
          .where((s) => s.playerId == player.id)
          .fold<int>(0, (sum, score) => sum + score.handicap);
      final totalPoints = runningTotals.isNotEmpty
          ? runningTotals.last[player.id] ?? 0.0
          : 0.0;

      totalCells['${player.id}_strokes'] = PlutoCell(value: totalStrokes);
      totalCells['${player.id}_handicap'] = PlutoCell(value: totalHandicap);
      totalCells['${player.id}_points'] = PlutoCell(value: totalPoints);
    }

    rows.add(PlutoRow(cells: totalCells));
  }

  void _handleCellChange(
    PlutoGridOnChangedEvent event,
    List<Hole> holes,
    List<Player> players,
  ) {
    final rowIdx = event.rowIdx;
    if (rowIdx >= holes.length) return; // Don't edit total row

    final hole = holes[rowIdx];
    final field = event.column.field;

    // Handle par change
    if (field == 'par') {
      final newPar = int.tryParse(event.value.toString()) ?? hole.par;
      _updateHole(hole.copyWith(par: newPar));
      return;
    }

    // Handle player strokes/handicap change
    for (var player in players) {
      if (field == '${player.id}_strokes') {
        final strokes = int.tryParse(event.value.toString()) ?? 0;
        final handicap = int.tryParse(
              event.row.cells['${player.id}_handicap']?.value.toString() ?? '0',
            ) ??
            0;
        _updateScore(hole.id, player.id, strokes, handicap);
        return;
      }

      if (field == '${player.id}_handicap') {
        final handicap = int.tryParse(event.value.toString()) ?? 0;
        final strokes = int.tryParse(
              event.row.cells['${player.id}_strokes']?.value.toString() ?? '0',
            ) ??
            0;
        _updateScore(hole.id, player.id, strokes, handicap);
        return;
      }
    }
  }

  void _toggleHoleStatus(Hole hole, String field) {
    if (field == 'isUp') {
      _updateHole(hole.copyWith(isUp: !hole.isUp));
    } else if (field == 'isBurn') {
      _updateHole(hole.copyWith(isBurn: !hole.isBurn));
    }
  }

  void _updateHole(Hole hole) {
    final service = ref.read(firestoreServiceProvider);
    service.updateHole(hole);
  }

  void _updateScore(String holeId, String playerId, int strokes, int handicap) {
    final service = ref.read(firestoreServiceProvider);
    final score = Score(
      id: '',
      holeId: holeId,
      playerId: playerId,
      strokes: strokes,
      handicap: handicap,
    );
    service.upsertScore(score);
  }
}
