import React, { useState } from 'react';
import {
  X, Download, FileSpreadsheet,
  FileText, CheckSquare, Square,
} from 'lucide-react';

// ── Constants ──────────────────────────────────────────────────────────────
const COLUMN_OPTIONS = [
  { key: 'id',        label: 'ID',           defaultChecked: false },
  { key: 'name',      label: 'Name',         defaultChecked: true  },
  { key: 'email',     label: 'Email',        defaultChecked: true  },
  { key: 'createdAt', label: 'Created Date', defaultChecked: true  },
  { key: 'updatedAt', label: 'Updated Date', defaultChecked: false },
];

const getDefaultFileName = () => {
  const now  = new Date();
  const yyyy = now.getFullYear();
  const mm   = String(now.getMonth() + 1).padStart(2, '0');
  const dd   = String(now.getDate()).padStart(2, '0');
  return `users_export_${yyyy}${mm}${dd}`;
};

// ── Component ──────────────────────────────────────────────────────────────
const ExportModal = ({
  isOpen,
  onClose,
  onExport,
  currentPageCount,
  totalCount,
  hasActiveFilters,
}) => {
  const [scope,    setScope]    = useState('all');
  const [format,   setFormat]   = useState('xlsx');
  const [columns,  setColumns]  = useState(
    COLUMN_OPTIONS.filter((c) => c.defaultChecked).map((c) => c.key)
  );
  const [fileName, setFileName] = useState(getDefaultFileName);
  const [loading,  setLoading]  = useState(false);

  const exportCount  = scope === 'current' ? currentPageCount : totalCount;
  const canExport    = columns.length > 0 && exportCount > 0 && !loading;

  const toggleColumn = (key) =>
    setColumns((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );

  const handleExport = async () => {
    if (!canExport) return;
    setLoading(true);
    try {
      await onExport({
        scope,
        format,
        columns,
        fileName: fileName.trim() || getDefaultFileName(),
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh]">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-5 border-b shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-green-100 rounded-xl">
              <Download className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Export Users</h2>
              <p className="text-sm text-gray-500">Download as Excel or CSV</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* ── Section 1: Export Scope ── */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">Export Scope</p>
            <div className="space-y-2">

              {/* Current page */}
              <label className={`flex items-center justify-between p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                scope === 'current'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <div className="flex items-center gap-3">
                  <input
                    type="radio" name="scope" value="current"
                    checked={scope === 'current'}
                    onChange={() => setScope('current')}
                    className="accent-blue-600"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-800">Current page only</p>
                    <p className="text-xs text-gray-500">Export only what's visible now</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-blue-600 bg-blue-100 px-2.5 py-1 rounded-lg shrink-0 ml-3">
                  {currentPageCount}
                </span>
              </label>

              {/* All / filtered */}
              <label className={`flex items-center justify-between p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                scope === 'all'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <div className="flex items-center gap-3">
                  <input
                    type="radio" name="scope" value="all"
                    checked={scope === 'all'}
                    onChange={() => setScope('all')}
                    className="accent-blue-600"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {hasActiveFilters ? 'All matching filters' : 'All users'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {hasActiveFilters
                        ? 'Export all users matching active filters'
                        : 'Export the entire user database'}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-bold text-blue-600 bg-blue-100 px-2.5 py-1 rounded-lg shrink-0 ml-3">
                  {totalCount}
                </span>
              </label>
            </div>
          </div>

          {/* ── Section 2: File Format ── */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">File Format</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'xlsx', label: 'Excel', ext: '.xlsx', Icon: FileSpreadsheet },
                { value: 'csv',  label: 'CSV',   ext: '.csv',  Icon: FileText        },
              ].map(({ value, label, ext, Icon }) => (
                <button
                  key={value}
                  onClick={() => setFormat(value)}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all ${
                    format === value
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Icon className={`w-6 h-6 ${format === value ? 'text-green-600' : 'text-gray-400'}`} />
                  <div className="text-left">
                    <p className={`text-sm font-semibold ${format === value ? 'text-green-700' : 'text-gray-700'}`}>
                      {label}
                    </p>
                    <p className="text-xs text-gray-500 font-mono">{ext}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ── Section 3: Columns ── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-700">Columns to Include</p>
              <div className="flex gap-2 text-xs">
                <button
                  onClick={() => setColumns(COLUMN_OPTIONS.map((c) => c.key))}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Select All
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={() => setColumns([])}
                  className="text-gray-500 hover:text-gray-700 font-medium"
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {COLUMN_OPTIONS.map((col) => {
                const checked = columns.includes(col.key);
                return (
                  <button
                    key={col.key}
                    onClick={() => toggleColumn(col.key)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 text-left transition-all ${
                      checked
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    {checked
                      ? <CheckSquare className="w-4 h-4 shrink-0 text-blue-500" />
                      : <Square      className="w-4 h-4 shrink-0 text-gray-300" />
                    }
                    <span className="text-sm font-medium">{col.label}</span>
                  </button>
                );
              })}
            </div>
            {columns.length === 0 && (
              <p className="text-xs text-red-500 mt-2">⚠ Select at least one column.</p>
            )}
          </div>

          {/* ── Section 4: File Name ── */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">File Name</p>
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="Enter file name"
                className="flex-1 px-3 py-2 text-sm outline-none"
              />
              <span className="px-3 py-2 bg-gray-100 border-l border-gray-300 text-sm text-gray-500 font-mono shrink-0">
                .{format}
              </span>
            </div>
          </div>

          {/* ── Export Preview ── */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Export Preview</p>
            <p className="text-sm text-gray-700">
              <span className="font-semibold text-gray-900">{exportCount}</span> user{exportCount !== 1 ? 's' : ''} ·{' '}
              <span className="font-semibold text-gray-900">{columns.length}</span> column{columns.length !== 1 ? 's' : ''} ·{' '}
              <span className="font-semibold text-gray-900">.{format}</span>
            </p>
            <p className="text-xs text-gray-500 mt-1 font-mono truncate">
              📄 {fileName.trim() || getDefaultFileName()}.{format}
            </p>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-2xl shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={!canExport}
            className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg
                       hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed
                       font-medium transition-colors text-sm"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Export {exportCount} User{exportCount !== 1 ? 's' : ''}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;