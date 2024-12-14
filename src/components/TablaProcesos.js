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
  useEffect(() => {
    if (cedula) {
      handleBuscar(cedula);
    }
  }, [cedula]);

  const handleBuscar = async (cedulaBuscar) => {
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
    setValoresEditados((prev) => ({
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
        body: JSON.stringify({ num_registro, cambios }), // Enviar num_registro en lugar de id
      });
  
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
  
      setProcesos((prev) =>
        prev.map((proc) =>
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
    setModalProceso(proceso); // Abrir el modal con el proceso seleccionado
  };

  const handleCloseModal = () => {
    setModalProceso(null); // Cerrar el modal
  };


  const handleVerAnotaciones = (numRegistro) => {
    setModalAnotaciones(numRegistro); // Abrir el modal de anotaciones con el número de registro
  };

  

  const handleCloseAnotacionesModal = () => {
    setModalAnotaciones(null); // Cerrar el modal de anotaciones
  };

  const handleVerAnexos = (numRegistro) => {
    setModalAnexos(numRegistro); // Abrir el modal de anexos con el número de registro
  };

  const handleCloseAnexosModal = () => {
    setModalAnexos(null); // Cerrar el modal de anexos
  };
  return (
    <div className="tabla-procesos-contenedor">
      <h1 className="titulo">Procesos para el cliente {cedula}</h1>

      {cargando && <p>Cargando datos...</p>}
      {error && <p className="error">{error}</p>}

      {!cargando && procesos.length > 0 ? (
        <div className="procesos-container">
          {procesos.map((proceso) => {
            const modoEdicion = enEdicion[proceso.num_registro];
            const valores = modoEdicion ? valoresEditados[proceso.num_registro] || {} : proceso;

            return (
              <div key={proceso.num_registro} className="proceso-card">
                <h2 className="proceso-header">Proceso #{proceso.num_registro}</h2>
                <div className="proceso-detalle">
                  <div>
                    <strong>Fecha Creación:</strong>
                    {modoEdicion ? 
                      <input 
                        value={valores.fecha_creacion || ''} 
                        onChange={(e) => handleChange(proceso.num_registro, 'fecha_creacion', e.target.value)}
                      /> 
                      : proceso.fecha_creacion}
                  </div>
                  <div>
                    <strong># Carpeta:</strong>
                    {modoEdicion ?
                      <input
                        value={valores.num_carpeta || ''}
                        onChange={(e) => handleChange(proceso.num_registro, 'num_carpeta', e.target.value)}
                      />
                      : proceso.num_carpeta}
                  </div>
                  <div>
                    <strong># Carpeta 2:</strong>
                    {modoEdicion ?
                      <input
                        value={valores.num_carpeta2 || ''}
                        onChange={(e) => handleChange(proceso.num_registro, 'num_carpeta2', e.target.value)}
                      />
                      : proceso.num_carpeta2}
                  </div>
                  <div>
                    <strong>Despacho:</strong>
                    {modoEdicion ?
                      <input
                        value={valores.despacho || ''}
                        onChange={(e) => handleChange(proceso.num_registro, 'despacho', e.target.value)}
                      />
                      : proceso.despacho}
                  </div>
                  <div>
                    <strong># Radicado Inicial:</strong>
                    {modoEdicion ? 
                      <input 
                        value={valores.num_radicado_ini || ''} 
                        onChange={(e) => handleChange(proceso.num_registro, 'num_radicado_ini', e.target.value)}
                      /> 
                      : proceso.num_radicado_ini}
                  </div>
                  <div>
                    <strong>Fecha Radicado Inicial:</strong>
                    {modoEdicion ? 
                      <input 
                        value={valores.fecha_radicado_ini || ''} 
                        onChange={(e) => handleChange(proceso.num_registro, 'fecha_radicado_ini', e.target.value)}
                      /> 
                      : proceso.fecha_radicado_ini}
                  </div>
                  <div>
                    <strong>Radicado Tribunal:</strong>
                    {modoEdicion ? 
                      <input 
                        value={valores.radicado_tribunal || ''} 
                        onChange={(e) => handleChange(proceso.num_registro, 'radicado_tribunal', e.target.value)}
                      /> 
                      : proceso.radicado_tribunal}
                  </div>
                  <div>
                    <strong>Magistrado:</strong>
                    {modoEdicion ? 
                      <input 
                        value={valores.magistrado || ''} 
                        onChange={(e) => handleChange(proceso.num_registro, 'magistrado', e.target.value)}
                      /> 
                      : proceso.magistrado}
                  </div>
                  <div>
                    <strong>Jurisdicción:</strong>
                    {modoEdicion ? 
                      <input 
                        value={valores.jurisdiccion || ''} 
                        onChange={(e) => handleChange(proceso.num_registro, 'jurisdiccion', e.target.value)}
                      /> 
                      : proceso.jurisdiccion}
                  </div>
                  <div>
                    <strong>Clase de Proceso:</strong>
                    {modoEdicion ? 
                      <input 
                        value={valores.clase_proceso || ''} 
                        onChange={(e) => handleChange(proceso.num_registro, 'clase_proceso', e.target.value)}
                      /> 
                      : proceso.clase_proceso}
                  </div>
                  <div>
                    <strong>Estado:</strong>
                    {modoEdicion ? 
                      <input 
                        value={valores.estado || ''} 
                        onChange={(e) => handleChange(proceso.num_registro, 'estado', e.target.value)}
                      /> 
                      : proceso.estado}
                  </div>
                  <div>
                    <strong>Sentencia Juzgado:</strong>
                    {modoEdicion ? 
                      <input 
                        value={valores.sentencia_juzgado || ''} 
                        onChange={(e) => handleChange(proceso.num_registro, 'sentencia_juzgado', e.target.value)}
                      /> 
                      : proceso.sentencia_juzgado}
                  </div>
                  <div>
                    <strong>Sentencia Tribunal:</strong>
                    {modoEdicion ? 
                      <input 
                        value={valores.sentencia_tribunal || ''} 
                        onChange={(e) => handleChange(proceso.num_registro, 'sentencia_tribunal', e.target.value)}
                      /> 
                      : proceso.sentencia_tribunal}
                  </div>
                  <div>
                    <strong>Identidad Clientes:</strong>
                    {modoEdicion ? 
                      <input 
                        value={valores.identidad_clientes || ''} 
                        onChange={(e) => handleChange(proceso.num_registro, 'identidad_clientes', e.target.value)}
                      /> 
                      : proceso.identidad_clientes}
                  </div>
                  <div>
                    <strong>Nombres Demandante:</strong>
                    {modoEdicion ? 
                      <input 
                        value={valores.nombres_demandante || ''} 
                        onChange={(e) => handleChange(proceso.num_registro, 'nombres_demandante', e.target.value)}
                      /> 
                      : proceso.nombres_demandante}
                  </div>
                  <div>
                    <strong>Identidad Demandado:</strong>
                    {modoEdicion ? 
                      <input 
                        value={valores.identidad_demandado || ''} 
                        onChange={(e) => handleChange(proceso.num_registro, 'identidad_demandado', e.target.value)}
                      /> 
                      : proceso.identidad_demandado}
                  </div>
                  <div>
                    <strong>Nombres Demandado:</strong>
                    {modoEdicion ? 
                      <input 
                        value={valores.nombres_demandado || ''} 
                        onChange={(e) => handleChange(proceso.num_registro, 'nombres_demandado', e.target.value)}
                      /> 
                      : proceso.nombres_demandado}
                  </div>
                  <div>
                    <strong>Negocio:</strong>
                    {modoEdicion ? 
                      <input 
                        value={valores.negocio || ''} 
                        onChange={(e) => handleChange(proceso.num_registro, 'negocio', e.target.value)}
                      /> 
                      : proceso.negocio}
                  </div>
                  <div>
                    <strong>Identidad Abogados:</strong>
                    {modoEdicion ? 
                      <input 
                        value={valores.identidad_abogados || ''} 
                        onChange={(e) => handleChange(proceso.num_registro, 'identidad_abogados', e.target.value)}
                      /> 
                      : proceso.identidad_abogados}
                  </div>
                  <div>
                    <strong>Nombres Apoderado:</strong>
                    {modoEdicion ? 
                      <input 
                        value={valores.nombres_apoderado || ''} 
                        onChange={(e) => handleChange(proceso.num_registro, 'nombres_apoderado', e.target.value)}
                      /> 
                      : proceso.nombres_apoderado}
                  </div>
                  <div>
                    <strong># Radicado Último:</strong>
                    {modoEdicion ? 
                      <input 
                        value={valores.num_radicado_ult || ''} 
                        onChange={(e) => handleChange(proceso.num_registro, 'num_radicado_ult', e.target.value)}
                      /> 
                      : proceso.num_radicado_ult}
                  </div>
                  <div>
                    <strong>Radicado Corte:</strong>
                    {modoEdicion ? 
                      <input 
                        value={valores.radicado_corte || ''} 
                        onChange={(e) => handleChange(proceso.num_registro, 'radicado_corte', e.target.value)}
                      /> 
                      : proceso.radicado_corte}
                  </div>
                  <div>
                    <strong>Magistrado Corte:</strong>
                    {modoEdicion ? 
                      <input 
                        value={valores.magistrado_corte || ''} 
                        onChange={(e) => handleChange(proceso.num_registro, 'magistrado_corte', e.target.value)}
                      /> 
                      : proceso.magistrado_corte}
                  </div>
                  <div>
                    <strong>Casación:</strong>
                    {modoEdicion ? 
                      <input 
                        value={valores.casacion || ''} 
                        onChange={(e) => handleChange(proceso.num_registro, 'casacion', e.target.value)}
                      /> 
                      : proceso.casacion}
                  </div>
                  <div>
                    <strong>Descripción:</strong>
                    {modoEdicion ? 
                      <input 
                        value={valores.descripcion || ''} 
                        onChange={(e) => handleChange(proceso.num_registro, 'descripcion', e.target.value)}
                      /> 
                      : proceso.descripcion}
                  </div>
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
        !cargando && <p>No se encontraron procesos para esta cédula.</p>
      )}

{modalProceso && (
        <DemandantesModal
          proceso={modalProceso}
          onClose={handleCloseModal}
        />
      )}
      {modalAnotaciones && (
        <AnotacionesModal
          numRegistro={modalAnotaciones} // Pasar el número de registro al modal
          onClose={handleCloseAnotacionesModal}
        />
      )}
       {modalAnexos && (
        <AnexosModal
          numRegistro={modalAnexos} // Pasar el número de registro al modal
          onClose={handleCloseAnexosModal}
        />
      )}
    </div>
  );
};

export default TablaProcesos;


