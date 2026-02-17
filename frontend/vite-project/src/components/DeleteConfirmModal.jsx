import React from 'react';
import { AlertTriangle } from 'lucide-react';

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, user, isDeleteAll = false }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center mb-4">
          <AlertTriangle className="w-6 h-6 text-red-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">
            {isDeleteAll ? 'Delete All Users' : 'Delete User'}
          </h3>
        </div>
        
        <p className="text-gray-600 mb-6">
          {isDeleteAll ? (
            'Are you sure you want to delete all users? This action cannot be undone.'
          ) : (
            <>
              Are you sure you want to delete <strong>{user?.name}</strong>? This action cannot be undone.
            </>
          )}
        </p>
        
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Delete
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;