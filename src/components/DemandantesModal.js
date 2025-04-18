import React, { useEffect, useState } from 'react';
import './DemandantesModal.css';

const DemandantesModal = ({ proceso, onClose }) => {
  const [demandantes, setDemandantes] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [enEdicion, setEnEdicion] = useState({});
  const [valoresEditados, setValoresEditados] = useState({});
  const [nuevoDemandante, setNuevoDemandante] = useState({
    nombre_demandante: '',
    identidad_demandante: '',
    poder: '',
  });

  useEffect(() => {
    if (proceso && proceso.num_registro) {
      fetchDemandantes(proceso.num_registro);
    }
  }, [proceso]);

  const fetchDemandantes = async (num_registro) => {
    setCargando(true);
    setError(null);
    try {
      const response = await fetch(`https://appdajusticia.com/procesos.php?num_registro=${num_registro}`);
      if (!response.ok) {
        throw new Error('Error al obtener demandantes del servidor');
      }
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setDemandantes(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Ocurrió un error al cargar los demandantes.');
    } finally {
      setCargando(false);
    }
  };

  const handleEditar = (index) => {
    setEnEdicion((prev) => ({ ...prev, [index]: true }));
    setValoresEditados((prev) => ({
      ...prev,
      [index]: { ...demandantes[index] },
    }));
  };

  const handleCancelar = (index) => {
    setEnEdicion((prev) => {
      const nuevoEstado = { ...prev };
      delete nuevoEstado[index];
      return nuevoEstado;
    });
    setValoresEditados((prev) => {
      const nuevoValores = { ...prev };
      delete nuevoValores[index];
      return nuevoValores;
    });
  };

  const handleChange = (index, campo, valor) => {
    setValoresEditados((prev) => ({
      ...prev,
      [index]: {
        ...prev[index],
        [campo]: valor,
      },
    }));
  };

  const handleGuardar = async (index) => {
    const cambios = valoresEditados[index];
    if (!cambios || Object.keys(cambios).length === 0) {
      alert('No hay cambios para guardar.');
      return;
    }
  
    if (!cambios.num_registro || !cambios.identidad_demandante) {
      alert('Faltan datos para identificar el demandante.');
      return;
    }
  
    const body = {
      action: 'editDemandante',
      num_registro: cambios.num_registro,
      identidad_demandante: cambios.identidad_demandante,
      cambios: {
        nombre_demandante: cambios.nombre_demandante,
        poder: cambios.poder,
      },
    };
  
    console.log('Enviando al backend (editar demandante):', body);
  
    try {
      const response = await fetch('https://appdajusticia.com/procesos.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
  
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
  
      // Actualizar la lista de demandantes
      setDemandantes((prev) =>
        prev.map((d, i) => (i === index ? { ...d, ...cambios } : d))
      );
      handleCancelar(index);
    } catch (err) {
      console.error(err);
      alert('Error al guardar los cambios: ' + err.message);
    }
  };
  
  const handleEliminar = async (index) => {
    const demandante = demandantes[index];
    if (!demandante.num_registro || !demandante.identidad_demandante) {
      alert('Faltan datos para identificar el demandante.');
      return;
    }
  
    if (!window.confirm('¿Estás seguro de que deseas eliminar este demandante? Esta acción es irreversible.')) {
      return;
    }
  
    const body = {
      action: 'deleteDemandante',
      num_registro: demandante.num_registro,
      identidad_demandante: demandante.identidad_demandante,
    };
  
    console.log('Enviando al backend (eliminar demandante):', body);
  
    try {
      const response = await fetch('https://appdajusticia.com/procesos.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
  
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
  
      // Eliminarlo del estado
      setDemandantes((prev) => prev.filter((_, i) => i !== index));
    } catch (err) {
      console.error(err);
      alert('Error al eliminar el demandante: ' + err.message);
    }
  };
  

  const handleAgregarCambio = (campo, valor) => {
    setNuevoDemandante((prev) => ({ ...prev, [campo]: valor }));
  };

  const handleAgregar = async () => {
    if (!nuevoDemandante.nombre_demandante || !nuevoDemandante.identidad_demandante) {
      alert('Por favor, completa los campos requeridos para agregar un demandante.');
      return;
    }
  
    // Asegurarnos que proceso.num_registro existe y es válido
    if (!proceso || !proceso.num_registro) {
      alert('No se encontró el número de registro del proceso.');
      return;
    }
  
    const body = {
      action: 'addDemandante',
      num_registro: proceso.num_registro,
      nombre_demandante: nuevoDemandante.nombre_demandante,
      identidad_demandante: nuevoDemandante.identidad_demandante,
      poder: nuevoDemandante.poder || ''
    };
  
    console.log("Enviando al backend (agregar demandante):", body);
  
    try {
      const response = await fetch('https://appdajusticia.com/procesos.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
  
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
  
      // Recargar la lista
      await fetchDemandantes(proceso.num_registro);
  
      // Limpiar campos
      setNuevoDemandante({
        nombre_demandante: '',
        identidad_demandante: '',
        poder: '',
      });
    } catch (err) {
      console.error(err);
      alert('Error al agregar el demandante: ' + err.message);
    }
  };
  

  if (!proceso) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-contenido" onClick={(e) => e.stopPropagation()}>
        <h2>Demandantes del Proceso #{proceso.num_registro}</h2>

        {cargando && <p>Cargando demandantes...</p>}
        {error && <p className="error">{error}</p>}

        {!cargando && !error && demandantes.length > 0 ? (
          <div className="tabla-container">
            <table className="tabla-demandantes">
              <thead>
                <tr>
                  <th>N°</th>
                  <th>Nombre Completo</th>
                  <th>N° Identidad</th>
                  <th>Poder</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {demandantes.map((demandante, index) => {
                  const modoEdicion = enEdicion[index];
                  const valores = modoEdicion ? valoresEditados[index] : demandante;

                  return (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>
                        {modoEdicion ? (
                          <input
                            type="text"
                            value={valores.nombre_demandante || ''}
                            onChange={(e) =>
                              handleChange(index, 'nombre_demandante', e.target.value)
                            }
                          />
                        ) : (
                          demandante.nombre_demandante
                        )}
                      </td>
                      <td>
                        {modoEdicion ? (
                          <input
                            type="text"
                            value={valores.identidad_demandante || ''}
                            onChange={(e) =>
                              handleChange(index, 'identidad_demandante', e.target.value)
                            }
                          />
                        ) : (
                          demandante.identidad_demandante
                        )}
                      </td>
                      <td>
                        {modoEdicion ? (
                          <input
                            type="text"
                            value={valores.poder || ''}
                            onChange={(e) => handleChange(index, 'poder', e.target.value)}
                          />
                        ) : (
                          demandante.poder
                        )}
                      </td>
                      <td>
                        {modoEdicion ? (
                          <>
                            <button onClick={() => handleGuardar(index)}>Guardar</button>
                            <button onClick={() => handleCancelar(index)}>Cancelar</button>
                          </>
                        ) : (
                          <div className="acciones-botones">
                            <button className="btn-edit" onClick={() => handleEditar(index)}>
                              Editar
                            </button>
                            <button className="btn-delete" onClick={() => handleEliminar(index)}>
                              Eliminar
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {/* Fila para agregar un nuevo demandante */}
                <tr>
                  <td>Nuevo</td>
                  <td>
                    <input
                      type="text"
                      placeholder="Nombre"
                      value={nuevoDemandante.nombre_demandante}
                      onChange={(e) => handleAgregarCambio('nombre_demandante', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      placeholder="Identidad"
                      value={nuevoDemandante.identidad_demandante}
                      onChange={(e) => handleAgregarCambio('identidad_demandante', e.target.value)}
                    />
                  </td>
                  <td>
  <select
    value={nuevoDemandante.poder}
    onChange={(e) => handleAgregarCambio('poder', e.target.value)}
  >
    <option value="">Seleccione</option>
    <option value="SI">SI</option>
    <option value="NO">NO</option>
  </select>
</td>

                  <td>
                    <button onClick={handleAgregar}>Agregar</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          !cargando && !error && (
            <>
              <p>No se encontraron demandantes para este proceso.</p>
              <div className="agregar-nuevo-container">
                <h3>Agregar nuevo demandante:</h3>
                <input
                  type="text"
                  placeholder="Nombre"
                  value={nuevoDemandante.nombre_demandante}
                  onChange={(e) => handleAgregarCambio('nombre_demandante', e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Identidad"
                  value={nuevoDemandante.identidad_demandante}
                  onChange={(e) => handleAgregarCambio('identidad_demandante', e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Poder"
                  value={nuevoDemandante.poder}
                  onChange={(e) => handleAgregarCambio('poder', e.target.value)}
                />
                <button onClick={handleAgregar}>Agregar</button>
              </div>
            </>
          )
        )}

        <div className="botones-container">
          <button className="boton boton-cerrar" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default DemandantesModal;
