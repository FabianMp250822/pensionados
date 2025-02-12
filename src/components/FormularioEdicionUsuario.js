import React, { useState, useEffect } from 'react';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  deleteDoc,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/firebaseConfig';

import './ListaUsuarios.css';

const FormularioEdicionUsuario = () => {
  // --- Estados principales ---
  const [usuarios, setUsuarios] = useState([]);
  const [usuariosFiltrados, setUsuariosFiltrados] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [salarioActual, setSalarioActual] = useState('');
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [mostrarModalEdicion, setMostrarModalEdicion] = useState(false);

  // Objeto que representa todos los datos del usuario (para el modal)
  const [formData, setFormData] = useState({});

  // Salario base o mínimo (puede usarse para multiplicar)
  const [salarioMinimo, setSalarioMinimo] = useState(1300000);
  const [editandoSalario, setEditandoSalario] = useState(false);

  const [grupos, setGrupos] = useState([]);
  const [nuevoGrupo, setNuevoGrupo] = useState('');

  // Archivos
  const [convenioPagoFile, setConvenioPagoFile] = useState(null);
  const [otrosArchivos, setOtrosArchivos] = useState([
    { nombreArchivo: '', archivo: null },
  ]);

  // -------------------------------------------------------------
  // 1. Obtener usuarios desde Firebase
  // -------------------------------------------------------------
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

  // -------------------------------------------------------------
  // 2. Obtener grupos desde Firebase
  // -------------------------------------------------------------
  useEffect(() => {
    const cargarGrupos = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'grupos'));
        const gruposData = querySnapshot.docs.map((doc) => doc.data().nombre);
        setGrupos(gruposData);
      } catch (error) {
        console.error('Error al cargar grupos:', error);
      }
    };
    cargarGrupos();
  }, []);

  // -------------------------------------------------------------
  // 3. Manejar la búsqueda en el input superior
  // -------------------------------------------------------------
  const handleBusqueda = (e) => {
    const valor = e.target.value;
    setBusqueda(valor);

    const filtrados = usuarios.filter((usuario) => {
      const nombreCompleto = `${usuario.nombres} ${usuario.apellidos}`.toLowerCase();
      return (
        nombreCompleto.includes(valor.toLowerCase()) ||
        usuario.cedula.includes(valor.toLowerCase())
      );
    });

    setUsuariosFiltrados(filtrados);
  };

  // -------------------------------------------------------------
  // 4. Abrir modal de edición
  // -------------------------------------------------------------
  const abrirModalEdicion = (usuario) => {
    setUsuarioSeleccionado(usuario);
    setFormData({
      ...usuario,
      archivos: usuario.archivos || {}, // Asegura que 'archivos' esté definido y no sea undefined
    });
    setMostrarModalEdicion(true);
  };

  // -------------------------------------------------------------
  // 5. Cerrar modal de edición
  // -------------------------------------------------------------
  const cerrarModalEdicion = () => {
    setMostrarModalEdicion(false);
    setUsuarioSeleccionado(null);
    setConvenioPagoFile(null);
    setOtrosArchivos([{ nombreArchivo: '', archivo: null }]);
  };

  // -------------------------------------------------------------
  // 6. Manejar cambios en los inputs del formulario
  // -------------------------------------------------------------
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newFormData = { ...prev, [name]: value };
  
      // Validación de datos
      const multiplicador = parseFloat(newFormData.multiplicadorSalario || 0);
      const salarioActual = parseFloat(newFormData.salarioActual || 0);
  
      if (isNaN(multiplicador) || multiplicador < 0 || isNaN(salarioActual) || salarioActual < 0) {
        // Mostrar un mensaje de error
        console.error("El multiplicador de salario y el salario actual deben ser números positivos.");
        return prev;
      }
  
      // Cálculos
      const nuevoSalario = multiplicador * salarioActual; 
      newFormData.salario = nuevoSalario.toLocaleString('es-CO', {
        minimumFractionDigits: 2,
      }); // Formato con separadores de miles y dos decimales
  
      const plazo = parseFloat(newFormData.plazoMeses || 0);
      if (plazo > 0) {
        newFormData.cuotaMensual = (nuevoSalario / plazo).toFixed(2);
      }
  
      return newFormData;
    });
  };
  // -------------------------------------------------------------
  // 7. Guardar cambios de edición (subir a Firestore)
  // -------------------------------------------------------------
  const guardarEdicion = async () => {
    try {
      // Copiamos archivos del formData (por si subimos nuevos)
      let archivosActualizados = { ...formData.archivos };

      // Si se sube un convenio de pago nuevo, lo guardamos en Storage
      if (convenioPagoFile) {
        const convenioRef = ref(storage, `convenios/${convenioPagoFile.name}`);
        await uploadBytes(convenioRef, convenioPagoFile);
        const downloadURL = await getDownloadURL(convenioRef);
        archivosActualizados['convenioPago'] = downloadURL;
      }

      // Subir otros archivos
      for (const archivo of otrosArchivos) {
        if (archivo.archivo) {
          const archivoRef = ref(storage, `otros/${archivo.archivo.name}`);
          await uploadBytes(archivoRef, archivo.archivo);
          const downloadURL = await getDownloadURL(archivoRef);
          archivosActualizados[archivo.nombreArchivo] = downloadURL;
        }
      }

      // Construimos el objeto final a subir
      const dataParaFirebase = {
        ...formData,
        archivos: archivosActualizados,
      };

      // Actualizar en Firestore
      const usuarioRef = doc(db, 'nuevosclientes', usuarioSeleccionado.id);
      await updateDoc(usuarioRef, dataParaFirebase);

      // Actualizar la lista local de usuarios
      setUsuarios((prevUsuarios) =>
        prevUsuarios.map((usuario) =>
          usuario.id === usuarioSeleccionado.id
            ? { ...dataParaFirebase }
            : usuario
        )
      );

      alert('Usuario actualizado exitosamente.');
      cerrarModalEdicion();
    } catch (error) {
      console.error('Error al guardar cambios:', error);
      alert('Error al guardar cambios. Revisa la consola.');
    }
  };

  // -------------------------------------------------------------
  // 8. Guardar un nuevo grupo en la colección "grupos"
  // -------------------------------------------------------------
  const handleNuevoGrupoSubmit = async () => {
    if (nuevoGrupo.trim() !== '') {
      try {
        await addDoc(collection(db, 'grupos'), { nombre: nuevoGrupo });
        setGrupos((prev) => [...prev, nuevoGrupo]);
        setNuevoGrupo('');
        // Asignamos el nuevo grupo a formData
        setFormData((prev) => ({ ...prev, grupo: nuevoGrupo }));
      } catch (error) {
        console.error('Error al agregar grupo:', error);
        alert('Error al agregar grupo.');
      }
    }
  };

  // -------------------------------------------------------------
  // 9. Guardar cambios del salario base (salarioMinimo)
  // -------------------------------------------------------------
  const handleGuardarSalario = () => {
    // Aquí podrías recalcular el "salario" de formData
    // si deseas que cambie cuando cambias el salarioMinimo global
    const nuevoSalario = parseFloat(formData.salario || 0);

    if (!isNaN(nuevoSalario) && nuevoSalario > 0) {
      // Sobrescribimos el salarioMinimo
      setSalarioMinimo(nuevoSalario);
      setEditandoSalario(false);

      // También, podríamos recalcular para ver el efecto en formData
      // Ejemplo: formData.salario = salarioMinimo * multiplicadorSalario
      setFormData((prev) => {
        const multiplicador = parseFloat(prev.multiplicadorSalario || 1);
        return {
          ...prev,
          salario: nuevoSalario * multiplicador,
        };
      });
    }
  };

  // -------------------------------------------------------------
  // 10. Eliminar un usuario de Firestore
  // -------------------------------------------------------------
  const eliminarUsuario = async (usuarioId) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      try {
        await deleteDoc(doc(db, 'nuevosclientes', usuarioId));
        setUsuarios((prevUsuarios) =>
          prevUsuarios.filter((usuario) => usuario.id !== usuarioId)
        );
        setUsuariosFiltrados((prevUsuarios) =>
          prevUsuarios.filter((usuario) => usuario.id !== usuarioId)
        );
        alert('Usuario eliminado exitosamente.');
      } catch (error) {
        console.error('Error al eliminar usuario:', error);
        alert('Error al eliminar usuario. Revisa la consola.');
      }
    }
  };

  // -------------------------------------------------------------
  // Render principal
  // -------------------------------------------------------------
  return (
    <div>
      {/* Sección de Lista de Usuarios */}
      <div
        style={{
          padding: '10px 0',
        }}
      >
        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>
          Lista de Usuarios
        </h2>
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            backgroundColor: '#f9f9f9',
            borderRadius: '8px',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
          }}
        >
          <input
            type="text"
            placeholder="Buscar por nombre o cédula..."
            value={busqueda}
            onChange={handleBusqueda}
            style={{
              width: '100%',
              padding: '10px',
              marginBottom: '20px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              boxSizing: 'border-box',
            }}
          />
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
            }}
          >
            <thead>
              <tr style={{ backgroundColor: '#007bff', color: '#fff' }}>
                <th
                  style={{
                    padding: '10px',
                    textAlign: 'left',
                    fontWeight: 'bold',
                    color: '#000',
                  }}
                >
                  #
                </th>
                <th
                  style={{
                    padding: '10px',
                    textAlign: 'left',
                    fontWeight: 'bold',
                    color: '#000',
                  }}
                >
                  Nombres
                </th>
                <th
                  style={{
                    padding: '10px',
                    textAlign: 'left',
                    fontWeight: 'bold',
                    color: '#000',
                  }}
                >
                  Apellidos
                </th>
                <th
                  style={{
                    padding: '10px',
                    textAlign: 'left',
                    fontWeight: 'bold',
                    color: '#000',
                  }}
                >
                  Cédula
                </th>
                <th
                  style={{
                    padding: '10px',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    color: '#000',
                  }}
                >
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {usuariosFiltrados.map((usuario, index) => (
                <tr
                  key={usuario.id}
                  style={{
                    backgroundColor: index % 2 === 0 ? '#f2f2f2' : '#ffffff',
                  }}
                >
                  <td style={{ padding: '10px', textAlign: 'center' }}>
                    {index + 1}
                  </td>
                  <td style={{ padding: '10px' }}>{usuario.nombres}</td>
                  <td style={{ padding: '10px' }}>{usuario.apellidos}</td>
                  <td style={{ padding: '10px' }}>{usuario.cedula}</td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '10px',
                      }}
                    >
                      <button
                        onClick={() => abrirModalEdicion(usuario)}
                        style={{
                          padding: '5px 10px',
                          backgroundColor: '#007bff',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => eliminarUsuario(usuario.id)}
                        style={{
                          padding: '5px 10px',
                          backgroundColor: '#dc3545',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Edición */}
      {mostrarModalEdicion && (
        <div
          className="modal"
          style={{
            position: 'fixed',
            top: '20%', // Ajusta la posición vertical del modal
            left: '50%',
            transform: 'translate(-50%, -20%)',
            zIndex: 1000,
            backgroundColor: '#fff',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
            borderRadius: '8px',
            padding: '20px',
            maxWidth: '800px',
            width: '90%',
          }}
        >
          <div
            className="modal-content"
            style={{ maxWidth: '800px', margin: '0 auto' }}
          >
            <h3>Editar Usuario</h3>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                guardarEdicion();
              }}
            >
              {/* Bloque para salarioMinimo y grupo */}
              <div className="salario-minimo">
                <div>
                  <h3>
                    Aporte costos Operativos:{' '}
                    ${salarioMinimo.toLocaleString('es-CO')}
                  </h3>
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
                        onChange={(e) =>
                          setSalarioMinimo(parseInt(e.target.value, 10))
                        }
                      />
                      <button type="button" onClick={handleGuardarSalario}>
                        Guardar
                      </button>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="grupo">Grupo:</label>
                  <select
                    id="grupo"
                    name="grupo"
                    value={formData.grupo || ''}
                    onChange={handleChange}
                  >
                    <option value="">Seleccione un grupo</option>
                    {grupos.map((grupo, index) => (
                      <option key={index} value={grupo}>
                        {grupo}
                      </option>
                    ))}
                    <option value="nueva-opcion">Nueva Opción</option>
                  </select>

                  {formData.grupo === 'nueva-opcion' && (
                    <div>
                      <input
                        type="text"
                        placeholder="Nuevo Grupo"
                        value={nuevoGrupo}
                        onChange={(e) => setNuevoGrupo(e.target.value)}
                      />
                      <button type="button" onClick={handleNuevoGrupoSubmit}>
                        Guardar Nuevo Grupo
                      </button>
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
                  value={formData.nombres || ''}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Apellidos:</label>
                <input
                  type="text"
                  name="apellidos"
                  value={formData.apellidos || ''}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Cédula:</label>
                <input
                  type="text"
                  name="cedula"
                  value={formData.cedula || ''}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Correo:</label>
                <input
                  type="email"
                  name="correo"
                  value={formData.correo || ''}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Teléfono Fijo:</label>
                <input
                  type="text"
                  name="telefonoFijo"
                  value={formData.telefonoFijo || ''}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Celular:</label>
                <input
                  type="text"
                  name="celular"
                  value={formData.celular || ''}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Dirección:</label>
                <input
                  type="text"
                  name="direccion"
                  value={formData.direccion || ''}
                  onChange={handleChange}
                />
              </div>

              {/* Multiplicador, Salario, Plazo y Cuota */}
              <div className="form-group">
                <label>Multiplicador de Salario:</label>
                <input
                  type="number"
                  name="multiplicadorSalario"
                  value={formData.multiplicadorSalario || ''}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
  <label>Salario Actual:</label>
  <input
    type="number"
    name="salarioActual"
    value={formData.salarioActual || ''}
    onChange={handleChange}
  />
</div>

<div className="form-group">
  <label>Salario (calculado):</label>
  <input
    type="text" 
    name="salario" 
    value={formData.salario || ''} 
    readOnly 
  /> 
</div>

              <div className="form-group">
                <label>Plazo en Meses:</label>
                <input
                  type="number"
                  name="plazoMeses"
                  value={formData.plazoMeses || ''}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Cuota Mensual:</label>
                <input
                  type="number"
                  name="cuotaMensual"
                  value={formData.cuotaMensual || ''}
                  onChange={handleChange}
                />
              </div>

              {/* Archivos */}
              <div className="form-group">
                <label>Convenio de Pago:</label>
                <input
                  type="file"
                  onChange={(e) => setConvenioPagoFile(e.target.files[0])}
                />
                {formData.archivos?.convenioPago && (
                  <a
                    href={formData.archivos.convenioPago}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Ver Archivo
                  </a>
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
                  onClick={() =>
                    setOtrosArchivos([
                      ...otrosArchivos,
                      { nombreArchivo: '', archivo: null },
                    ])
                  }
                >
                  Agregar Archivo
                </button>
              </div>

              {/* Botones de acción */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '20px',
                }}
              >
                <button
                  type="submit"
                  style={{ backgroundColor: '#28a745', color: '#fff' }}
                >
                  Guardar Cambios
                </button>
                <button
                  type="button"
                  onClick={cerrarModalEdicion}
                  style={{ backgroundColor: '#dc3545', color: '#fff' }}
                >
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
