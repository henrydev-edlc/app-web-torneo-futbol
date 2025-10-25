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
// Nota: para la galería usaremos "data/galeria.json" (asegúrate que exista la carpeta data)
$archivoGaleria = "data/galeria.json";

// Crea archivos vacíos si no existen
if (!file_exists($archivoEquipos)) file_put_contents($archivoEquipos, json_encode([]));
if (!file_exists($archivoPartidos)) file_put_contents($archivoPartidos, json_encode([]));
if (!file_exists(dirname($archivoGaleria))) mkdir(dirname($archivoGaleria), 0777, true);
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

    // =========================
    // GALERÍA DE ESCUDOS (actualizada para subir archivos y guardar copia local)
    // =========================
    case 'listarGaleria':
        // Asegurar archivo
        if (!file_exists($archivoGaleria)) {
            file_put_contents($archivoGaleria, json_encode([]));
        }
        $galeria = json_decode(file_get_contents($archivoGaleria), true);
        echo json_encode(["ok" => true, "data" => $galeria]);
        break;

    case 'agregarEscudo':
    case 'cambiarEscudo':
        // rutas y límites
        $maxSize = 5 * 1024 * 1024; // 5 MB

        $dirRel = 'escudos'; // carpeta pública relativa en la raíz del proyecto
        $dirFS = __DIR__ . DIRECTORY_SEPARATOR . $dirRel . DIRECTORY_SEPARATOR;


        // asegurar carpeta escudos
        if (!file_exists($dirFS)) {
            if (!mkdir($dirFS, 0777, true)) {
                http_response_code(500);
                echo json_encode(['ok' => false, 'error' => 'No se pudo crear carpeta de escudos']);
                exit;
            }
        }

        // asegurar archivo galeria
        if (!file_exists($archivoGaleria)) {
            file_put_contents($archivoGaleria, json_encode([]));
        }
        $galeria = json_decode(file_get_contents($archivoGaleria), true);
        if (!is_array($galeria)) $galeria = [];

        $equipo = isset($_POST['equipo']) ? preg_replace('/[^a-zA-Z0-9_\-]/', '', $_POST['equipo']) : null;
        if (!$equipo) {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => 'Falta parámetro equipo']);
            exit;
        }

        if (!isset($_FILES['escudo'])) {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => 'No se recibió ningún archivo']);
            exit;
        }

        $file = $_FILES['escudo'];
        if ($file['error'] !== UPLOAD_ERR_OK) {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => 'Error en la subida: ' . $file['error']]);
            exit;
        }

        if ($file['size'] > $maxSize) {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => 'Archivo demasiado grande (máx 5 MB)']);
            exit;
        }

        // validar que sea imagen
        $info = @getimagesize($file['tmp_name']);
        if ($info === false) {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => 'El archivo no es una imagen válida']);
            exit;
        }

        $mime = $info['mime'];
        $ext = '';
        switch ($mime) {
            case 'image/jpeg':
                $ext = '.jpg';
                break;
            case 'image/png':
                $ext = '.png';
                break;
            case 'image/gif':
                $ext = '.gif';
                break;
            case 'image/webp':
                $ext = '.webp';
                break;
            default:
                http_response_code(400);
                echo json_encode(['ok' => false, 'error' => 'Tipo de imagen no soportado']);
                exit;
        }

        // generar nombre único
        $nombreUnico = $equipo . '_' . time() . '_' . mt_rand(1000, 999999) . $ext;
        $rutaDestinoFS = $dirFS . $nombreUnico;

        // ruta pública que devolverá el script (ajusta si tu app usa un base path distinto)
       // $rutaPublica = trim($dirRel, '/') . '/' . $nombreUnico; // -> "escudos/nombre.png"

        $rutaPublica = '/LIGA_FUT/' . trim($dirRel, '/') . '/' . $nombreUnico;

        // mover archivo
        if (!move_uploaded_file($file['tmp_name'], $rutaDestinoFS)) {
            http_response_code(500);
            echo json_encode(['ok' => false, 'error' => 'No se pudo guardar el archivo en el servidor']);
            exit;
        }

        // si es cambiarEscudo, eliminar la antigua si existe
        $found = false;
        foreach ($galeria as $idx => $g) {
            if (isset($g['equipo']) && strval($g['equipo']) === strval($equipo)) {
                // eliminar archivo antiguo (si existe y no es la misma ruta)
                if (!empty($g['url'])) {
                    // construir ruta absoluta posible (quita leading slash si lo tiene)
                    $possible = __DIR__ . DIRECTORY_SEPARATOR . ltrim($g['url'], '/\\');
                    if (file_exists($possible) && is_file($possible) && realpath($possible) !== realpath($rutaDestinoFS)) {
                        @unlink($possible);
                    }
                }
                // actualizar url
                $galeria[$idx]['url'] = $rutaPublica;
                $found = true;
                break;
            }
        }

        if (!$found) {
            // agregar nuevo registro
            $galeria[] = ['equipo' => $equipo, 'url' => $rutaPublica];
        }

        // guardar galeria.json
        if (file_put_contents($archivoGaleria, json_encode(array_values($galeria), JSON_PRETTY_PRINT)) === false) {
            // archivo guardado pero no se pudo actualizar galeria.json
            echo json_encode(['ok' => true, 'url' => $rutaPublica, 'warning' => 'No se pudo actualizar galeria.json']);
            exit;
        }

        echo json_encode(['ok' => true, 'url' => $rutaPublica]);
        break;

    case 'eliminarEscudo':
    // asegurar archivo galeria
    if (!file_exists($archivoGaleria)) {
        echo json_encode(["ok" => false, "error" => "No existe archivo de galería"]);
        break;
    }

    $equipo = isset($_POST['equipo']) ? preg_replace('/[^a-zA-Z0-9_\-]/', '', $_POST['equipo']) : null;
    if (!$equipo) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Falta parámetro equipo']);
        exit;
    }

    $galeria = json_decode(file_get_contents($archivoGaleria), true);
    if (!is_array($galeria)) $galeria = [];

    $deleted = false;
    foreach ($galeria as $i => $g) {
        if (isset($g['equipo']) && strval($g['equipo']) === strval($equipo)) {
            // obtener url guardada
            $url = isset($g['url']) ? trim($g['url']) : '';

            if ($url !== '') {
                // normalizar y mapear url a ruta en el sistema de archivos
                $url_sin_slash = ltrim($url, '/\\');

                // Si tu JSON almacena "LIGA_FUT/escudos/..." o "/LIGA_FUT/escudos/..."
                // quitamos el posible prefijo del nombre del proyecto (case-insensitive)
                $url_sin_slash = preg_replace('#^liga_fut/?#i', '', $url_sin_slash);

                // ruta absoluta posible
                $possible = realpath(__DIR__ . DIRECTORY_SEPARATOR . $url_sin_slash);

                // ruta del directorio escudos en FS (normalizada)
                $dirEscudosFS = realpath(__DIR__ . DIRECTORY_SEPARATOR . 'escudos');

                // seguridad: asegurarnos que la ruta del archivo esté dentro de la carpeta escudos
                if ($possible && $dirEscudosFS && strpos($possible, $dirEscudosFS) === 0) {
                    if (file_exists($possible) && is_file($possible)) {
                        if (!@unlink($possible)) {
                            // no se pudo borrar (p. ej. por permisos). Devuelve error indicando path para debug
                            echo json_encode(['ok' => false, 'error' => 'No se pudo eliminar el archivo (permisos?)', 'path' => $possible]);
                            exit;
                        }
                    }
                } else {
                    // No estaba dentro de escudos: no intentamos borrar por seguridad.
                    // (Opcional: loggear para debug)
                }
            }

            // eliminar el registro del arreglo galeria
            array_splice($galeria, $i, 1);

            // guardar galeria.json
            if (file_put_contents($archivoGaleria, json_encode(array_values($galeria), JSON_PRETTY_PRINT)) === false) {
                echo json_encode(['ok' => false, 'error' => 'No se pudo actualizar galeria.json']);
                exit;
            }

            echo json_encode(['ok' => true]);
            $deleted = true;
            break;
        }
    }

    if (!$deleted) {
        echo json_encode(["ok" => false, "error" => "Escudo no encontrado"]);
    }
    break;

    default:
        echo json_encode(['error' => 'Acción no reconocida']);
        break;
}
