<?php
header('Content-Type: application/json');
session_start();

// ====== LOGIN ======
if (isset($_POST['accion']) && $_POST['accion'] === 'login') {
    $usuarios_validos = [
        ['usuario' => 'admin', 'contra' => '1234'],
        ['usuario' => 'enrique', 'contra' => '1212'],
        ['usuario' => 'isc', 'contra' => 'coding']
    ];

    $usuario = $_POST['usuario'] ?? '';
    $contra = $_POST['contra'] ?? '';
    $valido = false;

    foreach ($usuarios_validos as $user) {
        if ($user['usuario'] === $usuario && $user['contra'] === $contra) {
            $valido = true;
            $_SESSION['usuario'] = $usuario;
            break;
        }
    }

    echo json_encode(['success' => $valido]);
    exit;
}

// ====== CERRAR SESIÓN ======
if (isset($_POST['accion']) && $_POST['accion'] === 'logout') {
    session_destroy();
    echo json_encode(['success' => true]);
    exit;
}

// ====== BLOQUE DE OPERACIONES (Equipos, Partidos, Galería) ======

// Usamos archivos JSON locales para simular almacenamiento persistente
$archivoEquipos = "equipos.json";
$archivoPartidos = "partidos.json";
$archivoGaleria = "galeria.json";

// Crea archivos vacíos si no existen
if (!file_exists($archivoEquipos)) file_put_contents($archivoEquipos, json_encode([]));
if (!file_exists($archivoPartidos)) file_put_contents($archivoPartidos, json_encode([]));
if (!file_exists($archivoGaleria)) file_put_contents($archivoGaleria, json_encode([]));

$equipos = json_decode(file_get_contents($archivoEquipos), true);
$partidos = json_decode(file_get_contents($archivoPartidos), true);
$galeria = json_decode(file_get_contents($archivoGaleria), true);

$accion = $_POST['accion'] ?? '';

switch ($accion) {
    // === EQUIPOS ===
    case 'crearEquipo':
        $nuevo = [
            'id' => count($equipos) + 1,
            'nombre' => $_POST['nombre'],
            'integrantes' => $_POST['integrantes'],
            'capitan' => $_POST['capitan']
        ];
        $equipos[] = $nuevo;
        file_put_contents($archivoEquipos, json_encode($equipos));
        echo json_encode(['success' => true, 'data' => $nuevo]);
        break;

    case 'listarEquipos':
        echo json_encode(['success' => true, 'data' => $equipos]);
        break;

    case 'editarEquipo':
        $id = $_POST['id'];
        foreach ($equipos as &$eq) {
            if ($eq['id'] == $id) {
                $eq['nombre'] = $_POST['nombre'];
                $eq['integrantes'] = $_POST['integrantes'];
                $eq['capitan'] = $_POST['capitan'];
                break;
            }
        }
        file_put_contents($archivoEquipos, json_encode($equipos));
        echo json_encode(['success' => true]);
        break;

    case 'borrarEquipo':
        $id = $_POST['id'];
        $equipos = array_filter($equipos, fn($eq) => $eq['id'] != $id);
        file_put_contents($archivoEquipos, json_encode(array_values($equipos)));
        echo json_encode(['success' => true]);
        break;

    // === PARTIDOS ===
    case 'crearPartido':
        $nuevo = [
            'id' => count($partidos) + 1,
            'equipo1' => $_POST['equipo1'],
            'equipo2' => $_POST['equipo2'],
            'marcador' => $_POST['marcador'] ?? '0 - 0'
        ];
        $partidos[] = $nuevo;
        file_put_contents($archivoPartidos, json_encode($partidos));
        echo json_encode(['success' => true, 'data' => $nuevo]);
        break;

    case 'listarPartidos':
        echo json_encode(['success' => true, 'data' => $partidos]);
        break;

    case 'editarPartido':
        $id = $_POST['id'];
        foreach ($partidos as &$p) {
            if ($p['id'] == $id) {
                $p['equipo1'] = $_POST['equipo1'];
                $p['equipo2'] = $_POST['equipo2'];
                $p['marcador'] = $_POST['marcador'];
                break;
            }
        }
        file_put_contents($archivoPartidos, json_encode($partidos));
        echo json_encode(['success' => true]);
        break;

    case 'borrarPartido':
        $id = $_POST['id'];
        $partidos = array_filter($partidos, fn($p) => $p['id'] != $id);
        file_put_contents($archivoPartidos, json_encode(array_values($partidos)));
        echo json_encode(['success' => true]);
        break;

    // === GALERÍA ===
   // =========================
// GALERÍA DE ESCUDOS
// =========================
case 'listarGaleria':
    $archivoGaleria = "data/galeria.json";
    if (!file_exists($archivoGaleria)) {
        file_put_contents($archivoGaleria, json_encode([]));
    }
    $galeria = json_decode(file_get_contents($archivoGaleria), true);
    echo json_encode(["ok" => true, "data" => $galeria]);
    break;

case 'agregarEscudo':
case 'cambiarEscudo':
    $archivoGaleria = "data/galeria.json";
    if (!file_exists($archivoGaleria)) {
        file_put_contents($archivoGaleria, json_encode([]));
    }
    $galeria = json_decode(file_get_contents($archivoGaleria), true);

    $equipo = $_POST['equipo'];

    // Crear carpeta si no existe
    $dir = "escudos/";
    if (!file_exists($dir)) mkdir($dir, 0777, true);

    if (isset($_FILES['escudo'])) {
        $nombreArchivo = uniqid() . "_" . basename($_FILES['escudo']['name']);
        $rutaDestino = $dir . $nombreArchivo;

        if (move_uploaded_file($_FILES['escudo']['tmp_name'], $rutaDestino)) {
            // Verificar si el equipo ya tenía escudo (y eliminarlo si se cambia)
            foreach ($galeria as &$g) {
                if ($g['equipo'] === $equipo) {
                    if ($accion === 'cambiarEscudo' && file_exists($g['url'])) {
                        unlink($g['url']);
                    }
                    $g['url'] = $rutaDestino;
                    file_put_contents($archivoGaleria, json_encode($galeria, JSON_PRETTY_PRINT));
                    echo json_encode(["ok" => true]);
                    exit;
                }
            }

            // Si no existía, agregar nuevo registro
            $galeria[] = ["equipo" => $equipo, "url" => $rutaDestino];
            file_put_contents($archivoGaleria, json_encode($galeria, JSON_PRETTY_PRINT));
            echo json_encode(["ok" => true]);
        } else {
            echo json_encode(["ok" => false, "error" => "Error al mover el archivo"]);
        }
    } else {
        echo json_encode(["ok" => false, "error" => "No se recibió ningún archivo"]);
    }
    break;

case 'eliminarEscudo':
    $archivoGaleria = "data/galeria.json";
    $equipo = $_POST['equipo'];
    if (!file_exists($archivoGaleria)) {
        echo json_encode(["ok" => false, "error" => "No existe archivo de galería"]);
        break;
    }

    $galeria = json_decode(file_get_contents($archivoGaleria), true);
    foreach ($galeria as $i => $g) {
        if ($g['equipo'] === $equipo) {
            if (file_exists($g['url'])) unlink($g['url']);
            unset($galeria[$i]);
            file_put_contents($archivoGaleria, json_encode(array_values($galeria), JSON_PRETTY_PRINT));
            echo json_encode(["ok" => true]);
            exit;
        }
    }
    echo json_encode(["ok" => false, "error" => "Escudo no encontrado"]);
    break;


    default:
        echo json_encode(['error' => 'Acción no reconocida']);
        break;
}
?>
