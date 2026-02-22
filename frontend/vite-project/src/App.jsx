// src/App.jsx

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import UsersPage from './pages/UsersPage';

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? <Navigate to="/" replace /> : children;
};

const AppContent = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Toaster position="top-right" />
        <Navbar />
        <Routes>
          <Route
            path="/login"
            element={
              <PublicRoute><LoginPage /></PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute><RegisterPage /></PublicRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <PublicRoute><ForgotPasswordPage /></PublicRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute><UsersPage /></ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;