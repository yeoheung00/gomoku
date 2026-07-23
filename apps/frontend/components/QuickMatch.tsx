'use client'
import { useEffect } from "react";
import { useSocket } from "@/contexts/SocketContext";
import { X } from "lucide-react"
import { useRouter } from "next/navigation";

interface QuickMatchProps {
  onStatus: (status: "none" | "quick" | "private") => void;
}

export default function QuickMatch({ onStatus }: QuickMatchProps) {
  const { socket } = useSocket();
  const router = useRouter();
  useEffect(() => {
    const handleGameStart = (data: { gameId: string, players: { black: { userId: string, socketId: string }, white: { userId: string, socketId: string } } }, callback: (response: { status: string, msg: string }) => void) => {
      if (!data.gameId) {
        callback({ status: "error", msg: "game id doesn't exist." });
        console.log("game id doesn't exist.");
        return;
      }
      router.push(`/game/${data.gameId}`);
      onStatus("none");
    }

    socket.on("game-start", handleGameStart);
    return () => {
      socket.off("game-start");
    };
  }, [socket, router, onStatus]);
  const handlerExitQuickMatch = () => {
    onStatus("none");
    socket.emit("exit-quick-match");
  };
  return (
    <section className="w-full h-fit flex flex-row gap-4">
      <span className="flex-1 bg-blue-500 leading-10 h-10 text-center" >매칭중...</span>
      <button className="w-10 h-10 bg-red-400 flex items-center justify-center" onClick={handlerExitQuickMatch}><X size="32"/></button>
    </section>
  );
}
