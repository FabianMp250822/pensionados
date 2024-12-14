import React, { useState, useEffect } from 'react';

const NuevaAnotacionModal = ({ numRegistro, onClose, anotacion = null }) => {
  const [fechaActuacion, setFechaActuacion] = useState('');
  const [fechaLimite, setFechaLimite] = useState('');
  const [horaLimite, setHoraLimite] = useState('11:45:00');
  const [tipoActuacion, setTipoActuacion] = useState('');
  const [visualizar, setVisualizar] = useState(true);
  const [detalle, setDetalle] = useState('');
  const [estadoProcesal, setEstadoProcesal] = useState('');
  const [despachos, setDespachos] = useState('');
  const [archivo, setArchivo] = useState(null);

  const isEditing = !!anotacion; // Si se pasa una anotación, el modal está en modo edición.

  // Transformar fecha al formato `YYYY-MM-DD` si viene en otro formato
  const transformarFecha = (fecha) => {
    if (!fecha) return '';
    const partes = fecha.split('-');
    if (partes.length === 3) {
      // Si el formato es `DD-MM-YYYY`, convertirlo a `YYYY-MM-DD`
      return `${partes[2]}-${partes[1]}-${partes[0]}`;
    }
    return fecha; // Asumir que ya está en `YYYY-MM-DD`
  };

  // Cargar datos de la anotación existente (en caso de edición)
  useEffect(() => {
    if (anotacion) {
      setFechaActuacion(transformarFecha(anotacion.fecha));
      setFechaLimite(transformarFecha(anotacion.fecha_limite));
      setHoraLimite(anotacion.hora_limite || '11:45:00');
      setTipoActuacion(anotacion.clase || '');
      setVisualizar(anotacion.visualizar || true);
      setDetalle(anotacion.detalle || '');
      setEstadoProcesal(anotacion.estado_procesal || '');
      setDespachos(anotacion.despachos ? String(anotacion.despachos) : ''); // Asegurarse de que sea una cadena
    }
  }, [anotacion]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('action', isEditing ? 'editAnotacion' : 'addAnotacion');
    formData.append('num_registro', numRegistro);
    formData.append('fecha', fechaActuacion);
    formData.append('fecha_limite', fechaLimite);
    formData.append('hora_limite', horaLimite);
    formData.append('tipo', tipoActuacion);
    formData.append('visualizar', visualizar ? 1 : 0);
    formData.append('detalle', detalle);
    formData.append('estado_procesal', estadoProcesal);
    formData.append('despachos', despachos);

    if (archivo) {
      formData.append('archivo_adjunto', archivo);
    }

    if (isEditing) {
      formData.append('auto', anotacion.auto); // ID de la anotación a editar
    }

    try {
      const response = await fetch('https://appdajusticia.com/anotaciones.php', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        alert(isEditing ? 'Anotación actualizada correctamente.' : 'Anotación agregada exitosamente.');
        onClose();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error inesperado al procesar la solicitud.');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          width: '90%',
          maxWidth: '700px',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>
          {isEditing ? 'Editar Anotación' : 'Agregar Nueva Anotación'}
        </h2>
        <form onSubmit={handleSubmit} encType="multipart/form-data">
          {/* Fechas en Línea */}
          <div style={{ display: 'flex', gap: '30px', marginBottom: '20px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                *Fecha de la Actuación:
              </label>
              <input
                type="date"
                value={fechaActuacion}
                onChange={(e) => setFechaActuacion(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Fecha Límite:
              </label>
              <input
                type="date"
                value={fechaLimite}
                onChange={(e) => setFechaLimite(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                }}
              />
            </div>
          </div>
          {/* Otros Campos */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Hora Límite:
            </label>
            <input
              type="time"
              value={horaLimite}
              onChange={(e) => setHoraLimite(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
              }}
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Tipo de Actuación:
            </label>
            <input
              type="text"
              value={tipoActuacion}
              onChange={(e) => setTipoActuacion(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
              }}
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontWeight: 'bold' }}>
              <input
                type="checkbox"
                checked={visualizar}
                onChange={(e) => setVisualizar(e.target.checked)}
                style={{ marginRight: '8px' }}
              />
              Visualizar
            </label>
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Detalle:
            </label>
            <textarea
              value={detalle}
              onChange={(e) => setDetalle(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                resize: 'vertical',
              }}
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Estado Procesal:
            </label>
            <textarea
              value={estadoProcesal}
              onChange={(e) => setEstadoProcesal(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                resize: 'vertical',
              }}
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
    Despacho:
  </label>
  <select
    value={despachos || ''} // Asegurarse de que haya un valor inicial
    onChange={(e) => setDespachos(e.target.value)}
    required
    style={{
      width: '100%',
      padding: '8px',
      border: '1px solid #ccc',
      borderRadius: '4px',
    }}
  >
    <option value="">Seleccione un Ítem...</option>
    <option value="1">1. JUZGADO</option>
    <option value="2">2. TRIBUNAL</option>
    <option value="3">3. CORTE</option>
  </select>
</div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Subir Actuación:
            </label>
            <input
              type="file"
              onChange={(e) => setArchivo(e.target.files[0])}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
              }}
            />
          </div>
          {/* Botones */}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button
              type="submit"
              style={{
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              {isEditing ? 'Actualizar' : 'Guardar'}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NuevaAnotacionModal;
