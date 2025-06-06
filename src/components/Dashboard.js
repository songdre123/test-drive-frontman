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
  handleRemoveFromRoundRobin, 
  handleProcessQueue, 
  handleMarkCarUnavailable, 
  handleAddToRoundRobin, 
  setCars,
  setActiveBookings
}) {
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [formData, setFormData] = useState({
    carId: '',
    salespersonId: '',
  });
  const [selectedCar, setSelectedCar] = useState(null);
  const [showQueueModal, setShowQueueModal] = useState(false);
  const [isRoundRobinDropDisabled, setIsRoundRobinDropDisabled] = useState(false);
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
      const selectedCar = cars.find(car => String(car.id) === String(formData.carId));
      if (!selectedCar) {
        throw new Error('Car not found');
      }

      const selectedSalesperson = salespeople.find(sp => String(sp.id) === String(formData.salespersonId));
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
      await updateDoc(doc(db, "cars", String(selectedCar.id)), {
        queue: updatedCar.queue
      });

      // Update local state
      setCars(prev => prev.map(car => 
        String(car.id) === String(selectedCar.id) ? updatedCar : car
      ));

      setShowBookingForm(false);
      setFormData({ carId: '', salespersonId: '' });
      addToast('Added to car queue successfully', 'success');
    } catch (error) {
      console.error('Booking submission error:', error);
      addToast(error.message || 'Failed to add to queue', 'error');
    }
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const { source, destination } = result;
    const newOrder = Array.from(roundRobinOrder);
    const [removed] = newOrder.splice(source.index, 1);
    newOrder.splice(destination.index, 0, removed);

    setRoundRobinOrder(newOrder);
    
    try {
      await updateDoc(doc(db, "settings", "config"), {
        roundRobinOrder: newOrder
      });
      addToast('Round robin order updated', 'success');
    } catch (error) {
      console.error('Error updating round robin order:', error);
      addToast('Failed to update round robin order', 'error');
    }
  };

  const handleMoveSalesperson = async (spId, direction) => {
    const currentIndex = roundRobinOrder.indexOf(spId);
    if (currentIndex === -1) return;

    const newOrder = [...roundRobinOrder];
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (newIndex < 0 || newIndex >= newOrder.length) return;

    [newOrder[currentIndex], newOrder[newIndex]] = [newOrder[newIndex], newOrder[currentIndex]];
    setRoundRobinOrder(newOrder);

    try {
      await updateDoc(doc(db, "settings", "config"), {
        roundRobinOrder: newOrder
      });
      addToast('Round robin order updated', 'success');
    } catch (error) {
      console.error('Error updating round robin order:', error);
      addToast('Failed to update round robin order', 'error');
    }
  };

  const handleReturnCar = async (carId) => {
    try {
      const car = cars.find(c => String(c.id) === String(carId));
      if (!car) {
        throw new Error('Car not found');
      }

      // Find the active booking for this car
      const activeBooking = activeBookings.find(b => String(b.carId) === String(carId));
      if (activeBooking) {
        // Mark booking as completed in Firestore
        await updateDoc(doc(db, "bookings", String(activeBooking.id)), {
          status: 'completed',
          completedAt: Date.now()
        });

        // Update local state for bookings
        setActiveBookings(prev => prev.filter(b => String(b.id) !== String(activeBooking.id)));
      }

      // Update car status in Firestore
      await updateDoc(doc(db, "cars", String(carId)), {
        available: true
      });

      // Update local state for cars
      setCars(prev => prev.map(c => 
        String(c.id) === String(carId) ? { ...c, available: true } : c
      ));

      addToast('Car marked as available', 'success');
    } catch (error) {
      console.error('Error returning car:', error);
      addToast('Failed to mark car as available', 'error');
    }
  };

  const handleShowQueue = (car) => {
    setSelectedCarForQueue(car);
    setShowQueueModal(true);
  };

  const handleProcessQueueAndClose = async (carId) => {
    try {
      await handleProcessQueue(carId);
      setShowQueueModal(false);
    } catch (error) {
      console.error('Error processing queue:', error);
    }
  };

  const handleRemoveFromQueue = async (carId, queueIndex) => {
    try {
      const car = cars.find(c => c.id === carId);
      if (!car) {
        throw new Error('Car not found');
      }

      const newQueue = car.queue.filter((_, index) => index !== queueIndex);
      
      // Update car in Firestore
      await updateDoc(doc(db, "cars", carId.toString()), {
        queue: newQueue
      });

      // Update local state
      setCars(prev => prev.map(c => 
        c.id === carId ? { ...c, queue: newQueue } : c
      ));

      // Update selected car for queue modal
      setSelectedCarForQueue(prev => prev ? { ...prev, queue: newQueue } : null);

      addToast('Removed from queue', 'success');
    } catch (error) {
      console.error('Error removing from queue:', error);
      addToast('Failed to remove from queue', 'error');
    }
  };

  const renderCarCard = (car, isAvailable = true) => {
    const activeBooking = activeBookings.find(b => b.carId === car.id);
    return (
      <div
        key={`car-${car.id}`}
        className={`p-4 rounded-lg ${
          isAvailable ? 'bg-gray-700' : 'bg-gray-600'
        }`}
      >
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold">{car.model}</h3>
            <p className="text-sm text-gray-400">
              {car.numberPlate || 'No plate'}
            </p>
            {!isAvailable && activeBooking && (
              <div className="mt-2 text-sm">
                <p className="text-gray-300">
                  With: {activeBooking.salespersonName}
                </p>
                <p className="text-gray-400">
                  Since: {new Date(activeBooking.timestamp).toLocaleTimeString()}
                </p>
              </div>
            )}
          </div>
          <div className="flex space-x-2">
            {isAvailable ? (
              <>
                <button
                  onClick={() => handleMarkCarUnavailable(car.id)}
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                >
                  Mark Unavailable
                </button>
                <button
                  onClick={() => handleShowQueue(car)}
                  className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                >
                  Queue ({car.queue?.length || 0})
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
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <button
          onClick={() => setShowBookingForm(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          New Booking
        </button>
      </div>

      <div className="bg-gray-800 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-semibold mb-2">Next in Round-Robin</h3>
        {roundRobinOrder.length > 0 ? (
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xl font-medium">
                {salespeople.find(sp => sp.id === roundRobinOrder[0])?.name || 'No salespeople'}
              </span>
              <p className="text-sm text-gray-400">
                {salespeople.find(sp => sp.id === roundRobinOrder[0])?.mobileNumber || ''}
              </p>
            </div>
            <div className="flex space-x-2">
              {salespeople.find(sp => sp.id === roundRobinOrder[0])?.mobileNumber && (
                <a
                  href={`https://wa.me/65${salespeople.find(sp => sp.id === roundRobinOrder[0])?.mobileNumber.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  WhatsApp
                </a>
              )}
              <button
                onClick={() => {
                  const newOrder = [...roundRobinOrder];
                  const first = newOrder.shift();
                  newOrder.push(first);
                  setRoundRobinOrder(newOrder);
                }}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Move to End
              </button>
            </div>
          </div>
        ) : (
          <p className="text-gray-400">No salespeople in round robin</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-xl font-semibold mb-4">Available Cars</h3>
          <div className="space-y-4">
            {cars
              .filter(car => car.available)
              .map(car => renderCarCard(car, true))}
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-4">Unavailable Cars</h3>
          <div className="space-y-4">
            {cars
              .filter(car => !car.available)
              .map(car => renderCarCard(car, false))}
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-4">Round Robin Order</h3>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="roundRobin">
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
                      isDragDisabled={isRoundRobinDropDisabled}
                    >
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="flex items-center p-3 bg-gray-700 rounded-md"
                        >
                          <div className="flex-grow">
                            <span className="font-medium">{salesperson.name}</span>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleMoveSalesperson(spId, 'up')}
                              disabled={index === 0}
                              className="bg-gray-600 text-white px-2 py-1 rounded hover:bg-gray-500 disabled:opacity-50"
                            >
                              ↑
                            </button>
                            <button
                              onClick={() => handleMoveSalesperson(spId, 'down')}
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
        </DragDropContext>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-4">Available Salespeople</h3>
        <div className="space-y-2">
          {salespeople
            .filter(sp => !roundRobinOrder.includes(sp.id))
            .map(sp => (
              <div
                key={sp.id}
                className="flex items-center justify-between p-3 bg-gray-700 rounded-md"
              >
                <div className="flex-grow">
                  <span className="font-medium">{sp.name}</span>
                  {sp.mobileNumber && (
                    <span className="text-sm text-gray-400 ml-2">
                      ({sp.mobileNumber})
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleAddToRoundRobin(sp.id)}
                  className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                >
                  Add to Round Robin
                </button>
              </div>
            ))}
        </div>
      </div>

      {showBookingForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Book a Test Drive</h3>
              <button
                onClick={() => setShowBookingForm(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <BookingForm
              cars={cars}
              salespeople={salespeople}
              formData={formData}
              handleChange={handleChange}
              handleSubmit={handleSubmit}
              onClose={() => setShowBookingForm(false)}
            />
          </div>
        </div>
      )}

      {showQueueModal && selectedCarForQueue && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">
                Queue for {selectedCarForQueue.model}
              </h3>
              <button
                onClick={() => setShowQueueModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2">
              {selectedCarForQueue.queue?.length > 0 ? (
                selectedCarForQueue.queue.map((item, index) => (
                  <div
                    key={`${selectedCarForQueue.id}-${item.salespersonId}-${item.timestamp}`}
                    className="flex items-center justify-between p-3 bg-gray-700 rounded-md"
                  >
                    <div>
                      <span className="font-medium">{item.salespersonName}</span>
                      <p className="text-sm text-gray-400">
                        Added: {new Date(item.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleProcessQueueAndClose(selectedCarForQueue.id)}
                        className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                      >
                        Process
                      </button>
                      <button
                        onClick={() => handleRemoveFromQueue(selectedCarForQueue.id, index)}
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center py-4">No one in queue</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard; 