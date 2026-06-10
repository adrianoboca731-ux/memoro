<?php
/**
 * creami Memoro — API Stats
 * GET /api/stats.php  → Return photo/album/favorites/views counts
 */
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/Database.php';
require_once __DIR__ . '/../includes/Photo.php';

header('Content-Type: application/json; charset=utf-8');

try {
    $photoModel = new Photo();
    $stats = $photoModel->getStats();
    echo json_encode($stats);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
