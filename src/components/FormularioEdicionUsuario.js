import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/firebaseConfig';
import './ListaUsuarios.css';

const FormularioEdicionUsuario = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [usuariosFiltrados, setUsuariosFiltrados] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [mostrarModalEdicion, setMostrarModalEdicion] = useState(false);
  const [formData, setFormData] = useState({});
  const [salarioMinimo, setSalarioMinimo] = useState(1300000);
  const [editandoSalario, setEditandoSalario] = useState(false);
  const [grupos, setGrupos] = useState([]);
  const [nuevoGrupo, setNuevoGrupo] = useState('');
  const [convenioPagoFile, setConvenioPagoFile] = useState(null);
  const [otrosArchivos, setOtrosArchivos] = useState([{ nombreArchivo: '', archivo: null }]);

  // Obtener usuarios desde Firebase
  useEffect(() => {
    const obtenerUsuarios = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'nuevosclientes'));
        const usuariosData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsuarios(usuariosData);
        setUsuariosFiltrados(usuariosData);
      } catch (error) {
        console.error('Error al obtener usuarios:', error);
      }
    };
    obtenerUsuarios();
  }, []);

  // Obtener grupos desde Firebase
  useEffect(() => {
    const cargarGrupos = async () => {
      const querySnapshot = await getDocs(collection(db, 'grupos'));
      const gruposData = querySnapshot.docs.map((doc) => doc.data().nombre);
      setGrupos(gruposData);
    };
    cargarGrupos();
  }, []);

  // Manejar la búsqueda
  const handleBusqueda = (e) => {
    const valor = e.target.value;
    setBusqueda(valor);
    const filtrados = usuarios.filter((usuario) => {
      const nombreCompleto = `${usuario.nombres} ${usuario.apellidos}`.toLowerCase();
      return (
        nombreCompleto.includes(valor.toLowerCase()) || usuario.cedula.includes(valor.toLowerCase())
      );
    });
    setUsuariosFiltrados(filtrados);
  };

  // Abrir modal de edición
  const abrirModalEdicion = (usuario) => {
    setUsuarioSeleccionado(usuario);
    setFormData({
      ...usuario,
      archivos: usuario.archivos || {}, // Asegura que 'archivos' esté definido
    });
    setMostrarModalEdicion(true);
  };
  

  // Cerrar modal de edición
  const cerrarModalEdicion = () => {
    setMostrarModalEdicion(false);
    setUsuarioSeleccionado(null);
    setConvenioPagoFile(null);
    setOtrosArchivos([{ nombreArchivo: '', archivo: null }]);
  };

  // Manejar cambios en el formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Guardar cambios de edición
  const guardarEdicion = async () => {
    try {
      let archivosActualizados = { ...formData.archivos };

      // Subir convenio de pago si fue modificado
      if (convenioPagoFile) {
        const convenioRef = ref(storage, `convenios/${convenioPagoFile.name}`);
        await uploadBytes(convenioRef, convenioPagoFile);
        const downloadURL = await getDownloadURL(convenioRef);
        archivosActualizados['convenioPago'] = downloadURL;
      }

      // Subir otros archivos nuevos
      for (const archivo of otrosArchivos) {
        if (archivo.archivo) {
          const archivoRef = ref(storage, `otros/${archivo.archivo.name}`);
          await uploadBytes(archivoRef, archivo.archivo);
          const downloadURL = await getDownloadURL(archivoRef);
          archivosActualizados[archivo.nombreArchivo] = downloadURL;
        }
      }

      // Actualizar datos en Firebase
      const usuarioRef = doc(db, 'nuevosclientes', usuarioSeleccionado.id);
      await updateDoc(usuarioRef, { ...formData, archivos: archivosActualizados });

      // Actualizar lista de usuarios
      setUsuarios((prevUsuarios) =>
        prevUsuarios.map((usuario) =>
          usuario.id === usuarioSeleccionado.id ? { ...formData, archivos: archivosActualizados } : usuario
        )
      );

      alert('Usuario actualizado exitosamente.');
      cerrarModalEdicion();
    } catch (error) {
      console.error('Error al guardar cambios:', error);
      alert('Error al guardar cambios. Revisa la consola.');
    }
  };

  // Guardar nuevo grupo
  const handleNuevoGrupoSubmit = async () => {
    if (nuevoGrupo.trim() !== '') {
      try {
        await addDoc(collection(db, 'grupos'), { nombre: nuevoGrupo });
        setGrupos((prev) => [...prev, nuevoGrupo]);
        setNuevoGrupo('');
        setFormData((prev) => ({ ...prev, grupo: nuevoGrupo }));
      } catch (error) {
        console.error('Error al agregar grupo:', error);
        alert('Error al agregar grupo.');
      }
    }
  };
  const handleGuardarSalario = () => {
    const nuevoSalario = parseInt(formData.salario, 10);
    if (!isNaN(nuevoSalario) && nuevoSalario > 0) {
      setSalarioMinimo(nuevoSalario);
      setEditandoSalario(false);
      setFormData((prev) => ({
        ...prev,
        salario: nuevoSalario * prev.multiplicadorSalario,
      }));
    }
  };

    // Eliminar usuario
    const eliminarUsuario = async (usuarioId) => {
        if (window.confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
          try {
            await deleteDoc(doc(db, 'nuevosclientes', usuarioId));
            setUsuarios((prevUsuarios) => prevUsuarios.filter((usuario) => usuario.id !== usuarioId));
            setUsuariosFiltrados((prevUsuarios) => prevUsuarios.filter((usuario) => usuario.id !== usuarioId));
            alert('Usuario eliminado exitosamente.');
          } catch (error) {
            console.error('Error al eliminar usuario:', error);
            alert('Error al eliminar usuario. Revisa la consola.');
          }
        }
      };
  return (
    <div>
      <h2>Lista de Usuarios</h2>
      <input
        type="text"
        placeholder="Buscar por nombre o cédula..."
        value={busqueda}
        onChange={handleBusqueda}
      />
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Nombres</th>
            <th>Apellidos</th>
            <th>Cédula</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usuariosFiltrados.map((usuario, index) => (
            <tr key={usuario.id}>
              <td>{index + 1}</td>
              <td>{usuario.nombres}</td>
              <td>{usuario.apellidos}</td>
              <td>{usuario.cedula}</td>
              <td>
                <button onClick={() => abrirModalEdicion(usuario)}>Editar</button>
                <button
                  style={{ marginLeft: '10px', backgroundColor: '#dc3545', color: '#fff' }}
                  onClick={() => eliminarUsuario(usuario.id)}
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {mostrarModalEdicion && (
  <div className="modal">
    <div className="modal-content" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h3>Editar Usuario</h3>
      <form onSubmit={(e) => { e.preventDefault(); guardarEdicion(); }}>
        {/* Bloque de salario mínimo y grupo */}
        <div className="salario-minimo">
          <div>
            <h3>Aporte costos Operativos: ${salarioMinimo.toLocaleString('es-CO')}</h3>
            <button
              type="button"
              onClick={() => setEditandoSalario(!editandoSalario)}
              style={{ marginLeft: '10px' }}
            >
              Editar
            </button>
            {editandoSalario && (
              <div>
                <input
                  type="number"
                  value={salarioMinimo}
                  onChange={(e) => setSalarioMinimo(parseInt(e.target.value, 10))}
                />
                <button type="button" onClick={handleGuardarSalario}>Guardar</button>
              </div>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="grupo">Grupo:</label>
            <select
              id="grupo"
              name="grupo"
              value={formData.grupo}
              onChange={handleChange}
            >
              <option value="">Seleccione un grupo</option>
              {grupos.map((grupo, index) => (
                <option key={index} value={grupo}>{grupo}</option>
              ))}
              <option value="nueva-opcion">Nueva Opción</option>
            </select>
            {formData.grupo === "nueva-opcion" && (
              <div>
                <input
                  type="text"
                  placeholder="Nuevo Grupo"
                  value={nuevoGrupo}
                  onChange={(e) => setNuevoGrupo(e.target.value)}
                />
                <button type="button" onClick={handleNuevoGrupoSubmit}>Guardar Nuevo Grupo</button>
              </div>
            )}
          </div>
        </div>

        {/* Datos Personales */}
        <div className="form-group">
          <label>Nombres:</label>
          <input
            type="text"
            name="nombres"
            value={formData.nombres}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label>Apellidos:</label>
          <input
            type="text"
            name="apellidos"
            value={formData.apellidos}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label>Cédula:</label>
          <input
            type="text"
            name="cedula"
            value={formData.cedula}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label>Correo:</label>
          <input
            type="email"
            name="correo"
            value={formData.correo}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label>Teléfono Fijo:</label>
          <input
            type="text"
            name="telefonoFijo"
            value={formData.telefonoFijo}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label>Celular:</label>
          <input
            type="text"
            name="celular"
            value={formData.celular}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label>Dirección:</label>
          <input
            type="text"
            name="direccion"
            value={formData.direccion}
            onChange={handleChange}
          />
        </div>

        {/* Salario y Plazo */}
        <div className="form-group">
          <label>Multiplicador de Salario:</label>
          <input
            type="number"
            name="multiplicadorSalario"
            value={formData.multiplicadorSalario}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label>Salario:</label>
          <input
            type="number"
            name="salario"
            value={formData.salario}
            readOnly
          />
        </div>
        <div className="form-group">
          <label>Plazo en Meses:</label>
          <input
            type="number"
            name="plazoMeses"
            value={formData.plazoMeses}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label>Cuota Mensual:</label>
          <input
            type="number"
            value={formData.cuotaMensual}
            readOnly
          />
        </div>

        {/* Archivos */}
        <div className="form-group">
          <label>Convenio de Pago:</label>
          <input
            type="file"
            onChange={(e) => setConvenioPagoFile(e.target.files[0])}
          />
          {formData.archivos.convenioPago && (
            <a href={formData.archivos.convenioPago} target="_blank" rel="noopener noreferrer">Ver Archivo</a>
          )}
        </div>
        <div className="form-group">
          <label>Otros Archivos:</label>
          {otrosArchivos.map((archivo, index) => (
            <div key={index} className="form-group">
              <input
                type="text"
                placeholder="Nombre del Archivo"
                value={archivo.nombreArchivo}
                onChange={(e) => {
                  const nuevosArchivos = [...otrosArchivos];
                  nuevosArchivos[index].nombreArchivo = e.target.value;
                  setOtrosArchivos(nuevosArchivos);
                }}
              />
              <input
                type="file"
                onChange={(e) => {
                  const nuevosArchivos = [...otrosArchivos];
                  nuevosArchivos[index].archivo = e.target.files[0];
                  setOtrosArchivos(nuevosArchivos);
                }}
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() => setOtrosArchivos([...otrosArchivos, { nombreArchivo: '', archivo: null }])}
          >
            Agregar Archivo
          </button>
        </div>

        {/* Botones */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
          <button type="submit" style={{ backgroundColor: '#28a745', color: '#fff' }}>Guardar Cambios</button>
          <button type="button" onClick={cerrarModalEdicion} style={{ backgroundColor: '#dc3545', color: '#fff' }}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  </div>
)}

    </div>
  );
};

export default FormularioEdicionUsuario;
