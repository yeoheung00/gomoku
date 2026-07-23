"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useGame } from "@/contexts/GameContext";
import { useSocket } from "@/contexts/SocketContext";
import Chat from "@/components/Chat";

const BLACK = 0;
const WHITE = 1;

export default function GameRoomPage() {
  const params = useParams();
  const { userId } = useAuth();
  const { socket } = useSocket();
  const { players, initialized } = useGame();
  const gameId = params.id as string; // URL에서 room_id 추출

  useEffect(() => {
    socket.emit("enter-room", { gameId, userId }, (response: { status: string; msg: string }) => {
      console.log(response.status, response.msg);
    });
  }, [])

  if (!initialized) return <div>게임 데이터 로딩중...</div>;
  else console.log(players);

  return (
    <div className="w-full max-w-2xl h-full flex flex-col">
      <Dashboard />
      <div className="min-h-0 flex items-center justify-center">
        <div className="aspect-square w-full max-h-full flex items-center justify-center">
          <GameBoard />
        </div>
      </div>
      <div className="flex-1 min-h-30 bg-blue-200 flex flex-col">
        <div className="w-full flex-1 bg-green-200"></div>
        <div className="w-full h-10"></div>
      </div>
    </div>
  );
}

const Dashboard = () => {
  const { userName } = useAuth();
  const { currentTurn, players } = useGame();
  const [black, white] = [players[0].name, players[1].name];
  return (
    <div className="w-full shrink-0 flex flex-row">
      <div className="flex-1 flex flex-row gap-2">
        <Black size={24} />
        <span>{black}</span>
        <span>{userName === black ? "[나]" : ""}</span>
      </div>
      <div className="w-fit h-fit flex flex-col items-center justify-center">
        {currentTurn === BLACK ? <Black size={40}/> : <White size={40}/>}
        <span>{players[currentTurn].name === userName ? "나의" : "상대"} 차례</span>
      </div>
      <div className="flex-1 flex flex-row-reverse gap-2">
        <White size={24} />
        <span>{white}</span>
        <span>{userName === white ? "[나]" : ""}</span>
      </div>
    </div>
  );
};

const GameBoard = () => {
  const { userId } = useAuth();
  const { socket } = useSocket();
  const { board, winner, currentTurn, players } = useGame();
  const handlePlacement = (x: number, y: number) => {
    if (winner) return;
    if (players[currentTurn].userId !== userId) return;
    if (board[y][x] !== -1) return;
    console.log(x, y);
    socket.emit("placement", { x, y, userId });
  };
  return (
    <div className="h-full aspect-square bg-[url('/field_assets/board.svg')] bg-cover">{
      board.map((row, y) => (
        <div key={y} className="w-full flex flex-row">
          {row.map((cell, x) => (
            <button key={x} className="relative w-full aspect-square" onClick={() => handlePlacement(x, y)}>
              {board[y][x] !== -1 ?
                <span className="w-full aspect-square absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 p-1">{cell === BLACK ? <Black /> : cell === WHITE ? <White /> : ""}</span>
                :
                <span className={`w-full aspect-square absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 p-1 opacity-0 ${userId === players[currentTurn].userId ? "hover:opacity-75" : ""}`}>{userId === players[BLACK].userId ? <Black /> : <White />}</span>
              }
            </button>
          ))}
        </div>
      ))
      }
    </div>
  );
}

const Black = ({ size }: { size?: number }) => {
  return (
    <div
      style={
        size
          ? { width: `${size}px`, height: `${size}px` }
          : undefined
      }
      className={`${
        size ? "" : "w-full aspect-square"
      } rounded-full bg-stone-black shadow-stone-black`}
    ></div>
  );
};

const White = ({ size }: { size?: number }) => {
  return (
    <div
      style={
        size
          ? { width: `${size}px`, height: `${size}px` }
          : undefined
      }
      className={`${
        size ? "" : "w-full aspect-square"
      } rounded-full bg-stone-white shadow-stone-white`}
    ></div>
  );
};
