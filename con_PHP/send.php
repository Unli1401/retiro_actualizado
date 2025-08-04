<?php
// Configuración básica
header('Content-Type: application/json');

// Validar que sea una petición POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Método no permitido']);
    exit;
}

// Recibir y sanitizar los datos
$data = [
    'empresa' => filter_input(INPUT_POST, 'empresa', FILTER_SANITIZE_STRING),
    'nombre' => filter_input(INPUT_POST, 'nombre', FILTER_SANITIZE_STRING),
    'correo' => filter_input(INPUT_POST, 'correo', FILTER_SANITIZE_EMAIL),
    'direccion' => filter_input(INPUT_POST, 'direccion', FILTER_SANITIZE_STRING),
    'telefono' => filter_input(INPUT_POST, 'telefono', FILTER_SANITIZE_STRING),
    'nombre_backup' => filter_input(INPUT_POST, 'nombre_backup', FILTER_SANITIZE_STRING),
    'correo_backup' => filter_input(INPUT_POST, 'correo_backup', FILTER_SANITIZE_EMAIL),
    'telefono_backup' => filter_input(INPUT_POST, 'telefono_backup', FILTER_SANITIZE_STRING),
    'tipo_retiro' => filter_input(INPUT_POST, 'tipo_retiro', FILTER_SANITIZE_STRING),
    'cantidad' => filter_input(INPUT_POST, 'cantidad', FILTER_SANITIZE_NUMBER_INT),
    'fecha_retiro' => filter_input(INPUT_POST, 'fecha_retiro', FILTER_SANITIZE_STRING),
    'horario_retiro' => filter_input(INPUT_POST, 'horario_retiro', FILTER_SANITIZE_STRING),
    'modelos_series' => filter_input(INPUT_POST, 'modelos_series', FILTER_SANITIZE_STRING),
    'estado' => filter_input(INPUT_POST, 'estado', FILTER_SANITIZE_STRING),
    'tiene_accesorios' => isset($_POST['tiene_accesorios']) ? 'Sí' : 'No',
    'detalle_accesorios' => filter_input(INPUT_POST, 'detalle_accesorios', FILTER_SANITIZE_STRING),
    'embalado' => filter_input(INPUT_POST, 'embalado', FILTER_SANITIZE_STRING),
    'mantencion' => filter_input(INPUT_POST, 'mantencion', FILTER_SANITIZE_STRING),
    'retiro_masivo' => isset($_POST['retiro_masivo']) ? 'Sí' : 'No',
    'desconectados' => isset($_POST['desconectados']) ? 'Sí' : 'No',
    'apilados' => isset($_POST['apilados']) ? 'Sí' : 'No',
    'requiere_epp' => isset($_POST['requiere_epp']) ? 'Sí' : 'No',
    'detalle_epp' => filter_input(INPUT_POST, 'detalle_epp', FILTER_SANITIZE_STRING),
    'tipo_transporte' => filter_input(INPUT_POST, 'tipo_transporte', FILTER_SANITIZE_STRING),
    'requisitos_seguridad' => filter_input(INPUT_POST, 'requisitos_seguridad', FILTER_SANITIZE_STRING),
    'estacionamiento' => filter_input(INPUT_POST, 'estacionamiento', FILTER_SANITIZE_STRING),
    'altura_maxima' => filter_input(INPUT_POST, 'altura_maxima', FILTER_SANITIZE_NUMBER_INT),
    'ascensor' => filter_input(INPUT_POST, 'ascensor', FILTER_SANITIZE_STRING),
    'distancia_maniobra' => filter_input(INPUT_POST, 'distancia_maniobra', FILTER_SANITIZE_NUMBER_INT),
    'documentacion_requerida' => filter_input(INPUT_POST, 'documentacion_requerida', FILTER_SANITIZE_STRING),
    'destino' => filter_input(INPUT_POST, 'destino', FILTER_SANITIZE_STRING),
    'otro_destino' => filter_input(INPUT_POST, 'otro_destino', FILTER_SANITIZE_STRING),
    'observaciones' => filter_input(INPUT_POST, 'observaciones', FILTER_SANITIZE_STRING)
];

// Validar campos obligatorios (ejemplo básico)
if (empty($data['empresa']) || empty($data['nombre']) || empty($data['correo'])) {
    echo json_encode(['success' => false, 'error' => 'Faltan campos obligatorios']);
    exit;
}

// Configurar PHPMailer (requiere descargar la librería)
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'path/to/PHPMailer/src/Exception.php';
require 'path/to/PHPMailer/src/PHPMailer.php';
require 'path/to/PHPMailer/src/SMTP.php';

$mail = new PHPMailer(true);

try {
    // Configuración del servidor SMTP
    $mail->isSMTP();
    $mail->Host = 'smtp.office365.com';  // Ej: smtp.gmail.com
    $mail->SMTPAuth = true;
    $mail->Username = 'esteban.corrales@serviceone.cl';
    $mail->Password = 'Unli1401';
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS; // O ENCRYPTION_SMTPS
    $mail->Port = 587; // O 465 para SSL

    // Remitente y destinatario
    $mail->setFrom('no-reply@serviceone.cl', 'ServiceOne');
    $mail->addAddress('esteban.corrales@serviceone.cl'); // Correo de destino
    $mail->addReplyTo($data['correo'], $data['nombre']);

    // Contenido del correo (HTML)
    $mail->isHTML(true);
    $mail->Subject = 'Nueva solicitud de retiro: ' . $data['empresa'];

    // Construir el cuerpo del mensaje (similar al template de EmailJS)
    $mail->Body = "
        <h1>Solicitud de Retiro</h1>
        <h2>Datos de Contacto</h2>
        <p><strong>Empresa:</strong> {$data['empresa']}</p>
        <p><strong>Contacto:</strong> {$data['nombre']}</p>
        <p><strong>Correo:</strong> {$data['correo']}</p>
        <p><strong>Dirección:</strong> {$data['direccion']}</p>
        <p><strong>Teléfono:</strong> {$data['telefono']}</p>
        <p><strong>Contacto Backup:</strong> {$data['nombre_backup']} ({$data['telefono_backup']}, {$data['correo_backup']})</p>

        <h2>Detalles del Retiro</h2>
        <p><strong>Tipo:</strong> {$data['tipo_retiro']}</p>
        <p><strong>Cantidad:</strong> {$data['cantidad']}</p>
        <p><strong>Fecha:</strong> {$data['fecha_retiro']} ({$data['horario_retiro']})</p>
        <p><strong>Modelos/Series:</strong> {$data['modelos_series']}</p>
        <p><strong>Estado:</strong> {$data['estado']}</p>
        <p><strong>Accesorios:</strong> {$data['tiene_accesorios']} - {$data['detalle_accesorios']}</p>
        <p><strong>Embalado:</strong> {$data['embalado']}</p>
        <p><strong>Mantención requerida:</strong> {$data['mantencion']}</p>
        <p><strong>Retiro masivo:</strong> {$data['retiro_masivo']} (Desconectados: {$data['desconectados']}, Apilados: {$data['apilados']})</p>

        <h2>Requisitos de Acceso</h2>
        <p><strong>EPP requerido:</strong> {$data['requiere_epp']} - {$data['detalle_epp']}</p>
        <p><strong>Tipo de transporte:</strong> {$data['tipo_transporte']}</p>
        <p><strong>Requisitos de seguridad:</strong> {$data['requisitos_seguridad']}</p>
        <p><strong>Estacionamiento:</strong> {$data['estacionamiento']} {$data['altura_maxima'] ? '(Altura máx: ' . $data['altura_maxima'] . 'm)' : ''}</p>
        <p><strong>Ascensor/Montacarga:</strong> {$data['ascensor']}</p>
        <p><strong>Distancia a caminar:</strong> {$data['distancia_maniobra']} metros</p>
        <p><strong>Documentación requerida:</strong> {$data['documentacion_requerida']}</p>
        <p><strong>Destino:</strong> " . ($data['destino'] === 'otro' ? $data['otro_destino'] : $data['destino']) . "</p>

        <h2>Observaciones</h2>
        <p>{$data['observaciones']}</p>
    ";

    // Enviar el correo
    $mail->send();
    echo json_encode(['success' => true]);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Error al enviar el correo: ' . $mail->ErrorInfo]);
}