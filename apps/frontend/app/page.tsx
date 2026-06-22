"use client";

import { useEffect, useState, useRef, SubmitEvent } from "react";
import { io, Socket } from "socket.io-client";

const SOCKET_URL = "http://localhost:4000";

export default function OmokPage() {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const socketId = useRef<string>("");
  const [userId, setUserId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [rooms, setRooms] = useState<string[]>([]);

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      transports: ["websocket"],
      withCredentials: true,
    });
    socketRef.current = newSocket;

    newSocket.on("connect", () => {
      socketId.current = newSocket.id ?? "";
      setUserId(socketId.current);
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => setIsConnected(false));

    newSocket.on("refreshRooms", (data: { roomIds: string[] }) => {
      setRooms(data.roomIds);
    });

    return () => {
      newSocket.removeAllListeners();
      newSocket.disconnect();
    };
  }, []);

  const handlerMakeNewRoom = (e: SubmitEvent) => {
    e.preventDefault();
    if (!socketRef.current) {
      console.log("Server error.");
      return;
    }
    const data = new FormData(e.target).get("id")?.toString() ?? "";
    socketRef.current.emit(
      "makeRoom",
      { id: data },
      (res: { success: boolean; reason: string }) => {
        if (res.success) {
          setRoomId(data);
        } else {
          console.log("방 생성 실패");
        }
      },
    );
  };

  const handlerExitRoom = () => {
    socketRef.current?.emit(
      "exitRoom",
      { id: roomId },
      (res: { success: boolean; reason: string }) => {
        if (res.success) console.log("방 퇴장 성공");
        else console.log("방 퇴장 실패");
      },
    );
    setRoomId("");
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-100 p-4">
      <h1 className="mb-2 text-3xl font-bold text-slate-800">
        ⚔️ 실시간 대전 오목 (Multi-Room)
      </h1>

      {/* 🟢 서버 연결 및 내 돌 색상 정보 */}
      <div className="mb-2 flex gap-4 text-xs font-mono text-center">
        <div className={isConnected ? "text-emerald-600" : "text-rose-600"}>
          ● {isConnected ? "SERVER CONNECTED" : "DISCONNECTED"}
          <br />
          User Id : {userId}
        </div>
      </div>
      {roomId === "" ? (
        <div className="flex flex-col justify-center items-center">
          <form onSubmit={handlerMakeNewRoom}>
            <input type="text" name="id" />
            <button
              type="submit"
              className="bg-blue-500 text-white p-2 rounded-lg active:bg-blue-700"
            >
              Make new room
            </button>
          </form>

          <div className="flex flex-col w-full p-2">
            {rooms.map((room, index) => (
              <div
                key={index}
                className="flex flex-row justify-between items-center"
              >
                {room}
                <button
                  className="bg-green-500 text-white p-2 rounded-lg active:bg-green-700"
                  onClick={() => {
                    console.log("방참가 시도", room);
                    if (socketRef.current)
                      socketRef.current.emit(
                        "joinRoom",
                        { roomId: room },
                        (res: { success: boolean; reason: string }) => {
                          if (res.success) {
                            setRoomId(room);
                          }
                          console.log(res.reason);
                        },
                      );
                  }}
                >
                  Join
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col">
          <span className="text-xs text-center">{roomId}</span>
          <button
            className="bg-red-500 text-white p-2 rounded-lg active:bg-red-700"
            onClick={handlerExitRoom}
          >
            Exit room
          </button>
        </div>
      )}
    </main>
  );
}
