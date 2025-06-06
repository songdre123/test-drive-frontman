import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFirebaseData } from '../../hooks/useFirebaseData';
import { useRoundRobin } from '../../hooks/useRoundRobin';
import { useToast } from '../../hooks/useToast';
import { getSingaporeTime } from '../../utils/dateUtils';

function WalkInForm() {
  const navigate = useNavigate();
  const { cars } = useFirebaseData();
  const { handleRecordWalkIn, getNextSalesperson } = useRoundRobin();
  const { addToast } = useToast();
  const [walkInForm, setWalkInForm] = useState({ carId: '', walkInTime: getSingaporeTime() });

  const handleChange = useCallback((e) => {
    setWalkInForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  const onSubmit = useCallback(async (e) => {
    e.preventDefault();
    try {
      await handleRecordWalkIn(walkInForm);
      navigate('/');
      addToast('Walk-in recorded', 'success');
    } catch (error) {
      addToast('Failed to record walk-in', 'error');
    }
  }, [walkInForm, handleRecordWalkIn, navigate, addToast]);

  return (
    <div className="max-w-lg mx-auto p-6">
      <div className="card">
        <h2 className="text-2xl font-bold text-gray-100 mb-6">Record Walk-In</h2>
        <div className="mb-4 p-4 bg-gray-700 rounded-md">
          <p className="text-sm text-gray-400">
            Assigned Salesperson: <span className="font-semibold">{getNextSalesperson().name}</span>
          </p>
        </div>
        <div
          onSubmit={onSubmit}
          className="space-y-4"
        >
          <div>
            <label className="block text-gray-200 font-semibold mb-2" htmlFor="carId">
              Car Model (Optional)
            </label>
            <select
              id="carId"
              name="carId"
              value={walkInForm.carId}
              onChange={handleChange}
              className="input"
              aria-label="Select car model"
            >
              <option value="">No car assigned</option>
              {cars.filter((car) => car.available).map((car) => (
                <option key={car.id} value={car.id}>
                  {car.model} ({car.numberPlate || 'N/A'})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-200 font-semibold mb-2" htmlFor="walkInTime">
              Walk-In Time
            </label>
            <input
              type="datetime-local"
              id="walkInTime"
              name="walkInTime"
              value={walkInForm.walkInTime}
              onChange={handleChange}
              className="input"
              aria-label="Select walk-in time"
            />
          </div>
          <button
            type="submit"
            className="btn-primary w-full"
            aria-label="Record walk-in"
            onClick={onSubmit}
          >
            Record Walk-In
          </button>
        </div>
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

export default WalkInForm;