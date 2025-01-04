const functions = require("firebase-functions");
const nodemailer = require("nodemailer");
const admin = require("firebase-admin");

// Asegúrate de haber inicializado admin, por ejemplo:
admin.initializeApp();

exports.consultaPagos = functions.https.onRequest(async (req, res) => {
  // Manejo de CORS para solicitudes preflight (OPTIONS)
  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).send("");
  }

  // Configurar encabezados CORS para solicitudes reales
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  try {
    console.log("Solicitud recibida:", req.body);

    const {año, detalle} = req.body;
    if (!año || !detalle) {
      console.error("Parámetros faltantes:", {año, detalle});
      return res.status(400).json({
        ok: false,
        message: "Faltan parámetros 'año' y/o 'detalle'.",
      });
    }

    console.log(`Consultando pagos para el año ${año} y detalle "${detalle}"`);

    // Consulta Firestore por año
    const snapshot = await admin
        .firestore()
        .collectionGroup("pagos")
        .where("año", "==", año)
        .get();

    console.log("Documentos encontrados:", snapshot.size);

    // eslint-disable-next-line max-len
    // Filtrar documentos que contienen el detalle especificado en el array 'detalles'
    const filteredDocs = snapshot.docs.filter((docSnap) => {
      const data = docSnap.data();
      console.log("Documento leído:", data);
      const detallesArray = data.detalles || [];
      return detallesArray.some((item) => item.nombre === detalle);
    });

    console.log("Documentos después del filtrado:", filteredDocs.length);

    if (filteredDocs.length === 0) {
      return res.status(404).json({
        ok: false,
        // eslint-disable-next-line max-len
        message: `No se encontraron documentos con el año ${año} y detalle "${detalle}".`,
      });
    }

    // Obtener información adicional de cada pago
    const resultados = await Promise.all(
        filteredDocs.map(async (docSnap) => {
          const data = docSnap.data();
          const pensionadoRef = docSnap.ref.parent.parent;
          let nombrePensionado = null;

          if (pensionadoRef) {
            const pensionadoDoc = await pensionadoRef.get();
            if (pensionadoDoc.exists) {
              nombrePensionado =
              pensionadoDoc.data().empleado || "Nombre no definido";
            }
          }

          return {
            idPago: docSnap.id,
            nombrePensionado,
            ...data,
          };
        }),
    );

    console.log("Resultados enviados:", resultados);

    return res.status(200).json({
      ok: true,
      data: resultados,
    });
  } catch (error) {
    console.error("Error inesperado:", error);
    return res.status(500).json({
      ok: false,
      message: "Error interno al consultar los pagos.",
      error: error.message,
    });
  }
});


const transporterNotificaciones = nodemailer.createTransport({
  host: "smtp.hostinger.com",
  port: 587,
  secure: false,
  auth: {
    user: "noreply@tecnosalud.cloud",
    pass: "@V1g@1l250822",
  },
  tls: {
    rejectUnauthorized: false,
  },
});


exports.sendEmailNotificaciones =
functions.https.onRequest(async (req, res) => {
  // Manejar la solicitud OPTIONS para CORS (Preflight)
  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).send("");
  }

  // Ajustar CORS para el POST real
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  const {
    emailUsuario,
    nombreUsuario,
    montoPago,
    fechaPago,
    soporteURL,
    cedula,
    celular,
    cuotaMensual,
    plazoMeses,
    totalAPagar,
    totalPagado,
    deudaActual,
  } = req.body;

  const subject = "Recibo de Pago y Estado de Cuenta - Dajusticia";

  const mailOptions = {
    from: `"Dajusticia - Recibo de Pago" <noreply@tecnosalud.cloud>`,
    to: `noreply@tecnosalud.cloud, ${emailUsuario},
     director.dajusticia@gmail.com`,
    subject: subject,
    text: `
  Estimado(a) ${nombreUsuario},
  
  Le enviamos el detalle de su último pago y el estado actual de su cuenta:
  
  --------------------------------
  Datos del Usuario:
  - Nombre: ${nombreUsuario}
  - Cédula: ${cedula}
  - Celular: ${celular}
  
  Detalle del Pago:
  - Fecha del Pago: ${fechaPago}
  - Monto del Pago: $${montoPago}
  - Soporte: ${soporteURL ? soporteURL : "No disponible"}
  
  Estado de la Cuenta:
  - Cuota Mensual: $${cuotaMensual}
  - Plazo (Meses): ${plazoMeses}
  - Total a Pagar (contrato): $${totalAPagar}
  - Total Pagado a la fecha: $${totalPagado}
  - Deuda Actual: $${deudaActual}
  --------------------------------
  
  Gracias por su pago.
  Ante cualquier duda, contáctenos.
      `,
    html: `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>${subject}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            color: #333;
            background-color: #f5f5f5;
            margin: 0;
            padding: 20px;
          }
  
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: #fff;
            border: 1px solid #ddd;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
  
          .header {
            background: #ffffff;
            color: #ffffff;
            text-align: center;
            padding: 20px;
          }
  
          .header img {
            max-width: 150px;
            height: auto;
            margin-bottom: 10px;
          }
  
          .header h1 {
            margin: 0;
            font-size: 22px;
            font-weight: normal;
          }
  
          .section-title {
            background: #f2f2f2;
            text-align: center;
            padding: 10px;
            font-size: 18px;
            font-weight: bold;
          }
  
          table {
            width: 100%;
            border-collapse: collapse;
          }
  
          td {
            padding: 10px;
            border-bottom: 1px solid #ddd;
            vertical-align: top;
            font-size: 14px;
          }
  
          td.label {
            width: 40%;
            font-weight: bold;
            background: #fafafa;
          }
  
          td.value {
            width: 60%;
            background: #fff;
          }
  
          .footer {
            background: #1976d2;
            color: #ffffff;
            text-align: center;
            padding: 20px;
            font-size: 14px;
          }
  
          .footer p {
            margin: 5px 0;
          }
  
          a {
            color: #1976d2;
            text-decoration: none;
          }
  
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header" style="background:
           #ffffff; color: #000000; text-align: center; padding: 20px;">
  <img src="https://dajusticia.com/web/wp-content/uploads/2024/01/logo-dajusticia-8.png"
     alt="Dajusticia" style="max-width: 150px; height: auto;
      margin-bottom: 10px;" />
  <h1 style="margin: 0; font-size: 22px; font-weight:
   normal;">Recibo de Pago y Estado de Cuenta</h1>
</div>
  
          <div class="section-title">Estimado(a) ${nombreUsuario}</div>
          <p style="padding: 20px; margin: 0; text-align: center;">
            A continuación encontrará el detalle de
             su último pago y el estado actual de su cuenta.
          </p>
  
          <!-- Datos del Usuario -->
          <div class="section-title">Datos del Usuario</div>
          <table>
            <tr>
              <td class="label">Nombre:</td>
              <td class="value">${nombreUsuario}</td>
            </tr>
            <tr>
              <td class="label">Cédula:</td>
              <td class="value">${cedula}</td>
            </tr>
            <tr>
              <td class="label">Celular:</td>
              <td class="value">${celular}</td>
            </tr>
          </table>
  
          <!-- Detalle del Pago -->
          <div class="section-title">Detalle del Pago</div>
          <table>
            <tr>
              <td class="label">Fecha del Pago:</td>
              <td class="value">${fechaPago}</td>
            </tr>
            <tr>
              <td class="label">Monto del Pago:</td>
              <td class="value">$${montoPago}</td>
            </tr>
            <tr>
              <td class="label">Soporte del Pago:</td>
              <td class="value">${
                soporteURL ? `<a href="${soporteURL}" 
                target="_blank">Ver Soporte</a>` : "No disponible"
}</td>
            </tr>
          </table>
  
          <!-- Estado de la Cuenta -->
          <div class="section-title">Estado de la Cuenta</div>
          <table>
            <tr>
              <td class="label">Cuota Mensual:</td>
              <td class="value">$${cuotaMensual}</td>
            </tr>
            <tr>
              <td class="label">Plazo (Meses):</td>
              <td class="value">${plazoMeses}</td>
            </tr>
            <tr>
              <td class="label">Total a Pagar (contrato):</td>
              <td class="value">$${totalAPagar}</td>
            </tr>
            <tr>
              <td class="label">Total Pagado a la fecha:</td>
              <td class="value">$${totalPagado}</td>
            </tr>
            <tr>
              <td class="label">Deuda Actual:</td>
              <td class="value">$${deudaActual}</td>
            </tr>
          </table>
  
          <div class="footer" style="text-align:
           center; padding: 20px; font-size: 14px;">
  <p>Gracias por su pago.</p>
  <p>Le hemos enviado el detalle de su
   pago junto con el estado actual de su cuenta.</p>
  <p>Si tiene alguna pregunta o necesita asistencia, contáctenos.</p>
</div>
        </div>
      </body>
      </html>
      `,
  };

  try {
    const info = await transporterNotificaciones.sendMail(mailOptions);
    console.log("Mensaje enviado:", info.messageId);
    res.status(200).json({
      message: "Email enviado exitosamente",
      messageId: info.messageId,
    });
  } catch (error) {
    console.error("Error al enviar el email:", error);
    res.status(500).json({
      message: "Error al enviar el email",
      error: error.message,
    });
  }
});

