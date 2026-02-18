import React from 'react';
import { Toaster } from 'react-hot-toast';
import UsersPage from './pages/UsersPage';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      <UsersPage />
    </div>
  );
}

export default App;