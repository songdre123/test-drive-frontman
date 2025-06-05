import React, { useState, useCallback } from 'react';
import { useFirebaseData } from '../../hooks/useFirebaseData';
import { useRoundRobin } from '../../hooks/useRoundRobin';
import { useToast } from '../../hooks/useToast';

function BookingForm({ setView }) {
  const { cars, salespeople, currentMode } = useFirebaseData();
  const { handleBookingSubmit, getNextSalesperson } = useRoundRobin();
  const { addToast } = useToast();
  const [formData, setFormData] = useState({ carId: '', salespersonId: '' });

  const handleChange = useCallback((e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  const onSubmit = useCallback(async (e) => {
    e.preventDefault();
    try {
      await handleBookingSubmit(formData);
      setView('dashboard');
      addToast('Test drive booked!', 'success');
    } catch (error) {
      addToast('Failed to book test drive', 'error');
    }
  }, [formData, handleBookingSubmit, setView, addToast]);

  return (
    <div className="max-w-lg mx-auto p-6">
      <div className="card">
        <h2 className="text-2xl font-bold text-gray-100 mb-6">Book a Test Drive</h2>
        <div className="mb-4 p-4 bg-gray-700 rounded-md">
          <p className="text-sm text-gray-400">
            Next in Round-Robin: <span className="font-semibold">{getNextSalesperson().name}</span>
          </p>
        </div>
        <div
          onSubmit={onSubmit}
          className="space-y-4"
        >
          <div>
            <label className="block text-gray-200 font-semibold mb-2" htmlFor="carId">
              Car Model
            </label>
            <select
              id="carId"
              name="carId"
              value={formData.carId}
              onChange={handleChange}
              className="input"
              aria-label="Select car model"
            >
              <option value="">Select a car</option>
              {cars.filter((car) => car.available).map((car) => (
                <option key={car.id} value={car.id}>
                  {car.model} ({car.numberPlate || 'N/A'})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-200 font-semibold mb-2" htmlFor="salespersonId">
              Salesperson
            </label>
            <select
              id="salespersonId"
              name="salespersonId"
              value={formData.salespersonId}
              onChange={handleChange}
              className="input"
              aria-label="Select salesperson"
            >
              <option value="">Select salesperson</option>
              {salespeople.filter((sp) => currentMode === 'event' || sp.isOnDuty).map((sp) => (
                <option key={sp.id} value={sp.id}>
                  {sp.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="btn-primary w-full"
            aria-label="Submit test drive booking"
            onClick={onSubmit}
          >
            Book Test Drive
          </button>
        </div>
        <button
          onClick={() => setView('dashboard')}
          className="mt-4 text-blue-400 hover:text-blue-300 font-semibold"
          aria-label="Back to dashboard"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}

export default BookingForm;