import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Keyboard,
} from 'react-native';
import { Player, Hole } from '../../types';
import { colors, typography, spacing, borderRadius, shadows, fontFamilies } from '../../theme';
import { getHandicapForHole, getTotalHandicapForMatchup } from '../../utils/handicapUtils';

interface HandicapModalProps {
  visible: boolean;
  player: Player;
  opponents: Player[];
  handicaps: { [pairKey: string]: { [holeNumber: string]: number } };
  totalHoles: number;
  holes?: Hole[]; // Optional holes array to display index
  onUpdateHandicap: (holeNumber: number, fromPlayerId: string, toPlayerId: string, strokes: number) => void;
  onBatchUpdateHandicaps?: (updates: Array<{ holeNumber: number; fromPlayerId: string; toPlayerId: string; strokes: number }>) => void;
  onClose: () => void;
}

type SortMode = 'hole' | 'index';

export const HandicapModal: React.FC<HandicapModalProps> = ({
  visible,
  player,
  opponents,
  handicaps,
  totalHoles,
  holes,
  onUpdateHandicap,
  onBatchUpdateHandicaps,
  onClose,
}) => {
  const [selectedOpponentId, setSelectedOpponentId] = useState<string | null>(
    opponents.length > 0 ? opponents[0].id : null
  );
  const [sortMode, setSortMode] = useState<SortMode>('hole');
  const [indexInput, setIndexInput] = useState('');

  const selectedOpponent = opponents.find(o => o.id === selectedOpponentId);

  // Build the ordered list of hole numbers based on sort mode
  const orderedHoleNumbers = useMemo(() => {
    const holeNumbers = Array.from({ length: totalHoles }, (_, i) => i + 1);

    if (sortMode === 'index' && holes && holes.length > 0) {
      // Sort by hole index (difficulty ranking), lowest index first
      const holesWithIndex = holeNumbers.map(num => {
        const hole = holes.find(h => h.holeNumber === num);
        return { holeNumber: num, index: hole?.index ?? 999 };
      });
      holesWithIndex.sort((a, b) => a.index - b.index);
      return holesWithIndex.map(h => h.holeNumber);
    }

    return holeNumbers;
  }, [totalHoles, holes, sortMode]);

  const hasIndexData = holes && holes.some(h => h.index != null && h.index > 0);

  const applyIndexRange = () => {
    if (!selectedOpponentId || !holes) return;

    const maxIndex = parseInt(indexInput, 10);
    if (isNaN(maxIndex) || maxIndex < 1) return;

    Keyboard.dismiss();

    // Collect all updates for holes with index 1..maxIndex where current handicap < 1
    const updates: Array<{ holeNumber: number; fromPlayerId: string; toPlayerId: string; strokes: number }> = [];

    for (let holeNum = 1; holeNum <= totalHoles; holeNum++) {
      const hole = holes.find(h => h.holeNumber === holeNum);
      const holeIndex = hole?.index;
      if (holeIndex != null && holeIndex >= 1 && holeIndex <= maxIndex) {
        const current = getHandicapForHole(handicaps, holeNum, player.id, selectedOpponentId);
        if (current < 1) {
          updates.push({ holeNumber: holeNum, fromPlayerId: player.id, toPlayerId: selectedOpponentId, strokes: 1 });
        }
      }
    }

    if (updates.length > 0) {
      if (onBatchUpdateHandicaps) {
        onBatchUpdateHandicaps(updates);
      } else {
        // Fallback: apply one by one (will have stale state issues but better than nothing)
        updates.forEach(u => onUpdateHandicap(u.holeNumber, u.fromPlayerId, u.toPlayerId, u.strokes));
      }
    }

    setIndexInput('');
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        <View
          style={styles.modalContent}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Select handicaps</Text>
            <Text style={styles.subtitle}>Set strokes {player.name} gives to each opponent</Text>
          </View>

          {/* Opponent tabs - now "Give to" instead of "Receive from" */}
          <ScrollView
            horizontal
            style={styles.opponentTabs}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.opponentTabsContent}
          >
            {opponents.map((opponent) => {
              // Now shows strokes given TO opponent (from player to opponent)
              const totalStrokes = getTotalHandicapForMatchup(handicaps, player.id, opponent.id);
              const isSelected = opponent.id === selectedOpponentId;

              return (
                <TouchableOpacity
                  key={opponent.id}
                  style={[
                    styles.opponentTab,
                    isSelected && styles.opponentTabSelected,
                  ]}
                  onPress={() => setSelectedOpponentId(opponent.id)}
                >
                  <Text style={[
                    styles.opponentTabText,
                    isSelected && styles.opponentTabTextSelected,
                  ]}>
                    Give to {opponent.name}
                  </Text>
                  <Text style={[
                    styles.opponentTabCount,
                    isSelected && styles.opponentTabCountSelected,
                  ]}>
                    {totalStrokes} {totalStrokes === 1 ? 'stroke' : 'strokes'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Holes grid */}
          {selectedOpponent && (
            <>
              <View style={styles.holesHeader}>
                <View style={styles.holesHeaderTop}>
                  <Text style={styles.holesTitle}>
                    Strokes to {selectedOpponent.name}
                  </Text>

                  {/* Sort toggle */}
                  {hasIndexData && (
                    <View style={styles.sortToggle}>
                      <TouchableOpacity
                        style={[
                          styles.sortButton,
                          sortMode === 'hole' && styles.sortButtonActive,
                        ]}
                        onPress={() => setSortMode('hole')}
                      >
                        <Text style={[
                          styles.sortButtonText,
                          sortMode === 'hole' && styles.sortButtonTextActive,
                        ]}>Hole</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.sortButton,
                          sortMode === 'index' && styles.sortButtonActive,
                        ]}
                        onPress={() => setSortMode('index')}
                      >
                        <Text style={[
                          styles.sortButtonText,
                          sortMode === 'index' && styles.sortButtonTextActive,
                        ]}>Index</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                {/* Quick fill by index range */}
                {hasIndexData && (
                  <View style={styles.quickFillRow}>
                    <Text style={styles.quickFillLabel}>Give 1 stroke for index 1 to</Text>
                    <TextInput
                      style={styles.quickFillInput}
                      value={indexInput}
                      onChangeText={setIndexInput}
                      keyboardType="number-pad"
                      placeholder="#"
                      placeholderTextColor={colors.text.muted}
                      maxLength={2}
                    />
                    <TouchableOpacity
                      style={[
                        styles.quickFillButton,
                        (!indexInput || !parseInt(indexInput, 10)) && styles.quickFillButtonDisabled,
                      ]}
                      onPress={applyIndexRange}
                      disabled={!indexInput || !parseInt(indexInput, 10)}
                    >
                      <Text style={styles.quickFillButtonText}>Apply</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <ScrollView
                style={styles.holesScrollView}
                contentContainerStyle={styles.holesScrollContent}
                showsVerticalScrollIndicator={true}
              >
                {orderedHoleNumbers.map((holeNumber) => {
                  // Reversed: get strokes from player TO selected opponent
                  const currentHandicap = getHandicapForHole(handicaps, holeNumber, player.id, selectedOpponentId!);
                  const hole = holes?.find(h => h.holeNumber === holeNumber);

                  return (
                    <View key={holeNumber} style={styles.holeItem}>
                      <View style={styles.holeHeader}>
                        <Text style={styles.holeNumber}>Hole {holeNumber}</Text>
                        {hole?.index != null && hole.index > 0 && (
                          <Text style={styles.holeIndex}>#{hole.index}</Text>
                        )}
                      </View>

                      <View style={styles.handicapControls}>
                        <TouchableOpacity
                          style={[
                            styles.controlButton,
                            currentHandicap === 0 && styles.controlButtonDisabled,
                          ]}
                          onPress={() => {
                            if (currentHandicap > 0) {
                              // Reversed: strokes from player TO opponent
                              onUpdateHandicap(holeNumber, player.id, selectedOpponentId!, currentHandicap - 1);
                            }
                          }}
                          disabled={currentHandicap === 0}
                        >
                          <Text style={styles.controlButtonText}>−</Text>
                        </TouchableOpacity>

                        <Text style={styles.handicapValue}>{currentHandicap}</Text>

                        <TouchableOpacity
                          style={[
                            styles.controlButton,
                            currentHandicap >= 9 && styles.controlButtonDisabled,
                          ]}
                          onPress={() => {
                            if (currentHandicap < 9) {
                              // Reversed: strokes from player TO opponent
                              onUpdateHandicap(holeNumber, player.id, selectedOpponentId!, currentHandicap + 1);
                            }
                          }}
                          disabled={currentHandicap >= 9}
                        >
                          <Text style={styles.controlButtonText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            </>
          )}

          <View style={styles.footer}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.glass.darkMedium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    width: '90%',
    height: '85%',
    ...shadows.large,
  },
  header: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    backgroundColor: colors.background.card,
  },
  title: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: typography.h3.fontSize,
    marginBottom: spacing.xs,
    color: colors.text.primary,
  },
  subtitle: {
    fontFamily: fontFamilies.body,
    fontSize: typography.bodyMedium.fontSize,
    color: colors.text.secondary,
  },
  opponentTabs: {
    maxHeight: 80,
    backgroundColor: colors.surfaces.level2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  opponentTabsContent: {
    padding: spacing.xs,
  },
  opponentTab: {
    padding: spacing.md,
    marginHorizontal: spacing.xs,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.card,
    borderWidth: 2,
    borderColor: colors.border.light,
    minWidth: 120,
  },
  opponentTabSelected: {
    borderColor: colors.accent.gold,
    backgroundColor: colors.surfaces.level2,
  },
  opponentTabText: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: typography.bodyMedium.fontSize,
    color: colors.text.primary,
    marginBottom: 2,
  },
  opponentTabTextSelected: {
    color: colors.accent.gold,
  },
  opponentTabCount: {
    fontFamily: fontFamilies.body,
    fontSize: typography.bodySmall.fontSize,
    color: colors.text.secondary,
  },
  opponentTabCountSelected: {
    color: colors.accent.gold,
  },
  holesHeader: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    backgroundColor: colors.background.card,
  },
  holesHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  holesTitle: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: typography.h4.fontSize,
    color: colors.text.primary,
    flexShrink: 1,
  },
  // Sort toggle styles
  sortToggle: {
    flexDirection: 'row',
    backgroundColor: colors.surfaces.level2,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
    overflow: 'hidden',
  },
  sortButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  sortButtonActive: {
    backgroundColor: colors.accent.gold,
  },
  sortButtonText: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 11,
    color: colors.text.secondary,
  },
  sortButtonTextActive: {
    color: colors.text.inverse,
  },
  // Quick fill styles
  quickFillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  quickFillLabel: {
    fontFamily: fontFamilies.body,
    fontSize: typography.bodySmall.fontSize,
    color: colors.text.secondary,
    flexShrink: 1,
  },
  quickFillInput: {
    backgroundColor: colors.surfaces.level2,
    borderWidth: 1,
    borderColor: colors.border.medium,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    width: 40,
    textAlign: 'center',
    fontFamily: fontFamilies.mono,
    fontSize: typography.bodyMedium.fontSize,
    color: colors.text.primary,
  },
  quickFillButton: {
    backgroundColor: colors.accent.gold,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  quickFillButtonDisabled: {
    backgroundColor: colors.border.medium,
    opacity: 0.5,
  },
  quickFillButtonText: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: typography.bodySmall.fontSize,
    color: colors.text.inverse,
  },
  holesScrollView: {
    flex: 1,
  },
  holesScrollContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  holeItem: {
    width: '48%',
    padding: spacing.sm,
    backgroundColor: colors.surfaces.level2,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  holeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  holeNumber: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: typography.bodySmall.fontSize,
    color: colors.text.secondary,
  },
  holeIndex: {
    fontFamily: fontFamilies.mono,
    fontSize: 10,
    color: colors.accent.gold,
    backgroundColor: colors.surfaces.level3,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
  },
  handicapControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  controlButton: {
    backgroundColor: colors.accent.gold,
    width: 28,
    height: 28,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonDisabled: {
    backgroundColor: colors.border.medium,
    opacity: 0.5,
  },
  controlButtonText: {
    color: colors.text.inverse,
    fontSize: 18,
    fontWeight: 'bold',
  },
  handicapValue: {
    fontFamily: fontFamilies.mono,
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: '600',
    minWidth: 20,
    textAlign: 'center',
    color: colors.text.primary,
  },
  footer: {
    padding: spacing.md,
    backgroundColor: colors.background.card,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  closeButton: {
    backgroundColor: colors.accent.gold,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  closeButtonText: {
    color: colors.text.inverse,
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: typography.button.fontSize,
  },
});
