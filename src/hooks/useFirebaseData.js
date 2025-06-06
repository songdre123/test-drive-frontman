import { useState, useCallback, useEffect, useRef } from 'react';
import { db } from '../firebase';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
} from 'firebase/firestore';
import { updateSettingsInFirestore } from '../utils/firebaseUtils';

export function useFirebaseData(setIsLoading, setLoadError) {
  const [currentMode, setCurrentMode] = useState('event');
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [teams, setTeams] = useState([]);
  const [cars, setCars] = useState([]);
  const [salespeople, setSalespeople] = useState([]);
  const [activeBookings, setActiveBookings] = useState([]);
  const [completedBookings, setCompletedBookings] = useState([]);
  const [walkins, setWalkins] = useState([]);
  
  // Add refs to track listener setup
  const listenersSetupRef = useRef(0);
  const listenersWithErrorRef = useRef(0);
  const isMountedRef = useRef(true);
  const totalListeners = 6; // settings, bookings, walkins, teams, cars, salespeople

  useEffect(() => {
    if (!setIsLoading) {
      console.error('[useFirebaseData] setIsLoading function not provided');
      return;
    }

    console.log('[useFirebaseData] Starting Firestore listeners setup...');
    isMountedRef.current = true;
    listenersSetupRef.current = 0;
    listenersWithErrorRef.current = 0;
    
    const checkAllLoaded = () => {
      listenersSetupRef.current++;
      console.log(`[useFirebaseData] Listeners setup: ${listenersSetupRef.current}/${totalListeners}`);
      if (listenersSetupRef.current >= totalListeners && isMountedRef.current) {
        console.log('[useFirebaseData] All listeners ready, setting loading to false');
        setIsLoading(false);
      }
    };

    const handleError = (error, source) => {
      listenersWithErrorRef.current++;
      console.error(`[useFirebaseData] Error in ${source}:`, error);
      setLoadError?.(`Failed to load ${source}: ${error.message}`);
      
      if (listenersWithErrorRef.current + listenersSetupRef.current >= totalListeners && isMountedRef.current) {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(() => {
      if (isMountedRef.current && listenersSetupRef.current + listenersWithErrorRef.current < totalListeners) {
        console.error('[useFirebaseData] Firestore listeners timeout after 10 seconds');
        setLoadError?.('Failed to load data: Connection timed out');
        setIsLoading(false);
      }
    }, 10000);

    // Settings listener
    const unsubscribeSettings = onSnapshot(
      doc(db, 'settings', 'config'),
      (doc) => {
        if (!isMountedRef.current) return;
        console.log('[useFirebaseData] Settings snapshot received:', doc.exists());
        try {
          if (doc.exists()) {
            const data = doc.data();
            setCurrentMode(data.currentMode || 'event');
            setSelectedTeamId(data.selectedTeamId || null);
          }
          checkAllLoaded();
        } catch (error) {
          handleError(error, 'settings');
        }
      },
      (error) => handleError(error, 'settings')
    );

    // Bookings listener
    const unsubscribeBookings = onSnapshot(
      collection(db, 'bookings'),
      (snapshot) => {
        if (!isMountedRef.current) return;
        console.log('[useFirebaseData] Bookings snapshot received:', snapshot.docs.length);
        try {
          const bookings = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            status: doc.data().status || 'active',
          }));
          setActiveBookings(bookings.filter((b) => b.status === 'active'));
          setCompletedBookings(bookings.filter((b) => b.status === 'completed'));
          checkAllLoaded();
        } catch (error) {
          handleError(error, 'bookings');
        }
      },
      (error) => handleError(error, 'bookings')
    );

    // Teams listener
    const unsubscribeTeams = onSnapshot(
      collection(db, 'teams'),
      (snapshot) => {
        if (!isMountedRef.current) return;
        console.log('[useFirebaseData] Teams snapshot received:', snapshot.docs.length);
        try {
          setTeams(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
          checkAllLoaded();
        } catch (error) {
          handleError(error, 'teams');
        }
      },
      (error) => handleError(error, 'teams')
    );

    // Cars listener
    const unsubscribeCars = onSnapshot(
      collection(db, 'cars'),
      async (snapshot) => {
        if (!isMountedRef.current) return;
        console.log('[useFirebaseData] Cars snapshot received:', snapshot.docs.length);
        try {
          let carsData = snapshot.docs.map((doc) => ({
            id: parseInt(doc.id),
            ...doc.data(),
          }));
          if (carsData.length === 0) {
            console.log('[useFirebaseData] No cars found, initializing defaults');
            const defaultCars = [
              { id: 1, model: 'IS300h', numberPlate: 'SNU6980E', available: true, queue: [] },
              { id: 2, model: 'ES300h', numberPlate: 'SNU6981F', available: true, queue: [] },
              { id: 3, model: 'NX300h', numberPlate: 'SNU6982G', available: true, queue: [] },
            ];
            for (const car of defaultCars) {
              await setDoc(doc(db, 'cars', car.id.toString()), car);
            }
            carsData = defaultCars;
          }
          setCars(carsData);
          checkAllLoaded();
        } catch (error) {
          handleError(error, 'cars');
        }
      },
      (error) => handleError(error, 'cars')
    );

    // Salespeople listener
    const unsubscribeSalespeople = onSnapshot(
      collection(db, 'salespeople'),
      async (snapshot) => {
        if (!isMountedRef.current) return;
        console.log('[useFirebaseData] Salespeople snapshot received:', snapshot.docs.length);
        try {
          let salespeopleData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          if (salespeopleData.length === 0) {
            console.log('[useFirebaseData] No salespeople found, initializing defaults');
            const defaultSalespeople = [
              { id: '1', name: 'John Doe', isOnDuty: true, mobileNumber: '91234567' },
              { id: '2', name: 'Jane Smith', isOnDuty: true, mobileNumber: '92345678' },
              { id: '3', name: 'Mike Johnson', isOnDuty: true, mobileNumber: '93456789' },
            ];
            for (const sp of defaultSalespeople) {
              await setDoc(doc(db, 'salespeople', sp.id), sp);
            }
            salespeopleData = defaultSalespeople;
          }
          setSalespeople(salespeopleData);
          checkAllLoaded();
        } catch (error) {
          handleError(error, 'salespeople');
        }
      },
      (error) => handleError(error, 'salespeople')
    );

    // Cleanup function
    return () => {
      console.log('[useFirebaseData] Cleaning up Firestore listeners');
      isMountedRef.current = false;
      clearTimeout(timeoutId);
      unsubscribeSettings();
      unsubscribeBookings();
      unsubscribeTeams();
      unsubscribeCars();
      unsubscribeSalespeople();
    };
  }, [setLoadError, setIsLoading]); // Only depend on these props

  const updateMode = useCallback(async (mode) => {
    try {
      await updateSettingsInFirestore({ currentMode: mode });
      setCurrentMode(mode);
    } catch (error) {
      console.error('Error updating mode:', error);
      throw error;
    }
  }, []);

  const updateSelectedTeam = useCallback(async (teamId) => {
    try {
      await updateSettingsInFirestore({ selectedTeamId: teamId });
      setSelectedTeamId(teamId);
    } catch (error) {
      console.error('Error updating team:', error);
      throw error;
    }
  }, []);

  return {
    currentMode,
    selectedTeamId,
    teams,
    cars,
    salespeople,
    activeBookings,
    completedBookings,
    walkins,
    setCurrentMode,
    setSelectedTeamId,
    setTeams,
    setCars,
    setSalespeople,
    setActiveBookings,
    setCompletedBookings,
    setWalkins,
    updateMode,
    updateSelectedTeam,
  };
}