import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import { useDispatch, useSelector } from 'react-redux';
import Modal from './Modal';
import ContratoPrestacionServicios from './ContratoPrestacionServicios';
import { app } from '../firebase/firebaseConfig';
import { setClienteSeleccionado } from '../redux/contabilidadSlice';

const db = getFirestore(app);

const DocumentosSoporte = () => {
  const [busqueda, setBusqueda] = useState('');
  const [clientes, setClientes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const dispatch = useDispatch();
  const clienteSeleccionado = useSelector((state) => state.contabilidad.clienteSeleccionado);

  // Función para buscar clientes en la colección "nuevosclientes"
  const handleSearch = async () => {
    try {
      const clientesRef = collection(db, "nuevosclientes");
      let q;
      if (busqueda.trim() !== "") {
        q = query(clientesRef, where("apellidos", "==", busqueda.toUpperCase()));
      } else {
        q = query(clientesRef);
      }
      const querySnapshot = await getDocs(q);
      const clientesData = [];
      querySnapshot.forEach((doc) => {
        clientesData.push({ id: doc.id, ...doc.data() });
      });
      setClientes(clientesData);
    } catch (error) {
      console.error("Error al obtener clientes: ", error);
    }
  };

  // Efecto con debounce para disparar la búsqueda cuando el usuario escribe
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch();
    }, 500);
    return () => clearTimeout(timer);
  }, [busqueda]);

  // Al seleccionar un cliente desde el dropdown, actualizamos el estado global
  const handleSelect = (cliente) => {
    dispatch(setClienteSeleccionado(cliente));
    setDropdownVisible(false);
    setBusqueda(`${cliente.nombres} ${cliente.apellidos}`);
  };

  // Abrir y cerrar el modal para generar el contrato
  const openContratoModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  // Estilos
  const inputStyle = {
    width: '100%',
    padding: '12px',
    fontSize: '1rem',
    borderRadius: '6px',
    border: '1px solid #ccc',
    marginBottom: '5px',
    boxSizing: 'border-box'
  };

  const dropdownStyle = {
    border: '1px solid #ccc',
    borderRadius: '6px',
    maxHeight: '250px',
    overflowY: 'auto',
    position: 'absolute',
    width: '100%',
    backgroundColor: '#fff',
    zIndex: 10,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  };

  const dropdownItemStyle = {
    padding: '10px 15px',
    borderBottom: '1px solid #eee',
    cursor: 'pointer'
  };

  // Se usa CSS Grid para organizar la información en tres columnas
  const clientCardGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '20px',
    marginTop: '20px',
    padding: '20px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  };

  const clientInfoItemStyle = {
    wordBreak: 'break-word'
  };

  return (
    <>
      <h2 style={{ textAlign: 'center', color: '#333', marginBottom: '20px' }}>Documentos de Soporte</h2>
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          style={inputStyle}
          value={busqueda}
          onChange={(e) => {
            setBusqueda(e.target.value);
            setDropdownVisible(true);
          }}
          placeholder="Buscar cliente por apellidos..."
        />
        {dropdownVisible && clientes.length > 0 && (
          <div style={dropdownStyle}>
            {clientes.map((cliente) => (
              <div
                key={cliente.id}
                style={dropdownItemStyle}
                onClick={() => handleSelect(cliente)}
                onMouseOver={e => e.currentTarget.style.backgroundColor = '#f1f1f1'}
                onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {cliente.nombres} {cliente.apellidos} - Cédula: {cliente.cedula}
              </div>
            ))}
          </div>
        )}
      </div>

      {clienteSeleccionado && (
        <div style={clientCardGridStyle}>
          <div style={clientInfoItemStyle}>
            <strong>Nombres:</strong> {clienteSeleccionado.nombres}
          </div>
          <div style={clientInfoItemStyle}>
            <strong>Apellidos:</strong> {clienteSeleccionado.apellidos}
          </div>
          <div style={clientInfoItemStyle}>
            <strong>Cédula:</strong> {clienteSeleccionado.cedula}
          </div>
          <div style={clientInfoItemStyle}>
            <strong>Celular:</strong> {clienteSeleccionado.celular}
          </div>
          <div style={clientInfoItemStyle}>
            <strong>Correo:</strong> {clienteSeleccionado.correo}
          </div>
          <div style={clientInfoItemStyle}>
            <strong>Cuota Mensual:</strong> {clienteSeleccionado.cuotaMensual}
          </div>
          <div style={clientInfoItemStyle}>
            <strong>Dirección:</strong> {clienteSeleccionado.direccion}
          </div>
          <div style={clientInfoItemStyle}>
            <strong>Grupo:</strong> {clienteSeleccionado.grupo}
          </div>
          <div style={clientInfoItemStyle}>
            <strong>ID:</strong> {clienteSeleccionado.id}
          </div>
          <div style={clientInfoItemStyle}>
            <strong>Multiplicador Salario:</strong> {clienteSeleccionado.multiplicadorSalario}
          </div>
          <div style={clientInfoItemStyle}>
            <strong>Plazo Meses:</strong> {clienteSeleccionado.plazoMeses}
          </div>
          <div style={clientInfoItemStyle}>
            <strong>Salario:</strong> {clienteSeleccionado.salario}
          </div>
          <div style={clientInfoItemStyle}>
            <strong>Teléfono Fijo:</strong> {clienteSeleccionado.telefonoFijo || 'N/A'}
          </div>
          <div style={clientInfoItemStyle}>
            <strong>Documento de Soporte:</strong>{' '}
            {clienteSeleccionado.archivos && clienteSeleccionado.archivos.DOCUMENTOS ? (
              <a href={clienteSeleccionado.archivos.DOCUMENTOS} target="_blank" rel="noopener noreferrer">
                Ver Documento
              </a>
            ) : (
              'No disponible'
            )}
          </div>
        </div>
      )}

      {/* Botones siempre visibles */}
      <div
        style={{
          marginTop: '20px',
          display: 'flex',
          flexWrap: 'nowrap',
          gap: '10px',
          justifyContent: 'center'
        }}
      >
        <button
          style={{
            padding: '10px 20px',
            fontSize: '0.95rem',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            backgroundColor: '#007bff',
            color: '#fff',
            transition: 'background-color 0.3s'
          }}
          onClick={openContratoModal}
        >
          Generar Contrato
        </button>
        
        <button
          style={{
            padding: '10px 20px',
            fontSize: '0.95rem',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            backgroundColor: '#007bff',
            color: '#fff',
            transition: 'background-color 0.3s'
          }}
        >
          Generar Poder
        </button>
        
        <button
          style={{
            padding: '10px 20px',
            fontSize: '0.95rem',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            backgroundColor: '#007bff',
            color: '#fff',
            transition: 'background-color 0.3s'
          }}
        >
          Generar Otros Documentos
        </button>
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal}>
        {/* Se pasa el cliente seleccionado como prop */}
        <ContratoPrestacionServicios cliente={clienteSeleccionado} onClose={closeModal} />
      </Modal>
    </>
  );
};

export default DocumentosSoporte;
