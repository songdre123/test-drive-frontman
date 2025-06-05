import React from 'react';

function ConfirmationDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="card max-w-sm w-full">
        <p className="text-gray-100 mb-4">{message}</p>
        <div className="flex justify-end space-x-2">
          <button
            onClick={onCancel}
            className="btn-secondary"
            aria-label="Cancel"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="btn-danger"
            aria-label="Confirm"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmationDialog;