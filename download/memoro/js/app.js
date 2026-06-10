/**
 * creami Memoro — JavaScript Application
 * Flickr-like SPA experience
 */
(function() {
    'use strict';

    // === STATE ===
    const state = {
        currentView: 'explore',
        photos: [],
        albums: window.MEMORO?.albums || [],
        selectedPhotoId: null,
        selectedAlbumId: null,
        searchQuery: '',
        uploadFiles: [],
        lightboxPhotos: [],
    };

    // === DOM ELEMENTS ===
    const $ = id => document.getElementById(id);
    const $$ = sel => document.querySelectorAll(sel);

    // === API HELPERS ===
    async function api(endpoint, options = {}) {
        try {
            const resp = await fetch('api/' + endpoint, {
                headers: { 'Accept': 'application/json', ...(options.headers || {}) },
                ...options,
            });
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            return await resp.json();
        } catch (err) {
            console.error('API Error:', err);
            throw err;
        }
    }

    // === TOAST ===
    function toast(message, type = 'info') {
        const container = $('toastContainer');
        const el = document.createElement('div');
        el.className = `toast ${type}`;
        el.textContent = message;
        container.appendChild(el);
        setTimeout(() => el.remove(), 3000);
    }

    // === THEME ===
    function initTheme() {
        const saved = localStorage.getItem('memoro-theme');
        if (saved) {
            document.documentElement.setAttribute('data-theme', saved);
        } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.setAttribute('data-theme', 'dark');
        }
    }

    function toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('memoro-theme', next);
    }

    // === NAVIGATION ===
    function switchView(view) {
        state.currentView = view;
        $$('.view').forEach(v => v.classList.remove('active'));
        const viewMap = {
            explore: 'viewExplore',
            albums: 'viewAlbums',
            favorites: 'viewFavorites',
            recent: 'viewRecent',
            search: 'viewSearch',
        };
        const el = $(viewMap[view]);
        if (el) el.classList.add('active');

        $$('.nav-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.view === view);
        });

        // Load data for view
        if (view === 'explore') loadPhotos();
        else if (view === 'albums') loadAlbums();
        else if (view === 'favorites') loadFavorites();
        else if (view === 'recent') loadRecent();
    }

    // === RENDER PHOTOS ===
    function renderPhotoGrid(containerId, photos) {
        const container = $(containerId);
        if (!container) return;

        container.innerHTML = photos.map(photo => `
            <div class="photo-card" data-id="${photo.id}">
                <img src="${photo.thumb_path || photo.filepath}" alt="${escHtml(photo.title)}" loading="lazy"
                     onerror="this.src='uploads/placeholder.jpg'">
                <div class="photo-overlay">
                    <div class="photo-title">${escHtml(photo.title)}</div>
                </div>
                <button class="photo-heart ${photo.favorite ? 'favorited' : ''}" data-action="fav" data-id="${photo.id}">
                    <svg viewBox="0 0 24 24" fill="${photo.favorite ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                </button>
                <div class="photo-info">
                    <span class="photo-info-title">${escHtml(photo.title)}</span>
                    <span class="photo-info-meta">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        ${photo.views}
                    </span>
                    ${photo.album_name ? `<span class="album-badge">${escHtml(photo.album_name)}</span>` : ''}
                </div>
            </div>
        `).join('');

        // Click handlers
        container.querySelectorAll('.photo-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('.photo-heart')) return;
                openLightbox(card.dataset.id);
            });
        });

        // Heart click
        container.querySelectorAll('.photo-heart').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                try {
                    await api(`photos.php?id=${id}`, { method: 'PATCH', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({action: 'toggle_fav'}) });
                    btn.classList.toggle('favorited');
                    const svg = btn.querySelector('svg');
                    svg.setAttribute('fill', btn.classList.contains('favorited') ? 'currentColor' : 'none');
                    toast(btn.classList.contains('favorited') ? 'Aggiunto ai preferiti' : 'Rimosso dai preferiti', 'success');
                    refreshStats();
                } catch { toast('Errore', 'error'); }
            });
        });
    }

    // === LOAD PHOTOS ===
    async function loadPhotos() {
        try {
            const data = await api('photos.php');
            state.photos = data.photos || data;
            state.lightboxPhotos = state.photos;
            renderPhotoGrid('photoGrid', state.photos);
            $('emptyExplore').style.display = state.photos.length ? 'none' : 'block';
        } catch { toast('Errore caricamento foto', 'error'); }
    }

    async function loadFavorites() {
        try {
            const data = await api('photos.php?favorite=1');
            const photos = data.photos || data;
            renderPhotoGrid('favPhotoGrid', photos);
            $('emptyFavorites').style.display = photos.length ? 'none' : 'block';
        } catch { toast('Errore caricamento preferiti', 'error'); }
    }

    async function loadRecent() {
        try {
            const data = await api('photos.php?limit=20');
            const photos = data.photos || data;
            renderPhotoGrid('recentPhotoGrid', photos);
        } catch { toast('Errore caricamento recenti', 'error'); }
    }

    // === ALBUMS ===
    async function loadAlbums() {
        try {
            const data = await api('albums.php');
            state.albums = data.albums || data;
            renderAlbumsGrid(state.albums);
        } catch { toast('Errore caricamento album', 'error'); }
    }

    function renderAlbumsGrid(albums) {
        const grid = $('albumsGrid');
        if (!grid) return;

        grid.innerHTML = albums.map(album => `
            <div class="album-card" data-id="${album.id}">
                <img class="album-cover" src="${album.cover || 'uploads/placeholder.jpg'}" alt="${escHtml(album.name)}"
                     onerror="this.src='uploads/placeholder.jpg'">
                <span class="album-count">${album.photo_count || 0} foto</span>
                <button class="album-delete" data-action="delete-album" data-id="${album.id}" title="Elimina album">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
                <div class="album-card-body">
                    <h3>${escHtml(album.name)}</h3>
                    <p>${escHtml(album.description || '')}</p>
                </div>
            </div>
        `).join('');

        // Click handlers
        grid.querySelectorAll('.album-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('.album-delete')) return;
                openAlbum(card.dataset.id);
            });
        });

        // Delete handlers
        grid.querySelectorAll('.album-delete').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                if (!confirm('Eliminare questo album e spostare le foto?')) return;
                try {
                    await api(`albums.php?id=${btn.dataset.id}`, { method: 'DELETE' });
                    toast('Album eliminato', 'success');
                    loadAlbums();
                    refreshStats();
                } catch { toast('Errore eliminazione album', 'error'); }
            });
        });
    }

    async function openAlbum(albumId) {
        state.selectedAlbumId = albumId;
        const album = state.albums.find(a => a.id === albumId);
        if (!album) return;

        $('albumsGrid').style.display = 'none';
        $('albumDetail').style.display = 'block';
        $('albumDetailTitle').textContent = album.name;
        $('albumDetailDesc').textContent = album.description || '';
        $('albumDetailCount').textContent = `${album.photo_count || 0} foto`;

        try {
            const data = await api(`photos.php?album_id=${albumId}`);
            const photos = data.photos || data;
            state.lightboxPhotos = photos;
            renderPhotoGrid('albumPhotoGrid', photos);
        } catch { toast('Errore caricamento foto album', 'error'); }
    }

    function closeAlbum() {
        $('albumsGrid').style.display = '';
        $('albumDetail').style.display = 'none';
        state.selectedAlbumId = null;
    }

    // === SEARCH ===
    let searchTimeout;
    function handleSearch(query) {
        clearTimeout(searchTimeout);
        if (!query.trim()) {
            switchView('explore');
            return;
        }
        searchTimeout = setTimeout(async () => {
            state.searchQuery = query;
            try {
                const data = await api(`photos.php?search=${encodeURIComponent(query)}`);
                const photos = data.photos || data;
                state.lightboxPhotos = photos;
                $('searchTitle').textContent = `Risultati per "${query}"`;
                $('searchSubtitle').textContent = `${photos.length} foto trovate`;
                renderPhotoGrid('searchPhotoGrid', photos);
                $('emptySearch').style.display = photos.length ? 'none' : 'block';
                switchView('search');
            } catch { toast('Errore ricerca', 'error'); }
        }, 300);
    }

    // === LIGHTBOX ===
    async function openLightbox(photoId) {
        state.selectedPhotoId = photoId;
        $('lightbox').style.display = 'flex';
        document.body.style.overflow = 'hidden';

        try {
            const data = await api(`photos.php?id=${photoId}`);
            const photo = data.photo || data;
            renderLightbox(photo);
            loadComments(photoId);
        } catch { toast('Errore caricamento foto', 'error'); }
    }

    function renderLightbox(photo) {
        $('lightboxImage').src = photo.filepath;
        $('lightboxImage').alt = photo.title;
        $('lbTitle').textContent = photo.title;
        $('lbDescription').textContent = photo.description || '';
        $('lbViews').querySelector('span').textContent = photo.views + ' visualizzazioni';
        $('lbDate').querySelector('span').textContent = formatDate(photo.created_at);

        if (photo.album_name) {
            $('lbAlbum').style.display = 'flex';
            $('lbAlbum').querySelector('span').textContent = photo.album_name;
        } else {
            $('lbAlbum').style.display = 'none';
        }

        // Tags
        const tagsContainer = $('lbTags');
        if (photo.tags) {
            tagsContainer.innerHTML = photo.tags.split(',').map(t =>
                `<span class="tag" data-tag="${t.trim()}">${t.trim()}</span>`
            ).join('');
            tagsContainer.querySelectorAll('.tag').forEach(tag => {
                tag.addEventListener('click', () => {
                    $('searchInput').value = tag.dataset.tag;
                    handleSearch(tag.dataset.tag);
                    closeLightbox();
                });
            });
        } else {
            tagsContainer.innerHTML = '';
        }

        // Favorite
        const favBtn = $('lbFavBtn');
        favBtn.classList.toggle('favorited', !!photo.favorite);
    }

    function closeLightbox() {
        $('lightbox').style.display = 'none';
        document.body.style.overflow = '';
        state.selectedPhotoId = null;
    }

    function navigateLightbox(direction) {
        const idx = state.lightboxPhotos.findIndex(p => p.id === state.selectedPhotoId);
        if (idx === -1) return;
        let next = idx + direction;
        if (next < 0) next = state.lightboxPhotos.length - 1;
        if (next >= state.lightboxPhotos.length) next = 0;
        openLightbox(state.lightboxPhotos[next].id);
    }

    // === COMMENTS ===
    async function loadComments(photoId) {
        try {
            const data = await api(`comments.php?photo_id=${photoId}`);
            const comments = data.comments || data;
            const list = $('commentsList');
            $('lbCommentsTitle').textContent = `Commenti (${comments.length})`;
            list.innerHTML = comments.map(c => `
                <div class="comment-item">
                    <span class="comment-author">${escHtml(c.author)}</span>
                    <span class="comment-date">${formatDate(c.created_at)}</span>
                    <div class="comment-text">${escHtml(c.text)}</div>
                </div>
            `).join('');
        } catch { /* silent */ }
    }

    async function submitComment(e) {
        e.preventDefault();
        const author = $('commentAuthor').value.trim();
        const text = $('commentText').value.trim();
        if (!author || !text || !state.selectedPhotoId) return;

        try {
            await api('comments.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ photo_id: state.selectedPhotoId, author, text }),
            });
            $('commentText').value = '';
            loadComments(state.selectedPhotoId);
            toast('Commento aggiunto!', 'success');
        } catch { toast('Errore invio commento', 'error'); }
    }

    // === UPLOAD ===
    function openUpload() { $('uploadModal').style.display = 'flex'; document.body.style.overflow = 'hidden'; }
    function closeUpload() { $('uploadModal').style.display = 'none'; document.body.style.overflow = ''; resetUpload(); }

    function resetUpload() {
        state.uploadFiles = [];
        $('uploadPreview').style.display = 'none';
        $('uploadForm').style.display = 'none';
        $('uploadProgress').style.display = 'none';
        $('progressFill').style.width = '0%';
        $('fileInput').value = '';
        $('uploadTitle').value = '';
        $('uploadDesc').value = '';
        $('uploadTags').value = '';
        $('uploadAlbum').value = '';
    }

    function handleFiles(files) {
        const valid = Array.from(files).filter(f => f.type.startsWith('image/') && f.size <= 10485760);
        if (!valid.length) { toast('Nessun file valido. Max 10MB, solo immagini.', 'error'); return; }

        state.uploadFiles = valid;
        $('uploadPreview').style.display = 'block';
        $('uploadForm').style.display = 'block';

        const previewList = $('previewList');
        previewList.innerHTML = '';

        valid.forEach((file, i) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const div = document.createElement('div');
                div.className = 'preview-item';
                div.innerHTML = `
                    <img src="${e.target.result}" alt="Preview">
                    <button class="preview-remove" data-index="${i}">&times;</button>
                `;
                previewList.appendChild(div);

                div.querySelector('.preview-remove').addEventListener('click', () => {
                    state.uploadFiles.splice(i, 1);
                    div.remove();
                    if (!state.uploadFiles.length) resetUpload();
                });
            };
            reader.readAsDataURL(file);
        });

        // Auto-fill title from first file
        if (!$('uploadTitle').value) {
            $('uploadTitle').value = valid[0].name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ');
        }
    }

    async function handleUpload(e) {
        e.preventDefault();
        if (!state.uploadFiles.length) { toast('Seleziona almeno una foto', 'error'); return; }

        $('uploadProgress').style.display = 'block';
        $('btnUploadSubmit').disabled = true;

        let uploaded = 0;
        for (const file of state.uploadFiles) {
            const formData = new FormData();
            formData.append('photo', file);
            formData.append('title', $('uploadTitle').value || file.name);
            formData.append('description', $('uploadDesc').value);
            formData.append('tags', $('uploadTags').value);
            formData.append('album_id', $('uploadAlbum').value);

            try {
                const resp = await fetch('api/upload.php', { method: 'POST', body: formData });
                if (!resp.ok) throw new Error('Upload failed');
                uploaded++;
                const pct = Math.round((uploaded / state.uploadFiles.length) * 100);
                $('progressFill').style.width = pct + '%';
                $('progressText').textContent = `${uploaded}/${state.uploadFiles.length} caricate...`;
            } catch (err) {
                toast(`Errore caricamento ${file.name}`, 'error');
            }
        }

        $('btnUploadSubmit').disabled = false;
        toast(`${uploaded} foto caricate con successo!`, 'success');
        closeUpload();
        loadPhotos();
        refreshStats();
    }

    // === NEW ALBUM ===
    function openAlbumModal() { $('albumModal').style.display = 'flex'; document.body.style.overflow = 'hidden'; }
    function closeAlbumModal() { $('albumModal').style.display = 'none'; document.body.style.overflow = ''; }

    async function handleNewAlbum(e) {
        e.preventDefault();
        const name = $('albumName').value.trim();
        const desc = $('albumDesc').value.trim();
        if (!name) return;

        try {
            await api('albums.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, description: desc }),
            });
            toast('Album creato!', 'success');
            closeAlbumModal();
            $('albumName').value = '';
            $('albumDesc').value = '';
            loadAlbums();
            refreshStats();
            // Update upload album dropdown
            updateAlbumDropdown();
        } catch { toast('Errore creazione album', 'error'); }
    }

    async function updateAlbumDropdown() {
        try {
            const data = await api('albums.php');
            state.albums = data.albums || data;
            const select = $('uploadAlbum');
            const currentVal = select.value;
            select.innerHTML = '<option value="">Nessun album</option>';
            state.albums.forEach(a => {
                select.innerHTML += `<option value="${a.id}">${escHtml(a.name)}</option>`;
            });
            select.value = currentVal;
        } catch { /* silent */ }
    }

    // === STATS ===
    async function refreshStats() {
        try {
            const stats = await api('stats.php');
            if (stats) {
                $('statPhotos').textContent = Number(stats.photos || 0).toLocaleString('it-IT');
                $('statAlbums').textContent = Number(stats.albums || 0).toLocaleString('it-IT');
                $('statFavorites').textContent = Number(stats.favorites || 0).toLocaleString('it-IT');
                $('statViews').textContent = Number(stats.views || 0).toLocaleString('it-IT');
            }
        } catch { /* silent */ }
    }

    // === DELETE PHOTO ===
    async function deletePhoto() {
        if (!state.selectedPhotoId || !confirm('Eliminare questa foto?')) return;
        try {
            await api(`photos.php?id=${state.selectedPhotoId}`, { method: 'DELETE' });
            toast('Foto eliminata', 'success');
            closeLightbox();
            loadPhotos();
            refreshStats();
        } catch { toast('Errore eliminazione foto', 'error'); }
    }

    // === SAVE PHOTO INFO ===
    async function savePhotoInfo() {
        if (!state.selectedPhotoId) return;
        try {
            await api(`photos.php?id=${state.selectedPhotoId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: $('lbTitle').textContent.trim(),
                    description: $('lbDescription').textContent.trim(),
                }),
            });
            toast('Modifiche salvate', 'success');
            $('lbSaveBtn').style.display = 'none';
            loadPhotos();
        } catch { toast('Errore salvataggio', 'error'); }
    }

    // === HELPERS ===
    function escHtml(str) {
        const div = document.createElement('div');
        div.textContent = str || '';
        return div.innerHTML;
    }

    function formatDate(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
    }

    // === EVENT LISTENERS ===
    function init() {
        initTheme();

        // Theme toggle
        $('btnTheme').addEventListener('click', toggleTheme);

        // Nav tabs
        $$('.nav-tab').forEach(tab => {
            tab.addEventListener('click', () => switchView(tab.dataset.view));
        });

        // Search
        $('searchInput').addEventListener('input', (e) => handleSearch(e.target.value));

        // Upload modal
        $('btnUpload').addEventListener('click', openUpload);
        $('uploadClose').addEventListener('click', closeUpload);
        $('uploadBackdrop').addEventListener('click', closeUpload);

        // Drag & drop
        const zone = $('uploadZone');
        zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('dragover'); });
        zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
        zone.addEventListener('drop', (e) => { e.preventDefault(); zone.classList.remove('dragover'); handleFiles(e.dataTransfer.files); });
        $('fileInput').addEventListener('change', (e) => handleFiles(e.target.files));
        $('uploadForm').addEventListener('submit', handleUpload);

        // Lightbox
        $('lightboxClose').addEventListener('click', closeLightbox);
        $('lightboxBackdrop').addEventListener('click', closeLightbox);
        $('lightboxPrev').addEventListener('click', () => navigateLightbox(-1));
        $('lightboxNext').addEventListener('click', () => navigateLightbox(1));

        // Keyboard
        document.addEventListener('keydown', (e) => {
            if ($('lightbox').style.display !== 'none') {
                if (e.key === 'Escape') closeLightbox();
                else if (e.key === 'ArrowLeft') navigateLightbox(-1);
                else if (e.key === 'ArrowRight') navigateLightbox(1);
            }
            if ($('uploadModal').style.display !== 'none' && e.key === 'Escape') closeUpload();
            if ($('albumModal').style.display !== 'none' && e.key === 'Escape') closeAlbumModal();
        });

        // Lightbox actions
        $('lbFavBtn').addEventListener('click', async () => {
            if (!state.selectedPhotoId) return;
            try {
                await api(`photos.php?id=${state.selectedPhotoId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'toggle_fav' }),
                });
                $('lbFavBtn').classList.toggle('favorited');
                toast($('lbFavBtn').classList.contains('favorited') ? 'Aggiunto ai preferiti' : 'Rimosso dai preferiti', 'success');
                refreshStats();
            } catch { toast('Errore', 'error'); }
        });

        $('lbDeleteBtn').addEventListener('click', deletePhoto);
        $('lbSaveBtn').addEventListener('click', savePhotoInfo);

        // Detect edits
        $('lbTitle').addEventListener('input', () => { $('lbSaveBtn').style.display = 'flex'; });
        $('lbDescription').addEventListener('input', () => { $('lbSaveBtn').style.display = 'flex'; });

        // Comments
        $('commentForm').addEventListener('submit', submitComment);

        // Album modal
        $('btnNewAlbum').addEventListener('click', openAlbumModal);
        $('albumClose').addEventListener('click', closeAlbumModal);
        $('albumBackdrop').addEventListener('click', closeAlbumModal);
        $('albumForm').addEventListener('submit', handleNewAlbum);
        $('btnBackAlbums').addEventListener('click', closeAlbum);

        // Load initial data
        if (window.MEMORO?.dbInstalled) {
            loadPhotos();
        }
    }

    // Init on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
