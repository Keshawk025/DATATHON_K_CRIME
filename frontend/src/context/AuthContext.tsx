import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

interface User {
  id: string;
  username: string;
  role: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: any) => Promise<void>;
  logout: () => void;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // On mount only: if a token already exists in localStorage (returning session),
  // validate it and restore the user. This does NOT run after login() because
  // login() sets the user inline before returning.
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      setIsLoading(false);
      return;
    }
    const fetchUser = async () => {
      try {
        // GET /auth/me returns the user object directly (no wrapper):
        // { id, name, email, role }
        const res = await authService.getMe();
        if (res && res.id) {
          // Map backend 'name' → User interface 'username'
          setUser({ ...res, username: res.name });
        } else {
          // Token is invalid/expired — clear it
          localStorage.removeItem('token');
          setToken(null);
        }
      } catch (err) {
        console.error('Session restore failed', err);
        localStorage.removeItem('token');
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount only

  const login = async (credentials: any) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authService.login(credentials);
      if (res.access_token) {
        // 1. Persist token immediately so interceptor picks it up
        localStorage.setItem('token', res.access_token);
        setToken(res.access_token);

        // 2. Fetch user profile inline — don't wait for the useEffect.
        //    This guarantees isAuthenticated === true before login() returns
        //    and before the caller fires navigate('/dashboard').
        // GET /auth/me returns the user object directly (no wrapper):
        // { id, name, email, role }
        const meRes = await authService.getMe();
        if (meRes && meRes.id) {
          // Map backend 'name' → User interface 'username'
          setUser({ ...meRes, username: meRes.name });
        } else {
          throw new Error('Failed to load user profile after login');
        }
      } else {
        throw new Error('No access token returned');
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || 'Login failed';
      setError(errMsg);
      // Clear the partially-stored token on failure
      localStorage.removeItem('token');
      setToken(null);
      throw err;
    } finally {
      // Always clear the loading state — success or failure
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
