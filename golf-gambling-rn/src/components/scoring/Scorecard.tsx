import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../common';
import { Hole, Score, Player } from '../../types';
import { typography, spacing, fontFamilies, borderRadius } from '../../theme';
import { useThemedColors } from '../../contexts/ThemeContext';

interface ScorecardProps {
  holes: Hole[];
  scores: Score[];
  players: Player[];
  courseName?: string;
}

export const Scorecard = ({ holes, scores, players, courseName }: ScorecardProps) => {
  const colors = useThemedColors();

  // Sort holes by hole number
  const sortedHoles = [...holes].sort((a, b) => a.holeNumber - b.holeNumber);

  // Get strokes for a specific player and hole (returns null for non-confirmed holes)
  const getStrokesForHole = (playerId: string, holeId: string): number | null => {
    const hole = holes.find(h => h.id === holeId);
    // If hole is not confirmed, return null (show blank)
    if (hole && hole.confirmed === false) {
      return null;
    }
    const score = scores.find(s => s.playerId === playerId && s.holeId === holeId);
    // If no score exists, default to par (player hasn't modified their score)
    if (!score) {
      return hole?.par || 0;
    }
    return score.strokes;
  };

  // Calculate total strokes for confirmed holes only
  const getTotalStrokes = (playerId: string, holeSet: Hole[]): number => {
    return holeSet.reduce((sum, hole) => {
      if (hole.confirmed === false) return sum;
      const strokes = getStrokesForHole(playerId, hole.id);
      return sum + (strokes ?? 0);
    }, 0);
  };

  // Calculate total par for confirmed holes only
  const getTotalPar = (holeSet: Hole[]): number => {
    return holeSet.reduce((sum, hole) => {
      if (hole.confirmed === false) return sum;
      return sum + hole.par;
    }, 0);
  };

  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      {/* Combined Scorecard - All 18 holes in one view */}
      <View style={styles.tableContainer}>
        <Text style={styles.tableTitle}>{courseName || 'Scorecard'}</Text>

        {/* Header Row - Hole Numbers */}
        <View style={styles.headerRow}>
          <View style={[styles.cell, styles.playerNameCell, styles.headerCell]}>
            <Text style={styles.headerText}>Player</Text>
          </View>
          {sortedHoles.map(hole => (
            <View key={hole.id} style={[styles.cell, styles.holeCell, styles.headerCell]}>
              <Text style={styles.headerText}>{hole.holeNumber}</Text>
              {hole.index && (
                <Text style={styles.indexText}>#{hole.index}</Text>
              )}
            </View>
          ))}
          <View style={[styles.cell, styles.totalCell, styles.headerCell]}>
            <Text style={styles.headerText}>Total</Text>
          </View>
        </View>

        {/* Par Row */}
        <View style={styles.row}>
          <View style={[styles.cell, styles.playerNameCell, styles.parRow]}>
            <Text style={styles.parText}>Par</Text>
          </View>
          {sortedHoles.map(hole => (
            <View key={hole.id} style={[styles.cell, styles.holeCell, styles.parRow]}>
              <Text style={styles.parText}>{hole.par}</Text>
            </View>
          ))}
          <View style={[styles.cell, styles.totalCell, styles.parRow]}>
            <Text style={styles.parText}>{getTotalPar(sortedHoles)}</Text>
          </View>
        </View>

        {/* Player Rows */}
        {players.map((player, playerIndex) => {
          const totalStrokes = getTotalStrokes(player.id, sortedHoles);
          const totalPar = getTotalPar(sortedHoles);
          const scoreToPar = totalStrokes - totalPar;

          return (
            <View key={player.id} style={[styles.row, playerIndex % 2 === 0 && styles.alternateRow]}>
              <View style={[styles.cell, styles.playerNameCell]}>
                <Text style={styles.playerNameText} numberOfLines={1}>
                  {player.name}
                </Text>
              </View>
              {sortedHoles.map(hole => {
                const strokes = getStrokesForHole(player.id, hole.id);
                const isBlank = strokes === null;
                const holePar = hole.par;
                const strokesToPar = isBlank ? 0 : strokes - holePar;

                return (
                  <View key={hole.id} style={[styles.cell, styles.holeCell]}>
                    <View style={[
                      styles.strokesBadge,
                      !isBlank && strokesToPar < 0 && styles.strokesBadgeUnderPar,
                      !isBlank && strokesToPar > 0 && styles.strokesBadgeOverPar,
                    ]}>
                      <Text style={[
                        styles.strokesText,
                        !isBlank && strokesToPar < 0 && styles.strokesTextUnderPar,
                        !isBlank && strokesToPar > 0 && styles.strokesTextOverPar,
                      ]}>
                        {isBlank ? '-' : strokes}
                      </Text>
                    </View>
                  </View>
                );
              })}
              <View style={[styles.cell, styles.totalCell]}>
                <Text style={styles.totalText}>
                  {totalStrokes}
                  {scoreToPar !== 0 && (
                    <Text style={[
                      styles.totalToPar,
                      scoreToPar < 0 && styles.totalToParUnder,
                      scoreToPar > 0 && styles.totalToParOver,
                    ]}>
                      {' '}({scoreToPar > 0 ? '+' : ''}{scoreToPar})
                    </Text>
                  )}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  tableContainer: {
    marginBottom: spacing.md,
    borderWidth: 3,
    borderColor: '#000000',
    borderRadius: 4,
    overflow: 'hidden',
  },
  tableTitle: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: typography.h4.fontSize,
    color: colors.accent.gold,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    borderBottomWidth: 3,
    borderBottomColor: '#000000',
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
  },
  alternateRow: {
    backgroundColor: colors.glass.light,
  },
  parRow: {
    backgroundColor: colors.surfaces.level2,
  },
  cell: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 40,
    borderRightWidth: 2,
    borderRightColor: '#000000',
  },
  headerCell: {
    backgroundColor: colors.surfaces.level3,
  },
  playerNameCell: {
    width: 100,
    alignItems: 'flex-start',
    paddingLeft: spacing.sm,
  },
  holeCell: {
    width: 45,
  },
  totalCell: {
    width: 80,
    backgroundColor: colors.surfaces.level2,
  },
  headerText: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 12,
    color: colors.accent.gold,
    textTransform: 'uppercase',
  },
  indexText: {
    fontFamily: fontFamilies.mono,
    fontSize: 9,
    color: colors.text.secondary,
    marginTop: 2,
  },
  parText: {
    fontFamily: fontFamilies.mono,
    fontSize: 12,
    color: colors.text.secondary,
  },
  playerNameText: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 13,
    color: colors.text.primary,
  },
  strokesBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaces.level1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  strokesBadgeUnderPar: {
    backgroundColor: colors.scoring.birdie + '20',
    borderColor: colors.scoring.birdie,
  },
  strokesBadgeOverPar: {
    backgroundColor: colors.scoring.negative + '20',
    borderColor: colors.scoring.negative,
  },
  strokesText: {
    fontFamily: fontFamilies.monoBold,
    fontSize: 14,
    color: colors.text.primary,
  },
  strokesTextUnderPar: {
    color: colors.scoring.birdie,
  },
  strokesTextOverPar: {
    color: colors.scoring.negative,
  },
  totalText: {
    fontFamily: fontFamilies.monoBold,
    fontSize: 16,
    color: colors.text.primary,
  },
  totalToPar: {
    fontSize: 12,
    fontFamily: fontFamilies.mono,
  },
  totalToParUnder: {
    color: colors.scoring.positive,
  },
  totalToParOver: {
    color: colors.scoring.negative,
  },
  // Summary card
});
