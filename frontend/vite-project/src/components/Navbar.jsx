// src/components/Navbar.jsx

import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/login');
  };

  if (!isAuthenticated) return null;

  return (
    <nav className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-14">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold text-gray-900">
          <Mail className="w-6 h-6 text-blue-600" />
          Mail App
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            Hello, <span className="font-semibold text-gray-900">{user?.name}</span>
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;