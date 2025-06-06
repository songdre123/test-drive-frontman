import React from 'react';

const Settings = ({ settings, onUpdateSettings }) => {
  return (
    <div className="bg-gray-800 p-6 rounded-md shadow-lg">
      <h2 className="text-xl font-semibold text-gray-100 mb-4">Settings</h2>
      <div className="space-y-4">
        <div className="bg-gray-700 p-4 rounded-md">
          <h3 className="text-lg font-medium text-gray-100 mb-2">Application Settings</h3>
          <p className="text-gray-400 text-sm">
            Configure your application preferences here. Changes are saved automatically.
          </p>
        </div>
        
        {/* Add more settings sections as needed */}
        <div className="bg-gray-700 p-4 rounded-md">
          <h3 className="text-lg font-medium text-gray-100 mb-2">Display Settings</h3>
          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-gray-300">
              <input
                type="checkbox"
                checked={settings.showNotifications || false}
                onChange={(e) => onUpdateSettings({ ...settings, showNotifications: e.target.checked })}
                className="form-checkbox h-4 w-4 text-blue-500"
              />
              <span>Show Notifications</span>
            </label>
          </div>
        </div>

        <div className="bg-gray-700 p-4 rounded-md">
          <h3 className="text-lg font-medium text-gray-100 mb-2">System Information</h3>
          <div className="text-gray-400 text-sm">
            <p>Version: 1.0.0</p>
            <p>Last Updated: {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings; 