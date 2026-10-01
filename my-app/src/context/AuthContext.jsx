import { createContext, useContext, useEffect, useState } from 'react';
import {
  clearAuth,
  getCurrentUser,
  getStoredUser,
  getToken,
  loginUser,
  registerUser,
  setStoredUser,
  setToken,
} from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser());
  const [token, setTokenState] = useState(getToken());
  const [loading, setLoading] = useState(true);

  // Sync / verify user session on mount
  useEffect(() => {
    async function verifyUser() {
      const activeToken = getToken();
      if (activeToken) {
        try {
          const res = await getCurrentUser();
          if (res.success && res.user) {
            setUser(res.user);
            setStoredUser(res.user);
          }
        } catch (err) {
          console.warn('Session verification failed, logging out:', err.message);
          clearAuth();
          setUser(null);
          setTokenState(null);
        }
      }
      setLoading(false);
    }

    verifyUser();
  }, []);

  async function login(email, password) {
    const res = await loginUser(email, password);
    if (res.success && res.user) {
      setUser(res.user);
      setTokenState(res.token);
    }
    return res;
  }

  async function register(name, email, password, role = 'USER') {
    const res = await registerUser(name, email, password, role);
    if (res.success && res.user) {
      setUser(res.user);
      setTokenState(res.token);
    }
    return res;
  }

  function logout() {
    clearAuth();
    setUser(null);
    setTokenState(null);
  }

  async function refreshUser() {
    try {
      const res = await getCurrentUser();
      if (res.success && res.user) {
        setUser(res.user);
        setStoredUser(res.user);
      }
    } catch {
      // ignore
    }
  }

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user && !!token,
    isAdmin: user?.role === 'ADMIN',
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
