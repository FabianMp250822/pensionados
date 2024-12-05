import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { firebaseFirestoreService } from '../services/firebaseService';

// Thunk para cargar eventos desde Firestore
export const fetchEventos = createAsyncThunk('eventos/fetchEventos', async () => {
  const eventos = await firebaseFirestoreService.getCollection('eventos'); // Aquí 'eventos' es el nombre de la colección
  return eventos;
});

const eventosSlice = createSlice({
  name: 'eventos',
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchEventos.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEventos.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchEventos.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export default eventosSlice.reducer;
