import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function Sidebar({ currentMode, handleModeSwitch }) {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="w-64 bg-gray-800 min-h-screen p-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-4">Test Drive Frontman</h1>
        <button
          onClick={handleModeSwitch}
          className={`w-full px-4 py-2 rounded ${
            currentMode === 'event' ? 'bg-blue-600' : 'bg-green-600'
          } text-white font-semibold`}
        >
          {currentMode === 'event' ? 'Event Mode' : 'Day-to-Day Mode'}
        </button>
      </div>

      <nav className="space-y-2">
        <Link
          to="/dashboard"
          className={`block px-4 py-2 rounded ${
            isActive('/dashboard') ? 'bg-gray-700' : 'hover:bg-gray-700'
          } text-white`}
        >
          Dashboard
        </Link>
        <Link
          to="/walk-in"
          className={`block px-4 py-2 rounded ${
            isActive('/walk-in') ? 'bg-gray-700' : 'hover:bg-gray-700'
          } text-white`}
        >
          Record Walk-In
        </Link>
        <Link
          to="/walk-ins"
          className={`block px-4 py-2 rounded ${
            isActive('/walk-ins') ? 'bg-gray-700' : 'hover:bg-gray-700'
          } text-white`}
        >
          Walk-Ins
        </Link>
        <Link
          to="/team"
          className={`block px-4 py-2 rounded ${
            isActive('/team') ? 'bg-gray-700' : 'hover:bg-gray-700'
          } text-white`}
        >
          Teams
        </Link>
        <Link
          to="/history"
          className={`block px-4 py-2 rounded ${
            isActive('/history') ? 'bg-gray-700' : 'hover:bg-gray-700'
          } text-white`}
        >
          Booking History
        </Link>
        <Link
          to="/admin"
          className={`block px-4 py-2 rounded ${
            isActive('/admin') ? 'bg-gray-700' : 'hover:bg-gray-700'
          } text-white`}
        >
          Admin Panel
        </Link>
      </nav>
    </div>
  );
}

export default Sidebar; 