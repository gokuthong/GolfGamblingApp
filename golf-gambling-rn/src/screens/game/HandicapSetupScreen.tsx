import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { crossPlatformAlert } from "../../utils/crossPlatformAlert";
import { Button, Card, Icon } from "../../components/common";
import { dataService } from "../../services/DataService";
import { Player, Game } from "../../types";
import { typography, spacing, fontFamilies, borderRadius } from "../../theme";
import { useThemedColors } from "../../contexts/ThemeContext";
import { useRoute, useNavigation } from "@react-navigation/native";
import {
  setHandicapForPair,
  getHandicapForMatchup,
} from "../../utils/handicapUtils";

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
      crossPlatformAlert("Error", "Failed to load game data");
      setLoading(false);
    }
  };

  const updateHandicap = (
    fromPlayerId: string,
    toPlayerId: string,
    strokes: number,
  ) => {
    const newHandicaps = setHandicapForPair(
      handicaps,
      fromPlayerId,
      toPlayerId,
      strokes,
    );
    setHandicaps(newHandicaps);
  };

  const saveHandicaps = async () => {
    try {
      await dataService.updateGame(gameId, { handicaps });
      crossPlatformAlert("Success", "Handicaps saved successfully", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      crossPlatformAlert("Error", "Failed to save handicaps");
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
        <Text style={styles.loadingText}>Loading…</Text>
      </View>
    );
  }

  const pairs = getPlayerPairs();

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>Pre-match</Text>
          <Text style={styles.heroTitle}>Handicap setup</Text>
          <View style={styles.goldRule} />
          <Text style={styles.heroMeta}>
            Set strokes each player receives from their opponents.
          </Text>
        </View>

        {pairs.map(({ player1, player2 }) => {
          const currentHandicap = getHandicapForMatchup(
            handicaps,
            player1.id,
            player2.id,
          );
          const player1Receives = currentHandicap > 0;
          const player2Receives = currentHandicap < 0;
          const strokeCount = Math.abs(currentHandicap);

          return (
            <Card key={`${player1.id}_${player2.id}`} style={styles.pairCard}>
              <View style={styles.pairHeader}>
                <Text style={styles.pairTitle}>
                  {player1.name}
                  <Text style={styles.pairVs}>  vs  </Text>
                  {player2.name}
                </Text>
              </View>

              <View style={styles.handicapControls}>
                <View style={styles.playerColumn}>
                  <Text style={styles.playerReceivesLabel}>{player1.name}</Text>
                  <Text style={styles.playerReceivesHint}>receives</Text>
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
                      <Icon name="minus" size={16} color={colors.text.primary} />
                    </TouchableOpacity>

                    <Text
                      style={[
                        styles.counterValue,
                        player1Receives && strokeCount > 0 && styles.counterValueActive,
                      ]}
                    >
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
                      <Icon name="plus" size={16} color={colors.text.primary} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.verticalRule} />

                <View style={styles.playerColumn}>
                  <Text style={styles.playerReceivesLabel}>{player2.name}</Text>
                  <Text style={styles.playerReceivesHint}>receives</Text>
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
                      <Icon name="minus" size={16} color={colors.text.primary} />
                    </TouchableOpacity>

                    <Text
                      style={[
                        styles.counterValue,
                        player2Receives && strokeCount > 0 && styles.counterValueActive,
                      ]}
                    >
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
                      <Icon name="plus" size={16} color={colors.text.primary} />
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

        <View style={styles.footerSpacer} />
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Save handicaps"
          onPress={saveHandicaps}
          variant="gold"
          fullWidth
          size="large"
        />
      </View>
    </View>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background.primary,
    },
    centered: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background.primary,
    },
    loadingText: {
      ...typography.bodyMedium,
      color: colors.text.secondary,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.xxxl,
      paddingBottom: spacing.xxl,
    },
    hero: {
      marginBottom: spacing.xl,
    },
    eyebrow: {
      ...typography.label,
      color: colors.text.tertiary,
      textTransform: "uppercase",
      marginBottom: spacing.sm,
    },
    heroTitle: {
      ...typography.displayMedium,
      color: colors.text.primary,
      marginBottom: spacing.md,
    },
    goldRule: {
      height: 1.5,
      width: 48,
      backgroundColor: colors.accent.gold,
      borderRadius: 1,
      marginBottom: spacing.md,
    },
    heroMeta: {
      ...typography.bodyLarge,
      color: colors.text.secondary,
      maxWidth: 340,
    },
    pairCard: {
      marginBottom: spacing.md,
      padding: spacing.lg,
    },
    pairHeader: {
      marginBottom: spacing.md,
      alignItems: "center",
    },
    pairTitle: {
      ...typography.h3,
      color: colors.text.primary,
      textAlign: "center",
    },
    pairVs: {
      ...typography.label,
      color: colors.accent.gold,
      textTransform: "uppercase",
    },
    handicapControls: {
      flexDirection: "row",
      justifyContent: "space-around",
      alignItems: "center",
      marginTop: spacing.sm,
    },
    playerColumn: {
      flex: 1,
      alignItems: "center",
    },
    verticalRule: {
      width: 1,
      alignSelf: "stretch",
      backgroundColor: colors.border.light,
      marginHorizontal: spacing.sm,
    },
    playerReceivesLabel: {
      ...typography.bodyMedium,
      fontFamily: fontFamilies.bodySemiBold,
      color: colors.text.primary,
      textAlign: "center",
    },
    playerReceivesHint: {
      ...typography.label,
      color: colors.text.tertiary,
      textTransform: "uppercase",
      marginBottom: spacing.sm,
    },
    counterContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
    },
    counterButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border.goldSubtle,
      backgroundColor: colors.background.card,
      justifyContent: "center",
      alignItems: "center",
    },
    counterValue: {
      fontFamily: fontFamilies.display,
      fontSize: 32,
      color: colors.text.tertiary,
      minWidth: 32,
      textAlign: "center",
      letterSpacing: -0.5,
    },
    counterValueActive: {
      color: colors.accent.gold,
    },
    evenText: {
      ...typography.bodySmall,
      color: colors.text.tertiary,
      textAlign: "center",
      marginTop: spacing.md,
      fontStyle: "italic",
    },
    footerSpacer: {
      height: 80,
    },
    footer: {
      padding: spacing.lg,
      paddingBottom: spacing.xl,
      backgroundColor: colors.background.primary,
      borderTopWidth: 1,
      borderTopColor: colors.border.light,
    },
  });

export default HandicapSetupScreen;
