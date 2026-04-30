import React, { useState, useMemo } from "react";
import {
  Box,
  Typography,
  Dialog,
  DialogContent,
  TextField,
  IconButton,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import { Button } from "../common/Button";
import { useThemedColors } from "../../contexts/ThemeContext";
import {
  typography,
  fontFamilies,
  spacing,
  borderRadius,
  shadows,
} from "../../theme";
import { Player, Hole } from "../../types";
import {
  getHandicapForHole,
  getTotalHandicapForMatchup,
} from "../../utils/handicapUtils";

interface HandicapModalProps {
  visible: boolean;
  player: Player;
  opponents: Player[];
  handicaps: { [pairKey: string]: { [holeNumber: string]: number } };
  totalHoles: number;
  holes?: Hole[];
  onUpdateHandicap: (
    holeNumber: number,
    fromPlayerId: string,
    toPlayerId: string,
    strokes: number,
  ) => void;
  onBatchUpdateHandicaps?: (
    updates: Array<{
      holeNumber: number;
      fromPlayerId: string;
      toPlayerId: string;
      strokes: number;
    }>,
  ) => void;
  onClose: () => void;
}

type SortMode = "hole" | "index";

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
  const colors = useThemedColors();
  const [selectedOpponentId, setSelectedOpponentId] = useState<string | null>(
    opponents.length > 0 ? opponents[0].id : null,
  );
  const [sortMode, setSortMode] = useState<SortMode>("hole");
  const [indexInput, setIndexInput] = useState("");

  const selectedOpponent = opponents.find((o) => o.id === selectedOpponentId);

  // Build the ordered list of hole numbers based on sort mode
  const orderedHoleNumbers = useMemo(() => {
    const holeNumbers = Array.from({ length: totalHoles }, (_, i) => i + 1);

    if (sortMode === "index" && holes && holes.length > 0) {
      const holesWithIndex = holeNumbers.map((num) => {
        const hole = holes.find((h) => h.holeNumber === num);
        return { holeNumber: num, index: hole?.index ?? 999 };
      });
      holesWithIndex.sort((a, b) => a.index - b.index);
      return holesWithIndex.map((h) => h.holeNumber);
    }

    return holeNumbers;
  }, [totalHoles, holes, sortMode]);

  const hasIndexData =
    holes && holes.some((h) => h.index != null && h.index > 0);

  const applyIndexRange = () => {
    if (!selectedOpponentId || !holes) return;

    const maxIndex = parseInt(indexInput, 10);
    if (isNaN(maxIndex) || maxIndex < 1) return;

    const updates: Array<{
      holeNumber: number;
      fromPlayerId: string;
      toPlayerId: string;
      strokes: number;
    }> = [];

    for (let holeNum = 1; holeNum <= totalHoles; holeNum++) {
      const hole = holes.find((h) => h.holeNumber === holeNum);
      const holeIndex = hole?.index;
      if (holeIndex == null || holeIndex < 1) continue;

      const current = getHandicapForHole(
        handicaps,
        holeNum,
        player.id,
        selectedOpponentId,
      );

      if (holeIndex <= maxIndex) {
        // In range: ensure at least 1 stroke (preserve manually-set higher values)
        if (current < 1) {
          updates.push({
            holeNumber: holeNum,
            fromPlayerId: player.id,
            toPlayerId: selectedOpponentId,
            strokes: 1,
          });
        }
      } else if (current === 1) {
        // Out of range: revert prior 1-stroke fills (but keep manual >=2 values)
        updates.push({
          holeNumber: holeNum,
          fromPlayerId: player.id,
          toPlayerId: selectedOpponentId,
          strokes: 0,
        });
      }
    }

    if (updates.length > 0) {
      if (onBatchUpdateHandicaps) {
        onBatchUpdateHandicaps(updates);
      } else {
        updates.forEach((u) =>
          onUpdateHandicap(
            u.holeNumber,
            u.fromPlayerId,
            u.toPlayerId,
            u.strokes,
          ),
        );
      }
    }

    setIndexInput("");
  };

  return (
    <Dialog
      open={visible}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            bgcolor: colors.background.card,
            borderRadius: `${borderRadius.lg}px`,
            maxHeight: "85vh",
            boxShadow: shadows.large,
          },
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: `${spacing.lg}px`,
          borderBottom: `1px solid ${colors.border.light}`,
          bgcolor: colors.background.card,
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <Box>
            <Typography
              sx={{
                fontFamily: fontFamilies.bodySemiBold,
                fontWeight: 600,
                fontSize: typography.h3.fontSize,
                mb: `${spacing.xs}px`,
                color: colors.text.primary,
              }}
            >
              Select handicaps
            </Typography>
            <Typography
              sx={{
                fontFamily: fontFamilies.body,
                fontSize: typography.bodyMedium.fontSize,
                color: colors.text.secondary,
              }}
            >
              Set strokes {player.name} gives to each opponent
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon sx={{ color: colors.text.secondary }} />
          </IconButton>
        </Box>
      </Box>

      {/* Opponent tabs */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "stretch",
          overflowX: "auto",
          overflowY: "visible",
          bgcolor: colors.surfaces.level2,
          borderBottom: `1px solid ${colors.border.light}`,
          p: `${spacing.xs}px`,
          gap: `${spacing.xs}px`,
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        {opponents.map((opponent) => {
          const totalStrokes = getTotalHandicapForMatchup(
            handicaps,
            player.id,
            opponent.id,
          );
          const isSelected = opponent.id === selectedOpponentId;

          return (
            <Box
              key={opponent.id}
              onClick={() => setSelectedOpponentId(opponent.id)}
              sx={{
                p: `${spacing.md}px`,
                mx: `${spacing.xs}px`,
                borderRadius: `${borderRadius.md}px`,
                bgcolor: isSelected
                  ? colors.surfaces.level2
                  : colors.background.card,
                border: `2px solid ${isSelected ? colors.accent.gold : colors.border.light}`,
                minWidth: 120,
                cursor: "pointer",
                flexShrink: 0,
                transition: "all 0.15s ease",
              }}
            >
              <Typography
                sx={{
                  fontFamily: fontFamilies.bodySemiBold,
                  fontWeight: 600,
                  fontSize: typography.bodyMedium.fontSize,
                  color: isSelected ? colors.accent.gold : colors.text.primary,
                  mb: "2px",
                }}
              >
                Give to {opponent.name}
              </Typography>
              <Typography
                sx={{
                  fontFamily: fontFamilies.body,
                  fontSize: typography.bodySmall.fontSize,
                  color: isSelected
                    ? colors.accent.gold
                    : colors.text.secondary,
                }}
              >
                {totalStrokes} {totalStrokes === 1 ? "stroke" : "strokes"}
              </Typography>
            </Box>
          );
        })}
      </Box>

      {/* Holes grid */}
      {selectedOpponent && (
        <>
          <Box
            sx={{
              px: `${spacing.md}px`,
              pt: `${spacing.md}px`,
              bgcolor: colors.background.card,
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                mb: `${spacing.xs}px`,
              }}
            >
              <Typography
                sx={{
                  fontFamily: fontFamilies.bodySemiBold,
                  fontWeight: 600,
                  fontSize: typography.h4.fontSize,
                  color: colors.text.primary,
                  flexShrink: 1,
                }}
              >
                Strokes to {selectedOpponent.name}
              </Typography>

              {/* Sort toggle */}
              {hasIndexData && (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                    bgcolor: colors.surfaces.level2,
                    borderRadius: `${borderRadius.sm}px`,
                    border: `1px solid ${colors.border.light}`,
                    overflow: "hidden",
                  }}
                >
                  <Box
                    onClick={() => setSortMode("hole")}
                    sx={{
                      py: `${spacing.xs}px`,
                      px: `${spacing.sm}px`,
                      bgcolor:
                        sortMode === "hole"
                          ? colors.accent.gold
                          : "transparent",
                      cursor: "pointer",
                    }}
                  >
                    <Typography
                      sx={{
                        fontFamily: fontFamilies.bodySemiBold,
                        fontWeight: 600,
                        fontSize: 11,
                        color:
                          sortMode === "hole"
                            ? colors.text.inverse
                            : colors.text.secondary,
                      }}
                    >
                      Hole
                    </Typography>
                  </Box>
                  <Box
                    onClick={() => setSortMode("index")}
                    sx={{
                      py: `${spacing.xs}px`,
                      px: `${spacing.sm}px`,
                      bgcolor:
                        sortMode === "index"
                          ? colors.accent.gold
                          : "transparent",
                      cursor: "pointer",
                    }}
                  >
                    <Typography
                      sx={{
                        fontFamily: fontFamilies.bodySemiBold,
                        fontWeight: 600,
                        fontSize: 11,
                        color:
                          sortMode === "index"
                            ? colors.text.inverse
                            : colors.text.secondary,
                      }}
                    >
                      Index
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>

            {/* Quick fill by index range */}
            {hasIndexData && (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: `${spacing.xs}px`,
                  mt: `${spacing.xs}px`,
                  mb: `${spacing.sm}px`,
                }}
              >
                <Typography
                  sx={{
                    fontFamily: fontFamilies.body,
                    fontSize: typography.bodySmall.fontSize,
                    color: colors.text.secondary,
                    flexShrink: 1,
                  }}
                >
                  Give 1 stroke for index 1 to
                </Typography>
                <TextField
                  variant="standard"
                  value={indexInput}
                  onChange={(e) => setIndexInput(e.target.value)}
                  placeholder="#"
                  slotProps={{
                    htmlInput: { maxLength: 2 },
                    input: {
                      disableUnderline: true,
                      sx: {
                        fontFamily: fontFamilies.mono,
                        fontSize: typography.bodyMedium.fontSize,
                        color: colors.text.primary,
                        textAlign: "center",
                      },
                    },
                  }}
                  sx={{
                    width: 40,
                    bgcolor: colors.surfaces.level2,
                    border: `1px solid ${colors.border.medium}`,
                    borderRadius: `${borderRadius.sm}px`,
                    px: `${spacing.sm}px`,
                    py: `${spacing.xs}px`,
                    "& input": { textAlign: "center" },
                  }}
                />
                <Box
                  onClick={
                    indexInput && parseInt(indexInput, 10)
                      ? applyIndexRange
                      : undefined
                  }
                  sx={{
                    bgcolor:
                      !indexInput || !parseInt(indexInput, 10)
                        ? colors.border.medium
                        : colors.accent.gold,
                    opacity: !indexInput || !parseInt(indexInput, 10) ? 0.5 : 1,
                    py: `${spacing.xs}px`,
                    px: `${spacing.sm}px`,
                    borderRadius: `${borderRadius.sm}px`,
                    cursor:
                      indexInput && parseInt(indexInput, 10)
                        ? "pointer"
                        : "default",
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: fontFamilies.bodySemiBold,
                      fontWeight: 600,
                      fontSize: typography.bodySmall.fontSize,
                      color: colors.text.inverse,
                    }}
                  >
                    Apply
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>

          <DialogContent
            sx={{
              display: "flex",
              flexDirection: "row",
              flexWrap: "wrap",
              gap: `${spacing.sm}px`,
              p: `${spacing.md}px`,
              pb: `${spacing.xl}px`,
            }}
          >
            {orderedHoleNumbers.map((holeNumber) => {
              const currentHandicap = getHandicapForHole(
                handicaps,
                holeNumber,
                player.id,
                selectedOpponentId!,
              );
              const hole = holes?.find((h) => h.holeNumber === holeNumber);

              return (
                <Box
                  key={holeNumber}
                  sx={{
                    width: "calc(50% - 4px)",
                    p: `${spacing.sm}px`,
                    bgcolor: colors.surfaces.level2,
                    borderRadius: `${borderRadius.md}px`,
                    border: `1px solid ${colors.border.light}`,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mb: `${spacing.xs}px`,
                    }}
                  >
                    <Typography
                      sx={{
                        fontFamily: fontFamilies.bodySemiBold,
                        fontWeight: 600,
                        fontSize: typography.bodySmall.fontSize,
                        color: colors.text.secondary,
                      }}
                    >
                      Hole {holeNumber}
                    </Typography>
                    {hole?.index != null && hole.index > 0 && (
                      <Typography
                        sx={{
                          fontFamily: fontFamilies.mono,
                          fontSize: 10,
                          color: colors.accent.gold,
                          bgcolor: colors.surfaces.level3,
                          px: `${spacing.xs}px`,
                          py: "2px",
                          borderRadius: `${borderRadius.xs}px`,
                        }}
                      >
                        #{hole.index}
                      </Typography>
                    )}
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Box
                      onClick={() => {
                        if (currentHandicap > 0) {
                          onUpdateHandicap(
                            holeNumber,
                            player.id,
                            selectedOpponentId!,
                            currentHandicap - 1,
                          );
                        }
                      }}
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: `${borderRadius.full}px`,
                        bgcolor:
                          currentHandicap === 0
                            ? colors.border.medium
                            : colors.accent.gold,
                        opacity: currentHandicap === 0 ? 0.5 : 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: currentHandicap === 0 ? "default" : "pointer",
                        transition: "all 0.12s ease",
                      }}
                    >
                      <Typography
                        sx={{
                          color: colors.text.inverse,
                          fontSize: 18,
                          fontWeight: 700,
                          lineHeight: 1,
                        }}
                      >
                        -
                      </Typography>
                    </Box>

                    <Typography
                      sx={{
                        fontFamily: fontFamilies.mono,
                        fontSize: typography.bodyMedium.fontSize,
                        fontWeight: 600,
                        minWidth: 20,
                        textAlign: "center",
                        color: colors.text.primary,
                      }}
                    >
                      {currentHandicap}
                    </Typography>

                    <Box
                      onClick={() => {
                        if (currentHandicap < 9) {
                          onUpdateHandicap(
                            holeNumber,
                            player.id,
                            selectedOpponentId!,
                            currentHandicap + 1,
                          );
                        }
                      }}
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: `${borderRadius.full}px`,
                        bgcolor:
                          currentHandicap >= 9
                            ? colors.border.medium
                            : colors.accent.gold,
                        opacity: currentHandicap >= 9 ? 0.5 : 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: currentHandicap >= 9 ? "default" : "pointer",
                        transition: "all 0.12s ease",
                      }}
                    >
                      <Typography
                        sx={{
                          color: colors.text.inverse,
                          fontSize: 18,
                          fontWeight: 700,
                          lineHeight: 1,
                        }}
                      >
                        +
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </DialogContent>
        </>
      )}

      {/* Footer */}
      <Box
        sx={{
          p: `${spacing.md}px`,
          bgcolor: colors.background.card,
          borderTop: `1px solid ${colors.border.light}`,
        }}
      >
        <Box
          onClick={onClose}
          sx={{
            bgcolor: colors.accent.gold,
            p: `${spacing.md}px`,
            borderRadius: `${borderRadius.md}px`,
            textAlign: "center",
            cursor: "pointer",
            transition: "opacity 0.15s ease",
            "&:hover": { opacity: 0.9 },
          }}
        >
          <Typography
            sx={{
              color: colors.text.inverse,
              fontFamily: fontFamilies.bodySemiBold,
              fontWeight: 600,
              fontSize: typography.button.fontSize,
            }}
          >
            Done
          </Typography>
        </Box>
      </Box>
    </Dialog>
  );
};

export default HandicapModal;
