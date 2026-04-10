import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/game.dart';
import '../models/player.dart';
import '../providers/game_providers.dart';
import 'scoring_screen.dart';

class GameSetupScreen extends ConsumerStatefulWidget {
  const GameSetupScreen({super.key});

  @override
  ConsumerState<GameSetupScreen> createState() => _GameSetupScreenState();
}

class _GameSetupScreenState extends ConsumerState<GameSetupScreen> {
  final TextEditingController _playerNameController = TextEditingController();
  final List<String> _selectedPlayerIds = [];
  bool _isCreatingGame = false;

  @override
  void dispose() {
    _playerNameController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final allPlayersAsync = ref.watch(allPlayersProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Game Setup'),
        backgroundColor: Colors.green[700],
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'Select Players for the Game',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),

            // Add new player section
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _playerNameController,
                    decoration: const InputDecoration(
                      labelText: 'New Player Name',
                      border: OutlineInputBorder(),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                ElevatedButton.icon(
                  onPressed: _addNewPlayer,
                  icon: const Icon(Icons.add),
                  label: const Text('Add'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.green[600],
                    foregroundColor: Colors.white,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Player selection list
            const Text(
              'Available Players:',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),

            Expanded(
              child: allPlayersAsync.when(
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (error, stack) => Center(child: Text('Error: $error')),
                data: (players) {
                  if (players.isEmpty) {
                    return const Center(
                      child: Text('No players available. Add a player above.'),
                    );
                  }

                  return ListView.builder(
                    itemCount: players.length,
                    itemBuilder: (context, index) {
                      final player = players[index];
                      final isSelected = _selectedPlayerIds.contains(player.id);

                      return Card(
                        child: CheckboxListTile(
                          title: Text(player.name),
                          value: isSelected,
                          onChanged: (bool? value) {
                            setState(() {
                              if (value == true) {
                                _selectedPlayerIds.add(player.id);
                              } else {
                                _selectedPlayerIds.remove(player.id);
                              }
                            });
                          },
                        ),
                      );
                    },
                  );
                },
              ),
            ),

            const SizedBox(height: 16),

            // Selected players count
            Text(
              'Selected: ${_selectedPlayerIds.length} players',
              style: TextStyle(
                fontSize: 16,
                color: _selectedPlayerIds.length < 2
                    ? Colors.red
                    : Colors.green[700],
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),

            // Create game button
            ElevatedButton(
              onPressed: _selectedPlayerIds.length >= 2 && !_isCreatingGame
                  ? _createGame
                  : null,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.green[700],
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
              child: _isCreatingGame
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                      ),
                    )
                  : const Text(
                      'Create Game',
                      style: TextStyle(fontSize: 18),
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _addNewPlayer() async {
    final name = _playerNameController.text.trim();
    if (name.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a player name')),
      );
      return;
    }

    try {
      final service = ref.read(firestoreServiceProvider);
      final playerId = await service.createPlayer(Player(
        id: '',
        name: name,
      ));

      _playerNameController.clear();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Player "$name" added successfully')),
        );

        // Auto-select the newly added player
        setState(() {
          _selectedPlayerIds.add(playerId);
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error adding player: $e')),
        );
      }
    }
  }

  Future<void> _createGame() async {
    if (_selectedPlayerIds.length < 2) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select at least 2 players')),
      );
      return;
    }

    setState(() {
      _isCreatingGame = true;
    });

    try {
      final service = ref.read(firestoreServiceProvider);

      // Create the game
      final game = Game(
        id: '',
        date: DateTime.now(),
        status: 'active',
        playerIds: _selectedPlayerIds,
      );

      final gameId = await service.createGame(game);

      // Initialize 18 holes for the game
      await service.initializeHolesForGame(gameId);

      // Set the current game ID in the provider
      ref.read(currentGameIdProvider.notifier).state = gameId;

      if (mounted) {
        // Navigate to scoring screen
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(
            builder: (context) => const ScoringScreen(),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error creating game: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isCreatingGame = false;
        });
      }
    }
  }
}
