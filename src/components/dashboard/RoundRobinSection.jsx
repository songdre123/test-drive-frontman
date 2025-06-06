import React, { useState } from 'react';
import { useToast } from '../../hooks/useToast';

const RoundRobinSection = React.memo(({
  headerStyle, roundRobinOrder, salespeople, handleMoveSalesperson, isRoundRobinDropDisabled
}) => {
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const handleMoveSalespersonOrder = async (index, direction) => {
    if (isRoundRobinDropDisabled) return;
    const currentOrder = Array.isArray(roundRobinOrder) ? roundRobinOrder : [];
    if (index >= currentOrder.length) {
      addToast && addToast("Index out of bounds.", 'error');
      return;
    }

    setLoading(true);
    try {
      const reordered = Array.from(currentOrder);
      if (direction === 'up' && index > 0) {
        [reordered[index], reordered[index - 1]] = [reordered[index - 1], reordered[index]];
      } else if (direction === 'down' && index < reordered.length - 1) {
        [reordered[index], reordered[index + 1]] = [reordered[index + 1], reordered[index]];
      }
      const maybePromise = handleMoveSalesperson(reordered);
      if (maybePromise && maybePromise.then) await maybePromise;
      addToast && addToast('Round-robin order updated!', 'success');
    } catch (err) {
      addToast && addToast('Failed to update round-robin order', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  const currentOrder = Array.isArray(roundRobinOrder) ? roundRobinOrder : [];
  const safeSalespeople = Array.isArray(salespeople) ? salespeople : [];

  return (
    <div className="card">
      <h2 className={headerStyle || "text-2xl font-bold text-gray-100 mb-4"}>Round-Robin Order</h2>
      {loading && <div className="text-blue-400 text-center py-2">Updating order...</div>}
      <div className="space-y-2 min-h-[50px]">
        {currentOrder.length === 0 ? (
          <p className="text-gray-400 text-center py-4">No salespeople in round-robin.</p>
        ) : (
          currentOrder.map((spId, index) => {
            const sp = safeSalespeople.find((s) => s.id === spId);
            if (!sp) {
              return <div key={`missing-${spId}-${index}`} className="text-xs text-red-500 p-2">Salesperson data missing for ID: {spId}</div>;
            }
            return (
              <div
                key={sp.id}
                className={`p-3 bg-gray-700 rounded-md flex justify-between items-center shadow
                          ${isRoundRobinDropDisabled ? 'cursor-not-allowed opacity-70' : 'hover:bg-gray-600'}`}
              >
                <span className="text-gray-200">{sp.name}</span>
                <div className="flex space-x-1">
                  <button
                    onClick={() => handleMoveSalespersonOrder(index, 'up')}
                    disabled={index === 0 || isRoundRobinDropDisabled}
                    className="btn-secondary p-1 text-xs"
                    aria-label={`Move ${sp.name} up in round-robin`}
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => handleMoveSalespersonOrder(index, 'down')}
                    disabled={index === currentOrder.length - 1 || isRoundRobinDropDisabled}
                    className="btn-secondary p-1 text-xs"
                    aria-label={`Move ${sp.name} down in round-robin`}
                  >
                    ↓
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
});

export default RoundRobinSection;