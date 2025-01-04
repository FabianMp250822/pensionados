import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

// Importamos las funciones necesarias para Excel
import { utils, writeFile } from 'xlsx';

const ConsultaCompartidos = () => {
  // Estados para selects
  const [dependencia, setDependencia] = useState('');
  const [pnlCentroCosto, setPnlCentroCosto] = useState('');

  // Listas únicas obtenidas de Firestore
  const [listaDependencias, setListaDependencias] = useState([]);
  const [listaPnlCentroCosto, setListaPnlCentroCosto] = useState([]);

  // Estado para los resultados
  const [data, setData] = useState([]);

  // Estado para manejo de errores y carga
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  /**
   * useEffect para obtener TODAS las dependencias únicas
   */
  useEffect(() => {
    const obtenerDependenciasUnicas = async () => {
      try {
        const pensionadosRef = collection(db, 'pensionados');
        const snapshot = await getDocs(pensionadosRef);

        if (snapshot.empty) {
          setListaDependencias([]);
          return;
        }

        const dependenciasSet = new Set();
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.dependencia1) {
            dependenciasSet.add(data.dependencia1.trim());
          }
        });

        setListaDependencias([...dependenciasSet]);
      } catch (err) {
        console.error('Error al obtener dependencias únicas', err);
      }
    };

    obtenerDependenciasUnicas();
  }, []);

  /**
   * Cuando cambia la dependencia, cargamos la lista de pnlCentroCosto
   */
  useEffect(() => {
    const obtenerPnlCentroCostos = async () => {
      if (!dependencia) {
        setListaPnlCentroCosto([]);
        setPnlCentroCosto('');
        return;
      }
      try {
        const pensionadosRef = collection(db, 'pensionados');
        const qPensionados = query(
          pensionadosRef,
          where('dependencia1', '==', dependencia.trim())
        );
        const snapshot = await getDocs(qPensionados);

        if (snapshot.empty) {
          setListaPnlCentroCosto([]);
          setPnlCentroCosto('');
          return;
        }

        const centroCostoSet = new Set();
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.pnlCentroCosto) {
            centroCostoSet.add(data.pnlCentroCosto.trim());
          }
        });

        setListaPnlCentroCosto([...centroCostoSet]);
        setPnlCentroCosto('');
      } catch (err) {
        console.error('Error al obtener pnlCentroCosto', err);
      }
    };

    obtenerPnlCentroCostos();
  }, [dependencia]);

  /**
   * BOTÓN - Buscar pensionados según dependencia y pnlCentroCosto
   */
  const handleBuscar = async () => {
    // Validamos campos
    if (!dependencia.trim() || !pnlCentroCosto.trim()) {
      setError("Por favor, selecciona 'dependencia' y 'pnlCentroCosto'.");
      return;
    }

    setLoading(true);
    setError('');
    setData([]);

    try {
      // Filtramos pensionados por dependencia y pnlCentroCosto
      const pensionadosRef = collection(db, 'pensionados');
      const qPensionados = query(
        pensionadosRef,
        where('dependencia1', '==', dependencia.trim()),
        where('pnlCentroCosto', '==', pnlCentroCosto.trim())
      );
      const snapshotPensionados = await getDocs(qPensionados);

      if (snapshotPensionados.empty) {
        setError('No se encontraron pensionados para esa dependencia y centro de costo.');
        setLoading(false);
        return;
      }

      const resultados = [];
      snapshotPensionados.forEach((doc) => {
        const pensionadoData = doc.data();
        resultados.push({
          id: doc.id,
          empleado: pensionadoData.empleado || 'Sin nombre',
          dependencia1: pensionadoData.dependencia1,
          pnlCentroCosto: pensionadoData.pnlCentroCosto,
        });
      });

      setData(resultados);
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
    if (data.length === 0) {
      alert('No hay datos para exportar.');
      return;
    }

    // Creamos la "hoja" con base en los datos
    const worksheet = utils.json_to_sheet(
      data.map((item) => ({
        Documento: item.id,
        'Nombre Pensionado': item.empleado,
        Dependencia: item.dependencia1,
        'Centro de Costo': item.pnlCentroCosto,
      }))
    );

    // Creamos el libro de Excel y agregamos la hoja
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'Pensionados');

    // Guardamos el archivo. Le agregamos algo de info al nombre, p.ej. la dependencia
    writeFile(workbook, `Pensionados_${dependencia}_${pnlCentroCosto}.xlsx`);
  };

  return (
    <div style={containerStyle}>
      <h1>Consulta de Pensionados</h1>

      {/* Select de Dependencia */}
      <div style={inputContainerStyle}>
        <div style={inputGroupStyle}>
          <label style={labelStyle}>Dependencia:</label>
          <select
            value={dependencia}
            onChange={(e) => setDependencia(e.target.value)}
            style={inputStyle}
          >
            <option value="">-- Selecciona la Dependencia --</option>
            {listaDependencias.map((dep) => (
              <option key={dep} value={dep}>
                {dep}
              </option>
            ))}
          </select>
        </div>

        {/* Select de pnlCentroCosto (dependiente de la dependencia) */}
        <div style={inputGroupStyle}>
          <label style={labelStyle}>Centro de Costo:</label>
          <select
            value={pnlCentroCosto}
            onChange={(e) => setPnlCentroCosto(e.target.value)}
            style={inputStyle}
            disabled={!dependencia}
          >
            <option value="">-- Selecciona el Centro de Costo --</option>
            {listaPnlCentroCosto.map((centro) => (
              <option key={centro} value={centro}>
                {centro}
              </option>
            ))}
          </select>
        </div>

        {/* Botones para buscar y exportar */}
        <div style={inputGroupStyle}>
          <button onClick={handleBuscar} style={buttonStyle}>
            Buscar
          </button>
          <button onClick={exportToExcel} style={buttonStyle}>
            Exportar a Excel
          </button>
        </div>
      </div>

      {/* Mensajes de estado */}
      {loading && <p>Cargando...</p>}
      {error && <p style={errorStyle}>{error}</p>}

      {/* Tabla de resultados */}
      {data.length > 0 && (
        <table style={tableStyle}>
          <thead>
            <tr style={headerRowStyle}>
              <th>#</th>
              <th>Documento</th>
              <th>Nombre Pensionado</th>
              <th>Dependencia</th>
              <th>Centro Costo</th>
            </tr>
          </thead>
          <tbody>
            {data.map((pensionado, index) => (
              <tr
                key={`${pensionado.id}-${index}`}
                style={index % 2 === 0 ? rowStyleWhite : rowStyleGray}
              >
                <td>{index + 1}</td>
                <td>{pensionado.id}</td>
                <td>{pensionado.empleado}</td>
                <td>{pensionado.dependencia1}</td>
                <td>{pensionado.pnlCentroCosto}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Mensaje si no hay datos (y no está cargando ni hay error) */}
      {!loading && data.length === 0 && !error && (
        <p>No hay datos para mostrar.</p>
      )}
    </div>
  );
};

export default ConsultaCompartidos;

// ---- Estilos en línea (opcional) ----
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
