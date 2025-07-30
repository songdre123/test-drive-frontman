import React, { useState } from 'react';
import { FaPlus, FaTrash, FaUser, FaPhone, FaComment } from 'react-icons/fa';

const CustomerQueue = ({ customers, onAddCustomer, onDeleteCustomer }) => {
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    number: '',
    remarks: ''
  });
  const [showAddForm, setShowAddForm] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newCustomer.name.trim() && newCustomer.number.trim()) {
      onAddCustomer({
        id: Date.now().toString(),
        name: newCustomer.name.trim(),
        number: newCustomer.number.trim(),
        remarks: newCustomer.remarks.trim(),
        timestamp: new Date().toISOString()
      });
      setNewCustomer({ name: '', number: '', remarks: '' });
      setShowAddForm(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewCustomer(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Customer Queue
        </h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <FaPlus className="text-sm" />
          Add Customer
        </button>
      </div>

      {/* Add Customer Form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <FaUser className="inline mr-2" />
                Name *
              </label>
              <input
                type="text"
                name="name"
                value={newCustomer.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white"
                placeholder="Customer name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <FaPhone className="inline mr-2" />
                Phone Number *
              </label>
              <input
                type="tel"
                name="number"
                value={newCustomer.number}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white"
                placeholder="Phone number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <FaComment className="inline mr-2" />
                Remarks
              </label>
              <input
                type="text"
                name="remarks"
                value={newCustomer.remarks}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white"
                placeholder="Any remarks"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              Add Customer
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Customer List */}
      <div className="space-y-3">
        {customers.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <FaUser className="mx-auto text-4xl mb-2" />
            <p>No customers in queue</p>
          </div>
        ) : (
          customers.map((customer, index) => (
            <div
              key={customer.id}
              className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border-l-4 border-blue-500"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium px-2 py-1 rounded-full">
                      #{index + 1}
                    </span>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {customer.name}
                    </h3>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                    <p className="flex items-center gap-2">
                      <FaPhone className="text-xs" />
                      {customer.number}
                    </p>
                    {customer.remarks && (
                      <p className="flex items-center gap-2">
                        <FaComment className="text-xs" />
                        {customer.remarks}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Added: {new Date(customer.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onDeleteCustomer(customer.id)}
                  className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-2 transition-colors"
                  title="Remove from queue"
                >
                  <FaTrash className="text-sm" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Queue Summary */}
      {customers.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Total customers in queue: {customers.length}
            </span>
            <span className="text-xs text-blue-600 dark:text-blue-300">
              Next: {customers[0]?.name}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerQueue; 