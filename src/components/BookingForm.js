import React from 'react';

const BookingForm = ({ 
  cars, 
  salespeople, 
  formData, 
  handleChange, 
  handleSubmit, 
  getNextSalesperson,
  onBack 
}) => {
  const nextSalesperson = getNextSalesperson ? getNextSalesperson() : { name: 'No salespeople available' };

  return (
    <div className="max-w-lg mx-auto bg-gray-800 p-6 rounded-md shadow-lg">
      <h2 className="text-2xl font-bold text-gray-100 mb-6">
        Book a Test Drive
      </h2>
      <div className="mb-4 p-4 bg-gray-700 rounded-md">
        <p className="text-sm text-gray-400">
          Next in Round-Robin: <span className="font-semibold">{nextSalesperson.name}</span>
        </p>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label
            className="block text-gray-200 font-semibold mb-2"
            htmlFor="carId"
          >
            Car Model
          </label>
          <select
            id="carId"
            name="carId"
            value={formData.carId}
            onChange={handleChange}
            className="w-full p-3 border border-gray-600 bg-gray-900 text-gray-100 rounded-md focus:ring-2 focus:ring-brand-blue-400"
            aria-label="Select car model"
          >
            <option value="">Select a car</option>
            {cars.map((car) => (
              <option key={car.id} value={car.id}>
                {car.model} ({car.numberPlate || "N/A"}) (
                {car.available ? "Available" : "Booked"})
              </option>
            ))}
          </select>
        </div>
        <div className="mb-6">
          <label
            className="block text-gray-200 font-semibold mb-2"
            htmlFor="salespersonId"
          >
            Salesperson
          </label>
          <select
            id="salespersonId"
            name="salespersonId"
            value={formData.salespersonId}
            onChange={handleChange}
            className="w-full p-3 border border-gray-600 bg-gray-900 text-gray-100 rounded-md"
            aria-label="Select salesperson"
          >
            <option value="">Select salesperson</option>
            {salespeople.map((sp) => (
              <option key={sp.id} value={sp.id}>
                {sp.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors p-3 py-2 text-lg font-semibold"
          aria-label="Submit test drive booking"
        >
          Book Test Drive
        </button>
      </form>
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

export default BookingForm; 