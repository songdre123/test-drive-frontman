import React, { useState, useCallback } from 'react';
import Modal from '../common/modal';
import { useFirebaseData } from '../../hooks/useFirebaseData';
import { useRoundRobin } from '../../hooks/useRoundRobin';
import { useToast } from '../../hooks/useToast';
import { updateCarInFirestore, updateSalespersonInFirestore } from '../../utils/firebaseUtils';

function AdminPanel({ setView }) {
  const { cars, salespeople } = useFirebaseData();
  const { handleAddCar, handleDeleteCar, handleAddSalesperson, handleDeleteSalesperson } = useRoundRobin();
  const { addToast } = useToast();
  const [adminForm, setAdminForm] = useState({
    newSalesperson: '',
    newSalespersonMobile: '',
    newCarModel: '',
    newCarNumberPlate: '',
  });
  const [editCar, setEditCar] = useState(null);
  const [editSalesperson, setEditSalesperson] = useState(null);

  const handleAdminChange = useCallback((e) => {
    setAdminForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  const handleEditChange = useCallback((e) => {
    if (editCar) {
      setEditCar((prev) => ({ ...prev, newNumberPlate: e.target.value }));
    } else if (editSalesperson) {
      setEditSalesperson((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    }
  }, [editCar, editSalesperson]);

  const handleAddCarSubmit = useCallback(async (e) => {
    e.preventDefault();
    try {
      await handleAddCar(adminForm);
      setAdminForm((prev) => ({ ...prev, newCarModel: '', newCarNumberPlate: '' }));
      addToast('Car added', 'success');
    } catch (error) {
      addToast('Failed to add car', 'error');
    }
  }, [adminForm, handleAddCar, addToast]);

  const handleAddSalespersonSubmit = useCallback(async (e) => {
    e.preventDefault();
    try {
      await handleAddSalesperson(adminForm);
      setAdminForm((prev) => ({ ...prev, newSalesperson: '', newSalespersonMobile: '' }));
      addToast('Salesperson added', 'success');
    } catch (error) {
      addToast('Failed to add salesperson', 'error');
    }
  }, [adminForm, handleAddSalesperson, addToast]);

  const handleSaveNumberPlate = useCallback(async () => {
    if (!editCar) return;
    try {
      await updateCarInFirestore({ ...editCar, numberPlate: editCar.newNumberPlate.trim() || null });
      setEditCar(null);
      addToast(`Number plate updated for ${editCar.model}`, 'success');
    } catch (error) {
      addToast('Failed to update number plate', 'error');
    }
  }, [editCar, addToast]);

  const handleSaveSalesperson = useCallback(async () => {
    if (!editSalesperson) return;
    try {
      await updateSalespersonInFirestore({
        id: editSalesperson.id,
        name: editSalesperson.newName,
        mobileNumber: editSalesperson.newMobileNumber || null,
        isOnDuty: editSalesperson.isOnDuty,
      });
      setEditSalesperson(null);
      addToast('Salesperson updated', 'success');
    } catch (error) {
      addToast('Failed to update salesperson', 'error');
    }
  }, [editSalesperson, addToast]);

  return (
    <div className="max-w-xl mx-auto p-6">
      <div className="card">
        <button
          onClick={() => setView('dashboard')}
          className="text-blue-400 hover:text-blue-300 mb-4"
          aria-label="Back to dashboard"
        >
          Back to Dashboard
        </button>
        <h2 className="text-2xl font-bold text-gray-100 mb-6">Admin Panel</h2>

        <div
          onClick={handleAddCarSubmit}
          className="mb-8"
        >
          <h3 className="text-lg font-semibold mb-4">Add Car</h3>
          <div className="mb-4">
            <label className="block text-gray-200 mb-2" htmlFor="newCarModel">
              Car Model
            </label>
            <input
              type="text"
              id="newCarModel"
              name="newCarModel"
              value={adminForm.newCarModel}
              onChange={handleAdminChange}
              className="input"
              placeholder="Enter car model"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-200 mb-2" htmlFor="newCarNumberPlate">
              Number Plate
            </label>
            <input
              type="text"
              id="newCarNumberPlate"
              name="newCarNumberPlate"
              value={adminForm.newCarNumberPlate}
              onChange={handleAdminChange}
              className="input"
              placeholder="Enter number plate"
            />
          </div>
          <button
            type="submit"
            className="btn-primary w-full"
            onClick={handleAddCarSubmit}
          >
            Add Car
          </button>
        </div>

        <div
          onClick={handleAddSalespersonSubmit}
        >
          <h3 className="text-lg font-semibold mb-4">Add Salesperson</h3>
          <div className="mb-4">
            <label className="block text-gray-200 mb-2" htmlFor="newSalesperson">
              Name
            </label>
            <input
              type="text"
              id="newSalesperson"
              name="newSalesperson"
              value={adminForm.newSalesperson}
              onChange={handleAdminChange}
              className="input"
              placeholder="Enter salesperson name"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-200 mb-2" htmlFor="newSalespersonMobile">
              Mobile Number
            </label>
            <input
              type="text"
              id="newSalespersonMobile"
              name="newSalespersonMobile"
              value={adminForm.newSalespersonMobile}
              onChange={handleAdminChange}
              className="input"
              placeholder="Enter mobile number"
            />
          </div>
          <button
            type="submit"
            className="btn-primary w-full"
            onClick={handleAddSalespersonSubmit}
          >
            Add Salesperson
          </button>
        </div>

        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Manage Cars</h3>
          {cars.map((car) => (
            <div key={car.id} className="card bg-gray-700 mb-2 flex justify-between items-center">
              <span>{car.model} ({car.numberPlate || 'N/A'})</span>
              <div>
                <button
                  onClick={() => setEditCar({ ...car, newNumberPlate: car.numberPlate || '' })}
                  className="btn-primary mr-2"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteCar(car.id)}
                  className="btn-danger"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-4">Manage Salespeople</h3>
          {salespeople.map((sp) => (
            <div key={sp.id} className="mb-2 flex justify-between items-center">
              <span>{sp.name} ({sp.mobileNumber || 'N/A'})</span>
              <div>
                <button
                  onClick={() => setEditSalesperson({
                    ...sp,
                    newName: sp.name,
                    newMobileNumber: sp.mobileNumber || '',
                  })}
                  className="btn-primary mr-2"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteSalesperson(sp.id)}
                  className="btn-danger"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        <Modal isOpen={!!editCar} onClose={() => setEditCar(null)} title="Edit Car">
          <div className="space-y-4">
            <div>
              <label className="block text-gray-200 mb-2" htmlFor="newNumberPlate">
                Number Plate
              </label>
              <input
                type="text"
                id="newNumberPlate"
                name="newNumberPlate"
                value={editCar?.newNumberPlate || ''}
                onChange={handleEditChange}
                className="input"
                placeholder="Enter number plate"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={handleSaveNumberPlate}
                className="btn-primary"
              >
                Save
              </button>
              <button
                onClick={() => setEditCar(null)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>

        <Modal isOpen={!!editSalesperson} onClose={() => setEditSalesperson(null)} title="Edit Salesperson">
          <div className="space-y-4">
            <div>
              <label className="block text-gray-200 mb-2" htmlFor="newName">
                Name
              </label>
              <input
                type="text"
                id="newName"
                name="newName"
                value={editSalesperson?.newName || ''}
                onChange={handleEditChange}
                className="input"
                placeholder="Enter salesperson name"
              />
            </div>
            <div>
              <label className="block text-gray-200 mb-2" htmlFor="newMobileNumber">
                Mobile Number
              </label>
              <input
                type="text"
                id="newMobileNumber"
                name="newMobileNumber"
                value={editSalesperson?.newMobileNumber || ''}
                onChange={handleEditChange}
                className="input"
                placeholder="Enter mobile number"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={handleSaveSalesperson}
                className="btn-primary"
              >
                Save
              </button>
              <button
                onClick={() => setEditSalesperson(null)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}

export default AdminPanel;