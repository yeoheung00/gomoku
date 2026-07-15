"use client";

import LoginOption from "@/components/LoginOption";
import Lobby from "@/components/Lobby";
import { useAuth } from "@/contexts/AuthContext";

export default function Page() {
  const { initialized, isLogged } = useAuth();

  if (!initialized) return null;

  return (
    <main className="w-full max-w-3xl flex flex-col justify-center items-center">
      <h1 className="text-5xl font-black text-center">⚫️ 오목 ⚪️</h1>
      {!isLogged ? <LoginOption /> : <Lobby />}
    </main>
  );
}
