import React, { useState, useEffect, useCallback } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useFirebaseData } from './hooks/useFirebaseData';
import { useRoundRobin } from './hooks/useRoundRobin';
import { useToast, ToastProvider } from './hooks/useToast';
import Dashboard from './components/Dashboard';
import CustomerQueue from './components/CustomerQueue';
import { db, firebaseConfig } from "./firebase";
import {
  collection,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  writeBatch,
} from "firebase/firestore";
import { FaWhatsapp } from "react-icons/fa";
import "./App.css";
import {
  saveBookingToFirestore,
  updateBookingInFirestore,
  deleteBookingFromFirestore,
  updateCarInFirestore,
  deleteCarFromFirestore,
  updateSalespersonInFirestore,
  deleteSalespersonFromFirestore,
  updateSettingsInFirestore,
  saveCustomerToQueue,
  deleteCustomerFromQueue,
  updateCustomerInQueue,
  getCustomerQueue
} from './utils/firebaseUtils';

const Toast = ({ message, type, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);
  const bgColor = {
    success: "bg-success",
    error: "bg-error",
    info: "bg-brand-600",
  }[type];
  return (
    <div
      className={`fixed top-4 right-4 px-4 py-2 text-white rounded-md shadow-lg ${bgColor} ${
        isVisible ? "animate-toast-in" : "animate-toast-out"
      }`}
    >
      {message}
    </div>
  );
};

const App = () => {
  const [activeBookings, setActiveBookings] = useState([]);
  const [completedBookings, setCompletedBookings] = useState([]);
  const [cars, setCars] = useState([]);
  const [salespeople, setSalespeople] = useState([]);
  const [roundRobinOrder, setRoundRobinOrder] = useState([]);
  const [lastRoundRobinIndex, setLastRoundRobinIndex] = useState(-1);
  const [carOrder, setCarOrder] = useState([]);
  const [salespeopleOrder, setSalespeopleOrder] = useState([]);
  const [formData, setFormData] = useState({ carId: "", salespersonId: "" });
  const [adminForm, setAdminForm] = useState({
    newSalesperson: "",
    newSalespersonMobile: "",
    newCarModel: "",
    newCarNumberPlate: "",
  });
  const [editCar, setEditCar] = useState(null);
  const [editSalesperson, setEditSalesperson] = useState(null);
  const [view, setView] = useState("dashboard");
  const [toasts, setToasts] = useState([]);
  const [isRoundRobinDropDisabled, setIsRoundRobinDropDisabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [customerQueue, setCustomerQueue] = useState([]);

  const getNextSalesperson = useCallback(() => {
    if (roundRobinOrder.length === 0) return { name: "No salespeople" };
    
    // Filter out salespeople that are not in the round robin order
    const availableSalespeople = salespeople.filter(sp => 
      roundRobinOrder.includes(String(sp.id))
    );
    
    if (availableSalespeople.length === 0) return { name: "No salespeople" };
    
    const nextIndex = (lastRoundRobinIndex + 1) % availableSalespeople.length;
    const nextSalespersonId = roundRobinOrder[nextIndex];
    return availableSalespeople.find(sp => String(sp.id) === String(nextSalespersonId)) || { name: "No salespeople" };
  }, [roundRobinOrder, lastRoundRobinIndex, salespeople]);

  const handleRemoveFromRoundRobin = async (salespersonId) => {
    try {
      setRoundRobinOrder(prev => prev.filter(id => id !== salespersonId));
      addToast("Salesperson removed from round robin", "success");
    } catch (error) {
      console.error("Error removing from round robin:", error);
      addToast("Failed to remove from round robin", "error");
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

      // Update car status
      const carRef = doc(db, "cars", carId.toString());
      const updatedCar = {
        ...car,
        available: false,
        queue: car.queue.slice(1)
      };
      await updateDoc(carRef, {
        available: false,
        queue: updatedCar.queue
      });

      // Add booking to active bookings
      const bookingRef = await addDoc(collection(db, "bookings"), newBooking);
      
      // Update local state
      setCars(prev => prev.map(c => 
        c.id === carId ? updatedCar : c
      ));
      setActiveBookings(prev => [...prev, { id: bookingRef.id, ...newBooking }]);

      // Update round robin order
      const newRoundRobinOrder = [...roundRobinOrder];
      const currentIndex = newRoundRobinOrder.indexOf(salesperson.id);
      if (currentIndex !== -1) {
        newRoundRobinOrder.splice(currentIndex, 1);
        newRoundRobinOrder.push(salesperson.id);
        setRoundRobinOrder(newRoundRobinOrder);
        
        // Update round robin order in Firestore
        await updateDoc(doc(db, "settings", "config"), {
          roundRobinOrder: newRoundRobinOrder
        });
      }
      
      addToast('Queue processed successfully', 'success');
    } catch (error) {
      console.error('Error processing queue:', error);
      addToast('Failed to process queue', 'error');
    }
  };

  const handleMarkCarUnavailable = async (carId) => {
    try {
      // Convert ID to string for Firestore
      const idString = String(carId);
      
      // Debug logging
      console.log('Marking car unavailable:', {
        carId: idString,
        activeBookings: activeBookings.map(b => ({
          bookingId: b.id,
          carId: b.carId,
          status: b.status
        }))
      });

      // Check if car is in any active bookings
      const carInUse = activeBookings.some(b => {
        const bookingCarId = String(b.carId);
        const currentCarId = String(idString);
        const isActive = b.status === 'active';
        
        console.log('Checking booking:', {
          bookingCarId,
          currentCarId,
          isActive,
          matches: bookingCarId === currentCarId
        });
        
        return bookingCarId === currentCarId && isActive;
      });

      console.log('Car in use:', carInUse);

      if (carInUse) {
        addToast("Cannot mark car as unavailable while it's in use", "error");
      return;
    }
      
      // Update Firestore
      const carRef = doc(db, "cars", idString);
      await updateDoc(carRef, { 
        available: false,
        queue: [] // Clear any existing queue
      });
      
      // Update local state
      setCars(prev => prev.map(c => 
        String(c.id) === idString
          ? { ...c, available: false, queue: [] }
          : c
      ));
      
      addToast("Car marked as unavailable", "success");
    } catch (error) {
      console.error("Error marking car unavailable:", error);
      addToast("Failed to mark car unavailable", "error");
    }
  };

  const handleAddToRoundRobin = async (salespersonId) => {
    try {
      if (!roundRobinOrder.includes(salespersonId)) {
        setRoundRobinOrder(prev => [...prev, salespersonId]);
        addToast("Salesperson added to round robin", "success");
      }
    } catch (error) {
      console.error("Error adding to round robin:", error);
      addToast("Failed to add to round robin", "error");
    }
  };

  const handleAddSalesperson = async (e) => {
    e.preventDefault();
    try {
      const name = adminForm.newSalesperson.trim();
      const mobileNumber = adminForm.newSalespersonMobile.trim();

      if (!name) {
        addToast("Please enter a salesperson name", "error");
        return;
      }

      const newSalesperson = {
        name,
        mobileNumber: mobileNumber || null,
        timestamp: Date.now()
      };

      const docRef = await addDoc(collection(db, "salespeople"), newSalesperson);
      setSalespeople(prev => [...prev, { id: docRef.id, ...newSalesperson }]);
      setSalespeopleOrder(prev => [...prev, docRef.id]);
      setAdminForm(prev => ({ ...prev, newSalesperson: "", newSalespersonMobile: "" }));
      addToast("Salesperson added successfully", "success");
    } catch (error) {
      console.error("Error adding salesperson:", error);
      addToast("Failed to add salesperson", "error");
    }
  };

  const handleAddCar = async (e) => {
    e.preventDefault();
    try {
    const model = adminForm.newCarModel.trim();
      const numberPlate = adminForm.newCarNumberPlate.trim();

    if (!model) {
      addToast("Please enter a car model", "error");
      return;
    }

      const newCar = {
        model,
        numberPlate: numberPlate || null,
        available: true,
        queue: [],
        timestamp: Date.now()
      };

      const docRef = await addDoc(collection(db, "cars"), newCar);
      setCars(prev => [...prev, { id: docRef.id, ...newCar }]);
      setCarOrder(prev => [...prev, docRef.id]);
      setAdminForm(prev => ({ ...prev, newCarModel: "", newCarNumberPlate: "" }));
      addToast("Car added successfully", "success");
    } catch (error) {
      console.error("Error adding car:", error);
      addToast("Failed to add car", "error");
    }
  };

  const handleEditCar = (car) => {
    setEditCar({
      id: car.id,
      model: car.model,
      newNumberPlate: car.numberPlate || ""
    });
  };

  const handleDeleteCar = async (carId) => {
    try {
      // Convert ID to string for Firestore
      const idString = String(carId);
      
      // Delete from Firestore
      await deleteDoc(doc(db, "cars", idString));
      
      // Update local state
      setCars(prev => prev.filter(c => c.id !== idString));
      setCarOrder(prev => prev.filter(id => id !== idString));
      
      // Update active bookings to remove references to deleted car
      setActiveBookings(prev => prev.filter(b => String(b.carId) !== idString));
      
      addToast("Car deleted successfully", "success");
    } catch (error) {
      console.error("Error deleting car:", error);
      addToast("Failed to delete car", "error");
    }
  };

  const handleEditSalesperson = (salesperson) => {
    setEditSalesperson({
      id: salesperson.id,
      newName: salesperson.name,
      newMobileNumber: salesperson.mobileNumber || ""
    });
  };

  const handleDeleteSalesperson = async (salespersonId) => {
    try {
      // Convert ID to string for Firestore
      const idString = String(salespersonId);
      
      // Delete from Firestore
      await deleteDoc(doc(db, "salespeople", idString));
      
      // Update local state
      setSalespeople(prev => prev.filter(sp => sp.id !== idString));
      setSalespeopleOrder(prev => prev.filter(id => id !== idString));
      
      // Remove from round robin if present and update Firestore
      const newRoundRobinOrder = roundRobinOrder.filter(id => id !== idString);
      setRoundRobinOrder(newRoundRobinOrder);
      
      // Update round robin order in Firestore
      await updateDoc(doc(db, "settings", "config"), {
        roundRobinOrder: newRoundRobinOrder
      });
      
      // Update active bookings to remove references to deleted salesperson
      setActiveBookings(prev => prev.filter(b => String(b.salespersonId) !== idString));
      
      addToast("Salesperson deleted successfully", "success");
    } catch (error) {
      console.error("Error deleting salesperson:", error);
      addToast("Failed to delete salesperson", "error");
    }
  };

  const handleAdminChange = (e) => {
    const { name, value } = e.target;
    setAdminForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveNumberPlate = async () => {
    try {
      if (!editCar) return;

      // Ensure we have valid string values
      const model = String(editCar.model || "").trim();
      const numberPlate = String(editCar.newNumberPlate || "").trim();

      if (!model) {
        addToast("Please enter a car model", "error");
        return;
      }

      const carRef = doc(db, "cars", String(editCar.id));
      await updateDoc(carRef, { 
        model,
        numberPlate: numberPlate || null 
      });

      // Update local state
      setCars(prev => prev.map(c => 
        String(c.id) === String(editCar.id)
          ? { ...c, model, numberPlate: numberPlate || null }
          : c
      ));

      // Update active bookings
      const affectedBookings = activeBookings.filter(
        b => String(b.carId) === String(editCar.id)
      );

      // Update bookings in batches to handle errors gracefully
      const batch = writeBatch(db);
      for (const booking of affectedBookings) {
        try {
          const bookingRef = doc(db, "bookings", String(booking.id));
          batch.update(bookingRef, { 
            carModel: model,
            carNumberPlate: numberPlate || null
          });
    } catch (error) {
          console.warn(`Could not update booking ${booking.id}:`, error);
        }
      }

      try {
        await batch.commit();
    } catch (error) {
        console.warn("Some booking updates failed:", error);
      }

      // Update local booking states
      setActiveBookings(prev => prev.map(b => 
        String(b.carId) === String(editCar.id)
          ? { ...b, carModel: model, carNumberPlate: numberPlate || null }
          : b
      ));

      setEditCar(null);
      addToast("Car updated successfully", "success");
      } catch (error) {
      console.error("Error updating car:", error);
      addToast("Failed to update car", "error");
    }
  };

  const normalizeMobileNumber = (number) => {
    try {
      if (!number) return null;
      const numStr = String(number).trim();
      if (!numStr) return null;
      
      // Remove all non-numeric characters except +
      const cleaned = numStr.replace(/[^0-9+]/g, "");
      if (!cleaned) return null;

      // If it starts with +, return as is, otherwise add +65
      return cleaned.startsWith("+") ? cleaned : `+65${cleaned}`;
    } catch (error) {
      console.error("Error normalizing mobile number:", error);
      return null;
    }
  };

  const handleSaveSalesperson = async () => {
    try {
      if (!editSalesperson) return;
      
      // Handle name
      const newName = String(editSalesperson.newName || "").trim();
      if (!newName) {
        addToast("Please enter a salesperson name", "error");
        return;
      }

      // Handle mobile number
      let newMobileNumber = null;
      if (editSalesperson.newMobileNumber) {
        const numStr = String(editSalesperson.newMobileNumber).trim();
        if (numStr) {
          // Remove all non-numeric characters except +
          const cleaned = numStr.replace(/[^0-9+]/g, "");
          if (cleaned) {
            newMobileNumber = cleaned.startsWith("+") ? cleaned : `+65${cleaned}`;
          }
        }
      }

      const salespersonId = String(editSalesperson.id);

      // Update Firestore
      await updateDoc(doc(db, "salespeople", salespersonId), {
        name: newName,
        mobileNumber: newMobileNumber,
      });

      // Update local state
      setSalespeople(prev => prev.map(sp => 
        String(sp.id) === salespersonId 
          ? { ...sp, name: newName, mobileNumber: newMobileNumber }
          : sp
      ));

      // Update affected bookings
      const affectedBookings = [...activeBookings, ...completedBookings].filter(
        b => String(b.salespersonId) === salespersonId
      );

      // Update bookings in batches to handle errors gracefully
      const batch = writeBatch(db);
      for (const booking of affectedBookings) {
        try {
          const bookingRef = doc(db, "bookings", booking.id);
          batch.update(bookingRef, { salespersonName: newName });
        } catch (error) {
          console.warn(`Could not update booking ${booking.id}:`, error);
          // Continue with other updates even if one fails
        }
      }

      try {
        await batch.commit();
      } catch (error) {
        console.warn("Some booking updates failed:", error);
        // Continue with the rest of the function even if batch commit fails
      }

      // Update local booking states
      setActiveBookings(prev => prev.map(b => 
        String(b.salespersonId) === salespersonId
            ? { ...b, salespersonName: newName }
            : b
      ));

      setCompletedBookings(prev => prev.map(b => 
        String(b.salespersonId) === salespersonId
            ? { ...b, salespersonName: newName }
            : b
      ));

      setEditSalesperson(null);
      addToast(`Salesperson ${newName} updated`, "success");
    } catch (error) {
      console.error("Error updating salesperson:", error);
      addToast("Failed to update salesperson", "error");
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm("Are you sure you want to clear all booking history? This cannot be undone.")) {
      return;
    }
    try {
      const completedBookingsSnapshot = await getDocs(
        query(collection(db, "bookings"), where("status", "==", "completed"))
      );
      const batch = writeBatch(db);
      completedBookingsSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      setCompletedBookings([]);
      addToast("Booking history cleared", "success");
    } catch (error) {
      console.error("Error clearing history:", error);
      addToast("Failed to clear history", "error");
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Customer Queue Handlers
  const handleAddCustomerToQueue = async (customer) => {
    try {
      const customerId = await saveCustomerToQueue(customer);
      const newCustomer = { ...customer, id: customerId };
      setCustomerQueue(prev => [...prev, newCustomer]);
      addToast("Customer added to queue", "success");
    } catch (error) {
      console.error("Error adding customer to queue:", error);
      addToast("Failed to add customer to queue", "error");
    }
  };

  const handleDeleteCustomerFromQueue = async (customerId) => {
    try {
      await deleteCustomerFromQueue(customerId);
      setCustomerQueue(prev => prev.filter(c => c.id !== customerId));
      addToast("Customer removed from queue", "success");
    } catch (error) {
      console.error("Error removing customer from queue:", error);
      addToast("Failed to remove customer from queue", "error");
    }
  };

  const addToast = (message, type = "info") => {
    const id = Math.random().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const renderSidebar = () => (
    <div className="fixed left-0 top-0 h-full w-64 bg-gray-800 p-4">
      <h1 className="text-2xl font-bold text-white mb-8">Test Drive Manager</h1>
      <nav className="space-y-2">
        <button
          onClick={() => setView("dashboard")}
          className={`w-full text-left px-4 py-2 rounded-md ${
            view === "dashboard" ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-700"
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setView("history")}
          className={`w-full text-left px-4 py-2 rounded-md ${
            view === "history" ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-700"
          }`}
        >
          Booking History
        </button>
        <button
          onClick={() => setView("admin")}
          className={`w-full text-left px-4 py-2 rounded-md ${
            view === "admin" ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-700"
          }`}
        >
          Admin Panel
        </button>
        <button
          onClick={() => setView("customerQueue")}
          className={`w-full text-left px-4 py-2 rounded-md ${
            view === "customerQueue" ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-700"
          }`}
        >
          Customer Queue
        </button>
      </nav>
    </div>
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch cars
        const carsSnapshot = await getDocs(collection(db, "cars"));
        let cars = carsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        if (cars.length === 0) {
          const defaultCars = [
            {
              id: "1",
              model: "IS300h",
              numberPlate: "SNU6980E",
              available: true,
              queue: [],
            },
            {
              id: "2",
              model: "ES300h Exec",
              numberPlate: "SKR0188S",
              available: true,
              queue: [],
            },
            {
              id: "3",
              model: "ES300h Lux",
              numberPlate: "SJY6880L",
              available: true,
              queue: [],
            },
            {
              id: "4",
              model: "LBX Elegant",
              numberPlate: "SGR2298S",
              available: true,
              queue: [],
            },
            {
              id: "5",
              model: "LBX Cool",
              numberPlate: "Tradeplate",
              available: true,
              queue: [],
            },
            {
              id: "6",
              model: "NX350h Goshi",
              numberPlate: "Tradeplate",
              available: true,
              queue: [],
            },
            {
              id: "7",
              model: "NX450h+",
              numberPlate: "SNU8251M",
              available: true,
              queue: [],
            },
            {
              id: "8",
              model: "RX350h",
              numberPlate: "SKB7888T",
              available: true,
              queue: [],
            },
            {
              id: "9",
              model: "RX450h+",
              numberPlate: "Tradeplate",
              available: true,
              queue: [],
            },
            {
              id: "10",
              model: "RZ450e",
              numberPlate: "Tradeplate",
              available: true,
              queue: [],
            },
            {
              id: "11",
              model: "UX300h",
              numberPlate: "Tradeplate",
              available: true,
              queue: [],
            },
            {
              id: "12",
              model: "LM350h",
              numberPlate: null,
              available: true,
              queue: [],
            },
            {
              id: "13",
              model: "LM500h",
              numberPlate: null,
              available: true,
              queue: [],
            },
          ];
          for (const car of defaultCars) {
            await setDoc(doc(db, "cars", car.id), car);
          }
          cars = defaultCars;
        }
        setCars(cars);

        // Fetch salespeople
        const salespeopleSnapshot = await getDocs(collection(db, "salespeople"));
        let salespeople = salespeopleSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        if (salespeople.length === 0) {
          const defaultSalespeople = [
            { id: "1", name: "Daryl Han", mobileNumber: "+6591234567" },
            { id: "2", name: "Cai YuTong", mobileNumber: "+6592345678" },
            { id: "3", name: "Sherley Teo", mobileNumber: "+6593456789" },
          ];
          for (const sp of defaultSalespeople) {
            await setDoc(doc(db, "salespeople", sp.id), sp);
          }
          salespeople = defaultSalespeople;
        }
        setSalespeople(salespeople);

        // Fetch active and completed bookings
        const bookingsSnapshot = await getDocs(collection(db, "bookings"));
        const allBookings = bookingsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          status: doc.data().status || "active",
        }));
        setActiveBookings(allBookings.filter((b) => b.status === "active"));
        setCompletedBookings(allBookings.filter((b) => b.status === "completed"));

        // Fetch customer queue
        try {
          const customerQueueData = await getCustomerQueue();
          setCustomerQueue(customerQueueData);
        } catch (error) {
          console.error("Error fetching customer queue:", error);
          addToast("Failed to load customer queue", "error");
        }

        // Fetch settings
        const settingsSnapshot = await getDocs(collection(db, "settings"));
        let roundRobinOrder = salespeople.map((sp) => sp.id);
        let lastRoundRobinIndex = -1;
        let carOrder = cars.map((c) => c.id);
        let salespeopleOrder = salespeople.map((sp) => sp.id);
        if (!settingsSnapshot.empty) {
          const settingsData = settingsSnapshot.docs[0].data();
          roundRobinOrder = settingsData.roundRobinOrder || roundRobinOrder;
          lastRoundRobinIndex = settingsData.lastRoundRobinIndex || -1;
          carOrder = settingsData.carOrder || carOrder;
          salespeopleOrder = settingsData.salespeopleOrder || salespeopleOrder;
        } else {
          await setDoc(doc(db, "settings", "config"), {
            roundRobinOrder,
            lastRoundRobinIndex,
            carOrder,
            salespeopleOrder,
          });
        }
        setRoundRobinOrder(roundRobinOrder);
        setLastRoundRobinIndex(lastRoundRobinIndex);
        setCarOrder(carOrder);
        setSalespeopleOrder(salespeopleOrder);

      } catch (error) {
        console.error("Error fetching data:", error);
        addToast("Failed to load data from server", "error");
      }
    };
      fetchData();
  }, []);

    return (
    <ToastProvider>
      <Router>
        <div className="min-h-screen bg-gray-900 text-gray-100">
          {renderSidebar()}
          <div className="ml-64 p-8">
            {view === "dashboard" && (
              <Dashboard 
                setIsLoading={setIsLoading} 
                setLoadError={setLoadError} 
                getNextSalesperson={getNextSalesperson}
                cars={cars}
                salespeople={salespeople}
                activeBookings={activeBookings}
                roundRobinOrder={roundRobinOrder}
                setRoundRobinOrder={setRoundRobinOrder}
                handleRemoveFromRoundRobin={handleRemoveFromRoundRobin}
                handleProcessQueue={handleProcessQueue}
                handleMarkCarUnavailable={handleMarkCarUnavailable}
                handleAddToRoundRobin={handleAddToRoundRobin}
                setCars={setCars}
                setActiveBookings={setActiveBookings}
              />
            )}
            {view === "history" && (
              <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold mb-6">Booking History</h2>
                <div className="mb-4 flex justify-end">
                <button
                    onClick={handleClearHistory}
                    disabled={completedBookings.length === 0}
                    className="bg-error text-white px-6 py-2 rounded-md hover:bg-red-600 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                    Clear History
                </button>
                </div>
                {completedBookings.length === 0 ? (
                  <p className="text-gray-400">No completed bookings.</p>
                ) : (
                  <div className="space-y-2">
                    {completedBookings
                      .sort((a, b) => b.completedAt - a.completedAt)
                      .map((b) => (
                        <div
                          key={b.id}
                          className="p-3 bg-gray-700 rounded-md flex items-center"
                        >
                          <div className="flex-grow text-gray-200">
                            <div>
                              {b.carModel} ({b.carNumberPlate || "N/A"}) -{" "}
                              {b.salespersonName}
                            </div>
                            <div className="text-sm text-gray-400">
                              Started: {new Date(b.timestamp).toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-400">
                              Completed: {new Date(b.completedAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
            {view === "admin" && (
              <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold mb-6">Admin Panel</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-800 p-6 rounded-md shadow-lg">
                    <h3 className="text-xl font-semibold mb-4">Manage Salespeople</h3>
                    <form onSubmit={handleAddSalesperson} className="mb-4 space-y-2">
                      <input
                        type="text"
                        name="newSalesperson"
                        value={adminForm.newSalesperson}
                        onChange={handleAdminChange}
                        className="w-full p-3 border border-gray-600 bg-gray-900 text-gray-100 rounded-md"
                        placeholder="Salesperson name"
                      />
                      <input
                        type="text"
                        name="newSalespersonMobile"
                        value={adminForm.newSalespersonMobile}
                        onChange={handleAdminChange}
                        className="w-full p-3 border border-gray-600 bg-gray-900 text-gray-100 rounded-md"
                        placeholder="Mobile number (e.g., +6591234567)"
                      />
                <button
                        type="submit"
                        className="w-full bg-green-600 text-white p-3 rounded-md hover:bg-green-700"
                >
                        Add Salesperson
                </button>
                    </form>
                    <div className="space-y-2">
                      {salespeople.map((sp) => (
                        <div
                          key={sp.id}
                          className="flex items-center p-3 bg-gray-700 rounded-md"
                        >
                          <span className="flex-grow font-medium text-gray-100">
                            {sp.name}
                            {sp.mobileNumber && (
                              <span className="text-sm text-gray-400 ml-2">
                                ({sp.mobileNumber})
                              </span>
                            )}
                          </span>
                <button
                            onClick={() => handleEditSalesperson(sp)}
                            className="bg-yellow-500 text-white rounded-md px-4 py-2 hover:bg-yellow-600 mr-2"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteSalesperson(sp.id)}
                            className="bg-red-600 text-white rounded-md px-4 py-2 hover:bg-red-700"
                          >
                            Delete
                </button>
              </div>
                      ))}
            </div>
                  </div>
                  <div className="bg-gray-800 p-6 rounded-md shadow-lg">
                    <h3 className="text-xl font-semibold mb-4">Manage Cars</h3>
                    <form onSubmit={handleAddCar} className="mb-4 space-y-2">
                      <input
                        type="text"
                        name="newCarModel"
                        value={adminForm.newCarModel}
                        onChange={handleAdminChange}
                        className="w-full p-3 border border-gray-600 bg-gray-900 text-gray-100 rounded-md"
                        placeholder="New car model"
                      />
                      <input
                        type="text"
                        name="newCarNumberPlate"
                        value={adminForm.newCarNumberPlate}
                        onChange={handleAdminChange}
                        className="w-full p-3 border border-gray-600 bg-gray-900 text-gray-100 rounded-md"
                        placeholder="Number plate (e.g., SGX1234A)"
                      />
                      <button
                        type="submit"
                        className="w-full bg-green-600 text-white p-3 rounded-md hover:bg-green-700"
                      >
                        Add Car
                      </button>
                    </form>
                    <div className="space-y-2">
                      {cars.map((car) => (
                        <div
                          key={car.id}
                          className="flex items-center p-3 bg-gray-700 rounded-md"
                        >
                          <div className="flex-grow">
                            <h4 className="text-lg font-semibold text-gray-100">
                              {car.model}
                            </h4>
                            <p className="text-sm text-gray-400">
                              Plate: {car.numberPlate || "N/A"}
                            </p>
              </div>
                          <button
                            onClick={() => handleEditCar(car)}
                            className="bg-yellow-500 text-white rounded-md px-4 py-2 hover:bg-yellow-600 mr-2"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteCar(car.id)}
                            className="bg-red-600 text-white rounded-md px-4 py-2 hover:bg-red-700"
                          >
                            Delete
                          </button>
              </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Edit Car Modal */}
                {editCar && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold">Edit Car</h3>
                        <button
                          onClick={() => setEditCar(null)}
                          className="text-gray-400 hover:text-white"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="space-y-4">
              <div>
                          <label className="block text-sm font-medium text-gray-400 mb-1">
                            Model
                          </label>
                          <input
                            type="text"
                            value={editCar.model}
                            onChange={(e) => setEditCar({ ...editCar, model: e.target.value })}
                            className="w-full p-3 border border-gray-600 bg-gray-900 text-gray-100 rounded-md"
                />
              </div>
              <div>
                          <label className="block text-sm font-medium text-gray-400 mb-1">
                            Number Plate
                          </label>
                          <input
                            type="text"
                            value={editCar.newNumberPlate}
                            onChange={(e) => setEditCar({ ...editCar, newNumberPlate: e.target.value })}
                            className="w-full p-3 border border-gray-600 bg-gray-900 text-gray-100 rounded-md"
                />
              </div>
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => setEditCar(null)}
                            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-500"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSaveNumberPlate}
                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                          >
                            Save Changes
                          </button>
            </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Edit Salesperson Modal */}
                {editSalesperson && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold">Edit Salesperson</h3>
                        <button
                          onClick={() => setEditSalesperson(null)}
                          className="text-gray-400 hover:text-white"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-1">
                            Name
                          </label>
                          <input
                            type="text"
                            value={editSalesperson.newName}
                            onChange={(e) => setEditSalesperson({ ...editSalesperson, newName: e.target.value })}
                            className="w-full p-3 border border-gray-600 bg-gray-900 text-gray-100 rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-1">
                            Mobile Number
                          </label>
                          <input
                            type="text"
                            value={editSalesperson.newMobileNumber}
                            onChange={(e) => setEditSalesperson({ ...editSalesperson, newMobileNumber: e.target.value })}
                            className="w-full p-3 border border-gray-600 bg-gray-900 text-gray-100 rounded-md"
                            placeholder="+6591234567"
                          />
          </div>
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => setEditSalesperson(null)}
                            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-500"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSaveSalesperson}
                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                          >
                            Save Changes
                          </button>
        </div>
      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            {view === "customerQueue" && (
              <div className="max-w-4xl mx-auto">
                <CustomerQueue
                  customers={customerQueue}
                  onAddCustomer={handleAddCustomerToQueue}
                  onDeleteCustomer={handleDeleteCustomerFromQueue}
                />
              </div>
            )}
          </div>
          {toasts.map((toast) => (
            <Toast
              key={toast.id}
              message={toast.message}
              type={toast.type}
              onClose={() => removeToast(toast.id)}
            />
          ))}
        </div>
      </Router>
    </ToastProvider>
  );
};

export default App; 
