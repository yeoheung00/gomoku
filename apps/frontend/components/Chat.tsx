"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/SocketContext";
import { useEffect, useState } from "react";

export default function Chat() {
  interface ChatLog {
    from: string;
    msg: string;
  }
  const { userName } = useAuth();
  const { socket } = useSocket();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [chatLogs, setChatLogs] = useState<ChatLog[]>([]);

  const handleSend = () => {
    socket.emit("send-chat", {
      from: userName ?? "알 수 없음",
      msg: message,
    } as ChatLog);
    if (!message) return;
    setChatLogs((prev) => [...prev, { from: userName ?? "알 수 없음", msg: message }]);
    setMessage("");
  };

  useEffect(() => {
    socket.on("update-chat", (data: ChatLog) => {
      if (data.from === userName) return;
      setChatLogs((prev) => [...prev, data]);
    });
    return () => {
      socket.off("update-chat");
    };
  }, [socket, userName]);

  return (
    <div
      className={`h-40  bg-blue-200 flex flex-col duration-300 transition-height ${isOpen ? "flex-1" : ""}`}
    >
      <div className="w-full flex-1 bg-green-200 overflow-y-scroll">
        {chatLogs.map((chatLog, index) => {
          const isSameSpeaker =
            index > 0 ? chatLogs[index - 1].from === chatLog.from : false;
          return (
            <ChatLine
              key={index}
              from={chatLog.from}
              msg={chatLog.msg}
              isSameSpeaker={isSameSpeaker}
            />
          );
        })}
      </div>
      <div className="w-full h-10 flex flex-row">
        <button onClick={() => setIsOpen(!isOpen)}>{isOpen ? "Close" : "Open"}</button>
        <input
          type="text"
          className="flex-1"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
}

const ChatLine = ({
  from,
  msg,
  isSameSpeaker,
}: {
  from: string;
  msg: string;
  isSameSpeaker: boolean;
}) => {
  const { userName } = useAuth();
  const isMe = from === userName;
  return (
    <div
      className={`flex flex-row items-start gap-1 ${isMe ? "text-blue-400" : "text-black"}`}
    >
      <span className={`h-6 leading-6 shrink-0 ${isSameSpeaker ? "opacity-0" : ""}`}>
        {isMe ? "[ 나 ]" : `[${from}]`}
      </span>
      <span className="leading-6 break-word">{msg}</span>
    </div>
  );
};
