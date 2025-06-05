import React from 'react';
import { FaWhatsapp } from 'react-icons/fa';

const SalespeopleSection = React.memo(({
  salespeople, salespeopleOrder, activeBookings, walkins, currentMode,
  handleToggleDuty, handleMoveSalespersonOrder, handleDeleteSalesperson
}) => (
  <div className="card">
    <h2 className="text-2xl font-bold text-gray-100 mb-4">Salespeople</h2>
    {salespeople.length === 0 ? (
      <p className="text-gray-400">No salespeople available.</p>
    ) : (
      <div className="space-y-3">
        {salespeopleOrder.map((spId) => {
          const sp = salespeople.find((s) => s.id === parseInt(spId));
          if (!sp) return null;
          const assignments = [
            ...activeBookings.filter((b) => b.salespersonId === sp.id),
            ...walkins.filter((w) => w.salespersonId === sp.id && !w.testDriveCompleted),
          ];
          return (
            <div key={sp.id} className="card bg-gray-700">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-gray-200 font-semibold">
                    {sp.name}
                    {sp.mobileNumber && (
                      <a
                        href={`https://wa.me/65${sp.mobileNumber.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-green-400 hover:text-green-300"
                        aria-label={`Contact ${sp.name} via WhatsApp`}
                      >
                        <FaWhatsapp />
                      </a>
                    )}
                  </div>
                  {currentMode === 'day-to-day' && (
                    <div className="text-sm text-gray-400">
                      Duty: {sp.isOnDuty ? (
                        <span className="text-green-400">On</span>
                      ) : (
                        <span className="text-red-400">Off</span>
                      )}
                    </div>
                  )}
                  {assignments.length > 0 && (
                    <div className="text-sm text-gray-400 mt-1">
                      Assigned: {assignments.map((a) => a.carModel || 'No Car').join(', ')}
                    </div>
                  )}
                </div>
                <div className="flex space-x-2">
                  {currentMode === 'day-to-day' && (
                    <button
                      onClick={() => handleToggleDuty(sp.id)}
                      className={`btn ${sp.isOnDuty ? 'btn-danger' : 'btn-primary'}`}
                      aria-label={`${sp.isOnDuty ? 'Mark off duty' : 'Mark on duty'} for ${sp.name}`}
                    >
                      {sp.isOnDuty ? 'Off Duty' : 'On Duty'}
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteSalesperson(sp.id)}
                    className="btn-danger"
                    aria-label={`Delete ${sp.name}`}
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="mt-2 flex space-x-2">
                <button
                  onClick={() => handleMoveSalespersonOrder(sp.id, 'up')}
                  disabled={salespeopleOrder.indexOf(sp.id.toString()) === 0}
                  className="btn-secondary px-2 py-1 disabled:bg-gray-500"
                  aria-label={`Move ${sp.name} up`}
                >
                  ↑
                </button>
                <button
                  onClick={() => handleMoveSalespersonOrder(sp.id, 'down')}
                  disabled={salespeopleOrder.indexOf(sp.id.toString()) === salespeopleOrder.length - 1}
                  className="btn-secondary px-2 py-1 disabled:bg-gray-500"
                  aria-label={`Move ${sp.name} down`}
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

export default SalespeopleSection;