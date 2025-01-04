import React, { useState } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { utils, writeFile } from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const ConsultaPagos = () => {
  const [anio, setAnio] = useState('');
  const [detallesInput, setDetallesInput] = useState('');
  const [dependencia, setDependencia] = useState('');
  const [data, setData] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const parseDetalles = (input) => {
    return input
      .split(',')
      .map((d) => d.trim())
      .filter(Boolean);
  };

  /**
   * BOTÓN 1 - Buscar COINCIDENCIAS
   */
  const handleBuscar = async () => {
    if (!anio.trim() || !detallesInput.trim() || !dependencia.trim()) {
      setError("Por favor, ingresa 'año', 'detalles' y 'dependencia'.");
      return;
    }

    setLoading(true);
    setError('');
    setData([]);

    try {
      const detallesArr = parseDetalles(detallesInput);
      const pensionadosRef = collection(db, 'pensionados');
      const qPensionados = query(
        pensionadosRef,
        where('dependencia1', '==', dependencia.trim())
      );
      const snapshotPensionados = await getDocs(qPensionados);

      if (snapshotPensionados.empty) {
        setError('No se encontraron pensionados con la dependencia especificada.');
        setLoading(false);
        return;
      }

      const resultados = [];

      for (const pensionadoDoc of snapshotPensionados.docs) {
        const pensionadoData = pensionadoDoc.data();
        const pensionadoId = pensionadoDoc.id;

        const pagosRef = collection(db, 'pensionados', pensionadoId, 'pagos');
        const qPagos = query(pagosRef, where('año', '==', anio.trim()));
        const snapshotPagos = await getDocs(qPagos);

        // Si el pensionado NO tiene ningún pago en el año especificado, NO se lo muestra
        if (snapshotPagos.empty) {
          continue;
        }

        for (const pagoDoc of snapshotPagos.docs) {
          const pagoData = pagoDoc.data();
          const tieneAlMenosUno = pagoData.detalles?.some((item) => {
            const nombre = item?.nombre?.trim();
            return detallesArr.includes(nombre);
          });

          if (tieneAlMenosUno) {
            resultados.push({
              idPago: pagoDoc.id,
              parentId: pensionadoId,
              pensionado: pensionadoData.empleado || 'Sin nombre',
              dependencia1: pensionadoData.dependencia1,
              año: pagoData.año,
              detalles: pagoData.detalles
            });
          }
        }
      }

      if (resultados.length === 0) {
        setError("No se encontraron pagos que coincidan con esos 'detalles'.");
        setLoading(false);
        return;
      }

      // Eliminamos duplicados por parentId
      const unicos = [];
      const idsUnicos = new Set();
      resultados.forEach((pago) => {
        if (!idsUnicos.has(pago.parentId)) {
          idsUnicos.add(pago.parentId);
          unicos.push(pago);
        }
      });

      setData(unicos);
    } catch (err) {
      console.error(err);
      setError('Error al consultar los datos.');
    }

    setLoading(false);
  };

  /**
   * BOTÓN 2 - Buscar NO COINCIDENCIAS
   */
  const handleBuscarNoCoincidencias = async () => {
    if (!anio.trim() || !detallesInput.trim() || !dependencia.trim()) {
      setError("Por favor, ingresa 'año', 'detalles' y 'dependencia'.");
      return;
    }

    setLoading(true);
    setError('');
    setData([]);

    try {
      const detallesArr = parseDetalles(detallesInput);
      const pensionadosRef = collection(db, 'pensionados');
      const qPensionados = query(
        pensionadosRef,
        where('dependencia1', '==', dependencia.trim())
      );
      const snapshotPensionados = await getDocs(qPensionados);

      if (snapshotPensionados.empty) {
        setError('No se encontraron pensionados con la dependencia especificada.');
        setLoading(false);
        return;
      }

      const resultadosNoCoincidencia = [];

      for (const pensionadoDoc of snapshotPensionados.docs) {
        const pensionadoData = pensionadoDoc.data();
        const pensionadoId = pensionadoDoc.id;

        const pagosRef = collection(db, 'pensionados', pensionadoId, 'pagos');
        const qPagos = query(pagosRef, where('año', '==', anio.trim()));
        const snapshotPagos = await getDocs(qPagos);

        // Si no hay pagos para ese año, no lo mostramos en "no coincidencias"
        if (snapshotPagos.empty) {
          continue;
        }

        let tieneAlMenosUno = false;

        for (const pagoDoc of snapshotPagos.docs) {
          const pagoData = pagoDoc.data();
          const coincideAlguno = pagoData.detalles?.some((item) => {
            const nombre = item?.nombre?.trim();
            return detallesArr.includes(nombre);
          });

          if (coincideAlguno) {
            tieneAlMenosUno = true;
            break;
          }
        }

        // Si NO encontró ninguno de los detalles en todos sus pagos
        if (!tieneAlMenosUno) {
          resultadosNoCoincidencia.push({
            idPago: null,
            parentId: pensionadoId,
            pensionado: pensionadoData.empleado || 'Sin nombre',
            dependencia1: pensionadoData.dependencia1,
            año: anio.trim(),
            detalles: []
          });
        }
      }

      if (resultadosNoCoincidencia.length === 0) {
        setError("No se encontraron pagos que NO coincidan con esos 'detalles' y cumplan la dependencia.");
        setLoading(false);
        return;
      }

      setData(resultadosNoCoincidencia);
    } catch (err) {
      console.error(err);
      setError('Error al consultar los datos.');
    }

    setLoading(false);
  };

  /**
   * Exportar a Excel
   */
  const exportToExcel = () => {
    const detallesArr = parseDetalles(detallesInput);
    const worksheet = utils.json_to_sheet(
      data.map((item) => {
        let detallesCoincidentes = '';
        if (Array.isArray(item.detalles)) {
          const encontrados = item.detalles.filter((detalleItem) => {
            if (typeof detalleItem.nombre !== 'string') return false;
            return detallesArr.includes(detalleItem.nombre.trim());
          });
          detallesCoincidentes = encontrados.map((d) => d.nombre).join(', ');
        }

        return {
          Documento: item.parentId,
          'Nombre Pensionado': item.pensionado,
          Dependencia: item.dependencia1,
          Año: item.año,
          DetallesCoincidentes: detallesCoincidentes
        };
      })
    );

    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'Pagos');
    writeFile(workbook, `Pagos_${anio}_${detallesInput}_${dependencia}.xlsx`);
  };

  return (
    <div style={containerStyle}>
      <h1>Consulta de Pagos</h1>
      <div style={inputContainerStyle}>
        <div style={inputGroupStyle}>
          <label style={labelStyle}>Año:</label>
          <input
            type="text"
            value={anio}
            onChange={(e) => setAnio(e.target.value)}
            style={inputStyle}
            placeholder="Ej: 2019"
          />
        </div>

        <div style={inputGroupStyle}>
          <label style={labelStyle}>Detalles (separados por coma):</label>
          <input
            type="text"
            value={detallesInput}
            onChange={(e) => setDetallesInput(e.target.value)}
            style={inputStyle}
            placeholder='Ej: "Mesada Pensional, 285-Mesada Adicional"'
          />
        </div>

        <div style={inputGroupStyle}>
          <label style={labelStyle}>Dependencia:</label>
          <input
            type="text"
            value={dependencia}
            onChange={(e) => setDependencia(e.target.value)}
            style={inputStyle}
            placeholder='Ej: "Recursos Humanos"'
          />
        </div>
      </div>

      <div style={inputGroupStyle}>
        <button onClick={handleBuscar} style={buttonStyle}>
          Buscar Coincidencias
        </button>
        <button onClick={handleBuscarNoCoincidencias} style={buttonStyle}>
          Buscar NO Coincidencias
        </button>
        <button onClick={exportToExcel} style={buttonStyle}>
          Exportar a Excel
        </button>
      </div>

      {loading && <p>Cargando...</p>}
      {error && <p style={errorStyle}>{error}</p>}

      {data.length > 0 && (
        <table style={tableStyle}>
          <thead>
            <tr style={headerRowStyle}>
              <th>#</th>
              <th>Documento</th>
              <th>Nombre Pensionado</th>
              <th>Dependencia</th>
              <th>Año</th>
              <th>Detalle(s)</th>
            </tr>
          </thead>
          <tbody>
            {data.map((pago, index) => {
              const detallesArr = parseDetalles(detallesInput);
              let detallesCoincidentes = [];
              if (Array.isArray(pago.detalles)) {
                detallesCoincidentes = pago.detalles
                  .filter((item) => item.nombre && detallesArr.includes(item.nombre.trim()))
                  .map((item) => item.nombre);
              }

              return (
                <tr
                  key={`${pago.parentId}-${index}`}
                  style={index % 2 === 0 ? rowStyleWhite : rowStyleGray}
                >
                  <td>{index + 1}</td>
                  <td>{pago.parentId}</td>
                  <td>{pago.pensionado}</td>
                  <td>{pago.dependencia1}</td>
                  <td>{pago.año}</td>
                  <td>{detallesCoincidentes.join(', ')}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {!loading && data.length === 0 && !error && (
        <p>No hay datos para mostrar.</p>
      )}
    </div>
  );
};

const containerStyle = {
  padding: '20px',
  fontFamily: 'Arial, sans-serif'
};

const inputContainerStyle = {
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: '10px',
  marginBottom: '20px',
  flexWrap: 'wrap'
};

const inputGroupStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '5px'
};

const labelStyle = {
  minWidth: '160px'
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
  color: 'red'
};

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  marginTop: '20px',
  border: '1px solid #ddd'
};

const headerRowStyle = {
  backgroundColor: '#f5f5f5',
  fontWeight: 'bold'
};

const rowStyleWhite = {
  backgroundColor: '#ffffff'
};

const rowStyleGray = {
  backgroundColor: '#f2f2f2'
};

export default ConsultaPagos;
