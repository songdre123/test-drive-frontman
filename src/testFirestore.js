import { db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

export async function testFirestore() {
  console.log('[testFirestore] Testing Firestore...');
  try {
    console.log('[testFirestore] Firestore instance:', db);
    console.log('[testFirestore] Firestore app:', db.app);
    const docRef = doc(db, 'test', 'ping');
    console.log('[testFirestore] Fetching test/ping...');
    const docSnap = await getDoc(docRef);
    console.log('[testFirestore] GetDoc result:', {
      exists: docSnap.exists(),
      data: docSnap.exists() ? docSnap.data() : null,
    });
    if (!docSnap.exists()) {
      console.error('[testFirestore] Error: test/ping document does not exist.');
      throw new Error('Firestore test/ping document not found.');
    }
    return true;
  } catch (error) {
    console.error('[testFirestore] Error:', error.message);
    throw error;
  }
}