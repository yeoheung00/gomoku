"use client";

import { useParams } from "next/navigation";
import { useEffect } from "react";
import { socket } from "@/lib/socket";

export default function GameRoomPage() {
  const params = useParams();
  const roomId = params.id as string; // URL에서 room_id 추출

  useEffect(() => {
    // 💡 방에 진입하자마자 서버에 "나 URL 타고 이 방 들어왔어"라고 소켓 룸 조인 요청
    socket.emit(
      "enterRoomPage",
      { roomId },
      (res: { success: boolean; reason?: string }) => {
        if (!res.success) {
          alert(`방 진입 오류: ${res.reason}`);
          window.location.href = "/"; // 메인으로 퇴각
        }
      },
    );
  }, [roomId]);

  return (
    <div className="p-8">
      <h2 className="text-xl font-bold mb-4">
        대국방 ID: <span className="text-blue-500">{roomId}</span>
      </h2>
      <div>
        <h2>{}</h2>
      </div>
    </div>
  );
}
