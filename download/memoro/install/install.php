<?php
/**
 * creami Memoro — Script di Installazione Database MySQL
 *
 * Esegui questo script UNA VOLTA per creare le tabelle.
 * Poi eliminalo per sicurezza.
 *
 * Come usare:
 * 1. Modifica includes/config.php con i tuoi dati Altervista
 * 2. Carica tutto sul tuo spazio Altervista via FTP
 * 3. Visita nel browser: https://tuosito.altervista.org/install/install.php
 * 4. Dopo l'installazione, ELIMINA la cartella /install/
 */

require_once __DIR__ . '/../includes/config.php';

header('Content-Type: text/html; charset=utf-8');

$messages = [];
$errors   = [];
$success  = false;

try {
    // Connessione senza database per crearlo se non esiste
    $pdo = new PDO(
        'mysql:host=' . DB_HOST . ';charset=utf8mb4',
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    // Crea il database se non esiste
    $dbName = DB_NAME;
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$dbName}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $pdo->exec("USE `{$dbName}`");
    $messages[] = "Database '{$dbName}' pronto.";

    // Tabella photos
    $pdo->exec("CREATE TABLE IF NOT EXISTS `photos` (
        `id`          VARCHAR(32)  NOT NULL PRIMARY KEY,
        `title`       VARCHAR(255) NOT NULL DEFAULT 'Senza titolo',
        `description` TEXT DEFAULT NULL,
        `filename`    VARCHAR(255) NOT NULL,
        `filepath`    VARCHAR(255) NOT NULL,
        `thumb_path`  VARCHAR(255) DEFAULT NULL,
        `mimetype`    VARCHAR(100) NOT NULL,
        `size`        INT NOT NULL DEFAULT 0,
        `width`       INT DEFAULT NULL,
        `height`      INT DEFAULT NULL,
        `tags`        VARCHAR(500) DEFAULT NULL,
        `album_id`    VARCHAR(32)  DEFAULT NULL,
        `views`       INT NOT NULL DEFAULT 0,
        `favorite`    TINYINT(1)   NOT NULL DEFAULT 0,
        `created_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        `updated_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX `idx_album` (`album_id`),
        INDEX `idx_favorite` (`favorite`),
        INDEX `idx_created` (`created_at`),
        INDEX `idx_tags` (`tags`(191))
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    $messages[] = 'Tabella <strong>photos</strong> creata.';

    // Tabella albums
    $pdo->exec("CREATE TABLE IF NOT EXISTS `albums` (
        `id`          VARCHAR(32)  NOT NULL PRIMARY KEY,
        `name`        VARCHAR(255) NOT NULL,
        `description` TEXT DEFAULT NULL,
        `cover`       VARCHAR(255) DEFAULT NULL,
        `created_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        `updated_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX `idx_created` (`created_at`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    $messages[] = 'Tabella <strong>albums</strong> creata.';

    // Tabella comments
    $pdo->exec("CREATE TABLE IF NOT EXISTS `comments` (
        `id`         VARCHAR(32)  NOT NULL PRIMARY KEY,
        `text`       TEXT NOT NULL,
        `author`     VARCHAR(255) NOT NULL DEFAULT 'Anonimo',
        `photo_id`   VARCHAR(32)  NOT NULL,
        `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX `idx_photo` (`photo_id`),
        INDEX `idx_created` (`created_at`),
        FOREIGN KEY (`photo_id`) REFERENCES `photos`(`id`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    $messages[] = 'Tabella <strong>comments</strong> creata.';

    // Foreign key albums -> photos
    try {
        $pdo->exec("ALTER TABLE `photos` ADD CONSTRAINT `fk_photos_album`
                     FOREIGN KEY (`album_id`) REFERENCES `albums`(`id`) ON DELETE SET NULL");
        $messages[] = 'Foreign key photos → albums aggiunta.';
    } catch (PDOException $e) {
        $messages[] = 'Foreign key photos → albums già esistente (ok).';
    }

    // Cartella uploads
    $uploadDir = __DIR__ . '/../uploads';
    $thumbDir  = $uploadDir . '/thumbs';
    if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);
    if (!is_dir($thumbDir))  mkdir($thumbDir, 0755, true);

    // .htaccess per proteggere l'accesso diretto agli includes
    $htaccess = "Deny from all\n";
    file_put_contents(__DIR__ . '/../includes/.htaccess', $htaccess);

    $messages[] = 'Cartelle uploads create.';
    $messages[] = 'Protezione .htaccess aggiunta.';

    $success = true;

} catch (PDOException $e) {
    $errors[] = 'Errore database: ' . $e->getMessage();
}

// === DATI DI ESEMPIO ===
$seedInserted = false;
if ($success && isset($_GET['seed']) && $_GET['seed'] === '1') {
    try {
        $db = Database::getInstance();

        // Album di esempio
        $albums = [
            ['id' => 'album_paesaggi', 'name' => 'Paesaggi', 'description' => 'Paesaggi italiani mozzafiato, dai laghi alle montagne'],
            ['id' => 'album_ritratti', 'name' => 'Ritratti', 'description' => 'Ritratti artistici in bianco e nero e a colori'],
            ['id' => 'album_natura',   'name' => 'Natura',   'description' => 'La bellezza della natura in macro e paesaggi'],
            ['id' => 'album_citta',    'name' => 'Città',    'description' => 'Scenate urbane italiane al tramonto e all\'alba'],
        ];

        $stmt = $db->prepare(
            'INSERT IGNORE INTO albums (id, name, description, created_at, updated_at) VALUES (:id, :name, :description, NOW(), NOW())'
        );
        foreach ($albums as $album) {
            $stmt->execute($album);
        }

        // Foto di esempio (placeholder - le immagini reali vanno caricate tramite l'app)
        $photos = [
            ['id' => 'photo_001', 'title' => 'Lago di Como',        'description' => 'Il suggestivo Lago di Como al tramonto, con le montagne che si specchiano nelle acque calme', 'tags' => 'lago,como,tramonto,montagne', 'album_id' => 'album_paesaggi', 'views' => 342, 'favorite' => 1],
            ['id' => 'photo_002', 'title' => 'Colline Toscane',     'description' => 'Le dolci colline toscane con i cipressi secolari che disegnano il paesaggio', 'tags' => 'toscana,colline,cipressi,campagna', 'album_id' => 'album_paesaggi', 'views' => 287, 'favorite' => 1],
            ['id' => 'photo_003', 'title' => 'Cinque Terre',        'description' => 'Le coloratissime case di Riomaggiore affacciate sul mare', 'tags' => 'cinque terre,mare,case,liguria', 'album_id' => 'album_paesaggi', 'views' => 445, 'favorite' => 0],
            ['id' => 'photo_004', 'title' => 'Dolomiti',            'description' => 'Le majestose Dolomiti al primo mattino con la nebbia nelle valli', 'tags' => 'dolomiti,montagne,neve,alba', 'album_id' => 'album_paesaggi', 'views' => 428, 'favorite' => 1],
            ['id' => 'photo_005', 'title' => 'Costiera Amalfitana', 'description' => 'Panorama mozzafiato della Costiera Amalfitana dal mare', 'tags' => 'amalfi,costiera,mare,panorama', 'album_id' => 'album_paesaggi', 'views' => 512, 'favorite' => 1],
            ['id' => 'photo_006', 'title' => 'Ritratto Elegante',   'description' => 'Ritratto artistico con luce naturale e sfondo scuro', 'tags' => 'ritratto,elegante,luce,arte', 'album_id' => 'album_ritratti', 'views' => 176, 'favorite' => 0],
            ['id' => 'photo_007', 'title' => 'Ritratto in Bianco e Nero', 'description' => 'Studio ritrattistico in bianco e nero con forte contrasto', 'tags' => 'ritratto,bianco e nero,contrasto', 'album_id' => 'album_ritratti', 'views' => 218, 'favorite' => 1],
            ['id' => 'photo_008', 'title' => 'Farfalla nel Giardino', 'description' => 'Una farfalla posata su un fiore nel giardino di primavera', 'tags' => 'farfalla,macro,fiore,primavera', 'album_id' => 'album_natura', 'views' => 98, 'favorite' => 0],
            ['id' => 'photo_009', 'title' => 'Fiori Selvatici',     'description' => 'Campo di fiori selvatici al sole del pomeriggio', 'tags' => 'fiori,selvatici,campo,sole', 'album_id' => 'album_natura', 'views' => 156, 'favorite' => 1],
            ['id' => 'photo_010', 'title' => 'Roma al Tramonto',    'description' => 'Cupola di San Pietro illuminata dal tramonto romano', 'tags' => 'roma,tramonto,san pietro,cupola', 'album_id' => 'album_citta', 'views' => 523, 'favorite' => 1],
            ['id' => 'photo_011', 'title' => 'Venezia all\'Alba',   'description' => 'Il Canal Grande all\'alba con le gondole ancora ormeggiate', 'tags' => 'venezia,canal grande,alba,gondole', 'album_id' => 'album_citta', 'views' => 631, 'favorite' => 1],
            ['id' => 'photo_012', 'title' => 'Duomo di Firenze',    'description' => 'Il magnifico Duomo di Santa Maria del Fiore visto dal basso', 'tags' => 'firenze,duomo,santa maria,architettura', 'album_id' => 'album_citta', 'views' => 367, 'favorite' => 0],
        ];

        $stmt = $db->prepare(
            'INSERT IGNORE INTO photos (id, title, description, filename, filepath, thumb_path, mimetype, size, tags, album_id, views, favorite, created_at, updated_at)
             VALUES (:id, :title, :description, :filename, :filepath, :thumb_path, :mimetype, :size, :tags, :album_id, :views, :favorite, NOW(), NOW())'
        );
        foreach ($photos as $photo) {
            $photo['filename']   = 'placeholder.jpg';
            $photo['filepath']   = 'uploads/placeholder.jpg';
            $photo['thumb_path'] = 'uploads/thumbs/placeholder.jpg';
            $photo['mimetype']   = 'image/jpeg';
            $photo['size']       = rand(500000, 3000000);
            $stmt->execute($photo);
        }

        // Commenti di esempio
        $comments = [
            ['id' => 'comm_001', 'text' => 'Che spettacolo! Le montagne si specchiano perfettamente nel lago.', 'author' => 'Marco R.', 'photo_id' => 'photo_001'],
            ['id' => 'comm_002', 'text' => 'Ci sono stato l\'estate scorsa, è ancora più bello dal vivo!', 'author' => 'Laura B.', 'photo_id' => 'photo_001'],
            ['id' => 'comm_003', 'text' => 'I colori del tramonto sono magici.', 'author' => 'Giulia S.', 'photo_id' => 'photo_004'],
            ['id' => 'comm_004', 'text' => 'Le Dolomiti sono il mio posto preferito al mondo.', 'author' => 'Andrea M.', 'photo_id' => 'photo_004'],
            ['id' => 'comm_005', 'text' => 'Che meraviglia! Quale macchina fotografica hai usato?', 'author' => 'Sofia C.', 'photo_id' => 'photo_005'],
            ['id' => 'comm_006', 'text' => 'La Costiera è un sogno, complimenti per lo scatto!', 'author' => 'Davide L.', 'photo_id' => 'photo_005'],
            ['id' => 'comm_007', 'text' => 'Il contrasto in bianco e nero è molto efficace.', 'author' => 'Francesca T.', 'photo_id' => 'photo_007'],
            ['id' => 'comm_008', 'text' => 'Roma è sempre bellissima, soprattutto al tramonto.', 'author' => 'Roberto V.', 'photo_id' => 'photo_010'],
            ['id' => 'comm_009', 'text' => 'San Pietro illuminata così è impareggiabile.', 'author' => 'Elena P.', 'photo_id' => 'photo_010'],
            ['id' => 'comm_010', 'text' => 'Venezia all\'alba ha un\'atmosfera unica.', 'author' => 'Luca D.', 'photo_id' => 'photo_011'],
            ['id' => 'comm_011', 'text' => 'Le gondole ferme danno un senso di pace infinita.', 'author' => 'Chiara F.', 'photo_id' => 'photo_011'],
            ['id' => 'comm_012', 'text' => 'I cipressi toscani sono iconici, bella composizione!', 'author' => 'Matteo G.', 'photo_id' => 'photo_002'],
            ['id' => 'comm_013', 'text' => 'Mi fa venire voglia di prendere un aereo subito!', 'author' => 'Valentina N.', 'photo_id' => 'photo_003'],
            ['id' => 'comm_014', 'text' => 'Il dettaglio della farfalla è incredibile, che macro!', 'author' => 'Antonio R.', 'photo_id' => 'photo_008'],
            ['id' => 'comm_015', 'text' => 'Il Duomo visto da questa prospettiva è impressionante.', 'author' => 'Sara B.', 'photo_id' => 'photo_012'],
        ];

        $stmt = $db->prepare(
            'INSERT IGNORE INTO comments (id, text, author, photo_id, created_at) VALUES (:id, :text, :author, :photo_id, NOW())'
        );
        foreach ($comments as $comment) {
            $stmt->execute($comment);
        }

        // Crea immagine placeholder
        $placeholderPath = $uploadDir . '/placeholder.jpg';
        if (!file_exists($placeholderPath)) {
            $img = imagecreatetruecolor(800, 600);
            $bg  = imagecolorallocate($img, 45, 55, 72);
            $fg  = imagecolorallocate($img, 200, 210, 220);
            imagefill($img, 0, 0, $bg);
            imagestring($img, 5, 280, 280, 'Carica le tue foto!', $fg);
            imagejpeg($img, $placeholderPath, 85);
            imagedestroy($img);

            // Thumbnail placeholder
            $thumbImg = imagecreatetruecolor(THUMB_WIDTH, 300);
            imagefill($thumbImg, 0, 0, $bg);
            imagestring($thumbImg, 3, 140, 140, 'Carica foto', $fg);
            imagejpeg($thumbImg, $thumbDir . '/placeholder.jpg', 85);
            imagedestroy($thumbImg);
        }

        $seedInserted = true;

    } catch (PDOException $e) {
        $errors[] = 'Errore durante il seed: ' . $e->getMessage();
    }
}
?>
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>creami Memoro — Installazione</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 700px; margin: 40px auto; padding: 20px; background: #f7f7f7; color: #1a1a2e; }
        h1 { color: #0063dc; }
        .msg { padding: 12px 16px; margin: 8px 0; border-radius: 8px; }
        .ok  { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .err { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        .btn { display: inline-block; padding: 12px 24px; background: #0063dc; color: white; border: none; border-radius: 8px; font-size: 16px; cursor: pointer; text-decoration: none; }
        .btn:hover { background: #0052b5; }
        .btn-danger { background: #dc3545; }
        .btn-danger:hover { background: #c82333; }
        code { background: #e9ecef; padding: 2px 6px; border-radius: 4px; }
    </style>
</head>
<body>
    <h1>📸 creami Memoro — Installazione</h1>

    <?php foreach ($messages as $msg): ?>
        <div class="msg ok">✅ <?= $msg ?></div>
    <?php endforeach; ?>

    <?php foreach ($errors as $msg): ?>
        <div class="msg err">❌ <?= $msg ?></div>
    <?php endforeach; ?>

    <?php if ($success && !$seedInserted): ?>
        <div class="msg ok">
            <strong>Database installato con successo!</strong><br>
            Ora puoi inserire i dati di esempio oppure iniziare con il sito vuoto.
        </div>
        <p>
            <a href="?seed=1" class="btn">Inserisci Dati di Esempio</a>
            <a href="../" class="btn" style="background:#28a745;margin-left:10px">Vai al Sito</a>
        </p>
    <?php endif; ?>

    <?php if ($seedInserted): ?>
        <div class="msg ok">
            <strong>Dati di esempio inseriti!</strong><br>
            4 album, 12 foto e 15 commenti sono stati aggiunti al database.
        </div>
        <p>
            <a href="../" class="btn">Vai al Sito</a>
        </p>
        <div class="msg err">
            <strong>⚠️ IMPORTANTE:</strong> Ricordati di <strong>eliminare la cartella /install/</strong> dal server dopo l'installazione!
        </div>
    <?php endif; ?>

    <?php if (!$success && empty($errors)): ?>
        <p>Clicca il pulsante per iniziare l'installazione del database.</p>
        <a href="?" class="btn">Installa Database</a>
    <?php endif; ?>
</body>
</html>
