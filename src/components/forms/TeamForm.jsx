import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFirebaseData } from '../../hooks/useFirebaseData';
import { useToast } from '../../hooks/useToast';
import { saveTeamToFirestore, updateTeamInFirestore } from '../../utils/firebaseUtils';

function TeamForm({ initialTeamData }) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const { salespeople } = useFirebaseData(setLoadError, setIsLoading);
  const { addToast } = useToast();
  
  // Sort salespeople alphabetically by name
  const sortedSalespeople = useMemo(() => {
    return [...(salespeople || [])].sort((a, b) => a.name.localeCompare(b.name));
  }, [salespeople]);

  // Consolidate form state
  const [formData, setFormData] = useState({
    id: null, // For editing
    name: '',
    salespersonIds: [],
    dutyDates: [], // Preserve if editing
  });
  const [isEditMode, setIsEditMode] = useState(false);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    console.log('[TeamForm] handleChange:', { name, value, type, checked }); // DEBUG

    if (type === 'checkbox' && name === 'salespersonIds') {
      setFormData((prev) => {
        console.log('[TeamForm] prev.salespersonIds:', prev.salespersonIds); // DEBUG
        const currentIds = prev.salespersonIds || []; // Ensure it's an array
        let newIds;
        if (checked) {
          newIds = currentIds.includes(value) ? currentIds : [...currentIds, value];
        } else {
          newIds = currentIds.filter((id) => id !== value);
        }
        console.log('[TeamForm] newIds:', newIds); // DEBUG
        return { ...prev, salespersonIds: newIds };
      });
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!formData.name || formData.salespersonIds.length === 0) {
      addToast('Please provide team name and select at least one salesperson', 'error');
      return;
    }
    try {
      const dataToSave = {
        name: formData.name,
        salespersonIds: formData.salespersonIds.map(Number), // Convert back to numbers for Firestore
        dutyDates: formData.dutyDates || [], // Ensure dutyDates is an array
      };

      if (isEditMode && formData.id) {
        await updateTeamInFirestore(formData.id, dataToSave);
        addToast('Team updated successfully', 'success');
      } else {
        await saveTeamToFirestore(dataToSave);
        addToast('Team added successfully', 'success');
      }
      navigate('/'); // Navigate back after successful save/update
    } catch (error) {
      console.error("Error saving team:", error);
      addToast(`Failed to ${isEditMode ? 'update' : 'add'} team: ${error.message}`, 'error');
    }
  }, [formData, isEditMode, addToast, navigate]);

  useEffect(() => {
    if (initialTeamData) {
      setFormData({
        id: initialTeamData.id,
        name: initialTeamData.name || '',
        salespersonIds: (initialTeamData.salespersonIds || []).map(String), // Ensure string IDs for checkboxes
        dutyDates: initialTeamData.dutyDates || [],
      });
      setIsEditMode(true);
    } else {
      setFormData({ id: null, name: '', salespersonIds: [], dutyDates: [] });
      setIsEditMode(false);
    }
  }, [initialTeamData]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto p-4 sm:p-6">
        <div className="card">
          <p className="text-gray-400 text-center py-4">Loading salespeople data...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (loadError) {
    return (
      <div className="max-w-xl mx-auto p-4 sm:p-6">
        <div className="card">
          <p className="text-red-400 text-center py-4">{loadError}</p>
          <div className="mt-4 text-center">
            <button
              onClick={() => navigate('/')}
              className="btn btn-secondary py-2 px-4"
              aria-label="Back to dashboard"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-4 sm:p-6"> 
      <div className="card">
        <h2 className="text-2xl font-bold text-gray-100 mb-6 text-center">
          {isEditMode ? 'Edit Team' : 'Add New Team'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="name-team">
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
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Salespeople</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto p-3 border border-gray-600 bg-gray-700 rounded-md scrollbar-thin">
              {salespeople === undefined || salespeople === null ? (
                <p className="text-gray-400 col-span-full text-center py-2">Loading salespeople data...</p>
              ) : sortedSalespeople.length > 0 ? (
                sortedSalespeople.map((sp) => (
                  <div key={sp.id} className="flex items-center p-1 hover:bg-gray-600 rounded">
                    <input
                      type="checkbox"
                      name="salespersonIds"
                      value={sp.id.toString()}
                      checked={formData.salespersonIds.includes(sp.id.toString())}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-500 bg-gray-600 border-gray-500 rounded focus:ring-blue-400 focus:ring-offset-gray-700 mr-3"
                      id={`sp-team-${sp.id}`}
                    />
                    <label htmlFor={`sp-team-${sp.id}`} className="text-sm text-gray-200 cursor-pointer">
                      {sp.name}
                    </label>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 col-span-full text-center py-2">No salespeople available to add.</p>
              )}
            </div>
            {formData.salespersonIds.length === 0 && (
              <p className="text-xs text-red-400 mt-1">Please select at least one salesperson.</p>
            )}
          </div>
          <button
            type="submit"
            className="btn-primary w-full py-2.5"
            aria-label={isEditMode ? 'Save Changes' : 'Create Team'}
          >
            {isEditMode ? 'Save Changes' : 'Create Team'}
          </button>
        </form>
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/')}
            className="btn btn-secondary py-2 px-4"
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
