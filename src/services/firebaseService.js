// Importa las funciones de Firebase necesarias
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut, 
    GoogleAuthProvider, 
    signInWithPopup, 
    onAuthStateChanged 
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
  
  // Inicializa los servicios
  const auth = getAuth(app);
  const db = getFirestore(app);
  const storage = getStorage(app);
  const googleProvider = new GoogleAuthProvider(); // Proveedor de Google
  
  // Servicio de autenticación
  const firebaseAuthService = {
    // Iniciar sesión con email y contraseña
    login: async (email, password) => {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential.user;
      } catch (error) {
        throw new Error(error.message);
      }
    },
  
    // Registrar un usuario con email y contraseña
    register: async (email, password) => {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        return userCredential.user;
      } catch (error) {
        throw new Error(error.message);
      }
    },
  
    // Iniciar sesión con Google
    loginWithGoogle: async () => {
      try {
        const result = await signInWithPopup(auth, googleProvider);
        return result.user;
      } catch (error) {
        throw new Error(error.message);
      }
    },
  
    // Cerrar sesión
    logout: async () => {
      try {
        await signOut(auth);
        return true;
      } catch (error) {
        throw new Error(error.message);
      }
    },
  
    // Verificar el estado de autenticación persistente
    onAuthStateChanged: (callback) => {
      return onAuthStateChanged(auth, callback);
    },
  };
  
  // Servicio de Firestore (colecciones)
  const firebaseFirestoreService = {
    // Obtener una colección
    getCollection: async (collectionName) => {
      try {
        const colRef = collection(db, collectionName);
        const snapshot = await getDocs(colRef);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return data;
      } catch (error) {
        throw new Error(error.message);
      }
    },
  
    // Obtener un documento específico
    getDocument: async (collectionName, docId) => {
      try {
        const docRef = doc(db, collectionName, docId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          return docSnap.data();
        } else {
          return null;
        }
      } catch (error) {
        throw new Error(error.message);
      }
    },
  
    // Agregar un documento a una colección (con ID automático)
    addDocument: async (collectionName, data) => {
      try {
        const colRef = collection(db, collectionName);
        const docRef = await addDoc(colRef, data);
        return docRef.id;
      } catch (error) {
        throw new Error(error.message);
      }
    },
  
    // Establecer (crear o actualizar) un documento con un ID específico
    setDocument: async (collectionName, docId, data) => {
      try {
        const docRef = doc(db, collectionName, docId);
        await setDoc(docRef, data);
        return true;
      } catch (error) {
        throw new Error(error.message);
      }
    },
  
    // Actualizar un documento en una colección
    updateDocument: async (collectionName, docId, data) => {
      try {
        const docRef = doc(db, collectionName, docId);
        await updateDoc(docRef, data);
        return true;
      } catch (error) {
        throw new Error(error.message);
      }
    },
  
    // Eliminar un documento de una colección
    deleteDocument: async (collectionName, docId) => {
      try {
        const docRef = doc(db, collectionName, docId);
        await deleteDoc(docRef);
        return true;
      } catch (error) {
        throw new Error(error.message);
      }
    }
  };
  
  // Servicio de Storage (subida de archivos)
  const firebaseStorageService = {
    // Subir un archivo a Firebase Storage
    uploadFile: async (folder, file) => {
      try {
        const fileRef = ref(storage, `${folder}/${file.name}`);
        await uploadBytes(fileRef, file);
        const downloadURL = await getDownloadURL(fileRef);
        return downloadURL;
      } catch (error) {
        throw new Error(error.message);
      }
    },
  };
  
  // Exportar los servicios
  export {
    firebaseAuthService,
    firebaseFirestoreService,
    firebaseStorageService,
  };
  