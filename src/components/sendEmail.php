<?php
// sendEmail.php

// Obtener los datos enviados desde React
$input = json_decode(file_get_contents('php://input'), true);

$emailUsuario = $input['emailUsuario'];
$nombreUsuario = $input['nombreUsuario'];
$montoPago = $input['montoPago'];
$fechaPago = $input['fechaPago'];
$soporteURL = $input['soporteURL'];

// Datos de configuración del correo
$correoEmpresa = 'noreply@tecnosalud.cloud';
$correoCopia = 'director.dajusticia@gmail.com';
$contraseñaCorreo = '@V1g@1l250822';

// Asunto y cuerpo del correo
$asunto = 'Confirmación de Pago Recibido';
$mensaje = "
Estimado(a) $nombreUsuario,

Hemos recibido tu pago de $$montoPago realizado el $fechaPago.

Puedes ver el comprobante de tu pago aquí: $soporteURL

Gracias por tu confianza.

Atentamente,
Tu Empresa
";

// Enviar correo al usuario y una copia al correo predeterminado
$headers = "From: Tu Empresa <$correoEmpresa>\r\n";
$headers .= "Reply-To: $correoEmpresa\r\n";
$headers .= "CC: $correoCopia\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

// Configuración adicional para SMTP
require 'PHPMailer/PHPMailerAutoload.php';

$mail = new PHPMailer;
$mail->isSMTP();
$mail->Host = 'smtp.hostinger.com'; // Asegúrate de usar el host SMTP correcto
$mail->SMTPAuth = true;
$mail->Username = $correoEmpresa;
$mail->Password = $contraseñaCorreo;
$mail->SMTPSecure = 'tls';
$mail->Port = 587;

$mail->setFrom($correoEmpresa, 'Tu Empresa');
$mail->addAddress($emailUsuario, $nombreUsuario);
$mail->addCC($correoCopia);
$mail->Subject = $asunto;
$mail->Body    = $mensaje;

if(!$mail->send()) {
    http_response_code(500);
    echo 'Error al enviar el correo: ' . $mail->ErrorInfo;
} else {
    echo 'Correo enviado exitosamente.';
}
?>
