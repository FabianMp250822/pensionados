import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs
} from 'firebase/firestore';
import {
  setUsuarioSeleccionado,
  setPensiones,
  setLoading,
  setError,
  setParrisData 
} from '../redux/pensionesSlice';
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

      const usuariosFirestore = snapshot.docs.map((docSnapshot) => {
        const data = docSnapshot.data();
        const nombreFormateado = formatearNombre(data.empleado || 'Sin Nombre'); 
        return {
          id: docSnapshot.id,
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
          usuariosFirestore.map((usuario) =>
            usuario.pnlDependencia?.split('-').slice(1).join('-') || 'Sin dependencia'
          )
        ),
      ].filter(Boolean);

      const centrosCostoUnicos = [
        ...new Set(usuariosFirestore.map((usuario) => usuario.pnlCentroCosto))
      ].filter(Boolean);

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
      return `${nombres.trim()} ${apellidos.trim()} (${documento})`;
    }
    return nombreCompleto;
  };

  useEffect(() => {
    obtenerUsuariosDesdeFirestore();
  }, []);

  // ----------------------------------------------------
  // Función para cargar datos de la colección "parris"
  // ----------------------------------------------------
  const cargarDatosParris = async (usuario) => {
    try {
      const docRef = doc(db, 'parris1', usuario.documento.trim());
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const datosParris = docSnap.data();
        console.log('Datos Parris:', datosParris);
        dispatch(setParrisData(datosParris));
      } else {
        console.log('No se encontró información en parris para el documento:', usuario.documento);
        dispatch(setParrisData(null));
      }
    } catch (error) {
      console.error('Error al obtener datos de parris:', error);
      dispatch(setParrisData(null));
    }
  };

  // Seleccionar usuario
  const seleccionarUsuario = (usuario) => {
    setUsuarioSeleccionadoId(usuario.id);
    dispatch(setUsuarioSeleccionado(usuario));
    cargarPensiones(usuario);
    cargarDatosParris(usuario);
  };

  const cargarPensiones = async (usuario) => {
    try {
      dispatch(setLoading(true));
      const pagosRef = collection(db, 'pensionados', usuario.id, 'pagos');
      const pagosSnapshot = await getDocs(pagosRef);

      const pensiones = pagosSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
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

  // Si quisieras un botón que "dispare" la búsqueda en vez de hacerlo en tiempo real,
  // podrías almacenar el valor de busquedaInput en un state distinto y asignarlo a "busqueda"
  // sólo cuando se haga clic en el botón. Pero en este ejemplo, seguirá siendo inmediato.

  return (
    <div className="buscador-usuarios-container">
      <h4>Administrar Usuarios</h4>

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
          placeholder="Buscador"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="modern-input buscador-input"
        />

        {/* Botón de búsqueda (opcional) */}
       
      </div>

      <p className="contador-usuarios">
        Total de usuarios encontrados: {usuariosFiltrados.length}
      </p>

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
