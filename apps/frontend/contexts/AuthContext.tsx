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
  setUserName: (name: string) => void;
  updateUserName: (name: string) => Promise<void>;
  loading: boolean;
  userId: string | null;
  isLogged: boolean;
  login: (option: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const storedUserId = window.sessionStorage.getItem("mink-gomoku-user-id");
    const storedUserName = window.sessionStorage.getItem("mink-gomoku-user-name");
    if (storedUserId) {
      setUserId(storedUserId);
    }
    if (storedUserName) {
      setUserName(storedUserName);
    }
    setLoading(true);
  }, []);

  useEffect(() => {
    if (userId?.startsWith("gst_")) return;
    //TODO: 게스트가 아니라면 유저 이름 DB 수정
  },[userName])

  const updateUserName = async (name: string) => {
    if (!userId) return;

      const response = await fetch(
        `${API_URL}/api/users/${userId}/name`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.reason);
      }

      setUserName(data.userName);
  }

  const login = async (option: string) => {
    switch (option) {
      case "guest": {
        const response = await fetch(`${API_URL}/api/auth/guest`, {
          method: "POST",
        });

        if (!response.ok) {
          throw new Error("게스트 로그인 실패");
        }

        const data: {
          userId: string;
          userName: string;
        } = await response.json();

        sessionStorage.setItem("mink-gomoku-user-id", data.userId);

        setUserId(data.userId);
        setUserName(data.userName);

        break;
      }

      case "naver":
      case "google":
      case "github":
        break;
    }
  };

  const logout = async () => {
    sessionStorage.removeItem("mink-gomoku-user-id");
    sessionStorage.removeItem("mink-gomoku-user-name");
    setUserId(null);
    await fetch(`${API_URL}/api/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId }),
    });
  };

  return (
    <AuthContext.Provider
      value={{
        userName,
        setUserName,
        updateUserName,
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
