import React from 'react';

const CarsSection = React.memo(({
  cars, carOrder, activeBookings, walkins, handleToggleCarAvailability,
  handleReturnCar, handleMoveCarOrder, handleProcessQueue, handleRemoveFromQueue
}) => (
  <div className="card">
    <h2 className="text-2xl font-bold text-gray-100 mb-4">Cars</h2>
    {cars.length === 0 ? (
      <p className="text-gray-400">No cars available.</p>
    ) : (
      <div className="space-y-3">
        {carOrder.map((carId) => {
          const car = cars.find((c) => c.id === carId);
          if (!car) return null;
          const booking = activeBookings.find((b) => b.carId === car.id);
          const walkin = walkins.find((w) => w.carId === car.id && !w.testDriveCompleted);
          return (
            <div key={car.id} className="card bg-gray-700">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-gray-200 font-semibold">
                    {car.model} ({car.numberPlate || 'N/A'})
                  </div>
                  <div className="text-sm text-gray-400">
                    Status: {car.available ? (
                      <span className="text-green-400">Available</span>
                    ) : (
                      <span className="text-red-400">In Use</span>
                    )}
                  </div>
                  {(booking || walkin) && (
                    <div className="text-sm text-gray-400 mt-1">
                      Assigned to: {booking ? booking.salespersonName : walkin.salespersonName}
                    </div>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleToggleCarAvailability(car.id)}
                    className={`btn ${car.available ? 'btn-danger' : 'btn-primary'}`}
                    aria-label={`${car.available ? 'Mark unavailable' : 'Mark available'} for ${car.model}`}
                  >
                    {car.available ? 'Mark Unavailable' : 'Mark Available'}
                  </button>
                  {!car.available && (
                    <button
                      onClick={() => handleReturnCar(car.id)}
                      className="btn-primary"
                      aria-label={`Return ${car.model}`}
                    >
                      Return
                    </button>
                  )}
                </div>
              </div>
              {car.queue.length > 0 && (
                <div className="mt-2">
                  <div className="text-sm text-gray-400 font-semibold">Queue:</div>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {car.queue.map((q, index) => (
                      <div
                        key={index}
                        className="text-sm text-gray-200 bg-gray-600 px-2 py-1 rounded-md flex items-center"
                      >
                        {q.salespersonName}
                        <button
                          onClick={() => handleRemoveFromQueue(car.id, q.salespersonId)}
                          className="ml-2 text-red-400 hover:text-red-300"
                          aria-label={`Remove ${q.salespersonName} from queue`}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => handleProcessQueue(car.id)}
                    className="mt-2 btn-primary"
                    aria-label={`Process queue for ${car.model}`}
                  >
                    Process Queue
                  </button>
                </div>
              )}
              <div className="mt-2 flex space-x-2">
                <button
                  onClick={() => handleMoveCarOrder(car.id, 'up')}
                  disabled={carOrder.indexOf(car.id) === 0}
                  className="btn-secondary px-2 py-1 disabled:bg-gray-500"
                  aria-label={`Move ${car.model} up`}
                >
                  ↑
                </button>
                <button
                  onClick={() => handleMoveCarOrder(car.id, 'down')}
                  disabled={carOrder.indexOf(car.id) === carOrder.length - 1}
                  className="btn-secondary px-2 py-1 disabled:bg-gray-500"
                  aria-label={`Move ${car.model} down`}
                >
                  ↓
                </button>
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>
));

export default CarsSection;