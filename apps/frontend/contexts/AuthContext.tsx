"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

interface AuthContextType {
  userName: string | null;
  setName: (name: string) => void;
  loading: boolean;
  userId: string | null;
  isLogged: boolean;
  login: (id: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedUserId = window.sessionStorage.getItem("mink-gomoku-user-id");
    if (storedUserId) {
      setUserId(storedUserId);
    }
    setLoading(true);
  }, []);

  const setName = (name: string) => {
    sessionStorage.setItem("mink-gomoku-user-name", name);
    setUserName(name);
  };

  const login = (id: string) => {
    sessionStorage.setItem("mink-gomoku-user-id", id);
    setUserId(id);
  };

  const logout = () => {
    sessionStorage.removeItem("mink-gomoku-user-id");
    setUserId(null);
  };

  return (
    <AuthContext.Provider
      value={{
        userName,
        setName,
        loading,
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
