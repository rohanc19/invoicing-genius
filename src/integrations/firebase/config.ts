// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX", // Replace with your actual API key
  authDomain: "invoicing-genius-9bf2a.firebaseapp.com",
  projectId: "invoicing-genius-9bf2a",
  storageBucket: "invoicing-genius-9bf2a.appspot.com",
  messagingSenderId: "XXXXXXXXXXXX", // Replace with your actual Messaging Sender ID
  appId: "1:XXXXXXXXXXXX:web:XXXXXXXXXXXXXXXXXXXX" // Replace with your actual App ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Firebase Storage and get a reference to the service
export const storage = getStorage(app);

// Connect to emulators in development environment
if (process.env.NODE_ENV === 'development') {
  // Auth emulator
  connectAuthEmulator(auth, 'http://localhost:9099');

  // Firestore emulator
  connectFirestoreEmulator(db, 'localhost', 8080);

  // Storage emulator
  connectStorageEmulator(storage, 'localhost', 9199);

  console.log('Using Firebase emulators in development mode');
}

export default app;
