// src/context/AuthContext.jsx

import { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser, logoutUser, getCurrentUser } from '../services/authApi';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const stored = localStorage.getItem('user');
        if (stored) {
          const res = await getCurrentUser();
          setUser(res.data.user);
        }
      } catch {
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (email, password) => {
    const res = await loginUser({ email, password });
    const { user: u, accessToken } = res.data;
    setUser(u);
    localStorage.setItem('user', JSON.stringify(u));
    localStorage.setItem('accessToken', accessToken);
    return res;
  };

  const register = async (name, email, password, confirmPassword) => {
    const res = await registerUser({ name, email, password, confirmPassword });
    const { user: u, accessToken } = res.data;
    setUser(u);
    localStorage.setItem('user', JSON.stringify(u));
    localStorage.setItem('accessToken', accessToken);
    return res;
  };

  const logout = async () => {
    try { await logoutUser(); } catch { /* ignore */ }
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};