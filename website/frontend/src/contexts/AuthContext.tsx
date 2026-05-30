import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

export type UserRole = "direcao" | "professor" | "encarregado";

export interface User {
    id: number;
    nome: string;
    email: string;
    tipo: UserRole;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (credentials: any) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
    updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(() => {
        const saved = localStorage.getItem('user');
        return saved ? JSON.parse(saved) : null;
    });
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

    const login = async (credentials: any) => {
        const response = await api.post('/auth/login', credentials);
        const { token, tipo, nome, id } = response.data;
        
        // Convert integer role to string role if necessary
        const roleMap: Record<number, UserRole> = {
            0: 'direcao',
            1: 'professor',
            2: 'encarregado'
        };
        const tipoString = typeof tipo === 'number' ? roleMap[tipo] : tipo.toLowerCase();

        const userData = { id, nome, tipo: tipoString as UserRole, email: credentials.email };
        
        setToken(token);
        setUser(userData);
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    };

    const updateUser = (userData: Partial<User>) => {
        if (user) {
            const newUser = { ...user, ...userData };
            setUser(newUser);
            localStorage.setItem('user', JSON.stringify(newUser));
        }
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
