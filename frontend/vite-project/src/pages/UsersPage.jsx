import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';                                        // ✅ ADD
import { toast } from 'react-hot-toast';
import { Users, UserPlus, RefreshCw, Trash2, FileSpreadsheet, Download } from 'lucide-react'; // ✅ ADD Download
import { userAPI } from '../services/api';
import UserForm from '../components/UserForm';
import UserTable from '../components/UserTable';
import FilterPanel from '../components/FilterPanel';
import Pagination from '../components/Pagination';
import BulkImportModal from '../components/BulkImportModal';
import ExportModal from '../components/ExportModal';                 // ✅ ADD
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import Modal from '../components/Modal';

const DEFAULT_LIMIT   = 5;
const DEFAULT_FILTERS = { search: '', startDate: '', endDate: '', sortOrder: 'desc' };

const UsersPage = () => {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(false);

  // ── Filters ──────────────────────────────────────────────────────────────
  const [filters, setFilters]               = useState(DEFAULT_FILTERS);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // ── Pagination ────────────────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit]             = useState(DEFAULT_LIMIT);
  const [pagination, setPagination]   = useState({
    total: 0, totalPages: 1, hasNextPage: false, hasPrevPage: false,
  });

  // ── Modals ────────────────────────────────────────────────────────────────
  const [isCreateModalOpen,    setIsCreateModalOpen]    = useState(false);
  const [isEditModalOpen,      setIsEditModalOpen]      = useState(false);
  const [isDeleteModalOpen,    setIsDeleteModalOpen]    = useState(false);
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [isBulkImportOpen,     setIsBulkImportOpen]     = useState(false);
  const [isExportModalOpen,    setIsExportModalOpen]    = useState(false); // ✅ ADD
  const [selectedUser, setSelectedUser] = useState(null);

  // ── Debounce name search (500ms) ──────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [filters.search]);

  // ── Fetch when any filter / page / limit changes ──────────────────────────
  useEffect(() => {
    fetchUsers();
  }, [currentPage, limit, debouncedSearch, filters.startDate, filters.endDate, filters.sortOrder]);

  // ── Core fetch ────────────────────────────────────────────────────────────
  const fetchUsers = async (overrides = {}) => {
    const req = {
      page:      overrides.page      ?? currentPage,
      lim:       overrides.lim       ?? limit,
      search:    overrides.search    ?? debouncedSearch,
      startDate: overrides.startDate ?? filters.startDate,
      endDate:   overrides.endDate   ?? filters.endDate,
      sortOrder: overrides.sortOrder ?? filters.sortOrder,
    };
    setLoading(true);
    try {
      const response = await userAPI.getAllUsers({
        page:      req.page,
        limit:     req.lim,
        search:    req.search,
        startDate: req.startDate,
        endDate:   req.endDate,
        sortOrder: req.sortOrder,
      });
      setUsers(response.data ?? []);
      setPagination(response.pagination ?? {
        total: 0, totalPages: 1, hasNextPage: false, hasPrevPage: false,
      });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  // ── Filter helpers ────────────────────────────────────────────────────────
  const handleFiltersChange = (newFilters) => {
    if (
      newFilters.startDate !== filters.startDate ||
      newFilters.endDate   !== filters.endDate   ||
      newFilters.sortOrder !== filters.sortOrder
    ) setCurrentPage(1);
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setDebouncedSearch('');
    setCurrentPage(1);
  };

  const activeFilterCount = [
    filters.search    !== '',
    filters.startDate !== '',
    filters.endDate   !== '',
    filters.sortOrder !== 'desc',
  ].filter(Boolean).length;

  // ── CRUD ──────────────────────────────────────────────────────────────────
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

  const handleDeleteUser = async () => {
    try {
      const response = await userAPI.deleteUser(selectedUser.id);
      toast.success(response.message || 'User deleted successfully');
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
      if (users.length === 1 && currentPage > 1) {
        setCurrentPage((p) => p - 1);
      } else {
        fetchUsers();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete user');
    }
  };

  const handleDeleteAllUsers = async () => {
    try {
      const response = await userAPI.deleteAllUsers();
      toast.success(response.message || 'All users deleted successfully');
      setIsDeleteAllModalOpen(false);
      setFilters(DEFAULT_FILTERS);
      setDebouncedSearch('');
      setCurrentPage(1);
      fetchUsers({ page: 1, search: '', startDate: '', endDate: '', sortOrder: 'desc' });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete all users');
    }
  };

  // ── Bulk import ───────────────────────────────────────────────────────────
  const handleBulkImport = async (usersData) => {
    const response = await userAPI.bulkCreateUsers(usersData);
    toast.success(response.message || 'Import complete');
    fetchUsers();
    return response.data;
  };

  // ── Export ────────────────────────────────────────────────────────────────
  const handleExport = async ({ scope, format, columns, fileName }) => {
    try {
      let exportData;

      if (scope === 'current') {
        // Use already-loaded page data
        exportData = users;
      } else {
        // Fetch ALL users matching current filters — no pagination
        const response = await userAPI.exportUsers({
          search:    debouncedSearch,
          startDate: filters.startDate,
          endDate:   filters.endDate,
          sortOrder: filters.sortOrder,
        });
        exportData = response.data ?? [];
      }

      if (exportData.length === 0) {
        toast.error('No data to export');
        return;
      }

      // Map each column key → readable header + value
      const COLUMN_MAP = {
        id:        (u) => ({ 'ID':           u.id }),
        name:      (u) => ({ 'Name':         u.name }),
        email:     (u) => ({ 'Email':        u.email }),
        createdAt: (u) => ({ 'Created Date': new Date(u.createdAt).toLocaleString() }),
        updatedAt: (u) => ({ 'Updated Date': new Date(u.updatedAt).toLocaleString() }),
      };

      // Build rows with only selected columns, preserving column order
      const rows = exportData.map((user) =>
        columns.reduce((row, col) => {
          if (COLUMN_MAP[col]) Object.assign(row, COLUMN_MAP[col](user));
          return row;
        }, {})
      );

      // Create worksheet with auto column widths
      const ws = XLSX.utils.json_to_sheet(rows);
      const headers = Object.keys(rows[0] ?? {});
      ws['!cols'] = headers.map((h) => ({
        wch: Math.max(h.length, ...rows.map((r) => String(r[h] ?? '').length)) + 2,
      }));

      // Write file
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Users');
      XLSX.writeFile(wb, `${fileName}.${format}`, {
        bookType: format === 'csv' ? 'csv' : 'xlsx',
      });

      toast.success(
        `Exported ${exportData.length} user${exportData.length !== 1 ? 's' : ''} as .${format}`
      );
    } catch (error) {
      toast.error('Export failed. Please try again.');
      console.error('Export error:', error);
    }
  };

  // ── UI helpers ────────────────────────────────────────────────────────────
  const handleEditClick   = (user) => { setSelectedUser(user); setIsEditModalOpen(true); };
  const handleDeleteClick = (user) => { setSelectedUser(user); setIsDeleteModalOpen(true); };
  const handleRefresh     = () => { fetchUsers(); toast.success('Refreshed successfully'); };

  // ────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Header ── */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">User Management System</h1>
            </div>
            <div className="flex gap-3">
              {/* Export */}
              <button
                onClick={() => setIsExportModalOpen(true)}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                <Download className="w-5 h-5 mr-2" />
                Export
              </button>
              {/* Import */}
              <button
                onClick={() => setIsBulkImportOpen(true)}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                <FileSpreadsheet className="w-5 h-5 mr-2" />
                Import
              </button>
              {/* Add */}
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

      {/* ── Main ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Stats & Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Total Users:{' '}
                <span className="text-blue-600">{pagination?.total ?? 0}</span>
              </h2>
              {activeFilterCount > 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  Showing filtered results —{' '}
                  <span className="font-medium text-gray-700">
                    {pagination?.total ?? 0} match{(pagination?.total ?? 0) !== 1 ? 'es' : ''}
                  </span>
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleRefresh}
                className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                <RefreshCw className="w-5 h-5 mr-2" /> Refresh
              </button>
              <button
                onClick={() => setIsDeleteAllModalOpen(true)}
                disabled={pagination?.total === 0}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-5 h-5 mr-2" /> Delete All
              </button>
            </div>
          </div>
        </div>

        {/* Filter Panel */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <FilterPanel
            filters={filters}
            onChange={handleFiltersChange}
            onClear={handleClearFilters}
            activeFilterCount={activeFilterCount}
          />
        </div>

        {/* Table + Pagination */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <UserTable
            users={users}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
            loading={loading}
          />
          <Pagination
            currentPage={currentPage}
            totalPages={pagination?.totalPages ?? 1}
            onPageChange={setCurrentPage}
            totalUsers={pagination?.total ?? 0}
            limit={limit}
            onLimitChange={setLimit}
          />
        </div>
      </main>

      {/* ── Modals ── */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create New User">
        <UserForm onSubmit={handleCreateUser} />
      </Modal>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setSelectedUser(null); }}
        title="Edit User"
      >
        <UserForm
          onSubmit={handleUpdateUser}
          initialData={selectedUser}
          onCancel={() => { setIsEditModalOpen(false); setSelectedUser(null); }}
          isEdit={true}
        />
      </Modal>

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setSelectedUser(null); }}
        onConfirm={handleDeleteUser}
        user={selectedUser}
      />

      <DeleteConfirmModal
        isOpen={isDeleteAllModalOpen}
        onClose={() => setIsDeleteAllModalOpen(false)}
        onConfirm={handleDeleteAllUsers}
        isDeleteAll={true}
      />

      <BulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        onImport={handleBulkImport}
      />

      {/* ✅ Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleExport}
        currentPageCount={users.length}
        totalCount={pagination?.total ?? 0}
        hasActiveFilters={activeFilterCount > 0}
      />
    </>
  );
};

export default UsersPage;