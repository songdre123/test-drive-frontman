import React from 'react';
import { FaWhatsapp } from 'react-icons/fa';

const SalespersonManagement = ({
  adminForm,
  handleAdminChange,
  handleAddSalesperson,
  salespeopleOrder,
  salespeople,
  handleMoveSalespersonOrder,
  handleEditSalesperson,
  handleDeleteSalesperson
}) => {
  return (
    <div className="bg-gray-800 p-6 rounded-md shadow-lg">
      <h3 className="text-xl font-semibold text-gray-100 mb-4">
        Manage Salespeople
      </h3>
      <form onSubmit={handleAddSalesperson} className="mb-4 space-y-2">
        <input
          type="text"
          name="newSalesperson"
          value={adminForm.newSalesperson}
          onChange={handleAdminChange}
          className="w-full p-3 border border-gray-600 bg-gray-900 text-gray-100 rounded-md focus:ring-2 focus:ring-blue-500"
          placeholder="Salesperson name"
          aria-label="New salesperson name"
        />
        <input
          type="text"
          name="newSalespersonMobile"
          value={adminForm.newSalespersonMobile}
          onChange={handleAdminChange}
          className="w-full p-3 border border-gray-600 bg-gray-900 text-gray-100 rounded-md focus:ring-2 focus:ring-blue-500"
          placeholder="Mobile number (e.g., +6591234567)"
          aria-label="New salesperson mobile number"
        />
        <button
          type="submit"
          className="w-full bg-green-600 text-white p-3 rounded-md hover:bg-green-700"
          aria-label="Add salesperson"
        >
          Add Salesperson
        </button>
      </form>
      <div className="space-y-2">
        {salespeopleOrder.map((spId, index) => {
          const salesperson = salespeople.find((sp) => sp.id === spId);
          if (!salesperson) return null;
          return (
            <div
              key={spId}
              className="flex items-center p-3 bg-gray-700 rounded-md"
            >
              <span className="flex-grow font-medium text-gray-100">
                {salesperson.name}
                {salesperson.mobileNumber && (
                  <span className="text-sm text-gray-400 ml-2">
                    ({salesperson.mobileNumber})
                  </span>
                )}
              </span>
              <button
                onClick={() => handleMoveSalespersonOrder(spId, "up")}
                disabled={index === 0}
                className="bg-gray-600 text-gray-200 px-3 py-1 rounded mr-2 disabled:opacity-50"
                aria-label={`Move ${salesperson.name} up`}
              >
                ↑
              </button>
              <button
                onClick={() => handleMoveSalespersonOrder(spId, "down")}
                disabled={index === salespeopleOrder.length - 1}
                className="bg-gray-600 text-gray-200 px-3 py-1 rounded mr-2 disabled:opacity-50"
                aria-label={`Move ${salesperson.name} down`}
              >
                ↓
              </button>
              {salesperson.mobileNumber && (
                <a
                  href={`https://wa.me/${salesperson.mobileNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-500 hover:text-green-400 mr-2"
                  aria-label={`WhatsApp ${salesperson.name}`}
                >
                  <FaWhatsapp size={20} />
                </a>
              )}
              <button
                onClick={() => handleEditSalesperson(salesperson)}
                className="bg-yellow-500 text-white rounded-md px-4 py-2 hover:bg-yellow-600 mr-2"
                aria-label={`Edit ${salesperson.name}`}
              >
                Edit
              </button>
              <button
                onClick={() => handleDeleteSalesperson(salesperson.id)}
                className="bg-red-600 text-white rounded-md px-4 py-2 hover:bg-red-700"
                aria-label={`Delete ${salesperson.name}`}
              >
                Delete
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SalespersonManagement; 