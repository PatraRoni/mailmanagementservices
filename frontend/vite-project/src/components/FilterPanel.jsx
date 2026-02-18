import React from 'react';
import { Search, X, Calendar, ArrowUpDown, SlidersHorizontal } from 'lucide-react';

const FilterPanel = ({ filters, onChange, onClear, activeFilterCount }) => {
  const handleChange = (field, value) => onChange({ ...filters, [field]: value });

  return (
    <div className="space-y-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-semibold text-gray-700">Filters</span>
          {activeFilterCount > 0 && (
            <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full">
              {activeFilterCount} active
            </span>
          )}
        </div>
        {activeFilterCount > 0 && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700 font-medium transition-colors"
          >
            <X className="w-3.5 h-3.5" /> Clear All
          </button>
        )}
      </div>

      {/* ── Filter Inputs ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Name Search */}
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
            Search by Name
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleChange('search', e.target.value)}
              placeholder="Type a name..."
              className="w-full pl-9 pr-8 py-2 text-sm border border-gray-300 rounded-lg
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            />
            {filters.search && (
              <button
                onClick={() => handleChange('search', '')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* From Date */}
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
            From Date
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleChange('startDate', e.target.value)}
              max={filters.endDate || undefined}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            />
          </div>
        </div>

        {/* To Date */}
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
            To Date
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleChange('endDate', e.target.value)}
              min={filters.startDate || undefined}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            />
          </div>
        </div>

        {/* Sort Order */}
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
            Sort by Date
          </label>
          <div className="relative">
            <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <select
              value={filters.sortOrder}
              onChange={(e) => handleChange('sortOrder', e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none
                         bg-white cursor-pointer transition appearance-none"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Active Filter Badges ── */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {filters.search && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200">
              Name: "{filters.search}"
              <button onClick={() => handleChange('search', '')} className="hover:text-blue-900">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.startDate && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-200">
              From: {filters.startDate}
              <button onClick={() => handleChange('startDate', '')} className="hover:text-green-900">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.endDate && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-200">
              To: {filters.endDate}
              <button onClick={() => handleChange('endDate', '')} className="hover:text-green-900">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.sortOrder === 'asc' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded-full border border-purple-200">
              Sort: Oldest First
              <button onClick={() => handleChange('sortOrder', 'desc')} className="hover:text-purple-900">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterPanel;