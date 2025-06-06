import { db } from '../firebase';
import {
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
} from 'firebase/firestore';

export async function saveTeamToFirestore(teamData) {
  const teamRef = doc(collection(db, 'teams'));
  await setDoc(teamRef, { ...teamData, id: teamRef.id });
}

export async function updateTeamInFirestore(teamId, teamData) {
  await updateDoc(doc(db, 'teams', teamId), teamData);
}

export async function updateSettingsInFirestore(settings) {
  const settingsRef = doc(db, 'settings', 'orders');
  // Sanitize settings to prevent undefined values
  const sanitizedSettings = {};
  for (const key in settings) {
    if (settings[key] !== undefined) {
      sanitizedSettings[key] = settings[key];
    } else if (key === 'selectedTeamId') {
      // Explicitly set selectedTeamId to null if it's undefined
      // or handle as per your application's logic (e.g., remove the key)
      sanitizedSettings[key] = null; 
    }
    // Add other specific key handlings if needed
  }
  // Use setDoc with merge: true to create the document if it doesn't exist,
  // or update it if it does.
  await setDoc(settingsRef, sanitizedSettings, { merge: true });
}

export async function updateCarInFirestore(carData) {
  await updateDoc(doc(db, 'cars', carData.id.toString()), {
    model: carData.model,
    numberPlate: carData.numberPlate,
    available: carData.available,
    queue: carData.queue || [],
  });
}

export async function updateSalespersonInFirestore(spData) {
  await updateDoc(doc(db, 'salespeople', spData.id.toString()), {
    name: spData.name,
    mobileNumber: spData.mobileNumber,
    isOnDuty: spData.isOnDuty,
  });
}

export async function clearBookings() {
  const bookings = await getDocs(collection(db, 'bookings'));
  const deletions = bookings.docs.map((doc) => deleteDoc(doc.ref));
  await Promise.all(deletions);
}