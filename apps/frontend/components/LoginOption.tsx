"use client"

import { useAuth } from "@/contexts/AuthContext";

export default function LoginOption() {
  const { login } = useAuth();
  return (
    <div className="w-full h-fit grid grid-cols-1 md:grid-cols-2">
      <button className="w-full h-10 bg-gray-600 text-white"onClick={()=>login("guest")}>Guest</button>
      <button className="w-full h-10 bg-green-600 text-white" onClick={()=>login("naver")}>Naver</button>
      <button className="w-full h-10 bg-blue-600 text-white" onClick={()=>login("google")}>Google</button>
      <button className="w-full h-10 bg-gray-900 text-white" onClick={()=>login("github")}>Github</button>
    </div>
  );
}
