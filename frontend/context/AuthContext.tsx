import React, { createContext, useState, useEffect, useContext } from 'react';
import { storage } from '../services/storage';
interface AuthContextData {
  user: any | null;
  token: string | null;
  isInitializing: boolean;
  login: (token: string, user: any) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const loadStorageData = async () => {
      try {
        const storedToken = await storage.getItem('userToken');
        const storedUser = await storage.getItem('userData');
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Unable to restore the saved authentication session:', error);
      } finally {
        setIsInitializing(false);
      }
    };
    void loadStorageData();
  }, []);

  const login = async (newToken: string, newUser: any) => {
    await storage.setItem('userToken', newToken);
    await storage.setItem('userData', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = async () => {
    await storage.removeItem('userToken');
    await storage.removeItem('userData');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isInitializing, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);