const { initializeApp } = require('firebase/app');
const {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  onAuthStateChanged
} = require('firebase/auth');
const {
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
  serverTimestamp
} = require('firebase/firestore');
const {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} = require('firebase/storage');

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCYdWOns1zH2zxHIcJ9TM4Wgh5_rMvu-6U",
  authDomain: "invoicing-genius-9bf2a.firebaseapp.com",
  projectId: "invoicing-genius-9bf2a",
  storageBucket: "invoicing-genius-9bf2a.appspot.com",
  messagingSenderId: "1015184244598", // You may need to update this with your actual Messaging Sender ID
  appId: "1:1015184244598:web:a9e5c8b0e7c8f3a5f3c8d9" // You may need to update this with your actual App ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Authentication functions
const firebaseAuth = {
  // Sign up with email and password
  signUp: async (email, password) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Send email verification
      if (userCredential.user) {
        await sendEmailVerification(userCredential.user);
      }
      return { user: userCredential.user, error: null };
    } catch (error) {
      return { user: null, error: error.message };
    }
  },

  // Sign in with email and password
  signIn: async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return { user: userCredential.user, error: null };
    } catch (error) {
      return { user: null, error: error.message };
    }
  },

  // Sign out
  signOut: async () => {
    try {
      await signOut(auth);
      return { error: null };
    } catch (error) {
      return { error: error.message };
    }
  },

  // Get current user
  getCurrentUser: () => {
    return auth.currentUser;
  },

  // Listen to auth state changes
  onAuthStateChanged: (callback) => {
    return onAuthStateChanged(auth, callback);
  }
};

// Firestore functions
const firebaseFirestore = {
  // Add a document to a collection
  addDocument: async (collectionName, data) => {
    try {
      const docRef = doc(collection(db, collectionName));
      await setDoc(docRef, {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return { id: docRef.id, error: null };
    } catch (error) {
      return { id: null, error: error.message };
    }
  },

  // Set a document with a specific ID
  setDocument: async (collectionName, id, data) => {
    try {
      await setDoc(doc(db, collectionName, id), {
        ...data,
        updatedAt: new Date()
      }, { merge: true });
      return { error: null };
    } catch (error) {
      return { error: error.message };
    }
  },

  // Get a document by ID
  getDocument: async (collectionName, id) => {
    try {
      const docSnap = await getDoc(doc(db, collectionName, id));
      if (docSnap.exists()) {
        return { data: { id: docSnap.id, ...docSnap.data() }, error: null };
      } else {
        return { data: null, error: "Document does not exist" };
      }
    } catch (error) {
      return { data: null, error: error.message };
    }
  },

  // Get all documents from a collection
  getDocuments: async (collectionName, constraints = []) => {
    try {
      const q = query(collection(db, collectionName), ...constraints);
      const querySnapshot = await getDocs(q);
      const documents = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return { data: documents, error: null };
    } catch (error) {
      return { data: [], error: error.message };
    }
  },

  // Update a document
  updateDocument: async (collectionName, id, data) => {
    try {
      await updateDoc(doc(db, collectionName, id), {
        ...data,
        updatedAt: new Date()
      });
      return { error: null };
    } catch (error) {
      return { error: error.message };
    }
  },

  // Delete a document
  deleteDocument: async (collectionName, id) => {
    try {
      await deleteDoc(doc(db, collectionName, id));
      return { error: null };
    } catch (error) {
      return { error: error.message };
    }
  }
};

// Firebase Storage functions
const firebaseStorage = {
  // Upload a file to Firebase Storage
  uploadFile: async (path, file) => {
    try {
      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return { url: downloadURL, error: null };
    } catch (error) {
      return { url: null, error: error.message };
    }
  },

  // Get a download URL for a file
  getFileURL: async (path) => {
    try {
      const storageRef = ref(storage, path);
      const url = await getDownloadURL(storageRef);
      return { url, error: null };
    } catch (error) {
      return { url: null, error: error.message };
    }
  },

  // Delete a file from Firebase Storage
  deleteFile: async (path) => {
    try {
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
      return { error: null };
    } catch (error) {
      return { error: error.message };
    }
  }
};

module.exports = {
  firebaseAuth,
  firebaseFirestore,
  firebaseStorage
};
