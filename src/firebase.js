// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBqSgBsj1r7qsEiRVk2gR-RF3loO1_Ewxw",
  authDomain: "testdrivefrontman.firebaseapp.com",
  projectId: "testdrivefrontman",
  storageBucket: "testdrivefrontman.firebasestorage.app",
  messagingSenderId: "1062999530016",
  appId: "1:1062999530016:web:8cb76e7f34ce5310557a45",
  measurementId: "G-E9GP29L5GR"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);
console.log('Firestore initialized:', db);

export { app, analytics };