import { format } from 'date-fns';

export const formatDate = (date: Date): string => {
  return format(date, 'MMM d, yyyy');
};

export const formatDateTime = (date: Date): string => {
  return format(date, 'MMM d, yyyy h:mm a');
};

export const formatPoints = (points: number): string => {
  const sign = points > 0 ? '+' : '';
  return `${sign}${points.toFixed(1)}`;
};

export const formatScore = (strokes: number, handicap: number): string => {
  const net = strokes - handicap;
  if (handicap > 0) {
    return `${strokes} (${net})`;
  }
  return `${strokes}`;
};

export const formatMultiplier = (multiplier: number): string => {
  return `${multiplier}x`;
};
