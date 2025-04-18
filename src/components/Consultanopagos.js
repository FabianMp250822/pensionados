import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { utils, writeFile } from 'xlsx';

const ConsultaCompartidos = () => {
  const [dependencia, setDependencia] = useState('');
  const [pnlCentroCosto, setPnlCentroCosto] = useState('');
  const [listaDependencias, setListaDependencias] = useState([]);
  const [listaPnlCentroCosto, setListaPnlCentroCosto] = useState([]);
  const [data, setData] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  const handleBuscar = async () => {
    if (!dependencia.trim()) {
      setError("Por favor, selecciona 'dependencia'.");
      return;
    }
    if (!pnlCentroCosto.trim()) {
      setError("Por favor, selecciona 'Centro de Costo' o 'Todos'.");
      return;
    }
    setLoading(true);
    setError('');
    setData([]);

    try {
      const pensionadosRef = collection(db, 'pensionados');
      let qPensionados;

      if (pnlCentroCosto === 'TODOS') {
        qPensionados = query(
          pensionadosRef,
          where('dependencia1', '==', dependencia.trim())
        );
      } else {
        qPensionados = query(
          pensionadosRef,
          where('dependencia1', '==', dependencia.trim()),
          where('pnlCentroCosto', '==', pnlCentroCosto.trim())
        );
      }

      const snapshotPensionados = await getDocs(qPensionados);

      if (snapshotPensionados.empty) {
        setError('No se encontraron pensionados para esa dependencia y centro de costo.');
        setLoading(false);
        return;
      }

      const resultados = [];

      for (const docPensionado of snapshotPensionados.docs) {
        const pensionadoData = docPensionado.data();
        const pensionadoId = docPensionado.id;
        const pagosRef = collection(db, 'pensionados', pensionadoId, 'pagos');
        const snapshotPagos = await getDocs(pagosRef);

        let tienePago2024 = false;
        snapshotPagos.forEach((pagoDoc) => {
          const pagoData = pagoDoc.data();
          if (pagoData?.año === '2024') {
            tienePago2024 = true;
          }
        });

        if (!tienePago2024) {
          resultados.push({
            id: pensionadoId,
            empleado: pensionadoData.empleado || 'Sin nombre',
            dependencia1: pensionadoData.dependencia1,
            pnlCentroCosto: pensionadoData.pnlCentroCosto,
          });
        }
      }

      if (resultados.length === 0) {
        setError('Todos los pensionados tienen pago en 2024.');
      } else {
        setData(resultados);
      }
    } catch (err) {
      console.error(err);
      setError('Error al consultar los datos.');
    }
    setLoading(false);
  };

  const handleBuscarConPago2024 = async () => {
    if (!dependencia.trim()) {
      setError("Por favor, selecciona 'dependencia'.");
      return;
    }
    if (!pnlCentroCosto.trim()) {
      setError("Por favor, selecciona 'Centro de Costo' o 'Todos'.");
      return;
    }
    setLoading(true);
    setError('');
    setData([]);

    try {
      const pensionadosRef = collection(db, 'pensionados');
      let qPensionados;

      if (pnlCentroCosto === 'TODOS') {
        qPensionados = query(
          pensionadosRef,
          where('dependencia1', '==', dependencia.trim())
        );
      } else {
        qPensionados = query(
          pensionadosRef,
          where('dependencia1', '==', dependencia.trim()),
          where('pnlCentroCosto', '==', pnlCentroCosto.trim())
        );
      }

      const snapshotPensionados = await getDocs(qPensionados);

      if (snapshotPensionados.empty) {
        setError('No se encontraron pensionados para esa dependencia y centro de costo.');
        setLoading(false);
        return;
      }

      const resultados = [];

      for (const docPensionado of snapshotPensionados.docs) {
        const pensionadoData = docPensionado.data();
        const pensionadoId = docPensionado.id;
        const pagosRef = collection(db, 'pensionados', pensionadoId, 'pagos');
        const snapshotPagos = await getDocs(pagosRef);

        let tienePago2024 = false;
        snapshotPagos.forEach((pagoDoc) => {
          const pagoData = pagoDoc.data();
          if (pagoData?.año === '2024') {
            tienePago2024 = true;
          }
        });

        if (tienePago2024) {
          resultados.push({
            id: pensionadoId,
            empleado: pensionadoData.empleado || 'Sin nombre',
            dependencia1: pensionadoData.dependencia1,
            pnlCentroCosto: pensionadoData.pnlCentroCosto,
          });
        }
      }

      if (resultados.length === 0) {
        setError('Ningún pensionado tiene pago en 2024.');
      } else {
        setData(resultados);
      }
    } catch (err) {
      console.error(err);
      setError('Error al consultar los datos.');
    }
    setLoading(false);
  };

  const handleBuscarActivados2021 = async () => {
    if (!dependencia.trim()) {
      setError("Por favor, selecciona 'dependencia'.");
      return;
    }
    if (!pnlCentroCosto.trim()) {
      setError("Por favor, selecciona 'Centro de Costo' o 'Todos'.");
      return;
    }
    setLoading(true);
    setError('');
    setData([]);

    try {
      const pensionadosRef = collection(db, 'pensionados');
      let qPensionados;

      if (pnlCentroCosto === 'TODOS') {
        qPensionados = query(
          pensionadosRef,
          where('dependencia1', '==', dependencia.trim())
        );
      } else {
        qPensionados = query(
          pensionadosRef,
          where('dependencia1', '==', dependencia.trim()),
          where('pnlCentroCosto', '==', pnlCentroCosto.trim())
        );
      }

      const snapshotPensionados = await getDocs(qPensionados);

      if (snapshotPensionados.empty) {
        setError('No se encontraron pensionados para esa dependencia y centro de costo.');
        setLoading(false);
        return;
      }

      const resultados = [];

      for (const docPensionado of snapshotPensionados.docs) {
        const pensionadoData = docPensionado.data();
        const pensionadoId = docPensionado.id;
        const pagosRef = collection(db, 'pensionados', pensionadoId, 'pagos');
        const snapshotPagos = await getDocs(pagosRef);

        if (snapshotPagos.empty) {
          continue; // Skip if no payments exist
        }

        let tienePagosAntesDe2021 = false;

        snapshotPagos.forEach((pagoDoc) => {
          const pagoData = pagoDoc.data();
          const anio = parseInt(String(pagoData?.año || '').trim(), 10);
          if (!isNaN(anio) && anio <= 2020) {
            tienePagosAntesDe2021 = true; // Found a payment in 2020 or earlier
          }
        });

        // Only include if NO payments before 2021
        if (!tienePagosAntesDe2021) { 
          resultados.push({
            id: pensionadoId,
            empleado: pensionadoData.empleado || 'Sin nombre',
            dependencia1: pensionadoData.dependencia1,
            pnlCentroCosto: pensionadoData.pnlCentroCosto,
          });
        }
      }

      if (resultados.length === 0) {
        setError('No se encontraron pensionados activados a partir del 01-01-2021.');
      } else {
        setData(resultados);
      }
    } catch (err) {
      console.error(err);
      setError('Error al consultar los datos.');
    }
    setLoading(false);
  };

  const exportToExcel = () => {
    if (data.length === 0) {
      alert('No hay datos para exportar.');
      return;
    }
    const worksheet = utils.json_to_sheet(
      data.map((item) => ({
        Documento: item.id,
        'Nombre Pensionado': item.empleado,
        Dependencia: item.dependencia1,
        'Centro de Costo': item.pnlCentroCosto,
      }))
    );
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'Pensionados');
    writeFile(workbook, `Pensionados_Consulta_${dependencia}_${pnlCentroCosto}.xlsx`);
  };

  return (
    <div style={containerStyle}>
      <h1>Consulta de Pensionados</h1>
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

        <div style={inputGroupStyle}>
          <label style={labelStyle}>Centro de Costo:</label>
          <select
            value={pnlCentroCosto}
            onChange={(e) => setPnlCentroCosto(e.target.value)}
            style={inputStyle}
            disabled={!dependencia}
          >
            <option value="">-- Selecciona el Centro de Costo --</option>
            <option value="TODOS">Todos</option>
            {listaPnlCentroCosto.map((centro) => (
              <option key={centro} value={centro}>
                {centro}
              </option>
            ))}
          </select>
        </div>

        <div style={inputGroupStyle}>
          <button onClick={handleBuscar} style={buttonStyle}>
            SIN Pago 2024
          </button>
          <button onClick={handleBuscarConPago2024} style={buttonStyle}>
            CON Pago 2024
          </button>
          <button onClick={handleBuscarActivados2021} style={buttonStyle}>
            Activados desde 2021
          </button>
          <button onClick={exportToExcel} style={buttonStyle}>
            Exportar a Excel
          </button>
        </div>
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

      {!loading && data.length === 0 && !error && (
        <p>No hay datos para mostrar.</p>
      )}
    </div>
  );
};

export default ConsultaCompartidos;

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
