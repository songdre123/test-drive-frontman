import React from 'react';
import { DragDropContext } from 'react-beautiful-dnd';
import RoundRobinSection from './RoundRobinSection';
import TeamsSection from './TeamsSection';

function DayToDayDashboard({
  headerStyle,
  roundRobinOrder,
  salespeople,
  handleMoveSalesperson,
  teams,
  selectedTeamId,
  handleSelectTeam,
  setView
}) {
  return (
    <DragDropContext onDragEnd={() => {}}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RoundRobinSection
          headerStyle={headerStyle}
          roundRobinOrder={roundRobinOrder}
          salespeople={salespeople}
          handleMoveSalesperson={handleMoveSalesperson}
          isRoundRobinDropDisabled={false}
          droppableId="dayToDayRoundRobinDroppable"
        />
        <TeamsSection
          headerStyle={headerStyle}
          teams={teams}
          selectedTeamId={selectedTeamId}
          salespeople={salespeople}
          handleSelectTeam={handleSelectTeam}
          setView={setView}
        />
      </div>
    </DragDropContext>
  );
}

export default DayToDayDashboard; 