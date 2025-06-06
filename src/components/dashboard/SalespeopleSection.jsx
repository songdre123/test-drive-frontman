import React from 'react';
import { FaWhatsapp } from 'react-icons/fa';

const SalespeopleSection = React.memo(({
  headerStyle, salespeople, salespeopleOrder, activeBookings, walkins, currentMode,
  handleToggleDuty, handleMoveSalespersonOrder, handleDeleteSalesperson, setView // Added setView
}) => {

  // Ensure salespeopleOrder contains string IDs if sp.id is a number, or consistently use numbers.
  // Assuming sp.id is a number from Firestore, and salespeopleOrder might be an array of numbers or strings.
  // For consistency, let's ensure we are comparing numbers to numbers or strings to strings.
  // If sp.id is number, salespeopleOrder should be numbers. If sp.id is string, salespeopleOrder should be strings.
  // The original code uses sp.id.toString() for indexOf, so salespeopleOrder should ideally be string IDs.
  // Let's assume salespeopleOrder from useRoundRobin is already an array of string IDs.

  const orderedSalespeople = (salespeopleOrder || [])
    .map(id => salespeople.find(sp => sp.id.toString() === id.toString())) // Compare as strings
    .filter(Boolean);

  return (
  <div className="card">
    <div className="flex justify-between items-center mb-4">
      <h2 className={headerStyle || "text-2xl font-bold text-gray-100"}>Salespeople</h2>
    </div>

    {orderedSalespeople.length === 0 ? (
      <p className="text-gray-400 text-center py-4">No salespeople available.</p>
    ) : (
      <div className="space-y-3">
        {orderedSalespeople.map((sp, index) => {
          // const sp = salespeople.find((s) => s.id === parseInt(spId)); // Original had parseInt
          // if (!sp) return null; // Already filtered by orderedSalespeople
          const assignments = [
            ...(activeBookings || []).filter((b) => b.salespersonId === sp.id),
            ...(walkins || []).filter((w) => w.salespersonId === sp.id && !w.testDriveCompleted),
          ];
          return (
            <div key={sp.id} className="p-3 bg-gray-700 rounded-md shadow"> {/* Removed nested .card */}
              <div className="flex justify-between items-start"> {/* items-start for better alignment with multi-line info */}
                <div className="flex-grow"> {/* Allow text to take space */}
                  <div className="text-gray-100 font-semibold flex items-center">
                    {sp.name}
                    {sp.mobileNumber && (
                      <a
                        href={`https://wa.me/65${sp.mobileNumber.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-green-400 hover:text-green-300"
                        aria-label={`Contact ${sp.name} via WhatsApp`}
                      >
                        <FaWhatsapp size="1em" /> {/* Explicit size */}
                      </a>
                    )}
                  </div>
                  {currentMode === 'day-to-day' && (
                    <div className="text-sm">
                      Duty: {sp.isOnDuty ? (
                        <span className="text-green-400">On</span>
                      ) : (
                        <span className="text-yellow-400">Off</span> /* Changed Off Duty color */
                      )}
                    </div>
                  )}
                  {assignments.length > 0 && (
                    <div className="text-xs text-gray-400 mt-1">
                      Assigned: {assignments.map((a) => a.carModel || 'N/A').join(', ')}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end space-y-1.5 ml-2 flex-shrink-0"> {/* Added flex-shrink-0 */}
                  {currentMode === 'day-to-day' && (
                    <button
                      onClick={() => handleToggleDuty(sp.id)}
                      className={`btn text-xs w-full ${sp.isOnDuty ? 'btn-secondary' : 'btn-primary'}`} // Swapped for Off Duty
                      aria-label={`${sp.isOnDuty ? 'Mark off duty' : 'Mark on duty'} for ${sp.name}`}
                    >
                      {sp.isOnDuty ? 'Set Off Duty' : 'Set On Duty'}
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteSalesperson(sp.id)}
                    className="btn-danger text-xs w-full"
                    aria-label={`Delete ${sp.name}`}
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-gray-600 flex justify-end space-x-1">
                <button
                  onClick={() => handleMoveSalespersonOrder(sp.id, 'up')}
                  disabled={index === 0} // Use index from orderedSalespeople
                  className="btn-secondary p-1 text-xs"
                  aria-label={`Move ${sp.name} up`}
                >
                  ↑
                </button>
                <button
                  onClick={() => handleMoveSalespersonOrder(sp.id, 'down')}
                  disabled={index === orderedSalespeople.length - 1} // Use index from orderedSalespeople
                  className="btn-secondary p-1 text-xs"
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
  ); // This was the closing parenthesis for the arrow function body
}); // This is the closing parenthesis for React.memo

export default SalespeopleSection;
