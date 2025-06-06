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
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Debug log to check environment variables
console.log('Firebase Config Values:', {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY ? 'Set' : 'Not Set',
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN ? 'Set' : 'Not Set',
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID ? 'Set' : 'Not Set',
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET ? 'Set' : 'Not Set',
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID ? 'Set' : 'Not Set',
  appId: process.env.REACT_APP_FIREBASE_APP_ID ? 'Set' : 'Not Set',
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID ? 'Set' : 'Not Set'
});

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

// Export everything
export { app, analytics, db, auth, firebaseConfig };