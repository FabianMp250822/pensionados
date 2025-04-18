import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { doc, setDoc, collection, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import CircularProgress from '@mui/material/CircularProgress';

const SubirDatosNoRelacionados = () => {
  const [collectionName, setCollectionName] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

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
    setUploadProgress(0);

    try {
      const fileExtension = file.name.split('.').pop().toLowerCase();
      const data = await readFileAsync(file);

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

      // Organizar los datos por año y mes
      const datosPorAño = {};
      jsonData.forEach((row) => {
        const año = row['Año'];
const mes = row['Mes'];
const valor1 = row['Número Índice'];
const valor2 = row['Variación Mensual'];

        if (!datosPorAño[año]) {
          datosPorAño[año] = {};
        }
        datosPorAño[año][mes] = {
          valor1: valor1,
          valor2: valor2,
        };
      });

      let createdCount = 0;
      let errorDetails = [];
      const totalYears = Object.keys(datosPorAño).length;
      let currentYearIndex = 0;

      for (const año in datosPorAño) {
        currentYearIndex++;
        const documentId = año;
        try {
          // Verificar si el documento ya existe
          const docRef = doc(db, collectionName, documentId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            // Si el documento existe, actualizarlo
            await setDoc(docRef, datosPorAño[año], { merge: true });
          } else {
            // Si el documento no existe, crearlo
            await setDoc(docRef, datosPorAño[año]);
          }
          createdCount++;
        } catch (docError) {
          console.error(`Error al subir el documento del año ${documentId}:`, docError);
          errorDetails.push(`Error en documento del año ${documentId}: ${docError.message}`);
        }
        const progress = Math.round((currentYearIndex / totalYears) * 100);
        setUploadProgress(progress);
      }

      if (errorDetails.length > 0) {
        setError(`Se presentaron los siguientes errores:\n${errorDetails.join('\n')}`);
      }

      setSuccessMessage(
        `${createdCount} documento(s) creado(s) o actualizado(s) en la colección "${collectionName}".`
      );
    } catch (err) {
      console.error("Error al procesar el archivo: ", err);
      setError(`Error al procesar el archivo de Excel: ${err.message}`);
    }
    setLoading(false);
    setUploadProgress(0);
  };

  return (
    <div style={containerStyle}>
      <h1>Subir Datos No Relacionados desde Excel a Firestore</h1>
      <div style={inputContainerStyle}>
        <div style={inputGroupStyle}>
          <label style={labelStyle}>Nombre de la colección:</label>
          <input
            type="text"
            value={collectionName}
            onChange={(e) => setCollectionName(e.target.value)}
            style={inputStyle}
            placeholder="Ej: datos_mensuales, etc."
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

export default SubirDatosNoRelacionados;

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
