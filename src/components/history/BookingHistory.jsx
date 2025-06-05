import React, { useCallback, useState } from 'react';
import { useFirebaseData } from '../../hooks/useFirebaseData';
import { useToast } from '../../hooks/useToast';
import ConfirmationDialog from '../common/ConfirmationDialog';
import { clearBookings } from '../../utils/firebaseUtils';
import Papa from 'papaparse';

function BookingHistory({ setView }) {
  const { completedBookings } = useFirebaseData();
  const { addToast } = useToast();
  const [confirmation, setConfirmation] = useState(null);

  const handleExportCSV = useCallback(() => {
    const data = completedBookings.map((b) => ({
      'Car Model': b.carModel,
      'Car Number Plate': b.carNumberPlate || 'N/A',
      'Salesperson Name': b.salespersonName,
      'Client Name': '',
      'Client Number': '',
      'Client Email': '',
    }));
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'event_bookings.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Exported bookings as CSV', 'success');
  }, [completedBookings, addToast]);

  const handleClearHistory = useCallback(() => {
    setConfirmation({
      message: 'Are you sure you want to clear all booking history?',
      onConfirm: async () => {
        try {
          await clearBookings();
          addToast('Booking history cleared', 'success');
        } catch (error) {
          addToast('Failed to clear history', 'error');
        } finally {
          setConfirmation(null);
        }
      },
      onCancel: () => setConfirmation(null),
    });
  }, [addToast]);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="card">
        <h2 className="text-2xl font-bold text-gray-100 mb-6">Booking History</h2>
        <div className="mb-6 flex justify-end space-x-2">
          <button
            onClick={handleExportCSV}
            className="btn-primary"
            aria-label="Export bookings as CSV"
          >
            Export CSV
          </button>
          <button
            onClick={handleClearHistory}
            disabled={completedBookings.length === 0}
            className="btn-danger disabled:bg-gray-600"
            aria-label="Clear booking history"
          >
            Clear History
          </button>
        </div>
        {completedBookings.length === 0 ? (
          <p className="text-gray-400">No completed bookings.</p>
        ) : (
          <div className="space-y-3">
            {completedBookings
              .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
              .map((b) => (
                <div key={b.id} className="card bg-gray-700">
                  <div className="text-gray-200 font-medium">
                    {b.carModel} ({b.carNumberPlate || 'N/A'}) - {b.salespersonName}
                  </div>
                  <div className="text-sm text-gray-400 mt-1">
                    Started: {new Date(b.timestamp).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-400 mt-1">
                    Completed: {new Date(b.completedAt).toLocaleString()}
                  </div>
                </div>
              ))}
          </div>
        )}
        <button
          onClick={() => setView('dashboard')}
          className="mt-4 text-blue-400 hover:text-blue-300"
          aria-label="Back to dashboard"
        >
          Back to Dashboard
        </button>
      </div>
      {confirmation && (
        <ConfirmationDialog
          message={confirmation.message}
          onConfirm={confirmation.onConfirm}
          onCancel={confirmation.onCancel}
        />
      )}
    </div>
  );
}

export default BookingHistory;