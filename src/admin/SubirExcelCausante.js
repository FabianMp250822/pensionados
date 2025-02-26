import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

const SubirExcelCausante = () => {
  const [collectionName, setCollectionName] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

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

    try {
      // 1. Leer el archivo según su extensión
      const fileExtension = file.name.split('.').pop().toLowerCase();
      const data = await readFileAsync(file);

      let workbook;
      if (fileExtension === 'xls') {
        workbook = XLSX.read(data, { type: 'binary', cellDates: true, raw: false });
      } else {
        workbook = XLSX.read(data, { type: 'array', cellDates: true, raw: false });
      }

      // 2. Convertir la primera hoja a JSON
      const worksheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[worksheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

      if (jsonData.length === 0) {
        setError("El archivo está vacío o no contiene datos.");
        setLoading(false);
        return;
      }

      // 3. Agrupar por "cedula_causante"
      const dataByCausante = {};
      let errorDetails = [];

      for (const row of jsonData) {
        const { cedula_causante, ...rest } = row;

        // Si no existe la columna cedula_causante o viene vacía, lo registramos como error
        if (!cedula_causante) {
          errorDetails.push(`Fila omitida, falta "cedula_causante": ${JSON.stringify(row)}`);
          continue;
        }

        const docId = String(cedula_causante).trim();
        if (!docId) {
          errorDetails.push(`Fila omitida, "cedula_causante" inválida: ${JSON.stringify(row)}`);
          continue;
        }

        // Si no existe aún en dataByCausante, se crea la estructura
        if (!dataByCausante[docId]) {
          dataByCausante[docId] = {
            cedula_causante: docId,
            records: []
          };
        }

        // Agregamos esta fila al arreglo de records
        dataByCausante[docId].records.push(rest);
      }

      // 4. Guardar en Firestore cada grupo
      let createdCount = 0;
      for (const docId in dataByCausante) {
        const docData = dataByCausante[docId];

        try {
          // Se crea o sobreescribe el documento con ID = docId
          await setDoc(doc(db, collectionName, docId), docData);
          createdCount++;
        } catch (docError) {
          console.error(`Error al subir el documento con cédula_causante ${docId}:`, docError);
          errorDetails.push(
            `Error en documento con cédula_causante ${docId}: ${docError.message}`
          );
        }
      }

      // 5. Si hubo errores, se muestran
      if (errorDetails.length > 0) {
        setError(`Se presentaron los siguientes errores:\n${errorDetails.join('\n')}`);
      }

      // Mensaje final de éxito
      setSuccessMessage(
        `${createdCount} documento(s) creado(s)/actualizado(s) en la colección "${collectionName}".`
      );
    } catch (err) {
      console.error("Error al procesar el archivo: ", err);
      setError(`Error al procesar el archivo de Excel: ${err.message}`);
    }

    setLoading(false);
  };

  return (
    <div style={containerStyle}>
      <h1>Subir Archivo de Excel a Firestore (Causante)</h1>
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

      {error && <pre style={errorStyle}>{error}</pre>}
      {successMessage && <p style={successStyle}>{successMessage}</p>}
    </div>
  );
};

export default SubirExcelCausante;

// Estilos
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
