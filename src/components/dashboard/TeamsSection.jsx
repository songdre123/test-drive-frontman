import React from 'react';

function TeamsSection({ teams, selectedTeamId, salespeople, handleSelectTeam, setView }) {
  return (
    <div className="card">
      <h2 className="text-2xl font-bold text-gray-100 mb-4">Teams</h2>
      <div className="mb-4">
        <label className="block text-gray-200 font-semibold mb-2">Select Team</label>
        <select
          value={selectedTeamId || ''}
          onChange={(e) => handleSelectTeam(e.target.value)}
          className="input max-w-xs"
          aria-label="Select team"
        >
          <option value="">No Team Selected</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
      </div>
      {teams.length === 0 ? (
        <p className="text-gray-400">No teams available.</p>
      ) : (
        <div className="space-y-3">
          {teams.map((team) => (
            <div key={team.id} className="card bg-gray-700">
              <div className="text-gray-200 font-semibold">{team.name}</div>
              <div className="text-sm text-gray-400">
                Members: {team.salespersonIds
                  .map((id) => salespeople.find((sp) => sp.id === id)?.name || 'Unknown')
                  .join(', ')}
              </div>
              <div className="text-sm text-gray-400">
                Duty Dates: {team.dutyDates.join(', ')}
              </div>
              <button
                onClick={() => setView('team')}
                className="mt-2 btn-primary"
                aria-label={`Edit team ${team.name}`}
              >
                Edit
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TeamsSection;