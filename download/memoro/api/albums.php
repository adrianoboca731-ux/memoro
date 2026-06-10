<?php
/**
 * creami Memoro — API Albums
 * GET    /api/albums.php          → List all albums
 * GET    /api/albums.php?id=XXX   → Get single album
 * POST   /api/albums.php          → Create album
 * PATCH  /api/albums.php?id=XXX   → Update album
 * DELETE /api/albums.php?id=XXX   → Delete album
 */
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/Database.php';
require_once __DIR__ . '/../includes/Album.php';

header('Content-Type: application/json; charset=utf-8');

$albumModel = new Album();
$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            if (isset($_GET['id'])) {
                $album = $albumModel->getById($_GET['id']);
                if (!$album) {
                    http_response_code(404);
                    echo json_encode(['error' => 'Album non trovato']);
                    exit;
                }
                echo json_encode(['album' => $album]);
            } else {
                $albums = $albumModel->getAll();
                echo json_encode(['albums' => $albums]);
            }
            break;

        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            if (!$data || empty($data['name'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Nome album richiesto']);
                exit;
            }
            $id = $albumModel->create($data);
            echo json_encode(['id' => $id, 'message' => 'Album creato']);
            break;

        case 'PATCH':
            $id = $_GET['id'] ?? null;
            if (!$id) {
                http_response_code(400);
                echo json_encode(['error' => 'ID richiesto']);
                exit;
            }
            $data = json_decode(file_get_contents('php://input'), true);
            if (!$data) {
                http_response_code(400);
                echo json_encode(['error' => 'Dati non validi']);
                exit;
            }
            $albumModel->update($id, $data);
            echo json_encode(['message' => 'Album aggiornato']);
            break;

        case 'DELETE':
            $id = $_GET['id'] ?? null;
            if (!$id) {
                http_response_code(400);
                echo json_encode(['error' => 'ID richiesto']);
                exit;
            }
            $albumModel->delete($id);
            echo json_encode(['message' => 'Album eliminato']);
            break;

        default:
            http_response_code(405);
            echo json_encode(['error' => 'Metodo non consentito']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
