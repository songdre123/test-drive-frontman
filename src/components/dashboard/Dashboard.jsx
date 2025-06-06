import React, { useCallback, useEffect } from 'react';
import { useFirebaseData } from '../../hooks/useFirebaseData';
import { useRoundRobin } from '../../hooks/useRoundRobin';
import { useToast } from '../../hooks/useToast';
import EventPage from '../../pages/EventPage';
import DayToDayPage from '../../pages/DayToDayPage';
import Sidebar from '../common/Sidebar';

function Dashboard({ setView, setIsLoading, setLoadError }) {
  useEffect(() => {
    console.log('Dashboard.jsx mounted');
    return () => console.log('Dashboard.jsx unmounted');
  }, []);

  const { currentMode, setCurrentMode, teams, selectedTeamId, setSelectedTeamId } = useFirebaseData(setLoadError, setIsLoading);
  const { addToast } = useToast();
  const {
    cars, carOrder, salespeople, salespeopleOrder, roundRobinOrder,
    activeBookings, walkins, eventRoundRobin, handleToggleCarAvailability,
    handleReturnCar, handleMoveCarOrder, handleProcessQueue, handleRemoveFromQueue,
    handleToggleDuty, handleMoveSalespersonOrder, handleDeleteSalesperson,
    handleMoveSalesperson, saveEventRoundRobin, handleBookingSubmit
  } = useRoundRobin(setIsLoading, setLoadError);

  const handleModeSwitch = useCallback(async () => {
    const newMode = currentMode === 'event' ? 'day-to-day' : 'event';
    try {
      setCurrentMode(newMode);
      addToast(`Switched to ${newMode === 'event' ? 'Event' : 'Day-to-Day'} Mode`, 'success');
    } catch (error) {
      addToast('Failed to switch mode', 'error');
    }
  }, [currentMode, setCurrentMode, addToast]);

  const handleSelectTeam = useCallback(async (teamId) => {
    try {
      if (currentMode !== 'day-to-day') {
        setCurrentMode('day-to-day');
      }
      
      setSelectedTeamId(teamId);
      if (teamId) {
        const team = teams.find((t) => t.id === teamId);
        if (team) {
          const teamMemberIds = team.salespersonIds || [];
          handleMoveSalesperson(teamMemberIds);
          addToast(`Selected team: ${team.name}`, 'success');
        }
      } else {
        handleMoveSalesperson([]);
        addToast('No team selected', 'success');
      }
    } catch (error) {
      console.error('Team selection error:', error);
      addToast('Failed to select team', 'error');
    }
  }, [setSelectedTeamId, teams, handleMoveSalesperson, addToast, currentMode, setCurrentMode]);

  const sectionHeaderStyle = "text-xl font-semibold text-gray-100 mb-4";

  return (
    <div className="flex min-h-screen">
      <Sidebar
        setView={setView}
        currentMode={currentMode}
        handleModeSwitch={handleModeSwitch}
      />

      <div className="flex-1 p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-100">
            {currentMode === 'event' ? 'Event' : 'Day-to-Day'} Dashboard
          </h1>
        </div>

        {currentMode === 'event' ? (
          <EventPage
            headerStyle={sectionHeaderStyle}
            cars={cars}
            carOrder={carOrder}
            activeBookings={activeBookings}
            walkins={walkins}
            handleToggleCarAvailability={handleToggleCarAvailability}
            handleReturnCar={handleReturnCar}
            handleMoveCarOrder={handleMoveCarOrder}
            handleProcessQueue={handleProcessQueue}
            handleRemoveFromQueue={handleRemoveFromQueue}
            salespeople={salespeople}
            salespeopleOrder={salespeopleOrder}
            eventRoundRobin={eventRoundRobin}
            saveEventRoundRobin={saveEventRoundRobin}
          />
        ) : (
          <DayToDayPage
            headerStyle={sectionHeaderStyle}
            cars={cars}
            carOrder={carOrder}
            activeBookings={activeBookings}
            walkins={walkins}
            handleToggleCarAvailability={handleToggleCarAvailability}
            handleReturnCar={handleReturnCar}
            handleMoveCarOrder={handleMoveCarOrder}
            handleProcessQueue={handleProcessQueue}
            handleRemoveFromQueue={handleRemoveFromQueue}
            salespeople={salespeople}
            roundRobinOrder={roundRobinOrder}
            handleMoveSalesperson={handleMoveSalesperson}
            teams={teams}
            selectedTeamId={selectedTeamId}
            handleSelectTeam={handleSelectTeam}
            setView={setView}
          />
        )}
      </div>
    </div>
  );
}

export default Dashboard;
