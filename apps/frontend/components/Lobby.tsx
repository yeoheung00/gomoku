"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import GameOption from "./GameOption";
import QuickMatch from "./QuickMatch";
import PrivateRoom from "./PrivateRoom";

export default function Lobby() {
  const { logout } = useAuth();
  const [status, setStatus] = useState<"none" | "quick" | "private">("none");
  const statusComponent = {
    none: <GameOption onStatus={setStatus} />,
    quick: <QuickMatch onStatus={setStatus} />,
    private: <PrivateRoom onStatus={setStatus} />,
  }[status];
  return (
    <div>
      <button onClick={logout}>Logout</button>
      {statusComponent}
    </div>
  );
}
