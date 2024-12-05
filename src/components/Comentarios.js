import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { setUsuarioSeleccionado, setPensiones, setLoading, setError } from '../redux/pensionesSlice';
import './Comentarios.css';

const Comentarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [usuarioSeleccionadoId, setUsuarioSeleccionadoId] = useState(null);
  const [dependencias, setDependencias] = useState([]);
  const [dependenciaSeleccionada, setDependenciaSeleccionada] = useState('');
  const [centrosCosto, setCentrosCosto] = useState([]);
  const [centroCostoSeleccionado, setCentroCostoSeleccionado] = useState('');
  const dispatch = useDispatch();
  const db = getFirestore();

  const obtenerUsuariosDesdeFirestore = async () => {
    try {
      const pensionadosCollection = collection(db, 'pensionados');
      const snapshot = await getDocs(pensionadosCollection);
  
      const usuariosFirestore = snapshot.docs.map((doc) => {
        const data = doc.data();
        const nombreFormateado = formatearNombre(data.empleado || 'Sin Nombre'); // Aplica la función
        return {
          id: doc.id,
          nombre: nombreFormateado,
          documento: data.documento,
          centroCosto: data.centroCosto || 'Sin centro de costo',
          dependencia: data.dependencia || 'Sin dependencia',
          empresa: data.empresa || 'Sin empresa',
          esquema: data.esquema || 'Sin esquema',
          fondoSalud: data.fondoSalud || 'Sin fondo de salud',
          nitEmpresa: data.nitEmpresa || 'Sin NIT',
          cargo: data.cargo || 'Sin cargo',
          pnlDependencia: data.pnlDependencia || 'Sin dependencia detallada',
          pnlCentroCosto: data.pnlCentroCosto || 'Sin centro de costo',
        };
      });
  
      // Obtener valores únicos para los selectores
      const dependenciasUnicas = [
        ...new Set(
          usuariosFirestore
            .map((usuario) => usuario.pnlDependencia?.split('-').slice(1).join('-') || 'Sin dependencia')
        ),
      ].filter(Boolean);
  
      const centrosCostoUnicos = [...new Set(usuariosFirestore.map((usuario) => usuario.pnlCentroCosto))].filter(Boolean);
  
      setUsuarios(usuariosFirestore);
      setDependencias(dependenciasUnicas);
      setCentrosCosto(centrosCostoUnicos);
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
    }
  };
  
  const formatearNombre = (nombreCompleto) => {
    // Expresión regular para capturar el formato esperado
    const regex = /^([\w\sÁÉÍÓÚáéíóúÑñ]+)\s([\w\sÁÉÍÓÚáéíóúÑñ]+)\s\((C\.C\.\s[\d]+)\)$/;
    const match = nombreCompleto.match(regex);
  
    if (match) {
      const [_, apellidos, nombres, documento] = match;
      // Retornar el nombre reordenado
      return `${nombres.trim()} ${apellidos.trim()} (${documento})`;
    }
  
    // Si no coincide con el formato esperado, retornar el nombre original
    return nombreCompleto;
  };
  
  useEffect(() => {
    obtenerUsuariosDesdeFirestore();
  }, []);

  const seleccionarUsuario = (usuario) => {
    setUsuarioSeleccionadoId(usuario.id);
    dispatch(setUsuarioSeleccionado(usuario));
    cargarPensiones(usuario);
  };

  const cargarPensiones = async (usuario) => {
    try {
      dispatch(setLoading(true));
      const pagosRef = collection(db, 'pensionados', usuario.id, 'pagos');
      const pagosSnapshot = await getDocs(pagosRef);

      const pensiones = pagosSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      dispatch(setPensiones(pensiones));
      dispatch(setLoading(false));
    } catch (error) {
      dispatch(setError('Error al obtener pensiones del usuario'));
      dispatch(setLoading(false));
    }
  };

  // Filtrar usuarios según la búsqueda, dependencia y centro de costo seleccionados
  const usuariosFiltrados = usuarios.filter(
    (usuario) =>
      usuario.nombre.toLowerCase().includes(busqueda.toLowerCase()) &&
      (dependenciaSeleccionada === '' ||
        usuario.pnlDependencia?.split('-').slice(1).join('-') === dependenciaSeleccionada) &&
      (centroCostoSeleccionado === '' || usuario.pnlCentroCosto === centroCostoSeleccionado)
  );

  // Función para descargar los IDs como JSON
  const descargarJson = () => {
    const ids = usuarios.map((usuario) => usuario.id);
    const jsonContent = JSON.stringify(ids, null, 2); // Formato legible con indentación
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'ids.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="buscador-usuarios-container">
      <h2>🔍 Buscar Usuarios</h2>

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

        {/* Input de búsqueda */}
        <input
          type="text"
          placeholder="Buscar por nombre..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="modern-input buscador-input"
        />
      </div>

      <p className="contador-usuarios">
        Total de usuarios encontrados: {usuariosFiltrados.length}
      </p>

      {/* Botón para descargar IDs como JSON */}
      {/* <button onClick={descargarJson}>Descargar IDs como JSON</button> */}

      {/* Lista de usuarios */}
      <div className="lista-usuarios">
        {usuariosFiltrados.length > 0 ? (
          usuariosFiltrados.map((usuario, index) => (
            <div
              key={usuario.id}
              className={`usuario-item ${index % 2 === 0 ? 'even' : 'odd'} ${
                usuario.id === usuarioSeleccionadoId ? 'selected' : ''
              }`}
              onClick={() => seleccionarUsuario(usuario)}
              style={{ cursor: 'pointer' }}
            >
              <span>{usuario.nombre}</span>
            </div>
          ))
        ) : (
          <p>No se encontraron usuarios.</p>
        )}
      </div>
    </div>
  );
};

export default Comentarios;
