import React from 'react';

function EventRoundRobin({ salespeople, salespeopleOrder, eventRoundRobin, saveEventRoundRobin }) {
  const handleCheckboxChange = (spId, checked) => {
    const newRobin = checked
      ? [...eventRoundRobin, spId].sort((a, b) => {
          const nameA = salespeople.find((s) => s.id === a)?.name || '';
          const nameB = salespeople.find((s) => s.id === b)?.name || '';
          return nameA.localeCompare(nameB);
        })
      : eventRoundRobin.filter((id) => id !== spId);
    saveEventRoundRobin(newRobin);
  };

  return (
    <div className="card mb-6">
      <h2 className="text-2xl font-bold text-gray-100 mb-4">Event Round-Robin Participants</h2>
      <div className="grid grid-cols-2 gap-2">
        {salespeopleOrder.map((spId) => {
          const sp = salespeople.find((s) => s.id === parseInt(spId));
          if (!sp) return null;
          return (
            <div key={sp.id} className="flex items-center">
              <input
                type="checkbox"
                checked={eventRoundRobin.includes(sp.id)}
                onChange={(e) => handleCheckboxChange(sp.id, e.target.checked)}
                className="mr-2 h-4 w-4 text-blue-600"
                id={`event-robin-${sp.id}`}
                aria-label={`Include ${sp.name} in event round-robin`}
              />
              <label htmlFor={`event-robin-${sp.id}`} className="text-gray-200 text-sm">
                {sp.name}
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default EventRoundRobin;