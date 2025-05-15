// Firebase client for web
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendEmailVerification,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  QueryConstraint,
  serverTimestamp
} from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX", // Replace with your actual API key
  authDomain: "invoicing-genius-9bf2a.firebaseapp.com",
  projectId: "invoicing-genius-9bf2a",
  storageBucket: "invoicing-genius-9bf2a.appspot.com",
  messagingSenderId: "XXXXXXXXXXXX", // Replace with your actual Messaging Sender ID
  appId: "1:XXXXXXXXXXXX:web:XXXXXXXXXXXXXXXXXXXX" // Replace with your actual App ID
};

// Initialize Firebase for web
let app;
let auth;
let db;

// Only initialize Firebase in browser environment
if (typeof window !== 'undefined') {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
}

// Check if we're running in Electron
export const isElectron = () => {
  return typeof window !== 'undefined' && window.electron !== undefined;
};

// Firebase Auth Service
export const firebaseAuthService = {
  // Sign up with email and password
  signUp: async (email: string, password: string) => {
    if (isElectron() && window.firebaseAuth) {
      return window.firebaseAuth.signUp(email, password);
    } else if (auth) {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Send email verification
        if (userCredential.user) {
          await sendEmailVerification(userCredential.user);
        }
        return { user: userCredential.user, error: null };
      } catch (error: any) {
        return { user: null, error: error.message };
      }
    }
    return { user: null, error: 'Firebase Auth not initialized' };
  },

  // Sign in with email and password
  signIn: async (email: string, password: string) => {
    if (isElectron() && window.firebaseAuth) {
      return window.firebaseAuth.signIn(email, password);
    } else if (auth) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return { user: userCredential.user, error: null };
      } catch (error: any) {
        return { user: null, error: error.message };
      }
    }
    return { user: null, error: 'Firebase Auth not initialized' };
  },

  // Sign out
  signOut: async () => {
    if (isElectron() && window.firebaseAuth) {
      return window.firebaseAuth.signOut();
    } else if (auth) {
      try {
        await firebaseSignOut(auth);
        return { error: null };
      } catch (error: any) {
        return { error: error.message };
      }
    }
    return { error: 'Firebase Auth not initialized' };
  },

  // Get current user
  getCurrentUser: (): User | null => {
    if (isElectron() && window.firebaseAuth) {
      return window.firebaseAuth.getCurrentUser();
    } else if (auth) {
      return auth.currentUser;
    }
    return null;
  },

  // Listen to auth state changes
  onAuthStateChange: (callback: (user: User | null) => void) => {
    if (isElectron() && window.firebaseAuth) {
      return window.firebaseAuth.onAuthStateChanged(callback);
    } else if (auth) {
      return onAuthStateChanged(auth, callback);
    }
    return () => {}; // Return empty unsubscribe function
  }
};

// Firebase Firestore Service
export const firestoreService = {
  // Add a document to a collection
  addDocument: async (collectionName: string, data: any) => {
    if (isElectron() && window.firebaseFirestore) {
      return window.firebaseFirestore.addDocument(collectionName, data);
    } else if (db) {
      try {
        const docRef = doc(collection(db, collectionName));
        await setDoc(docRef, {
          ...data,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        return { id: docRef.id, error: null };
      } catch (error: any) {
        return { id: null, error: error.message };
      }
    }
    return { id: null, error: 'Firestore not initialized' };
  },

  // Get a document by ID
  getDocument: async (collectionName: string, id: string) => {
    if (isElectron() && window.firebaseFirestore) {
      return window.firebaseFirestore.getDocument(collectionName, id);
    } else if (db) {
      try {
        const docSnap = await getDoc(doc(db, collectionName, id));
        if (docSnap.exists()) {
          return { data: { id: docSnap.id, ...docSnap.data() }, error: null };
        } else {
          return { data: null, error: "Document does not exist" };
        }
      } catch (error: any) {
        return { data: null, error: error.message };
      }
    }
    return { data: null, error: 'Firestore not initialized' };
  },

  // Get all documents from a collection
  getDocuments: async (collectionName: string, constraints: QueryConstraint[] = []) => {
    if (isElectron() && window.firebaseFirestore) {
      return window.firebaseFirestore.getDocuments(collectionName, constraints);
    } else if (db) {
      try {
        const q = query(collection(db, collectionName), ...constraints);
        const querySnapshot = await getDocs(q);
        const documents = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        return { data: documents, error: null };
      } catch (error: any) {
        return { data: [], error: error.message };
      }
    }
    return { data: [], error: 'Firestore not initialized' };
  }
};
