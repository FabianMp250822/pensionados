import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import FiltroPagos from './FiltroPagos';
import ListadoPagos from './ListadoPagos'; 
import Comentarios from './Comentarios';
import FormularioInscripcionCliente from './FormularioInscripcionCliente';
import ContabilidadIcons from './ContabilidadIcons';
import ListaUsuarios from './ListaUsuarios'; // Para "Agregar Pago"
import FormularioEdicionUsuario from './FormularioEdicionUsuario'; // Para "Editar Usuario"
import ResumenFinanciero from './ResumenFinanciero'; // Para "Resumen Financiero"
import DocumentosSoporte from './DocumentosSoporte'; // Importa el componente DocumentosSoporte

const Contabilidad = () => {
  const { clienteSeleccionado, loading, pagos } = useSelector((state) => state.contabilidad || {});
  // Supongamos que "usuariosFiltrados" es parte del estado o se obtiene de alguna lógica.
  const usuariosFiltrados = useSelector((state) => state.usuariosFiltrados || []);

  // Establecemos 'agregarPago' como vista inicial.
  const [vistaSeleccionada, setVistaSeleccionada] = useState('agregarPago');

  const containerStyle = {
    display: 'flex',
    height: '100vh', // Ocupa toda la pantalla (opcional)
    backgroundColor: '#f8f9fa',
    fontFamily: 'Arial, sans-serif',
  };

  // Sidebar izquierdo (menú de íconos)
  const leftSidebarStyle = {
    width: '200px',
    borderRight: '1px solid #dee2e6',
    backgroundColor: '#fff',
    padding: '20px',
    boxSizing: 'border-box',
    overflowY: 'auto',
  };

  // Contenido principal al centro
  const mainContentStyle = {
    flex: 1,
    padding: '20px',
    boxSizing: 'border-box',
    overflowY: 'auto',
  };

  // Sidebar derecho (por ejemplo, comentarios)
  const rightSidebarStyle = {
    width: '300px',
    borderLeft: '1px solid #dee2e6',
    backgroundColor: '#fff',
    padding: '20px',
    boxSizing: 'border-box',
    overflowY: 'auto',
  };

  return (
    <div style={containerStyle}>
      {/* Sidebar izquierdo: menú de íconos */}
      <div style={leftSidebarStyle}>
        <ContabilidadIcons
          vistaSeleccionada={vistaSeleccionada}
          setVistaSeleccionada={setVistaSeleccionada}
        />
      </div>

      {/* Contenido principal */}
      <div style={mainContentStyle}>
        {clienteSeleccionado ? (
          <div className="cliente-details" style={{ backgroundColor: '#fff', padding: '20px', marginBottom: '20px' }}>
            <h1>{clienteSeleccionado.nombre}</h1>
            {/* <p><strong>Empresa:</strong> {clienteSeleccionado.empresa}</p>
            <p><strong>NIT:</strong> {clienteSeleccionado.nit}</p>
            <p><strong>Centro de Costo:</strong> {clienteSeleccionado.centroCosto}</p>
            <p><strong>Cargo:</strong> {clienteSeleccionado.cargo}</p> */}
          </div>
        ) : (
          <h1>Seleccione un cliente</h1>
        )}

        <div style={{ marginTop: '20px' }}>
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
          {vistaSeleccionada === 'agregarPago' && (
            <ListaUsuarios />
          )}
          {vistaSeleccionada === 'editarUsuario' && (
            <FormularioEdicionUsuario usuarioSeleccionado={clienteSeleccionado} />
          )}
          {vistaSeleccionada === 'resumenFinanciero' && (
            <ResumenFinanciero usuarios={usuariosFiltrados} />
          )}
          {vistaSeleccionada === 'documentosSoporte' && (
            <DocumentosSoporte />
          )}
          {!vistaSeleccionada && (
            <h2>Seleccione una opción en el menú de la izquierda</h2>
          )}
        </div>
      </div>

      {/* Sidebar derecho: Comentarios u otro contenido */}
      <div style={rightSidebarStyle}>
        <Comentarios />
      </div>
    </div>
  );
};

export default Contabilidad;
