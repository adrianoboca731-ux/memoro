<?php
/**
 * creami Memoro — API Upload
 * POST /api/upload.php  → Upload photo(s) with multipart/form-data
 *
 * Form fields:
 * - photo:     File (required)
 * - title:     String
 * - description: String
 * - tags:      String (comma separated)
 * - album_id:  String
 */
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/Database.php';
require_once __DIR__ . '/../includes/Photo.php';
require_once __DIR__ . '/../includes/Album.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Metodo non consentito']);
    exit;
}

try {
    if (empty($_FILES['photo'])) {
        throw new Exception('Nessun file caricato');
    }

    $file = $_FILES['photo'];

    // Validate
    if ($file['error'] !== UPLOAD_ERR_OK) {
        $errors = [
            UPLOAD_ERR_INI_SIZE   => 'Il file supera il limite del server',
            UPLOAD_ERR_FORM_SIZE  => 'Il file supera il limite del form',
            UPLOAD_ERR_PARTIAL    => 'Upload incompleto',
            UPLOAD_ERR_NO_FILE    => 'Nessun file caricato',
            UPLOAD_ERR_NO_TMP_DIR => 'Cartella temporanea mancante',
            UPLOAD_ERR_CANT_WRITE => 'Impossibile scrivere il file',
        ];
        throw new Exception($errors[$file['error']] ?? 'Errore upload sconosciuto');
    }

    if ($file['size'] > MAX_FILE_SIZE) {
        throw new Exception('Il file supera il limite di 10MB');
    }

    if (!in_array($file['type'], ALLOWED_TYPES)) {
        throw new Exception('Tipo file non consentito. Usa JPG, PNG, GIF o WebP');
    }

    // Generate unique filename
    $ext = pathinfo($file['name'], PATHINFO_EXTENSION) ?: 'jpg';
    $basename = bin2hex(random_bytes(8));
    $filename = $basename . '.' . $ext;
    $filepath = 'uploads/' . $filename;
    $fullpath = UPLOAD_DIR . $filename;
    $thumbFilename = 'thumb_' . $basename . '.' . $ext;
    $thumbPath = 'uploads/thumbs/' . $thumbFilename;
    $fullThumbPath = THUMB_DIR . $thumbFilename;

    // Move uploaded file
    if (!move_uploaded_file($file['tmp_name'], $fullpath)) {
        throw new Exception('Errore salvataggio file');
    }

    // Get image dimensions
    $imageInfo = getimagesize($fullpath);
    $width  = $imageInfo ? $imageInfo[0] : null;
    $height = $imageInfo ? $imageInfo[1] : null;

    // Create thumbnail using GD
    $thumbCreated = false;
    if ($imageInfo && function_exists('imagecreatetruecolor')) {
        $srcImage = null;
        switch ($imageInfo[2]) {
            case IMAGETYPE_JPEG: $srcImage = imagecreatefromjpeg($fullpath); break;
            case IMAGETYPE_PNG:  $srcImage = imagecreatefrompng($fullpath);  break;
            case IMAGETYPE_GIF:  $srcImage = imagecreatefromgif($fullpath);  break;
            case IMAGETYPE_WEBP: $srcImage = imagecreatefromwebp($fullpath); break;
        }

        if ($srcImage) {
            $origW = imagesx($srcImage);
            $origH = imagesy($srcImage);

            // Calculate thumb dimensions
            $ratio = $origW / $origH;
            $thumbW = THUMB_WIDTH;
            $thumbH = (int)($thumbW / $ratio);

            if ($thumbH > 600) {
                $thumbH = 600;
                $thumbW = (int)($thumbH * $ratio);
            }

            $dstImage = imagecreatetruecolor($thumbW, $thumbH);

            // Preserve transparency for PNG/GIF
            if ($imageInfo[2] === IMAGETYPE_PNG || $imageInfo[2] === IMAGETYPE_GIF) {
                imagealphablending($dstImage, false);
                imagesavealpha($dstImage, true);
                $transparent = imagecolorallocatealpha($dstImage, 0, 0, 0, 127);
                imagefill($dstImage, 0, 0, $transparent);
            }

            imagecopyresampled($dstImage, $srcImage, 0, 0, 0, 0, $thumbW, $thumbH, $origW, $origH);

            switch ($imageInfo[2]) {
                case IMAGETYPE_JPEG: imagejpeg($dstImage, $fullThumbPath, 85); break;
                case IMAGETYPE_PNG:  imagepng($dstImage, $fullThumbPath, 8);   break;
                case IMAGETYPE_GIF:  imagegif($dstImage, $fullThumbPath);       break;
                case IMAGETYPE_WEBP: imagewebp($dstImage, $fullThumbPath, 85); break;
            }

            imagedestroy($srcImage);
            imagedestroy($dstImage);
            $thumbCreated = true;
        }
    }

    // Save to database
    $photoModel = new Photo();
    $photoData = [
        'title'       => $_POST['title'] ?? pathinfo($file['name'], PATHINFO_FILENAME),
        'description' => $_POST['description'] ?? null,
        'filename'    => $filename,
        'filepath'    => $filepath,
        'thumb_path'  => $thumbCreated ? $thumbPath : $filepath,
        'mimetype'    => $file['type'],
        'size'        => $file['size'],
        'width'       => $width,
        'height'      => $height,
        'tags'        => $_POST['tags'] ?? null,
        'album_id'    => !empty($_POST['album_id']) ? $_POST['album_id'] : null,
    ];

    $id = $photoModel->create($photoData);

    // Update album cover
    if (!empty($_POST['album_id'])) {
        $albumModel = new Album();
        $albumModel->updateCover($_POST['album_id']);
    }

    echo json_encode([
        'success' => true,
        'id'      => $id,
        'message' => 'Foto caricata con successo',
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['error' => $e->getMessage()]);
}
