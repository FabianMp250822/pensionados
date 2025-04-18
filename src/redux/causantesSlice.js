// causantesSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { db } from '../firebase/firebaseConfig';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';

/**
 * Consulta en la colección "causante" si la cédula es un causante
 * o si aparece como beneficiario en el array "records" de algún documento.
 * 1) Busca doc con ID = cedula.
 * 2) Si no existe, recorre todos los docs y revisa si 'cedula' aparece en records[].cedula_beneficiario.
 * 3) Retorna { type: 'CAUSANTE' | 'BENEFICIARIO' | 'NONE', data }.
 */
export const fetchCausanteOrBeneficiario = createAsyncThunk(
  'causantes/fetchCausanteOrBeneficiario',
  async (cedula, { rejectWithValue }) => {
    try {
      // 1. Intentar obtener el documento (causante) con ID = cedula
      const docRef = doc(db, 'causante', cedula);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        // Hallado como causante
        return { type: 'CAUSANTE', data: docSnap.data() };
      } else {
        // 2. Si no existe, buscar si aparece como beneficiario en records de algún doc
        const colRef = collection(db, 'causante');
        const querySnap = await getDocs(colRef);

        let foundDoc = null;

        querySnap.forEach((snap) => {
          const docData = snap.data(); // { cedula_causante, records: [...] }
          if (Array.isArray(docData.records)) {
            // Ver si alguno de los records tiene cedula_beneficiario == cedula
            const found = docData.records.some(
              (r) => r.cedula_beneficiario === cedula
            );
            if (found) {
              foundDoc = docData;
            }
          }
        });

        if (foundDoc) {
          // Hallado como beneficiario
          return { type: 'BENEFICIARIO', data: foundDoc };
        } else {
          // No se encontró ni como causante ni como beneficiario
          return { type: 'NONE', data: null };
        }
      }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const causantesSlice = createSlice({
  name: 'causantes',
  initialState: {
    status: 'idle',       // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
    userType: null,       // 'CAUSANTE' | 'BENEFICIARIO' | 'NONE'
    causanteData: null    // Objeto con { cedula_causante, records: [...] } si existe
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCausanteOrBeneficiario.pending, (state) => {
        state.status = 'loading';
        state.error = null;
        state.userType = null;
        state.causanteData = null;
      })
      .addCase(fetchCausanteOrBeneficiario.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.userType = action.payload.type;
        state.causanteData = action.payload.data; // puede ser un objeto o null
      })
      .addCase(fetchCausanteOrBeneficiario.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export default causantesSlice.reducer;
