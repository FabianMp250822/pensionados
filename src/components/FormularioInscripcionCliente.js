import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  collection,
  addDoc,
  getDocs
} from "firebase/firestore";
import Swal from 'sweetalert2';
import {
  ref,
  uploadBytes,
  getDownloadURL
} from 'firebase/storage';

import './FormularioInscripcionCliente.css';
import { db, storage } from '../firebase/firebaseConfig';


const FormularioInscripcionCliente = () => {
  const usuarioSeleccionado = useSelector(
    (state) => state.pensiones.usuarioSeleccionado
  );
  const pagos = useSelector(
    (state) => state.contabilidad.pagos
  );
  const [salarioMinimo, setSalarioMinimo] = useState(1300000);
  const [editandoSalario, setEditandoSalario] = useState(false);
  const [grupos, setGrupos] = useState([
    "Oceano azul", "Corelca"
  ]);
  const [nuevoGrupo, setNuevoGrupo] = useState("");
  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    cedula: '',
    correo: '',
    telefonoFijo: '',
    celular: '',
    salario: 0,
    multiplicadorSalario: 2,
    plazoMeses: 0,
    cuotaMensual: 0,
    grupo: "",
    direccion: '', // Nuevo campo
});


  const [convenioPagoFile, setConvenioPagoFile] = useState(null);
  const [otrosArchivos, setOtrosArchivos] = useState([
    { nombreArchivo: '', archivo: null }
  ]);

  const ultimoPago = pagos
    .filter(
      (pago) => pago.clienteId === usuarioSeleccionado?.id
    )
    .sort(
      (a, b) => new Date(b.fecha) - new Date(a.fecha)
    )[0];

  const extraerDatos = (nombreCompleto) => {
    const nombreRegex = /(.*)\s([A-Z]+)\s\((?:C\.C\.\s)?(\d+)\)/;
    const match = nombreCompleto.match(nombreRegex);

    if (match) {
      const apellidos = match[1]
        .split(' ').slice(0, -1).join(' ');
      const nombres = match[1]
        .split(' ').slice(-1).join(' ');
      const cedula = match[3];

      return { nombres, apellidos, cedula };
    }

    return { nombres: '', apellidos: '', cedula: '' };
  };

  useEffect(() => {
    if (usuarioSeleccionado) {
      const { nombres, apellidos, cedula } = extraerDatos(
        usuarioSeleccionado.nombre || ''
      );

      setFormData((prev) => ({
        ...prev,
        nombres: nombres || '',
        apellidos: apellidos || '',
        cedula: cedula || '',
        correo: usuarioSeleccionado.correo || '',
        telefonoFijo: usuarioSeleccionado.telefonoFijo || '',
        celular: usuarioSeleccionado.celular || '',
        salario: salarioMinimo * prev.multiplicadorSalario,
        plazoMeses: usuarioSeleccionado.plazoMeses || 0,
        cuotaMensual: usuarioSeleccionado.cuotaMensual || 0,
      }));
    }
  }, [usuarioSeleccionado, salarioMinimo]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === 'multiplicadorSalario') {
      const nuevoSalario = salarioMinimo * value;
      setFormData((prev) => ({
        ...prev,
        salario: nuevoSalario,
        cuotaMensual: calcularCuota(
          nuevoSalario, prev.plazoMeses
        ),
      }));
    }

    if (name === 'plazoMeses') {
      calcularCuota(formData.salario, value);
    }
  };

  const calcularCuota = (salario, plazoMeses) => {
    if (salario > 0 && plazoMeses > 0) {
      const cuota = (salario / plazoMeses).toFixed(2);
      setFormData((prev) => ({
        ...prev,
        cuotaMensual: cuota,
      }));
    }
  };

  useEffect(() => {
    const cargarGrupos = async () => {
      const gruposSnapshot = await getDocs(
        collection(db, "grupos")
      );
      const gruposFirebase = gruposSnapshot.docs.map(
        (doc) => doc.data().nombre
      );
      setGrupos((prev) => [...prev, ...gruposFirebase]);
    };
    cargarGrupos();
  }, []);

  const handleGrupoChange = async (e) => {
    const value = e.target.value;

    if (value === "nueva-opcion") {
      setFormData((prev) => ({
        ...prev,
        grupo: value,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        grupo: value,
      }));
    }
  };

  const handleNuevoGrupoSubmit = async () => {
    if (nuevoGrupo.trim() !== "") {
      try {
        await addDoc(
          collection(db, "grupos"),
          { nombre: nuevoGrupo }
        );
        setGrupos((prev) => [...prev, nuevoGrupo]);
        setFormData((prev) => ({
          ...prev,
          grupo: nuevoGrupo,
        }));
        setNuevoGrupo("");
        Swal.fire(
          'Éxito',
          'Nuevo grupo agregado con éxito.',
          'success'
        );
      } catch (error) {
        console.error("Error al guardar el grupo: ", error);
        Swal.fire(
          'Error',
          'Ocurrió un error al guardar el nuevo grupo.',
          'error'
        );
      }
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar que todos los archivos tengan un nombre
    const archivoSinNombre = otrosArchivos.find(
        (archivo) => archivo.archivo && !archivo.nombreArchivo.trim()
    );

    if (archivoSinNombre) {
        Swal.fire(
            'Error',
            `El archivo ${archivoSinNombre.archivo.name || 'sin nombre'} no tiene un nombre asignado. Por favor, ingrese un nombre.`,
            'error'
        );
        return;
    }

    try {
        let archivos = {};

        // Subir convenio de pago
        if (convenioPagoFile) {
            const storageRef = ref(
                storage,
                `convenios/${convenioPagoFile.name}`
            );
            await uploadBytes(storageRef, convenioPagoFile);
            const downloadURL = await getDownloadURL(storageRef);
            archivos['convenioPago'] = downloadURL;
        }

        // Subir otros archivos
        for (let i = 0; i < otrosArchivos.length; i++) {
            const archivoObj = otrosArchivos[i];
            if (archivoObj.archivo) {
                const storageRef = ref(
                    storage,
                    `otros/${archivoObj.archivo.name}`
                );
                await uploadBytes(storageRef, archivoObj.archivo);
                const downloadURL = await getDownloadURL(storageRef);
                archivos[archivoObj.nombreArchivo] = downloadURL;
            }
        }

        // Guardar en Firestore
        const dataToSave = { ...formData, archivos }; // La dirección ya está incluida en formData
        const docRef = await addDoc(
            collection(db, "nuevosclientes"),
            dataToSave
        );
        console.log(
            "Cliente registrado con ID: ",
            docRef.id
        );
        Swal.fire(
            'Éxito',
            'Cliente registrado exitosamente.',
            'success'
        );
        setFormData({
            nombres: '',
            apellidos: '',
            cedula: '',
            correo: '',
            telefonoFijo: '',
            celular: '',
            salario: 0,
            multiplicadorSalario: 1,
            plazoMeses: 0,
            cuotaMensual: 0,
            grupo: "",
            direccion: '', // Resetear dirección
        });
        setConvenioPagoFile(null);
        setOtrosArchivos([
            { nombreArchivo: '', archivo: null }
        ]);
    } catch (error) {
        console.error(
            "Error al guardar el cliente: ",
            error
        );
        Swal.fire(
            'Error',
            'Ocurrió un error al registrar el cliente.',
            'error'
        );
    }
};



  const handleEditarSalario = () => {
    setEditandoSalario(true);
  };

  const handleGuardarSalario = () => {
    const nuevoSalario = parseInt(formData.salario, 10);
    if (!isNaN(nuevoSalario) && nuevoSalario > 0) {
      setSalarioMinimo(nuevoSalario);
      setEditandoSalario(false);
      setFormData((prev) => ({
        ...prev,
        salario: nuevoSalario * prev.multiplicadorSalario,
      }));
    }
  };

  const bootstrapInputStyle = {
    display: 'block',
    width: '100%',
    padding: '.375rem .75rem',
    fontSize: '1rem',
    lineHeight: '1.5',
    color: '#495057',
    backgroundColor: '#fff',
    backgroundClip: 'padding-box',
    border: '1px solid #ced4da',
    borderRadius: '.25rem',
    transition:
      'border-color .15s ease-in-out,box-shadow .15s ease-in-out'
  };

  return (
    <form
  onSubmit={handleSubmit}
  className="formulario-inscripcion"
  style={{
    display: 'flex',
    
 
    alignItems: 'center',
 
 
  }}
>

      <h2>Inscripción de Cliente</h2>

      {/* Bloque de salario mínimo y grupo */}
      <div
        className="salario-minimo"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div>
          <h3>
            Aporte costos Operativos
            <span>
              ${salarioMinimo.toLocaleString('es-CO')}
            </span>
            <span
              className="editar-salario-icono"
              onClick={handleEditarSalario}
              style={{
                cursor: 'pointer',
                marginLeft: '10px'
              }}
            >
              🖉
            </span>
          </h3>
          {editandoSalario && (
            <div className="editar-salario">
              <input
                type="number"
                value={salarioMinimo}
                onChange={(e) =>
                  setSalarioMinimo(parseInt(e.target.value))
                }
                className="editar-salario-input"
                style={bootstrapInputStyle}
              />
              <button
                type="button"
                onClick={handleGuardarSalario}
                className="guardar-salario-boton"
              >
                Guardar
              </button>
            </div>
          )}
        </div>
        {/* Campo de selección de grupo */}
        <div
          className="form-group"
          style={{ marginLeft: '20px' }}
        >
          <label htmlFor="grupo">Grupo:</label>
          <select
            id="grupo"
            name="grupo"
            value={formData.grupo}
            onChange={handleGrupoChange}
            required
            style={{
              padding: '.375rem .75rem',
              borderRadius: '.25rem',
              border: '1px solid #ced4da',
              backgroundColor: '#fff',
              backgroundImage:
                `url("data:image/svg+xml,%3Csvg viewBox='0 0 4 5' ` +
                `xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M2 ` +
                `0L0 2h4L2 0z' fill='%23343a40'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right .75rem center',
              backgroundSize: '8px 10px',
              appearance: 'none',
              width: '200px',
            }}
          >
            <option value="">
              Seleccione un grupo
            </option>
            {grupos.map((grupo, index) => (
              <option key={index} value={grupo}>
                {grupo}
              </option>
            ))}
            <option value="nueva-opcion">
              Nueva Opción
            </option>
          </select>
        </div>
      </div>

      {/* Mostrar input para nuevo grupo si se selecciona "nueva-opcion" */}
      {formData.grupo === "nueva-opcion" && (
        <div className="form-group">
          <label htmlFor="nuevoGrupo">
            Nuevo Grupo:
          </label>
          <input
            type="text"
            id="nuevoGrupo"
            value={nuevoGrupo}
            onChange={(e) =>
              setNuevoGrupo(e.target.value)
            }
            placeholder="Ingrese el nuevo grupo"
            style={bootstrapInputStyle}
          />
          <button
            type="button"
            onClick={handleNuevoGrupoSubmit}
            disabled={nuevoGrupo.trim() === ""}
          >
            Guardar Nuevo Grupo
          </button>
        </div>
      )}

      {/* Mostrar último pago recibido */}
      {ultimoPago && (
        <div className="ultimo-pago">
          <h3>Último Pago Recibido</h3>
          <p>
            <strong>Fecha:</strong>
            {new Date(ultimoPago.fecha)
              .toLocaleDateString()}
          </p>
          <p>
            <strong>Monto:</strong>
            ${ultimoPago.monto
              .toLocaleString('es-CO')}
          </p>
          <p>
            <strong>Descripción:</strong>
            {ultimoPago.descripcion}
          </p>
        </div>
      )}

      {/* Resto del formulario */}
      <div className="form-group half-width">
        <label htmlFor="nombres">Nombres:</label>
        <input
          type="text"
          id="nombres"
          name="nombres"
          value={formData.nombres}
          onChange={handleChange}
          required
          style={bootstrapInputStyle}
        />
      </div>

      <div className="form-group half-width">
        <label htmlFor="apellidos">Apellidos:</label>
        <input
          type="text"
          id="apellidos"
          name="apellidos"
          value={formData.apellidos}
          onChange={handleChange}
          required
          style={bootstrapInputStyle}
        />
      </div>

      <div className="form-group half-width">
        <label htmlFor="cedula">Cédula:</label>
        <input
          type="text"
          id="cedula"
          name="cedula"
          value={formData.cedula}
          onChange={handleChange}
          required
          style={bootstrapInputStyle}
        />
      </div>

      <div className="form-group half-width">
        <label htmlFor="correo">
          Correo Electrónico:
        </label>
        <input
          type="email"
          id="correo"
          name="correo"
          value={formData.correo}
          onChange={handleChange}
          required
          style={bootstrapInputStyle}
        />
      </div>

      <div className="form-group half-width">
        <label htmlFor="telefonoFijo">
          Teléfono Fijo:
        </label>
        <input
          type="tel"
          id="telefonoFijo"
          name="telefonoFijo"
          value={formData.telefonoFijo}
          onChange={handleChange}
          style={bootstrapInputStyle}
        />
      </div>

      <div className="form-group half-width">
        <label htmlFor="celular">Celular:</label>
        <input
          type="tel"
          id="celular"
          name="celular"
          value={formData.celular}
          onChange={handleChange}
          required
          style={bootstrapInputStyle}
        />
      </div>

      <div className="form-group half-width">
        <label htmlFor="multiplicadorSalario">
          Multiplicador de Salario Mínimo:
        </label>
        <input
          type="number"
          id="multiplicadorSalario"
          name="multiplicadorSalario"
          min="1"
          max="10"
          value={formData.multiplicadorSalario}
          onChange={handleChange}
          required
          style={bootstrapInputStyle}
        />
      </div>

      <div className="form-group half-width">
        <label htmlFor="salario">
          Salario a Cancelar:
        </label>
        <input
          type="number"
          id="salario"
          name="salario"
          value={formData.salario}
          onChange={handleChange}
          readOnly
          style={bootstrapInputStyle}
        />
      </div>

      <div className="form-group half-width">
        <label htmlFor="plazoMeses">
          Plazo en Meses:
        </label>
        <input
          type="number"
          id="plazoMeses"
          name="plazoMeses"
          value={formData.plazoMeses}
          onChange={handleChange}
          required
          style={bootstrapInputStyle}
        />
      </div>

      <div className="form-group half-width">
        <label>Cuota Mensual:</label>
        <input
          type="text"
          value={`$${formData.cuotaMensual}`}
          readOnly
          style={bootstrapInputStyle}
        />
      </div>
      <div className="form-group">
    <label htmlFor="direccion">Dirección:</label>
    <input
        type="text"
        id="direccion"
        name="direccion"
        value={formData.direccion}
        onChange={handleChange}
        required
        style={bootstrapInputStyle}
        placeholder="Ingrese la dirección del cliente"
    />
</div>

      {/* Nuevos inputs para archivos */}
      <div
        className="form-group"
        style={{
          display: 'flex',
          justifyContent: 'space-between'
        }}
      >
        {/* Input para 'Carga Convenio de Pago' */}
        <div style={{ flex: '0 0 48%' }}>
          <label htmlFor="convenioPagoFile">
            Carga Convenio de Pago:
          </label>
          <input
            type="file"
            id="convenioPagoFile"
            name="convenioPagoFile"
            onChange={(e) =>
              setConvenioPagoFile(e.target.files[0])
            }
            style={bootstrapInputStyle}
          />
        </div>

        {/* Inputs dinámicos para otros archivos */}
        <div style={{ flex: '0 0 48%' }}>
          <label>Otros Archivos:</label>
          {otrosArchivos.map((archivo, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '5px'
              }}
            >
              <input
                type="text"
                placeholder="Nombre del Archivo"
                value={archivo.nombreArchivo}
                onChange={(e) => {
                  const newOtrosArchivos = [...otrosArchivos];
                  newOtrosArchivos[index].nombreArchivo = e.target.value;
                  setOtrosArchivos(newOtrosArchivos);
                }}
                style={{
                  marginRight: '5px',
                  ...bootstrapInputStyle
                }}
              />
              <input
                type="file"
                onChange={(e) => {
                  const newOtrosArchivos = [...otrosArchivos];
                  newOtrosArchivos[index].archivo = e.target.files[0];
                  setOtrosArchivos(newOtrosArchivos);
                }}
                style={{
                  marginRight: '5px',
                  ...bootstrapInputStyle
                }}
              />
              {index === otrosArchivos.length - 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setOtrosArchivos([
                      ...otrosArchivos,
                      { nombreArchivo: '', archivo: null }
                    ])
                  }
                  style={{ marginLeft: '5px' }}
                >
                  +
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <button
  type="submit"
  style={{
    marginTop: '20px', // Espacio superior del botón
    padding: '10px 15px',
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    width: '100%',
    maxWidth: '300px', // Limitar el ancho del botón
    alignSelf: 'center', // Centrar el botón horizontalmente
  }}
>
  Registrar Cliente
</button>


    </form>
  );
};

export default FormularioInscripcionCliente;
