<?php
/**
 * creami Memoro — API Photos
 * GET    /api/photos.php           → List photos (supports ?search=, ?album_id=, ?favorite=, ?tag=, ?limit=, ?offset=)
 * GET    /api/photos.php?id=XXX    → Get single photo (+ increment views)
 * POST   /api/photos.php           → Create photo
 * PATCH  /api/photos.php?id=XXX    → Update photo (title, description, tags, album_id, favorite, toggle_fav)
 * DELETE /api/photos.php?id=XXX    → Delete photo
 */
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/Database.php';
require_once __DIR__ . '/../includes/Photo.php';

header('Content-Type: application/json; charset=utf-8');

$photoModel = new Photo();
$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            if (isset($_GET['id'])) {
                // Single photo
                $photo = $photoModel->getById($_GET['id']);
                if (!$photo) {
                    http_response_code(404);
                    echo json_encode(['error' => 'Foto non trovata']);
                    exit;
                }
                // Increment views
                $photoModel->incrementViews($_GET['id']);
                $photo['views']++;
                echo json_encode(['photo' => $photo]);
            } else {
                // List photos
                $filters = [];
                if (!empty($_GET['search']))   $filters['search']   = $_GET['search'];
                if (!empty($_GET['album_id'])) $filters['album_id'] = $_GET['album_id'];
                if (!empty($_GET['favorite'])) $filters['favorite'] = $_GET['favorite'];
                if (!empty($_GET['tag']))      $filters['tag']      = $_GET['tag'];
                if (!empty($_GET['limit']))    $filters['limit']    = (int)$_GET['limit'];
                if (isset($_GET['offset']))    $filters['offset']   = (int)$_GET['offset'];

                $photos = $photoModel->getAll($filters);
                echo json_encode(['photos' => $photos]);
            }
            break;

        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            if (!$data) {
                http_response_code(400);
                echo json_encode(['error' => 'Dati non validi']);
                exit;
            }
            $id = $photoModel->create($data);
            echo json_encode(['id' => $id, 'message' => 'Foto creata']);
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

            // Handle toggle_fav action
            if (isset($data['action']) && $data['action'] === 'toggle_fav') {
                $photoModel->toggleFavorite($id);
                echo json_encode(['message' => 'Preferito aggiornato']);
            } else {
                $photoModel->update($id, $data);
                echo json_encode(['message' => 'Foto aggiornata']);
            }
            break;

        case 'DELETE':
            $id = $_GET['id'] ?? null;
            if (!$id) {
                http_response_code(400);
                echo json_encode(['error' => 'ID richiesto']);
                exit;
            }
            $photoModel->delete($id);
            echo json_encode(['message' => 'Foto eliminata']);
            break;

        default:
            http_response_code(405);
            echo json_encode(['error' => 'Metodo non consentito']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
