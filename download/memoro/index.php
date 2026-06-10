<?php
/**
 * creami Memoro — Pagina Principale
 * Clone Flickr per Altervista
 */
require_once __DIR__ . '/includes/config.php';
require_once __DIR__ . '/includes/Database.php';
require_once __DIR__ . '/includes/Photo.php';
require_once __DIR__ . '/includes/Album.php';
require_once __DIR__ . '/includes/Comment.php';

$photoModel  = new Photo();
$albumModel  = new Album();
$commentModel = new Comment();

// Stats
$stats = $photoModel->getStats();

// Albums for sidebar
$albums = $albumModel->getAll();

// Check if DB is installed
$dbInstalled = true;
try {
    Database::getInstance()->query('SELECT 1 FROM photos LIMIT 1');
} catch (PDOException $e) {
    $dbInstalled = false;
}
?>
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>creami Memoro — Condividi i Tuoi Ricordi</title>
    <meta name="description" content="creami Memoro - La tua galleria fotografica personale. Condividi i tuoi ricordi con il mondo.">
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📸</text></svg>">
    <link rel="stylesheet" href="css/style.css?v=<?= time() ?>">
</head>
<body>
    <?php if (!$dbInstalled): ?>
    <div class="install-banner">
        <p>⚠️ Database non installato. <a href="install/install.php">Clicca qui per installare</a></p>
    </div>
    <?php endif; ?>

    <!-- HEADER -->
    <header class="header">
        <div class="header-inner">
            <a href="index.php" class="logo">
                <svg class="logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                </svg>
                <span class="logo-text">creami <span class="logo-accent">Memoro</span></span>
            </a>

            <div class="search-bar">
                <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input type="text" id="searchInput" placeholder="Cerca foto, tag, album..." autocomplete="off">
            </div>

            <nav class="nav-tabs" id="navTabs">
                <button class="nav-tab active" data-view="explore">Esplora</button>
                <button class="nav-tab" data-view="albums">Album</button>
                <button class="nav-tab" data-view="favorites">Preferiti</button>
                <button class="nav-tab" data-view="recent">Recenti</button>
            </nav>

            <div class="header-actions">
                <button class="btn-upload" id="btnUpload">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    Carica
                </button>
                <button class="btn-theme" id="btnTheme" title="Cambia tema">
                    <svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                    </svg>
                    <svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                    </svg>
                </button>
            </div>
        </div>
    </header>

    <!-- STATS BAR -->
    <div class="stats-bar">
        <div class="stat"><span class="stat-num" id="statPhotos"><?= number_format($stats['photos'], 0, ',', '.') ?></span> foto</div>
        <div class="stat"><span class="stat-num" id="statAlbums"><?= number_format($stats['albums'], 0, ',', '.') ?></span> album</div>
        <div class="stat"><span class="stat-num" id="statFavorites"><?= number_format($stats['favorites'], 0, ',', '.') ?></span> preferiti</div>
        <div class="stat"><span class="stat-num" id="statViews"><?= number_format($stats['views'], 0, ',', '.') ?></span> visualizzazioni</div>
    </div>

    <!-- MAIN CONTENT -->
    <main class="main-content">
        <!-- EXPLORE VIEW -->
        <div class="view active" id="viewExplore">
            <div class="view-header">
                <h1>Esplora</h1>
                <p>Scopri foto straordinarie</p>
            </div>
            <div class="photo-grid" id="photoGrid">
                <!-- Photos rendered by JS -->
            </div>
            <div class="empty-state" id="emptyExplore" style="display:none">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="64" height="64">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                </svg>
                <h3>Nessuna foto ancora</h3>
                <p>Carica la tua prima foto per iniziare!</p>
            </div>
        </div>

        <!-- ALBUMS VIEW -->
        <div class="view" id="viewAlbums">
            <div class="view-header">
                <h2>Album</h2>
                <button class="btn-small" id="btnNewAlbum">+ Nuovo Album</button>
            </div>
            <div class="albums-grid" id="albumsGrid">
                <!-- Albums rendered by JS -->
            </div>
            <div class="album-detail" id="albumDetail" style="display:none">
                <button class="btn-back" id="btnBackAlbums">← Tutti gli Album</button>
                <h2 id="albumDetailTitle"></h2>
                <p id="albumDetailDesc"></p>
                <span id="albumDetailCount"></span>
                <div class="photo-grid" id="albumPhotoGrid"></div>
            </div>
        </div>

        <!-- FAVORITES VIEW -->
        <div class="view" id="viewFavorites">
            <div class="view-header">
                <h1>Preferiti</h1>
                <p>Le tue foto preferite</p>
            </div>
            <div class="photo-grid" id="favPhotoGrid"></div>
            <div class="empty-state" id="emptyFavorites" style="display:none">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="64" height="64">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                <h3>Nessun preferito</h3>
                <p>Clicca il cuore sulle foto per aggiungerle ai preferiti</p>
            </div>
        </div>

        <!-- RECENT VIEW -->
        <div class="view" id="viewRecent">
            <div class="view-header">
                <h1>Recenti</h1>
                <p>Le ultime foto caricate</p>
            </div>
            <div class="photo-grid" id="recentPhotoGrid"></div>
        </div>

        <!-- SEARCH RESULTS -->
        <div class="view" id="viewSearch">
            <div class="view-header">
                <h1 id="searchTitle">Risultati di ricerca</h1>
                <p id="searchSubtitle"></p>
            </div>
            <div class="photo-grid" id="searchPhotoGrid"></div>
            <div class="empty-state" id="emptySearch" style="display:none">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="64" height="64">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <h3>Nessun risultato</h3>
                <p>Prova con un termine di ricerca diverso</p>
            </div>
        </div>
    </main>

    <!-- PHOTO LIGHTBOX -->
    <div class="lightbox" id="lightbox" style="display:none">
        <div class="lightbox-backdrop" id="lightboxBackdrop"></div>
        <div class="lightbox-content">
            <button class="lightbox-close" id="lightboxClose">&times;</button>
            <button class="lightbox-nav lightbox-prev" id="lightboxPrev">‹</button>
            <button class="lightbox-nav lightbox-next" id="lightboxNext">›</button>

            <div class="lightbox-body">
                <div class="lightbox-image-wrap">
                    <img id="lightboxImage" src="" alt="">
                </div>
                <div class="lightbox-sidebar">
                    <div class="lightbox-info">
                        <h2 id="lbTitle" contenteditable="true"></h2>
                        <div class="lb-meta">
                            <span id="lbViews"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> <span></span></span>
                            <span id="lbDate"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> <span></span></span>
                            <span id="lbAlbum" style="display:none"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg> <span></span></span>
                        </div>
                        <p id="lbDescription" contenteditable="true" class="lb-desc"></p>
                        <div class="lb-tags" id="lbTags"></div>
                    </div>

                    <div class="lightbox-actions">
                        <button class="btn-icon" id="lbFavBtn" title="Preferito">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                        </button>
                        <button class="btn-icon btn-danger" id="lbDeleteBtn" title="Elimina">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                        <button class="btn-icon" id="lbSaveBtn" title="Salva modifiche" style="display:none">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                        </button>
                    </div>

                    <!-- Comments -->
                    <div class="lb-comments">
                        <h3 id="lbCommentsTitle">Commenti</h3>
                        <div class="comments-list" id="commentsList"></div>
                        <form class="comment-form" id="commentForm">
                            <input type="text" id="commentAuthor" placeholder="Il tuo nome" required>
                            <textarea id="commentText" placeholder="Aggiungi un commento..." rows="2" required></textarea>
                            <button type="submit" class="btn-small">Invia</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- UPLOAD MODAL -->
    <div class="modal" id="uploadModal" style="display:none">
        <div class="modal-backdrop" id="uploadBackdrop"></div>
        <div class="modal-content">
            <div class="modal-header">
                <h2>Carica Foto</h2>
                <button class="modal-close" id="uploadClose">&times;</button>
            </div>
            <div class="modal-body">
                <div class="upload-zone" id="uploadZone">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    <p>Trascina le foto qui oppure</p>
                    <label class="btn-upload-label">
                        Scegli File
                        <input type="file" id="fileInput" accept="image/jpeg,image/png,image/gif,image/webp" multiple hidden>
                    </label>
                    <small>Massimo 10MB per file — JPG, PNG, GIF, WebP</small>
                </div>

                <div class="upload-preview" id="uploadPreview" style="display:none">
                    <div id="previewList"></div>
                </div>

                <form id="uploadForm" style="display:none">
                    <div class="form-group">
                        <label>Titolo</label>
                        <input type="text" id="uploadTitle" placeholder="Titolo della foto">
                    </div>
                    <div class="form-group">
                        <label>Descrizione</label>
                        <textarea id="uploadDesc" placeholder="Descrivi la tua foto..." rows="3"></textarea>
                    </div>
                    <div class="form-group">
                        <label>Tag (separati da virgola)</label>
                        <input type="text" id="uploadTags" placeholder="es. paesaggio, tramonto, mare">
                    </div>
                    <div class="form-group">
                        <label>Album</label>
                        <select id="uploadAlbum">
                            <option value="">Nessun album</option>
                            <?php foreach ($albums as $album): ?>
                            <option value="<?= htmlspecialchars($album['id']) ?>"><?= htmlspecialchars($album['name']) ?></option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    <div class="upload-progress" id="uploadProgress" style="display:none">
                        <div class="progress-bar"><div class="progress-fill" id="progressFill"></div></div>
                        <span id="progressText">Caricamento...</span>
                    </div>
                    <button type="submit" class="btn-primary" id="btnUploadSubmit">Carica Foto</button>
                </form>
            </div>
        </div>
    </div>

    <!-- NEW ALBUM MODAL -->
    <div class="modal" id="albumModal" style="display:none">
        <div class="modal-backdrop" id="albumBackdrop"></div>
        <div class="modal-content modal-small">
            <div class="modal-header">
                <h2>Nuovo Album</h2>
                <button class="modal-close" id="albumClose">&times;</button>
            </div>
            <div class="modal-body">
                <form id="albumForm">
                    <div class="form-group">
                        <label>Nome Album</label>
                        <input type="text" id="albumName" placeholder="Es. Vacanze 2024" required>
                    </div>
                    <div class="form-group">
                        <label>Descrizione</label>
                        <textarea id="albumDesc" placeholder="Descrivi l'album..." rows="3"></textarea>
                    </div>
                    <button type="submit" class="btn-primary">Crea Album</button>
                </form>
            </div>
        </div>
    </div>

    <!-- TOAST NOTIFICATIONS -->
    <div class="toast-container" id="toastContainer"></div>

    <!-- FOOTER -->
    <footer class="footer">
        <div class="footer-inner">
            <span class="footer-brand">creami <span class="logo-accent">Memoro</span></span>
            <span class="footer-tagline">Condividi i Tuoi Ricordi</span>
            <span class="footer-tech">PHP + MySQL su Altervista</span>
        </div>
    </footer>

    <script>
    // Pass PHP data to JS
    window.MEMORO = {
        albums: <?= json_encode($albums) ?>,
        dbInstalled: <?= $dbInstalled ? 'true' : 'false' ?>
    };
    </script>
    <script src="js/app.js?v=<?= time() ?>"></script>
</body>
</html>
