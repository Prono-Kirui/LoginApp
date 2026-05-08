// src/hooks/use-auth.tsx
import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { api, type User, type LoginResponse } from "@/lib/api";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      // You can decode JWT or fetch profile later
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const data: LoginResponse = await api.login({ email, password });

    api.setToken(data.token);
    setUser(data.user);
  };

  const register = async (email: string, password: string, displayName?: string) => {
    console.log("🔄 Register called with:", { email, password: "****", displayName }); // ← Debug
    await api.register({ email, password, displayName: displayName });
  };

  const logout = () => {
    api.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}