import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import pensionesReducer from './pensionesSlice';
import contabilidadReducer from './contabilidadSlice.js'; // Importa el nuevo reducer

const store = configureStore({
  reducer: {
    auth: authReducer,
    pensiones: pensionesReducer,
    contabilidad: contabilidadReducer, // Añade el reducer de contabilidad
  },
});

export default store;
