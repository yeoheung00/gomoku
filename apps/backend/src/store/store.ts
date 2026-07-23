

interface User {
  name: string;
  win: number;
  lose: number;
  refreshToken: string;
}

interface Player {
  name: string;
  userId: string;
  socketId: string | null;
  connected: boolean;
}

interface Game {
  board: number[][];
  currentTurn: number;
  winner: string | null;
  players: Player[];
  spectators: string[];
}

interface MatchingUser {
  userId: string,
  rate: number,
}

export const users: Record<string, User> = {};
export const games: Record<string, Game> = {};
export const matchQueue: Record<string, string> = {};
