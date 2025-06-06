import React from 'react';

const CarStatus = ({
  carOrder,
  cars,
  activeBookings,
  getNextSalesperson,
  handleMoveCarOrder,
  handleProcessQueue,
  handleReturnCar,
  handleEditCar,
  handleDeleteCar,
  handleRemoveFromQueue
}) => {
  return (
    <section className="bg-gray-800 p-6 rounded-md shadow-lg">
      <h3 className="text-xl font-semibold text-gray-100 mb-4">
        Car Status
      </h3>
      <div className="space-y-2">
        {carOrder.map((carId, index) => {
          const car = cars.find((c) => c.id === carId);
          if (!car) return null;
          const activeBooking = activeBookings.find(
            (b) => b.carId === car.id && !car.available
          );
          return (
            <div
              key={car.id}
              className="flex items-center p-3 bg-gray-700 rounded-md"
            >
              <div className="flex-grow">
                <h4 className="text-lg font-semibold text-gray-100">
                  {car.model}
                </h4>
                <p className="text-sm text-gray-400">
                  Plate: {car.numberPlate || "N/A"}
                </p>
                <p className="text-sm text-gray-400">
                  Status:{" "}
                  {car.available ? (
                    <span className="text-green-500 font-semibold">
                      Available
                    </span>
                  ) : (
                    <span className="text-red-500 font-semibold">
                      Booked: {activeBooking?.salespersonName}
                    </span>
                  )}
                </p>
                <p className="text-sm text-gray-400">
                  Queue:{" "}
                  {car.queue.length > 0 ? (
                    <span className="flex flex-wrap gap-2">
                      {car.queue.map((q) => (
                        <span
                          key={q.salespersonId}
                          className="inline-flex items-center bg-gray-600 rounded-md text-gray-200 px-2 py-1 text-xs font-semibold"
                        >
                          {q.salespersonName}
                          <button
                            onClick={() =>
                              handleRemoveFromQueue(car.id, q.salespersonId)
                            }
                            className="ml-1 text-gray-400 hover:text-red-500"
                            aria-label={`Remove ${q.salespersonName} from queue`}
                          >
                            ✗
                          </button>
                        </span>
                      ))}
                    </span>
                  ) : (
                    "None"
                  )}
                </p>
                <p className="text-sm text-gray-400">
                  Next:{" "}
                  <span className="font-semibold">
                    {getNextSalesperson(car.id).name}
                  </span>
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleMoveCarOrder(car.id, "up")}
                  disabled={index === 0}
                  className="bg-gray-600 text-gray-200 px-3 py-1 rounded mr-2 disabled:opacity-50"
                  aria-label={`Move ${car.model} up`}
                >
                  ↑
                </button>
                <button
                  onClick={() => handleMoveCarOrder(car.id, "down")}
                  disabled={index === carOrder.length - 1}
                  className="bg-gray-600 text-gray-200 px-3 py-1 rounded mr-2 disabled:opacity-50"
                  aria-label={`Move ${car.model} down`}
                >
                  ↓
                </button>
                <button
                  onClick={() => handleProcessQueue(car.id)}
                  className="bg-blue-500 text-white rounded-md px-4 py-2 hover:bg-blue-600"
                  aria-label={`Process queue for ${car.model}`}
                >
                  Process Queue
                </button>
                {!car.available && (
                  <button
                    onClick={() => handleReturnCar(car.id)}
                    className="bg-green-600 text-white rounded-md px-4 py-2 hover:bg-green-700"
                    aria-label={`Return ${car.model}`}
                  >
                    Return
                  </button>
                )}
                <button
                  onClick={() => handleEditCar(car)}
                  className="bg-yellow-500 text-white rounded-md px-4 py-2 hover:bg-yellow-600"
                  aria-label={`Edit ${car.model}`}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteCar(car.id)}
                  className="bg-red-600 text-white rounded-md px-4 py-2 hover:bg-red-700"
                  aria-label={`Delete ${car.model}`}
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default CarStatus; 