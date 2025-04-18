import React, { useState, useEffect } from 'react';
import { getFirestore, doc, setDoc, getDoc, writeBatch } from 'firebase/firestore';
import './Certificaciones.css';

const Certificaciones = () => {
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState('');
  const [currentFile, setCurrentFile] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [procesadosConCostas, setProcesadosConCostas] = useState([]);
  const [procesadosSinCostas, setProcesadosSinCostas] = useState([]);
  const [usuarioActual, setUsuarioActual] = useState(''); // Nuevo estado para mostrar el usuario actual

  const db = getFirestore();

  const handleFileUpload = (event) => {
    const selectedFiles = event.target.files;
    if (selectedFiles.length > 0) {
      const jsonFiles = Array.from(selectedFiles).filter((file) =>
        file.name.toLowerCase().endsWith('.json')
      );
      setFiles(jsonFiles);
    }
  };

  const parseFilePath = (filePath) => {
    const pathSegments = filePath.split('/');
    const fileName = pathSegments[pathSegments.length - 1];
    const parentFolder = pathSegments[pathSegments.length - 2];
    const parts = parentFolder.split('_');
    if (parts.length >= 2) {
      return { documentId: parts[0], year: parts[1] };
    } else {
      const fileParts = fileName.split('_');
      return { documentId: fileParts[0], year: fileParts[1] };
    }
  };

  const procesarTabla = (table) => {
    if (!table || table.length === 0) {
      return [];
    }
    return table
      .slice(1)
      .filter((row) => row.some((cell) => cell.trim() !== ''))
      .map((row) => ({
        codigo: row[0] || null,
        nombre: row[1] || null,
        ingresos: row[6]
          ? parseFloat(row[6].replace(/\./g, '').replace(',', '.'))
          : 0,
        egresos: row[7]
          ? parseFloat(row[7].replace(/\./g, '').replace(',', '.'))
          : 0,
      }));
  };

  const verificarYProcesarCostas = async (detalles, documentId, jsonData) => {
    const costasProcesales = detalles.find(item => item.codigo === '470');
    const procesosSentencia = detalles.find(item => item.codigo === '475');
    const retroMesada = detalles.find(item => item.codigo === '476');
    const nombreUsuario = `${jsonData[0].lblEmpleado} (C.C. ${documentId})`;

    setUsuarioActual(`Procesando: ${nombreUsuario}`); // Mostrar el usuario actual

    if (costasProcesales || procesosSentencia) {
      const pagoCostasRef = doc(db, 'pagocostas', documentId);
      
      const datosPagoCostas = {
        id: documentId,
        nombre: nombreUsuario,
        costasProcesales: costasProcesales ? costasProcesales.ingresos : 0,
        procesosSentencia: procesosSentencia ? procesosSentencia.ingresos : 0,
        retroMesadaAdicional: retroMesada ? retroMesada.ingresos : 0,
        fechaCostas: costasProcesales ? jsonData[0].lblPeriodoPago : "",
        fechaProcesos: procesosSentencia ? jsonData[0].lblPeriodoPago : "",
        fechaRetros: retroMesada ? jsonData[0].lblPeriodoPago : "",
        pnlCentroCosto: jsonData[0].pnlCentroCosto || "",
        pnlDependencia: jsonData[0].pnlDependencia || "",
        total: (costasProcesales ? costasProcesales.ingresos : 0) + 
               (procesosSentencia ? procesosSentencia.ingresos : 0) + 
               (retroMesada ? retroMesada.ingresos : 0)
      };

      try {
        await setDoc(pagoCostasRef, datosPagoCostas, { merge: true });
        setProcesadosConCostas(prev => [...prev, datosPagoCostas]);
        setStatus(prev => `${prev}\nProcesado pago especial para: ${nombreUsuario}`);
        return true;
      } catch (error) {
        console.error('Error al guardar datos en pagocostas:', error);
        return false;
      }
    } else {
      setProcesadosSinCostas(prev => [...prev, nombreUsuario]);
      setStatus(prev => `${prev}\nUsuario sin pagos especiales: ${nombreUsuario}`);
    }
    return false;
  };

  const limpiarDatos = (obj) => {
    return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v != null));
  };

  const subirDatos = async () => {
    setIsProcessing(true);
    setStatus('Iniciando el procesamiento de archivos...');
    setProcesadosConCostas([]);
    setProcesadosSinCostas([]);
    setUsuarioActual('');

    for (let file of files) {
      setCurrentFile(file.webkitRelativePath || file.name);

      try {
        const reader = new FileReader();
        await new Promise((resolve) => {
          reader.onload = async (e) => {
            try {
              const jsonData = JSON.parse(e.target.result);
              const { documentId, year } = parseFilePath(file.webkitRelativePath || file.name);

              if (!documentId || !year) {
                console.error(`No se pudo extraer documentId y year de la ruta: ${file.webkitRelativePath || file.name}`);
                resolve();
                return;
              }

              const clienteRef = doc(db, 'pensionados', documentId);
              const docSnap = await getDoc(clienteRef);

              const pensionado = limpiarDatos({
                empresa: jsonData[0].lblEmpresa,
                nitEmpresa: jsonData[0].lblNitEmpresa,
                empleado: jsonData[0].lblEmpleado,
                documento: jsonData[0].lblDocumento,
                esquema: jsonData[0].lblEsquema,
                hEsquema: jsonData[0].lblhEsquema,
                centroCosto: jsonData[0].lblCentroCosto,
                centroCosto1: jsonData[0].lblCentroCosto1,
                pnlCentroCosto: jsonData[0].pnlCentroCosto,
                dependencia: jsonData[0].lblDependencia,
                dependencia1: jsonData[0].lblDependencia1,
                pnlDependencia: jsonData[0].pnlDependencia,
                hBasico: jsonData[0].lblhBasico,
                basico: jsonData[0].lblBasico,
                periodoPago: jsonData[0].lblPeriodoPago,
                fecha: jsonData[0].lblFecha,
                cargo: jsonData[0].lblCargo,
                grado: jsonData[0].lblGrado,
                neto: jsonData[0].lblNeto
              });

              if (docSnap.exists()) {
                await setDoc(clienteRef, pensionado, { merge: true });
              } else {
                await setDoc(clienteRef, pensionado);
              }

              const batch = writeBatch(db);

              for (const pago of jsonData) {
                const pagoId = `${pago.lblPeriodoPago}_${pago.lblFecha}`
                  .replace(/[/\\?%*:|"<>]/g, '-')
                  .replace(/\s+/g, '_');

                const pagoRef = doc(db, `pensionados/${documentId}/pagos`, pagoId);
                const tablaProcesada = procesarTabla(pago.tables[0]);

                // Verificar y procesar costas
                await verificarYProcesarCostas(tablaProcesada, documentId, jsonData);

                const pagoData = limpiarDatos({
                  periodoPago: pago.lblPeriodoPago,
                  fechaLiquidacion: pago.lblFecha,
                  basico: pago.lblBasico,
                  valorLiquidado: pago.dtgLiquidacion,
                  valorNeto: pago.lblNeto,
                  grado: pago.lblGrado,
                  año: year,
                  detalles: tablaProcesada,
                });

                batch.set(pagoRef, pagoData, { merge: true });
              }

              await batch.commit();
            } catch (error) {
              console.error(`Error al procesar el archivo: `, error);
            } finally {
              resolve();
            }
          };

          reader.onerror = () => {
            console.error(`Error de lectura del archivo ${file.name}`);
            resolve();
          };

          reader.readAsText(file);
        });
      } catch (error) {
        console.error(`Error general al procesar el archivo: `, error);
      }
    }

    setStatus(prev => `${prev}\nProcesamiento completado.`);
    setUsuarioActual('');
    setCurrentFile('');
    setIsProcessing(false);
    setFiles([]);
  };

  useEffect(() => {
    if (files.length > 0 && !isProcessing) {
      subirDatos();
    }
  }, [files]);

  return (
    <div className="certificaciones-container">
      <h1>Carga de archivo para la actualizacion de datos </h1>
      <p>Selecciona una carpeta que contenga los archivos JSON para subir las certificaciones de los pensionados.</p>
      <input
        type="file"
        accept=".json"
        multiple
        webkitdirectory="true"
        onChange={handleFileUpload}
        disabled={isProcessing}
      />
      {usuarioActual && <p className="usuario-actual">{usuarioActual}</p>}
      {status && <p className="status-message">{status}</p>}
      {currentFile && <p>Procesando archivo: {currentFile}</p>}
      
      <div className="resultados-procesamiento">
        {procesadosConCostas.length > 0 && (
          <div className="costas-procesadas">
            <h3>Usuarios CON pagos especiales:</h3>
            <ul>
              {procesadosConCostas.map((pago, index) => (
                <li key={index} className="pago-costas">
                  <strong>{pago.nombre}</strong>
                  <p>Costas Procesales: ${pago.costasProcesales.toLocaleString()}</p>
                  <p>Procesos y Sentencias: ${pago.procesosSentencia.toLocaleString()}</p>
                  <p>Total: ${pago.total.toLocaleString()}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {procesadosSinCostas.length > 0 && (
          <div className="sin-costas">
            <h3>Usuarios SIN pagos especiales:</h3>
            <ul>
              {procesadosSinCostas.map((nombre, index) => (
                <li key={index}>{nombre}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Certificaciones;