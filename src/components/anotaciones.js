import React, { useEffect, useState } from 'react';
import './AnotacionesModal.css';
import NuevaAnotacionModal from './NuevaAnotacionModal';

const AnotacionesModal = ({ numRegistro, onClose }) => {
  const [anotaciones, setAnotaciones] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [anotacionesFiltradas, setAnotacionesFiltradas] = useState([]);
  const [mostrarNuevoModal, setMostrarNuevoModal] = useState(false);
  const [anotacionParaEditar, setAnotacionParaEditar] = useState(null);

  useEffect(() => {
    if (numRegistro) {
      fetchAnotaciones(numRegistro);
    }
  }, [numRegistro]);

  useEffect(() => {
    // Filtrar anotaciones según el término de búsqueda
    setAnotacionesFiltradas(
      anotaciones.filter((anotacion) =>
        anotacion.detalle.toLowerCase().includes(busqueda.toLowerCase())
      )
    );
  }, [busqueda, anotaciones]);

  const fetchAnotaciones = async (numRegistro) => {
    setCargando(true);
    setError(null);
    try {
      const response = await fetch(`https://appdajusticia.com/anotaciones.php?num_registro=${numRegistro}`);
      if (!response.ok) {
        throw new Error('Error al obtener anotaciones del servidor');
      }
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      // Corregir y transformar las anotaciones
      const anotacionesCorregidas = data.map((anotacion) => ({
        ...anotacion,
        fecha: transformarFecha(anotacion.fecha),
        fecha_limite: transformarFecha(anotacion.fecha_limite),
        detalle: corregirTexto(anotacion.detalle),
        archivo_url: anadirPrefijoRuta(anotacion.archivo_url),
      }));

      // Ordenar las anotaciones
      anotacionesCorregidas.sort((a, b) => {
        const fechaA = convertirAFormatoOrdenable(a.fecha); // `YYYY-MM-DD`
        const fechaB = convertirAFormatoOrdenable(b.fecha); // `YYYY-MM-DD`

        if (fechaA < fechaB) return -1;
        if (fechaA > fechaB) return 1;

        // Si las fechas son iguales, ordenar por hora_limite
        const horaA = convertirHoraLimite(a.hora_limite);
        const horaB = convertirHoraLimite(b.hora_limite);

        if (horaA < horaB) return -1;
        if (horaA > horaB) return 1;

        return 0;
      });

      setAnotaciones(anotacionesCorregidas);
      setAnotacionesFiltradas(anotacionesCorregidas); // Inicialmente no hay filtro
    } catch (err) {
      console.error(err);
      setError(err.message || 'Ocurrió un error al cargar las anotaciones.');
    } finally {
      setCargando(false);
    }
  };

  const convertirHoraLimite = (hora) => {
    if (!hora) return '00:00';
    
    const [time, modifier] = hora.toLowerCase().split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    
    if (modifier === 'pm' && hours !== 12) {
      hours += 12;
    }
    if (modifier === 'am' && hours === 12) {
      hours = 0;
    }
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const anadirPrefijoRuta = (ruta) => {
    if (!ruta) return null;
    const baseUrl = 'https://appdajusticia.com/private/';
    
    // Verificar si la ruta ya contiene el prefijo
    if (ruta.startsWith(baseUrl)) {
      return ruta; // Retornar la ruta sin modificar
    }
  
    // Si la ruta no contiene el prefijo, agregarlo
    return `${baseUrl}${ruta.replace(/^\/?informes2/, 'informes2')}`; 
  };

  const transformarFecha = (fecha) => {
    if (!fecha) return null;
    const partes = fecha.split('-');
    if (partes.length === 3) {
      let [dia, mes, año] = partes;
      if (año.length === 4 && parseInt(año) < 1900) {
        año = `20${año.slice(-2)}`; // Convertir 0017 -> 2017
      } else if (año.length === 4 && parseInt(año) < 2000) {
        año = `20${año.slice(-2)}`; // Convertir 0006 -> 2006
      }
      return `${dia}-${mes}-${año}`; // Mantener formato `DD-MM-YYYY`
    }
    return fecha;
  };

  const convertirAFormatoOrdenable = (fecha) => {
    if (!fecha) return '';
    const partes = fecha.split('-');
    if (partes.length === 3) {
      const [dia, mes, año] = partes;
      return `${año}-${mes}-${dia}`; // Convertir temporalmente a `YYYY-MM-DD` para comparar
    }
    return '';
  };

  const corregirTexto = (texto) => {
    if (!texto) return '';
    return texto
      .replace(/Ã³/g, 'ó')
      .replace(/Ã±/g, 'ñ')
      .replace(/Ã/g, 'í')
      .replace(/í¡/g, 'á')
      .replace(/Âª/g, 'ª')
      .replace(/í©/g, 'é')
      .replace(/íº/g, 'ú')
      .replace(/Â°/g, 'ª')
      .replace(/Âº/g, 'ª')
      .replace(/Â°/g, 'ª');
  };

  const handleAdjuntarArchivo = async (auto) => {
    const input = document.createElement("input");
    input.type = "file";
  
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
  
      const formData = new FormData();
      formData.append("action", "attachFile");
      formData.append("auto", auto); // ID único de la anotación
      formData.append("archivo_adjunto", file);
  
      try {
        const response = await fetch("https://appdajusticia.com/anotaciones.php", {
          method: "POST",
          body: formData,
        });
  
        const data = await response.json();
        if (data.success) {
          alert("Archivo adjuntado correctamente.");
          fetchAnotaciones(numRegistro); // Recargar anotaciones para reflejar el cambio
        } else {
          alert(`Error: ${data.error}`);
        }
      } catch (error) {
        console.error("Error al adjuntar el archivo:", error);
        alert("Error inesperado al adjuntar el archivo.");
      }
    };
  
    input.click(); // Simular clic para abrir el selector de archivos
  };

  const handleEditarAnotacion = (anotacion) => {
    setAnotacionParaEditar(anotacion); // Guardar la anotación para editar
    setMostrarNuevoModal(true); // Abrir el modal
  };

  const handleNuevaAnotacion = () => {
    setMostrarNuevoModal(true);
  };

  if (!numRegistro) return null;

  const cerrarNuevoModal = () => {
    setMostrarNuevoModal(false);
    setAnotacionParaEditar(null); // Limpiar la anotación seleccionada
    fetchAnotaciones(numRegistro); // Recargar las anotaciones después de agregar/editar
  };

  const handleEliminarAnotacion = async (auto) => {
    const confirmacion = window.confirm(
      '¿Estás seguro de que deseas eliminar esta anotación? Esta acción no se puede deshacer.'
    );

    if (!confirmacion) return; // Si el usuario cancela, salir de la función

    try {
      // Enviar datos al backend
      const formData = new FormData();
      formData.append('action', 'deleteAnotacion');
      formData.append('auto', auto); // ID único de la anotación
      formData.append('num_registro', numRegistro);

      const response = await fetch('https://appdajusticia.com/anotaciones.php', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        alert('Anotación eliminada correctamente.');
        fetchAnotaciones(numRegistro); // Recargar las anotaciones
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error al eliminar la anotación:', error);
      alert('Error inesperado al eliminar la anotación.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-contenido" onClick={(e) => e.stopPropagation()}>
        <h2>Anotaciones del Proceso #{numRegistro}</h2>

        {cargando && <p>Cargando anotaciones...</p>}
        {error && <p className="error">{error}</p>}

        {!cargando && !error && (
          <>
            <div className="botones-superiores">
              <button className="boton boton-nueva" onClick={handleNuevaAnotacion}>
                Agregar Nueva Anotación
              </button>
              <input
                type="text"
                placeholder="Buscar anotación..."
                className="campo-busqueda"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            {anotacionesFiltradas.length > 0 ? (
              <div className="tabla-container">
                <table className="tabla-anotaciones">
                  <thead>
                    <tr>
                      <th>N°</th>
                      <th style={{ width: '20%' }}>Fecha Actuación</th>
                      <th>Detalle</th>
                      <th>Clase</th>
                      <th style={{ width: '20%' }}>Fecha Límite</th>
                      <th>Hora Límite</th>
                      <th>Documento</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {anotacionesFiltradas.map((anotacion, index) => (
                      <tr key={anotacion.auto}>
                        <td>{index + 1}</td>
                        <td>{anotacion.fecha || '-'}</td>
                        <td>{anotacion.detalle}</td>
                        <td>{anotacion.clase}</td>
                        <td>{anotacion.fecha_limite || '-'}</td>
                        <td>{anotacion.hora_limite || '-'}</td>
                        <td>
                          {anotacion.nombre_documento ? (
                            <a
                              href={anotacion.archivo_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="documento-link"
                            >
                              Ver Documento
                            </a>
                          ) : (
                            <button
                              className="boton-adjuntar"
                              style={{
                                backgroundColor: "#28a745",
                                color: "white",
                                border: "none",
                                padding: "5px 10px",
                                borderRadius: "4px",
                                cursor: "pointer",
                              }}
                              onClick={() => handleAdjuntarArchivo(anotacion.auto)}
                            >
                              Adjuntar
                            </button>
                          )}
                        </td>
                        <td>
                          <button
                            style={{
                              backgroundColor: '#007bff',
                              color: 'white',
                              border: 'none',
                              padding: '5px 10px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              marginRight: '10px',
                            }}
                            onClick={() => handleEditarAnotacion(anotacion)}
                          >
                            Editar
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
                            onClick={() => handleEliminarAnotacion(anotacion.auto)}
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>No se encontraron anotaciones que coincidan con la búsqueda.</p>
            )}
          </>
        )}

        <div className="botones-container">
          <button className="boton boton-cerrar" onClick={onClose}>
            Cerrar
          </button>
        </div>
        {mostrarNuevoModal && (
          <NuevaAnotacionModal
            numRegistro={numRegistro}
            onClose={cerrarNuevoModal}
            anotacion={anotacionParaEditar}
          />
        )}
      </div>
    </div>
  );
};

export default AnotacionesModal;
