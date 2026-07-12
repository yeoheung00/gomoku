"use client";

import { useState } from "react";
import GameOption from "./GameOption";
import QuickMatch from "./QuickMatch";
import PrivateRoom from "./PrivateRoom";
import { Check, Edit } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/SocketContext";

export default function Lobby() {
  const [status, setStatus] = useState<"none" | "quick" | "private">("none");
  const statusComponent = {
    none: <GameOption onStatus={setStatus} />,
    quick: <QuickMatch onStatus={setStatus} />,
    private: <PrivateRoom onStatus={setStatus} />,
  }[status];
  return (
    <div className="flex flex-col w-full">
      <UserInfo/>
      {statusComponent}
    </div>
  );
}

function UserInfo() {
  const { userName, setUserName, updateUserName, logout } = useAuth();
  const { isConnected } = useSocket();
  const [edit, setEdit] = useState(userName??"");
  const [isEditing, setIsEditing] = useState(false);

  const handlerEditName = async () => {
    console.log(edit);
    //TODO: 수정된 유저이름 적합성 평가
    setUserName(edit);
    setIsEditing(false);
    updateUserName(edit);
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-row gap-1">
      <span className={`${isConnected ? "text-green-500" : "text-red-500"}`}>●</span>
        {isEditing ?
          <div className="flex flex-row gap-1">
            <input name="edit" value={edit} onChange={(e) => setEdit(e.target.value)} />
            <button onClick={handlerEditName}><Check size="24"/></button>
          </div>
          :
          <div className="flex flex-row gap-1">
            <span>{userName}</span>
            <button onClick={() => setIsEditing(true)}><Edit size="24"/></button>
          </div>
        }
      </div>
      <button onClick={logout}>Logout</button>
    </div>
  )
}
