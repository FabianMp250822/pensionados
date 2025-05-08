import axios from 'axios';

// Crear una instancia de axios con la URL base de la API
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api/',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Agregar interceptores para tokens de autenticación si es necesario
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;