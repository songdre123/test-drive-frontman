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
  } = useFirebaseData(setLoadError);
  const { addToast } = useToast();

  const [carOrder, setCarOrder] = useState([]);
  const [salespeopleOrder, setSalespeopleOrder] = useState([]);
  const [roundRobinOrder, setRoundRobinOrder] = useState([]);
  const [eventRoundRobin, setEventRoundRobin] = useState([]);

  // Initialize orders from Firestore settings
  useEffect(() => {
    console.log('Starting settings/orders listener setup...');
    setIsLoading(true);
    let isMounted = true;
    const timeoutId = setTimeout(() => {
      if (isMounted) {
        console.error('Orders loading timeout after 10 seconds');
        setLoadError?.('Failed to load orders: Connection timed out');
        setIsLoading(false);
      }
    }, 10000);

    const unsubscribe = onSnapshot(
      doc(db, 'settings', 'orders'),
      (doc) => {
        if (!isMounted) {
          console.log('Settings/orders listener ignored (unmounted)');
          return;
        }
        console.log('Settings/orders snapshot received:', {
          exists: doc.exists(),
          data: doc.exists() ? doc.data() : null,
        });
        try {
          if (doc.exists()) {
            const data = doc.data();
            setCarOrder(data.carOrder || cars.map((c) => c.id));
            setSalespeopleOrder(data.salespeopleOrder || salespeople.map((s) => s.id.toString()));
            setRoundRobinOrder(data.roundRobinOrder || []);
            setEventRoundRobin(data.eventRoundRobin || []);
          } else {
            console.log('Settings/orders document does not exist, using defaults');
            setCarOrder(cars.map((c) => c.id));
            setSalespeopleOrder(salespeople.map((s) => s.id.toString()));
          }
          setIsLoading(false);
          console.log('Set isLoading to false (successful fetch)');
          clearTimeout(timeoutId);
        } catch (error) {
          console.error('Orders listener processing error:', error);
          setLoadError?.('Failed to process orders');
          setIsLoading(false);
          console.log('Set isLoading to false (processing error)');
          clearTimeout(timeoutId);
        }
      },
      (error) => {
        console.error('Orders snapshot error:', error);
        setLoadError?.('Failed to connect to orders: ' + error.message);
        setIsLoading(false);
        console.log('Set isLoading to false (snapshot error)');
        clearTimeout(timeoutId);
      }
    );

    return () => {
      console.log('Cleaning up settings/orders listener');
      isMounted = false;
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, [cars, salespeople, addToast, setIsLoading, setLoadError]);

  // Save orders to Firestore
  const saveOrders = useCallback(async () => {
    try {
      await updateSettingsInFirestore({
        carOrder,
        salespeopleOrder,
        roundRobinOrder,
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

  // Get next salesperson for round-robin
  const getNextSalesperson = useCallback(() => {
    const availableSalespeople = currentMode === 'event'
      ? salespeople.filter((sp) => eventRoundRobin.includes(sp.id))
      : salespeople.filter((sp) => {
          const team = teams.find((t) => t.id === selectedTeamId);
          return team?.salespersonIds.includes(sp.id) && sp.isOnDuty;
        });

    if (!availableSalespeople.length) {
      return { id: null, name: 'No one available' };
    }

    const currentOrder = currentMode === 'event' ? eventRoundRobin : roundRobinOrder;
    const nextIndex = currentOrder.length > 0
      ? (currentOrder.findIndex((id) => availableSalespeople.some((sp) => sp.id === id)) + 1) % currentOrder.length
      : 0;
    const nextId = currentOrder[nextIndex] || availableSalespeople[0].id;
    return salespeople.find((sp) => sp.id === nextId) || availableSalespeople[0];
  }, [currentMode, salespeople, eventRoundRobin, roundRobinOrder, selectedTeamId, teams]);

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
    await updateDoc(doc(db, 'cars', carId), { available: false });
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
  }, [cars, salespeople, currentMode, eventRoundRobin, roundRobinOrder]);

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

  // Return car
  const handleReturnCar = useCallback(async (carId) => {
    const booking = activeBookings.find((b) => b.carId === carId);
    if (booking) {
      await updateDoc(doc(db, 'bookings', booking.id), {
        status: 'completed',
        completedAt: getSingaporeTime(),
      });
    }
    const walkin = walkins.find((w) => w.carId === carId && !w.testDriveCompleted);
    if (walkin) {
      await updateDoc(doc(db, 'walkins', walkin.id), {
        testDriveCompleted: true,
      });
    }
    await updateDoc(doc(db, 'cars', carId.toString()), { available: true });
  }, [activeBookings, walkins]);

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

  // Process queue
  const handleProcessQueue = useCallback(async (carId) => {
    const car = cars.find((c) => c.id === carId);
    if (!car || !car.queue?.length) return;
    const nextInQueue = car.queue[0];
    const sp = salespeople.find((s) => s.id === nextInQueue.salespersonId);
    if (!sp) return;
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
    await updateDoc(doc(db, 'cars', carId.toString()), {
      available: false,
      queue: car.queue.slice(1),
    });
  }, [cars, salespeople]);

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
    setRoundRobinOrder(newOrder);
  }, []);

  // Save event round-robin
  const saveEventRoundRobin = useCallback((newRobin) => {
    setEventRoundRobin(newRobin);
  }, []);

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