// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { addDoc, collection, updateDoc, doc, deleteDoc, setDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// Import the functions you need from the SDKs you need
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBZE_NDoeFJjwZJTPD9IGKgzKbfexUrV3g",
  authDomain: "eventfrontman.firebaseapp.com",
  projectId: "eventfrontman",
  storageBucket: "eventfrontman.appspot.com",
  messagingSenderId: "619977805915",
  appId: "1:619977805915:web:25f6e9863f048d640bef7e",
  measurementId: "G-CFDKBD0RTR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
  } else if (err.code === 'unimplemented') {
    console.warn('The current browser does not support persistence.');
  }
});

// Log initialization
console.log('Firebase initialized with config:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain
});

// Common Firestore functions
export const saveBookingToFirestore = async (booking) => {
  try {
    const docRef = await addDoc(collection(db, "bookings"), {
      ...booking,
      status: "active",
      timestamp: new Date(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error saving booking:", error);
    throw error;
  }
};

export const updateBookingInFirestore = async (bookingId, bookingData) => {
  try {
    await updateDoc(doc(db, "bookings", bookingId), bookingData);
  } catch (error) {
    console.error("Error updating booking:", error);
    throw error;
  }
};

export const deleteBookingFromFirestore = async (bookingId) => {
  try {
    await deleteDoc(doc(db, "bookings", bookingId));
  } catch (error) {
    console.error("Error deleting booking:", error);
    throw error;
  }
};

export const updateCarInFirestore = async (car) => {
  try {
    await setDoc(doc(db, "cars", car.id.toString()), car);
  } catch (error) {
    console.error("Error updating car:", error);
    throw error;
  }
};

export const deleteCarFromFirestore = async (carId) => {
  try {
    await deleteDoc(doc(db, "cars", carId.toString()));
  } catch (error) {
    console.error("Error deleting car:", error);
    throw error;
  }
};

export const updateSalespersonInFirestore = async (salesperson) => {
  try {
    await setDoc(doc(db, "salespeople", salesperson.id.toString()), {
      ...salesperson,
      mobileNumber: salesperson.mobileNumber || null,
    });
  } catch (error) {
    console.error("Error updating salesperson:", error);
    throw error;
  }
};

export const deleteSalespersonFromFirestore = async (salespersonId) => {
  try {
    await deleteDoc(doc(db, "salespeople", salespersonId.toString()));
  } catch (error) {
    console.error("Error deleting salesperson:", error);
    throw error;
  }
};

export const updateSettingsInFirestore = async (settings) => {
  try {
    await setDoc(doc(db, "settings", "config"), settings, { merge: true });
  } catch (error) {
    console.error("Error updating settings:", error);
    throw error;
  }
};

export { app, analytics, db, auth };