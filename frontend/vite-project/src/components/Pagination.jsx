import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50];

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  totalUsers,
  limit,
  onLimitChange, // ✅ new prop
}) => {
  const startItem = totalUsers === 0 ? 0 : (currentPage - 1) * limit + 1;
  const endItem   = Math.min(currentPage * limit, totalUsers);

  // Smart page numbers with ellipsis
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end   = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t pt-4">

      {/* ── Left: Rows per page selector ── */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span>Rows per page:</span>
        <select
          value={limit}
          onChange={(e) => {
            onLimitChange(Number(e.target.value));
            onPageChange(1); // reset to page 1 when limit changes
          }}
          className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none
                     bg-white cursor-pointer"
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
        <span className="text-gray-400">|</span>
        <span>
          {totalUsers === 0
            ? 'No results'
            : `${startItem}–${endItem} of ${totalUsers}`}
        </span>
      </div>

      {/* ── Right: Page navigation ── */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1">

          {/* First page */}
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            title="First page"
            className="p-2 rounded-lg border border-gray-300 disabled:opacity-40
                       disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>

          {/* Prev page */}
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            title="Previous page"
            className="flex items-center px-3 py-2 text-sm rounded-lg border border-gray-300
                       disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Prev
          </button>

          {/* Page numbers */}
          {getPageNumbers().map((page, index) =>
            page === '...' ? (
              <span key={`ellipsis-${index}`} className="px-2 text-gray-400 select-none">
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`w-9 h-9 text-sm rounded-lg border transition-colors ${
                  currentPage === page
                    ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                    : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                }`}
              >
                {page}
              </button>
            )
          )}

          {/* Next page */}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            title="Next page"
            className="flex items-center px-3 py-2 text-sm rounded-lg border border-gray-300
                       disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          >
            Next <ChevronRight className="w-4 h-4 ml-1" />
          </button>

          {/* Last page */}
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            title="Last page"
            className="p-2 rounded-lg border border-gray-300 disabled:opacity-40
                       disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default Pagination;