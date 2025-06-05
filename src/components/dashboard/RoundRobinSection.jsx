import React from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const RoundRobinSection = React.memo(({
  roundRobinOrder, salespeople, handleMoveSalesperson, isRoundRobinDropDisabled
}) => {
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const { source, destination } = result;
    const reordered = Array.from(roundRobinOrder);
    const [moved] = reordered.splice(source.index, 1);
    reordered.splice(destination.index, 0, moved);
    handleMoveSalesperson(reordered);
  };

  return (
    <div className="card">
      <h2 className="text-2xl font-bold text-gray-100 mb-4">Round-Robin Order</h2>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="roundRobin" isDropDisabled={isRoundRobinDropDisabled}>
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
              {roundRobinOrder.length === 0 ? (
                <p className="text-gray-400">No salespeople in round-robin.</p>
              ) : (
                roundRobinOrder.map((spId, index) => {
                  const sp = salespeople.find((s) => s.id === spId);
                  if (!sp) return null;
                  return (
                    <Draggable key={sp.id} draggableId={sp.id.toString()} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="p-3 bg-gray-700 rounded-md flex justify-between items-center"
                        >
                          <span className="text-gray-200">{sp.name}</span>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleMoveSalesperson(sp.id, 'up')}
                              disabled={index === 0}
                              className="btn-secondary px-2 py-1 disabled:bg-gray-500"
                              aria-label={`Move ${sp.name} up in round-robin`}
                            >
                              ↑
                            </button>
                            <button
                              onClick={() => handleMoveSalesperson(sp.id, 'down')}
                              disabled={index === roundRobinOrder.length - 1}
                              className="btn-secondary px-2 py-1 disabled:bg-gray-500"
                              aria-label={`Move ${sp.name} down in round-robin`}
                            >
                              ↓
                            </button>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  );
                })
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
});

export default RoundRobinSection;