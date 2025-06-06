import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './hooks/useToast';
import Dashboard from './components/dashboard/Dashboard';
import BookingForm from './components/forms/BookingForm';
import WalkInForm from './components/forms/WalkInForm';
import TeamForm from './components/forms/TeamForm';
import BookingHistory from './components/history/BookingHistory';
import WalkIns from './components/history/WalkIns';
import AdminPanel from './components/forms/AdminPanel';
import Spinner from './components/common/Spinner';
import { testFirestore } from './testFirestore';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    console.log('[App.jsx] Mounted, isLoading:', isLoading);
    
    // Fallback timeout
    const timeoutId = setTimeout(() => {
      console.log('[App.jsx] Timeout: No Firestore requests');
      setLoadError('No Firestore requests detected');
      setIsLoading(false);
    }, 5000);
  
    testFirestore()
      .then(() => {
        console.log('[App.jsx] Firestore test passed');
        clearTimeout(timeoutId);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('[App.jsx] Firestore test failed:', error);
        clearTimeout(timeoutId);
        setLoadError('Firestore test failed: ' + error.message);
        setIsLoading(false);
      });
  
    return () => {
      console.log('[App.jsx] Unmounted');
      clearTimeout(timeoutId);
    };
  }, []);

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="card max-w-md p-6 text-center">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Failed to Load</h2>
          <p className="text-gray-300 mb-4">{loadError}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
            aria-label="Retry loading"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner />
      </div>
    );
  }

  return (
    <ToastProvider>
      <Router>
        <div className="min-h-screen bg-gray-900 text-gray-100">
          <Routes>
            <Route path="/" element={<Dashboard setIsLoading={setIsLoading} setLoadError={setLoadError} />} />
            <Route path="/booking" element={<BookingForm />} />
            <Route path="/walk-in" element={<WalkInForm />} />
            <Route path="/walk-ins" element={<WalkIns />} />
            <Route path="/team" element={<TeamForm />} />
            <Route path="/history" element={<BookingHistory />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </ToastProvider>
  );
}

export default App;