import {
  collection,
  doc,
  setDoc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  DocumentData,
  QueryConstraint,
  Timestamp,
  serverTimestamp
} from "firebase/firestore";
import { db } from "./config";

// Generic function to add a document to a collection
export const addDocument = async (collectionName: string, data: any) => {
  try {
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { id: docRef.id, error: null };
  } catch (error: any) {
    return { id: null, error: error.message };
  }
};

// Generic function to set a document with a specific ID
export const setDocument = async (collectionName: string, id: string, data: any) => {
  try {
    await setDoc(doc(db, collectionName, id), {
      ...data,
      updatedAt: serverTimestamp()
    }, { merge: true });
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
};

// Generic function to get a document by ID
export const getDocument = async (collectionName: string, id: string) => {
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
};

// Generic function to get all documents from a collection
export const getDocuments = async (
  collectionName: string,
  constraints: QueryConstraint[] = []
) => {
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
};

// Generic function to update a document
export const updateDocument = async (collectionName: string, id: string, data: any) => {
  try {
    await updateDoc(doc(db, collectionName, id), {
      ...data,
      updatedAt: serverTimestamp()
    });
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
};

// Generic function to delete a document
export const deleteDocument = async (collectionName: string, id: string) => {
  try {
    await deleteDoc(doc(db, collectionName, id));
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
};

// Helper functions for common query constraints
export const whereEqual = (field: string, value: any) => where(field, "==", value);
export const whereIn = (field: string, values: any[]) => where(field, "in", values);
export const orderByField = (field: string, direction: "asc" | "desc" = "asc") => 
  orderBy(field, direction);
export const limitTo = (n: number) => limit(n);

// Convert Firebase timestamp to Date
export const timestampToDate = (timestamp: Timestamp) => timestamp.toDate();

// Convert Date to Firebase timestamp
export const dateToTimestamp = (date: Date) => Timestamp.fromDate(date);
