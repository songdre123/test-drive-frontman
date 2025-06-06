import React, { useState } from 'react';
import { useSalesAndCars } from '../hooks/useSalesAndCars';

const SalesAndCarsManager = () => {
  const {
    salespeople,
    cars,
    loading,
    error,
    addSalesperson,
    updateSalesperson,
    deleteSalesperson,
    addCar,
    updateCar,
    deleteCar
  } = useSalesAndCars();

  const [newSalesperson, setNewSalesperson] = useState({ name: '', mobileNumber: '' });
  const [newCar, setNewCar] = useState({ model: '', numberPlate: '' });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  const handleAddSalesperson = async (e) => {
    e.preventDefault();
    try {
      await addSalesperson(newSalesperson);
      setNewSalesperson({ name: '', mobileNumber: '' });
    } catch (error) {
      console.error('Failed to add salesperson:', error);
    }
  };

  const handleAddCar = async (e) => {
    e.preventDefault();
    try {
      await addCar(newCar);
      setNewCar({ model: '', numberPlate: '' });
    } catch (error) {
      console.error('Failed to add car:', error);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Sales and Cars Manager</h2>
      
      {/* Add Salesperson Form */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-2">Add New Salesperson</h3>
        <form onSubmit={handleAddSalesperson} className="space-y-2">
          <input
            type="text"
            value={newSalesperson.name}
            onChange={(e) => setNewSalesperson({ ...newSalesperson, name: e.target.value })}
            placeholder="Name"
            className="border p-2 rounded"
            required
          />
          <input
            type="text"
            value={newSalesperson.mobileNumber}
            onChange={(e) => setNewSalesperson({ ...newSalesperson, mobileNumber: e.target.value })}
            placeholder="Mobile Number"
            className="border p-2 rounded"
          />
          <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
            Add Salesperson
          </button>
        </form>
      </div>

      {/* Add Car Form */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-2">Add New Car</h3>
        <form onSubmit={handleAddCar} className="space-y-2">
          <input
            type="text"
            value={newCar.model}
            onChange={(e) => setNewCar({ ...newCar, model: e.target.value })}
            placeholder="Model"
            className="border p-2 rounded"
            required
          />
          <input
            type="text"
            value={newCar.numberPlate}
            onChange={(e) => setNewCar({ ...newCar, numberPlate: e.target.value })}
            placeholder="Number Plate"
            className="border p-2 rounded"
          />
          <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
            Add Car
          </button>
        </form>
      </div>

      {/* Salespeople List */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-2">Salespeople</h3>
        <div className="space-y-2">
          {salespeople.map((sp) => (
            <div key={sp.id} className="border p-2 rounded flex justify-between items-center">
              <div>
                <p className="font-semibold">{sp.name}</p>
                <p className="text-sm text-gray-600">{sp.mobileNumber}</p>
              </div>
              <button
                onClick={() => deleteSalesperson(sp.id)}
                className="bg-red-500 text-white px-2 py-1 rounded"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Cars List */}
      <div>
        <h3 className="text-xl font-semibold mb-2">Cars</h3>
        <div className="space-y-2">
          {cars.map((car) => (
            <div key={car.id} className="border p-2 rounded flex justify-between items-center">
              <div>
                <p className="font-semibold">{car.model}</p>
                <p className="text-sm text-gray-600">{car.numberPlate}</p>
                <p className="text-sm text-gray-600">
                  Status: {car.available ? 'Available' : 'In Use'}
                </p>
              </div>
              <button
                onClick={() => deleteCar(car.id)}
                className="bg-red-500 text-white px-2 py-1 rounded"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SalesAndCarsManager; 