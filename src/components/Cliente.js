// Cliente.js
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import TarjetaSuperior from './TarjetaSuperior';
import TarjetaInferior from './TarjetaInferior';
import TarjetaGrande from './TarjetaGrande.js';
import TarjetaProcesos from './TarjetaProcesos.js';
import { fetchUserDataStart, fetchUserDataSuccess, fetchUserDataFailure } from '../redux/clienteContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { getAuth } from 'firebase/auth';

const Cliente = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userData, isLoading, error } = useSelector((state) => state.user);

  useEffect(() => {
    const fetchUserData = async () => {
      dispatch(fetchUserDataStart());
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (user) {
          // Primero verificamos el rol del usuario
          const rolRef = doc(db, 'rol', user.uid);
          const rolSnap = await getDoc(rolRef);
          const userRole = rolSnap.exists() ? rolSnap.data().nivel : null;

          // Luego verificamos los datos del usuario
          const docRef = doc(db, 'usuarios', user.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            dispatch(fetchUserDataSuccess(docSnap.data()));
          } else {
            // Si no hay datos y es administrador, redirigir
            if (userRole === 'administrador') {
              navigate('/consultas');
            }
            dispatch(fetchUserDataFailure('No se encontraron datos del usuario.'));
          }
        } else {
          dispatch(fetchUserDataFailure('Usuario no autenticado.'));
        }
      } catch (error) {
        dispatch(fetchUserDataFailure(error.message));
      }
    };

    fetchUserData();
  }, [dispatch, navigate]);

  if (isLoading) {
    return <div style={{ paddingTop: '25px' }}>Cargando...</div>;
  }

  if (error) {
    return <div style={{ paddingTop: '25px' }}>Error: {error}</div>;
  }

  if (!userData) {
    return <div style={{ paddingTop: '25px' }}>No se encontraron datos del usuario.</div>;
  }

  return (
    <div style={{ padding: '25px' }}>
      <Grid container spacing={2}>
        {/* Columna izquierda */}
        <Grid item xs={12} md={3}>
          <Grid container spacing={2} direction="column">
            {/* Tarjeta Superior con datos del usuario */}
            <Grid item>
              <TarjetaSuperior usuario={userData} />
            </Grid>
            {/* Tarjeta Inferior en blanco o placeholder */}
            <Grid item>
              <TarjetaInferior usuario={userData} />
            </Grid>
          </Grid>
        </Grid>

        {/* Columna derecha: tarjeta grande vacía o placeholder */}
        <Grid item xs={12} md={9}>
          <TarjetaGrande usuario={userData} />
          <TarjetaProcesos usuario={userData} />
        </Grid>
      </Grid>
    </div>
  );
};

export default Cliente;
