import React, { useMemo } from "react";
import { Box, Typography } from "@mui/material";
import { Hole, Score, Player } from "../../types";
import { ScoreCalculator } from "../../utils/scoreCalculator";
import { useThemedColors } from "../../contexts/ThemeContext";
import { typography, fontFamilies, spacing, borderRadius } from "../../theme";
import { PairRow } from "./HeadToHeadPoints";

export interface HeadToHeadByHoleProps {
  holes: Hole[];
  scoresByHoleId: Record<string, Score[]>;
  players: Player[];
  gameHandicaps?: { [pairKey: string]: { [holeNumber: string]: number } };
  emptyText?: string;
}

export const HeadToHeadByHole: React.FC<HeadToHeadByHoleProps> = ({
  holes,
  scoresByHoleId,
  players,
  gameHandicaps,
  emptyText = "No completed holes yet — pair points will appear here once hole 1 is confirmed.",
}) => {
  const colors = useThemedColors();

  const confirmedHoles = useMemo(
    () =>
      [...holes]
        .filter((h) => h.confirmed !== false)
        .sort((a, b) => a.holeNumber - b.holeNumber),
    [holes],
  );

  const pairList = useMemo(() => {
    const pairs: Array<{ p1: Player; p2: Player }> = [];
    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        pairs.push({ p1: players[i], p2: players[j] });
      }
    }
    return pairs;
  }, [players]);

  if (confirmedHoles.length === 0 || pairList.length === 0) {
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
        display: "flex",
        flexDirection: "column",
        gap: `${spacing.md}px`,
      }}
    >
      {confirmedHoles.map((hole) => {
        const scoresForHole = scoresByHoleId[hole.id] || [];
        const rows = pairList.map(({ p1, p2 }) => {
          const delta = ScoreCalculator.calculateHeadToHeadHolePoints(
            hole,
            p1.id,
            p2.id,
            scoresForHole,
            gameHandicaps,
          );
          if (delta > 0) {
            return { leader: p1, trailer: p2, delta, tied: false };
          }
          if (delta < 0) {
            return { leader: p2, trailer: p1, delta: -delta, tied: false };
          }
          return { leader: p1, trailer: p2, delta: 0, tied: true };
        });

        return (
          <Box
            key={hole.id}
            sx={{
              bgcolor: colors.background.card,
              borderRadius: `${borderRadius.xl}px`,
              border: `1px solid ${colors.border.light}`,
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                px: `${spacing.lg}px`,
                py: `${spacing.sm}px`,
                bgcolor: colors.background.secondary,
                borderBottom: `1px solid ${colors.border.light}`,
              }}
            >
              <Typography
                sx={{
                  fontFamily: fontFamilies.bodySemiBold,
                  fontWeight: 600,
                  fontSize: 14,
                  color: colors.text.primary,
                }}
              >
                Hole {hole.holeNumber}
              </Typography>
              <Typography
                sx={{
                  ...typography.bodySmall,
                  fontFamily: fontFamilies.body,
                  color: colors.text.secondary,
                }}
              >
                Par {hole.par}
              </Typography>
            </Box>
            {rows.map((row, idx) => (
              <PairRow
                key={`${hole.id}_${row.leader.id}_${row.trailer.id}`}
                leader={row.leader}
                trailer={row.trailer}
                delta={row.delta}
                tied={row.tied}
                isLast={idx === rows.length - 1}
                colors={colors}
              />
            ))}
          </Box>
        );
      })}
    </Box>
  );
};
