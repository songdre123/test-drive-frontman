import React, { useState, useEffect } from 'react';
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
  const [view, setView] = useState('dashboard');
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
        clearTimeout(timeoutId); // Clear the timeout since test passed
        // Don't set isLoading yet, let Dashboard handle it
      })
      .catch((error) => {
        console.error('[App.jsx] Firestore test failed:', error);
        clearTimeout(timeoutId); // Clear timeout on error too
        setLoadError('Firestore test failed: ' + error.message);
        setIsLoading(false);
      });
  
    return () => {
      console.log('[App.jsx] Unmounted');
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    console.log('[App.jsx] isLoading changed:', isLoading);
  }, [isLoading]);

  const renderView = () => {
    console.log('[App.jsx] Rendering view:', view);
    switch (view) {
      case 'booking': return <BookingForm setView={setView} />;
      case 'walkInForm': return <WalkInForm setView={setView} />;
      case 'walkins': return <WalkIns setView={setView} />;
      case 'team': return <TeamForm setView={setView} />;
      case 'history': return <BookingHistory setView={setView} />;
      case 'admin': return <AdminPanel setView={setView} />;
      default: return <Dashboard setView={setView} setIsLoading={setIsLoading} setLoadError={setLoadError} />;
    }
  };

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-900 text-gray-100">
        {loadError ? (
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
        ) : isLoading ? (
          <div className="flex items-center justify-center h-screen">
            <Spinner />
          </div>
        ) : (
          renderView()
        )}
      </div>
    </ToastProvider>
  );
}

export default App;