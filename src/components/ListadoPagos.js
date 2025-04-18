import React, { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useSelector } from 'react-redux'; // Añadimos esta importación

/**
 * Componente que muestra la tabla de pagos (ornaPagos) unida con información
 * de la colección nuevosClientes. Para cada cliente (relacionando el campo "clienteId"
 * de ornaPagos con el ID del documento en nuevosClientes) se agrupan todos sus pagos
 * en una sola fila. Se muestran los siguientes campos:
 *
 * - Nombre (concatenación de "nombres" y "apellidos")
 * - Cédula (campo "cedula")
 * - Grupo (campo "grupo")
 * - Años (de pago)
 * - Fechas de pago
 * - Montos
 * - Montos Neto
 * - Descuentos
 * - Empresas
 * - Vendedores
 * - Soporte (link)
 *
 * Además, incluye un campo de filtro global y un estilo tipo Excel.
 */
const ListadoPagos = () => {
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');
  
  // Obtenemos los usuarios del Redux store
  const usuarios = useSelector((state) => state.contabilidad.usuarios || []);

  // Creamos un objeto indexado por ID para búsqueda rápida
  const usuariosMap = usuarios.reduce((acc, usuario) => {
    acc[usuario.id] = usuario;
    return acc;
  }, {});

  // useEffect para suscribirse a la colección "ornaPagos"
  useEffect(() => {
    const unsubscribeOrnaPagos = onSnapshot(
      collection(db, 'ornaPagos'),
      (snapshot) => {
        const tempPagos = [];
        // Recorremos cada documento de la colección ornaPagos
        snapshot.forEach((doc) => {
          const data = doc.data();
          const { clienteId, actualizado, pagosPorAño } = data;
          // Si existen pagos por año, recorremos cada uno
          if (pagosPorAño) {
            Object.keys(pagosPorAño).forEach((year) => {
              const listaPagos = pagosPorAño[year];
              listaPagos.forEach((pago) => {
                tempPagos.push({
                  // Se guarda el ID del documento ornaPagos y demás campos
                  docId: doc.id,
                  clienteId,
                  actualizado,
                  year,
                  ...pago,
                });
              });
            });
          }
        });
        setPagos(tempPagos);
        setLoading(false);
      },
      (error) => {
        console.error('Error al obtener ornaPagos:', error);
        setLoading(false);
      }
    );

    return () => unsubscribeOrnaPagos();
  }, []);

  /**
   * Se filtran los pagos según el texto ingresado en el filtro.
   * Se convierte cada objeto a cadena y se busca coincidencia (sin distinguir mayúsculas).
   */
  const pagosFiltrados = pagos.filter((pago) => {
    const usuario = usuariosMap[pago.clienteId];
    const textoPago = JSON.stringify({
      ...pago,
      nombre: usuario?.nombres,
      apellidos: usuario?.apellidos,
      cedula: usuario?.cedula,
      grupo: usuario?.grupo
    }).toLowerCase();
    return textoPago.includes(filtro.toLowerCase());
  });

  /**
   * Se agrupan los pagos filtrados por cliente.
   * Cada clave es el clienteId y su valor es un arreglo con todos sus pagos.
   */
  const pagosAgrupados = pagosFiltrados.reduce((acc, pago) => {
    const cid = pago.clienteId;
    if (!acc[cid]) {
      acc[cid] = [];
    }
    acc[cid].push(pago);
    return acc;
  }, {});

  // Convertimos el objeto agrupado en un arreglo para iterar en la tabla
  const datosAgrupados = Object.entries(pagosAgrupados).map(([clienteId, pagosArray]) => ({
    clienteId,
    // Se unen los valores de cada pago en una sola cadena, separados por salto de línea
    years: pagosArray.map(p => p.year).join('\n'),
    fechas: pagosArray.map(p => p.fecha).join('\n'),
    montos: pagosArray.map(p => p.monto).join('\n'),
    montosNeto: pagosArray.map(p => p.montoNeto).join('\n'),
    descuentos: pagosArray.map(p => p.descuento).join('\n'),
    empresas: pagosArray.map(p => p.empresa).join('\n'),
    vendedores: pagosArray.map(p => p.vendedor).join('\n'),
    soportes: pagosArray
      .map(p => p.soporteURL ? `<a href="${p.soporteURL}" target="_blank">Ver Soporte</a>` : 'N/A')
      .join('\n'),
  }));

  // Si los datos aún se están cargando, muestra un mensaje
  if (loading) {
    return <div>Cargando datos...</div>;
  }

  return (
    <div id="tabla-ornapagos-container" style={styles.container}>
      <h2 style={styles.titulo}>Listado de Pagos (Vista tipo Excel)</h2>

      {/* Campo de texto para filtrar globalmente */}
      <input
        type="text"
        placeholder="Filtrar por cualquier campo..."
        value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
        style={styles.inputFiltro}
      />

      {/* Tabla principal */}
      <table style={styles.tabla}>
        <thead>
          <tr style={styles.filaHeader}>
            <th style={styles.headerCell}>Nombre</th>
            <th style={styles.headerCell}>Cédula</th>
            <th style={styles.headerCell}>Grupo</th>
            <th style={styles.headerCell}>Años</th>
            <th style={styles.headerCell}>Fechas</th>
            <th style={styles.headerCell}>Montos</th>
            <th style={styles.headerCell}>Montos Neto</th>
            <th style={styles.headerCell}>Descuentos</th>
            <th style={styles.headerCell}>Empresas</th>
            <th style={styles.headerCell}>Vendedores</th>
            <th style={styles.headerCell}>Soporte</th>
          </tr>
        </thead>
        <tbody>
          {datosAgrupados.map((dato, index) => {
            // Obtener la información del usuario usando el map
            const usuarioInfo = usuariosMap[dato.clienteId] || {};
            const nombreCompleto = `${usuarioInfo.nombres || ''} ${usuarioInfo.apellidos || ''}`.trim();
            
            return (
              <tr
                key={`${dato.clienteId}-${index}`}
                style={index % 2 === 0 ? styles.filaPar : styles.filaImpar}
              >
                <td style={styles.cell}>{nombreCompleto || 'N/A'}</td>
                <td style={styles.cell}>{usuarioInfo.cedula || 'N/A'}</td>
                <td style={styles.cell}>{usuarioInfo.grupo || 'N/A'}</td>
                <td style={styles.cell}>{dato.years}</td>
                <td style={styles.cell}>{dato.fechas}</td>
                <td style={styles.cell}>{dato.montos}</td>
                <td style={styles.cell}>{dato.montosNeto}</td>
                <td style={styles.cell}>{dato.descuentos}</td>
                <td style={styles.cell}>{dato.empresas}</td>
                <td style={styles.cell}>{dato.vendedores}</td>
                <td style={styles.cell}>
                  <div dangerouslySetInnerHTML={{ __html: dato.soportes }} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

/**
 * Objeto de estilos para encapsular los estilos y evitar conflictos.
 * Se usa "whiteSpace: 'pre-line'" en las celdas para respetar los saltos de línea.
 */
const styles = {
  container: {
    maxWidth: '95%',
    margin: '0 auto',
    padding: '20px',
    backgroundColor: '#fff',
    border: '1px solid #ccc',
    borderRadius: '8px',
    boxShadow: '0 0 10px rgba(0,0,0,0.1)',
    overflowX: 'auto', // Permite scroll horizontal en caso de muchas columnas
  },
  titulo: {
    textAlign: 'center',
    marginBottom: '20px',
    fontFamily: 'Arial, sans-serif',
  },
  inputFiltro: {
    display: 'block',
    margin: '0 auto 20px auto',
    padding: '10px',
    width: '50%',
    borderRadius: '4px',
    border: '1px solid #ccc',
    fontSize: '16px',
    fontFamily: 'Arial, sans-serif',
  },
  tabla: {
    width: '100%',
    borderCollapse: 'collapse',
    fontFamily: 'Arial, sans-serif',
  },
  filaHeader: {
    backgroundColor: '#007bff',
    color: '#fff',
  },
  headerCell: {
    padding: '10px',
    border: '1px solid #ccc',
    textAlign: 'left',
    fontWeight: 'bold',
  },
  filaPar: {
    backgroundColor: '#f2f2f2',
  },
  filaImpar: {
    backgroundColor: '#fff',
  },
  cell: {
    padding: '10px',
    border: '1px solid #ccc',
    whiteSpace: 'pre-line', // Respeta los saltos de línea
  },
};

export default ListadoPagos;
