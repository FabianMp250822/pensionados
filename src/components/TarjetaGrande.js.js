// /home/flag/Documentos/Analisispensiones/pendionados/src/components/TarjetaGrande.js.js
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid,
  Box,
} from '@mui/material';
import ChatWidget from './ChatWidget';
import { db } from '../firebase/firebaseConfig';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from 'firebase/firestore';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchPensionadoDataStart,
  fetchPensionadoDataSuccess,
  fetchPensionadoDataFailure,
  clearPensionadoData,
} from '../redux/pensionadoContext';

const TarjetaGrande = ({ usuario }) => {
  const dispatch = useDispatch();
  const { pensionadoData, isLoading: isPensionadoLoading, error: pensionadoError } = useSelector(
    (state) => state.pensionado
  );
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagosNuevosClientes, setPagosNuevosClientes] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        if (usuario && usuario.cedula) {
          // Buscar pagos en 'nuevosclientes'
          const clientesRef = collection(db, 'nuevosclientes');
          const qClientes = query(clientesRef, where('cedula', '==', usuario.cedula));
          const querySnapshot = await getDocs(qClientes);

          if (!querySnapshot.empty) {
            const clienteDoc = querySnapshot.docs[0];
            const clienteId = clienteDoc.id;

            const pagosRefClientes = collection(db, 'nuevosclientes', clienteId, 'pagos');
            const pagosSnapshotClientes = await getDocs(pagosRefClientes);

            const pagosDataClientes = pagosSnapshotClientes.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            setPagosNuevosClientes(pagosDataClientes);
          } else {
            setPagosNuevosClientes([]);
          }
        }
      } catch (err) {
        console.error('Error al obtener los datos:', err);
        setError('Error al cargar los datos.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [usuario]);

  useEffect(() => {
    const fetchPensionado = async () => {
      if (usuario && usuario.cedula) {
        dispatch(fetchPensionadoDataStart());
        try {
          const pensionadosRef = collection(db, 'pensionados');
          const docRef = doc(pensionadosRef, usuario.cedula);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            dispatch(fetchPensionadoDataSuccess(docSnap.data()));

            // Buscar la subcolección 'pagos' dentro del documento encontrado
            const pagosRef = collection(db, 'pensionados', usuario.cedula, 'pagos');
            const pagosSnapshot = await getDocs(pagosRef);

            const pagosData = pagosSnapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            setPagos(pagosData);
          } else {
            dispatch(fetchPensionadoDataFailure('No se encontraron datos del pensionado.'));
            setPagos([]);
          }
        } catch (error) {
          dispatch(fetchPensionadoDataFailure(error.message));
        }
      }
    };
    fetchPensionado();
    return () => {
      dispatch(clearPensionadoData());
    };
  }, [usuario, dispatch]);

  // Guardar en el localStorage el estado de pagos del usuario
  useEffect(() => {
    if (!loading && !error) {
      if (pagosNuevosClientes.length === 0) {
        localStorage.setItem('pagoStatus', 'noPago');
      } else {
        localStorage.setItem('pagoStatus', 'pagoRealizado');
      }
    }
  }, [loading, error, pagosNuevosClientes]);

  // Función para extraer la fecha final (día, mes y año) del periodoPago.
  const getEndDateFromPeriodoPago = (periodoPago) => {
    if (!periodoPago) return null;
    const parts = periodoPago.split(' a ');
    if (parts.length === 2) {
      const endDateStr = parts[1].trim();
      const dateParts = endDateStr.split(' ');
      if (dateParts.length >= 3) {
        const day = parseInt(dateParts[0], 10);
        const month = dateParts[1];
        const year = parseInt(dateParts[2], 10);
        return { day, month, year };
      }
    }
    return null;
  };

  // Función para comparar los pagos según la fecha final del periodoPago
  const comparePeriodoPago = (a, b) => {
    const dateA = getEndDateFromPeriodoPago(a.periodoPago);
    const dateB = getEndDateFromPeriodoPago(b.periodoPago);

    if (!dateA || !dateB) return 0;

    if (dateA.year !== dateB.year) {
      return dateB.year - dateA.year;
    } else if (dateA.month !== dateB.month) {
      const months = ['ene.', 'feb.', 'mar.', 'abr.', 'may.', 'jun.', 'jul.', 'ago.', 'sep.', 'oct.', 'nov.', 'dic.'];
      return months.indexOf(dateB.month) - months.indexOf(dateA.month);
    } else {
      return dateB.day - dateA.day;
    }
  };

  const pagosOrdenados = [...pagos].sort(comparePeriodoPago);

  return (
    <Card
      sx={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <CardContent sx={{ flexGrow: 1, overflowY: 'auto', paddingBottom: '80px' }}>
        <Typography variant="h5" gutterBottom>
          Resumen del Cliente
        </Typography>

        {loading && <Typography>Cargando datos...</Typography>}
        {error && <Typography color="error">{error}</Typography>}
        {isPensionadoLoading && <Typography>Cargando datos del pensionado...</Typography>}
        {pensionadoError && <Typography color="error">{pensionadoError}</Typography>}

        {!loading && !error && pagosNuevosClientes.length === 0 && (
          <Box sx={{ textAlign: 'center', padding: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1.5rem', marginBottom: 2 }}>
              Usted no tiene un proceso actualmente con el consorcio.
            </Typography>
            <Typography variant="body1">
              Para iniciar con el proceso, por favor escríbanos a nuestros números de contacto.
            </Typography>
          </Box>
        )}

        {!loading && !error && pagosNuevosClientes.length > 0 && (
          <>
            {pensionadoData && (
              <>
                <Typography variant="h6" gutterBottom>
                  Datos Básicos del Pensionado
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Typography variant="body1">
                      <strong>Tipo pensión:</strong> {pensionadoData.centroCosto}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Departamento:</strong> {pensionadoData.dependencia}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Documento:</strong> {pensionadoData.documento}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="body1">
                      <strong>Empresa:</strong> {pensionadoData.empresa}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Esquema:</strong> {pensionadoData.esquema}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Fecha:</strong> {pensionadoData.fecha}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Fondo Salud:</strong> {pensionadoData.fondoSalud}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="body1">
                      <strong>Neto:</strong> {pensionadoData.neto}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Estado:</strong> {pensionadoData.nivContratacion2}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Periodo Pago:</strong> {pensionadoData.periodoPago}
                    </Typography>
                  </Grid>
                </Grid>
              </>
            )}

            {/* Sección de Pagos Realizados */}
            <Typography variant="h6" gutterBottom sx={{ marginTop: '20px' }}>
              Pagos Realizados al proceso
            </Typography>
            <TableContainer component={Paper}>
              <Table sx={{ minWidth: 650 }} aria-label="simple table">
                <TableHead>
                  <TableRow>
                    <TableCell>Fecha</TableCell>
                    <TableCell align="right">Monto</TableCell>
                    <TableCell align="right">Monto Neto</TableCell>
                    <TableCell align="right">Soporte</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pagosNuevosClientes.map((pago) => (
                    <TableRow key={pago.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell component="th" scope="row">
                        {pago.fecha}
                      </TableCell>
                      <TableCell align="right">{pago.monto}</TableCell>
                      <TableCell align="right">{pago.montoNeto}</TableCell>
                      <TableCell align="right">
                        {pago.soporteURL && (
                          <a href={pago.soporteURL} target="_blank" rel="noopener noreferrer">
                            Ver Soporte
                          </a>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Sección Último Pago Recibido */}
            {pagosOrdenados.length > 0 ? (
              <>
                <Typography variant="h6" gutterBottom sx={{ marginTop: '20px' }}>
                  Último Pago Recibido por concepto de pensión
                </Typography>
                <TableContainer component={Paper}>
                  <Table sx={{ minWidth: 650 }} aria-label="simple table">
                    <TableHead>
                      <TableRow>
                        <TableCell>Año</TableCell>
                        <TableCell align="right">Básico</TableCell>
                        <TableCell align="right">Valor Neto</TableCell>
                        <TableCell align="right">Fecha Liquidación</TableCell>
                        <TableCell align="right">Fecha Procesado</TableCell>
                        <TableCell align="right">Periodo Pago</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pagosOrdenados.slice(0, 1).map((pago) => (
                        <TableRow key={pago.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                          <TableCell component="th" scope="row">
                            {pago.año}
                          </TableCell>
                          <TableCell align="right">{pago.basico}</TableCell>
                          <TableCell align="right">{pago.valorNeto}</TableCell>
                          <TableCell align="right">{pago.fechaLiquidacion}</TableCell>
                          <TableCell align="right">
                            {pago.fechaProcesado.toDate().toLocaleString()}
                          </TableCell>
                          <TableCell align="right">{pago.periodoPago}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            ) : (
              <Typography sx={{ marginTop: '20px' }}>No se encontraron pagos.</Typography>
            )}
          </>
        )}
      </CardContent>
      <Box sx={{ position: 'absolute', bottom: 0, width: '100%' }}>
        <ChatWidget />
      </Box>
    </Card>
  );
};

export default TarjetaGrande;
