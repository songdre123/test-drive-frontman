import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFirebaseData } from '../../hooks/useFirebaseData';
import { useRoundRobin } from '../../hooks/useRoundRobin';
import { useToast } from '../../hooks/useToast';
import Spinner from '../common/Spinner';

function BookingForm() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const { cars, salespeople, currentMode, activeBookings } = useFirebaseData(setIsLoading, setLoadError);
  const { handleBookingSubmit, getNextSalesperson } = useRoundRobin(setIsLoading, setLoadError);
  const { addToast } = useToast();
  const [formData, setFormData] = useState({ carId: '', salespersonId: '' });

  const handleChange = useCallback((e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  const onSubmit = useCallback(async (e) => {
    e.preventDefault();
    try {
      const selectedCar = cars.find(c => c.id === parseInt(formData.carId));
      const selectedSalesperson = salespeople.find(s => s.id === parseInt(formData.salespersonId));
      
      if (!selectedCar || !selectedSalesperson) {
        addToast('Please select both a car and a salesperson', 'error');
        return;
      }

      // Convert IDs to numbers before submission
      const submissionData = {
        carId: parseInt(formData.carId, 10),
        salespersonId: parseInt(formData.salespersonId, 10)
      };

      await handleBookingSubmit(submissionData);
      
      // Show appropriate message based on car availability
      if (!selectedCar.available) {
        addToast(`Added to queue for ${selectedCar.model}. Currently booked by ${activeBookings.find(b => b.carId === selectedCar.id)?.salespersonName}`, 'success');
      } else {
        addToast('Test drive booked!', 'success');
      }
      
      navigate('/');
    } catch (error) {
      console.error('Booking error:', error);
      addToast(error.message || 'Failed to book test drive', 'error');
    }
  }, [formData, handleBookingSubmit, navigate, addToast, cars, salespeople, activeBookings]);

  if (loadError) {
    return (
      <div className="max-w-lg mx-auto p-6">
        <div className="card">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Error Loading Data</h2>
          <p className="text-gray-300 mb-4">{loadError}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
            aria-label="Retry loading"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto p-6">
        <div className="card flex justify-center items-center min-h-[200px]">
          <Spinner />
        </div>
      </div>
    );
  }

  // Sort salespeople alphabetically by name
  const sortedSalespeople = [...salespeople].sort((a, b) => a.name.localeCompare(b.name));
  const nextSalesperson = getNextSalesperson();

  // Get booking status for each car
  const getCarStatus = (car) => {
    const activeBooking = activeBookings.find(b => b.carId === car.id);
    if (activeBooking) {
      return `Currently booked by ${activeBooking.salespersonName}`;
    }
    return car.available ? 'Available' : 'In Queue';
  };

  return (
    <div className="max-w-lg mx-auto p-6">
      <div className="card">
        <h2 className="text-2xl font-bold text-gray-100 mb-6">Book a Test Drive</h2>
        <div className="mb-4 p-4 bg-gray-700 rounded-md">
          <p className="text-sm text-gray-400">
            Next in Round-Robin: <span className="font-semibold text-blue-400">{nextSalesperson.name}</span>
          </p>
        </div>
        <form
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
              required
            >
              <option value="">Select a car</option>
              {cars.map((car) => {
                const status = getCarStatus(car);
                const isBooked = activeBookings.some(b => b.carId === car.id);
                return (
                  <option 
                    key={car.id} 
                    value={car.id}
                    className={isBooked ? 'text-gray-500' : ''}
                  >
                    {car.model} ({car.numberPlate || 'N/A'}) - {status}
                  </option>
                );
              })}
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
              required
            >
              <option value="">Select salesperson</option>
              {sortedSalespeople
                .filter((sp) => currentMode === 'event' || sp.isOnDuty)
                .map((sp) => (
                  <option 
                    key={sp.id} 
                    value={sp.id}
                    className={sp.id === nextSalesperson.id ? 'bg-blue-900 text-white' : ''}
                  >
                    {sp.name} {sp.id === nextSalesperson.id ? '(Next in Round-Robin)' : ''}
                  </option>
                ))}
            </select>
          </div>
          <button
            type="submit"
            className="btn-primary w-full"
            aria-label="Submit test drive booking"
          >
            Book Test Drive
          </button>
        </form>
        <button
          onClick={() => navigate('/')}
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