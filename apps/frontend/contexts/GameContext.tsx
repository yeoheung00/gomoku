"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useSocket } from "./SocketContext";

interface Player {
  name: string;
  userId: string;
  socketId: string | null;
  connected: boolean;
}

interface GameContextType {
  board: number[][];
  currentTurn: number;
  winner: string | null;
  setWinner: (id: string | null) => void;
  players: Player[];
  spectators: string[];
  initialized: boolean;
}

const GameContext = createContext<GameContextType | null>(null);

export default function GameProvider({ children }: { children: ReactNode }) {
  const { socket } = useSocket();
  const [board, setBoard] = useState<number[][]>([]);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [winner, setWinner] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [spectators, setSpectators] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    socket.on("init-data", (game, callback) => {
      setBoard(game.board);
      setCurrentTurn(game.currentTurn);
      setPlayers(game.players);
      setSpectators(game.spectators);
      callback({ status: "ok", msg: "initialized" });
      setInitialized(true);
    });
    socket.on("update-board", (data) => {
      setBoard(data.board);
      setCurrentTurn(data.currentTurn);
    });
    socket.on("game-over", (winner) => {
      setWinner(winner);
    });
  }, []);

  return (
    <GameContext.Provider
      value={{
        board,
        currentTurn,
        winner,
        setWinner,
        players,
        spectators,
        initialized,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);

  if (!context) {
    throw new Error("useGame must be used inside GameProvider");
  }

  return context;
}
