import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Box, Typography, Button, CircularProgress } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import { useParams, useNavigate } from "react-router-dom";
import { crossPlatformAlert } from "../utils/alert";
import { dataService } from "../services/DataService";
import { Hole, Score, Player, Game } from "../types";
import { typography, fontFamilies, spacing, borderRadius } from "../theme";
import { useThemedColors } from "../contexts/ThemeContext";
import { ScoreCalculator } from "../utils/scoreCalculator";
import { HeadToHeadPoints } from "../components/scoring/HeadToHeadPoints";
import { HeadToHeadByHole } from "../components/scoring/HeadToHeadByHole";
import { generateScorecardPDF } from "../utils/pdfGenerator";
import {
  getTotalHandicapForMatchup,
  getHandicapForHole,
} from "../utils/handicapUtils";

// CSS keyframe confetti styles injected once
const confettiStyleId = "game-summary-confetti-styles";
function ensureConfettiStyles(goldColor: string) {
  if (document.getElementById(confettiStyleId)) return;
  const style = document.createElement("style");
  style.id = confettiStyleId;
  style.textContent = `
    @keyframes confetti-fall {
      0% { transform: translateY(-40px) rotate(0deg); opacity: 0.85; }
      70% { opacity: 0.85; }
      100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
    }
    .confetti-particle {
      position: absolute;
      width: 6px;
      height: 6px;
      border-radius: 1px;
      background-color: ${goldColor};
      pointer-events: none;
      animation: confetti-fall linear forwards;
    }
  `;
  document.head.appendChild(style);
}

export const GameSummaryPage = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const colors = useThemedColors();

  const [game, setGame] = useState<Game | null>(null);
  const [holes, setHoles] = useState<Hole[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(true);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  useEffect(() => {
    ensureConfettiStyles(colors.accent.gold);
    const timer = setTimeout(() => setShowConfetti(false), 4500);
    return () => clearTimeout(timer);
  }, [colors.accent.gold]);

  useEffect(() => {
    if (!gameId) return;

    dataService.getGameWithDetails(gameId).then((details) => {
      if (!details) {
        setLoading(false);
        return;
      }
      setGame(details.game);
      setHoles(
        [...details.holes].sort((a, b) => a.holeNumber - b.holeNumber),
      );
      setScores(details.scores);
      setPlayers(details.players);
      setLoading(false);
    });
  }, [gameId]);

  const headToHead = useMemo(() => {
    if (players.length < 2 || holes.length === 0) return [];

    const pairs: Array<{
      leader: Player;
      trailer: Player;
      advantage: number;
    }> = [];

    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        const pA = players[i];
        const pB = players[j];
        let aWins = 0;
        let bWins = 0;

        for (const hole of holes) {
          const scoreA = scores.find(
            (s) => s.holeId === hole.id && s.playerId === pA.id,
          );
          const scoreB = scores.find(
            (s) => s.holeId === hole.id && s.playerId === pB.id,
          );
          if (
            !scoreA ||
            !scoreB ||
            scoreA.strokes === 0 ||
            scoreB.strokes === 0
          )
            continue;

          const bGivesA = getHandicapForHole(
            game?.handicaps,
            hole.holeNumber,
            pB.id,
            pA.id,
          );
          const aGivesB = getHandicapForHole(
            game?.handicaps,
            hole.holeNumber,
            pA.id,
            pB.id,
          );

          const netA = scoreA.strokes - bGivesA;
          const netB = scoreB.strokes - aGivesB;

          if (netA < netB) aWins++;
          else if (netB < netA) bWins++;
        }

        const advantage = Math.abs(aWins - bWins);
        if (bWins > aWins) {
          pairs.push({ leader: pB, trailer: pA, advantage });
        } else {
          pairs.push({ leader: pA, trailer: pB, advantage });
        }
      }
    }

    return pairs;
  }, [players, holes, scores, game?.handicaps]);

  const getScoresByHoleId = useCallback(() => {
    const byHole: Record<string, Score[]> = {};
    const seenPlayerHoles = new Set<string>();

    scores.forEach((score) => {
      const playerHoleKey = `${score.holeId}_${score.playerId}`;
      if (seenPlayerHoles.has(playerHoleKey)) return;
      seenPlayerHoles.add(playerHoleKey);
      if (!byHole[score.holeId]) byHole[score.holeId] = [];
      byHole[score.holeId].push(score);
    });
    return byHole;
  }, [scores]);

  const getTotalPoints = useCallback(() => {
    return ScoreCalculator.calculateTotalPoints(
      holes,
      getScoresByHoleId(),
      players,
      game?.handicaps,
    );
  }, [holes, getScoresByHoleId, players, game?.handicaps]);

  const handleDownloadPDF = async () => {
    if (generatingPDF) return;

    try {
      setGeneratingPDF(true);
      await generateScorecardPDF({
        holes,
        scores,
        players,
        gameName: "Golf Game",
        courseName: game?.courseName,
        gameDate: game?.completedAt || game?.date,
        gameId: game?.id,
      });
    } catch (error: any) {
      console.error("Failed to generate PDF:", error);
      crossPlatformAlert(
        "PDF Generation Failed",
        error?.message || "Unable to generate scorecard PDF. Please try again.",
        [{ text: "OK" }],
      );
    } finally {
      setGeneratingPDF(false);
    }
  };

  if (loading || players.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100dvh",
          bgcolor: colors.background.primary,
        }}
      >
        <CircularProgress sx={{ color: colors.accent.gold }} />
        <Typography
          sx={{
            ...typography.bodyMedium,
            color: colors.text.secondary,
            mt: `${spacing.md}px`,
          }}
        >
          Loading results...
        </Typography>
      </Box>
    );
  }

  const scoresByHoleId = getScoresByHoleId();
  const totalPoints = getTotalPoints();
  const sortedPlayers = [...players].sort(
    (a, b) => (totalPoints[b.id] || 0) - (totalPoints[a.id] || 0),
  );
  const winner = sortedPlayers[0];
  const gameDate = game?.completedAt || game?.date;
  const dateLabel = gameDate
    ? new Date(gameDate).toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : undefined;

  // Confetti particles config
  const confettiParticles = Array.from({ length: 18 }).map((_, i) => ({
    key: i,
    left: `${(i % 12) * (100 / 12) + Math.random() * 3}%`,
    delay: i * 120,
    duration: 3600 + Math.random() * 1200,
  }));

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100dvh",
        bgcolor: colors.background.primary,
        position: "relative",
      }}
    >
      {/* Confetti */}
      {showConfetti && (
        <Box
          sx={{
            position: "fixed",
            inset: 0,
            overflow: "hidden",
            pointerEvents: "none",
            zIndex: 10,
          }}
        >
          {confettiParticles.map((p) => (
            <Box
              key={p.key}
              className="confetti-particle"
              sx={{
                left: p.left,
                animationDelay: `${p.delay}ms`,
                animationDuration: `${p.duration}ms`,
              }}
            />
          ))}
        </Box>
      )}

      <Box
        sx={{
          flex: 1,
          overflow: "auto",
          px: `${spacing.xl}px`,
          pt: `${spacing.xxxl}px`,
          pb: `${spacing.xxl}px`,
        }}
      >
        {/* Editorial hero */}
        <Box sx={{ mb: `${spacing.xl}px` }}>
          <Typography
            sx={{
              ...typography.label,
              color: colors.text.tertiary,
              textTransform: "uppercase",
              mb: `${spacing.sm}px`,
            }}
          >
            Final round
          </Typography>
          <Typography
            sx={{
              ...typography.displayMedium,
              color: colors.text.primary,
              mb: `${spacing.md}px`,
            }}
          >
            Game complete
          </Typography>
          <Box
            sx={{
              height: 1.5,
              width: 48,
              bgcolor: colors.accent.gold,
              borderRadius: "1px",
              mb: `${spacing.md}px`,
            }}
          />
          {dateLabel && (
            <Typography
              sx={{
                ...typography.bodyMedium,
                color: colors.text.secondary,
                mb: `${spacing.xs}px`,
              }}
            >
              {dateLabel}
            </Typography>
          )}
          {game?.courseName && (
            <Typography
              sx={{
                ...typography.bodyMedium,
                color: colors.text.tertiary,
                fontStyle: "italic",
              }}
            >
              {game.courseName}
            </Typography>
          )}
        </Box>

        {/* Winner callout */}
        {winner && (
          <Box
            sx={{
              bgcolor: colors.background.card,
              borderRadius: `${borderRadius.xl}px`,
              border: `1px solid ${colors.border.goldSubtle}`,
              p: `${spacing.xl}px`,
              mb: `${spacing.xl}px`,
              textAlign: "center",
            }}
          >
            <Typography
              sx={{
                ...typography.label,
                color: colors.accent.gold,
                textTransform: "uppercase",
                mb: `${spacing.sm}px`,
              }}
            >
              Champion
            </Typography>
            <Typography
              sx={{
                ...typography.displayMedium,
                color: colors.text.primary,
                mb: `${spacing.md}px`,
              }}
            >
              {winner.name}
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "center",
                gap: `${spacing.xs}px`,
              }}
            >
              <Typography
                sx={{
                  fontFamily: fontFamilies.monoBold,
                  fontSize: 44,
                  lineHeight: "50px",
                  color:
                    (totalPoints[winner.id] || 0) > 0
                      ? colors.scoring.positive
                      : (totalPoints[winner.id] || 0) < 0
                        ? colors.scoring.negative
                        : colors.text.primary,
                  letterSpacing: -0.8,
                }}
              >
                {(totalPoints[winner.id] || 0) > 0 ? "+" : ""}
                {(totalPoints[winner.id] || 0).toFixed(1)}
              </Typography>
              <Typography
                sx={{
                  ...typography.label,
                  color: colors.text.tertiary,
                  textTransform: "uppercase",
                }}
              >
                pts
              </Typography>
            </Box>
          </Box>
        )}

        {/* Final standings */}
        <SectionBlock title="Final standings" colors={colors}>
          <CardContainer colors={colors}>
            {sortedPlayers.map((player, index) => {
              const points = totalPoints[player.id] || 0;
              const isLast = index === sortedPlayers.length - 1;
              return (
                <Box
                  key={player.id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    py: `${spacing.md}px`,
                    px: `${spacing.lg}px`,
                    gap: `${spacing.md}px`,
                    borderBottom: !isLast
                      ? `1px solid ${colors.border.light}`
                      : "none",
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: fontFamilies.display,
                      fontSize: 18,
                      color: colors.text.tertiary,
                      minWidth: 20,
                      letterSpacing: -0.3,
                    }}
                  >
                    {index + 1}
                  </Typography>
                  <Typography
                    sx={{
                      ...typography.bodyLarge,
                      fontFamily: fontFamilies.bodyMedium,
                      color: colors.text.primary,
                      flex: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {player.name}
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: fontFamilies.monoBold,
                      fontSize: 18,
                      color:
                        points > 0
                          ? colors.scoring.positive
                          : points < 0
                            ? colors.scoring.negative
                            : colors.text.primary,
                      minWidth: 72,
                      textAlign: "right",
                    }}
                  >
                    {points > 0 ? "+" : ""}
                    {points.toFixed(1)}
                  </Typography>
                </Box>
              );
            })}
          </CardContainer>
        </SectionBlock>

        {/* Total strokes */}
        <SectionBlock title="Total strokes" colors={colors}>
          <CardContainer colors={colors}>
            {sortedPlayers.map((player, index) => {
              const playerTotalStrokes = holes.reduce((sum, hole) => {
                if (hole.confirmed === false) return sum;
                const score = scores.find(
                  (s) => s.playerId === player.id && s.holeId === hole.id,
                );
                return sum + (score?.strokes ?? hole.par);
              }, 0);
              const isLast = index === sortedPlayers.length - 1;
              return (
                <Box
                  key={player.id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    py: `${spacing.md}px`,
                    px: `${spacing.lg}px`,
                    gap: `${spacing.md}px`,
                    borderBottom: !isLast
                      ? `1px solid ${colors.border.light}`
                      : "none",
                  }}
                >
                  <Typography
                    sx={{
                      ...typography.bodyLarge,
                      fontFamily: fontFamilies.bodyMedium,
                      color: colors.text.primary,
                      flex: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {player.name}
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: fontFamilies.monoBold,
                      fontSize: 18,
                      color: colors.accent.gold,
                    }}
                  >
                    {playerTotalStrokes}
                  </Typography>
                </Box>
              );
            })}
          </CardContainer>
        </SectionBlock>

        {/* Handicaps */}
        {game?.handicaps && Object.keys(game.handicaps).length > 0 && (
          <SectionBlock title="Handicaps" colors={colors}>
            <CardContainer colors={colors}>
              {players.map((player, index) => {
                const opponents = players.filter((p) => p.id !== player.id);
                const handicapInfo = opponents
                  .map((opp) => {
                    const strokesGiven = getTotalHandicapForMatchup(
                      game.handicaps,
                      player.id,
                      opp.id,
                    );
                    const strokesReceived = getTotalHandicapForMatchup(
                      game.handicaps,
                      opp.id,
                      player.id,
                    );

                    if (strokesGiven > 0) {
                      return `Gives ${strokesGiven} to ${opp.name}`;
                    } else if (strokesReceived > 0) {
                      return `Receives ${strokesReceived} from ${opp.name}`;
                    }
                    return null;
                  })
                  .filter(Boolean);

                if (handicapInfo.length === 0) return null;
                const isLast = index === players.length - 1;

                return (
                  <Box
                    key={player.id}
                    sx={{
                      py: `${spacing.md}px`,
                      px: `${spacing.lg}px`,
                      borderBottom: !isLast
                        ? `1px solid ${colors.border.light}`
                        : "none",
                    }}
                  >
                    <Typography
                      sx={{
                        ...typography.bodyMedium,
                        fontFamily: fontFamilies.bodySemiBold,
                        color: colors.text.primary,
                        mb: `${spacing.xs}px`,
                      }}
                    >
                      {player.name}
                    </Typography>
                    {handicapInfo.map((info, idx) => (
                      <Typography
                        key={idx}
                        sx={{
                          ...typography.bodySmall,
                          color: colors.text.secondary,
                          lineHeight: "20px",
                        }}
                      >
                        {info}
                      </Typography>
                    ))}
                  </Box>
                );
              })}
            </CardContainer>
          </SectionBlock>
        )}

        {/* Head-to-head points (overall) */}
        {players.length >= 2 && holes.length > 0 && (
          <SectionBlock title="Head-to-head points" colors={colors}>
            <HeadToHeadPoints
              holes={holes}
              scoresByHoleId={getScoresByHoleId()}
              players={players}
              gameHandicaps={game?.handicaps}
            />
          </SectionBlock>
        )}

        {/* Head-to-head holes won */}
        {headToHead.length > 0 && (
          <SectionBlock title="Head-to-head holes won" colors={colors}>
            <CardContainer colors={colors}>
              {headToHead.map(({ leader, trailer, advantage }, idx) => (
                <Box
                  key={`${leader.id}_${trailer.id}`}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    py: `${spacing.md}px`,
                    px: `${spacing.lg}px`,
                    gap: `${spacing.sm}px`,
                    borderBottom:
                      idx < headToHead.length - 1
                        ? `1px solid ${colors.border.light}`
                        : "none",
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
                        fontFamily: fontFamilies.bodyMedium,
                        color:
                          advantage > 0
                            ? colors.accent.gold
                            : colors.text.primary,
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
                        color:
                          advantage > 0
                            ? colors.accent.gold
                            : colors.text.primary,
                        minWidth: 24,
                        textAlign: "center",
                      }}
                    >
                      {advantage}
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
                        color: colors.text.primary,
                        minWidth: 24,
                        textAlign: "center",
                      }}
                    >
                      0
                    </Typography>
                    <Typography
                      sx={{
                        ...typography.bodySmall,
                        fontFamily: fontFamilies.bodyMedium,
                        color: colors.text.primary,
                        flexShrink: 1,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {trailer.name}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </CardContainer>
          </SectionBlock>
        )}

        {/* Head-to-head by hole */}
        {players.length >= 2 && holes.length > 0 && (
          <SectionBlock title="Head-to-head by hole" colors={colors}>
            <HeadToHeadByHole
              holes={holes}
              scoresByHoleId={getScoresByHoleId()}
              players={players}
              gameHandicaps={game?.handicaps}
            />
          </SectionBlock>
        )}

        {/* Scorecard */}
        <Box sx={{ mb: `${spacing.xl}px` }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: `${spacing.sm}px`,
            }}
          >
            <Typography
              sx={{
                ...typography.label,
                color: colors.text.tertiary,
                textTransform: "uppercase",
              }}
            >
              Scorecard
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<DownloadIcon sx={{ fontSize: 16 }} />}
              disabled={generatingPDF}
              onClick={handleDownloadPDF}
              sx={{
                borderColor: colors.border.medium,
                color: colors.text.primary,
                fontFamily: fontFamilies.bodySemiBold,
                fontSize: typography.buttonSmall.fontSize,
                textTransform: "none",
                borderRadius: "9999px",
                px: 2,
                "&:hover": {
                  borderColor: colors.accent.gold,
                  bgcolor: "transparent",
                },
              }}
            >
              {generatingPDF ? "Generating..." : "Download PDF"}
            </Button>
          </Box>
          <Box
            sx={{
              width: "100%",
              overflowX: "auto",
              mt: `${spacing.sm}px`,
              bgcolor: colors.background.card,
              borderRadius: `${borderRadius.xl}px`,
              border: `1px solid ${colors.border.light}`,
            }}
          >
            <ScorecardTable
              holes={holes}
              scores={scores}
              players={players}
              colors={colors}
            />
          </Box>
          <Typography
            sx={{
              ...typography.bodySmall,
              color: colors.text.tertiary,
              textAlign: "center",
              mt: `${spacing.sm}px`,
              fontStyle: "italic",
            }}
          >
            Scroll horizontally to view all holes
          </Typography>
        </Box>

        {/* Hole-by-hole points */}
        <SectionBlock title="Hole-by-hole points" colors={colors}>
          <CardContainer colors={colors}>
            {/* Header row */}
            <Box
              sx={{
                display: "flex",
                borderBottom: `1px solid ${colors.border.light}`,
                py: `${spacing.sm}px`,
                px: `${spacing.md}px`,
              }}
            >
              <Typography
                sx={{
                  ...typography.label,
                  color: colors.text.tertiary,
                  textTransform: "uppercase",
                  textAlign: "left",
                  flex: 0.6,
                }}
              >
                Hole
              </Typography>
              {sortedPlayers.map((player) => (
                <Typography
                  key={player.id}
                  sx={{
                    ...typography.label,
                    color: colors.text.tertiary,
                    textTransform: "uppercase",
                    textAlign: "center",
                    flex: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {player.name}
                </Typography>
              ))}
            </Box>
            {/* Hole rows */}
            {[...holes]
              .sort((a, b) => a.holeNumber - b.holeNumber)
              .map((hole) => {
                const isConfirmed = hole.confirmed !== false;
                const scoresForHole = scoresByHoleId[hole.id] || [];
                const pts = isConfirmed
                  ? ScoreCalculator.calculateHolePoints(
                      hole,
                      scoresForHole,
                      players,
                      game?.handicaps,
                    )
                  : null;
                return (
                  <Box
                    key={hole.id}
                    sx={{
                      display: "flex",
                      py: `${spacing.sm}px`,
                      px: `${spacing.md}px`,
                      borderBottom: `1px solid ${colors.border.light}`,
                    }}
                  >
                    <Typography
                      sx={{
                        fontFamily: fontFamilies.mono,
                        fontSize: 12,
                        color: colors.text.tertiary,
                        flex: 0.6,
                        textAlign: "left",
                      }}
                    >
                      {hole.holeNumber}
                    </Typography>
                    {sortedPlayers.map((player) => {
                      if (!pts) {
                        return (
                          <Typography
                            key={player.id}
                            sx={{
                              fontFamily: fontFamilies.mono,
                              fontSize: 12,
                              color: colors.text.primary,
                              flex: 1,
                              textAlign: "center",
                            }}
                          >
                            —
                          </Typography>
                        );
                      }
                      const p = pts[player.id] || 0;
                      return (
                        <Typography
                          key={player.id}
                          sx={{
                            fontFamily: fontFamilies.mono,
                            fontSize: 12,
                            color:
                              p > 0
                                ? colors.scoring.positive
                                : p < 0
                                  ? colors.scoring.negative
                                  : colors.text.primary,
                            flex: 1,
                            textAlign: "center",
                          }}
                        >
                          {p > 0 ? "+" : ""}
                          {p.toFixed(1)}
                        </Typography>
                      );
                    })}
                  </Box>
                );
              })}
            {/* Total row */}
            <Box
              sx={{
                display: "flex",
                py: `${spacing.md}px`,
                px: `${spacing.md}px`,
                borderTop: `1px solid ${colors.border.goldSubtle}`,
              }}
            >
              <Typography
                sx={{
                  fontFamily: fontFamilies.bodySemiBold,
                  fontSize: 12,
                  color: colors.text.primary,
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                  flex: 0.6,
                  textAlign: "left",
                }}
              >
                Total
              </Typography>
              {sortedPlayers.map((player) => {
                const tp = totalPoints[player.id] || 0;
                return (
                  <Typography
                    key={player.id}
                    sx={{
                      fontFamily: fontFamilies.monoBold,
                      fontSize: 13,
                      color:
                        tp > 0
                          ? colors.scoring.positive
                          : tp < 0
                            ? colors.scoring.negative
                            : colors.text.primary,
                      flex: 1,
                      textAlign: "center",
                    }}
                  >
                    {tp > 0 ? "+" : ""}
                    {tp.toFixed(1)}
                  </Typography>
                );
              })}
            </Box>
          </CardContainer>
        </SectionBlock>

        <Box sx={{ height: `${spacing.xl}px` }} />
      </Box>

      {/* Bottom buttons */}
      <Box
        sx={{
          p: `${spacing.lg}px`,
          pb: `${spacing.xl}px`,
          bgcolor: colors.background.primary,
          borderTop: `1px solid ${colors.border.light}`,
          display: "flex",
          flexDirection: "column",
          gap: `${spacing.sm}px`,
        }}
      >
        <Button
          fullWidth
          variant="contained"
          onClick={() => navigate("/game/setup")}
          sx={{
            py: 1.5,
            bgcolor: colors.accent.gold,
            color: colors.text.inverse,
            fontFamily: fontFamilies.bodySemiBold,
            fontWeight: 600,
            fontSize: typography.button.fontSize,
            borderRadius: "9999px",
            textTransform: "none",
            "&:hover": {
              bgcolor: colors.accent.goldDark,
            },
          }}
        >
          New game
        </Button>
        <Button
          fullWidth
          variant="outlined"
          onClick={() => navigate("/")}
          sx={{
            py: 1.5,
            borderColor: colors.border.medium,
            color: colors.text.primary,
            fontFamily: fontFamilies.bodySemiBold,
            fontWeight: 600,
            fontSize: typography.button.fontSize,
            borderRadius: "9999px",
            textTransform: "none",
            "&:hover": {
              borderColor: colors.accent.gold,
              bgcolor: "transparent",
            },
          }}
        >
          Done
        </Button>
      </Box>
    </Box>
  );
};

// ========== Helper components ==========

function SectionBlock({
  title,
  children,
  colors,
}: {
  title: string;
  children: React.ReactNode;
  colors: any;
}) {
  return (
    <Box sx={{ mb: `${spacing.xl}px` }}>
      <Typography
        sx={{
          ...typography.label,
          color: colors.text.tertiary,
          textTransform: "uppercase",
          mb: `${spacing.sm}px`,
        }}
      >
        {title}
      </Typography>
      {children}
    </Box>
  );
}

function CardContainer({
  children,
  colors,
}: {
  children: React.ReactNode;
  colors: any;
}) {
  return (
    <Box
      sx={{
        bgcolor: colors.background.card,
        borderRadius: `${borderRadius.xl}px`,
        border: `1px solid ${colors.border.light}`,
        overflow: "hidden",
      }}
    >
      {children}
    </Box>
  );
}

// Inline scorecard table for web (replaces ZoomableView + Scorecard component)
function ScorecardTable({
  holes,
  scores,
  players,
  colors,
}: {
  holes: Hole[];
  scores: Score[];
  players: Player[];
  colors: any;
}) {
  const sortedHoles = [...holes].sort((a, b) => a.holeNumber - b.holeNumber);
  const frontNine = sortedHoles.filter((h) => h.holeNumber <= 9);
  const backNine = sortedHoles.filter((h) => h.holeNumber > 9);

  const getStrokes = (playerId: string, holeId: string): number | null => {
    const hole = holes.find((h) => h.id === holeId);
    if (hole && hole.confirmed === false) return null;
    const score = scores.find(
      (s) => s.playerId === playerId && s.holeId === holeId,
    );
    return score ? score.strokes : hole?.par || 0;
  };

  const renderNine = (nineHoles: Hole[], label: string) => {
    if (nineHoles.length === 0) return null;
    const ninePar = nineHoles.reduce((sum, h) => {
      if (h.confirmed === false) return sum;
      return sum + h.par;
    }, 0);

    return (
      <Box sx={{ mb: 2 }}>
        <Box
          component="table"
          sx={{
            width: "100%",
            borderCollapse: "collapse",
            minWidth: nineHoles.length * 44 + 120,
            "& th, & td": {
              border: `1px solid ${colors.border.light}`,
              px: "6px",
              py: "4px",
              textAlign: "center",
              fontFamily: fontFamilies.mono,
              fontSize: 11,
            },
            "& th": {
              bgcolor: colors.background.elevated,
              fontFamily: fontFamilies.bodySemiBold,
              fontSize: 10,
              color: colors.text.tertiary,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            },
          }}
        >
          <thead>
            <tr>
              <Box
                component="th"
                sx={{ textAlign: "left !important", minWidth: 70 }}
              >
                {label}
              </Box>
              {nineHoles.map((h) => (
                <th key={h.id}>{h.holeNumber}</th>
              ))}
              <Box component="th" sx={{ fontWeight: 700 }}>
                Tot
              </Box>
            </tr>
          </thead>
          <tbody>
            <tr>
              <Box
                component="td"
                sx={{
                  textAlign: "left !important",
                  fontFamily: `${fontFamilies.bodySemiBold} !important`,
                  color: colors.text.tertiary,
                }}
              >
                Par
              </Box>
              {nineHoles.map((h) => (
                <td key={h.id}>{h.par}</td>
              ))}
              <Box
                component="td"
                sx={{ fontWeight: 700, color: colors.text.tertiary }}
              >
                {ninePar}
              </Box>
            </tr>
            {players.map((player) => {
              const total = nineHoles.reduce((sum, h) => {
                if (h.confirmed === false) return sum;
                const s = getStrokes(player.id, h.id);
                return sum + (s ?? 0);
              }, 0);
              return (
                <tr key={player.id}>
                  <Box
                    component="td"
                    sx={{
                      textAlign: "left !important",
                      fontFamily: `${fontFamilies.bodySemiBold} !important`,
                      color: `${colors.text.primary} !important`,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      maxWidth: 80,
                    }}
                  >
                    {player.name}
                  </Box>
                  {nineHoles.map((h) => {
                    const strokes = getStrokes(player.id, h.id);
                    if (strokes === null) return <td key={h.id}>-</td>;
                    const diff = strokes - h.par;
                    let cellColor = colors.text.primary;
                    if (diff <= -2) cellColor = colors.scoring.birdie;
                    else if (diff === -1) cellColor = colors.scoring.positive;
                    else if (diff > 0) cellColor = colors.scoring.negative;
                    return (
                      <Box
                        component="td"
                        key={h.id}
                        sx={{
                          color: `${cellColor} !important`,
                          fontWeight: diff < 0 ? 700 : 400,
                        }}
                      >
                        {strokes}
                      </Box>
                    );
                  })}
                  <Box
                    component="td"
                    sx={{
                      fontWeight: 700,
                      color: `${colors.text.primary} !important`,
                    }}
                  >
                    {total}
                  </Box>
                </tr>
              );
            })}
          </tbody>
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ p: `${spacing.md}px` }}>
      {renderNine(frontNine, "Front 9")}
      {renderNine(backNine, "Back 9")}
    </Box>
  );
}

export default GameSummaryPage;
