import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import './TablaPrimerasMesadas.css';

const TablaPrimerasMesadas = () => {
  const facturas = useSelector((state) => state.pensiones.pensiones) || [];
  const { usuarioSeleccionado } = useSelector((state) => state.pensiones);
  const [mesadasAnuales, setMesadasAnuales] = useState([]);
  const [fechaCertificado, setFechaCertificado] = useState('');
  const [fechaInicioPension, setFechaInicioPension] = useState(null);
  const printRef = useRef();

  useEffect(() => {
    const obtenerMesadas = () => {
      const facturasPorAño = {};

      const facturasOrdenadas = [...facturas].sort((a, b) => {
        const fechaA = new Date(
          `${a.año}-${obtenerMesDePeriodoPago(a.periodoPago).mesNumero}-01`
        );
        const fechaB = new Date(
          `${b.año}-${obtenerMesDePeriodoPago(b.periodoPago).mesNumero}-01`
        );
        return fechaA - fechaB;
      });

      const primeraFactura = facturasOrdenadas.find((factura) =>
        factura.detalles.some((detalle) => detalle.nombre === 'Mesada Pensional')
      );

      if (primeraFactura) {
        const { mesNombre } = obtenerMesDePeriodoPago(primeraFactura.periodoPago);
        setFechaInicioPension({
          año: primeraFactura.año,
          mes: mesNombre,
        });
      }

      facturasOrdenadas.forEach((factura) => {
        const year = factura.año;
        const { mesNumero } = obtenerMesDePeriodoPago(factura.periodoPago);
        const mesadaPensional = factura.detalles.find(
          (detalle) => detalle.nombre === 'Mesada Pensional'
        )?.ingresos || null;

        if (mesadaPensional !== null) {
          if (!facturasPorAño[year]) {
            facturasPorAño[year] = [];
          }
          facturasPorAño[year].push({
            mesNumero: parseInt(mesNumero, 10),
            valor: mesadaPensional,
          });
        }
      });

      const resultadoBase = Object.keys(facturasPorAño)
        .map((year) => {
          const pagosDelAño = facturasPorAño[year].sort((a, b) => a.mesNumero - b.mesNumero);
          const eneroValor = pagosDelAño[0]?.valor || null;
          const diciembreValor = pagosDelAño[pagosDelAño.length - 1]?.valor || null;

          let variacionPesos = null;
          let variacionPorcentaje = null;
          if (eneroValor !== null && diciembreValor !== null && eneroValor !== 0) {
            variacionPesos = diciembreValor - eneroValor;
            variacionPorcentaje = ((variacionPesos / eneroValor) * 100).toFixed(2);
          }

          return {
            año: parseInt(year, 10),
            enero: eneroValor,
            diciembre: diciembreValor,
            variacionPesos,
            variacionPorcentaje,
          };
        })
        .sort((a, b) => a.año - b.año);

      const resultadoConComparacionAnterior = resultadoBase.map((item, index) => {
        const anterior = resultadoBase[index - 1];
        if (anterior && anterior.enero !== null && item.enero !== null && anterior.enero !== 0) {
          const variacionPesosAnterior = item.enero - anterior.enero;
          const variacionPorcentajeAnterior = ((variacionPesosAnterior / anterior.enero) * 100).toFixed(2);
          return {
            ...item,
            variacionPesosAnterior,
            variacionPorcentajeAnterior,
          };
        } else {
          return {
            ...item,
            variacionPesosAnterior: null,
            variacionPorcentajeAnterior: null,
          };
        }
      });

      setMesadasAnuales(resultadoConComparacionAnterior);
    };

    const obtenerFechaActual = () => {
      const fecha = new Date();
      const opciones = { year: 'numeric', month: 'long', day: 'numeric' };
      const fechaFormateada = fecha.toLocaleDateString('es-CO', opciones);
      setFechaCertificado(fechaFormateada);
    };

    obtenerMesadas();
    obtenerFechaActual();
  }, [facturas]);

  const obtenerMesDePeriodoPago = (periodoPago) => {
    if (!periodoPago || typeof periodoPago !== 'string') {
      return { mesNumero: '', mesNombre: '' };
    }

    const meses = {
      ene: '01',
      feb: '02',
      mar: '03',
      abr: '04',
      may: '05',
      jun: '06',
      jul: '07',
      ago: '08',
      sep: '09',
      sept: '09',
      oct: '10',
      nov: '11',
      dic: '12',
    };
    const nombresMeses = {
      ene: 'Enero',
      feb: 'Febrero',
      mar: 'Marzo',
      abr: 'Abril',
      may: 'Mayo',
      jun: 'Junio',
      jul: 'Julio',
      ago: 'Agosto',
      sep: 'Septiembre',
      sept: 'Septiembre',
      oct: 'Octubre',
      nov: 'Noviembre',
      dic: 'Diciembre',
    };

    const regex = /([a-z]{3,4})\.?/gi;
    const matches = periodoPago.toLowerCase().match(regex);

    if (matches && matches.length > 0) {
      const mesAbreviado = matches[0].replace('.', '').replace(/[^a-z]/g, '');
      return { mesNumero: meses[mesAbreviado], mesNombre: nombresMeses[mesAbreviado] };
    }

    return { mesNumero: '', mesNombre: '' };
  };

  const handleGeneratePDF = async () => {
    const element = printRef.current;
    if (element) {
      const canvas = await html2canvas(element, { scale: 1, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const marginLeft = 0;
      const marginTop = 0;
      const usableWidth = pageWidth - marginLeft * 2;
      const usableHeight = pageHeight - marginTop * 2;

      let imgWidth = usableWidth;
      let imgHeight = (canvas.height * imgWidth) / canvas.width;

      if (imgHeight > usableHeight) {
        const scaleFactor = usableHeight / imgHeight;
        imgWidth *= scaleFactor;
        imgHeight *= scaleFactor;
      }

      const centeredX = (pageWidth - imgWidth) / 2;

      pdf.addImage(imgData, 'PNG', centeredX, marginTop, imgWidth, imgHeight);
      pdf.save('certificado_mesadas_pensionales.pdf');
    }
  };

  const formatoMoneda = (valor) => {
    if (valor == null || valor === '') return '$ 0';
    const numero = parseFloat(valor.toString().replace(/[^0-9.-]+/g, '').replace(',', '.'));
    if (isNaN(numero)) return '$ 0';
    return numero.toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    });
  };

  return (
    <div className="tabla-primeras-mesadas-contenedor">
      <button className="boton-descargar" onClick={handleGeneratePDF}>Descargar PDF</button>
      <div ref={printRef} className="tabla-primeras-mesadas">
        <h1 className="certificado-titulo">Certificado de Mesadas Pensionales</h1>
        <h4 className="certificado-titulo">DAJUSTICIA SAS</h4>
        <p className="certificado-fecha">Fecha de emisión: {fechaCertificado}</p>

        {usuarioSeleccionado && fechaInicioPension ? (
          <div className="certificado-texto">
        <p>
  Se certifica que, de acuerdo con la información y documentación suministrada y verificada, la persona&nbsp;<strong>{usuarioSeleccionado.nombre}</strong>, identificada con cédula de ciudadanía N°&nbsp;<strong>{usuarioSeleccionado.documento}</strong>, se encuentra reconocida como pensionado(a) de ELECTRICARIBE S.A. E.S.P. (sustituida procesalmente por FIDUPREVISORA S.A., como administradora y vocera del Patrimonio Autónomo Fondo Nacional del Pasivo Pensional y Prestacional de la Electrificadora del Caribe S.A. E.S.P. - FONECA).  Su pensión fue reconocida el {fechaInicioPension ? `${fechaInicioPension.mes} de ${fechaInicioPension.año}` : " [Fecha de reconocimiento de la pensión]"}. A continuación, se detallan los valores anuales de su mesada pensional registrados desde {fechaInicioPension && fechaInicioPension.año ? fechaInicioPension.año : "el año inicial"}:
</p>

           
          </div>
        ) : (
          <p className="certificado-texto">Cargando datos del pensionado...</p>
        )}

        <table>
          <thead>
            <tr>
              <th>Año</th>
              <th>Mesada en Enero (Primer pago)</th>
              <th>Mesada en Diciembre (Último pago)</th>
              <th>Variación vs Año Anterior (COP)</th>
              <th>Variación vs Año Anterior (%)</th>
            </tr>
          </thead>
          <tbody>
            {mesadasAnuales.map((item) => (
              <tr key={item.año}>
                <td>{item.año}</td>
                <td>{formatoMoneda(item.enero)}</td>
                <td>{formatoMoneda(item.diciembre)}</td>
                <td>{item.variacionPesosAnterior !== null ? formatoMoneda(item.variacionPesosAnterior) : '-'}</td>
                <td>{item.variacionPorcentajeAnterior !== null ? `${item.variacionPorcentajeAnterior}%` : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="certificado-firma">
        Que, de conformidad con las normas vigentes y Convención Colectiva de Trabajo, la pensión de jubilación se compartió con el Instituto de Seguros Sociales (hoy Colpensiones) a partir del (día) de (mes) de (año) en los siguientes términos:
{/* Año:
Pensión de Jubilación año ():
 Pensión de Vejez año ():
Mayor valor mesada: $  */}
<br />
Este certificado se expide a solicitud de la parte interesada para los fines legales y administrativos a los que haya lugar.
        </p>
      </div>
    </div>
  );
};

export default TablaPrimerasMesadas;
