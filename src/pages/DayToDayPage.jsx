import React from 'react';
import CarsSection from '../components/dashboard/CarsSection';
import DayToDayDashboard from '../components/dashboard/DayToDayDashboard'; // Note: DayToDayDashboard already contains RoundRobin and Teams

function DayToDayPage({
  headerStyle,
  cars,
  carOrder,
  activeBookings,
  walkins,
  handleToggleCarAvailability,
  handleReturnCar,
  handleMoveCarOrder,
  handleProcessQueue,
  handleRemoveFromQueue,
  salespeople,
  roundRobinOrder,
  handleMoveSalesperson,
  teams,
  selectedTeamId,
  handleSelectTeam,
  setView,
}) {
  return (
    <>
      {/* Cars Section - Full Width */}
      <div className="mb-6">
        <CarsSection
          headerStyle={headerStyle}
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
        />
      </div>

      {/* Day-to-Day Mode Specific Content */}
      {/* DayToDayDashboard already contains RoundRobinSection and TeamsSection */}
      <DayToDayDashboard
        headerStyle={headerStyle}
        roundRobinOrder={roundRobinOrder}
        salespeople={salespeople}
        handleMoveSalesperson={handleMoveSalesperson}
        teams={teams}
        selectedTeamId={selectedTeamId}
        handleSelectTeam={handleSelectTeam}
        setView={setView}
      />
    </>
  );
}

export default DayToDayPage; 