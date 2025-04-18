import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { collection, addDoc, getDocs } from "firebase/firestore";
import Swal from 'sweetalert2';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

import './FormularioInscripcionCliente.css';  // Asegúrate de importar tu CSS
import { db, storage } from '../firebase/firebaseConfig';

const FormularioInscripcionCliente = () => {
  const usuarioSeleccionado = useSelector((state) => state.pensiones.usuarioSeleccionado);
  const pagos = useSelector((state) => state.contabilidad.pagos);

  const [salarioMinimo, setSalarioMinimo] = useState(1300000);
  const [editandoSalario, setEditandoSalario] = useState(false);
 
  const [nuevoGrupo, setNuevoGrupo] = useState("");
  const [grupos, setGrupos] = useState([]);

  useEffect(() => {
    const cargarGrupos = async () => {
      const gruposSnapshot = await getDocs(collection(db, "grupos"));
      const gruposFirebase = gruposSnapshot.docs.map((doc) => doc.data().nombre);
      // Asignar directamente lo que viene de la BD:
      setGrupos(gruposFirebase);
    };
    cargarGrupos();
  }, []);
  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    cedula: '',
    correo: '',
    telefonoFijo: '',
    celular: '',
    salario: 1300000 * 2, 
    multiplicadorSalario: 2,
    plazoMeses: 0,
    cuotaMensual: 0,
    grupo: "",
    direccion: '',
  });

  const [convenioPagoFile, setConvenioPagoFile] = useState(null);
  const [otrosArchivos, setOtrosArchivos] = useState([{ nombreArchivo: '', archivo: null }]);

  const ultimoPago = pagos
    .filter((pago) => pago.clienteId === usuarioSeleccionado?.id)
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))[0];

  const extraerDatos = (nombreCompleto) => {
    const nombreRegex = /(.*)\s([A-Z]+)\s\((?:C\.C\.\s)?(\d+)\)/;
    const match = nombreCompleto?.match(nombreRegex);
    if (match) {
      const apellidos = match[1].split(' ').slice(0, -1).join(' ');
      const nombres = match[1].split(' ').slice(-1).join(' ');
      const cedula = match[3];
      return { nombres, apellidos, cedula };
    }
    return { nombres: '', apellidos: '', cedula: '' };
  };

  const calcularCuota = (salario, plazoMeses) => {
    if (salario > 0 && plazoMeses > 0) {
      return (salario / plazoMeses).toFixed(2);
    }
    return 0;
  };

  useEffect(() => {
    if (usuarioSeleccionado) {
      const { nombres, apellidos, cedula } = extraerDatos(usuarioSeleccionado.nombre || '');
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
    let updatedForm = { ...formData, [name]: value };

    if (name === 'multiplicadorSalario') {
      const multiplicador = Number(value);
      const nuevoSalario = salarioMinimo * multiplicador;
      updatedForm.salario = nuevoSalario;
      updatedForm.cuotaMensual = calcularCuota(nuevoSalario, Number(updatedForm.plazoMeses));
    }

    if (name === 'plazoMeses') {
      updatedForm.cuotaMensual = calcularCuota(Number(formData.salario), Number(value));
    }

    if (name === 'salario') {
      updatedForm.salario = Number(value);
    }

    setFormData(updatedForm);
  };

 

  const handleGrupoChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      grupo: e.target.value,
    }));
  };

  const handleNuevoGrupoSubmit = async () => {
    if (nuevoGrupo.trim() !== "") {
      try {
        await addDoc(collection(db, "grupos"), { nombre: nuevoGrupo });
        setGrupos((prev) => [...prev, nuevoGrupo]);
        setFormData((prev) => ({
          ...prev,
          grupo: nuevoGrupo,
        }));
        setNuevoGrupo("");
        Swal.fire('Éxito', 'Nuevo grupo agregado con éxito.', 'success');
      } catch (error) {
        console.error("Error al guardar el grupo: ", error);
        Swal.fire('Error', 'Ocurrió un error al guardar el nuevo grupo.', 'error');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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

      if (convenioPagoFile) {
        const storageRef = ref(storage, `convenios/${convenioPagoFile.name}`);
        await uploadBytes(storageRef, convenioPagoFile);
        const downloadURL = await getDownloadURL(storageRef);
        archivos['convenioPago'] = downloadURL;
      }

      for (let i = 0; i < otrosArchivos.length; i++) {
        const archivoObj = otrosArchivos[i];
        if (archivoObj.archivo) {
          const storageRef = ref(storage, `otros/${archivoObj.archivo.name}`);
          await uploadBytes(storageRef, archivoObj.archivo);
          const downloadURL = await getDownloadURL(storageRef);
          archivos[archivoObj.nombreArchivo] = downloadURL;
        }
      }

      const dataToSave = { ...formData, archivos };
      const docRef = await addDoc(collection(db, "nuevosclientes"), dataToSave);
      console.log("Cliente registrado con ID: ", docRef.id);
      Swal.fire('Éxito', 'Cliente registrado exitosamente.', 'success');

      setFormData({
        nombres: '',
        apellidos: '',
        cedula: '',
        correo: '',
        telefonoFijo: '',
        celular: '',
        salario: salarioMinimo * 2,
        multiplicadorSalario: 2,
        plazoMeses: 0,
        cuotaMensual: 0,
        grupo: "",
        direccion: '',
      });
      setConvenioPagoFile(null);
      setOtrosArchivos([{ nombreArchivo: '', archivo: null }]);
    } catch (error) {
      console.error("Error al guardar el cliente: ", error);
      Swal.fire('Error', 'Ocurrió un error al registrar el cliente.', 'error');
    }
  };

  const handleEditarSalario = () => {
    setEditandoSalario(true);
  };

  const handleGuardarSalario = () => {
    const nuevoAporte = Number(document.getElementById("aporteInput").value);
    if (!isNaN(nuevoAporte) && nuevoAporte > 0) {
      setSalarioMinimo(nuevoAporte);
      setEditandoSalario(false);
      setFormData((prev) => ({
        ...prev,
        salario: nuevoAporte * prev.multiplicadorSalario,
      }));
    }
  };

  return (
    <div id="formulario-inscripcion" className="formulario-inscripcion">
      <h2>Inscripción de Cliente</h2>

      {/* Aporte y Grupo en dos columnas */}
      <div className="formulario-grid">
        <div className="form-group">
          <label>Aporte Costos Operativos:</label>
          <div className="input-container">
            <span className="valor-texto">
              ${salarioMinimo.toLocaleString('es-CO')}
            </span>
            <span
              className="editar-icono"
              onClick={handleEditarSalario}
              title="Editar Aporte"
            >
              🖉
            </span>
          </div>
          {editandoSalario && (
            <div className="input-editar">
              <input
                type="number"
                id="aporteInput"
                defaultValue={salarioMinimo}
              />
              <button type="button" onClick={handleGuardarSalario}>
                Guardar
              </button>
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="grupo">Grupo:</label>
          <select
            id="grupo"
            name="grupo"
            value={formData.grupo}
            onChange={handleGrupoChange}
            required
          >
            <option value="">Seleccione un grupo</option>
            {grupos.map((grupo, index) => (
              <option key={index} value={grupo}>
                {grupo.toUpperCase()}
              </option>
            ))}
            <option value="nueva-opcion">NUEVA OPCIÓN</option>
          </select>
        </div>
      </div>

      {/* Nuevo Grupo (opcional) */}
      {formData.grupo === "nueva-opcion" && (
        <div className="form-group">
          <label htmlFor="nuevoGrupo">Nuevo Grupo:</label>
          <input
            type="text"
            id="nuevoGrupo"
            value={nuevoGrupo}
            onChange={(e) => setNuevoGrupo(e.target.value)}
            placeholder="Ingrese el nuevo grupo"
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

      {/* Último Pago Recibido */}
      {ultimoPago && (
        <div className="form-group full-width">
          <h4>Último Pago Recibido</h4>
          <p><strong>Fecha:</strong> {new Date(ultimoPago.fecha).toLocaleDateString()}</p>
          <p><strong>Monto:</strong> ${ultimoPago.monto.toLocaleString('es-CO')}</p>
          <p><strong>Descripción:</strong> {ultimoPago.descripcion}</p>
        </div>
      )}

      {/* Campos del formulario en dos columnas */}
      <div className="formulario-grid">
        <div className="form-group">
          <label htmlFor="nombres">Nombres:</label>
          <input
            type="text"
            id="nombres"
            name="nombres"
            value={formData.nombres}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="apellidos">Apellidos:</label>
          <input
            type="text"
            id="apellidos"
            name="apellidos"
            value={formData.apellidos}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="cedula">Cédula:</label>
          <input
            type="text"
            id="cedula"
            name="cedula"
            value={formData.cedula}
            onChange={handleChange}
            required
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
            placeholder="Ingrese la dirección del cliente"
          />
        </div>

        <div className="form-group">
          <label htmlFor="correo">Correo Electrónico:</label>
          <input
            type="email"
            id="correo"
            name="correo"
            value={formData.correo}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="telefonoFijo">Teléfono Fijo:</label>
          <input
            type="tel"
            id="telefonoFijo"
            name="telefonoFijo"
            value={formData.telefonoFijo}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="celular">Celular:</label>
          <input
            type="tel"
            id="celular"
            name="celular"
            value={formData.celular}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="multiplicadorSalario">Multiplicador de Salario Mínimo:</label>
          <input
            type="number"
            id="multiplicadorSalario"
            name="multiplicadorSalario"
            min="1"
            max="10"
            value={formData.multiplicadorSalario}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="salario">Salario a Cancelar:</label>
          <input
            type="number"
            id="salario"
            name="salario"
            value={formData.salario}
            onChange={handleChange}
            style={{ background: '#f0f0f0' }}
          />
        </div>

        <div className="form-group">
          <label htmlFor="plazoMeses">Plazo en Meses:</label>
          <input
            type="number"
            id="plazoMeses"
            name="plazoMeses"
            value={formData.plazoMeses}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Cuota Mensual:</label>
          <input
            type="text"
            value={`$${formData.cuotaMensual}`}
            readOnly
            style={{ background: '#f0f0f0' }}
          />
        </div>

        <div className="form-group">
          <label htmlFor="convenioPagoFile">Carga Convenio de Pago:</label>
          <input
            type="file"
            id="convenioPagoFile"
            name="convenioPagoFile"
            onChange={(e) => setConvenioPagoFile(e.target.files[0])}
          />
        </div>

        {/* <div className="form-group">
  <label>Otros Archivos:</label>
 
  <div className="otros-archivo-container">
    {otrosArchivos.map((archivo, index) => (
      <div key={index} className="otros-archivo-col">
        <input
          type="text"
          placeholder="Nombre del Archivo"
          value={archivo.nombreArchivo}
          onChange={(e) => {
            const newOtros = [...otrosArchivos];
            newOtros[index].nombreArchivo = e.target.value;
            setOtrosArchivos(newOtros);
          }}
        />
        <input
          type="file"
          onChange={(e) => {
            const newOtros = [...otrosArchivos];
            newOtros[index].archivo = e.target.files[0];
            setOtrosArchivos(newOtros);
          }}
        />
        {index === otrosArchivos.length - 1 && (
          <button
            type="button"
            onClick={() =>
              setOtrosArchivos([...otrosArchivos, { nombreArchivo: '', archivo: null }])
            }
          >
            +
          </button>
        )}
      </div>
    ))}
  </div>
</div> */}

      </div>

      <button type="submit" className="submit-button" onClick={handleSubmit}>
        Registrar Cliente
      </button>
    </div>
  );
};

export default FormularioInscripcionCliente;
