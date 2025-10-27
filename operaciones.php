<?php
header('Content-Type: application/json');
session_start();
require_once 'conexion.php';

// ====== LOGIN ======
if (isset($_POST['accion']) && $_POST['accion'] === 'login') {
    $database = new Database();
    $db = $database->getConnection();
    
    $usuario = $_POST['usuario'] ?? '';
    $contra = $_POST['contra'] ?? '';
    
    // Consulta a la base de datos
    $query = "SELECT * FROM usuarios WHERE usuario = :usuario AND contra = :contra";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':usuario', $usuario);
    $stmt->bindParam(':contra', $contra);
    $stmt->execute();
    
    if ($stmt->rowCount() > 0) {
        $_SESSION['usuario'] = $usuario;
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false]);
    }
    exit;
}

// ====== CERRAR SESIÓN ======
if (isset($_POST['accion']) && $_POST['accion'] === 'logout') {
    session_destroy();
    echo json_encode(['success' => true]);
    exit;
}

// Verificar sesión para operaciones protegidas
if (!isset($_SESSION['usuario'])) {
    echo json_encode(['error' => 'No autenticado']);
    exit;
}

$database = new Database();
$db = $database->getConnection();
$accion = $_POST['accion'] ?? '';

switch ($accion) {
    // === EQUIPOS ===
    case 'crearEquipo':
        try {
            $query = "INSERT INTO equipos (nombre, num_integrantes, capitan) VALUES (:nombre, :integrantes, :capitan)";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':nombre', $_POST['nombre']);
            $stmt->bindParam(':integrantes', $_POST['integrantes']);
            $stmt->bindParam(':capitan', $_POST['capitan']);
            $stmt->execute();
            
            echo json_encode(['success' => true, 'id' => $db->lastInsertId()]);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
        break;

    case 'listarEquipos':
        try {
            $query = "SELECT * FROM equipos ORDER BY id";
            $stmt = $db->prepare($query);
            $stmt->execute();
            $equipos = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode(['success' => true, 'data' => $equipos]);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
        break;

    case 'editarEquipo':
        try {
            $query = "UPDATE equipos SET nombre = :nombre, num_integrantes = :integrantes, capitan = :capitan WHERE id = :id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':id', $_POST['id']);
            $stmt->bindParam(':nombre', $_POST['nombre']);
            $stmt->bindParam(':integrantes', $_POST['integrantes']);
            $stmt->bindParam(':capitan', $_POST['capitan']);
            $stmt->execute();
            
            echo json_encode(['success' => true]);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
        break;

    case 'borrarEquipo':
        try {
            $query = "DELETE FROM equipos WHERE id = :id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':id', $_POST['id']);
            $stmt->execute();
            
            echo json_encode(['success' => true]);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
        break;

    // === PARTIDOS ===
    case 'crearPartido':
        try {
            $query = "INSERT INTO partidos (equipo1_id, equipo2_id, marcador) VALUES (:equipo1, :equipo2, '0-0')";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':equipo1', $_POST['equipo1']);
            $stmt->bindParam(':equipo2', $_POST['equipo2']);
            $stmt->execute();
            
            echo json_encode(['success' => true, 'id' => $db->lastInsertId()]);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
        break;

    case 'listarPartidos':
    try {
        $query = "SELECT p.id, p.equipo1_id, p.equipo2_id, p.marcador, 
                         e1.nombre as equipo1_nombre, 
                         e2.nombre as equipo2_nombre 
                  FROM partidos p 
                  JOIN equipos e1 ON p.equipo1_id = e1.id 
                  JOIN equipos e2 ON p.equipo2_id = e2.id 
                  ORDER BY p.id";
        $stmt = $db->prepare($query);
        $stmt->execute();
        $partidos = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(['success' => true, 'data' => $partidos]);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    break;

    case 'editarPartido':
        try {
            $query = "UPDATE partidos SET equipo1_id = :equipo1, equipo2_id = :equipo2, marcador = :marcador WHERE id = :id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':id', $_POST['id']);
            $stmt->bindParam(':equipo1', $_POST['equipo1']);
            $stmt->bindParam(':equipo2', $_POST['equipo2']);
            $stmt->bindParam(':marcador', $_POST['marcador']);
            $stmt->execute();
            
            echo json_encode(['success' => true]);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
        break;

    case 'borrarPartido':
        try {
            $query = "DELETE FROM partidos WHERE id = :id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':id', $_POST['id']);
            $stmt->execute();
            
            echo json_encode(['success' => true]);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
        break;

    // === GALERÍA DE ESCUDOS ===
    case 'listarGaleria':
        try {
            $query = "SELECT e.id as equipo_id, e.nombre as equipo, esc.ruta_archivo as url 
                      FROM equipos e 
                      LEFT JOIN escudos esc ON e.id = esc.equipo_id 
                      WHERE esc.ruta_archivo IS NOT NULL";
            $stmt = $db->prepare($query);
            $stmt->execute();
            $galeria = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode(["ok" => true, "data" => $galeria]);
        } catch (PDOException $e) {
            echo json_encode(["ok" => false, "error" => $e->getMessage()]);
        }
        break;

    case 'agregarEscudo':
    case 'cambiarEscudo':
        try {
            // CORRECCIÓN: Ahora recibimos el ID del equipo, no el nombre
            $equipo_id = $_POST['equipo'];
            
            // Obtener nombre del equipo para el nombre de archivo
            $query = "SELECT nombre FROM equipos WHERE id = :id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':id', $equipo_id);
            $stmt->execute();
            $equipo = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$equipo) {
                throw new Exception("Equipo no encontrado");
            }
            
            $equipo_nombre = $equipo['nombre'];
            
            // Configuración de subida
            $maxSize = 5 * 1024 * 1024;
            $dirRel = 'escudos';
            $dirFS = __DIR__ . DIRECTORY_SEPARATOR . $dirRel . DIRECTORY_SEPARATOR;
            
            if (!file_exists($dirFS)) {
                mkdir($dirFS, 0777, true);
            }
            
            if (!isset($_FILES['escudo'])) {
                throw new Exception("No se recibió ningún archivo");
            }
            
            $file = $_FILES['escudo'];
            if ($file['error'] !== UPLOAD_ERR_OK) {
                throw new Exception("Error en la subida: " . $file['error']);
            }
            
            if ($file['size'] > $maxSize) {
                throw new Exception("Archivo demasiado grande (máx 5 MB)");
            }
            
            $info = @getimagesize($file['tmp_name']);
            if ($info === false) {
                throw new Exception("El archivo no es una imagen válida");
            }
            
            $mime = $info['mime'];
            $ext = '';
            switch ($mime) {
                case 'image/jpeg': $ext = '.jpg'; break;
                case 'image/png': $ext = '.png'; break;
                case 'image/gif': $ext = '.gif'; break;
                case 'image/webp': $ext = '.webp'; break;
                default: throw new Exception("Tipo de imagen no soportado");
            }
            
            $nombreUnico = $equipo_nombre . '_' . time() . '_' . mt_rand(1000, 999999) . $ext;
            $rutaDestinoFS = $dirFS . $nombreUnico;
            $rutaPublica = '/' . trim($dirRel, '/') . '/' . $nombreUnico;
            
            if (!move_uploaded_file($file['tmp_name'], $rutaDestinoFS)) {
                throw new Exception("No se pudo guardar el archivo en el servidor");
            }
            
            // Verificar si ya existe un escudo para este equipo
            $queryCheck = "SELECT id FROM escudos WHERE equipo_id = :equipo_id";
            $stmtCheck = $db->prepare($queryCheck);
            $stmtCheck->bindParam(':equipo_id', $equipo_id);
            $stmtCheck->execute();
            
            if ($stmtCheck->rowCount() > 0) {
                // Actualizar
                $query = "UPDATE escudos SET ruta_archivo = :ruta WHERE equipo_id = :equipo_id";
            } else {
                // Insertar
                $query = "INSERT INTO escudos (equipo_id, ruta_archivo) VALUES (:equipo_id, :ruta)";
            }
            
            $stmt = $db->prepare($query);
            $stmt->bindParam(':equipo_id', $equipo_id);
            $stmt->bindParam(':ruta', $rutaPublica);
            $stmt->execute();
            
            echo json_encode(['ok' => true, 'url' => $rutaPublica]);
            
        } catch (Exception $e) {
            echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
        }
        break;

    case 'eliminarEscudo':
        try {
            // CORRECCIÓN: Ahora recibimos el ID del equipo, no el nombre
            $equipo_id = $_POST['equipo'];
            
            // Obtener información del escudo
            $query = "SELECT ruta_archivo FROM escudos WHERE equipo_id = :equipo_id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':equipo_id', $equipo_id);
            $stmt->execute();
            $escudo = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($escudo) {
                // Eliminar archivo físico
                $rutaArchivo = __DIR__ . $escudo['ruta_archivo'];
                if (file_exists($rutaArchivo)) {
                    unlink($rutaArchivo);
                }
                
                // Eliminar de la base de datos
                $query = "DELETE FROM escudos WHERE equipo_id = :equipo_id";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':equipo_id', $equipo_id);
                $stmt->execute();
            }
            
            echo json_encode(['ok' => true]);
            
        } catch (Exception $e) {
            echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
        }
        break;

    default:
        echo json_encode(['error' => 'Acción no reconocida']);
        break;
}
?>