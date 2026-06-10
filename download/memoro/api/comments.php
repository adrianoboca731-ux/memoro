<?php
/**
 * creami Memoro — API Comments
 * GET    /api/comments.php?photo_id=XXX  → List comments for a photo
 * POST   /api/comments.php               → Add comment
 * DELETE /api/comments.php?id=XXX         → Delete comment
 */
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/Database.php';
require_once __DIR__ . '/../includes/Comment.php';

header('Content-Type: application/json; charset=utf-8');

$commentModel = new Comment();
$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            $photoId = $_GET['photo_id'] ?? null;
            if (!$photoId) {
                http_response_code(400);
                echo json_encode(['error' => 'photo_id richiesto']);
                exit;
            }
            $comments = $commentModel->getByPhotoId($photoId);
            echo json_encode(['comments' => $comments]);
            break;

        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            if (!$data || empty($data['text']) || empty($data['photo_id'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Testo e photo_id richiesti']);
                exit;
            }
            $id = $commentModel->create($data);
            echo json_encode(['id' => $id, 'message' => 'Commento aggiunto']);
            break;

        case 'DELETE':
            $id = $_GET['id'] ?? null;
            if (!$id) {
                http_response_code(400);
                echo json_encode(['error' => 'ID richiesto']);
                exit;
            }
            $commentModel->delete($id);
            echo json_encode(['message' => 'Commento eliminato']);
            break;

        default:
            http_response_code(405);
            echo json_encode(['error' => 'Metodo non consentito']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
