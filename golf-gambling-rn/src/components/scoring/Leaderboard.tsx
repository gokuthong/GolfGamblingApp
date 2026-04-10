import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  FadeOutUp,
} from 'react-native-reanimated';
import { Icon } from '../common/Icon';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';

export interface LeaderboardEntry {
  id: string;
  name: string;
  points: number;
  rank?: number;
  /**
   * Change in position (positive = moved up, negative = moved down)
   */
  positionChange?: number;
  /**
   * Additional stats to display
   */
  stats?: {
    label: string;
    value: string;
  }[];
}

export interface LeaderboardProps {
  entries: LeaderboardEntry[];
  /**
   * Show position change indicators
   */
  showPositionChange?: boolean;
  /**
   * Show stats for each entry
   */
  showStats?: boolean;
  /**
   * Highlight top 3 with medals
   */
  showMedals?: boolean;
  /**
   * Use gradient for top entry
   */
  gradientTop?: boolean;
}

/**
 * ESPN-style leaderboard component with animated position changes
 * Perfect for displaying game standings in real-time
 */
export const Leaderboard: React.FC<LeaderboardProps> = ({
  entries,
  showPositionChange = false,
  showStats = false,
  showMedals = true,
  gradientTop = true,
}) => {
  // Sort by points descending and assign ranks
  const sortedEntries = [...entries].sort((a, b) => b.points - a.points).map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));

  const renderEntry = ({ item, index }: { item: LeaderboardEntry; index: number }) => {
    const isTop = index === 0;
    const isTopThree = index < 3 && showMedals;

    return (
      <Animated.View
        entering={FadeInDown.delay(index * 50)}
        exiting={FadeOutUp}
        style={styles.entryContainer}
      >
        {isTop && gradientTop ? (
          <LinearGradient
            colors={colors.gradients.victory}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.entry, shadows.medium]}
          >
            <EntryContent
              item={item}
              isTopThree={isTopThree}
              showPositionChange={showPositionChange}
              showStats={showStats}
              isGradient={true}
            />
          </LinearGradient>
        ) : (
          <View style={[styles.entry, shadows.small]}>
            <EntryContent
              item={item}
              isTopThree={isTopThree}
              showPositionChange={showPositionChange}
              showStats={showStats}
              isGradient={false}
            />
          </View>
        )}
      </Animated.View>
    );
  };

  return (
    <FlatList
      data={sortedEntries}
      renderItem={renderEntry}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContainer}
      scrollEnabled={false}
    />
  );
};

interface EntryContentProps {
  item: LeaderboardEntry;
  isTopThree: boolean;
  showPositionChange: boolean;
  showStats: boolean;
  isGradient: boolean;
}

const EntryContent: React.FC<EntryContentProps> = ({
  item,
  isTopThree,
  showPositionChange,
  showStats,
  isGradient,
}) => {
  const getMedalIcon = (rank: number): string | null => {
    if (rank === 1) return 'medal';
    if (rank === 2) return 'medal';
    if (rank === 3) return 'medal';
    return null;
  };

  const getMedalColor = (rank: number): string => {
    if (rank === 1) return '#FFD700'; // Gold
    if (rank === 2) return '#C0C0C0'; // Silver
    if (rank === 3) return '#CD7F32'; // Bronze
    return colors.text.secondary;
  };

  const textColor = isGradient ? colors.text.inverse : colors.text.primary;
  const secondaryColor = isGradient
    ? 'rgba(255, 255, 255, 0.8)'
    : colors.text.secondary;

  return (
    <>
      {/* Rank and Medal */}
      <View style={styles.rankContainer}>
        {isTopThree && getMedalIcon(item.rank!) ? (
          <Icon
            name={getMedalIcon(item.rank!)!}
            size={24}
            color={getMedalColor(item.rank!)}
          />
        ) : (
          <View style={styles.rankBadge}>
            <Text style={[styles.rankText, { color: textColor }]}>
              {item.rank}
            </Text>
          </View>
        )}
      </View>

      {/* Player Info */}
      <View style={styles.playerInfo}>
        <View style={styles.nameRow}>
          <Text style={[styles.playerName, { color: textColor }]} numberOfLines={1}>
            {item.name}
          </Text>
          {showPositionChange && item.positionChange !== undefined && item.positionChange !== 0 && (
            <View style={styles.positionChange}>
              <Icon
                name={item.positionChange > 0 ? 'arrow-up' : 'arrow-down'}
                size={14}
                color={item.positionChange > 0 ? colors.scoring.positive : colors.scoring.negative}
              />
              <Text
                style={[
                  styles.positionChangeText,
                  {
                    color:
                      item.positionChange > 0
                        ? colors.scoring.positive
                        : colors.scoring.negative,
                  },
                ]}
              >
                {Math.abs(item.positionChange)}
              </Text>
            </View>
          )}
        </View>

        {showStats && item.stats && item.stats.length > 0 && (
          <View style={styles.statsRow}>
            {item.stats.map((stat, idx) => (
              <Text key={idx} style={[styles.stat, { color: secondaryColor }]}>
                {stat.label}: {stat.value}
              </Text>
            ))}
          </View>
        )}
      </View>

      {/* Points */}
      <View style={styles.pointsContainer}>
        <Text style={[styles.points, { color: textColor }]}>
          {item.points > 0 ? '+' : ''}
          {item.points.toFixed(1)}
        </Text>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  listContainer: {
    paddingVertical: spacing.sm,
  },
  entryContainer: {
    marginBottom: spacing.sm,
  },
  entry: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
    marginRight: spacing.md,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaces.level2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    ...typography.bodyMedium,
    fontWeight: '700',
  },
  playerInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  playerName: {
    ...typography.h4,
    flex: 1,
  },
  positionChange: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  positionChangeText: {
    ...typography.bodySmall,
    fontWeight: '700',
    marginLeft: 2,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  stat: {
    ...typography.bodySmall,
    marginRight: spacing.md,
  },
  pointsContainer: {
    alignItems: 'flex-end',
    minWidth: 60,
  },
  points: {
    ...typography.h3,
    fontWeight: '800',
  },
});
