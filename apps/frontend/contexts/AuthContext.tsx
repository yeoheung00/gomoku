"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface AuthContextType {
  userId: string | null;
  isLogged: boolean;
  login: (id: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    return sessionStorage.getItem("min-gomoku-user-id");
  });

  const login = (id: string) => {
    sessionStorage.setItem("min-gomoku-user-id", id);

    setUserId(id);
  };

  const logout = () => {
    sessionStorage.removeItem("min-gomoku-user-id");

    setUserId(null);
  };

  return (
    <AuthContext.Provider
      value={{
        userId,
        isLogged: userId !== null,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
