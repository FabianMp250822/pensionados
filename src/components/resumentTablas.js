import React, { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs
} from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { utils, writeFile } from 'xlsx';

// Función para formatear un Firestore Timestamp a cadena legible
const formatTimestamp = (timestamp) => {
  if (timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate().toLocaleString();
  }
  return timestamp;
};

const ConsultaPagos = () => {
  const [anio, setAnio] = useState('2013'); // Por defecto el año es 2013
  const [dependencia, setDependencia] = useState('');
  const [dependencias, setDependencias] = useState([]); // Dependencias únicas
  const [detalleFiltro, setDetalleFiltro] = useState(''); // Filtro para detalles
  const [detallesDisponibles, setDetallesDisponibles] = useState([]); // Detalles disponibles para la dependencia seleccionada
  const [data, setData] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Obtener las dependencias únicas del campo pnlDependencia de la colección 'pensionados'
  useEffect(() => {
    const fetchDependencies = async () => {
      try {
        const pensionadosRef = collection(db, 'pensionados');
        const snapshot = await getDocs(pensionadosRef);
        const deps = new Set();
        snapshot.forEach(docSnap => {
          const d = docSnap.data();
          if (d.pnlDependencia) {
            deps.add(d.pnlDependencia.trim());
          }
        });
        setDependencias(Array.from(deps));
      } catch (err) {
        console.error('Error fetching dependencies:', err);
      }
    };
    fetchDependencies();
  }, []);

  // Obtener los detalles únicos para la dependencia seleccionada y año especificado
  useEffect(() => {
    const fetchDetalles = async () => {
      if (!dependencia.trim()) {
        setDetallesDisponibles([]);
        return;
      }
      try {
        const pensionadosRef = collection(db, 'pensionados');
        const qPensionados = query(
          pensionadosRef,
          where('dependencia1', '==', dependencia.trim())
        );
        const snapshotPensionados = await getDocs(qPensionados);
        const detallesSet = new Set();
        // Iterar sobre cada pensionado y obtener sus pagos para el año especificado
        for (const pensionadoDoc of snapshotPensionados.docs) {
          const pensionadoId = pensionadoDoc.id;
          const pagosRef = collection(db, 'pensionados', pensionadoId, 'pagos');
          const qPagos = query(
            pagosRef,
            where('año', '==', anio.trim())
          );
          const snapshotPagos = await getDocs(qPagos);
          snapshotPagos.forEach(docSnap => {
            const pagoData = docSnap.data();
            if (pagoData.detalles && Array.isArray(pagoData.detalles)) {
              pagoData.detalles.forEach(det => {
                if (det.nombre) {
                  detallesSet.add(det.nombre.trim());
                }
              });
            }
          });
        }
        setDetallesDisponibles(Array.from(detallesSet));
      } catch (err) {
        console.error("Error fetching detalles:", err);
      }
    };
    fetchDetalles();
  }, [dependencia, anio]);

  /**
   * BOTÓN - Buscar datos de pensionados y la última mesada recibida (pagos) para el año dado
   */
  const handleBuscar = async () => {
    if (!anio.trim() || !dependencia.trim()) {
      setError("Por favor ingresa el 'año' y selecciona una dependencia.");
      return;
    }

    setLoading(true);
    setError('');
    setData([]);

    try {
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

      // Para cada pensionado, buscamos en su subcolección 'pagos' la última mesada (según fechaLiquidacion)
      for (const pensionadoDoc of snapshotPensionados.docs) {
        const pensionadoData = pensionadoDoc.data();
        const pensionadoId = pensionadoDoc.id;

        const pagosRef = collection(db, 'pensionados', pensionadoId, 'pagos');
        // Se ordena de forma descendente para obtener el pago más reciente
        const qPagos = query(
          pagosRef,
          where('año', '==', anio.trim()),
          orderBy('fechaLiquidacion', 'desc')
        );
        const snapshotPagos = await getDocs(qPagos);

        // Si existe al menos un pago, se toma el primero (más reciente)
        if (!snapshotPagos.empty) {
          const ultimoPagoDoc = snapshotPagos.docs[0];
          const ultimoPagoData = ultimoPagoDoc.data();

          // Filtrar por detalle si se seleccionó un filtro
          if (detalleFiltro.trim()) {
            const matchingDetail = Array.isArray(ultimoPagoData.detalles) &&
              ultimoPagoData.detalles.some(det => det.nombre && det.nombre.trim() === detalleFiltro.trim());
            if (!matchingDetail) {
              continue; // Salta este registro si no coincide el detalle
            }
          }

          resultados.push({
            documento: pensionadoId,
            pensionado: pensionadoData.empleado || 'Sin nombre',
            dependencia: pensionadoData.dependencia1 || '',
            pnlCentroCosto: pensionadoData.pnlCentroCosto || '',
            basico: ultimoPagoData.basico || '',
            detalles: ultimoPagoData.detalles || [],
            fechaLiquidacion: formatTimestamp(ultimoPagoData.fechaLiquidacion) || '',
            fechaProcesado: formatTimestamp(ultimoPagoData.fechaProcesado) || '',
            grado: ultimoPagoData.grado || '',
            periodoPago: ultimoPagoData.periodoPago || '',
            procesado: ultimoPagoData.procesado ? 'Si' : 'No',
            valorLiquidado: ultimoPagoData.valorLiquidado || '',
            valorNeto: ultimoPagoData.valorNeto || ''
          });
        }
      }

      if (resultados.length === 0) {
        setError('No se encontraron pagos para el año seleccionado con el filtro de detalle aplicado.');
        setLoading(false);
        return;
      }

      setData(resultados);
    } catch (err) {
      console.error(err);
      setError('Error al consultar los datos.');
    }

    setLoading(false);
  };

  /**
   * Exportar la tabla a Excel
   */
  const exportToExcel = () => {
    const worksheet = utils.json_to_sheet(
      data.map((item) => {
        const detallesString = Array.isArray(item.detalles)
          ? item.detalles.map(d => d.nombre).join('\n')
          : '';
        return {
          Documento: item.documento,
          'Nombre Pensionado': item.pensionado,
          Dependencia: item.dependencia,
          'Centro de Costo': item.pnlCentroCosto,
          Año: anio,
          Basico: item.basico,
          'Detalle(s)': detallesString,
          'Fecha Liquidación': item.fechaLiquidacion,
          'Fecha Procesado': item.fechaProcesado,
          Grado: item.grado,
          'Periodo Pago': item.periodoPago,
          Procesado: item.procesado,
          'Valor Liquidado': item.valorLiquidado,
          'Valor Neto': item.valorNeto
        };
      })
    );
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'Ultima Mesada');
    writeFile(workbook, `UltimaMesada_${anio}_${dependencia}.xlsx`);
  };

  return (
    <div style={containerStyle}>
      <h1>Consulta de Última Mesada Recibida</h1>
      <div style={inputContainerStyle}>
        <div style={inputGroupStyle}>
          <label style={labelStyle}>Año:</label>
          <input
            type="text"
            value={anio}
            onChange={(e) => setAnio(e.target.value)}
            style={inputStyle}
            placeholder="Ej: 2013"
          />
        </div>
        <div style={inputGroupStyle}>
          <label style={labelStyle}>Dependencia:</label>
          <select
            value={dependencia}
            onChange={(e) => {
              setDependencia(e.target.value);
              // Reiniciamos el filtro de detalle al cambiar la dependencia
              setDetalleFiltro('');
            }}
            style={inputStyle}
          >
            <option value="">Seleccionar dependencia</option>
            {dependencias.map((dep) => (
              <option key={dep} value={dep}>{dep}</option>
            ))}
          </select>
        </div>
        {/* Nuevo selector para detalles */}
        <div style={inputGroupStyle}>
          <label style={labelStyle}>Detalle:</label>
          <select
            value={detalleFiltro}
            onChange={(e) => setDetalleFiltro(e.target.value)}
            style={inputStyle}
          >
            <option value="">Todos</option>
            {detallesDisponibles.map((det) => (
              <option key={det} value={det}>{det}</option>
            ))}
          </select>
        </div>
      </div>
      <div style={inputGroupStyle}>
        <button onClick={handleBuscar} style={buttonStyle}>Buscar</button>
        <button onClick={exportToExcel} style={buttonStyle}>Exportar a Excel</button>
      </div>
      {loading && <p>Cargando...</p>}
      {error && <p style={errorStyle}>{error}</p>}
      {data.length > 0 && (
        <div style={scrollContainerStyle}>
          <table style={tableStyle}>
            <thead>
              <tr style={headerRowStyle}>
                <th>#</th>
                <th>Documento</th>
                <th>Nombre Pensionado</th>
                <th>Dependencia</th>
                <th>Centro de Costo</th>
                <th>Basico</th>
                <th>Detalle(s)</th>
                <th>Fecha Liquidación</th>
                <th>Fecha Procesado</th>
                <th>Grado</th>
                <th>Periodo Pago</th>
                <th>Procesado</th>
                <th>Valor Liquidado</th>
                <th>Valor Neto</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => {
                const detallesString = Array.isArray(item.detalles)
                  ? item.detalles.map(d => d.nombre).join('\n')
                  : '';
                return (
                  <tr 
                    key={item.documento + '-' + index} 
                    style={index % 2 === 0 ? rowStyleWhite : rowStyleGray}
                  >
                    <td>{index + 1}</td>
                    <td>{item.documento}</td>
                    <td>{item.pensionado}</td>
                    <td>{item.dependencia}</td>
                    <td>{item.pnlCentroCosto}</td>
                    <td>{item.basico}</td>
                    <td style={{ whiteSpace: 'pre-wrap' }}>{detallesString}</td>
                    <td>{item.fechaLiquidacion}</td>
                    <td>{item.fechaProcesado}</td>
                    <td>{item.grado}</td>
                    <td>{item.periodoPago}</td>
                    <td>{item.procesado}</td>
                    <td>{item.valorLiquidado}</td>
                    <td>{item.valorNeto}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {!loading && data.length === 0 && !error && <p>No hay datos para mostrar.</p>}
    </div>
  );
};

const containerStyle = {
  padding: '20px',
  fontFamily: 'Arial, sans-serif'
};

const inputContainerStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '10px',
  marginBottom: '20px',
  alignItems: 'center'
};

const inputGroupStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '5px'
};

const labelStyle = {
  minWidth: '120px'
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

const scrollContainerStyle = {
  overflowX: 'auto',
  overflowY: 'auto',
  maxHeight: '500px',
  marginTop: '20px'
};

export default ConsultaPagos;
