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
  initialized: boolean;
  userId: string | null;
  isLogged: boolean;
  login: (option: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const initAccount = async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        credentials: "include",
      });

      if (!response.ok) return;

      const data = await response.json();

      setUserId(data.user.id);
      setUserName(data.user.name);
    } catch (err) {
      console.error(err);
    } finally {
      setInitialized(true);
    }
  };

  useEffect(() => {
    initAccount();
  }, []);

  const updateUserName = async (name: string) => {
    if (!userId) return;

    const response = await fetch(`${API_URL}/api/users/me/name`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name }),
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.reason);
    }

    setUserName(data.name);
  };

  const login = async (option: string, autoLogin: boolean) => {
    switch (option) {
      case "guest": {
        const response = await fetch(`${API_URL}/api/auth/guest`, {
          method: "POST",
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("게스트 로그인 실패");
        }

        const data: {
          user: {
            id: string;
            name: string;
          };
        } = await response.json();

        setUserId(data.user.id);
        setUserName(data.user.name);

        break;
      }

      case "naver":
      case "google":
      case "github":
        break;
    }
  };

  const logout = async () => {
    const response = await fetch(`${API_URL}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error("로그아웃 실패");
    }
    setUserId(null);
    setUserName(null);
  };

  return (
    <AuthContext.Provider
      value={{
        userName,
        setUserName,
        updateUserName,
        initialized,
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
