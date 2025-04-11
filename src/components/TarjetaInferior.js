// TarjetaInferior.js
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Box
} from '@mui/material';
import { getAuth } from 'firebase/auth';
import {
  doc,
  getDoc,
} from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

const TarjetaInferior = () => {
  const [docIdentificacionURL, setDocIdentificacionURL] = useState('');
  const [cartaInvitacionURL, setCartaInvitacionURL] = useState('');
  const [poderURL, setPoderURL] = useState('');
  const [contratoURL, setContratoURL] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    const fetchDocumentos = async () => {
      if (!user) {
        setError('Usuario no autenticado');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const userDocRef = doc(db, 'usuarios', user.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const documentos = data.documentos || {};
          // Si no hay URL en la base de datos, usa una URL de ejemplo
          setDocIdentificacionURL(documentos.documentoIdentificacion?.url || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf');
          setCartaInvitacionURL(documentos.cartaInvitacion?.url || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf');
          setPoderURL(documentos.poder?.url || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf');
          setContratoURL(documentos.contrato?.url || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf');
        } else {
          setError('Documentos no encontrados');
        }
      } catch (err) {
        console.error('Error al obtener documentos:', err);
        setError('Error al cargar documentos.');
      } finally {
        setLoading(false);
      }
    };

    fetchDocumentos();
  }, [user]);

  return (
    <Card sx={{ minHeight: 200 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Descargar Documentos
        </Typography>

        {loading && <Typography>Cargando documentos...</Typography>}
        {error && <Typography color="error">{error}</Typography>}

        {!loading && !error && (
          <Grid container spacing={2}>
            {/* Documento de Identificación */}
            {/* <Grid item xs={12}>
              <Typography variant="body1">
                Documento de Identificación
              </Typography>
              {docIdentificacionURL ? (
                <Button
                  variant="contained"
                  href={docIdentificacionURL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Descargar Documento
                </Button>
              ) : (
                <Typography variant="body2">
                  No hay documento disponible.
                </Typography>
              )}
            </Grid> */}

            {/* Carta de Invitación */}
            <Grid item xs={12}>
              <Typography variant="body1">
                Carta de Invitación
              </Typography>
              {cartaInvitacionURL ? (
                <Button
                  variant="contained"
                  href={cartaInvitacionURL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Descargar Carta
                </Button>
              ) : (
                <Typography variant="body2">
                  No hay carta disponible.
                </Typography>
              )}
            </Grid>

            {/* Poder */}
            <Grid item xs={12}>
              <Typography variant="body1">
                Poder
              </Typography>
              {poderURL ? (
                <Button
                  variant="contained"
                  href={poderURL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Descargar Poder
                </Button>
              ) : (
                <Typography variant="body2">
                  No hay poder disponible.
                </Typography>
              )}
            </Grid>

            {/* Contrato */}
            <Grid item xs={12}>
              <Typography variant="body1">
                Contrato
              </Typography>
              {contratoURL ? (
                <Button
                  variant="contained"
                  href={contratoURL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Descargar Contrato
                </Button>
              ) : (
                <Typography variant="body2">
                  No hay contrato disponible.
                </Typography>
              )}
            </Grid>
          </Grid>
        )}
      </CardContent>
    </Card>
  );
};

export default TarjetaInferior;
