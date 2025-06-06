import React from 'react';

const CarsSection = React.memo(({
  headerStyle, cars, carOrder, activeBookings, walkins, handleToggleCarAvailability,
  handleReturnCar, handleMoveCarOrder, handleProcessQueue, handleRemoveFromQueue, salespeople
}) => (
  <div className="bg-gray-800 rounded-lg p-4">
    <h2 className={headerStyle}>Cars</h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {carOrder.map((carId) => {
        const car = cars.find((c) => c.id === carId);
        if (!car) return null;
        
        // Find active booking or walk-in
        const booking = activeBookings.find((b) => b.carId === car.id && b.status === 'active');
        const walkin = walkins.find((w) => w.carId === car.id && !w.testDriveCompleted);
        
        // Determine if car is actually in use
        const isInUse = !car.available && (booking || walkin);
        
        return (
          <div
            key={car.id}
            className="bg-gray-700 rounded-lg p-4 flex flex-col"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-lg font-semibold text-gray-100">{car.model}</h3>
                {car.numberPlate && (
                  <p className="text-sm text-gray-300">{car.numberPlate}</p>
                )}
              </div>
              <div className="flex flex-col space-y-2">
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleToggleCarAvailability(car.id)}
                    className={`px-2 py-1 rounded ${
                      car.available
                        ? 'bg-green-500 hover:bg-green-600'
                        : 'bg-red-500 hover:bg-red-600'
                    } text-white text-sm`}
                  >
                    {car.available ? 'Available' : 'Unavailable'}
                  </button>
                  {isInUse && (
                    <button
                      onClick={() => handleReturnCar(car.id)}
                      className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm"
                    >
                      Return
                    </button>
                  )}
                </div>
                {car.queue?.length > 0 && (
                  <button
                    onClick={() => handleProcessQueue(car.id)}
                    className="w-full px-2 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-sm"
                  >
                    Process Queue ({car.queue.length})
                  </button>
                )}
              </div>
            </div>
            {booking && (
              <div className="mt-2 p-2 bg-gray-600 rounded">
                <p className="text-sm text-gray-200">
                  Booked by: {booking.salespersonName}
                </p>
                <p className="text-xs text-gray-400">
                  Time: {new Date(booking.timestamp).toLocaleTimeString()}
                </p>
              </div>
            )}
            {walkin && (
              <div className="mt-2 p-2 bg-gray-600 rounded">
                <p className="text-sm text-gray-200">
                  Walk-in: {walkin.salespersonName}
                </p>
                <p className="text-xs text-gray-400">
                  Time: {new Date(walkin.walkInTime).toLocaleTimeString()}
                </p>
              </div>
            )}
            {car.queue?.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-gray-300 mb-1">Queue:</p>
                {car.queue.map((q, index) => {
                  const sp = salespeople.find((s) => s.id === q.salespersonId);
                  return (
                    <div key={index} className="flex justify-between items-center bg-gray-600 rounded p-2 mb-1">
                      <span className="text-sm text-gray-200">
                        {sp?.name || 'Unknown'}
                      </span>
                      <button
                        onClick={() => handleRemoveFromQueue(car.id, q.salespersonId)}
                        className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs"
                      >
                        Remove
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  </div>
));

export default CarsSection;