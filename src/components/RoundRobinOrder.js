import React from 'react';
import { Droppable, Draggable } from 'react-beautiful-dnd';
import { FaGripVertical, FaTrash } from 'react-icons/fa';

const RoundRobinOrder = ({
  roundRobinOrder,
  salespeople,
  getNextSalesperson,
  handleDragEnd,
  handleMoveSalesperson,
  isRoundRobinDropDisabled,
  onDelete
}) => {
  return (
    <div className="bg-gray-800 p-6 rounded-md shadow-lg">
      <h2 className="text-xl font-bold text-gray-100 mb-4">Round Robin Order</h2>
      <p className="text-gray-300 mb-4">
        Next: <span className="font-semibold">{getNextSalesperson()?.name || 'None'}</span>
      </p>
      <Droppable droppableId="roundRobin" type="ROUND_ROBIN" isCombineEnabled={false}>
        {(provided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="space-y-2"
          >
            {roundRobinOrder.map((spId, index) => {
              const salesperson = salespeople.find((sp) => sp.id === spId);
              if (!salesperson) return null;
              return (
                <Draggable
                  key={spId}
                  draggableId={spId.toString()}
                  index={index}
                  isDragDisabled={isRoundRobinDropDisabled}
                >
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className="flex items-center justify-between bg-gray-700 p-3 rounded-md"
                    >
                      <div className="flex items-center">
                        <div {...provided.dragHandleProps} className="mr-3">
                          <FaGripVertical className="text-gray-400" />
                        </div>
                        <span className="text-gray-100">{salesperson.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleMoveSalesperson(spId, "up")}
                          disabled={index === 0}
                          className="text-gray-400 hover:text-gray-100 disabled:opacity-50"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => handleMoveSalesperson(spId, "down")}
                          disabled={index === roundRobinOrder.length - 1}
                          className="text-gray-400 hover:text-gray-100 disabled:opacity-50"
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => onDelete(spId)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  )}
                </Draggable>
              );
            })}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};

export default RoundRobinOrder; 