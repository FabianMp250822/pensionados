import React, { useEffect, useState } from 'react';

const AnexosModal = ({ numRegistro, onClose }) => {
  const [anexos, setAnexos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [anexosFiltrados, setAnexosFiltrados] = useState([]);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Datos para agregar un nuevo anexo
  const [formDataAdd, setFormDataAdd] = useState({
    auto: '',
    fecha_documento: '',
    descripccion: '',
    tipo_archivo: '',
    archivo: null,
  });

  // Datos para editar un anexo existente
  const [formDataEdit, setFormDataEdit] = useState({
    auto: '',
    tipo_archivo: '',
    descripccion: '',
    archivo: null, // Opcional, solo si se quiere reemplazar
  });

  useEffect(() => {
    if (numRegistro) {
      fetchAnexos(numRegistro);
    }
  }, [numRegistro]);

  useEffect(() => {
    setAnexosFiltrados(
      anexos.filter((anexo) =>
        anexo.nombre_documento.toLowerCase().includes(busqueda.toLowerCase())
      )
    );
  }, [busqueda, anexos]);

  const fetchAnexos = async (numRegistro) => {
    setCargando(true);
    setError(null);
    try {
      const response = await fetch(
        `https://appdajusticia.com/crud_anexos.php?num_registro=${numRegistro}`
      );
      if (!response.ok) {
        throw new Error('Error al obtener anexos del servidor');
      }
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setAnexos(data);
      setAnexosFiltrados(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Ocurrió un error al cargar los anexos.');
    } finally {
      setCargando(false);
    }
  };

  const handleAddFormChange = (e) => {
    const { name, value } = e.target;
    setFormDataAdd({ ...formDataAdd, [name]: value });
  };

  const handleAddFileChange = (e) => {
    setFormDataAdd({ ...formDataAdd, archivo: e.target.files[0] });
  };

  const handleAddSubmit = async () => {
    if (!formDataAdd.archivo) {
      alert('Por favor, selecciona un archivo.');
      return;
    }

    const dataToSend = new FormData();
    dataToSend.append('action', 'addAnexo');
    dataToSend.append('num_registro', numRegistro);
    dataToSend.append('auto', formDataAdd.auto);
    dataToSend.append('fecha_documento', formDataAdd.fecha_documento);
    dataToSend.append('descripccion', formDataAdd.descripccion);
    dataToSend.append('tipo_archivo', formDataAdd.tipo_archivo);
    dataToSend.append('archivo_adjunto', formDataAdd.archivo);

    try {
      const response = await fetch('https://appdajusticia.com/crud_anexos.php', {
        method: 'POST',
        body: dataToSend,
      });

      const result = await response.json();
      if (result.success) {
        alert('Archivo subido correctamente.');
        setShowUploadModal(false);
        fetchAnexos(numRegistro);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error al enviar los datos:', error);
      alert('Error inesperado al enviar los datos.');
    }
  };

  const handleEditClick = (anexo) => {
    // Pre-cargar el formulario de edición con los datos del anexo seleccionado
    setFormDataEdit({
      auto: anexo.auto,
      tipo_archivo: anexo.tipo_archivo || '',
      descripccion: anexo.descripccion || '',
      archivo: null,
    });
    setShowEditModal(true);
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setFormDataEdit({ ...formDataEdit, [name]: value });
  };

  const handleEditFileChange = (e) => {
    setFormDataEdit({ ...formDataEdit, archivo: e.target.files[0] });
  };

  const handleEditSubmit = async () => {
    if (!formDataEdit.auto) {
      alert('No se identificó el anexo a editar');
      return;
    }

    const dataToSend = new FormData();
    dataToSend.append('action', 'editAnexo');
    dataToSend.append('auto', formDataEdit.auto);
    dataToSend.append('tipo_archivo', formDataEdit.tipo_archivo);
    dataToSend.append('descripccion', formDataEdit.descripccion);
    // El archivo es opcional. Solo se adjunta si se seleccionó uno nuevo.
    if (formDataEdit.archivo) {
      dataToSend.append('archivo_adjunto', formDataEdit.archivo);
      dataToSend.append('num_registro', numRegistro);
    }

    try {
      const response = await fetch('https://appdajusticia.com/crud_anexos.php', {
        method: 'POST',
        body: dataToSend,
      });

      const result = await response.json();
      if (result.success) {
        alert('Anexo actualizado correctamente.');
        setShowEditModal(false);
        fetchAnexos(numRegistro);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error al actualizar el anexo:', error);
      alert('Error inesperado al actualizar el anexo.');
    }
  };

  const handleEliminarAnexo = async (auto) => {
    const confirmacion = window.confirm(
      '¿Estás seguro de que deseas eliminar este anexo? Esta acción no se puede deshacer.'
    );
    if (!confirmacion) return;

    try {
      const formData = new FormData();
      formData.append('action', 'deleteAnexo');
      formData.append('auto', auto);

      const response = await fetch(
        'https://appdajusticia.com/crud_anexos.php',
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await response.json();
      if (data.success) {
        alert('Anexo eliminado correctamente.');
        fetchAnexos(numRegistro);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error al eliminar el anexo:', error);
      alert('Error inesperado al eliminar el anexo.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-contenido" onClick={(e) => e.stopPropagation()}>
        <h2>Anexos del Proceso #{numRegistro}</h2>

        {cargando && <p>Cargando anexos...</p>}
        {error && <p className="error">{error}</p>}

        {!cargando && !error && (
          <>
            <div className="botones-superiores">
              <button
                className="boton boton-nueva"
                onClick={() => setShowUploadModal(true)}
              >
                Subir Nuevo Anexo
              </button>
              <input
                type="text"
                placeholder="Buscar anexo..."
                className="campo-busqueda"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            {anexosFiltrados.length > 0 ? (
              <div className="tabla-container">
                <table className="tabla-anexos" style={{ borderCollapse: 'collapse', width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={{ border: '1px solid black', padding: '8px' }}>#</th>
                      <th style={{ border: '1px solid black', padding: '8px' }}>Auto</th>
                      <th style={{ border: '1px solid black', padding: '8px' }}>Nombre del Documento</th>
                      <th style={{ border: '1px solid black', padding: '8px' }}>Descripción</th>
                      <th style={{ border: '1px solid black', padding: '8px' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {anexosFiltrados.map((anexo, index) => (
                      <tr key={anexo.auto}>
                        <td style={{ border: '1px solid black', padding: '8px' }}>{index + 1}</td>
                        <td style={{ border: '1px solid black', padding: '8px' }}>{anexo.auto}</td>
                        <td style={{ border: '1px solid black', padding: '8px' }}>
                          <a
                            href={`https://appdajusticia.com/${anexo.ruta_archivo}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="documento-link"
                          >
                            {anexo.nombre_documento}
                          </a>
                        </td>
                        <td style={{ border: '1px solid black', padding: '8px' }}>{anexo.descripccion}</td>
                        <td style={{ border: '1px solid black', padding: '8px' }}>
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                              style={{
                                backgroundColor: '#007bff',
                                color: 'white',
                                border: 'none',
                                padding: '5px 10px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                              }}
                              onClick={() =>
                                window.open(
                                  `https://appdajusticia.com/${anexo.ruta_archivo}`,
                                  '_blank'
                                )
                              }
                            >
                              Ver
                            </button>
                            <button
                              style={{
                                backgroundColor: '#28a745',
                                color: 'white',
                                border: 'none',
                                padding: '5px 10px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                              }}
                              onClick={() => handleEditClick(anexo)}
                            >
                              Actualizar
                            </button>
                            <button
                              style={{
                                backgroundColor: '#dc3545',
                                color: 'white',
                                border: 'none',
                                padding: '5px 10px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                              }}
                              onClick={() => handleEliminarAnexo(anexo.auto)}
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
            ) : (
              <p>No se encontraron anexos que coincidan con la búsqueda.</p>
            )}
          </>
        )}

        <div className="botones-container">
          <button className="boton boton-cerrar" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>

      {/* Modal para subir un nuevo anexo */}
      {showUploadModal && (
        <div className="modal-overlay">
          <div className="modal-contenido" onClick={(e) => e.stopPropagation()}>
            <h3>Subir Nuevo Anexo</h3>
            <div>
              <label>Auto:</label>
              <input
                type="text"
                name="auto"
                value={formDataAdd.auto}
                onChange={handleAddFormChange}
              />
            </div>
            <div>
              <label>Fecha Documento:</label>
              <input
                type="text"
                name="fecha_documento"
                value={formDataAdd.fecha_documento}
                onChange={handleAddFormChange}
              />
            </div>
            <div>
              <label>Descripción:</label>
              <input
                type="text"
                name="descripccion"
                value={formDataAdd.descripccion}
                onChange={handleAddFormChange}
              />
            </div>
            <div>
              <label>Tipo Archivo:</label>
              <input
                type="text"
                name="tipo_archivo"
                value={formDataAdd.tipo_archivo}
                onChange={handleAddFormChange}
              />
            </div>
            <div>
              <label>Archivo:</label>
              <input type="file" onChange={handleAddFileChange} />
            </div>
            <button onClick={handleAddSubmit}>Subir</button>
            <button onClick={() => setShowUploadModal(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Modal para editar un anexo existente */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-contenido" onClick={(e) => e.stopPropagation()}>
            <h3>Actualizar Anexo</h3>
            <div>
              <label>Tipo Archivo:</label>
              <input
                type="text"
                name="tipo_archivo"
                value={formDataEdit.tipo_archivo}
                onChange={handleEditFormChange}
              />
            </div>
            <div>
              <label>Descripción:</label>
              <input
                type="text"
                name="descripccion"
                value={formDataEdit.descripccion}
                onChange={handleEditFormChange}
              />
            </div>
            <div>
              <label>Reemplazar Archivo (opcional):</label>
              <input type="file" onChange={handleEditFileChange} />
            </div>
            <button onClick={handleEditSubmit}>Actualizar</button>
            <button onClick={() => setShowEditModal(false)}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnexosModal;
