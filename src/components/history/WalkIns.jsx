import React, { useCallback } from 'react';
import { useFirebaseData } from '../../hooks/useFirebaseData';
import { useRoundRobin } from '../../hooks/useRoundRobin';
import { useToast } from '../../hooks/useToast';
import Papa from 'papaparse';

function WalkIns({ setView }) {
  const { walkins } = useFirebaseData();
  const { handleToggleTestDrive } = useRoundRobin();
  const { addToast } = useToast();

  const handleExportCSV = useCallback(() => {
    const data = walkins.map((w) => ({
      'Car Model': w.carModel || 'N/A',
      'Car Number Plate': w.carNumberPlate || 'N/A',
      'Salesperson Name': w.salespersonName,
      'Client Name': '',
      'Client Number': '',
      'Client Email': '',
      'Walk-In Time': new Date(w.walkInTime).toLocaleString(),
    }));
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'walkins.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Exported walk-ins as CSV', 'success');
  }, [walkins, addToast]);

  const onToggleTestDrive = useCallback(
    async (walkinId) => {
      try {
        await handleToggleTestDrive(walkinId);
        addToast('Test drive status updated', 'success');
      } catch (error) {
        addToast('Failed to toggle test drive', 'error');
      }
    },
    [handleToggleTestDrive, addToast]
  );

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="card">
        <h2 className="text-2xl font-bold text-gray-100 mb-6">Walk-Ins</h2>
        <div className="mb-6 flex justify-end">
          <button
            onClick={handleExportCSV}
            className="btn-primary"
            aria-label="Export walk-ins as CSV"
          >
            Export CSV
          </button>
        </div>
        {walkins.length === 0 ? (
          <p className="text-gray-400 mb-6">No walk-ins recorded.</p>
        ) : (
          <div className="space-y-3 mb-6">
            {walkins
              .sort((a, b) => new Date(b.walkInTime) - new Date(a.walkInTime))
              .map((w) => (
                <div
                  key={w.id}
                  className="card bg-gray-700 rounded-md flex justify-between items-center p-4"
                >
                  <div className="text-gray-200">
                    <div className="font-semibold">
                      {w.carModel
                        ? `${w.carModel} (${w.carNumberPlate || 'N/A'})`
                        : 'No Car Assigned'}{' '}
                      - {w.salespersonName}
                    </div>
                    <div className="text-sm text-gray-400 mt-1">
                      Walk-In: {new Date(w.walkInTime).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-400 mt-1">
                      Test Drive: {w.testDriveCompleted ? 'Completed' : 'Pending'}
                    </div>
                  </div>
                  <button
                    onClick={() => onToggleTestDrive(w.id)}
                    className={`btn ${w.testDriveCompleted ? 'btn-danger' : 'btn-primary'}`}
                    aria-label={`Mark test drive as ${
                      w.testDriveCompleted ? 'not completed' : 'completed'
                    } for walk-in ${w.id}`}
                  >
                    {w.testDriveCompleted ? 'Undo' : 'Complete'}
                  </button>
                </div>
              ))}
          </div>
        )}
        <button
          onClick={() => setView('dashboard')}
          className="mt-4 text-blue-400 hover:text-blue-300"
          aria-label="Back to dashboard"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}

export default WalkIns;