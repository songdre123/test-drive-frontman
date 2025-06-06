import { useState, useCallback, useEffect } from 'react';
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
  
  useEffect(() => {
    if (!setIsLoading) {
      console.error('[useFirebaseData] setIsLoading function not provided');
      return;
    }

    console.log('[useFirebaseData] Starting Firestore listeners setup...');
    let isMounted = true;
    let listenersSetup = 0;
    let listenersWithError = 0;
    const totalListeners = 6; // settings, bookings, walkins, teams, cars, salespeople
    
    const checkAllLoaded = () => {
      listenersSetup++;
      console.log(`[useFirebaseData] Listeners setup: ${listenersSetup}/${totalListeners}`);
      if (listenersSetup >= totalListeners) {
        console.log('[useFirebaseData] All listeners ready, setting loading to false');
        setIsLoading(false);
      }
    };

    const handleError = (error, source) => {
      listenersWithError++;
      console.error(`[useFirebaseData] Error in ${source}:`, error);
      setLoadError?.(`Failed to load ${source}: ${error.message}`);
      
      // If all listeners have errored out or completed, stop loading
      if (listenersWithError + listenersSetup >= totalListeners) {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(() => {
      if (isMounted && listenersSetup + listenersWithError < totalListeners) {
        console.error('[useFirebaseData] Firestore listeners timeout after 10 seconds');
        setLoadError?.('Failed to load data: Connection timed out');
        setIsLoading(false);
      }
    }, 10000);

    // Test ping listener (moved inside useEffect)
    const unsubscribePing = onSnapshot(
      doc(db, 'test', 'ping'), 
      (doc) => {
        console.log('[useFirebaseData] Test ping snapshot:', doc.exists(), doc.data());
      }, 
      (error) => {
        console.error('[useFirebaseData] Test ping error:', error);
        handleError(error, 'ping test');
      }
    );

    const unsubscribeSettings = onSnapshot(
      collection(db, 'settings'),
      (snapshot) => {
        if (!isMounted) return;
        console.log('[useFirebaseData] Settings snapshot received:', snapshot.docs.length);
        try {
          let settingsData = {};
          if (snapshot.docs.length > 0) {
            settingsData = snapshot.docs[0].data();
            setCurrentMode(settingsData.currentMode || 'event');
            setSelectedTeamId(settingsData.selectedTeamId || null);
          }
          checkAllLoaded();
        } catch (error) {
          console.error('[useFirebaseData] Settings listener error:', error);
          handleError(error, 'settings');
        }
      },
      (error) => {
        console.error('[useFirebaseData] Settings snapshot error:', error);
        handleError(error, 'settings');
      }
    );

    const unsubscribeBookings = onSnapshot(
      collection(db, 'bookings'),
      (snapshot) => {
        if (!isMounted) return;
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
          console.error('[useFirebaseData] Bookings listener error:', error);
          handleError(error, 'bookings');
        }
      },
      (error) => {
        console.error('[useFirebaseData] Bookings snapshot error:', error);
        handleError(error, 'bookings');
      }
    );

    const unsubscribeWalkins = onSnapshot(
      collection(db, 'walkins'),
      (snapshot) => {
        if (!isMounted) return;
        console.log('[useFirebaseData] Walkins snapshot received:', snapshot.docs.length);
        try {
          setWalkins(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
          checkAllLoaded();
        } catch (error) {
          console.error('[useFirebaseData] Walkins listener error:', error);
          handleError(error, 'walk-ins');
        }
      },
      (error) => {
        console.error('[useFirebaseData] Walkins snapshot error:', error);
        handleError(error, 'walk-ins');
      }
    );

    const unsubscribeTeams = onSnapshot(
      collection(db, 'teams'),
      (snapshot) => {
        if (!isMounted) return;
        console.log('[useFirebaseData] Teams snapshot received:', snapshot.docs.length);
        try {
          setTeams(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
          checkAllLoaded();
        } catch (error) {
          console.error('[useFirebaseData] Teams listener error:', error);
          handleError(error, 'teams');
        }
      },
      (error) => {
        console.error('[useFirebaseData] Teams snapshot error:', error);
        handleError(error, 'teams');
      }
    );

    const unsubscribeCars = onSnapshot(
      collection(db, 'cars'),
      async (snapshot) => {
        if (!isMounted) return;
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
          console.error('[useFirebaseData] Cars listener error:', error);
          handleError(error, 'cars');
        }
      },
      (error) => {
        console.error('[useFirebaseData] Cars snapshot error:', error);
        handleError(error, 'cars');
      }
    );

    const unsubscribeSalespeople = onSnapshot(
      collection(db, 'salespeople'),
      async (snapshot) => {
        if (!isMounted) return;
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
          console.error('[useFirebaseData] Salespeople listener error:', error);
          handleError(error, 'salespeople');
        }
      },
      (error) => {
        console.error('[useFirebaseData] Salespeople snapshot error:', error);
        handleError(error, 'salespeople');
      }
    );

    return () => {
      console.log('[useFirebaseData] Cleaning up Firestore listeners');
      isMounted = false;
      clearTimeout(timeoutId);
      unsubscribePing();
      unsubscribeSettings();
      unsubscribeBookings();
      unsubscribeWalkins();
      unsubscribeTeams();
      unsubscribeCars();
      unsubscribeSalespeople();
    };
  }, [setLoadError, setIsLoading]);

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