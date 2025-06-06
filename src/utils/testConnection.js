import { db } from '../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, setDoc } from 'firebase/firestore';

export async function testFirestoreConnection() {
  try {
    console.log('Starting Firestore connection test...');
    
    // Test write to settings collection
    console.log('Testing write to settings collection...');
    const settingsRef = doc(db, 'settings', 'test');
    await setDoc(settingsRef, {
      timestamp: new Date(),
      message: 'Test connection successful'
    });
    console.log('Successfully wrote to settings collection');

    // Test write to test collection
    console.log('Testing write to test collection...');
    const testCollection = collection(db, 'test');
    const docRef = await addDoc(testCollection, {
      timestamp: new Date(),
      message: 'Test connection successful'
    });
    console.log('Test document written with ID:', docRef.id);

    // Test read
    console.log('Testing read from test collection...');
    const querySnapshot = await getDocs(testCollection);
    console.log('Test documents found:', querySnapshot.size);

    // Clean up test documents
    console.log('Cleaning up test documents...');
    querySnapshot.forEach(async (doc) => {
      await deleteDoc(doc.ref);
    });
    console.log('Test documents cleaned up');

    return true;
  } catch (error) {
    console.error('Error testing Firestore connection:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
} 