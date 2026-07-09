"use client";

import { useState } from "react";
import GameOption from "./GameOption";
import QuickMatch from "./QuickMatch";
import PrivateRoom from "./PrivateRoom";

export default function Lobby() {
  const [status, setStatus] = useState<"none" | "quick" | "private">("none");
  const statusComponent = {
    none: <GameOption onStatus={setStatus} />,
    quick: <QuickMatch />,
    private: <PrivateRoom />,
  }[status];
  return <div>{statusComponent}</div>;
}
