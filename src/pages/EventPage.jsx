import React from 'react';
import CarsSection from '../components/dashboard/CarsSection';
import EventRoundRobin from '../components/dashboard/EventRoundRobin';

function EventPage({
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
  salespeopleOrder,
  eventRoundRobin,
  saveEventRoundRobin,
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

      {/* Event Mode Specific Content */}
      <EventRoundRobin
        headerStyle={headerStyle}
        salespeople={salespeople}
        salespeopleOrder={salespeopleOrder}
        eventRoundRobin={eventRoundRobin}
        saveEventRoundRobin={saveEventRoundRobin}
      />
    </>
  );
}

export default EventPage; 