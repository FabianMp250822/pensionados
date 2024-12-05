import React, { useState, useEffect } from 'react';
import { getFirestore, doc, setDoc, getDoc, writeBatch, collection } from 'firebase/firestore';
import './Certificaciones.css';

const Certificaciones = () => {
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState('');
  const [currentFile, setCurrentFile] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const db = getFirestore();

  const handleFileUpload = (event) => {
    const selectedFiles = event.target.files;
    if (selectedFiles.length > 0) {
      // Convierte FileList a array y filtra solo archivos .json
      const jsonFiles = Array.from(selectedFiles).filter((file) =>
        file.name.toLowerCase().endsWith('.json')
      );
      setFiles(jsonFiles);
    }
  };

  const parseFilePath = (filePath) => {
    // Divide la ruta en segmentos
    const pathSegments = filePath.split('/');
    // Obtenemos el último segmento de la ruta (nombre del archivo)
    const fileName = pathSegments[pathSegments.length - 1];
    // Obtenemos el penúltimo segmento (carpeta que contiene el archivo)
    const parentFolder = pathSegments[pathSegments.length - 2];
    // Extraemos documentId y year de la carpeta o del nombre del archivo
    const parts = parentFolder.split('_');
    if (parts.length >= 2) {
      return { documentId: parts[0], year: parts[1] };
    } else {
      // Si no hay suficiente información en la carpeta, intentamos con el nombre del archivo
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

  const limpiarDatos = (obj) => {
    return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v != null));
  };

  useEffect(() => {
    if (files.length > 0 && !isProcessing) {
      subirDatos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files]);

  const subirDatos = async () => {
    setIsProcessing(true);
    setStatus('Iniciando el procesamiento de archivos...');

    for (let file of files) {
      setCurrentFile(file.webkitRelativePath || file.name);

      try {
        const reader = new FileReader();
        const fileReadPromise = new Promise((resolve) => {
          reader.onload = async (e) => {
            try {
              const jsonData = JSON.parse(e.target.result);
              const { documentId, year } = parseFilePath(file.webkitRelativePath || file.name);

              if (!documentId || !year) {
                console.error(
                  `No se pudo extraer documentId y year de la ruta: ${file.webkitRelativePath || file.name}`
                );
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
                hCargo: jsonData[0].lblhCargo,
                cargo: jsonData[0].lblCargo,
                pnlNivContratacion: jsonData[0].pnlNivContratacion,
                nivContratacion: jsonData[0].lblNivContratacion,
                nivContratacion2: jsonData[0].lblNivContratacion2,
                hGrado: jsonData[0].lblhGrado,
                grado: jsonData[0].lblGrado,
                dtgLiquidacion: jsonData[0].dtgLiquidacion,
                neto: jsonData[0].lblNeto,
                pnlMensaje: jsonData[0].pnlMensaje,
                mensaje: jsonData[0].lblMensaje,
                fondoSalud: jsonData[0].lblFondos,
              });

              if (docSnap.exists()) {
                await setDoc(clienteRef, pensionado, { merge: true });
              } else {
                await setDoc(clienteRef, pensionado);
              }

              const batch = writeBatch(db);

              jsonData.forEach((pago) => {
                // Genera un ID de documento único para cada pago
                const pagoId = `${pago.lblPeriodoPago}_${pago.lblFecha}`
                  .replace(/[/\\?%*:|"<>]/g, '-')
                  .replace(/\s+/g, '_');

                const pagoRef = doc(db, `pensionados/${documentId}/pagos`, pagoId);
                const tablaProcesada = procesarTabla(pago.tables[0]);

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

                // Usa { merge: true } para actualizar documentos existentes
                batch.set(pagoRef, pagoData, { merge: true });
              });

              await batch.commit();
            } catch (error) {
              console.error(
                `Error al procesar el archivo ${file.webkitRelativePath || file.name}: `,
                error
              );
            } finally {
              resolve(); // Siempre resolvemos para continuar con el siguiente archivo
            }
          };

          reader.onerror = () => {
            console.error(`Error de lectura del archivo ${file.webkitRelativePath || file.name}`);
            resolve(); // Continuamos con el siguiente archivo
          };
        });

        reader.readAsText(file);
        await fileReadPromise;
      } catch (error) {
        console.error(
          `Error general al procesar el archivo ${file.webkitRelativePath || file.name}: `,
          error
        );
        // No detenemos el ciclo, continuamos con el siguiente archivo
      }
    }

    setStatus('Procesamiento completado.');
    setCurrentFile('');
    setIsProcessing(false);
    setFiles([]); // Limpiamos los archivos después de procesarlos
  };

  return (
    <div className="certificaciones-container">
      <h1>Certificaciones</h1>
      <p>
        Selecciona una carpeta que contenga los archivos JSON para subir las certificaciones de los
        pensionados.
      </p>
      <input
        type="file"
        accept=".json"
        multiple
        webkitdirectory="true"
        onChange={handleFileUpload}
        disabled={isProcessing}
      />
      {status && <p>{status}</p>}
      {currentFile && <p>Procesando archivo: {currentFile}</p>}
    </div>
  );
};

export default Certificaciones;
