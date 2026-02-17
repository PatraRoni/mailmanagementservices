import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { Users, UserPlus, RefreshCw, Trash2 } from 'lucide-react';
import { userAPI } from './services/api';
import UserForm from './components/UserForm';
import UserTable from './components/UserTable';
import SearchBar from './components/SearchBar';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import Modal from './components/Modal';

function App() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchActive, setSearchActive] = useState(false);

  // Fetch all users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await userAPI.getAllUsers();
      setUsers(response.data);
      setFilteredUsers(response.data);
      setSearchActive(false);
      toast.success(response.message || 'Users loaded successfully');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Create user
  const handleCreateUser = async (userData) => {
    try {
      const response = await userAPI.createUser(userData);
      toast.success(response.message || 'User created successfully');
      setIsCreateModalOpen(false);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create user');
    }
  };

  // Update user
  const handleUpdateUser = async (userData) => {
    try {
      const response = await userAPI.updateUser(selectedUser.id, userData);
      toast.success(response.message || 'User updated successfully');
      setIsEditModalOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update user');
    }
  };

  // Delete user
  const handleDeleteUser = async () => {
    try {
      const response = await userAPI.deleteUser(selectedUser.id);
      toast.success(response.message || 'User deleted successfully');
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete user');
    }
  };

  // Delete all users
  const handleDeleteAllUsers = async () => {
    try {
      const response = await userAPI.deleteAllUsers();
      toast.success(response.message || 'All users deleted successfully');
      setIsDeleteAllModalOpen(false);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete all users');
    }
  };

  // Search by email
  const handleSearch = async (email) => {
    if (!email.trim()) {
      setFilteredUsers(users);
      setSearchActive(false);
      return;
    }

    try {
      const response = await userAPI.getUserByEmail(email);
      setFilteredUsers([response.data]);
      setSearchActive(true);
      toast.success('User found');
    } catch (error) {
      if (error.response?.status === 404) {
        setFilteredUsers([]);
        toast.error('User not found');
      } else {
        toast.error(error.response?.data?.error || 'Search failed');
      }
      setSearchActive(true);
    }
  };

  // Open edit modal
  const handleEditClick = (user) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  // Open delete modal
  const handleDeleteClick = (user) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  // Clear search
  const handleClearSearch = () => {
    setFilteredUsers(users);
    setSearchActive(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">User Management System</h1>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <UserPlus className="w-5 h-5 mr-2" />
                Add User
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats and Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Total Users: <span className="text-blue-600">{users.length}</span>
              </h2>
              {searchActive && (
                <p className="text-sm text-gray-500 mt-1">
                  Showing {filteredUsers.length} search result(s)
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={fetchUsers}
                className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                Refresh
              </button>
              {searchActive && (
                <button
                  onClick={handleClearSearch}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Clear Search
                </button>
              )}
              <button
                onClick={() => setIsDeleteAllModalOpen(true)}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                disabled={users.length === 0}
              >
                <Trash2 className="w-5 h-5 mr-2" />
                Delete All
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <SearchBar onSearch={handleSearch} />
        </div>

        {/* User Table */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <UserTable
            users={filteredUsers}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
            loading={loading}
          />
        </div>
      </main>

      {/* Create User Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New User"
      >
        <UserForm onSubmit={handleCreateUser} />
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedUser(null);
        }}
        title="Edit User"
      >
        <UserForm
          onSubmit={handleUpdateUser}
          initialData={selectedUser}
          onCancel={() => {
            setIsEditModalOpen(false);
            setSelectedUser(null);
          }}
          isEdit={true}
        />
      </Modal>

      {/* Delete User Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedUser(null);
        }}
        onConfirm={handleDeleteUser}
        user={selectedUser}
      />

      {/* Delete All Users Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteAllModalOpen}
        onClose={() => setIsDeleteAllModalOpen(false)}
        onConfirm={handleDeleteAllUsers}
        isDeleteAll={true}
      />
    </div>
  );
}

export default App;