"use client"

import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

export default function LoginOption() {
  const { login } = useAuth();
  const [autoLogin, setAutoLogin] = useState(false);

  return (
    <div className="w-full h-fit">
      <div className="w-full h-fit grid grid-cols-1 md:grid-cols-2">
        <button className="w-full h-10 bg-gray-600 text-white"onClick={()=>login("guest", autoLogin)}>Guest</button>
        <button className="w-full h-10 bg-green-600 text-white" onClick={()=>login("naver", autoLogin)}>Naver</button>
        <button className="w-full h-10 bg-blue-600 text-white" onClick={()=>login("google", autoLogin)}>Google</button>
        <button className="w-full h-10 bg-gray-900 text-white" onClick={() => login("github", autoLogin)}>Github</button>
      </div>

      <input type="checkbox" id="autoLogin" checked={autoLogin} onChange={() => setAutoLogin(!autoLogin)} />
      <label htmlFor="autoLogin">자동 로그인</label>
    </div>
  );
}
