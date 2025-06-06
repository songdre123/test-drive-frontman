import { useState, useEffect, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../firebase';
import {
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  collection,
  addDoc,
  onSnapshot,
  getDoc,
} from 'firebase/firestore';
import { useFirebaseData } from './useFirebaseData';
import { useToast } from './useToast';
import { getSingaporeTime } from '../utils/dateUtils';
import { updateSettingsInFirestore } from '../utils/firebaseUtils';

export function useRoundRobin(setIsLoading, setLoadError) {
  const {
    currentMode,
    selectedTeamId,
    teams,
    cars,
    salespeople,
    activeBookings,
    walkins,
    setCars,
    setActiveBookings,
    setWalkins
  } = useFirebaseData(setLoadError, setIsLoading);
  const { addToast } = useToast();

  const [carOrder, setCarOrder] = useState([]);
  const [salespeopleOrder, setSalespeopleOrder] = useState([]);
  const [roundRobinOrder, setRoundRobinOrder] = useState([]);
  const [eventRoundRobin, setEventRoundRobin] = useState([]);

  // Initialize orders from Firestore settings
  useEffect(() => {
    console.log('[useRoundRobin] Starting settings/orders listener setup...');
    let isMounted = true;

    const unsubscribe = onSnapshot(
      doc(db, 'settings', 'orders'),
      (doc) => {
        if (!isMounted) {
          console.log('[useRoundRobin] Settings/orders listener ignored (unmounted)');
          return;
        }
        console.log('[useRoundRobin] Settings/orders snapshot received:', {
          exists: doc.exists(),
          data: doc.exists() ? doc.data() : null,
        });
        try {
          if (doc.exists()) {
            const data = doc.data();
            setCarOrder(Array.isArray(data.carOrder) ? data.carOrder : cars.map((c) => c.id));
            setSalespeopleOrder(Array.isArray(data.salespeopleOrder) ? data.salespeopleOrder : salespeople.map((s) => s.id.toString()));
            setRoundRobinOrder(Array.isArray(data.dayToDayRoundRobin) ? data.dayToDayRoundRobin : []);
            setEventRoundRobin(Array.isArray(data.eventRoundRobin) ? data.eventRoundRobin : []);
          } else {
            console.log('[useRoundRobin] Settings/orders document does not exist, using defaults');
            setCarOrder(cars.map((c) => c.id));
            setSalespeopleOrder(salespeople.map((s) => s.id.toString()));
          }
        } catch (error) {
          console.error('[useRoundRobin] Orders listener processing error:', error);
          setLoadError?.('Failed to process orders');
        }
      },
      (error) => {
        console.error('[useRoundRobin] Orders snapshot error:', error);
        setLoadError?.('Failed to connect to orders: ' + error.message);
      }
    );

    return () => {
      console.log('[useRoundRobin] Cleaning up settings/orders listener');
      isMounted = false;
      unsubscribe();
    };
  }, [cars, salespeople, addToast, setLoadError]);

  // Save orders to Firestore
  const saveOrders = useCallback(async () => {
    try {
      await updateSettingsInFirestore({
        carOrder,
        salespeopleOrder,
        dayToDayRoundRobin: roundRobinOrder,
        eventRoundRobin,
      });
    } catch (error) {
      addToast('Failed to save settings', 'error');
    }
  }, [carOrder, salespeopleOrder, roundRobinOrder, eventRoundRobin, addToast]);

  useEffect(() => {
    if (carOrder.length > 0 || salespeopleOrder.length > 0) {
      saveOrders();
    }
  }, [carOrder, salespeopleOrder, roundRobinOrder, eventRoundRobin, saveOrders]);

  // Update round-robin order when team is selected
  useEffect(() => {
    console.log('Team selection effect triggered:', {
      currentMode,
      selectedTeamId,
      currentRoundRobinOrder: roundRobinOrder,
      teams: teams.map(t => ({ id: t.id, name: t.name, salespersonIds: t.salespersonIds }))
    });

    if (currentMode === 'day-to-day' && selectedTeamId) {
      const team = teams.find(t => t.id === selectedTeamId);
      console.log('Found team:', team);
      
      if (team) {
        // Initialize round-robin order with team members
        const teamMemberIds = Array.isArray(team.salespersonIds) ? team.salespersonIds : [];
        console.log('Team member IDs:', teamMemberIds);
        
        // Always update the round-robin order with team members
        console.log('Updating round-robin order with team members');
        setRoundRobinOrder(teamMemberIds);
        
        // Save to Firebase immediately
        updateSettingsInFirestore({
          carOrder,
          salespeopleOrder,
          dayToDayRoundRobin: teamMemberIds,
          eventRoundRobin,
        }).then(() => {
          console.log('Successfully saved day-to-day round-robin order to Firebase');
        }).catch(error => {
          console.error('Failed to save day-to-day round-robin order:', error);
          addToast('Failed to save round-robin order', 'error');
        });
      }
    } else if (currentMode === 'day-to-day' && !selectedTeamId) {
      console.log('No team selected, clearing round-robin order');
      // Clear round-robin order when no team is selected
      setRoundRobinOrder([]);
      // Save to Firebase immediately
      updateSettingsInFirestore({
        carOrder,
        salespeopleOrder,
        dayToDayRoundRobin: [],
        eventRoundRobin,
      }).then(() => {
        console.log('Successfully cleared day-to-day round-robin order in Firebase');
      }).catch(error => {
        console.error('Failed to clear day-to-day round-robin order:', error);
        addToast('Failed to clear round-robin order', 'error');
      });
    }
  }, [currentMode, selectedTeamId, teams, carOrder, salespeopleOrder, eventRoundRobin, addToast]);

  // Get next salesperson for round-robin
  const getNextSalesperson = useCallback(() => {
    console.log('getNextSalesperson called with:', {
      currentMode,
      selectedTeamId,
      eventRoundRobin,
      roundRobinOrder,
      salespeople: salespeople.map(sp => ({ id: sp.id, name: sp.name, isOnDuty: sp.isOnDuty }))
    });

    const currentOrder = currentMode === 'event' ? eventRoundRobin : roundRobinOrder;
    console.log('Current round-robin order:', currentOrder);

    if (!Array.isArray(currentOrder) || currentOrder.length === 0) {
      console.log('No round-robin order defined');
      return { id: null, name: 'No one available' };
    }

    // Get salespeople who are both in the round-robin order and on duty
    const availableSalespeople = salespeople.filter(sp => {
      const isInRoundRobin = currentOrder.includes(sp.id.toString());
      const isAvailable = isInRoundRobin && sp.isOnDuty;
      console.log('Checking salesperson:', {
        name: sp.name,
        id: sp.id,
        isInRoundRobin,
        isOnDuty: sp.isOnDuty,
        isAvailable
      });
      return isAvailable;
    });

    console.log('Available salespeople:', availableSalespeople.map(sp => ({ id: sp.id, name: sp.name })));

    if (!availableSalespeople.length) {
      console.log('No available salespeople found');
      return { id: null, name: 'No one available' };
    }

    // Find the first available salesperson in the current order
    const nextSalesperson = currentOrder
      .map(id => {
        const sp = availableSalespeople.find(sp => sp.id.toString() === id.toString());
        console.log('Checking order ID:', id, 'Found:', sp?.name);
        return sp;
      })
      .find(sp => sp !== undefined);

    console.log('Next salesperson:', nextSalesperson?.name || 'Not found in order, using first available');
    return nextSalesperson || availableSalespeople[0];
  }, [currentMode, salespeople, eventRoundRobin, roundRobinOrder, selectedTeamId, teams]);

  // Process queue
  const handleProcessQueue = useCallback(async (carId) => {
    console.log('Processing queue for car:', carId);
    const car = cars.find((c) => c.id === carId);
    if (!car) {
      console.log('Car not found');
      return;
    }
    if (!car.queue?.length) {
      console.log('No queue for car');
      return;
    }

    const nextInQueue = car.queue[0];
    console.log('Next in queue:', nextInQueue);

    const sp = salespeople.find((s) => s.id === nextInQueue.salespersonId);
    if (!sp) {
      console.log('Salesperson not found');
      return;
    }

    try {
      const booking = {
        id: uuidv4(),
        carId: car.id,
        carModel: car.model,
        carNumberPlate: car.numberPlate,
        salespersonId: sp.id,
        salespersonName: sp.name,
        timestamp: getSingaporeTime(),
        status: 'active',
      };

      // Add booking to Firestore
      await addDoc(collection(db, 'bookings'), booking);
      console.log('Booking added:', booking.id);

      // Update car in Firestore
      await updateDoc(doc(db, 'cars', carId.toString()), {
        available: false,
        queue: car.queue.slice(1),
        currentBookingId: booking.id, // Set current booking ID on the car
        currentWalkinId: null, // Ensure walkin ID is null
      });
      console.log('Car updated:', carId);

      // Update local state immediately
      setCars(prevCars => prevCars.map(c =>
        c.id === carId
          ? { ...c, available: false, queue: car.queue.slice(1), booking, walkin: null } // Attach the new booking object
          : c
      ));
      setActiveBookings(prevBookings => [...prevBookings, booking]);


      // Update round-robin order if in day-to-day mode
      if (currentMode === 'day-to-day') {
        const newRoundRobin = [...roundRobinOrder];
        const index = newRoundRobin.indexOf(sp.id.toString());
        if (index !== -1) {
          newRoundRobin.splice(index, 1);
          newRoundRobin.push(sp.id.toString());
          setRoundRobinOrder(newRoundRobin);
          // Save to Firebase
          await updateSettingsInFirestore({
            carOrder,
            salespeopleOrder,
            dayToDayRoundRobin: newRoundRobin,
            eventRoundRobin,
          });
          console.log('Day-to-day round robin updated and saved:', newRoundRobin);
        }
      }

      addToast('Queue processed successfully', 'success');
      console.log('Successfully processed queue for car:', carId);
    } catch (error) {
      console.error('Error processing queue for car:', carId, error);
      addToast('Failed to process queue', 'error');
    }
  }, [cars, salespeople, addToast, currentMode, roundRobinOrder, carOrder, salespeopleOrder, eventRoundRobin, setCars, setActiveBookings, setRoundRobinOrder]);

  // Handle returning a car
  const handleReturnCar = useCallback(async (carId) => {
    console.log('Attempting to return car:', carId);
    const carRef = doc(db, 'cars', carId.toString());

    try {
      const carSnapshot = await getDoc(carRef);
      if (!carSnapshot.exists()) {
        console.error('Car document not found for ID:', carId);
        addToast('Car not found', 'error');
        // Still attempt to make the car available in local state if possible
        setCars(prevCars => prevCars.map(c => c.id === carId ? { ...c, available: true, booking: null, walkin: null, queue: [] } : c));
        setActiveBookings(prevBookings => prevBookings.filter(b => b.carId !== carId || b.status !== 'active'));
        setWalkins(prevWalkins => prevWalkins.filter(w => w.carId !== carId || w.testDriveCompleted));
        return;
      }

      const carData = carSnapshot.data();
      let bookingHandled = false;
      let walkinHandled = false;

      // Find and update associated booking if it exists and is active
      const booking = activeBookings.find(b => b.carId === carId && b.status === 'active');
      if (booking) {
        console.log('Found active booking to update:', booking.id);
        const bookingRef = doc(db, 'bookings', booking.id);
        try {
          await updateDoc(bookingRef, { status: 'completed' });
          console.log('Booking status updated to completed:', booking.id);
          bookingHandled = true;

          // Add salesperson back to round robin if in day-to-day mode
          if (currentMode === 'day-to-day') {
            const salespersonId = booking.salespersonId;
            if (salespersonId && !roundRobinOrder.includes(salespersonId)) {
              const newRoundRobinOrder = [...roundRobinOrder, salespersonId];
              setRoundRobinOrder(newRoundRobinOrder);
              updateSettingsInFirestore({ dayToDayRoundRobin: newRoundRobinOrder });
              console.log('Salesperson added back to day-to-day round robin:', salespersonId);
            }
          }

        } catch (error) {
          console.error('Error updating booking status:', booking.id, error);
          addToast(`Failed to complete booking ${booking.id}`, 'error');
          // Continue attempting to free up the car despite booking update error
        }
      }

      // Find and update associated walk-in if it exists and is not completed
      const walkin = walkins.find(w => w.carId === carId && !w.testDriveCompleted);
      if (walkin) {
        console.log('Found walk-in to update:', walkin.id);
        const walkinRef = doc(db, 'walkins', walkin.id);
        try {
          await updateDoc(walkinRef, { testDriveCompleted: true });
          console.log('Walk-in status updated to completed:', walkin.id);
          walkinHandled = true;

          // Add salesperson back to round robin if in day-to-day mode
          if (currentMode === 'day-to-day') {
            const salespersonId = walkin.salespersonId;
            if (salespersonId && !roundRobinOrder.includes(salespersonId)) {
              const newRoundRobinOrder = [...roundRobinOrder, salespersonId];
              setRoundRobinOrder(newRoundRobinOrder);
              updateSettingsInFirestore({ dayToDayRoundRobin: newRoundRobinOrder });
              console.log('Salesperson added back to day-to-day round robin (walk-in):', salespersonId);
            }
          }

        } catch (error) {
          console.error('Error updating walk-in status:', walkin.id, error);
          addToast(`Failed to complete walk-in ${walkin.id}`, 'error');
          // Continue attempting to free up the car despite walk-in update error
        }
      }

      // Process the queue or make the car available
      if (carData.queue?.length > 0) {
        console.log('Queue exists, processing next in queue');
        // handleProcessQueue already updates car state and queue in Firebase
        // and it also calls updateSettingsInFirestore if in day-to-day mode
        await handleProcessQueue(carId);
      } else {
        console.log('No queue, making car available and clearing booking/walk-in');
        await updateDoc(carRef, {
          available: true,
          // Ensure any residual booking/walkin data on car document is cleared
          currentBookingId: null,
          currentWalkinId: null,
        });

        // Manually update local state after Firebase update
        setCars(prevCars => prevCars.map(c => c.id === carId ? { ...c, available: true, booking: null, walkin: null, queue: [] } : c));
        // Remove completed booking/walkin from local state
        setActiveBookings(prevBookings => prevBookings.filter(b => b.carId !== carId || b.status !== 'active'));
        setWalkins(prevWalkins => prevWalkins.filter(w => w.carId !== carId || w.testDriveCompleted));
        console.log('Car made available in Firebase and local state:', carId);
      }

      // Toast notification for successful return
      if (bookingHandled || walkinHandled || carData.queue?.length === 0) {
         addToast(`Car ${carData.model} returned successfully`, 'success');
      }

    } catch (error) {
      console.error('Error returning car:', carId, error);
      addToast('Failed to return car', 'error');

      // Attempt to make the car available in local state even on error
      setCars(prevCars => prevCars.map(c => c.id === carId ? { ...c, available: true, booking: null, walkin: null, queue: [] } : c));
      setActiveBookings(prevBookings => prevBookings.filter(b => b.carId !== carId || b.status !== 'active'));
      setWalkins(prevWalkins => prevWalkins.filter(w => w.carId !== carId || w.testDriveCompleted));
    }
  }, [activeBookings, walkins, cars, roundRobinOrder, currentMode, handleProcessQueue, addToast, setCars, setActiveBookings, setWalkins, setRoundRobinOrder]);

  // Booking submission
  const handleBookingSubmit = useCallback(async (formData) => {
    const { carId, salespersonId } = formData;
    const car = cars.find((c) => c.id === parseInt(carId));
    const sp = salespeople.find((s) => s.id === parseInt(salespersonId));
    if (!car || !sp) {
      throw new Error('Invalid car or salesperson');
    }
    if (!car.available) {
      throw new Error('Car is not available');
    }
    const booking = {
      id: uuidv4(),
      carId: car.id,
      carModel: car.model,
      carNumberPlate: car.numberPlate,
      salespersonId: sp.id,
      salespersonName: sp.name,
      timestamp: getSingaporeTime(),
      status: 'active',
    };
    await addDoc(collection(db, 'bookings'), booking);
    await updateDoc(doc(db, 'cars', carId.toString()), { available: false });
    
    // Remove salesperson from round-robin when booking
    if (currentMode === 'day-to-day') {
      const newRoundRobin = [...roundRobinOrder];
      const index = newRoundRobin.indexOf(sp.id.toString());
      if (index !== -1) {
        newRoundRobin.splice(index, 1);
        setRoundRobinOrder(newRoundRobin);
        // Save to Firebase
        await updateSettingsInFirestore({
          carOrder,
          salespeopleOrder,
          dayToDayRoundRobin: newRoundRobin,
          eventRoundRobin,
        });
      }
    }
  }, [cars, salespeople, currentMode, roundRobinOrder, carOrder, salespeopleOrder, eventRoundRobin]);

  // Record walk-in
  const handleRecordWalkIn = useCallback(async (formData) => {
    const { carId, walkInTime } = formData;
    const sp = getNextSalesperson();
    if (!sp.id) {
      throw new Error('No available salesperson');
    }
    const walkIn = {
      id: uuidv4(),
      salespersonId: sp.id,
      salespersonName: sp.name,
      walkInTime,
      testDriveCompleted: false,
    };
    if (carId) {
      const car = cars.find((c) => c.id === parseInt(carId));
      if (!car || !car.available) {
        throw new Error('Car is not available');
      }
      walkIn.carId = car.id;
      walkIn.carModel = car.model;
      walkIn.carNumberPlate = car.numberPlate;
      await updateDoc(doc(db, 'cars', carId), { available: false });
    }
    await addDoc(collection(db, 'walkins'), walkIn);
    if (currentMode === 'event') {
      const newEventRobin = [...eventRoundRobin];
      const index = newEventRobin.indexOf(sp.id);
      if (index !== -1) {
        newEventRobin.splice(index, 1);
        newEventRobin.push(sp.id);
        setEventRoundRobin(newEventRobin);
      }
    } else {
      const newRoundRobin = [...roundRobinOrder];
      const index = newRoundRobin.indexOf(sp.id);
      if (index !== -1) {
        newRoundRobin.splice(index, 1);
        newRoundRobin.push(sp.id);
        setRoundRobinOrder(newRoundRobin);
      }
    }
  }, [cars, getNextSalesperson, currentMode, eventRoundRobin, roundRobinOrder]);

  // Toggle test drive status
  const handleToggleTestDrive = useCallback(async (walkinId) => {
    const walkin = walkins.find((w) => w.id === walkinId);
    if (!walkin) return;
    await updateDoc(doc(db, 'walkins', walkinId), {
      testDriveCompleted: !walkin.testDriveCompleted,
    });
    if (walkin.carId && walkin.testDriveCompleted) {
      await updateDoc(doc(db, 'cars', walkin.carId.toString()), { available: true });
    }
  }, [walkins]);

  // Toggle car availability
  const handleToggleCarAvailability = useCallback(async (carId) => {
    const car = cars.find((c) => c.id === carId);
    if (!car) return;
    await updateDoc(doc(db, 'cars', carId.toString()), {
      available: !car.available,
    });
  }, [cars]);

  // Move car order
  const handleMoveCarOrder = useCallback((carId, direction) => {
    const index = carOrder.indexOf(carId);
    if (index === -1) return;
    const newOrder = [...carOrder];
    if (direction === 'up' && index > 0) {
      [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
    } else if (direction === 'down' && index < newOrder.length - 1) {
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    }
    setCarOrder(newOrder);
  }, [carOrder]);

  // Remove from queue
  const handleRemoveFromQueue = useCallback(async (carId, salespersonId) => {
    const car = cars.find((c) => c.id === carId);
    if (!car) return;
    const newQueue = car.queue.filter((q) => q.salespersonId !== salespersonId);
    await updateDoc(doc(db, 'cars', carId.toString()), { queue: newQueue });
  }, [cars]);

  // Toggle salesperson duty
  const handleToggleDuty = useCallback(async (salespersonId) => {
    const sp = salespeople.find((s) => s.id === salespersonId);
    if (!sp) return;
    await updateDoc(doc(db, 'salespeople', salespersonId.toString()), {
      isOnDuty: !sp.isOnDuty,
    });
  }, [salespeople]);

  // Move salesperson order
  const handleMoveSalespersonOrder = useCallback((salespersonId, direction) => {
    const index = salespeopleOrder.indexOf(salespersonId.toString());
    if (index === -1) return;
    const newOrder = [...salespeopleOrder];
    if (direction === 'up' && index > 0) {
      [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
    } else if (direction === 'down' && index < newOrder.length - 1) {
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    }
    setSalespeopleOrder(newOrder);
  }, [salespeopleOrder]);

  // Delete salesperson
  const handleDeleteSalesperson = useCallback(async (salespersonId) => {
    await deleteDoc(doc(db, 'salespeople', salespersonId.toString()));
    setSalespeopleOrder((prev) => prev.filter((id) => id !== salespersonId.toString()));
    setRoundRobinOrder((prev) => prev.filter((id) => id !== salespersonId));
    setEventRoundRobin((prev) => prev.filter((id) => id !== salespersonId));
  }, []);

  // Move salesperson in round-robin
  const handleMoveSalesperson = useCallback((newOrder) => {
    console.log('Moving salesperson in round-robin:', {
      currentMode,
      newOrder,
      currentRoundRobinOrder: roundRobinOrder,
      currentEventRoundRobin: eventRoundRobin
    });

    if (currentMode === 'day-to-day') {
      // In day-to-day mode, ensure the new order only contains team members
      if (selectedTeamId) {
        const team = teams.find(t => t.id === selectedTeamId);
        if (team) {
          const teamMemberIds = Array.isArray(team.salespersonIds) ? team.salespersonIds : [];
          const filteredOrder = newOrder.filter(id => teamMemberIds.includes(id));
          console.log('Filtered day-to-day round-robin order:', filteredOrder);
          setRoundRobinOrder(filteredOrder);
          // Save to Firebase immediately
          updateSettingsInFirestore({
            carOrder,
            salespeopleOrder,
            dayToDayRoundRobin: filteredOrder,
            eventRoundRobin,
          }).then(() => {
            console.log('Successfully saved day-to-day round-robin order to Firebase');
          }).catch(error => {
            console.error('Failed to save day-to-day round-robin order:', error);
            addToast('Failed to save round-robin order', 'error');
          });
        }
      } else {
        // No team selected, just update the round-robin order
        setRoundRobinOrder(newOrder);
        // Save to Firebase immediately
        updateSettingsInFirestore({
          carOrder,
          salespeopleOrder,
          dayToDayRoundRobin: newOrder,
          eventRoundRobin,
        }).then(() => {
          console.log('Successfully saved round-robin order to Firebase');
        }).catch(error => {
          console.error('Failed to save round-robin order:', error);
          addToast('Failed to save round-robin order', 'error');
        });
      }
    } else {
      // In event mode, update event round-robin
      setEventRoundRobin(newOrder);
      // Save to Firebase immediately
      updateSettingsInFirestore({
        carOrder,
        salespeopleOrder,
        dayToDayRoundRobin: roundRobinOrder,
        eventRoundRobin: newOrder,
      }).then(() => {
        console.log('Successfully saved event round-robin to Firebase');
      }).catch(error => {
        console.error('Failed to save event round-robin:', error);
        addToast('Failed to save event round-robin', 'error');
      });
    }
  }, [currentMode, selectedTeamId, teams, carOrder, salespeopleOrder, eventRoundRobin, roundRobinOrder, addToast]);

  // Save event round-robin
  const saveEventRoundRobin = useCallback((newRobin) => {
    console.log('Saving event round-robin:', newRobin);
    setEventRoundRobin(newRobin);
    // Save to Firebase immediately
    updateSettingsInFirestore({
      carOrder,
      salespeopleOrder,
      dayToDayRoundRobin: roundRobinOrder,
      eventRoundRobin: newRobin,
    }).then(() => {
      console.log('Successfully saved event round-robin to Firebase');
    }).catch(error => {
      console.error('Failed to save event round-robin:', error);
      addToast('Failed to save event round-robin', 'error');
    });
  }, [carOrder, salespeopleOrder, roundRobinOrder, addToast]);

  // Add car
  const handleAddCar = useCallback(async ({ newCarModel, newCarNumberPlate }) => {
    const newCar = {
      id: Math.max(...cars.map((c) => c.id), 0) + 1,
      model: newCarModel,
      numberPlate: newCarNumberPlate || null,
      available: true,
      queue: [],
    };
    await setDoc(doc(db, 'cars', newCar.id.toString()), newCar);
    setCarOrder((prev) => [...prev, newCar.id]);
  }, [cars]);

  // Delete car
  const handleDeleteCar = useCallback(async (carId) => {
    await deleteDoc(doc(db, 'cars', carId.toString()));
    setCarOrder((prev) => prev.filter((id) => id !== carId));
  }, []);

  // Add salesperson
  const handleAddSalesperson = useCallback(async ({ newSalesperson, newSalespersonMobile }) => {
    const newSp = {
      id: Math.max(...salespeople.map((s) => s.id), 0) + 1,
      name: newSalesperson,
      mobileNumber: newSalespersonMobile || null,
      isOnDuty: true,
    };
    await setDoc(doc(db, 'salespeople', newSp.id.toString()), newSp);
    setSalespeopleOrder((prev) => [...prev, newSp.id.toString()]);
  }, [salespeople]);

  return useMemo(() => ({
    cars,
    carOrder,
    salespeople,
    salespeopleOrder,
    roundRobinOrder,
    activeBookings,
    walkins,
    eventRoundRobin,
    handleToggleCarAvailability,
    handleReturnCar,
    handleMoveCarOrder,
    handleProcessQueue,
    handleRemoveFromQueue,
    handleToggleDuty,
    handleMoveSalespersonOrder,
    handleDeleteSalesperson,
    handleMoveSalesperson,
    saveEventRoundRobin,
    handleBookingSubmit,
    handleRecordWalkIn,
    handleToggleTestDrive,
    getNextSalesperson,
    handleAddCar,
    handleDeleteCar,
    handleAddSalesperson,
  }), [
    cars,
    carOrder,
    salespeople,
    salespeopleOrder,
    roundRobinOrder,
    activeBookings,
    walkins,
    eventRoundRobin,
    handleToggleCarAvailability,
    handleReturnCar,
    handleMoveCarOrder,
    handleProcessQueue,
    handleRemoveFromQueue,
    handleToggleDuty,
    handleMoveSalespersonOrder,
    handleDeleteSalesperson,
    handleMoveSalesperson,
    saveEventRoundRobin,
    handleBookingSubmit,
    handleRecordWalkIn,
    handleToggleTestDrive,
    getNextSalesperson,
    handleAddCar,
    handleDeleteCar,
    handleAddSalesperson,
  ]);
}