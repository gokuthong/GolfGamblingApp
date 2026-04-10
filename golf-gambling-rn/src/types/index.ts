export * from './game';
export * from './hole';
export * from './score';
export * from './player';
export * from './user';
export * from './scoring';
export * from './course';

// Navigation types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Players: undefined;
  History: undefined;
  Settings: undefined;
};

export type GameStackParamList = {
  GameSetup: undefined;
  Scoring: { gameId: string };
  OverallStandings: { gameId: string };
  GameSummary: { gameId: string };
};

export type HistoryStackParamList = {
  GameHistory: undefined;
  GameSummary: { gameId: string };
};
