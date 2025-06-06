import React from 'react';

const History = ({ completedBookings, onClearHistory, onBack }) => {
  return (
    <div className="max-w-4xl mx-auto bg-gray-800 p-6 rounded-md shadow-lg">
      <h2 className="text-2xl font-bold text-gray-100 mb-6">Booking History</h2>
      <div className="mb-4 flex justify-end">
        <button
          onClick={onClearHistory}
          disabled={completedBookings.length === 0}
          className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
          aria-label="Clear booking history"
        >
          Clear History
        </button>
      </div>
      {completedBookings.length === 0 ? (
        <p className="text-gray-400">No completed bookings.</p>
      ) : (
        <div className="space-y-2">
          {completedBookings
            .sort((a, b) => b.completedAt - a.completedAt)
            .map((b) => (
              <div
                key={b.id}
                className="p-3 bg-gray-700 rounded-md flex items-center"
              >
                <div className="flex-grow text-gray-200">
                  <div>
                    {b.carModel} ({b.carNumberPlate || "N/A"}) -{" "}
                    {b.salespersonName}
                  </div>
                  <div className="text-sm text-gray-400">
                    Started: {new Date(b.timestamp).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-400">
                    Completed: {new Date(b.completedAt).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
      <button
        onClick={onBack}
        className="mt-4 text-blue-400 hover:text-blue-300 font-semibold"
        aria-label="Back to dashboard"
      >
        Back to Dashboard
      </button>
    </div>
  );
};

export default History; 