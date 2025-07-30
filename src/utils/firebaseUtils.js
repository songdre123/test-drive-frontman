import { db } from '../firebase';
import {
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  addDoc,
} from 'firebase/firestore';

export async function saveTeamToFirestore(teamData) {
  const teamRef = doc(collection(db, 'teams'));
  await setDoc(teamRef, { ...teamData, id: teamRef.id });
}

export async function updateTeamInFirestore(teamId, teamData) {
  await updateDoc(doc(db, 'teams', teamId), teamData);
}

export async function updateSettingsInFirestore(settings) {
  try {
    const settingsRef = doc(db, 'settings', 'config');
    // Sanitize settings to prevent undefined values
    const sanitizedSettings = {};
    for (const key in settings) {
      if (settings[key] !== undefined) {
        sanitizedSettings[key] = settings[key];
      } else if (key === 'selectedTeamId') {
        sanitizedSettings[key] = null;
      }
    }
    await setDoc(settingsRef, sanitizedSettings, { merge: true });
  } catch (error) {
    console.error("Error updating settings:", error);
    throw error;
  }
}

export async function updateCarInFirestore(car) {
  try {
    await setDoc(doc(db, "cars", car.id.toString()), {
      model: car.model,
      numberPlate: car.numberPlate,
      available: car.available,
      queue: car.queue || [],
    });
  } catch (error) {
    console.error("Error updating car:", error);
    throw error;
  }
}

export async function updateSalespersonInFirestore(salesperson) {
  try {
    await setDoc(doc(db, "salespeople", salesperson.id.toString()), {
      ...salesperson,
      mobileNumber: salesperson.mobileNumber || null,
    });
  } catch (error) {
    console.error("Error updating salesperson:", error);
    throw error;
  }
}

export async function clearBookings() {
  const bookings = await getDocs(collection(db, 'bookings'));
  const deletions = bookings.docs.map((doc) => deleteDoc(doc.ref));
  await Promise.all(deletions);
}

export async function saveBookingToFirestore(booking) {
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
}

export async function updateBookingInFirestore(bookingId, bookingData) {
  try {
    await updateDoc(doc(db, "bookings", bookingId), bookingData);
  } catch (error) {
    console.error("Error updating booking:", error);
    throw error;
  }
}

export async function deleteBookingFromFirestore(bookingId) {
  try {
    await deleteDoc(doc(db, "bookings", bookingId));
  } catch (error) {
    console.error("Error deleting booking:", error);
    throw error;
  }
}

export async function deleteCarFromFirestore(carId) {
  try {
    await deleteDoc(doc(db, "cars", carId.toString()));
  } catch (error) {
    console.error("Error deleting car:", error);
    throw error;
  }
}

export async function deleteSalespersonFromFirestore(salespersonId) {
  try {
    await deleteDoc(doc(db, "salespeople", salespersonId.toString()));
  } catch (error) {
    console.error("Error deleting salesperson:", error);
    throw error;
  }
}

// Customer Queue Firebase Utilities
export async function saveCustomerToQueue(customer) {
  try {
    const docRef = await addDoc(collection(db, "customerQueue"), {
      ...customer,
      timestamp: new Date(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding customer to queue:", error);
    throw error;
  }
}

export async function deleteCustomerFromQueue(customerId) {
  try {
    await deleteDoc(doc(db, "customerQueue", customerId));
  } catch (error) {
    console.error("Error deleting customer from queue:", error);
    throw error;
  }
}

export async function updateCustomerInQueue(customerId, customerData) {
  try {
    await updateDoc(doc(db, "customerQueue", customerId), customerData);
  } catch (error) {
    console.error("Error updating customer in queue:", error);
    throw error;
  }
}

export async function getCustomerQueue() {
  try {
    const querySnapshot = await getDocs(collection(db, "customerQueue"));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error getting customer queue:", error);
    throw error;
  }
}