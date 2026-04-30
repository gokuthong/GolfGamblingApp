import React, { useMemo } from "react";
import { Box, Typography } from "@mui/material";
import { Hole, Score, Player } from "../../types";
import { ScoreCalculator } from "../../utils/scoreCalculator";
import { useThemedColors } from "../../contexts/ThemeContext";
import { typography, fontFamilies, spacing, borderRadius } from "../../theme";

export interface HeadToHeadPointsProps {
  holes: Hole[];
  scoresByHoleId: Record<string, Score[]>;
  players: Player[];
  gameHandicaps?: { [pairKey: string]: { [holeNumber: string]: number } };
  emptyText?: string;
}

export const HeadToHeadPoints: React.FC<HeadToHeadPointsProps> = ({
  holes,
  scoresByHoleId,
  players,
  gameHandicaps,
  emptyText = "No completed holes yet — pair points will appear here once hole 1 is confirmed.",
}) => {
  const colors = useThemedColors();

  const pairs = useMemo(() => {
    if (players.length < 2) return [];

    const totals = ScoreCalculator.calculateHeadToHeadTotals(
      holes,
      scoresByHoleId,
      players,
      gameHandicaps,
    );

    const rows: Array<{
      leader: Player;
      trailer: Player;
      delta: number;
      tied: boolean;
    }> = [];

    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        const p1 = players[i];
        const p2 = players[j];
        const key = `${p1.id}__${p2.id}`;
        const total = totals[key]?.total ?? 0;

        if (total > 0) {
          rows.push({ leader: p1, trailer: p2, delta: total, tied: false });
        } else if (total < 0) {
          rows.push({ leader: p2, trailer: p1, delta: -total, tied: false });
        } else {
          rows.push({ leader: p1, trailer: p2, delta: 0, tied: true });
        }
      }
    }

    return rows;
  }, [holes, scoresByHoleId, players, gameHandicaps]);

  const hasAnyConfirmed = useMemo(
    () => holes.some((h) => h.confirmed !== false),
    [holes],
  );
  const showEmpty = !hasAnyConfirmed || pairs.length === 0;

  if (showEmpty) {
    return (
      <Box
        sx={{
          bgcolor: colors.background.card,
          borderRadius: `${borderRadius.xl}px`,
          border: `1px solid ${colors.border.light}`,
          p: `${spacing.lg}px`,
        }}
      >
        <Typography
          sx={{
            ...typography.bodySmall,
            color: colors.text.secondary,
            textAlign: "center",
          }}
        >
          {emptyText}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        bgcolor: colors.background.card,
        borderRadius: `${borderRadius.xl}px`,
        border: `1px solid ${colors.border.light}`,
        overflow: "hidden",
      }}
    >
      {pairs.map((pair, idx) => (
        <PairRow
          key={`${pair.leader.id}_${pair.trailer.id}`}
          leader={pair.leader}
          trailer={pair.trailer}
          delta={pair.delta}
          tied={pair.tied}
          isLast={idx === pairs.length - 1}
          colors={colors}
        />
      ))}
    </Box>
  );
};

interface PairRowProps {
  leader: Player;
  trailer: Player;
  delta: number;
  tied: boolean;
  isLast: boolean;
  colors: any;
}

export const PairRow: React.FC<PairRowProps> = ({
  leader,
  trailer,
  delta,
  tied,
  isLast,
  colors,
}) => {
  const leaderColor = tied ? colors.text.primary : colors.accent.gold;
  const trailerColor = colors.text.secondary;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        py: `${spacing.md}px`,
        px: `${spacing.lg}px`,
        gap: `${spacing.sm}px`,
        borderBottom: !isLast ? `1px solid ${colors.border.light}` : "none",
      }}
    >
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          gap: `${spacing.sm}px`,
        }}
      >
        <Typography
          sx={{
            ...typography.bodySmall,
            fontFamily: tied ? fontFamilies.body : fontFamilies.bodySemiBold,
            fontWeight: tied ? 400 : 600,
            color: leaderColor,
            flexShrink: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {leader.name}
        </Typography>
        <Typography
          sx={{
            fontFamily: fontFamilies.monoBold,
            fontSize: 18,
            color: leaderColor,
            minWidth: 24,
            textAlign: "center",
          }}
        >
          {delta}
        </Typography>
      </Box>
      <Typography
        sx={{
          fontFamily: fontFamilies.mono,
          fontSize: 14,
          color: colors.text.tertiary,
        }}
      >
        —
      </Typography>
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: `${spacing.sm}px`,
        }}
      >
        <Typography
          sx={{
            fontFamily: fontFamilies.monoBold,
            fontSize: 18,
            color: trailerColor,
            minWidth: 24,
            textAlign: "center",
          }}
        >
          0
        </Typography>
        <Typography
          sx={{
            ...typography.bodySmall,
            fontFamily: fontFamilies.body,
            fontWeight: 400,
            color: trailerColor,
            flexShrink: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {trailer.name}
        </Typography>
        {tied && (
          <Typography
            sx={{
              ...typography.bodySmall,
              fontFamily: fontFamilies.bodyMedium,
              fontSize: 11,
              color: colors.text.tertiary,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              ml: `${spacing.xs}px`,
            }}
          >
            Tied
          </Typography>
        )}
      </Box>
    </Box>
  );
};
