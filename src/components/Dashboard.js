import React, { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { useFirebaseData } from '../hooks/useFirebaseData';
import { useRoundRobin } from '../hooks/useRoundRobin';
import { useToast } from '../hooks/useToast';
import BookingForm from './BookingForm';
import { doc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';

function Dashboard({ 
  setIsLoading, 
  setLoadError, 
  getNextSalesperson, 
  cars, 
  salespeople, 
  activeBookings, 
  roundRobinOrder, 
  setRoundRobinOrder, 
  handleRemoveFromRoundRobin: propHandleRemoveFromRoundRobin, 
  handleProcessQueue: propHandleProcessQueue, 
  handleMarkCarUnavailable: propHandleMarkCarUnavailable, 
  handleAddToRoundRobin: propHandleAddToRoundRobin, 
  handleAddSalesperson, 
  handleAddCar, 
  handleEditCar, 
  handleDeleteCar, 
  handleEditSalesperson, 
  handleDeleteSalesperson, 
  adminForm, 
  setAdminForm, 
  handleAdminChange, 
  editCar, 
  setEditCar, 
  editSalesperson, 
  setEditSalesperson, 
  handleSaveNumberPlate, 
  handleSaveSalesperson,
  setCars,
  setActiveBookings 
}) {
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSalesAndCars, setShowSalesAndCars] = useState(false);
  const [formData, setFormData] = useState({
    carId: '',
    salespersonId: '',
  });
  const [selectedCar, setSelectedCar] = useState(null);
  const [showQueueModal, setShowQueueModal] = useState(false);
  const [isRoundRobinDropDisabled, setIsRoundRobinDropDisabled] = useState(false);
  const [showEditCarModal, setShowEditCarModal] = useState(false);
  const [showEditSalespersonModal, setShowEditSalespersonModal] = useState(false);
  const [selectedCarForEdit, setSelectedCarForEdit] = useState(null);
  const [selectedSalespersonForEdit, setSelectedSalespersonForEdit] = useState(null);
  const [selectedCarForQueue, setSelectedCarForQueue] = useState(null);

  const { teams, selectedTeamId, setSelectedTeamId } = useFirebaseData(setLoadError, setIsLoading);
  const { addToast } = useToast();
  const {
    cars: roundRobinCars, 
    salespeople: roundRobinSalespeople, 
    activeBookings: roundRobinActiveBookings,
    handleToggleCarAvailability, 
    handleReturnCar: roundRobinHandleReturnCar,
    handleBookingSubmit, 
    roundRobinOrder: hookRoundRobinOrder, 
    setRoundRobinOrder: hookSetRoundRobinOrder,
    lastRoundRobinIndex, 
    setLastRoundRobinIndex,
    isRoundRobinDropDisabled: hookIsRoundRobinDropDisabled,
    setIsRoundRobinDropDisabled: hookSetIsRoundRobinDropDisabled
  } = useRoundRobin(setIsLoading, setLoadError);

  // Define all handler functions at the top level
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const selectedCar = cars.find(car => car.id === parseInt(formData.carId));
      if (!selectedCar) {
        throw new Error('Car not found');
      }

      const selectedSalesperson = salespeople.find(sp => sp.id === parseInt(formData.salespersonId));
      if (!selectedSalesperson) {
        throw new Error('Salesperson not found');
      }

      // Add to car's queue
      const updatedCar = {
        ...selectedCar,
        queue: [...(selectedCar.queue || []), {
          salespersonId: selectedSalesperson.id,
          salespersonName: selectedSalesperson.name,
          timestamp: Date.now()
        }]
      };

      // Update car in Firestore
      await updateDoc(doc(db, "cars", selectedCar.id.toString()), {
        queue: updatedCar.queue
      });

      // Update local state
      setCars(prev => prev.map(car => 
        car.id === selectedCar.id ? updatedCar : car
      ));

      setShowBookingForm(false);
      setFormData({ carId: '', salespersonId: '' });
      addToast('Added to car queue successfully', 'success');
    } catch (error) {
      console.error('Booking submission error:', error);
      addToast(error.message || 'Failed to add to queue', 'error');
    }
  };

  const handleProcessQueue = async (carId) => {
    try {
      const car = cars.find(c => c.id === carId);
      if (!car || !car.queue || car.queue.length === 0) {
        addToast('No queue to process', 'error');
        return;
      }

      const nextInQueue = car.queue[0];
      const salesperson = salespeople.find(sp => sp.id === nextInQueue.salespersonId);
      
      if (!salesperson) {
        addToast('Salesperson not found', 'error');
        return;
      }

      // Create new booking
      const newBooking = {
        carId: car.id,
        carModel: car.model,
        carNumberPlate: car.numberPlate,
        salespersonId: salesperson.id,
        salespersonName: salesperson.name,
        timestamp: Date.now(),
        status: 'active'
      };

      // Add booking to Firestore
      const bookingRef = await addDoc(collection(db, "bookings"), newBooking);

      // Update car status and remove from queue
      await updateDoc(doc(db, "cars", carId.toString()), {
        available: false,
        queue: car.queue.slice(1)
      });

      // Remove salesperson from round robin if they're in it
      if (roundRobinOrder.includes(salesperson.id)) {
        const newRoundRobinOrder = roundRobinOrder.filter(id => id !== salesperson.id);
        setRoundRobinOrder(newRoundRobinOrder);
        
        // Update round robin order in Firestore
        await updateDoc(doc(db, "settings", "config"), {
          roundRobinOrder: newRoundRobinOrder
        });
      }

      // Update local state
      setActiveBookings(prev => [...prev, { id: bookingRef.id, ...newBooking }]);
      setCars(prev => prev.map(c => 
        c.id === carId ? { ...c, available: false, queue: c.queue.slice(1) } : c
      ));
      
      addToast('Queue processed successfully', 'success');
    } catch (error) {
      console.error('Error processing queue:', error);
      addToast('Failed to process queue', 'error');
    }
  };

  const handleMarkCarUnavailable = async (carId) => {
    try {
      // Convert carId to number if it's a string
      const numericCarId = typeof carId === 'string' ? parseInt(carId) : carId;
      
      const car = cars.find(c => c.id === numericCarId);
      if (!car) {
        throw new Error('Car not found');
      }

      // Update car status in Firestore
      await updateDoc(doc(db, "cars", numericCarId.toString()), {
        available: false
      });

      // Update local state
      setCars(prev => prev.map(c => 
        c.id === numericCarId ? { ...c, available: false } : c
      ));

      addToast('Car marked as unavailable', 'success');
    } catch (error) {
      console.error('Error marking car unavailable:', error);
      addToast(error.message || 'Failed to mark car unavailable', 'error');
    }
  };

  const handleAddToRoundRobin = async (salespersonId) => {
    try {
      if (!roundRobinOrder.includes(salespersonId)) {
        const newOrder = [...roundRobinOrder, salespersonId];
        setRoundRobinOrder(newOrder);
        
        // Update in Firestore
        await updateDoc(doc(db, "settings", "config"), {
          roundRobinOrder: newOrder
        });
        
        addToast("Salesperson added to round robin", "success");
      }
    } catch (error) {
      console.error("Error adding to round robin:", error);
      addToast("Failed to add to round robin", "error");
    }
  };

  const handleRemoveFromRoundRobin = async (salespersonId) => {
    try {
      const newOrder = roundRobinOrder.filter(id => id !== salespersonId);
      setRoundRobinOrder(newOrder);
      
      // Update in Firestore
      await updateDoc(doc(db, "settings", "config"), {
        roundRobinOrder: newOrder
      });
      
      addToast("Salesperson removed from round robin", "success");
    } catch (error) {
      console.error("Error removing from round robin:", error);
      addToast("Failed to remove from round robin", "error");
    }
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) {
      return;
    }

    const { source, destination } = result;

    try {
      const reordered = Array.from(roundRobinOrder);
      const [moved] = reordered.splice(source.index, 1);
      reordered.splice(destination.index, 0, moved);

      setRoundRobinOrder(reordered);
      
      // Update in Firestore
      await updateDoc(doc(db, "settings", "config"), {
        roundRobinOrder: reordered
      });
      
      addToast("Round-robin order updated", "success");
    } catch (error) {
      console.error("Drag-and-drop error:", error);
      addToast("Failed to update order", "error");
    }
  };

  const handleMoveSalesperson = async (spId, direction) => {
    try {
      const index = roundRobinOrder.indexOf(spId);
      if (index === -1) return;
      
      const newIndex = direction === "up" ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= roundRobinOrder.length) return;
      
      const reordered = Array.from(roundRobinOrder);
      [reordered[index], reordered[newIndex]] = [reordered[newIndex], reordered[index]];
      
      setRoundRobinOrder(reordered);
      
      // Update in Firestore
      await updateDoc(doc(db, "settings", "config"), {
        roundRobinOrder: reordered
      });
      
      addToast("Round-robin order updated", "success");
    } catch (error) {
      console.error("Error moving salesperson:", error);
      addToast("Failed to update order", "error");
    }
  };

  const handleReturnCar = async (carId) => {
    try {
      // Convert carId to number if it's a string
      const numericCarId = typeof carId === 'string' ? parseInt(carId) : carId;
      
      const car = cars.find(c => c.id === numericCarId);
      if (!car) {
        throw new Error('Car not found');
      }

      const booking = activeBookings.find(b => b.carId === numericCarId);
      
      // If there's a booking, update it and add salesperson back to round robin
      if (booking) {
        try {
          // Update booking status in Firestore
          const bookingRef = doc(db, "bookings", booking.id);
          await updateDoc(bookingRef, {
            status: 'completed',
            completedAt: Date.now()
          });

          // Add salesperson back to round robin at the end
          if (!roundRobinOrder.includes(booking.salespersonId)) {
            const newRoundRobinOrder = [...roundRobinOrder, booking.salespersonId];
            setRoundRobinOrder(newRoundRobinOrder);
            
            // Update round robin order in Firestore
            await updateDoc(doc(db, "settings", "config"), {
              roundRobinOrder: newRoundRobinOrder
            });
          }
        } catch (error) {
          console.warn('Could not update booking:', error);
          // Continue with car update even if booking update fails
        }
      }

      // Update car status in Firestore
      const carRef = doc(db, "cars", numericCarId.toString());
      await updateDoc(carRef, {
        available: true
      });

      // Update local state
      if (booking) {
        setActiveBookings(prev => prev.filter(b => b.id !== booking.id));
      }
      setCars(prev => prev.map(c => 
        c.id === numericCarId ? { ...c, available: true } : c
      ));

      addToast('Car returned successfully', 'success');
    } catch (error) {
      console.error('Error returning car:', error);
      addToast(error.message || 'Failed to return car', 'error');
    }
  };

  const handleEditCarClick = (car) => {
    setSelectedCarForEdit(car);
    setShowEditCarModal(true);
  };

  const handleEditSalespersonClick = (salesperson) => {
    setSelectedSalespersonForEdit(salesperson);
    setShowEditSalespersonModal(true);
  };

  const handleShowQueue = (car) => {
    setSelectedCarForQueue(car);
    setShowQueueModal(true);
  };

  const handleRemoveFromQueue = async (carId, queueIndex) => {
    try {
      const car = cars.find(c => c.id === carId);
      if (!car || !car.queue) return;

      const newQueue = car.queue.filter((_, index) => index !== queueIndex);
      
      // Update in Firestore
      await updateDoc(doc(db, "cars", carId.toString()), {
        queue: newQueue
      });

      // Update local state
      setCars(prev => prev.map(c => 
        c.id === carId ? { ...c, queue: newQueue } : c
      ));

      addToast('Removed from queue successfully', 'success');
    } catch (error) {
      console.error('Error removing from queue:', error);
      addToast('Failed to remove from queue', 'error');
    }
  };

  const handleEditCarSubmit = async (e) => {
    e.preventDefault();
    try {
      // Update in Firestore
      await updateDoc(doc(db, "cars", selectedCarForEdit.id.toString()), {
        model: selectedCarForEdit.model,
        numberPlate: selectedCarForEdit.numberPlate
      });

      // Update local state
      setCars(prev => prev.map(c => 
        c.id === selectedCarForEdit.id ? selectedCarForEdit : c
      ));

      addToast('Car updated successfully', 'success');
      setShowEditCarModal(false);
    } catch (error) {
      console.error('Error updating car:', error);
      addToast('Failed to update car', 'error');
    }
  };

  const handleEditSalespersonSubmit = async (e) => {
    e.preventDefault();
    try {
      // Update in Firestore
      await updateDoc(doc(db, "salespeople", selectedSalespersonForEdit.id.toString()), {
        name: selectedSalespersonForEdit.name,
        mobileNumber: selectedSalespersonForEdit.mobileNumber
      });

      // Update local state
      setSalespeople(prev => prev.map(sp => 
        sp.id === selectedSalespersonForEdit.id ? selectedSalespersonForEdit : sp
      ));

      addToast('Salesperson updated successfully', 'success');
      setShowEditSalespersonModal(false);
    } catch (error) {
      console.error('Error updating salesperson:', error);
      addToast('Failed to update salesperson', 'error');
    }
  };

  const renderCarCard = (car, isAvailable = true) => (
    <div key={car.id} className="bg-gray-700 p-4 rounded-md">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-100">{car.model}</h3>
          <p className="text-sm text-gray-400">Plate: {car.numberPlate || 'N/A'}</p>
          {car.queue && car.queue.length > 0 && (
            <div className="mt-2">
              <p className="text-sm text-gray-400">Queue: {car.queue.length}</p>
              <button
                onClick={() => handleShowQueue(car)}
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                View Queue
              </button>
            </div>
          )}
        </div>
        <div className="space-x-2">
          {isAvailable ? (
            <>
              <button
                onClick={() => handleProcessQueue(car.id)}
                className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
              >
                Process Queue
              </button>
              <button
                onClick={() => handleMarkCarUnavailable(car.id)}
                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
              >
                Mark Unavailable
              </button>
            </>
          ) : (
            <button
              onClick={() => handleReturnCar(car.id)}
              className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
            >
              Return Car
            </button>
          )}
          <button
            onClick={() => handleEditCarClick(car)}
            className="bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-500"
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-900">

      <div className="flex-1 p-6">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="space-y-6">
            <header className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-gray-100">
               Event Test Drive Frontman
              </h1>
              <div className="space-x-2">
                <button
                  onClick={() => setShowBookingForm(true)}
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
                  aria-label="Book test drive"
                >
                  Book Test Drive
                </button>
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                >
                  {showSettings ? 'Hide Settings' : 'Settings'}
                </button>
              </div>
            </header>

            {/* Main Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Available Cars Section */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-100">Available Cars</h2>
                <div className="space-y-4">
                  {cars
                    .filter(car => car.available)
                    .map(car => renderCarCard(car, true))}
                </div>
              </div>

              {/* Unavailable Cars Section */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-100">Unavailable Cars</h2>
                <div className="space-y-4">
                  {cars
                    .filter(car => !car.available)
                    .map(car => renderCarCard(car, false))}
                </div>
              </div>

              {/* Available Salespeople Section */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-100">Available Salespeople</h2>
                <div className="grid grid-cols-1 gap-4">
                  {salespeople
                    .filter(sp => !roundRobinOrder.includes(sp.id))
                    .map(sp => (
                      <div key={sp.id} className="bg-gray-700 p-4 rounded-md">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="text-lg font-medium text-gray-100">{sp.name}</h3>
                            {sp.mobileNumber && (
                              <p className="text-sm text-gray-400">{sp.mobileNumber}</p>
                            )}
                          </div>
                          <div className="space-x-2">
                            <button
                              onClick={() => handleEditSalespersonClick(sp)}
                              className="bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-500"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleAddToRoundRobin(sp.id)}
                              className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                            >
                              Add to Round Robin
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Unavailable Salespeople Section */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-100">Round Robin Salespeople</h2>
                <Droppable droppableId="roundRobin" isDropDisabled={isRoundRobinDropDisabled}>
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-2"
                    >
                      {roundRobinOrder.map((spId, index) => {
                        const salesperson = salespeople.find(sp => sp.id === spId);
                        if (!salesperson) return null;
                        return (
                          <Draggable
                            key={spId}
                            draggableId={spId.toString()}
                            index={index}
                          >
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className="bg-gray-700 p-4 rounded-md flex items-center justify-between"
                              >
                                <div className="flex items-center space-x-4">
                                  <span className="text-gray-400">{index + 1}.</span>
                                  <div>
                                    <h3 className="text-lg font-medium text-gray-100">{salesperson.name}</h3>
                                    {salesperson.mobileNumber && (
                                      <p className="text-sm text-gray-400">{salesperson.mobileNumber}</p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleMoveSalesperson(spId, "up")}
                                    disabled={index === 0}
                                    className="bg-gray-600 text-white px-2 py-1 rounded hover:bg-gray-500 disabled:opacity-50"
                                  >
                                    ↑
                                  </button>
                                  <button
                                    onClick={() => handleMoveSalesperson(spId, "down")}
                                    disabled={index === roundRobinOrder.length - 1}
                                    className="bg-gray-600 text-white px-2 py-1 rounded hover:bg-gray-500 disabled:opacity-50"
                                  >
                                    ↓
                                  </button>
                                  <button
                                    onClick={() => handleRemoveFromRoundRobin(spId)}
                                    className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            </div>
          </div>
        </DragDropContext>

        {/* Booking Form Modal */}
        {showBookingForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-lg w-full">
              <BookingForm
                cars={cars}
                salespeople={salespeople}
                formData={formData}
                handleChange={handleChange}
                handleSubmit={handleSubmit}
                onBack={() => setShowBookingForm(false)}
                getNextSalesperson={getNextSalesperson}
              />
            </div>
          </div>
        )}

        {/* Queue Modal */}
        {showQueueModal && selectedCarForQueue && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-lg w-full">
              <h2 className="text-xl font-semibold mb-4 text-gray-100">
                Queue for {selectedCarForQueue.model}
              </h2>
              <div className="space-y-2">
                {selectedCarForQueue.queue.map((item, index) => {
                  const salesperson = salespeople.find(sp => sp.id === item.salespersonId);
                  return (
                    <div key={index} className="bg-gray-700 p-3 rounded-md flex justify-between items-center">
                      <div>
                        <p className="text-gray-100">{salesperson?.name || 'Unknown'}</p>
                        <p className="text-sm text-gray-400">
                          Added: {new Date(item.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveFromQueue(selectedCarForQueue.id, index)}
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                      >
                        Remove
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setShowQueueModal(false)}
                  className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-500"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Car Modal */}
        {showEditCarModal && selectedCarForEdit && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-lg w-full">
              <h2 className="text-xl font-semibold mb-4 text-gray-100">Edit Car</h2>
              <form onSubmit={handleEditCarSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300">Model</label>
                    <input
                      type="text"
                      value={selectedCarForEdit.model}
                      onChange={(e) => setSelectedCarForEdit(prev => ({ ...prev, model: e.target.value }))}
                      className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300">Number Plate</label>
                    <input
                      type="text"
                      value={selectedCarForEdit.numberPlate || ''}
                      onChange={(e) => setSelectedCarForEdit(prev => ({ ...prev, numberPlate: e.target.value }))}
                      className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowEditCarModal(false)}
                    className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Salesperson Modal */}
        {showEditSalespersonModal && selectedSalespersonForEdit && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-lg w-full">
              <h2 className="text-xl font-semibold mb-4 text-gray-100">Edit Salesperson</h2>
              <form onSubmit={handleEditSalespersonSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300">Name</label>
                    <input
                      type="text"
                      value={selectedSalespersonForEdit.name}
                      onChange={(e) => setSelectedSalespersonForEdit(prev => ({ ...prev, name: e.target.value }))}
                      className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300">Mobile Number</label>
                    <input
                      type="text"
                      value={selectedSalespersonForEdit.mobileNumber || ''}
                      onChange={(e) => setSelectedSalespersonForEdit(prev => ({ ...prev, mobileNumber: e.target.value }))}
                      className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowEditSalespersonModal(false)}
                    className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard; 