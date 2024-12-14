import React, { useState } from 'react';
import Grid from '@mui/material/Grid';
import FiltroPagos from './FiltroPagos';
import GenerarFactura from './GenerarFactura.js';
import ListadoPagos from './ListadoPagos.js'; 
import { useSelector } from 'react-redux';
import Comentarios from './Comentarios.js';
import ClienteSelector from './ClienteSelector.js';
import FormularioInscripcionCliente from './FormularioInscripcionCliente';

const Contabilidad = () => {
  const { clienteSeleccionado, loading, pagos } = useSelector((state) => state.contabilidad || {});
  const [vistaSeleccionada, setVistaSeleccionada] = useState('');

  const handleClienteSelectorChange = (opcion) => {
    setVistaSeleccionada(opcion);
  };

  return (
    <div
      className="contabilidad-container"
      style={{
        maxWidth: '1200px', // Define el ancho máximo
        margin: '0 auto',   // Centra horizontalmente
        padding: '20px',    // Añade espacio interno
        boxSizing: 'border-box',
      }}
    >
      <Grid container spacing={2} direction="column">
        <Grid item xs={12}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              {clienteSeleccionado ? (
                <div className="cliente-details">
                  <h1 className="section-title">{clienteSeleccionado.nombre}</h1>
                  <p><strong>Empresa:</strong> {clienteSeleccionado.empresa}</p>
                  <p><strong>NIT:</strong> {clienteSeleccionado.nit}</p>
                  <p><strong>Centro de Costo:</strong> {clienteSeleccionado.centroCosto}</p>
                  <p><strong>Cargo:</strong> {clienteSeleccionado.cargo}</p>
                </div>
              ) : (
                <h1 className="section-title">Seleccione un cliente</h1>
              )}

              <div className="content-section">
                {vistaSeleccionada === 'crearCliente' && (
                  <FormularioInscripcionCliente usuarioSeleccionado={clienteSeleccionado} />
                )}
                {vistaSeleccionada === 'verPagosCliente' && (
                  loading ? (
                    <div>Cargando...</div>
                  ) : (
                    <FiltroPagos pagos={pagos} />
                  )
                )}
                {vistaSeleccionada === 'verHistorialPagos' && (
                  <ListadoPagos />
                )}
                {!vistaSeleccionada && (
                  <h2>Seleccione una opción en el panel de la derecha</h2>
                )}
              </div>
            </Grid>

            <Grid item xs={12} md={4}>
              <Comentarios />
              <ClienteSelector onOptionChange={handleClienteSelectorChange} />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </div>
  );
};

export default Contabilidad;
