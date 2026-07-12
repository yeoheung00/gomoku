"use client";

import { socket } from "@/lib/socket";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";

interface SocketContextType {
  socket: Socket;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType | null>(null);

export default function SocketProvider({ children }: { children: ReactNode }) {
  const { isLogged, userId, loading } = useAuth();

  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    // AuthContext가 sessionStorage 확인을 끝낼 때까지 대기
    if (!loading) return;

    const handleConnect = () => {
      console.log(`🔌 소켓 연결 성공: ${socket.id}`);

      setIsConnected(true);
    };

    const handleDisconnect = () => {
      console.log("❌ 소켓 연결 해제");

      setIsConnected(false);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    if (isLogged && userId) {
      // 연결 과정에서 서버에 사용자 ID 전달
      socket.auth = {
        userId,
      };

      if (!socket.connected) {
        socket.connect();
      }
    } else {
      if (socket.connected) {
        socket.disconnect();
      }
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [loading, isLogged, userId]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);

  if (!context) {
    throw new Error("useSocket must be used inside SocketProvider");
  }

  return context;
}
