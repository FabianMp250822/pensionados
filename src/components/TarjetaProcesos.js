import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Card, CardContent, Typography, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, Button, Box
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchProcesosStart,
  fetchProcesosSuccess,
  fetchProcesosFailure,
  fetchAnnotationsStart,
  fetchAnnotationsSuccess,
  fetchAnnotationsFailure,
  clearProcesosData,
  fetchAnalysisStart,
  fetchAnalysisSuccess,
  fetchAnalysisFailure,
} from '../redux/procesosContext';

const API_KEY = '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';

const TarjetaProcesos = ({ usuario }) => {
  const dispatch = useDispatch();
  const {
    procesos,
    loading,
    error,
    annotations,
    annotationsLoading,
    annotationsError,
    analysis,
    analysisLoading,
    analysisError,
  } = useSelector((state) => state.procesos);

  // Estado para gestionar qué proceso tiene las anotaciones desplegadas
  const [expandedProcess, setExpandedProcess] = useState(null);

  // Carga los procesos al montar el componente
  useEffect(() => {
    const fetchProcesos = async () => {
      if (!usuario || !usuario.cedula) {
        dispatch(fetchProcesosFailure('Usuario o cédula no proporcionados'));
        return;
      }
      dispatch(fetchProcesosStart());
      try {
        const response = await axios.get(`https://appdajusticia.com/procesos.php?cedula=${usuario.cedula}`);
        if (response.data.error) {
          dispatch(fetchProcesosFailure(response.data.error));
        } else {
          dispatch(fetchProcesosSuccess(response.data));
        }
      } catch (err) {
        console.error('Error al obtener los procesos:', err);
        dispatch(fetchProcesosFailure('Error al cargar los procesos.'));
      }
    };

    fetchProcesos();
    return () => {
      dispatch(clearProcesosData());
    };
  }, [usuario, dispatch]);

  // Precarga las anotaciones de todos los procesos una vez que éstos están disponibles
  useEffect(() => {
    if (procesos && procesos.length > 0) {
      procesos.forEach((proceso) => {
        // Si aún no se han cargado las anotaciones para este proceso
        if (!annotations[proceso.num_registro]) {
          dispatch(fetchAnnotationsStart(proceso.num_registro));
          axios.get(`https://appdajusticia.com/anotaciones.php?num_registro=${proceso.num_registro}`)
            .then(response => {
              dispatch(fetchAnnotationsSuccess({ num_registro: proceso.num_registro, data: response.data }));
            })
            .catch(err => {
              console.error('Error al obtener las anotaciones:', err);
              dispatch(fetchAnnotationsFailure({ num_registro: proceso.num_registro, error: 'Error al cargar anotaciones.' }));
            });
        }
      });
    }
  }, [procesos, dispatch, annotations]);

  // Función para mostrar u ocultar las anotaciones sin volver a disparar la carga
  const toggleAnnotations = (num_registro) => {
    setExpandedProcess(expandedProcess === num_registro ? null : num_registro);
  };

  // Función para obtener el análisis del proceso a partir de las anotaciones precargadas
  const obtenerAnalisis = async (num_registro) => {
    if (!annotations[num_registro] || annotations[num_registro].length === 0) {
      alert("Las anotaciones no están disponibles para este proceso.");
      return;
    }
    dispatch(fetchAnalysisStart(num_registro));
    try {
      // Construir el prompt concatenando los detalles de las anotaciones
      const prompt = "Analiza el estado y evolución del proceso a partir de las siguientes anotaciones: " +
        annotations[num_registro].map(a => a.detalle).join(" ");

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o',
          messages: [
            { role: 'user', content: prompt }
          ],
          max_tokens: 200,
          temperature: 0.7,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
          }
        }
      );

      const analysisText = response.data.choices[0].message.content;
      dispatch(fetchAnalysisSuccess({ num_registro, data: analysisText }));
    } catch (err) {
      console.error("Error al obtener el análisis:", err);
      dispatch(fetchAnalysisFailure({ num_registro, error: 'Error al obtener el análisis.' }));
    }
  };

  const pagoStatus = localStorage.getItem('pagoStatus');

  return (
    <Card sx={{ width: '100%', marginBottom: 2 }}>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Procesos del Cliente
        </Typography>

        {loading && <Typography>Cargando procesos...</Typography>}
        {error && <Typography color="error">{error}</Typography>}

        {!loading && !error && (
          <>
            {procesos.length > 0 ? (
              <TableContainer component={Paper}>
                <Table aria-label="tabla de procesos">
                  <TableHead>
                    <TableRow>
                      <TableCell># Registro</TableCell>
                      <TableCell>Radicado Inicial</TableCell>
                      <TableCell>Clase Proceso</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell>Negocio</TableCell>
                      <TableCell>Anotaciones</TableCell>
                      <TableCell>Análisis</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {procesos.map((proceso) => (
                      <React.Fragment key={proceso.num_registro}>
                        <TableRow>
                          <TableCell>{proceso.num_registro}</TableCell>
                          <TableCell>{proceso.num_radicado_ini}</TableCell>
                          <TableCell>{proceso.clase_proceso}</TableCell>
                          <TableCell>{proceso.estado}</TableCell>
                          <TableCell>{proceso.negocio}</TableCell>
                          <TableCell>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => toggleAnnotations(proceso.num_registro)}
                            >
                              {expandedProcess === proceso.num_registro ? 'Ocultar' : 'Ver'}
                            </Button>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => obtenerAnalisis(proceso.num_registro)}
                              disabled={analysisLoading[proceso.num_registro]}
                            >
                              {analysisLoading[proceso.num_registro] ? 'Analizando...' : 'Analizar Proceso'}
                            </Button>
                          </TableCell>
                        </TableRow>
                        {expandedProcess === proceso.num_registro && (
                          <TableRow>
                            <TableCell colSpan={7}>
                              {annotationsLoading[proceso.num_registro] ? (
                                <Typography>Cargando anotaciones...</Typography>
                              ) : annotationsError[proceso.num_registro] ? (
                                <Typography color="error">{annotationsError[proceso.num_registro]}</Typography>
                              ) : annotations[proceso.num_registro] && annotations[proceso.num_registro].length > 0 ? (
                                <TableContainer component={Paper}>
                                  <Table size="small" aria-label="tabla de anotaciones">
                                    <TableHead>
                                      <TableRow>
                                        <TableCell>Fecha</TableCell>
                                        <TableCell>Clase</TableCell>
                                        <TableCell>Detalle</TableCell>
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {annotations[proceso.num_registro].map((anotacion) => (
                                        <TableRow key={anotacion.auto}>
                                          <TableCell>{anotacion.fecha}</TableCell>
                                          <TableCell>{anotacion.clase}</TableCell>
                                          <TableCell>{anotacion.detalle}</TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </TableContainer>
                              ) : (
                                <Typography>No hay anotaciones registradas.</Typography>
                              )}
                              {analysis[proceso.num_registro] && (
                                <Paper sx={{ padding: 2, marginTop: 2 }}>
                                  <Typography variant="subtitle1">Análisis del Proceso:</Typography>
                                  <Typography variant="body2">{analysis[proceso.num_registro]}</Typography>
                                </Paper>
                              )}
                              {analysisError[proceso.num_registro] && (
                                <Typography color="error">{analysisError[proceso.num_registro]}</Typography>
                              )}
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <>
                {pagoStatus === 'noPago' ? (
                  <Box sx={{ textAlign: 'center', padding: 4 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1.5rem', marginBottom: 2 }}>
                      Usted actualmente no ha iniciado un proceso con nosotros
                    </Typography>
                    <Typography variant="body1">
                      Para iniciar el proceso, por favor envíe la documentación requerida y realice el pago inicial correspondiente.
                      Una vez recibida la información, nuestro equipo evaluará su caso y coordinará las siguientes etapas para ofrecerle la mejor atención.
                    </Typography>
                  </Box>
                ) : (
                  <>
                    <Typography variant="body1" gutterBottom>
                      Le informamos que su caso se encuentra actualmente en la etapa prejurídica. Esto significa que hemos iniciado un proceso de recopilación y análisis de información relevante para evaluar la situación laboral.
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      En esta fase, se ha solicitado la siguiente documentación:
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      • Hoja de vida del trabajador: Este documento es fundamental para conocer su trayectoria laboral, experiencia y calificaciones, lo cual es esencial para evaluar diversos aspectos legales relacionados con su empleo.
                      <br />
                      • Historial de pagos a Foneca: Este registro nos permite verificar las contribuciones realizadas a este fondo, asegurando el cumplimiento de las obligaciones legales y contractuales.
                      <br />
                      • Historial de pagos a Colpensiones: Similar al anterior, este documento es crucial para verificar sus aportes al sistema de pensiones, garantizando sus derechos y prestaciones futuras.
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      La recopilación de estos documentos es un paso necesario para obtener un panorama completo de su situación laboral.
                      Esta etapa requiere la reclamación administrativa completa tanto en Fiduprevisora como ante Colpensiones, para que los jueces de la república (Laboral) adquieran la competencia.
                    </Typography>
                    <Typography variant="body2" sx={{ marginTop: 2 }}>
                      Puntos clave a recordar:
                      <br />
                      - La etapa prejurídica es un paso previo a un posible litigio judicial.
                      <br />
                      - Su objetivo es recopilar información para evaluar la situación y buscar soluciones extrajudiciales.
                      <br />
                      - La documentación solicitada es esencial para dicho análisis.
                    </Typography>
                  </>
                )}
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default TarjetaProcesos;
