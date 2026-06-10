<?php
/**
 * creami Memoro — Configurazione Database Altervista
 *
 * IMPORTANTE: Modifica queste costanti con i tuoi dati Altervista
 * - DB_HOST: di solito 'localhost' su Altervista
 * - DB_NAME: il nome del tuo database MySQL (disponibile nel pannello Altervista)
 * - DB_USER: il tuo username Altervista (es. 'my_altervista_username')
 * - DB_PASS: la password del database MySQL
 */

// === CONFIGURAZIONE DATABASE ===
define('DB_HOST', 'localhost');
define('DB_NAME', 'my_altervista_username');      // ← Cambia con il tuo DB name
define('DB_USER', 'my_altervista_username');       // ← Cambia con il tuo username
define('DB_PASS', 'la_tua_password_mysql');        // ← Cambia con la tua password

// === CONFIGURAZIONE APP ===
define('APP_NAME', 'creami Memoro');
define('APP_TAGLINE', 'Condividi i Tuoi Ricordi');
define('MAX_FILE_SIZE', 10 * 1024 * 1024); // 10MB
define('THUMB_WIDTH', 400);
define('THUMB_HEIGHT', 400);
define('UPLOAD_DIR', __DIR__ . '/../uploads/');
define('THUMB_DIR', __DIR__ . '/../uploads/thumbs/');
define('ALLOWED_TYPES', ['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

// === CONFIGURAZIONE SITO ===
define('SITE_URL', 'https://tuosito.altervista.org');  // ← Cambia con il tuo URL
define('PHOTOS_PER_PAGE', 24);

// === TIMEZONE ===
date_default_timezone_set('Europe/Rome');

// === AUTOLOAD ===
spl_autoload_register(function ($class) {
    $file = __DIR__ . '/' . $class . '.php';
    if (file_exists($file)) {
        require_once $file;
    }
});
