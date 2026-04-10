import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { crossPlatformAlert } from '../../utils/crossPlatformAlert';
import { Button, Card } from '../../components/common';
import { dataService } from '../../services/DataService';
import { Player, Game } from '../../types';
import { typography, spacing } from '../../theme';
import { useThemedColors } from '../../contexts/ThemeContext';
import { useRoute, useNavigation } from '@react-navigation/native';
import { createHandicapKey, setHandicapForPair, getHandicapForMatchup } from '../../utils/handicapUtils';

export const HandicapSetupScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const colors = useThemedColors();
  const { gameId } = route.params;

  const [game, setGame] = useState<Game | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [handicaps, setHandicaps] = useState<{ [pairKey: string]: number }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [gameId]);

  const loadData = async () => {
    try {
      const gameData = await dataService.getGame(gameId);
      if (gameData) {
        setGame(gameData);
        setHandicaps(gameData.handicaps || {});
        const playerData = await dataService.getPlayersForGame(gameData);
        setPlayers(playerData);
      }
      setLoading(false);
    } catch (error) {
      crossPlatformAlert('Error', 'Failed to load game data');
      setLoading(false);
    }
  };

  const updateHandicap = (fromPlayerId: string, toPlayerId: string, strokes: number) => {
    const newHandicaps = setHandicapForPair(handicaps, fromPlayerId, toPlayerId, strokes);
    setHandicaps(newHandicaps);
  };

  const saveHandicaps = async () => {
    try {
      await dataService.updateGame(gameId, { handicaps });
      crossPlatformAlert('Success', 'Handicaps saved successfully', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      crossPlatformAlert('Error', 'Failed to save handicaps');
    }
  };

  const getPlayerPairs = (): Array<{ player1: Player; player2: Player }> => {
    const pairs: Array<{ player1: Player; player2: Player }> = [];
    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        pairs.push({ player1: players[i], player2: players[j] });
      }
    }
    return pairs;
  };

  const styles = useMemo(() => createStyles(colors), [colors]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const pairs = getPlayerPairs();

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Handicap Setup</Text>
          <Text style={styles.subtitle}>
            Set strokes each player receives from their opponents
          </Text>
        </View>

        {pairs.map(({ player1, player2 }) => {
          const currentHandicap = getHandicapForMatchup(handicaps, player1.id, player2.id);
          const player1Receives = currentHandicap > 0;
          const player2Receives = currentHandicap < 0;
          const strokeCount = Math.abs(currentHandicap);

          return (
            <Card key={`${player1.id}_${player2.id}`} style={styles.pairCard}>
              <View style={styles.pairHeader}>
                <Text style={styles.pairTitle}>
                  {player1.name} vs {player2.name}
                </Text>
              </View>

              <View style={styles.handicapControls}>
                {/* Player 1 receives strokes */}
                <View style={styles.playerColumn}>
                  <Text style={styles.playerName}>{player1.name} receives:</Text>
                  <View style={styles.counterContainer}>
                    <TouchableOpacity
                      style={styles.counterButton}
                      onPress={() => {
                        const current = player1Receives ? strokeCount : 0;
                        if (current > 0) {
                          updateHandicap(player2.id, player1.id, current - 1);
                        }
                      }}
                      disabled={!player1Receives || strokeCount === 0}
                    >
                      <Text style={styles.counterButtonText}>-</Text>
                    </TouchableOpacity>

                    <Text style={styles.counterValue}>
                      {player1Receives ? strokeCount : 0}
                    </Text>

                    <TouchableOpacity
                      style={styles.counterButton}
                      onPress={() => {
                        const current = player1Receives ? strokeCount : 0;
                        if (current < 2) {
                          updateHandicap(player2.id, player1.id, current + 1);
                        }
                      }}
                      disabled={player1Receives && strokeCount >= 2}
                    >
                      <Text style={styles.counterButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Player 2 receives strokes */}
                <View style={styles.playerColumn}>
                  <Text style={styles.playerName}>{player2.name} receives:</Text>
                  <View style={styles.counterContainer}>
                    <TouchableOpacity
                      style={styles.counterButton}
                      onPress={() => {
                        const current = player2Receives ? strokeCount : 0;
                        if (current > 0) {
                          updateHandicap(player1.id, player2.id, current - 1);
                        }
                      }}
                      disabled={!player2Receives || strokeCount === 0}
                    >
                      <Text style={styles.counterButtonText}>-</Text>
                    </TouchableOpacity>

                    <Text style={styles.counterValue}>
                      {player2Receives ? strokeCount : 0}
                    </Text>

                    <TouchableOpacity
                      style={styles.counterButton}
                      onPress={() => {
                        const current = player2Receives ? strokeCount : 0;
                        if (current < 2) {
                          updateHandicap(player1.id, player2.id, current + 1);
                        }
                      }}
                      disabled={player2Receives && strokeCount >= 2}
                    >
                      <Text style={styles.counterButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {strokeCount === 0 && (
                <Text style={styles.evenText}>Players are even</Text>
              )}
            </Card>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <Button title="Save Handicaps" onPress={saveHandicaps} />
      </View>
    </View>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: spacing.lg,
    backgroundColor: colors.background.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  title: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
  },
  pairCard: {
    margin: spacing.md,
    padding: spacing.md,
  },
  pairHeader: {
    marginBottom: spacing.md,
  },
  pairTitle: {
    ...typography.h3,
    textAlign: 'center',
  },
  handicapControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.md,
  },
  playerColumn: {
    flex: 1,
    alignItems: 'center',
  },
  playerName: {
    ...typography.body,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  counterButton: {
    backgroundColor: colors.primary[500],
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterButtonText: {
    color: colors.text.inverse,
    fontSize: 20,
    fontWeight: 'bold',
  },
  counterValue: {
    ...typography.h2,
    minWidth: 40,
    textAlign: 'center',
  },
  evenText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.md,
    fontStyle: 'italic',
  },
  footer: {
    padding: spacing.md,
    backgroundColor: colors.background.card,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
});
