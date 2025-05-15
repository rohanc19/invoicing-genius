import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import app from "./config";

// Initialize Firebase Storage
const storage = getStorage(app);

// Upload a file to Firebase Storage
export const uploadFile = async (path: string, file: File | Blob) => {
  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return { url: downloadURL, error: null };
  } catch (error: any) {
    return { url: null, error: error.message };
  }
};

// Get a download URL for a file
export const getFileURL = async (path: string) => {
  try {
    const storageRef = ref(storage, path);
    const url = await getDownloadURL(storageRef);
    return { url, error: null };
  } catch (error: any) {
    return { url: null, error: error.message };
  }
};

// Delete a file from Firebase Storage
export const deleteFile = async (path: string) => {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
};
