import React from 'react';

const ActiveBookings = ({ activeBookings }) => {
  return (
    <section className="bg-gray-800 p-6 rounded-md shadow-lg">
      <h3 className="text-xl font-semibold text-gray-100 mb-4">
        Active Bookings
      </h3>
      <div className="space-y-2">
        {activeBookings.length === 0 ? (
          <p className="text-gray-400">No active bookings.</p>
        ) : (
          activeBookings.map((booking) => (
            <div
              key={booking.id}
              className="p-3 bg-gray-700 rounded-md flex items-center"
            >
              <span className="flex-grow text-gray-200">
                {booking.carModel} ({booking.carNumberPlate || "N/A"}) -{" "}
                {booking.salespersonName}
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  );
};

export default ActiveBookings; 