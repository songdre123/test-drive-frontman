import React from 'react';

const Overview = ({
  carsIn,
  carsOut,
  salespeopleAvailable,
  salespeopleNotAvailable
}) => {
  return (
    <div className="bg-gray-800 p-6 rounded-md shadow-lg md:col-span-2">
      <h3 className="text-xl font-semibold text-gray-100 mb-4">
        Overview
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 bg-gray-700 rounded-md max-h-48 overflow-y-auto">
          <h4 className="text-lg font-semibold text-gray-100 mb-2">
            Cars In
          </h4>
          {carsIn.length === 0 ? (
            <p className="text-sm text-gray-400">No cars available</p>
          ) : (
            <ul className="space-y-2">
              {carsIn.map((car) => (
                <li key={car.id} className="flex items-center">
                  <span className="inline-flex items-center px-2 py-1 bg-green-600 text-white text-xs font-semibold rounded-full mr-2">
                    ✓
                  </span>
                  <span className="text-sm text-gray-200">
                    {car.model} ({car.numberPlate || "N/A"})
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="p-4 bg-gray-700 rounded-md max-h-48 overflow-y-auto">
          <h4 className="text-lg font-semibold text-gray-100 mb-2">
            Cars Out
          </h4>
          {carsOut.length === 0 ? (
            <p className="text-sm text-gray-400">No cars booked</p>
          ) : (
            <ul className="space-y-2">
              {carsOut.map((car) => (
                <li key={car.id} className="flex items-center">
                  <span className="inline-flex items-center px-2 py-1 bg-red-600 text-white text-xs font-semibold rounded-full mr-2">
                    ✗
                  </span>
                  <span className="text-sm text-gray-200">
                    {car.model} ({car.numberPlate || "N/A"}) -{" "}
                    {car.salesperson}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="p-4 bg-gray-700 rounded-md max-h-48 overflow-y-auto">
          <h4 className="text-lg font-semibold text-gray-100 mb-2">
            Salespeople Available
          </h4>
          {salespeopleAvailable.length === 0 ? (
            <p className="text-sm text-gray-400">
              No salespeople available
            </p>
          ) : (
            <ul className="space-y-2">
              {salespeopleAvailable.map((sp) => (
                <li key={sp.id} className="flex items-center">
                  <span className="inline-flex items-center px-2 py-1 bg-green-600 text-white text-xs font-semibold rounded-full mr-2">
                    ✓
                  </span>
                  <span className="text-sm text-gray-200">{sp.name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="p-4 bg-gray-700 rounded-md max-h-48 overflow-y-auto">
          <h4 className="text-lg font-semibold text-gray-100 mb-2">
            Salespeople Not Available
          </h4>
          {salespeopleNotAvailable.length === 0 ? (
            <p className="text-sm text-gray-400">No salespeople booked</p>
          ) : (
            <ul className="space-y-2">
              {salespeopleNotAvailable.map((sp) => (
                <li key={sp.id} className="flex items-center">
                  <span className="inline-flex items-center px-2 py-1 bg-red-600 text-white text-xs font-semibold rounded-full mr-2">
                    ✗
                  </span>
                  <span className="text-sm text-gray-200">
                    {sp.name} ({sp.bookedCar})
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Overview; 