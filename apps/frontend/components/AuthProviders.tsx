"use client";

import { AuthProvider } from "@/contexts/AuthContext";

export default function AuthProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthProvider>{children}</AuthProvider>;
}
