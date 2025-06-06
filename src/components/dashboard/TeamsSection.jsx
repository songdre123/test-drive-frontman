import React from 'react';

function TeamsSection({ headerStyle, teams, selectedTeamId, salespeople, handleSelectTeam, setView }) {
  const safeSalespeople = Array.isArray(salespeople) ? salespeople : [];
  const safeTeams = Array.isArray(teams) ? teams : [];

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h2 className={headerStyle || "text-2xl font-bold text-gray-100"}>Teams</h2>
        {setView && (
          <button
            onClick={() => setView('team', { teamId: null })} // Use 'team' for add
            className="btn-primary text-xs"
            aria-label="Add new team"
          >
            Add New Team
          </button>
        )}
      </div>
      <div className="mb-4">
        <label htmlFor="team-select" className="block text-sm font-medium text-gray-300 mb-1">Select Active Team</label>
        <select
          id="team-select"
          value={selectedTeamId || ''}
          onChange={(e) => handleSelectTeam(e.target.value)}
          className="input w-full sm:w-auto" // Ensure select uses .input style
          aria-label="Select active team"
        >
          <option value="">No Team Selected</option>
          {safeTeams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
      </div>
      {safeTeams.length === 0 ? (
        <p className="text-gray-400 text-center py-4">No teams configured.</p>
      ) : (
        <div>
          <h3 className="text-lg font-semibold text-gray-200 mt-6 mb-3">All Teams</h3>
          <div className="space-y-3">
            {safeTeams.map((team) => {
              const isCurrentlySelected = team.id === selectedTeamId;
              return (
                <div key={team.id} className={`p-3 rounded-md shadow ${isCurrentlySelected ? 'bg-blue-900 ring-1 ring-blue-500' : 'bg-gray-700'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className={`font-semibold ${isCurrentlySelected ? 'text-blue-200' : 'text-gray-100'}`}>{team.name}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        Members: {(team.salespersonIds || [])
                          .map((id) => safeSalespeople.find((sp) => sp.id.toString() === id.toString())?.name || 'Unknown')
                          .join(', ') || <span className="italic">None</span>}
                      </div>
                      <div className="text-xs text-gray-400">
                        Duty Dates: {team.dutyDates?.join(', ') || <span className="italic">N/A</span>}
                      </div>
                    </div>
                    {setView && (
                      <button
                        onClick={() => setView('team', { teamId: team.id })} // Use 'team' for edit
                        className="btn-secondary text-xs py-1 px-2 ml-2 flex-shrink-0"
                        aria-label={`Edit team ${team.name}`}
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default TeamsSection;
