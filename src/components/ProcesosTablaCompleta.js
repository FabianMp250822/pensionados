import React, { useEffect, useState, useMemo } from 'react';
import Select from 'react-select';
import { utils, write } from 'xlsx';
import { saveAs } from 'file-saver';
import axios from 'axios';
import './TablaProcesosCompleta.css';

const ProcesosTabla = ({ procesos, demandantes }) => (
  <div className="tabla-procesos-scroll">
    <table className="tabla-procesos">
      <thead>
        <tr>
          <th># Registro</th>
          <th>Fecha Creación</th>
          <th># Carpeta</th>
          <th>Despacho</th>
          <th># Radicado Inicial</th>
          <th>Fecha Radicado Inicial</th>
          <th>Radicado Tribunal</th>
          <th>Magistrado</th>
          <th>Jurisdicción</th>
          <th>Clase Proceso</th>
          <th>Estado</th>
          <th>Identidad Clientes</th>
          <th>Nombres Demandante</th>
          <th>Nombres Demandado</th>
          <th>Negocio</th>
          <th>Identidad Abogados</th>
          <th>Nombres Apoderado</th>
          <th># Radicado Último</th>
          <th>Radicado Corte</th>
          <th>Magistrado Corte</th>
          <th>Casación</th>
          <th>Demandantes</th>
        </tr>
      </thead>
      <tbody>
        {procesos.map((proceso) => (
          <tr key={proceso.num_registro}>
            <td>{proceso.num_registro}</td>
            <td>{proceso.fecha_creacion}</td>
            <td>{proceso.num_carpeta}</td>
            <td>{proceso.despacho}</td>
            <td>{proceso.num_radicado_ini}</td>
            <td>{proceso.fecha_radicado_ini}</td>
            <td>{proceso.radicado_tribunal}</td>
            <td>{proceso.magistrado}</td>
            <td>{proceso.jurisdiccion}</td>
            <td>{proceso.clase_proceso}</td>
            <td>{proceso.estado}</td>
            <td>{proceso.identidad_clientes}</td>
            <td>{proceso.nombres_demandante}</td>
            <td>{proceso.nombres_demandado}</td>
            <td>{proceso.negocio}</td>
            <td>{proceso.identidad_abogados}</td>
            <td>{proceso.nombres_apoderado}</td>
            <td>{proceso.num_radicado_ult}</td>
            <td>{proceso.radicado_corte}</td>
            <td>{proceso.magistrado_corte}</td>
            <td>{proceso.casacion}</td>
            <td>
              {demandantes[proceso.num_registro] ? (
                <DemandantesTabla demandantes={demandantes[proceso.num_registro]} />
              ) : (
                <span className="loader">Cargando demandantes...</span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const DemandantesTabla = ({ demandantes }) => (
  <table className="tabla-demandantes">
    <thead>
      <tr>
        <th>Nombre</th>
        <th>Documento</th>
        <th>Teléfonos</th>
        <th>Dirección</th>
        <th>Correo</th>
      </tr>
    </thead>
    <tbody>
      {demandantes.map((demandante) => (
        <tr key={demandante.identidad_demandante}>
          <td>{demandante.nombre_demandante}</td>
          <td>{demandante.identidad_demandante}</td>
          <td>{demandante.telefonos}</td>
          <td>{demandante.direccion}</td>
          <td>{demandante.correo}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

const ProcesosTablaCompleta = () => {
  const [procesosOriginales, setProcesosOriginales] = useState([]);
  const [procesos, setProcesos] = useState([]);
  const [demandantes, setDemandantes] = useState({});
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const [negocioSearch, setNegocioSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState([]);

  const estadoOptions = useMemo(() => {
    const estadosUnicos = [
      ...new Set(procesosOriginales.map((proceso) => proceso.estado)),
    ].filter(Boolean);
    return estadosUnicos.map((estado) => ({ value: estado, label: estado }));
  }, [procesosOriginales]);

  useEffect(() => {
    const fetchProcesos = async () => {
      setCargando(true);
      try {
        const response = await axios.get(`https://appdajusticia.com/procesos.php?all=true`);
        setProcesosOriginales(response.data);
        setProcesos(response.data);

        const registrosUnicos = [...new Set(response.data.map((p) => p.num_registro))];
        const demandantesData = {};
        await Promise.all(
          registrosUnicos.map(async (numRegistro) => {
            try {
              const res = await axios.get(
                `https://appdajusticia.com/procesos.php?num_registro=${numRegistro}`
              );
              demandantesData[numRegistro] = res.data;
            } catch {
              demandantesData[numRegistro] = [];
            }
          })
        );
        setDemandantes(demandantesData);
      } catch (err) {
        setError('Error al cargar los datos');
      } finally {
        setCargando(false);
      }
    };
    fetchProcesos();
  }, []);

  const handleNegocioSearchChange = (e) => {
    setNegocioSearch(e.target.value);
    const filtered = procesosOriginales.filter((p) =>
      p.negocio?.toLowerCase().includes(e.target.value.toLowerCase())
    );
    setProcesos(filtered);
  };

  const handleEstadoChange = (selectedOptions) => {
    const values = selectedOptions.map((opt) => opt.value);
    setEstadoFilter(values);
    const filtered = procesosOriginales.filter((p) => values.includes(p.estado));
    setProcesos(filtered);
  };

  const exportarAExcel = () => {
    const wb = utils.book_new();
    const data = procesos.map((proceso) => ({
      '# Registro': proceso.num_registro,
      'Fecha Creación': proceso.fecha_creacion,
      'Estado': proceso.estado,
      Demandantes:
        demandantes[proceso.num_registro]?.map((d) => d.nombre_demandante).join(', ') || '',
    }));
    const ws = utils.json_to_sheet(data);
    utils.book_append_sheet(wb, ws, 'Procesos');
    const wbout = write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([wbout]), 'Procesos.xlsx');
  };

  return (
    <div className="tabla-procesos-completa-contenedor">
      <h1 className="titulo">Tbla de procesos y demandantes</h1>
      <div className="filtros">
        <input
          type="text"
          placeholder="Buscar por negocio..."
          value={negocioSearch}
          onChange={handleNegocioSearchChange}
        />
        <Select
          isMulti
          options={estadoOptions}
          onChange={handleEstadoChange}
          placeholder="Filtrar por estado"
        />
        <button onClick={exportarAExcel}>Exportar a Excel</button>
      </div>
      {cargando && <p>Cargando...</p>}
      {error && <p>{error}</p>}
      <ProcesosTabla procesos={procesos} demandantes={demandantes} />
    </div>
  );
};

export default ProcesosTablaCompleta;
