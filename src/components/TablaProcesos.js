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

  // Estados para la búsqueda manual
  const [cedulaManual, setCedulaManual] = useState('');
  const [nombreManual, setNombreManual] = useState('');
  // Estados para las sugerencias del nombre
  const [sugerenciasNombre, setSugerenciasNombre] = useState([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);

  // Si se recibe una cédula vía props, se ejecuta la búsqueda automáticamente.
  useEffect(() => {
    if (cedula) {
      handleBuscar(cedula);
    }
  }, [cedula]);

  // Búsqueda por cédula
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
      if (data.error) throw new Error(data.error);
      setProcesos(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Ocurrió un error al cargar los datos.');
    } finally {
      setCargando(false);
    }
  };

  // Función para buscar sugerencias de nombres (se activa a partir de 4 caracteres)
  const handleBuscarSugerencias = async (valor) => {
    if (valor.length < 4) {
      setSugerenciasNombre([]);
      setMostrarSugerencias(false);
      return;
    }
    try {
      const response = await fetch(`https://appdajusticia.com/procesos.php?nombre=${valor}`);
      if (!response.ok) {
        throw new Error('Error en la respuesta del servidor');
      }
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      // Extraer nombres únicos del campo "nombres_demandante"
      const nombresUnicos = [
        ...new Set(
          data
            .map((proceso) => proceso.nombres_demandante)
            .filter((nombre) => nombre && nombre.trim() !== '')
        ),
      ];
      setSugerenciasNombre(nombresUnicos);
      setMostrarSugerencias(true);
    } catch (err) {
      console.error(err);
    }
  };

  // Función para obtener procesos al seleccionar un nombre de la lista de sugerencias
  const fetchProcessesByName = async (nombre) => {
    setCargando(true);
    setError(null);
    try {
      const response = await fetch(`https://appdajusticia.com/procesos.php?nombre=${nombre}`);
      if (!response.ok) {
        throw new Error('Error en la respuesta del servidor');
      }
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setProcesos(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  // Al seleccionar una sugerencia, se actualiza el input y se realiza la búsqueda
  const handleSeleccionarSugerencia = (nombreSeleccionado) => {
    setNombreManual(nombreSeleccionado);
    setMostrarSugerencias(false);
    fetchProcessesByName(nombreSeleccionado);
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
    try {
      const response = await fetch('https://appdajusticia.com/procesos.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ num_registro, cambios, action: 'updateProceso' }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
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

  // Función auxiliar para renderizar cada campo: input en edición o span en modo normal
  const renderCampo = (proceso, modoEdicion, campo) => {
    const valores = modoEdicion ? (valoresEditados[proceso.num_registro] || {}) : proceso;
    return modoEdicion ? (
      <input
        type="text"
        value={valores[campo] || ''}
        onChange={(e) => handleChange(proceso.num_registro, campo, e.target.value)}
      />
    ) : (
      <span>{proceso[campo] || ''}</span>
    );
  };

  return (
    <div className="tabla-procesos-contenedor">
      {/* Buscador: dos inputs lado a lado */}
      <div id="buscador-container" className="buscador">
  <div className="buscador-input">
    <input 
      type="text" 
      placeholder="Ingrese cédula" 
      value={cedulaManual} 
      onChange={(e) => setCedulaManual(e.target.value)}
    />
  </div>
  <div className="buscador-input" style={{ position: 'relative' }}>
    <input 
      type="text" 
      placeholder="Ingrese nombre" 
      value={nombreManual} 
      onChange={(e) => {
        const valor = e.target.value;
        setNombreManual(valor);
        handleBuscarSugerencias(valor);
      }}
    />
    {mostrarSugerencias && sugerenciasNombre.length > 0 && (
      <ul className="sugerencias-lista" style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        background: '#fff',
        border: '1px solid #ccc',
        zIndex: 10,
        listStyle: 'none',
        margin: 0,
        padding: 0,
        maxHeight: '150px',
        overflowY: 'auto'
      }}>
        {sugerenciasNombre.map((nombre, index) => (
          <li 
            key={index} 
            onClick={() => handleSeleccionarSugerencia(nombre)}
            style={{ padding: '5px 10px', cursor: 'pointer' }}
          >
            {nombre}
          </li>
        ))}
      </ul>
    )}
  </div>
  <div className="buscador-boton">
    <button onClick={() => handleBuscar(cedulaManual)}>Buscar por cédula</button>
  </div>
</div>


      <h1 className="titulo">
        {cedula ? `Procesos para el cliente ${cedula}` : 'Consulta de Procesos'}
      </h1>

      {cargando && <p>Cargando datos...</p>}
      {error && <p className="error">{error}</p>}

      {(!cargando && procesos.length > 0) ? (
        <div className="procesos-container">
          {procesos.map((proceso) => {
            const modoEdicion = enEdicion[proceso.num_registro] || false;
            return (
              <div key={proceso.num_registro} className="proceso-card">
                <h2 className="proceso-header">Proceso #{proceso.num_registro}</h2>
                <div className="datos-proceso">
                  <div className="dato">
                    <label>N° REGISTRO:</label>
                    {renderCampo(proceso, modoEdicion, 'num_registro')}
                  </div>
                  <div className="dato">
                    <label>FECHA DE CREACIÓN:</label>
                    {renderCampo(proceso, modoEdicion, 'fecha_creacion')}
                  </div>
                  <div className="dato">
                    <label>N° CARPETA 1:</label>
                    {renderCampo(proceso, modoEdicion, 'num_carpeta')}
                  </div>
                  <div className="dato">
                    <label>N° CARPETA 2:</label>
                    {renderCampo(proceso, modoEdicion, 'num_carpeta2')}
                  </div>
                  <div className="dato">
                    <label>DESPACHO:</label>
                    {renderCampo(proceso, modoEdicion, 'despacho')}
                  </div>
                  <div className="dato">
                    <label>N° RADICADO INICIAL:</label>
                    {renderCampo(proceso, modoEdicion, 'num_radicado_ini')}
                  </div>
                  <div className="dato">
                    <label>FECHA RADICADO INICIAL:</label>
                    {renderCampo(proceso, modoEdicion, 'fecha_radicado_ini')}
                  </div>
                  <div className="dato">
                    <label>RADICADO TRIBUNAL:</label>
                    {renderCampo(proceso, modoEdicion, 'radicado_tribunal')}
                  </div>
                  <div className="dato">
                    <label>MAGISTRADO:</label>
                    {renderCampo(proceso, modoEdicion, 'magistrado')}
                  </div>
                  <div className="dato">
                    <label>JURISDICCIÓN:</label>
                    {renderCampo(proceso, modoEdicion, 'jurisdiccion')}
                  </div>
                  <div className="dato">
                    <label>CLASE PROCESO:</label>
                    {renderCampo(proceso, modoEdicion, 'clase_proceso')}
                  </div>
                  <div className="dato">
                    <label>ESTADO:</label>
                    {renderCampo(proceso, modoEdicion, 'estado')}
                  </div>
                  <div className="dato">
                    <label>SENTENCIA JUZGADO:</label>
                    {renderCampo(proceso, modoEdicion, 'sentencia_juzgado')}
                  </div>
                  <div className="dato">
                    <label>SENTENCIA TRIBUNAL:</label>
                    {renderCampo(proceso, modoEdicion, 'sentencia_tribunal')}
                  </div>
                  <div className="dato">
                    <label>NOMBRES DEMANDANTE:</label>
                    {renderCampo(proceso, modoEdicion, 'nombres_demandante')}
                  </div>
                  <div className="dato">
                    <label>NOMBRES DEMANDADO:</label>
                    {renderCampo(proceso, modoEdicion, 'nombres_demandado')}
                  </div>
                  <div className="dato">
                    <label>NEGOCIO:</label>
                    {renderCampo(proceso, modoEdicion, 'negocio')}
                  </div>
                  <div className="dato">
                    <label>NOMBRES APODERADO:</label>
                    {renderCampo(proceso, modoEdicion, 'nombres_apoderado')}
                  </div>
                  <div className="dato">
                    <label>N° RADICADO FINAL:</label>
                    {renderCampo(proceso, modoEdicion, 'num_radicado_ult')}
                  </div>
                  <div className="dato">
                    <label>RADICADO CORTE:</label>
                    {renderCampo(proceso, modoEdicion, 'radicado_corte')}
                  </div>
                  <div className="dato">
                    <label>MAGISTRADO CORTE:</label>
                    {renderCampo(proceso, modoEdicion, 'magistrado_corte')}
                  </div>
                  <div className="dato">
                    <label>CASACIÓN:</label>
                    {renderCampo(proceso, modoEdicion, 'casacion')}
                  </div>
                  <div className="dato">
                    <label>DESCRIPCIÓN:</label>
                    {renderCampo(proceso, modoEdicion, 'descripcion')}
                  </div>
                </div>
                <div id="botones-container" className="botones-container">
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
                  {enEdicion[proceso.num_registro] ? (
                    <>
                      <button
                        className="boton boton-guardar"
                        onClick={() => handleGuardar(proceso.num_registro)}
                      >
                        Guardar
                      </button>
                      <button
                        className="boton boton-cancelar"
                        onClick={() => handleCancelar(proceso.num_registro)}
                      >
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <button
                      className="boton boton-editar"
                      onClick={() => handleEditar(proceso.num_registro)}
                    >
                      Editar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
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

      {/* Modales */}
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
