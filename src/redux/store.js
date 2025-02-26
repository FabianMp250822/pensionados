import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import pensionesReducer from './pensionesSlice';
import contabilidadReducer from './contabilidadSlice.js'; // Importa el nuevo reducer
import causantesReducer from './causantesSlice';
const store = configureStore({
  reducer: {
    auth: authReducer,
    pensiones: pensionesReducer,
    contabilidad: contabilidadReducer,
    causantes: causantesReducer,
  },
});

export default store;
