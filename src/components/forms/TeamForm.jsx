import React, { useState, useCallback, useEffect } from 'react';
import { useFirebaseData } from '../../hooks/useFirebaseData';
import { useToast } from '../../hooks/useToast';
import { saveTeamToFirestore, updateTeamInFirestore } from '../../utils/firebaseUtils';

function TeamForm({ setView }) {
  const { salespeople, teams } = useFirebaseData();
  const { addToast } = useToast();
  const [teamForm, setTeamForm] = useState({ name: '', salespersonIds: [] });
  const [editTeam, setEditTeam] = useState(null);

  useEffect(() => {
    // Simulate selecting a team to edit (e.g., from TeamsSection)
    if (teams.length > 0) {
      const team = teams[0]; // For demo, edit first team
      setEditTeam({
        id: team.id,
        name: team.name,
        salespersonIds: team.salespersonIds.map((id) => String(id)),
        dutyDates: team.dutyDates || [],
      });
    }
  }, [teams]);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const updater = editTeam ? setEditTeam : setTeamForm;
    if (type === 'checkbox' && name === 'salespersonIds') {
      updater((prev) => ({
        ...prev,
        salespersonIds: checked
          ? [...prev.salespersonIds, value]
          : prev.salespersonIds.filter((id) => id !== value),
      }));
    } else {
      updater((prev) => ({ ...prev, [name]: value }));
    }
  }, [editTeam]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    const data = editTeam || teamForm;
    if (!data.name || data.salespersonIds.length === 0) {
      addToast('Please provide team name and select salespeople', 'error');
      return;
    }
    try {
      if (editTeam) {
        await updateTeamInFirestore(editTeam.id, {
          name: editTeam.name,
          salespersonIds: editTeam.salespersonIds.map(Number),
          dutyDates: editTeam.dutyDates,
        });
        addToast('Team updated', 'success');
        setEditTeam(null);
      } else {
        await saveTeamToFirestore({
          name: teamForm.name,
          salespersonIds: teamForm.salespersonIds.map(Number),
          dutyDates: [],
        });
        addToast('Team added', 'success');
        setTeamForm({ name: '', salespersonIds: [] });
      }
      setView('dashboard');
    } catch (error) {
      addToast(`Failed to ${editTeam ? 'update' : 'add'} team`, 'error');
    }
  }, [editTeam, teamForm, addToast, setView]);

  const formData = editTeam || teamForm;

  return (
    <div className="max-w-xl mx-auto p-6">
      <div className="card">
        <h2 className="text-2xl font-bold text-gray-100 mb-6">
          {editTeam ? 'Edit Team' : 'Add Team'}
        </h2>
        <div
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div>
            <label className="block text-gray-200 font-semibold mb-2" htmlFor="name">
              Team Name
            </label>
            <input
              type="text"
              name="name"
              id="name-team"
              value={formData.name}
              onChange={handleChange}
              className="input"
              placeholder="Enter team name"
              aria-label="Team name"
            />
          </div>
          <div>
            <label className="block text-gray-200 font-semibold mb-2">Salespeople</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {salespeople.map((sp) => (
                <div key={sp.id} className="flex items-center">
                  <input
                    type="checkbox"
                    name="salespersonIds"
                    value={sp.id}
                    checked={formData.salespersonIds.includes(sp.id.toString())}
                    onChange={handleChange}
                    className="mr-2 h-4 w-4 text-blue-600"
                    id={`sp-${sp.id}`}
                  />
                  <label htmlFor={`sp-${sp.id}`} className="text-gray-200 text-sm">
                    {sp.name}
                  </label>
                </div>
              ))}
            </div>
          </div>
          <button
            type="submit"
            className="btn-primary w-full"
            aria-label={editTeam ? 'Save team' : 'Add team'}
            onClick={handleSubmit}
          >
            {editTeam ? 'Update Team' : 'Add Team'}
          </button>
        </div>
        <div className="mt-4 flex justify-between">
          {editTeam && (
            <button
              onClick={() => setEditTeam(null)}
              className="text-blue-400 hover:text-blue-300"
              aria-label="Cancel edit team"
            >
              Cancel
            </button>
          )}
          <button
            onClick={() => setView('dashboard')}
            className="text-blue-400 hover:text-blue-300"
            aria-label="Back to dashboard"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default TeamForm;