import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import CircularProgress from '@mui/material/CircularProgress'; // Importa CircularProgress de Material-UI

const SubirExcel = () => {
  const [collectionName, setCollectionName] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0); // Nuevo estado para el progreso

  // Maneja la selección del archivo
  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  // Función para leer el archivo de forma diferenciada según su extensión
  const readFileAsync = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
      const fileExtension = file.name.split('.').pop().toLowerCase();
      if (fileExtension === 'xls') {
        reader.readAsBinaryString(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    });
  };

  const handleUpload = async () => {
    if (!collectionName.trim()) {
      setError("Por favor, ingresa el nombre de la colección.");
      return;
    }
    if (!file) {
      setError("Por favor, selecciona un archivo de Excel.");
      return;
    }

    setError('');
    setSuccessMessage('');
    setLoading(true);
    setUploadProgress(0); // Reinicia el progreso al iniciar la carga

    try {
      const fileExtension = file.name.split('.').pop().toLowerCase();
      const data = await readFileAsync(file);

      // Lee el workbook usando opciones según el tipo de archivo
      let workbook;
      if (fileExtension === 'xls') {
        workbook = XLSX.read(data, { type: 'binary', cellDates: true, raw: false });
      } else {
        workbook = XLSX.read(data, { type: 'array', cellDates: true, raw: false });
      }

      const worksheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[worksheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

      if (jsonData.length === 0) {
        setError("El archivo está vacío o no contiene datos.");
        setLoading(false);
        return;
      }

      let createdCount = 0;
      let errorDetails = [];
      const totalRows = jsonData.length; // Total de filas para calcular el progreso

      // Para cada fila se usa el valor de "cedula" como ID y el resto de los campos se guardan en el documento.
      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        const { cedula, ...rest } = row;
        if (!cedula) {
          // Se omite la fila si no existe la columna "cedula" y se registra un error
          errorDetails.push(`Fila omitida, falta "cedula": ${JSON.stringify(row)}`);
          continue;
        }
        const documentId = String(cedula).trim();

        try {
          await setDoc(doc(db, collectionName, documentId), {
            ...rest,
            cedula: documentId // Se incluye la cedula en el documento, si se desea
          });
          createdCount++;
        } catch (docError) {
          console.error(`Error al subir el documento con cédula ${documentId}:`, docError);
          errorDetails.push(`Error en documento con cédula ${documentId}: ${docError.message}`);
        }

        // Calcula y actualiza el progreso
        const progress = Math.round(((i + 1) / totalRows) * 100);
        setUploadProgress(progress);
      }

      if (errorDetails.length > 0) {
        setError(`Se presentaron los siguientes errores:\n${errorDetails.join('\n')}`);
      }

      setSuccessMessage(
        `${createdCount} documento(s) creado(s) en la colección "${collectionName}".`
      );
    } catch (err) {
      console.error("Error al procesar el archivo: ", err);
      setError(`Error al procesar el archivo de Excel: ${err.message}`);
    }
    setLoading(false);
    setUploadProgress(0); // Reinicia el progreso al finalizar
  };

  return (
    <div style={containerStyle}>
      <h1>Subir Archivo de Excel a Firestore</h1>
      <div style={inputContainerStyle}>
        <div style={inputGroupStyle}>
          <label style={labelStyle}>Nombre de la colección:</label>
          <input
            type="text"
            value={collectionName}
            onChange={(e) => setCollectionName(e.target.value)}
            style={inputStyle}
            placeholder="Ej: pensionados, usuarios, etc."
          />
        </div>
        <div style={inputGroupStyle}>
          <label style={labelStyle}>Archivo Excel:</label>
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileChange}
            style={inputStyle}
          />
        </div>
        <div style={inputGroupStyle}>
          <button onClick={handleUpload} style={buttonStyle} disabled={loading}>
            {loading ? 'Subiendo...' : 'Subir Archivo'}
          </button>
        </div>
      </div>

      {/* Muestra el indicador de carga y el progreso */}
      {loading && (
        <div style={loadingContainerStyle}>
          <CircularProgress variant="determinate" value={uploadProgress} />
          <p style={progressTextStyle}>{`Cargando: ${uploadProgress}%`}</p>
        </div>
      )}

      {error && <pre style={errorStyle}>{error}</pre>}
      {successMessage && <p style={successStyle}>{successMessage}</p>}
    </div>
  );
};

export default SubirExcel;

// Estilos (similares a los del otro componente)
const containerStyle = {
  padding: '20px',
  fontFamily: 'Arial, sans-serif'
};

const inputContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '15px',
  marginBottom: '20px'
};

const inputGroupStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px'
};

const labelStyle = {
  minWidth: '180px'
};

const inputStyle = {
  padding: '8px',
  borderRadius: '4px',
  border: '1px solid #ccc'
};

const buttonStyle = {
  padding: '10px 20px',
  backgroundColor: '#007BFF',
  color: '#FFFFFF',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer'
};

const errorStyle = {
  color: 'red',
  whiteSpace: 'pre-wrap'
};

const successStyle = {
  color: 'green'
};

// Nuevos estilos para el indicador de carga
const loadingContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '20px',
};

const progressTextStyle = {
  marginTop: '10px',
};
