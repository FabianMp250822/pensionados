import React, { useEffect, useState } from 'react';
import {
  collection,
  getDocs,
  getFirestore,
  doc,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import './PagosEspecificos.css';

const PagosEspecificos = () => {
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [orden, setOrden] = useState('desc');
  const [columnaOrden, setColumnaOrden] = useState('total');

  // Estados para las dependencias y centros de costo
  const [dependencias, setDependencias] = useState([]);
  const [dependenciaSeleccionada, setDependenciaSeleccionada] = useState('');
  const [centrosCosto, setCentrosCosto] = useState([]);
  const [centroCostoSeleccionado, setCentroCostoSeleccionado] = useState('');

  // Conceptos buscados (aunque no se usan en este código, puedes eliminarlos si no los necesitas)
  const conceptosBuscados = [
    '470-Costas Procesales',
    '785-Retro Mesada Adicional M14',
    '475-Procesos Y Sentencia Judiciales',
  ];

  // Función para obtener los datos ya calculados desde Firebase
  const buscarDatosEspecificos = async () => {
    setCargando(true);

    try {
      const db = getFirestore();

      // Obtener los cálculos desde la colección 'pagocostas'
      const pagosCostasSnapshot = await getDocs(collection(db, 'pagocostas'));
      const pagosCostasData = pagosCostasSnapshot.docs.map((doc) => doc.data());

      if (pagosCostasData.length > 0) {
        // Si existen datos calculados, usarlos
        setResultados(pagosCostasData);

        // Extraer dependencias y centros de costo únicos para los filtros
        const dependenciasUnicas = [
          ...new Set(pagosCostasData.map((resultado) => resultado.pnlDependencia)),
        ].filter(Boolean);
        setDependencias(dependenciasUnicas);

        const centrosCostoUnicos = [
          ...new Set(pagosCostasData.map((resultado) => resultado.pnlCentroCosto)),
        ].filter(Boolean);
        setCentrosCosto(centrosCostoUnicos);

        setMensaje('Datos cargados correctamente.');
      } else {
        setMensaje('No hay datos calculados. Por favor, actualice la consulta.');
      }
    } catch (error) {
      console.error('Error al obtener datos:', error);
      setMensaje('Error al obtener datos.');
    }

    setCargando(false);
  };

  // Función para recalcular y actualizar los datos en Firebase
  const actualizarDatos = async () => {
    // Solicitar el código de confirmación
    const codigoIngresado = window.prompt('Ingrese el código de actualización:');
    const codigoCorrecto = '250822';

    if (codigoIngresado !== codigoCorrecto) {
      alert('Código incorrecto. No se actualizarán los datos.');
      return;
    }

    setCargando(true);

    try {
      const db = getFirestore();

      // Borrar todos los documentos en la colección 'pagocostas'
      const pagosCostasSnapshot = await getDocs(collection(db, 'pagocostas'));
      const batch = writeBatch(db);

      pagosCostasSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      // Recalcular y almacenar los nuevos datos
      await calcularDatosEspecificos();

      setMensaje('Datos actualizados correctamente.');
    } catch (error) {
      console.error('Error al actualizar datos:', error);
      setMensaje('Error al actualizar datos.');
    }

    setCargando(false);
  };

  // Función que realiza el cálculo de los datos y los almacena en Firebase
  const calcularDatosEspecificos = async () => {
    const db = getFirestore();
  
    try {
      // Obtener todos los usuarios
      const usuariosSnapshot = await getDocs(collection(db, 'pensionados'));
      const usuarios = usuariosSnapshot.docs.map((doc) => ({
        id: doc.id,
        nombre: doc.data().empleado || 'Sin Nombre',
        pnlDependencia: doc.data().pnlDependencia || 'Sin dependencia',
        pnlCentroCosto: doc.data().pnlCentroCosto || 'Sin centro de costo',
      }));
  
      let resultadosTemp = [];
  
      // Para cada usuario, obtener los pagos y acumular los totales
      for (const usuario of usuarios) {
        const pagosSnapshot = await getDocs(
          collection(db, 'pensionados', usuario.id, 'pagos')
        );
  
        let totalCostas = 0;
        let fechaCostas = null;
        let totalRetros = 0;
        let fechaRetros = null;
        let totalProcesos = 0;
        let fechaProcesos = null;
  
        pagosSnapshot.docs.forEach((doc) => {
          const pago = doc.data();
  
          // Verificar si el pago tiene detalles
          if (Array.isArray(pago.detalles)) {
            pago.detalles.forEach((detalle) => {
              const ingreso = Number(detalle.ingresos) || 0;
  
              if (detalle.nombre === '470-Costas Procesales') {
                totalCostas += ingreso;
                fechaCostas = pago.periodoPago || fechaCostas; // Guardar la última fecha válida
              } else if (detalle.nombre === '785-Retro Mesada Adicional M14') {
                totalRetros += ingreso;
                fechaRetros = pago.periodoPago || fechaRetros; // Guardar la última fecha válida
              } else if (detalle.nombre === '475-Procesos Y Sentencia Judiciales') {
                totalProcesos += ingreso;
                fechaProcesos = pago.periodoPago || fechaProcesos; // Guardar la última fecha válida
              }
            });
          }
        });
  
        if (totalCostas > 0 || totalRetros > 0 || totalProcesos > 0) {
          const resultadoUsuario = {
            id: usuario.id,
            nombre: usuario.nombre,
            pnlDependencia: usuario.pnlDependencia,
            pnlCentroCosto: usuario.pnlCentroCosto,
            costasProcesales: totalCostas,
            fechaCostas,
            retroMesadaAdicional: totalRetros,
            fechaRetros,
            procesosSentencia: totalProcesos,
            fechaProcesos,
            total: totalCostas + totalRetros + totalProcesos,
          };
  
          resultadosTemp.push(resultadoUsuario);
  
          // Guardar en Firebase en la colección 'pagocostas'
          await setDoc(doc(db, 'pagocostas', usuario.id), resultadoUsuario);
        }
      }
  
      setResultados(resultadosTemp);
  
      // Extraer dependencias y centros de costo únicos para los filtros
      const dependenciasUnicas = [
        ...new Set(resultadosTemp.map((resultado) => resultado.pnlDependencia)),
      ].filter(Boolean);
      setDependencias(dependenciasUnicas);
  
      const centrosCostoUnicos = [
        ...new Set(resultadosTemp.map((resultado) => resultado.pnlCentroCosto)),
      ].filter(Boolean);
      setCentrosCosto(centrosCostoUnicos);
    } catch (error) {
      console.error('Error al calcular datos:', error);
      setMensaje('Error al calcular datos.');
    }
  };
  

  useEffect(() => {
    // Al montar el componente, solo obtenemos los datos ya calculados
    buscarDatosEspecificos();
  }, []);

  const formatoMoneda = (valor) => {
    const numero = Number(valor) || 0;
    return numero.toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
    });
  };

  const handleBusquedaChange = (e) => {
    setBusqueda(e.target.value);
  };

  const handleOrdenar = (columna) => {
    const nuevoOrden = columnaOrden === columna && orden === 'asc' ? 'desc' : 'asc';
    setOrden(nuevoOrden);
    setColumnaOrden(columna);
  };

  // Filtrar resultados según búsqueda, dependencia y centro de costo
  const resultadosFiltrados = resultados
    .filter(
      (resultado) =>
        resultado.nombre.toLowerCase().includes(busqueda.toLowerCase()) &&
        (dependenciaSeleccionada === '' ||
          resultado.pnlDependencia === dependenciaSeleccionada) &&
        (centroCostoSeleccionado === '' ||
          resultado.pnlCentroCosto === centroCostoSeleccionado)
    )
    .sort((a, b) => {
      if (columnaOrden === 'nombre') {
        return orden === 'asc'
          ? a.nombre.localeCompare(b.nombre)
          : b.nombre.localeCompare(a.nombre);
      } else {
        return orden === 'asc'
          ? a[columnaOrden] - b[columnaOrden]
          : b[columnaOrden] - a[columnaOrden];
      }
    });


    const formatoFecha = (fecha) => {
      if (!fecha) return 'N/A';
    
      // Busca patrones como "1 jun. 2022 a 30 jun. 2022"
      const regex = /\d+\s(\w+)\.\s(\d{4})/;
      const match = fecha.match(regex);
    
      if (match) {
        const [, mes, año] = match; // Extrae el mes y el año
        return `${mes.charAt(0).toUpperCase() + mes.slice(1)} ${año}`; // Capitaliza el mes
      }
    
      return 'Fecha no válida';
    };
    
    
    return (
      <div className="pagos-especificos-container">
        <h2>Pagos Específicos</h2>
    
        {/* Botones para realizar y actualizar la consulta */}
        <div className="botones-consulta">
          <button onClick={buscarDatosEspecificos} disabled={cargando}>
            {cargando ? 'Cargando...' : 'Realizar Consulta'}
          </button>
          <button onClick={actualizarDatos} disabled={cargando}>
            {cargando ? 'Actualizando...' : 'Actualizar Consulta'}
          </button>
        </div>
    
        {mensaje && <p className="mensaje">{mensaje}</p>}
    
        {/* Filtros */}
        <div className="filtro-contenedor">
          {/* Selector de dependencia */}
          <select
            id="dependencia-select"
            value={dependenciaSeleccionada}
            onChange={(e) => setDependenciaSeleccionada(e.target.value)}
            className="modern-select"
          >
            <option value="">Todas las dependencias</option>
            {dependencias.map((dependencia, index) => (
              <option key={index} value={dependencia}>
                {dependencia}
              </option>
            ))}
          </select>
    
          {/* Selector de centro de costo */}
          <select
            id="centro-costo-select"
            value={centroCostoSeleccionado}
            onChange={(e) => setCentroCostoSeleccionado(e.target.value)}
            className="modern-select"
          >
            <option value="">Todos los centros de costo</option>
            {centrosCosto.map((centro, index) => (
              <option key={index} value={centro}>
                {centro}
              </option>
            ))}
          </select>
    
          {/* Campo de búsqueda */}
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={busqueda}
            onChange={handleBusquedaChange}
            className="modern-input buscador-input"
          />
        </div>
    
        <div className="resultados-lista">
          {resultadosFiltrados.length > 0 ? (
            <table className="tabla-resultados">
              <thead>
                <tr>
                  <th onClick={() => handleOrdenar('nombre')}>
                    Nombre del Usuario {columnaOrden === 'nombre' && (orden === 'asc' ? '▲' : '▼')}
                  </th>
                  <th onClick={() => handleOrdenar('pnlDependencia')}>
                    Dependencia {columnaOrden === 'pnlDependencia' && (orden === 'asc' ? '▲' : '▼')}
                  </th>
                  <th onClick={() => handleOrdenar('pnlCentroCosto')}>
                    Centro de Costo {columnaOrden === 'pnlCentroCosto' && (orden === 'asc' ? '▲' : '▼')}
                  </th>
                  <th onClick={() => handleOrdenar('costasProcesales')}>
                    Costas Procesales {columnaOrden === 'costasProcesales' && (orden === 'asc' ? '▲' : '▼')}
                  </th>
                  <th onClick={() => handleOrdenar('retroMesadaAdicional')}>
                    Retro Mesada Adicional{' '}
                    {columnaOrden === 'retroMesadaAdicional' && (orden === 'asc' ? '▲' : '▼')}
                  </th>
                  <th onClick={() => handleOrdenar('procesosSentencia')}>
                    Procesos y Sentencia Judiciales{' '}
                    {columnaOrden === 'procesosSentencia' && (orden === 'asc' ? '▲' : '▼')}
                  </th>
                  <th onClick={() => handleOrdenar('total')}>
                    Total {columnaOrden === 'total' && (orden === 'asc' ? '▲' : '▼')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {resultadosFiltrados.map((resultado) => (
                  <tr key={resultado.id}>
                    <td>{resultado.nombre}</td>
                    <td>{resultado.pnlDependencia}</td>
                    <td>{resultado.pnlCentroCosto}</td>
                    <td>
                      {formatoMoneda(resultado.costasProcesales)}
                      <br />
                      <span className="fecha">{formatoFecha(resultado.fechaCostas)}</span>
                    </td>
                    <td>
                      {formatoMoneda(resultado.retroMesadaAdicional)}
                      <br />
                      <span className="fecha">{formatoFecha(resultado.fechaRetros)}</span>
                    </td>
                    <td>
                      {formatoMoneda(resultado.procesosSentencia)}
                      <br />
                      <span className="fecha">{formatoFecha(resultado.fechaProcesos)}</span>
                    </td>
                    <td>{formatoMoneda(resultado.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : cargando ? (
            <p>Cargando datos...</p>
          ) : (
            <p>No se encontraron datos específicos.</p>
          )}
        </div>
      </div>
    );
    
};

export default PagosEspecificos;
