import { useState, useEffect } from 'react';
import { db } from '../firebase';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  query,
  where,
  getDocs
} from 'firebase/firestore';

export function useSalesAndCars() {
  const [salespeople, setSalespeople] = useState([]);
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch salespeople and cars on component mount
  useEffect(() => {
    const unsubscribeSalespeople = onSnapshot(
      collection(db, 'salespeople'),
      (snapshot) => {
        const salespeopleData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setSalespeople(salespeopleData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching salespeople:', error);
        setError('Failed to load salespeople');
        setLoading(false);
      }
    );

    const unsubscribeCars = onSnapshot(
      collection(db, 'cars'),
      (snapshot) => {
        const carsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCars(carsData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching cars:', error);
        setError('Failed to load cars');
        setLoading(false);
      }
    );

    // Cleanup subscriptions
    return () => {
      unsubscribeSalespeople();
      unsubscribeCars();
    };
  }, []);

  // Add a new salesperson
  const addSalesperson = async (salespersonData) => {
    try {
      const newId = Math.max(...salespeople.map(sp => parseInt(sp.id)), 0) + 1;
      const newSalesperson = {
        id: newId.toString(),
        ...salespersonData,
        createdAt: new Date()
      };
      await setDoc(doc(db, 'salespeople', newId.toString()), newSalesperson);
      return newSalesperson;
    } catch (error) {
      console.error('Error adding salesperson:', error);
      throw error;
    }
  };

  // Update a salesperson
  const updateSalesperson = async (id, salespersonData) => {
    try {
      const salespersonRef = doc(db, 'salespeople', id);
      await setDoc(salespersonRef, {
        ...salespersonData,
        updatedAt: new Date()
      }, { merge: true });
    } catch (error) {
      console.error('Error updating salesperson:', error);
      throw error;
    }
  };

  // Delete a salesperson
  const deleteSalesperson = async (id) => {
    try {
      await deleteDoc(doc(db, 'salespeople', id));
    } catch (error) {
      console.error('Error deleting salesperson:', error);
      throw error;
    }
  };

  // Add a new car
  const addCar = async (carData) => {
    try {
      const newId = Math.max(...cars.map(car => parseInt(car.id)), 0) + 1;
      const newCar = {
        id: newId.toString(),
        ...carData,
        available: true,
        createdAt: new Date()
      };
      await setDoc(doc(db, 'cars', newId.toString()), newCar);
      return newCar;
    } catch (error) {
      console.error('Error adding car:', error);
      throw error;
    }
  };

  // Update a car
  const updateCar = async (id, carData) => {
    try {
      const carRef = doc(db, 'cars', id);
      await setDoc(carRef, {
        ...carData,
        updatedAt: new Date()
      }, { merge: true });
    } catch (error) {
      console.error('Error updating car:', error);
      throw error;
    }
  };

  // Delete a car
  const deleteCar = async (id) => {
    try {
      await deleteDoc(doc(db, 'cars', id));
    } catch (error) {
      console.error('Error deleting car:', error);
      throw error;
    }
  };

  return {
    salespeople,
    cars,
    loading,
    error,
    addSalesperson,
    updateSalesperson,
    deleteSalesperson,
    addCar,
    updateCar,
    deleteCar
  };
} 