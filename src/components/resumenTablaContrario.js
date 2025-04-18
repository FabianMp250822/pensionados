import React, { useState } from 'react';
import { collectionGroup, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from '../firebase/firebaseConfig';
import { utils, writeFile } from 'xlsx';

const ConsultaPagosContrario = () => {
  // Estados
  const [anios, setAnios] = useState('');
  const [aniosFiltrados, setAniosFiltrados] = useState([]); 
  const [detalle, setDetalle] = useState('');
  const [dependenciaFilter, setDependenciaFilter] = useState('');
  const [data, setData] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Función principal de consulta
  const handleBuscar = async () => {
    setLoading(true);
    setError('');
    setData([]);

    try {
      // Referencia a collectionGroup "pagos"
      const pagosRef = collectionGroup(db, "pagos");

      // Convertir el input de años en array
      const splittedAnios = anios
        .split(',')
        .map(a => a.trim())
        .filter(Boolean);

      // Almacenamos splittedAnios en aniosFiltrados para usarlo en exportToExcel
      setAniosFiltrados(splittedAnios);

      // Construimos la consulta (si se ingresaron años, usamos 'in')
      let q;
      if (splittedAnios.length > 0) {
        q = query(pagosRef, where("año", "in", splittedAnios));
      } else {
        // Sin años => traer todos los documentos
        q = query(pagosRef);
      }

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setError("No se encontraron pagos con el criterio actual.");
        setLoading(false);
        return;
      }

      // 1) Convertimos la cadena de "detalle" en un array, en minúsculas
      //    De modo que "1871-Asoc De Jubilados Extraordinaria" -> "1871-asoc de jubilados extraordinaria"
      const splittedDetails = detalle
        .split(',')
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean);

      // 2) Mapeamos los resultados iniciales (cada pago)
      const resultados = snapshot.docs.map((docSnap) => {
        const dataDoc = docSnap.data();
        const parentPath = docSnap.ref.path.split('/');
        // parentId es el documento de 'pensionados' que contiene estos pagos
        const parentId = parentPath[parentPath.length - 3];

        return {
          idPago: docSnap.id,
          parentId,
          ...dataDoc,
        };
      });

      // 3) Filtramos los resultados que **NO** tengan ninguno de los splittedDetails
      const resultadosFiltrados = resultados.filter((pago) => {
        // Si no se ingresó ningún detalle, devolvemos todos (no filtramos)
        if (splittedDetails.length === 0) {
          return true;
        }

        // Aseguramos que 'pago.detalles' sea un array
        const detallesArray = Array.isArray(pago.detalles) ? pago.detalles : [];

        // Pasamos todos los nombres a minúsculas
        const nombresDetallesPago = detallesArray.map((item) =>
          (item.nombre || '').trim().toLowerCase()
        );

        // splittedDetails.every(...) -> True si **ninguno** de esos detalles está en nombresDetallesPago
        return splittedDetails.every(
          (detalleBuscado) => !nombresDetallesPago.includes(detalleBuscado)
        );
      });

      if (resultadosFiltrados.length === 0) {
        setError("No se encontraron pagos que cumplan la condición (NO contienen los detalles escritos).");
        setLoading(false);
        return;
      }

      // 4) Para cada pago, traemos la información del pensionado (nombre y dependencia1)
      const pensionados = await Promise.all(
        resultadosFiltrados.map(async (pago) => {
          try {
            const pensionadoDoc = await getDoc(doc(db, "pensionados", pago.parentId));
            if (pensionadoDoc.exists()) {
              return {
                ...pago,
                pensionado: pensionadoDoc.data().empleado || "Sin nombre",
                dependencia1: pensionadoDoc.data().dependencia1 || "Sin dependencia",
              };
            } else {
              return {
                ...pago,
                pensionado: "No encontrado",
                dependencia1: "No encontrada",
              };
            }
          } catch {
            return {
              ...pago,
              pensionado: "Error al consultar",
              dependencia1: "Error al consultar",
            };
          }
        })
      );

      // Evitamos duplicados por 'parentId'
      const unicos = [];
      const idsUnicos = new Set();

      pensionados.forEach((pago) => {
        if (!idsUnicos.has(pago.parentId)) {
          idsUnicos.add(pago.parentId);
          unicos.push(pago);
        }
      });

      setData(unicos);
    } catch (err) {
      console.error(err);
      setError("Error al consultar los datos.");
    }

    setLoading(false);
  };

  // Exportar a Excel
  const exportToExcel = () => {
    const worksheet = utils.json_to_sheet(
      data.map((item) => ({
        Documento: item.parentId,
        'Nombre Pensionado': item.pensionado,
        Dependencia: item.dependencia1,
        Año: item.año,
        DetallesDelPago: Array.isArray(item.detalles)
          ? item.detalles.map((detalleItem) => detalleItem.nombre).join(', ')
          : '',
      }))
    );
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'Pagos');

    const nombreArchivo = aniosFiltrados.length > 0 
      ? aniosFiltrados.join('_') 
      : 'Todos';

    writeFile(workbook, `Pagos_${nombreArchivo}.xlsx`);
  };

  return (
    <div style={containerStyle}>
      <h1>Consulta de Pagos</h1>
      <div style={inputContainerStyle}>
        {/* Filtro por varios años (ejemplo: "2024, 2023, 2022") */}
        <div style={inputGroupStyle}>
          <label style={labelStyle}>Año(s):</label>
          <input
            type="text"
            value={anios}
            onChange={(e) => setAnios(e.target.value)}
            style={inputStyle}
            placeholder="Ej: 2024,2023,2022 (dejar vacío para TODOS)"
          />
        </div>
        {/* Filtro para los detalles que NO deben aparecer (filtro negativo) */}
        <div style={inputGroupStyle}>
          <label style={labelStyle}>Detalle(s):</label>
          <input
            type="text"
            value={detalle}
            onChange={(e) => setDetalle(e.target.value)}
            style={inputStyle}
            placeholder='Ej: 1871-Asoc De Jubilados Extraordinaria'
          />
        </div>
        {/* Filtro local por dependencia */}
        <div style={inputGroupStyle}>
          <label style={labelStyle}>Dependencia:</label>
          <input
            type="text"
            value={dependenciaFilter}
            onChange={(e) => setDependenciaFilter(e.target.value)}
            style={inputStyle}
            placeholder='Ej: Coordinación, Dirección, etc.'
          />
        </div>

        <button onClick={handleBuscar} style={buttonStyle}>
          Buscar
        </button>
        <button onClick={exportToExcel} style={buttonStyle}>
          Exportar a Excel
        </button>
      </div>

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
              <th>Año</th>
              <th>Detalles del Pago</th>
            </tr>
          </thead>
          <tbody>
            {data
              // Filtramos localmente los que cumplan con el texto en dependenciaFilter
              .filter((pago) => {
                if (!dependenciaFilter.trim()) return true;
                return pago.dependencia1
                  ?.toLowerCase()
                  .includes(dependenciaFilter.toLowerCase());
              })
              .map((pago, index) => (
                <tr
                  key={pago.idPago}
                  style={index % 2 === 0 ? rowStyleWhite : rowStyleGray}
                >
                  <td>{index + 1}</td>
                  <td>{pago.parentId}</td>
                  <td>{pago.pensionado}</td>
                  <td>{pago.dependencia1}</td>
                  <td>{pago.año}</td>
                  <td>
                    {/* Mapeamos los nombres de los detalles tal como están en la BD */}
                    {Array.isArray(pago.detalles)
                      ? pago.detalles.map((item) => item.nombre).join(", ")
                      : ''}
                  </td>
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

// --- Estilos (puedes personalizarlos a tu gusto)
const containerStyle = {
  padding: '20px',
  fontFamily: 'Arial, sans-serif',
};

const inputContainerStyle = {
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: '10px',
  marginBottom: '20px',
  flexWrap: 'wrap',
};

const inputGroupStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '5px',
};

const labelStyle = {
  minWidth: '90px',
};

const inputStyle = {
  padding: '8px',
  borderRadius: '4px',
  border: '1px solid #ccc',
};

const buttonStyle = {
  padding: '10px 20px',
  backgroundColor: '#007BFF',
  color: '#FFFFFF',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
};

const errorStyle = {
  color: 'red',
};

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  marginTop: '20px',
  border: '1px solid #ddd',
};

const headerRowStyle = {
  backgroundColor: '#f5f5f5',
  fontWeight: 'bold',
};

const rowStyleWhite = {
  backgroundColor: '#ffffff',
};

const rowStyleGray = {
  backgroundColor: '#f2f2f2',
};

export default ConsultaPagosContrario;
