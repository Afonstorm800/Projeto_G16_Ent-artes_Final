import { createContext, useContext, useState, ReactNode } from "react";

export type UserRole = "direcao" | "professor" | "encarregado";

export interface MockUser {
  id: string;
  nome: string;
  email: string;
  tipo: UserRole;
  avatar?: string;
  educandos?: string[];
}

const MOCK_USERS: Record<string, MockUser> = {
  "admin@entartes.pt": {
    id: "1",
    nome: "Ana Ferreira",
    email: "admin@entartes.pt",
    tipo: "direcao",
  },
  "professor@entartes.pt": {
    id: "2",
    nome: "Pedro Santos",
    email: "professor@entartes.pt",
    tipo: "professor",
  },
  "carla@email.com": {
    id: "3",
    nome: "Carla Gomes",
    email: "carla@email.com",
    tipo: "encarregado",
    educandos: ["Rita Gomes", "Miguel Gomes"],
  },
};

interface AuthContextType {
  user: MockUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<MockUser | null>(null);

  const login = (email: string, _password: string): boolean => {
    const found = MOCK_USERS[email.toLowerCase()];
    if (found) {
      setUser(found);
      return true;
    }
    return false;
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
