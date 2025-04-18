// Importa las funciones necesarias de Firebase SDK
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage"; // Importa Storage
import { getVertexAI, getGenerativeModel } from "firebase/vertexai-preview";

// Tu configuración de Firebase
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Firestore y Auth
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app); // Inicializar Storage

// Inicializar el servicio de Vertex AI
const vertexAI = getVertexAI(app);

// Inicializar el modelo generativo de Gemini 1.5
const model = getGenerativeModel(vertexAI, { model: "gemini-2.0-flash" });

// Exportar servicios de Firebase y la instancia de `app` y modelo
export { db, auth, app, vertexAI, model, storage };
