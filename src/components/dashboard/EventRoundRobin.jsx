import React from 'react';

function EventRoundRobin({ headerStyle, salespeople, salespeopleOrder, eventRoundRobin, saveEventRoundRobin }) {
  // Ensure props are arrays to prevent runtime errors if they are undefined
  const safeSalespeople = Array.isArray(salespeople) ? salespeople : [];
  const safeSalespeopleOrder = Array.isArray(salespeopleOrder) ? salespeopleOrder : [];
  const safeEventRoundRobin = Array.isArray(eventRoundRobin) ? eventRoundRobin : [];

  // Clean up any missing IDs when component mounts or salespeople change
  React.useEffect(() => {
    // Get all valid salesperson IDs
    const validSalespersonIds = new Set(safeSalespeople.map(sp => sp.id.toString()));
    
    // Filter out any IDs that don't exist in our salespeople list
    const validIds = safeEventRoundRobin.filter(spId => {
      const isValid = validSalespersonIds.has(spId.toString());
      if (!isValid) {
        console.log('Removing invalid ID:', spId);
      }
      return isValid;
    });
    
    // If we found any invalid IDs, update the round-robin order
    if (validIds.length !== safeEventRoundRobin.length) {
      console.log('Cleaning up round-robin order:', {
        before: safeEventRoundRobin,
        after: validIds,
        validSalespersonIds: Array.from(validSalespersonIds)
      });
      saveEventRoundRobin(validIds);
    }
  }, [safeSalespeople, safeEventRoundRobin, saveEventRoundRobin]);

  // Display salespeople based on salespeopleOrder
  const displaySalespeople = safeSalespeopleOrder
    .map(id => safeSalespeople.find(sp => sp.id.toString() === id.toString()))
    .filter(Boolean);

  const handleCheckboxChange = (sp, checked) => {
    let newRobin;
    if (checked) {
      // Add and then sort the new list of participants by their order in salespeopleOrder
      const updatedRobin = [...safeEventRoundRobin, sp.id.toString()];
      newRobin = safeSalespeopleOrder.filter(id => updatedRobin.includes(id.toString()));
    } else {
      newRobin = safeEventRoundRobin.filter((id) => id.toString() !== sp.id.toString());
    }
    saveEventRoundRobin(newRobin);
  };

  const handleMoveSalesperson = (index, direction) => {
    const newOrder = [...safeEventRoundRobin];
    if (direction === 'up' && index > 0) {
      [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
    } else if (direction === 'down' && index < newOrder.length - 1) {
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    }
    saveEventRoundRobin(newOrder);
  };

  // Get the current valid round-robin order
  const currentRoundRobin = safeEventRoundRobin.filter(spId => 
    safeSalespeople.some(sp => sp.id.toString() === spId.toString())
  );

  return (
    <div className="card mb-6">
      <h2 className={headerStyle || "text-2xl font-bold text-gray-100 mb-4"}>
        Event Round-Robin Participants
      </h2>
      {displaySalespeople.length === 0 && (
        <p className="text-gray-400 text-center py-3">No salespeople available in the general order to select for the event.</p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2">
        {displaySalespeople.map((sp) => {
          const isChecked = safeEventRoundRobin.includes(sp.id.toString());
          return (
            <div key={sp.id} className="flex items-center p-1 hover:bg-gray-700 rounded-md transition-colors duration-150">
              <input
                type="checkbox"
                checked={isChecked}
                onChange={(e) => handleCheckboxChange(sp, e.target.checked)}
                className="form-checkbox h-4 w-4 text-blue-500 bg-gray-600 border-gray-500 rounded focus:ring-blue-400 focus:ring-offset-gray-800"
                id={`event-robin-${sp.id}`}
                aria-label={`Include ${sp.name} in event round-robin`}
              />
              <label htmlFor={`event-robin-${sp.id}`} className="ml-2 text-gray-200 text-sm cursor-pointer select-none">
                {sp.name}
              </label>
            </div>
          );
        })}
      </div>

      {currentRoundRobin.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-100 mb-3">Round-Robin Order</h3>
          <div className="space-y-2">
            {currentRoundRobin.map((spId, index) => {
              const sp = safeSalespeople.find(s => s.id.toString() === spId.toString());
              if (!sp) return null;
              
              return (
                <div
                  key={spId}
                  className="p-3 bg-gray-700 rounded-md flex justify-between items-center shadow hover:bg-gray-600"
                >
                  <span className="text-gray-200">{sp.name}</span>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleMoveSalesperson(index, 'up')}
                      disabled={index === 0}
                      className="btn-secondary p-1 text-xs"
                      aria-label={`Move ${sp.name} up in round-robin`}
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => handleMoveSalesperson(index, 'down')}
                      disabled={index === currentRoundRobin.length - 1}
                      className="btn-secondary p-1 text-xs"
                      aria-label={`Move ${sp.name} down in round-robin`}
                    >
                      ↓
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default EventRoundRobin;
