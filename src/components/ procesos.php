<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); // Permitir solicitudes desde cualquier origen (ajusta si es necesario)

// Configuración de conexión a la base de datos
$host = 'ftp.appdajusticia.com'; // Cambia si usas un host distinto
$usuario = 'u965232645_prometheo'; // Usuario de la base de datos
$contrasena = 'D@justicia2024'; // Contraseña de la base de datos
$baseDatos = 'appdajusticia'; // Nombre de la base de datos

// Conexión a la base de datos
$conexion = new mysqli($host, $usuario, $contrasena, $baseDatos);

// Verificar si la conexión tuvo éxito
if ($conexion->connect_error) {
    echo json_encode(['error' => 'Error al conectar a la base de datos: ' . $conexion->connect_error]);
    exit();
}

// Obtener el parámetro de la cédula desde la solicitud GET
$cedula = isset($_GET['cedula']) ? $conexion->real_escape_string($_GET['cedula']) : '';

if (empty($cedula)) {
    echo json_encode(['error' => 'Parámetro de cédula no proporcionado']);
    exit();
}

// Consulta SQL para obtener los procesos
$sql = "SELECT * FROM `procesos` WHERE `identidad_clientes` = '$cedula'";
$resultado = $conexion->query($sql);

// Verificar si la consulta tuvo éxito
if (!$resultado) {
    echo json_encode(['error' => 'Error en la consulta: ' . $conexion->error]);
    exit();
}

// Convertir los resultados a un arreglo
$procesos = [];
while ($fila = $resultado->fetch_assoc()) {
    $procesos[] = $fila;
}

// Devolver los resultados como JSON
echo json_encode($procesos);

// Cerrar la conexión a la base de datos
$conexion->close();
?>
