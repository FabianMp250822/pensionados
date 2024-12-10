// ListaUsuarios.js
import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase/firebaseConfig';
import './ListaUsuarios.css';
import ResumenFinanciero from './ResumenFinanciero';

const ListaUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [usuariosFiltrados, setUsuariosFiltrados] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [mostrarModalPago, setMostrarModalPago] = useState(false);
  const [mostrarModalVerPagos, setMostrarModalVerPagos] = useState(false);
  const [montoPago, setMontoPago] = useState('');
  const [fechaPago, setFechaPago] = useState('');
  const [archivoSoporte, setArchivoSoporte] = useState(null);

  // Obtener usuarios y sus pagos de Firebase
  useEffect(() => {
    const obtenerUsuariosConPagos = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'nuevosclientes'));
        const usuariosData = await Promise.all(
          querySnapshot.docs.map(async (docUsuario) => {
            const userData = { id: docUsuario.id, ...docUsuario.data() };

            const pagosSnapshot = await getDocs(
              collection(db, 'nuevosclientes', docUsuario.id, 'pagos')
            );
            const pagos = pagosSnapshot.docs.map((docPago) => ({
              id: docPago.id,
              ...docPago.data(),
            }));
            userData.pagos = pagos;
            return userData;
          })
        );
        setUsuarios(usuariosData);
        setUsuariosFiltrados(usuariosData);
      } catch (error) {
        console.error('Error al obtener usuarios:', error);
      }
    };
    obtenerUsuariosConPagos();
  }, []);

  // Manejar la búsqueda
  const handleBusqueda = (e) => {
    const valor = e.target.value;
    setBusqueda(valor);

    const filtrados = usuarios.filter((usuario) => {
      const nombreCompleto = `${usuario.nombres} ${usuario.apellidos}`.toLowerCase();
      const cedula = usuario.cedula.toLowerCase();
      return (
        nombreCompleto.includes(valor.toLowerCase()) ||
        cedula.includes(valor.toLowerCase())
      );
    });
    setUsuariosFiltrados(filtrados);
  };

  const abrirModalPago = (usuario) => {
    setUsuarioSeleccionado(usuario);
    setMontoPago('');
    setFechaPago('');
    setArchivoSoporte(null);
    setMostrarModalPago(true);
  };

  const cerrarModalPago = () => {
    setMostrarModalPago(false);
    setUsuarioSeleccionado(null);
  };

  const abrirModalVerPagos = (usuario) => {
    setUsuarioSeleccionado(usuario);
    setMostrarModalVerPagos(true);
  };

  const cerrarModalVerPagos = () => {
    setMostrarModalVerPagos(false);
    setUsuarioSeleccionado(null);
  };

  const guardarPago = async () => {
    if (!montoPago || parseFloat(montoPago) <= 0) {
      alert('Por favor, ingresa un monto de pago válido.');
      return;
    }

    if (!fechaPago) {
      alert('Por favor, ingresa la fecha del pago.');
      return;
    }

    if (!archivoSoporte) {
      alert('Por favor, adjunta el soporte del pago.');
      return;
    }

    try {
      const porcentajeDescuento = 0; 
      const descuento = parseFloat(montoPago) * porcentajeDescuento;
      const montoDespuesDescuento = parseFloat(montoPago) - descuento;

      // Subir archivo de soporte
      const soporteRef = ref(storage, `soportes/${usuarioSeleccionado.id}/${archivoSoporte.name}`);
      await uploadBytes(soporteRef, archivoSoporte);
      const soporteURL = await getDownloadURL(soporteRef);

      const pagoData = {
        monto: parseFloat(montoPago),
        descuento: descuento,
        montoNeto: montoDespuesDescuento,
        fecha: fechaPago,
        vendedor: montoDespuesDescuento * 0.23076923076923077,
        empresa: montoDespuesDescuento * 0.7692307692307693,
        soporteURL: soporteURL,
      };

      const pagoRef = await addDoc(
        collection(db, 'nuevosclientes', usuarioSeleccionado.id, 'pagos'),
        pagoData
      );

      alert('Pago registrado exitosamente.');

      const nuevoPago = { id: pagoRef.id, ...pagoData };
      setUsuarios((prevUsuarios) =>
        prevUsuarios.map((usuario) =>
          usuario.id === usuarioSeleccionado.id
            ? { ...usuario, pagos: [...usuario.pagos, nuevoPago] }
            : usuario
        )
      );

      setUsuariosFiltrados((prevUsuarios) =>
        prevUsuarios.map((usuario) =>
          usuario.id === usuarioSeleccionado.id
            ? { ...usuario, pagos: [...usuario.pagos, nuevoPago] }
            : usuario
        )
      );

      // Calcular valores adicionales
      const cuotaMensual = parseFloat(usuarioSeleccionado.cuotaMensual);
      const plazoMeses = parseInt(usuarioSeleccionado.plazoMeses);
      const totalAPagar = cuotaMensual * plazoMeses;
      const totalPagado = usuarioSeleccionado.pagos
        ? usuarioSeleccionado.pagos.reduce(
            (sum, pago) => sum + parseFloat(pago.montoNeto),
            parseFloat(montoDespuesDescuento)
          )
        : parseFloat(montoDespuesDescuento);
      const deudaActual = totalAPagar - totalPagado;

      // Datos para el correo
      const emailData = {
        emailUsuario: usuarioSeleccionado.correo,
        nombreUsuario: `${usuarioSeleccionado.nombres} ${usuarioSeleccionado.apellidos}`,
        montoPago: parseFloat(montoPago).toFixed(2),
        fechaPago: fechaPago,
        soporteURL: soporteURL,
        cedula: usuarioSeleccionado.cedula,
        celular: usuarioSeleccionado.celular,
        cuotaMensual: usuarioSeleccionado.cuotaMensual,
        plazoMeses: usuarioSeleccionado.plazoMeses,
        totalAPagar: totalAPagar.toFixed(2),
        totalPagado: totalPagado.toFixed(2),
        deudaActual: deudaActual.toFixed(2),
      };

      console.log('Datos del usuario seleccionado:', usuarioSeleccionado);
      console.log('Datos del correo a enviar:', emailData);

      // Enviar correo usando fetch a la función externa
      if (!emailData.emailUsuario) {
        console.error('El usuario seleccionado no tiene un email válido.');
      } else {
        try {
          const response = await fetch('https://sendemailnotificaciones-w4tv3jcmvq-uc.a.run.app', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(emailData),
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const resultado = await response.json();
          console.log('Correo enviado:', resultado);
          alert('Correo enviado exitosamente.');
        } catch (error) {
          console.error('Error al enviar el correo:', error);
          alert(`Error al enviar el correo: ${error.message || 'Revisa la consola para más detalles.'}`);
        }
      }

      cerrarModalPago();
    } catch (error) {
      console.error('Error al registrar el pago:', error);
      alert('Error al registrar el pago.');
    }
  };

  return (
    <div className="lista-clientes">
      <h2>Lista de Usuarios ({usuariosFiltrados.length})</h2>

      <div className="buscador">
        <input
          type="text"
          placeholder="Buscar por nombre o cédula..."
          value={busqueda}
          onChange={handleBusqueda}
        />
      </div>

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Nombres</th>
            <th>Apellidos</th>
            <th>Cédula</th>
            <th>Total a Pagar</th>
            <th>Total Pagado</th>
            <th>Deuda Actual</th>
            <th>Total para Empresa</th>
            <th>Total para Vendedor</th>
            <th>Cuotas Pagadas</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usuariosFiltrados.map((usuario, index) => {
            const cuotaMensual = parseFloat(usuario.cuotaMensual);
            const plazoMeses = parseInt(usuario.plazoMeses);
            const totalAPagar = cuotaMensual * plazoMeses;
            const totalPagado = usuario.pagos
              ? usuario.pagos.reduce((sum, pago) => sum + parseFloat(pago.montoNeto), 0)
              : 0;
            const deuda = totalAPagar - totalPagado;
            const cuotasPagadas = usuario.pagos ? usuario.pagos.length : 0;
            const totalEmpresa = usuario.pagos
              ? usuario.pagos.reduce((sum, pago) => sum + parseFloat(pago.empresa), 0)
              : 0;
            const totalVendedor = usuario.pagos
              ? usuario.pagos.reduce((sum, pago) => sum + parseFloat(pago.vendedor), 0)
              : 0;

            return (
              <tr key={usuario.id}>
                <td>{index + 1}</td>
                <td>{usuario.nombres}</td>
                <td>{usuario.apellidos}</td>
                <td>{usuario.cedula}</td>
                <td>${totalAPagar.toLocaleString()}</td>
                <td>${totalPagado.toLocaleString()}</td>
                <td>${deuda.toLocaleString()}</td>
                <td>${totalEmpresa.toLocaleString()}</td>
                <td>${totalVendedor.toLocaleString()}</td>
                <td>{cuotasPagadas}</td>
                <td>
                  <button onClick={() => abrirModalPago(usuario)}>Agregar Pago</button>
                  <button onClick={() => abrirModalVerPagos(usuario)}>Ver Pagos</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {mostrarModalPago && (
  <div className="modal">
    <div className="modal-content">
      <h3>Agregar Pago para {usuarioSeleccionado.nombres} {usuarioSeleccionado.apellidos}</h3>
      
      {(() => {
        const cuotaMensual = parseFloat(usuarioSeleccionado.cuotaMensual);
        const plazoMeses = parseInt(usuarioSeleccionado.plazoMeses);
        const totalAPagar = cuotaMensual * plazoMeses;
        const totalPagado = usuarioSeleccionado.pagos
          ? usuarioSeleccionado.pagos.reduce((sum, pago) => sum + parseFloat(pago.montoNeto), 0)
          : 0;
        const deuda = totalAPagar - totalPagado;
        const cuotasPagadas = usuarioSeleccionado.pagos ? usuarioSeleccionado.pagos.length : 0;

        return (
          <div 
            className="info-section" 
            style={{ 
              marginBottom: '20px', 
              padding: '20px', 
              borderTop: '1px solid #ccc', 
              borderBottom: '1px solid #ccc',
              display: 'flex',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ flex: '1', borderRight: '1px solid #ccc', paddingRight: '10px' }}>
              <p><strong>Total a Pagar:</strong> ${totalAPagar.toLocaleString()}</p>
              <p><strong>Total Pagado:</strong> ${totalPagado.toLocaleString()}</p>
              <p><strong>Deuda Actual:</strong> ${deuda.toLocaleString()}</p>
            </div>
            <div style={{ flex: '1', paddingLeft: '10px' }}>
              <p><strong>Cuotas Pagadas:</strong> {cuotasPagadas}</p>
              <p><strong>Valor de la Cuota Actual:</strong> ${cuotaMensual.toLocaleString()}</p>
            </div>
          </div>
        );
      })()}

      <div className="form-group" style={{ marginBottom: '10px' }}>
        <label htmlFor="fechaPago"><strong>Fecha del Pago:</strong></label>
        <input
          type="date"
          id="fechaPago"
          value={fechaPago}
          onChange={(e) => setFechaPago(e.target.value)}
          style={{ display: 'block', marginTop: '5px' }}
        />
      </div>

      <div className="form-group" style={{ marginBottom: '10px' }}>
        <label htmlFor="montoPago"><strong>Monto del Pago:</strong></label>
        <input
          type="number"
          id="montoPago"
          value={montoPago !== '' ? montoPago : usuarioSeleccionado.cuotaMensual}
          onChange={(e) => setMontoPago(e.target.value)}
          style={{ display: 'block', marginTop: '5px' }}
        />
      </div>

      <div className="form-group" style={{ marginBottom: '20px' }}>
        <label htmlFor="archivoSoporte"><strong>Soporte de Pago:</strong></label>
        <input
          type="file"
          id="archivoSoporte"
          accept="image/*,application/pdf"
          onChange={(e) => setArchivoSoporte(e.target.files[0])}
          style={{ display: 'block', marginTop: '5px' }}
        />
      </div>

      {montoPago && parseFloat(montoPago) > 0 && (() => {
        const porcentajeDescuento = 0;
        const descuento = parseFloat(montoPago) * porcentajeDescuento;
        const montoDespuesDescuento = parseFloat(montoPago) - descuento;

        return (
          <div 
            className="info-section" 
            style={{ 
              marginBottom: '20px', 
              padding: '20px', 
              borderTop: '1px solid #ccc', 
              borderBottom: '1px solid #ccc'
            }}
          >
            {porcentajeDescuento > 0 && (
              <p><strong>Descuento ({porcentajeDescuento * 100}%):</strong> ${descuento.toLocaleString()}</p>
            )}
            <p><strong>Monto después del descuento:</strong> ${montoDespuesDescuento.toLocaleString()}</p>
            <p><strong>Empresa (76.92%):</strong> ${(montoDespuesDescuento * 0.7692307692307693).toLocaleString()}</p>
            <p><strong>Vendedor (23.08%):</strong> ${(montoDespuesDescuento * 0.23076923076923077).toLocaleString()}</p>
          </div>
        );
      })()}

      <button onClick={guardarPago} style={{ marginRight: '10px' }}>Guardar Pago</button>
      <button onClick={cerrarModalPago}>Cancelar</button>
    </div>
  </div>
)}


{mostrarModalVerPagos && (
  <div className="modal">
    <div className="modal-content" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h3 style={{ marginBottom: '10px' }}>
        Pagos de {usuarioSeleccionado.nombres} {usuarioSeleccionado.apellidos}
      </h3>

      {usuarioSeleccionado.pagos && usuarioSeleccionado.pagos.length > 0 ? (
        <div style={{ overflowX: 'auto', marginBottom: '20px' }}>
          <table 
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              backgroundColor: '#fff',
              boxShadow: '0 0 10px rgba(0,0,0,0.1)'
            }}
          >
            <thead>
              <tr style={{ backgroundColor: '#f2f2f2', textAlign: 'left' }}>
                <th style={{ padding: '10px', borderBottom: '1px solid #ccc' }}>#</th>
                <th style={{ padding: '10px', borderBottom: '1px solid #ccc' }}>Fecha</th>
                <th style={{ padding: '10px', borderBottom: '1px solid #ccc' }}>Monto</th>
                {usuarioSeleccionado.pagos.some((pago) => pago.descuento > 0) && (
                  <>
                    <th style={{ padding: '10px', borderBottom: '1px solid #ccc' }}>Descuento</th>
                    <th style={{ padding: '10px', borderBottom: '1px solid #ccc' }}>Monto Neto</th>
                  </>
                )}
                <th style={{ padding: '10px', borderBottom: '1px solid #ccc' }}>Empresa (76.92%)</th>
                <th style={{ padding: '10px', borderBottom: '1px solid #ccc' }}>Vendedor (23.08%)</th>
                <th style={{ padding: '10px', borderBottom: '1px solid #ccc' }}>Soporte</th>
              </tr>
            </thead>
            <tbody>
              {usuarioSeleccionado.pagos.map((pago, index) => (
                <tr key={pago.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px' }}>{index + 1}</td>
                  <td style={{ padding: '10px' }}>{new Date(pago.fecha).toLocaleDateString()}</td>
                  <td style={{ padding: '10px' }}>${parseFloat(pago.monto).toLocaleString()}</td>
                  {pago.descuento > 0 && (
                    <>
                      <td style={{ padding: '10px' }}>${parseFloat(pago.descuento).toLocaleString()}</td>
                      <td style={{ padding: '10px' }}>${parseFloat(pago.montoNeto).toLocaleString()}</td>
                    </>
                  )}
                  <td style={{ padding: '10px' }}>${parseFloat(pago.empresa).toLocaleString()}</td>
                  <td style={{ padding: '10px' }}>${parseFloat(pago.vendedor).toLocaleString()}</td>
                  <td style={{ padding: '10px' }}>
                    {pago.soporteURL ? (
                      <a 
                        href={pago.soporteURL}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#1976d2', textDecoration: 'none' }}
                      >
                        Ver Soporte
                      </a>
                    ) : (
                      'No Disponible'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No hay pagos registrados.</p>
      )}

      <button onClick={cerrarModalVerPagos} style={{ padding: '10px 20px', cursor: 'pointer' }}>Cerrar</button>
    </div>
  </div>
)}
 <ResumenFinanciero usuarios={usuariosFiltrados} />

    </div>
  );
};

export default ListaUsuarios;
