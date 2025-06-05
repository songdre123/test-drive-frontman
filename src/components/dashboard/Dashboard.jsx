import React, { useCallback, useEffect } from 'react';
import { useFirebaseData } from '../../hooks/useFirebaseData';
import { useRoundRobin } from '../../hooks/useRoundRobin';
import { useToast } from '../../hooks/useToast';
import CarsSection from './CarsSection';
import RoundRobinSection from './RoundRobinSection';
import SalespeopleSection from './SalespeopleSection';
import TeamsSection from './TeamsSection';
import EventRoundRobin from './EventRoundRobin';

function Dashboard({ setView, setIsLoading, setLoadError }) {
  useEffect(() => {
    console.log('Dashboard.jsx mounted');
    return () => console.log('Dashboard.jsx unmounted');
  }, []);

  const { currentMode, setCurrentMode, teams, selectedTeamId, setSelectedTeamId } = useFirebaseData(setLoadError);
  const { addToast } = useToast();
  const {
    cars, carOrder, salespeople, salespeopleOrder, roundRobinOrder,
    activeBookings, walkins, eventRoundRobin, handleToggleCarAvailability,
    handleReturnCar, handleMoveCarOrder, handleProcessQueue, handleRemoveFromQueue,
    handleToggleDuty, handleMoveSalespersonOrder, handleDeleteSalesperson,
    handleMoveSalesperson, saveEventRoundRobin
  } = useRoundRobin(setIsLoading, setLoadError);

  const handleModeSwitch = useCallback(async () => {
    const newMode = currentMode === 'event' ? 'day-to-day' : 'event';
    try {
      setCurrentMode(newMode);
      setView('dashboard');
      addToast(`Switched to ${newMode === 'event' ? 'Event' : 'Day-to-Day'} Mode`, 'success');
    } catch (error) {
      addToast('Failed to switch mode', 'error');
    }
  }, [currentMode, setCurrentMode, setView, addToast]);

  const handleSelectTeam = useCallback(async (teamId) => {
    try {
      setSelectedTeamId(teamId);
      addToast(`Selected team: ${teams.find((t) => t.id === teamId)?.name || 'None'}`, 'success');
    } catch (error) {
      addToast('Failed to select team', 'error');
    }
  }, [setSelectedTeamId, teams, addToast]);

  return (
    <div className="flex min-h-screen">
      <div className="w-64 bg-gray-800 p-4 shadow-lg">
        <h2 className="text-2xl font-bold text-gray-100 mb-6">Test Drive Manager</h2>
        <nav className="space-y-2">
          <button
            onClick={() => setView('dashboard')}
            className="w-full text-left px-4 py-2 text-gray-100 bg-gray-700 rounded-md hover:bg-gray-600"
          >
            Dashboard
          </button>
          {currentMode === 'event' ? (
            <>
              <button
                onClick={() => setView('booking')}
                className="w-full text-left px-4 py-2 text-gray-100 hover:bg-gray-600 rounded-md"
              >
                Book Test Drive
              </button>
              <button
                onClick={() => setView('history')}
                className="w-full text-left px-4 py-2 text-gray-100 hover:bg-gray-600 rounded-md"
              >
                Booking History
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setView('walkInForm')}
                className="w-full text-left px-4 py-2 text-gray-100 hover:bg-gray-600 rounded-md"
              >
                Record Walk-In
              </button>
              <button
                onClick={() => setView('walkins')}
                className="w-full text-left px-4 py-2 text-gray-100 hover:bg-gray-600 rounded-md"
              >
                View Walk-Ins
              </button>
              <button
                onClick={() => setView('team')}
                className="w-full text-left px-4 py-2 text-gray-100 hover:bg-gray-600 rounded-md"
              >
                Manage Teams
              </button>
            </>
          )}
          <button
            onClick={() => setView('admin')}
            className="w-full text-left px-4 py-2 text-gray-100 hover:bg-gray-600 rounded-md"
          >
            Admin Panel
          </button>
        </nav>
      </div>
      <div className="flex-1 p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-100">
            {currentMode === 'event' ? 'Event' : 'Day-to-Day'} Dashboard
          </h1>
          <button
            onClick={handleModeSwitch}
            className="btn-primary"
            aria-label={`Switch to ${currentMode === 'event' ? 'Day-to-Day' : 'Event'} mode`}
          >
            Switch to {currentMode === 'event' ? 'Day-to-Day' : 'Event'} Mode
          </button>
        </div>
        {currentMode === 'event' && (
          <EventRoundRobin
            salespeople={salespeople}
            salespeopleOrder={salespeopleOrder}
            eventRoundRobin={eventRoundRobin}
            saveEventRoundRobin={saveEventRoundRobin}
          />
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CarsSection
            cars={cars}
            carOrder={carOrder}
            activeBookings={activeBookings}
            walkins={walkins}
            handleToggleCarAvailability={handleToggleCarAvailability}
            handleReturnCar={handleReturnCar}
            handleMoveCarOrder={handleMoveCarOrder}
            handleProcessQueue={handleProcessQueue}
            handleRemoveFromQueue={handleRemoveFromQueue}
          />
          <RoundRobinSection
            roundRobinOrder={roundRobinOrder}
            salespeople={salespeople}
            handleMoveSalesperson={handleMoveSalesperson}
            isRoundRobinDropDisabled={false}
          />
          <SalespeopleSection
            salespeople={salespeople}
            salespeopleOrder={salespeopleOrder}
            activeBookings={activeBookings}
            walkins={walkins}
            currentMode={currentMode}
            handleToggleDuty={handleToggleDuty}
            handleMoveSalespersonOrder={handleMoveSalespersonOrder}
            handleDeleteSalesperson={handleDeleteSalesperson}
          />
          {currentMode === 'day-to-day' && (
            <TeamsSection
              teams={teams}
              selectedTeamId={selectedTeamId}
              salespeople={salespeople}
              handleSelectTeam={handleSelectTeam}
              setView={setView}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;