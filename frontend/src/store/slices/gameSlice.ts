import { StateCreator } from 'zustand';
import { Game, Hole, Score, Player } from '../../types';
import { ScoreCalculator } from '../../utils/scoreCalculator';

export interface GameSlice {
  // Current game state
  currentGameId: string | null;
  currentGame: Game | null;
  currentHoleIndex: number;

  // Data
  games: Record<string, Game>;
  holes: Record<string, Hole>;
  scores: Record<string, Score>;
  players: Record<string, Player>;

  // Actions
  setCurrentGameId: (gameId: string | null) => void;
  setCurrentGame: (game: Game | null) => void;
  setCurrentHoleIndex: (index: number) => void;
  setGame: (gameId: string, game: Game) => void;
  setHole: (holeId: string, hole: Hole) => void;
  setScore: (scoreId: string, score: Score) => void;
  setPlayer: (playerId: string, player: Player) => void;
  setGames: (games: Game[]) => void;
  setHoles: (holes: Hole[]) => void;
  setScores: (scores: Score[]) => void;
  setPlayers: (players: Player[]) => void;
  clearGame: () => void;

  // Selectors
  getCurrentGameHoles: () => Hole[];
  getCurrentGameScores: () => Score[];
  getCurrentGamePlayers: () => Player[];
  getScoresByHoleId: () => Record<string, Score[]>;
  getTotalPoints: () => Record<string, number>;
  getRunningTotals: () => Record<string, number>[];
}

export const createGameSlice: StateCreator<GameSlice> = (set, get) => ({
  // Initial state
  currentGameId: null,
  currentGame: null,
  currentHoleIndex: 0,
  games: {},
  holes: {},
  scores: {},
  players: {},

  // Actions
  setCurrentGameId: (gameId) => set({ currentGameId: gameId }),
  setCurrentGame: (game) => set({ currentGame: game }),
  setCurrentHoleIndex: (index) => set({ currentHoleIndex: index }),
  setGame: (gameId, game) =>
    set((state) => ({
      games: { ...state.games, [gameId]: game },
    })),
  setHole: (holeId, hole) =>
    set((state) => ({
      holes: { ...state.holes, [holeId]: hole },
    })),
  setScore: (scoreId, score) =>
    set((state) => ({
      scores: { ...state.scores, [scoreId]: score },
    })),
  setPlayer: (playerId, player) =>
    set((state) => ({
      players: { ...state.players, [playerId]: player },
    })),
  setGames: (games) =>
    set({
      games: games.reduce((acc, game) => {
        acc[game.id] = game;
        return acc;
      }, {} as Record<string, Game>),
    }),
  setHoles: (holes) =>
    set({
      holes: holes.reduce((acc, hole) => {
        acc[hole.id] = hole;
        return acc;
      }, {} as Record<string, Hole>),
    }),
  setScores: (scores) =>
    set({
      scores: scores.reduce((acc, score) => {
        acc[score.id] = score;
        return acc;
      }, {} as Record<string, Score>),
    }),
  setPlayers: (players) =>
    set({
      players: players.reduce((acc, player) => {
        acc[player.id] = player;
        return acc;
      }, {} as Record<string, Player>),
    }),
  clearGame: () =>
    set({
      currentGameId: null,
      currentGame: null,
      currentHoleIndex: 0,
    }),

  // Selectors
  getCurrentGameHoles: () => {
    const state = get();
    if (!state.currentGameId) return [];
    return Object.values(state.holes)
      .filter((hole) => hole.gameId === state.currentGameId)
      .sort((a, b) => a.holeNumber - b.holeNumber);
  },

  getCurrentGameScores: () => {
    const state = get();
    if (!state.currentGameId) return [];
    const holes = state.getCurrentGameHoles();
    const holeIds = new Set(holes.map((h) => h.id));
    return Object.values(state.scores).filter((score) => holeIds.has(score.holeId));
  },

  getCurrentGamePlayers: () => {
    const state = get();
    if (!state.currentGame) return [];
    return state.currentGame.playerIds
      .map((id) => state.players[id])
      .filter((p) => p !== undefined);
  },

  getScoresByHoleId: () => {
    const state = get();
    const scores = state.getCurrentGameScores();
    const byHole: Record<string, Score[]> = {};

    scores.forEach((score) => {
      if (!byHole[score.holeId]) {
        byHole[score.holeId] = [];
      }
      byHole[score.holeId].push(score);
    });

    return byHole;
  },

  getTotalPoints: () => {
    const state = get();
    const holes = state.getCurrentGameHoles();
    const scoresByHoleId = state.getScoresByHoleId();
    const players = state.getCurrentGamePlayers();
    const gameHandicaps = state.currentGame?.handicaps;

    return ScoreCalculator.calculateTotalPoints(holes, scoresByHoleId, players, gameHandicaps);
  },

  getRunningTotals: () => {
    const state = get();
    const holes = state.getCurrentGameHoles();
    const scoresByHoleId = state.getScoresByHoleId();
    const players = state.getCurrentGamePlayers();
    const gameHandicaps = state.currentGame?.handicaps;

    return ScoreCalculator.calculateRunningTotals(holes, scoresByHoleId, players, gameHandicaps);
  },
});
