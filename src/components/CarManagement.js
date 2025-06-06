import React from 'react';

const CarManagement = ({
  adminForm,
  handleAdminChange,
  handleAddCar
}) => {
  return (
    <div className="bg-gray-800 p-6 rounded-md shadow-lg">
      <h3 className="text-xl font-semibold text-gray-100 mb-4">
        Manage Cars
      </h3>
      <form onSubmit={handleAddCar} className="mb-4 space-y-2">
        <input
          type="text"
          name="newCarModel"
          value={adminForm.newCarModel}
          onChange={handleAdminChange}
          className="w-full p-3 border border-gray-600 bg-gray-900 text-gray-100 rounded-md focus:ring-2 focus:ring-blue-500"
          placeholder="New car model"
          aria-label="New car model"
        />
        <input
          type="text"
          name="newCarNumberPlate"
          value={adminForm.newCarNumberPlate}
          onChange={handleAdminChange}
          className="w-full p-3 border border-gray-600 bg-gray-900 text-gray-100 rounded-md focus:ring-2 focus:ring-blue-500"
          placeholder="Number plate (e.g., SGX1234A)"
          aria-label="New car number plate"
        />
        <button
          type="submit"
          className="w-full bg-green-600 text-white p-3 rounded-md hover:bg-green-700"
          aria-label="Add car"
        >
          Add Car
        </button>
      </form>
    </div>
  );
};

export default CarManagement; 