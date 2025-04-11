// Importa las funciones necesarias de Firebase SDK
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage"; // Importa Storage
import { getVertexAI, getGenerativeModel } from "firebase/vertexai-preview";

// Tu configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDHvu1Ojjgv6FyiWfeJI626sPhy0eO6LA4",
  authDomain: "pensionados-d82b2.firebaseapp.com",
  projectId: "pensionados-d82b2",
  storageBucket: "pensionados-d82b2.appspot.com",
  messagingSenderId: "566240549353",
  appId: "1:566240549353:web:c28fa2e3c9e11af2141378",
  measurementId: "G-KMQNRDHWZN"
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
