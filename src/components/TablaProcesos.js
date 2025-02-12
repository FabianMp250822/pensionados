import React, { useEffect, useState } from 'react';
import './TablaProcesos.css';
import DemandantesModal from './DemandantesModal';
import AnotacionesModal from './anotaciones';
import AnexosModal from './AnexosModal';

const TablaProcesos = ({ cedula }) => {
  const [procesos, setProcesos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [modalProceso, setModalProceso] = useState(null);
  const [enEdicion, setEnEdicion] = useState({});
  const [valoresEditados, setValoresEditados] = useState({});
  const [modalAnotaciones, setModalAnotaciones] = useState(null);
  const [modalAnexos, setModalAnexos] = useState(null);

  // Estado para la cédula ingresada manualmente
  const [cedulaManual, setCedulaManual] = useState('');

  // Si se recibe una cédula vía contexto, se ejecuta la búsqueda automáticamente.
  useEffect(() => {
    if (cedula) {
      handleBuscar(cedula);
    }
  }, [cedula]);

  const handleBuscar = async (cedulaBuscar) => {
    if (!cedulaBuscar) return;

    setCargando(true);
    setError(null);

    try {
      const response = await fetch(`https://appdajusticia.com/procesos.php?cedula=${cedulaBuscar}`);
      if (!response.ok) {
        throw new Error('Error en la respuesta del servidor');
      }
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setProcesos(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Ocurrió un error al cargar los datos.');
    } finally {
      setCargando(false);
    }
  };

  const handleEditar = (num_registro) => {
    const proceso = procesos.find(p => p.num_registro === num_registro);
    if (proceso) {
      setValoresEditados(prev => ({
        ...prev,
        [num_registro]: { ...proceso }
      }));
      setEnEdicion(prev => ({ ...prev, [num_registro]: true }));
    }
  };

  const handleCancelar = (num_registro) => {
    setEnEdicion(prev => {
      const copia = { ...prev };
      delete copia[num_registro];
      return copia;
    });
    setValoresEditados(prev => {
      const copia = { ...prev };
      delete copia[num_registro];
      return copia;
    });
  };

  const handleChange = (num_registro, campo, valor) => {
    setValoresEditados(prev => ({
      ...prev,
      [num_registro]: {
        ...prev[num_registro],
        [campo]: valor,
      },
    }));
  };

  const handleGuardar = async (num_registro) => {
    const cambios = valoresEditados[num_registro];
    if (!num_registro || !cambios || Object.keys(cambios).length === 0) {
      console.error("Datos incompletos para guardar", { num_registro, cambios });
      alert("No hay cambios válidos para guardar.");
      return;
    }
  
    console.log("Datos enviados al servidor:", { num_registro, cambios });
  
    try {
      const response = await fetch('https://appdajusticia.com/procesos.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ num_registro, cambios }),
      });
  
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
  
      setProcesos(prev =>
        prev.map(proc =>
          proc.num_registro === num_registro ? { ...proc, ...cambios } : proc
        )
      );
      handleCancelar(num_registro);
    } catch (err) {
      console.error(err);
      alert("Error al guardar los cambios: " + err.message);
    }
  };

  const handleVerDemandantes = (proceso) => {
    setModalProceso(proceso);
  };

  const handleCloseModal = () => {
    setModalProceso(null);
  };

  const handleVerAnotaciones = (numRegistro) => {
    setModalAnotaciones(numRegistro);
  };

  const handleCloseAnotacionesModal = () => {
    setModalAnotaciones(null);
  };

  const handleVerAnexos = (numRegistro) => {
    setModalAnexos(numRegistro);
  };

  const handleCloseAnexosModal = () => {
    setModalAnexos(null);
  };

  return (
    <div className="tabla-procesos-contenedor">
      {/* Búsqueda manual: el input y el botón siempre se muestran */}
      <div className="buscador">
        <div></div>
        <div></div>
        <div className="buscador-input">
          <input 
            type="text" 
            placeholder="Ingrese cédula" 
            value={cedulaManual} 
            onChange={(e) => setCedulaManual(e.target.value)}
          />
        </div>
        <div className="buscador-boton">
          <button onClick={() => handleBuscar(cedulaManual)}>Buscar</button>
        </div>
      </div>

      {/* El título varía según se reciba o no la cédula */}
      <h1 className="titulo">
        {cedula ? `Procesos para el cliente ${cedula}` : 'Consulta de Procesos'}
      </h1>

      {cargando && <p>Cargando datos...</p>}
      {error && <p className="error">{error}</p>}

      {(!cargando && procesos.length > 0) ? (
        <div className="procesos-container">
          {procesos.map((proceso) => {
            const modoEdicion = enEdicion[proceso.num_registro];
            const valores = modoEdicion ? (valoresEditados[proceso.num_registro] || {}) : proceso;

            return (
              <div key={proceso.num_registro} className="proceso-card">
                <h2 className="proceso-header">Proceso #{proceso.num_registro}</h2>
                <div className="proceso-detalle">
                  <div>
                    <strong>Fecha Creación:</strong>
                    {modoEdicion ? (
                      <input 
                        value={valores.fecha_creacion || ''} 
                        onChange={(e) => handleChange(proceso.num_registro, 'fecha_creacion', e.target.value)}
                      />
                    ) : (
                      proceso.fecha_creacion
                    )}
                  </div>
                  {/* Aquí se pueden agregar el resto de los campos */}
                </div>
                <div className="botones-container">
                  <button
                    className="boton boton-ver-demandantes"
                    onClick={() => handleVerDemandantes(proceso)}
                  >
                    Ver Demandantes
                  </button>
                  <button
                    className="boton boton-ver-anotaciones"
                    onClick={() => handleVerAnotaciones(proceso.num_registro)}
                  >
                    Anotaciones
                  </button>
                  <button
                    className="boton boton-ver-anexos"
                    onClick={() => handleVerAnexos(proceso.num_registro)}
                  >
                    Anexos
                  </button>
                  {modoEdicion ? (
                    <>
                      <button className="boton boton-guardar" onClick={() => handleGuardar(proceso.num_registro)}>Guardar</button>
                      <button className="boton boton-cancelar" onClick={() => handleCancelar(proceso.num_registro)}>Cancelar</button>
                    </>
                  ) : (
                    <button className="boton boton-editar" onClick={() => handleEditar(proceso.num_registro)}>Editar</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // Si no se encontraron procesos y se recibió la cédula, se muestra el bloque "no-procesos"
        !cargando && cedula && (
          <div className="no-procesos">
            <p>El cliente no tiene procesos en Prometheus. ¿Desea crear uno?</p>
            <button
              className="boton boton-crear-proceso"
              onClick={() => alert('Función para crear un proceso')}
            >
              Crear Proceso
            </button>
          </div>
        )
      )}

      {modalProceso && (
        <DemandantesModal proceso={modalProceso} onClose={handleCloseModal} />
      )}
      {modalAnotaciones && (
        <AnotacionesModal numRegistro={modalAnotaciones} onClose={handleCloseAnotacionesModal} />
      )}
      {modalAnexos && (
        <AnexosModal numRegistro={modalAnexos} onClose={handleCloseAnexosModal} />
      )}
    </div>
  );
};

export default TablaProcesos;
