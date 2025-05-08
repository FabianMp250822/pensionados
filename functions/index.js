/* eslint-disable max-len */
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const {getFirestore} = require("firebase-admin/firestore");

// Inicialización del admin SDK
admin.initializeApp();
const db = getFirestore();
// Importar la API v2 para HTTPS y Firestore de Firebase Functions
const {onRequest} = require("firebase-functions/v2/https");
const {onDocumentCreated, onDocumentWritten} = require("firebase-functions/v2/firestore");

// ============================
// Configuración de Nodemailer
// ============================
const transporter = nodemailer.createTransport({
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

// ============================
// Función HTTP: consultaPagos
// (Se mantiene sin cambios)
// ============================
exports.consultaPagos = onRequest(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).send("");
  }
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
    const snapshot = await admin.firestore().collectionGroup("pagos").where("año", "==", año).get();
    console.log("Documentos encontrados:", snapshot.size);
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
        message: `No se encontraron documentos con el año ${año} y detalle "${detalle}".`,
      });
    }
    const resultados = await Promise.all(
        filteredDocs.map(async (docSnap) => {
          const data = docSnap.data();
          const pensionadoRef = docSnap.ref.parent.parent;
          let nombrePensionado = null;
          if (pensionadoRef) {
            const pensionadoDoc = await pensionadoRef.get();
            if (pensionadoDoc.exists) {
              nombrePensionado = pensionadoDoc.data().empleado || "Nombre no definido";
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

// ============================
// Función HTTP: sendEmail
// (Se mantiene sin cambios)
// ============================
exports.sendEmail = onRequest(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).send("");
  }
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
    to: `noreply@tecnosalud.cloud, ${emailUsuario}, director.dajusticia@gmail.com`,
    subject,
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
    body { font-family: Arial, sans-serif; color: #333; background-color: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
    .header { background: #ffffff; text-align: center; padding: 20px; }
    .header img { max-width: 150px; height: auto; margin-bottom: 10px; }
    .header h1 { margin: 0; font-size: 22px; font-weight: normal; }
    .section-title { background: #f2f2f2; text-align: center; padding: 10px; font-size: 18px; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 10px; border-bottom: 1px solid #ddd; vertical-align: top; font-size: 14px; }
    td.label { width: 40%; font-weight: bold; background: #fafafa; }
    td.value { width: 60%; background: #fff; }
    .footer { background: #1976d2; color: #ffffff; text-align: center; padding: 20px; font-size: 14px; }
    .footer p { margin: 5px 0; }
    a { color: #1976d2; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://dajusticia.com/web/wp-content/uploads/2024/01/logo-dajusticia-8.png" alt="Dajusticia" />
      <h1>Recibo de Pago y Estado de Cuenta</h1>
    </div>
    <div class="section-title">Estimado(a) ${nombreUsuario}</div>
    <p style="padding: 20px; text-align: center;">
      A continuación encontrará el detalle de su último pago y el estado actual de su cuenta.
    </p>
    <div class="section-title">Datos del Usuario</div>
    <table>
      <tr><td class="label">Nombre:</td><td class="value">${nombreUsuario}</td></tr>
      <tr><td class="label">Cédula:</td><td class="value">${cedula}</td></tr>
      <tr><td class="label">Celular:</td><td class="value">${celular}</td></tr>
    </table>
    <div class="section-title">Detalle del Pago</div>
    <table>
      <tr><td class="label">Fecha del Pago:</td><td class="value">${fechaPago}</td></tr>
      <tr><td class="label">Monto del Pago:</td><td class="value">$${montoPago}</td></tr>
      <tr>
        <td class="label">Soporte del Pago:</td>
        <td class="value">${soporteURL ? `<a href="${soporteURL}" target="_blank">Ver Soporte</a>` : "No disponible"}</td>
      </tr>
    </table>
    <div class="section-title">Estado de la Cuenta</div>
    <table>
      <tr><td class="label">Cuota Mensual:</td><td class="value">$${cuotaMensual}</td></tr>
      <tr><td class="label">Plazo (Meses):</td><td class="value">${plazoMeses}</td></tr>
      <tr><td class="label">Total a Pagar (contrato):</td><td class="value">$${totalAPagar}</td></tr>
      <tr><td class="label">Total Pagado a la fecha:</td><td class="value">$${totalPagado}</td></tr>
      <tr><td class="label">Deuda Actual:</td><td class="value">$${deudaActual}</td></tr>
    </table>
    <div class="footer">
      <p>Gracias por su pago.</p>
      <p>Si tiene alguna pregunta o necesita asistencia, contáctenos.</p>
    </div>
  </div>
</body>
</html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Mensaje enviado:", info.messageId);
    return res.status(200).json({
      message: "Email enviado exitosamente",
      messageId: info.messageId,
    });
  } catch (error) {
    console.error("Error al enviar el email:", error);
    return res.status(500).json({
      message: "Error al enviar el email",
      error: error.message,
    });
  }
});

// ============================
// Función HTTP: obtenerPensionadosConDependencia
// ============================
exports.obtenerPensionadosConDependencia = onRequest(async (req, res) => {
  try {
    const valorDependencia = "V3-GUAJIRA PENSIONADOS";
    const pensionadosRef = admin.firestore().collection("pensionados");
    const querySnapshot = await pensionadosRef.where("dependencia1", "==", valorDependencia).get();
    const pensionados = [];

    for (const doc of querySnapshot.docs) {
      const pensionadoData = doc.data();
      const pagosSnapshot = await doc.ref.collection("pagos").get();
      const pagos = pagosSnapshot.docs.map((pagoDoc) => ({
        id: pagoDoc.id,
        ...pagoDoc.data(),
      }));
      pensionados.push({
        id: doc.id,
        ...pensionadoData,
        pagos,
      });
    }

    return res.status(200).json({data: pensionados});
  } catch (error) {
    console.error("Error al obtener los pensionados:", error);
    return res.status(500).json({
      error: "Error al obtener los datos de los pensionados",
      message: error.message,
    });
  }
});

// ============================
// Función Firestore (Trigger): organizarPagosClientes
// ============================
exports.organizarPagosClientes = onDocumentWritten(
    "nuevosClientes/{clienteId}/pagos/{pagoId}",
    async (event) => {
      const {clienteId} = event.params;
      const pagosRef = admin.firestore().collection(`nuevosClientes/${clienteId}/pagos`);

      try {
        const pagosSnapshot = await pagosRef.get();
        if (pagosSnapshot.empty) {
          console.log("No se encontraron pagos para el cliente:", clienteId);
          return;
        }

        const pagosOrganizados = {};
        pagosSnapshot.docs.forEach((doc) => {
          const pago = doc.data();
          const fecha = pago.fecha; // Se espera formato 'YYYY-MM-DD'
          const año = fecha.split("-")[0];
          if (!pagosOrganizados[año]) pagosOrganizados[año] = [];
          pagosOrganizados[año].push({
            idPago: doc.id,
            fecha,
            monto: pago.monto,
            montoNeto: pago.montoNeto,
            descuento: pago.descuento,
            empresa: pago.empresa,
            vendedor: pago.vendedor,
            soporteURL: pago.soporteURL || "",
          });
        });

        Object.keys(pagosOrganizados).forEach((año) => {
          pagosOrganizados[año].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
        });

        const tablaOrganizadaRef = admin.firestore().collection("ornaPagos").doc(clienteId);
        await tablaOrganizadaRef.set({
          clienteId,
          actualizado: admin.firestore.FieldValue.serverTimestamp(),
          pagosPorAño: pagosOrganizados,
        });

        console.log(`Pagos organizados correctamente para el cliente ${clienteId}`);
      } catch (error) {
        console.error("Error organizando los pagos:", error);
      }
    },
);

// ============================
// Función HTTP: organizarPagosClientesExistentes
// ============================
exports.organizarPagosClientesExistentes = onRequest(async (req, res) => {
  try {
    // Obtener todos los clientes
    const clientesSnapshot = await admin.firestore().collection("nuevosclientes").get();

    // Para cada cliente, leer sus pagos y organizarlos
    for (const clienteDoc of clientesSnapshot.docs) {
      const clienteId = clienteDoc.id;
      const pagosRef = admin.firestore().collection(`nuevosclientes/${clienteId}/pagos`);
      const pagosSnapshot = await pagosRef.get();

      if (pagosSnapshot.empty) continue;

      const pagosOrganizados = {};
      pagosSnapshot.docs.forEach((doc) => {
        const pago = doc.data();
        const fecha = pago.fecha;
        const año = fecha.split("-")[0];

        if (!pagosOrganizados[año]) {
          pagosOrganizados[año] = [];
        }

        pagosOrganizados[año].push({
          idPago: doc.id,
          fecha,
          monto: pago.monto,
          montoNeto: pago.montoNeto,
          descuento: pago.descuento,
          empresa: pago.empresa,
          vendedor: pago.vendedor,
          soporteURL: pago.soporteURL || "",
        });
      });

      // Ordenar por fecha
      Object.keys(pagosOrganizados).forEach((año) => {
        pagosOrganizados[año].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
      });

      // Guardar la tabla organizada
      await admin
          .firestore()
          .collection("ornaPagos")
          .doc(clienteId)
          .set({
            clienteId,
            actualizado: admin.firestore.FieldValue.serverTimestamp(),
            pagosPorAño: pagosOrganizados,
          });
    }

    res.status(200).send("Se organizaron los pagos de todos los clientes existentes.");
  } catch (error) {
    console.error("Error organizando pagos:", error);
    res.status(500).send(error.message);
  }
});

// ============================
// Función Firestore (Trigger): enviarContrato
// Se dispara cuando se crea un documento en la subcolección "contrato" dentro de "nuevosClientes"
// ============================

exports.enviarContrato = onDocumentCreated("nuevosclientes/{clienteId}/contrato/{contratoId}", async (snap, context) => {
  const docRef = db.doc(snap.document);
  const docSnap = await docRef.get();

  if (!docSnap.exists) {
    console.error("El documento no existe:", snap.document);
    return;
  }

  const data = docSnap.data(); // <- Ahora sí puedes usar .data()

  console.log("Datos recibidos:", data);

  const {correoDestinatario, nombreMandante, documentoContrato} = data;

  if (!correoDestinatario || !documentoContrato) {
    console.error("Faltan parámetros requeridos en el documento de contrato.");
    return;
  }

  const subject = "Contrato de Prestación de Servicios - Dajusticia";

  const textContent = `
Estimado(a) ${nombreMandante || "Usuario"},

Adjuntamos el texto de su contrato:

${documentoContrato}

Atentamente,
Equipo Dajusticia
  `;

  const htmlContent = `
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8" />
    <title>Contrato de Prestación de Servicios</title>
    <style>
      body { font-family: Arial, sans-serif; color: #333; background-color: #f9f9f9; margin: 0; padding: 20px; }
      .container { max-width: 600px; margin: 0 auto; background: #fff; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
      .header { background: #ffffff; text-align: center; padding: 20px; }
      .header h1 { margin: 0; font-size: 22px; font-weight: normal; }
      .content { padding: 20px; }
      pre { white-space: pre-wrap; font-size: 14px; line-height: 1.5; }
      .footer { background: #1976d2; color: #ffffff; text-align: center; padding: 10px; font-size: 14px; }
      .footer p { margin: 5px 0; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Contrato de Prestación de Servicios</h1>
      </div>
      <div class="content">
        <p>Estimado(a) <strong>${nombreMandante || "Usuario"}</strong>,</p>
        <p>Adjuntamos el texto de su contrato:</p>
        <pre>${documentoContrato}</pre>
      </div>
      <div class="footer">
        <p>Atentamente,<br/>Equipo Dajusticia</p>
      </div>
    </div>
  </body>
  </html>
    `;
  const mailOptions = {
    from: `"Dajusticia - Contrato" <noreply@tecnosalud.cloud>`,
    to: correoDestinatario,
    cc: "director.dajusticia@gmail.com",
    subject,
    text: textContent,
    html: htmlContent,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Contrato enviado:", info.messageId);
  } catch (error) {
    console.error("Error al enviar el contrato:", error);
  }
});

// ============================
// Función Firestore (Trigger): organizarDocumentosUsuario
// Se dispara cuando se crea un documento en extractedText
// ============================
exports.organizarDocumentosUsuario = onDocumentCreated(
    "extractedText/{docId}",
    async (event) => {
      try {
        // Verificar que tenemos datos
        if (!event || !event.data) {
          console.error("El evento no contiene datos");
          return;
        }

        const docId = event.params.docId;
        const docData = event.data.data();

        console.log(`Procesando nuevo documento en extractedText. ID: ${docId}`);
        console.log("Datos del documento:", JSON.stringify(docData));

        // Validar que tenemos data
        if (!docData) {
          console.error(`No hay datos en el documento ${docId}`);
          return;
        }

        // Procesar documento
        await procesarDocumentoUsuario(docId, docData);
        console.log(`Documento ${docId} procesado exitosamente`);
      } catch (error) {
        console.error(`Error procesando documento en trigger: ${error.message}`);
        console.error("Stack trace:", error.stack);
      }
    },
);

// ============================
// Función HTTP: procesarDocumentosExistentes
// Procesa todos los documentos de extractedText que no están organizados
// ============================
exports.procesarDocumentosExistentes = onRequest(async (req, res) => {
  // Configuración CORS
  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).send("");
  }

  res.set("Access-Control-Allow-Origin", "*");

  try {
    console.log("Iniciando procesamiento de documentos existentes...");
    const snapshot = await admin.firestore().collection("extractedText").get();

    if (snapshot.empty) {
      return res.status(200).json({
        success: true,
        message: "No hay documentos para procesar",
        count: 0,
      });
    }

    const resultados = {
      total: snapshot.size,
      procesados: 0,
      errores: 0,
      detalles: [],
    };

    // Procesar documentos en serie para evitar sobrecargar Firestore
    for (const doc of snapshot.docs) {
      try {
        const docId = doc.id;
        const docData = doc.data();

        console.log(`Procesando documento ${docId}`);

        // Validar si ya tiene documentoUsuario
        if (docData.documentoUsuario) {
          console.log(`Documento ${docId} ya tiene documentoUsuario: ${docData.documentoUsuario}`);
        } else if (docData.file) {
          console.log(`Documento ${docId} no tiene documentoUsuario, intentando extraer de file: ${docData.file}`);
        } else {
          console.log(`Documento ${docId} no tiene documentoUsuario ni file`);
        }

        await procesarDocumentoUsuario(docId, docData);
        resultados.procesados++;
        resultados.detalles.push({
          id: docId,
          resultado: "procesado",
          userId: docData.documentoUsuario || extractUserIdFromFilePath(docData.file) || "No identificado",
        });
      } catch (error) {
        resultados.errores++;
        resultados.detalles.push({
          id: doc.id,
          error: error.message,
          stack: error.stack,
          resultado: "error",
        });
        console.error(`Error procesando documento ${doc.id}:`, error);
      }
    }

    console.log(`Procesamiento completo: ${resultados.procesados} exitosos, ${resultados.errores} fallidos`);
    return res.status(200).json({
      success: true,
      message: "Procesamiento completado",
      resultados,
    });
  } catch (error) {
    console.error("Error en el procesamiento masivo:", error);
    return res.status(500).json({
      success: false,
      message: "Error procesando documentos",
      error: error.message,
      stack: error.stack,
    });
  }
});

// ============================
// Función auxiliar para procesar un documento
// ============================
/**
 * Procesa un documento de extractedText para asociarlo a un usuario
 * @param {string} docId - ID del documento en la colección extractedText
 * @param {Object} data - Datos del documento
 * @return {Promise<void>} - Promesa que se resuelve cuando el documento ha sido procesado
 */
async function procesarDocumentoUsuario(docId, data) {
  try {
    // Obtener ID de usuario
    let userId = data.documentoUsuario;

    // Si no hay documentoUsuario, extraerlo del campo file
    if (!userId && data.file) {
      userId = extractUserIdFromFilePath(data.file);
    }

    if (!userId) {
      console.warn(`No se pudo determinar el ID de usuario para el documento ${docId}`);
      return;
    }

    console.log(`ID de usuario determinado para documento ${docId}: ${userId}`);

    // Actualizar o crear documento en relaciondocumental
    await updateRelacionDocumental(userId, docId, data);

    // Si el documento no tenía documentoUsuario, actualizarlo
    if (!data.documentoUsuario && userId) {
      await updateDocumentoUsuario(docId, userId);
    }

    console.log(`Documento ${docId} procesado correctamente para usuario ${userId}`);

    return userId; // Devolver el ID de usuario para seguimiento
  } catch (error) {
    console.error(`Error en procesarDocumentoUsuario para ${docId}: ${error.message}`);
    throw error; // Propagar el error para que sea manejado por la función que llama
  }
}

// ============================
// Extraer ID de usuario del nombre del archivo
// ============================
/**
 * Extrae el ID de usuario del nombre del archivo
 * @param {string} filePath - Ruta completa del archivo
 * @return {string|null} - ID de usuario o null si no se pudo extraer
 */
function extractUserIdFromFilePath(filePath) {
  try {
    if (!filePath) return null;

    console.log(`Intentando extraer ID de usuario de: ${filePath}`);

    // Obtener solo el nombre del archivo (sin la ruta)
    const fileName = filePath.split("/").pop();
    if (!fileName) return null;

    console.log(`Nombre del archivo: ${fileName}`);

    // Buscar patrón _NUMERO_ en el nombre
    // Esto capturará cualquier secuencia de dígitos entre dos guiones bajos
    const matches = fileName.match(/_(\d+)_/);

    if (matches && matches.length > 1) {
      const userId = matches[1];
      console.log(`ID de usuario extraído: ${userId}`);
      return userId; // Devolver el grupo capturado (solo los dígitos)
    }

    // Si no encuentra el patrón _NUMERO_, buscar otras posibilidades
    // Por ejemplo, números al principio del nombre
    const alternativeMatches = fileName.match(/^(\d+)/);
    if (alternativeMatches && alternativeMatches.length > 1) {
      const userId = alternativeMatches[1];
      console.log(`ID alternativo extraído: ${userId}`);
      return userId;
    }

    console.log("No se pudo extraer ID de usuario del nombre del archivo");
    return null;
  } catch (error) {
    console.error(`Error extrayendo ID de usuario: ${error.message}`);
    return null;
  }
}

// ============================
// Actualizar o crear documento en colección relaciondocumental
// ============================
/**
 * Actualiza o crea un documento en la colección relaciondocumental
 * @param {string} userId - ID del usuario
 * @param {string} docId - ID del documento en extractedText
 * @param {Object} data - Datos del documento
 * @return {Promise<void>} - Promesa que se resuelve cuando el documento ha sido actualizado
 */
async function updateRelacionDocumental(userId, docId, data) {
  try {
    const docRef = admin.firestore().collection("relaciondocumental").doc(userId);

    // Crear fecha como string ISO en lugar de usar serverTimestamp dentro del array
    const fechaActual = new Date().toISOString();

    // Extraer el contenido de texto del documento
    const textoDocumento = data.text || "Sin contenido textual";

    // Crear o actualizar atómicamente el documento
    await docRef.set({
      idUsuario: userId,
      ultimaActualizacion: admin.firestore.FieldValue.serverTimestamp(), // Esto está bien, está fuera del array
      documentos: admin.firestore.FieldValue.arrayUnion({
        id: docId,
        file: data.file || null,
        fecha: data.createdAt || fechaActual, // Usar fecha string en lugar de serverTimestamp
        nombre: extractFileNameFromPath(data.file),
        texto: textoDocumento, // Agregar el texto del documento
      }),
      // También almacenar el contenido textual en una matriz separada para búsquedas
      contenidoTextual: admin.firestore.FieldValue.arrayUnion({
        docId: docId,
        texto: textoDocumento,
      }),
      // Agregar contador
      cantidadDocumentos: admin.firestore.FieldValue.increment(1),
    }, {merge: true});

    console.log(`Documento ${docId} agregado a relaciondocumental para usuario ${userId} con texto incluido`);
  } catch (error) {
    console.error(`Error actualizando relaciondocumental para usuario ${userId}:`, error);
    throw error;
  }
}

// ============================
// Actualizar campo documentoUsuario en extractedText
// ============================
/**
 * Actualiza el campo documentoUsuario en un documento de extractedText
 * @param {string} docId - ID del documento en extractedText
 * @param {string} userId - ID del usuario
 * @return {Promise<void>} - Promesa que se resuelve cuando el documento ha sido actualizado
 */
async function updateDocumentoUsuario(docId, userId) {
  try {
    await admin.firestore().collection("extractedText").doc(docId).update({
      documentoUsuario: userId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`Campo documentoUsuario actualizado en documento ${docId}`);
  } catch (error) {
    console.error(`Error actualizando documentoUsuario en ${docId}:`, error);
    throw error;
  }
}

// ============================
// Extraer nombre de archivo de una ruta
// ============================
/**
 * Extrae el nombre del archivo de una ruta completa
 * @param {string} filePath - Ruta completa del archivo
 * @return {string} - Nombre del archivo o texto predeterminado si no se pudo extraer
 */
function extractFileNameFromPath(filePath) {
  if (!filePath) return "Documento sin nombre";

  const fileName = filePath.split("/").pop();
  if (!fileName) return "Documento sin nombre";

  // Decodificar caracteres especiales en el nombre si es necesario
  try {
    return decodeURIComponent(fileName);
  } catch {
    return fileName;
  }
}
