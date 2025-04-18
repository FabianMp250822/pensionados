// firebaseService.js
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  GoogleAuthProvider, 
  signInWithPopup 
} from "firebase/auth";

import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  setDoc, 
  getDoc 
} from "firebase/firestore";

import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from "firebase/storage";

import { app } from "../firebase/firebaseConfig"; 

// Inicialización de servicios
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

const firebaseAuthService = {
  // Iniciar sesión con email y contraseña
  login: async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  },
  // Registrar un usuario con email y contraseña
  register: async (email, password) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  },
  // Iniciar sesión con Google
  loginWithGoogle: async () => {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  },
  // Cerrar sesión
  logout: async () => {
    await signOut(auth);
    return true;
  }
};

const firebaseFirestoreService = {
  // Obtener una colección
  getCollection: async (collectionName) => {
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
  // Obtener un documento específico
  getDocument: async (collectionName, docId) => {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
  },
  // Agregar un documento a una colección (ID automático)
  addDocument: async (collectionName, data) => {
    const colRef = collection(db, collectionName);
    const docRef = await addDoc(colRef, data);
    return docRef.id;
  },
  // Crear o actualizar un documento con un ID específico
  setDocument: async (collectionName, docId, data) => {
    const docRef = doc(db, collectionName, docId);
    await setDoc(docRef, data);
    return true;
  },
  // Actualizar un documento en una colección
  updateDocument: async (collectionName, docId, data) => {
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, data);
    return true;
  },
  // Eliminar un documento de una colección
  deleteDocument: async (collectionName, docId) => {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
    return true;
  }
};

const firebaseStorageService = {
  // Subir un archivo a Firebase Storage y obtener la URL de descarga
  uploadFile: async (folder, file) => {
    const fileRef = ref(storage, `${folder}/${file.name}`);
    await uploadBytes(fileRef, file);
    const downloadURL = await getDownloadURL(fileRef);
    return downloadURL;
  }
};

export {
  firebaseAuthService,
  firebaseFirestoreService,
  firebaseStorageService,
};
