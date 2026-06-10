# creami Memoro — Installazione su Altervista

## Requisiti
- Account Altervista attivo
- Database MySQL attivato (dal pannello Altervista)
- PHP 7.4+ con estensione GD abilitata

## Installazione

### 1. Configura il database su Altervista
- Accedi al pannello Altervista
- Vai su **Database** → **Attiva database MySQL**
- Annota il nome del database, l'username e la password

### 2. Modifica la configurazione
Apri `includes/config.php` e modifica queste righe:

```php
define('DB_NAME', 'my_tuousername');        // Il tuo nome database Altervista
define('DB_USER', 'my_tuousername');         // Il tuo username Altervista  
define('DB_PASS', 'la_tua_password_mysql');  // La password del database
define('SITE_URL', 'https://tuosito.altervista.org');  // Il tuo URL
```

### 3. Carica i file via FTP
- Usa l'FTP integrato di Altervista o un client FTP (FileZilla)
- Carica **tutta** la cartella `memoro/` nella root del tuo spazio Altervista
- Assicurati che la cartella `uploads/` abbia permessi di scrittura (755 o 777)

### 4. Installa il database
- Visita nel browser: `https://tuosito.altervista.org/install/install.php`
- Clicca per creare le tabelle
- Opzionalmente inserisci i dati di esempio
- **IMPORTANTE**: Dopo l'installazione, elimina la cartella `/install/`

### 5. Fatto!
Visita `https://tuosito.altervista.org/` per vedere il tuo sito!

## Struttura dei file

```
memoro/
├── index.php              # Pagina principale
├── .htaccess              # Configurazione Apache
├── css/
│   └── style.css          # Stile Flickr-inspired
├── js/
│   └── app.js             # Logica applicazione SPA
├── includes/
│   ├── config.php         # Configurazione (DA MODIFICARE!)
│   ├── Database.php       # Connessione PDO MySQL
│   ├── Photo.php          # Modello foto (CRUD)
│   ├── Album.php          # Modello album (CRUD)
│   └── Comment.php        # Modello commenti (CRUD)
├── api/
│   ├── photos.php         # API foto
│   ├── albums.php         # API album
│   ├── comments.php       # API commenti
│   ├── upload.php         # Upload immagini
│   └── stats.php          # Statistiche
├── uploads/               # Foto caricate
│   └── thumbs/            # Thumbnail
└── install/
    └── install.php        # Script installazione (ELIMINARE dopo uso)
```

## Funzionalità

- **Griglia foto masonry** responsive (2-5 colonne)
- **Upload foto** con drag-and-drop e generazione automatica thumbnail
- **Album** con cover, creazione/eliminazione, filtro
- **Preferiti** con cuore toggle
- **Ricerca** in tempo reale per titolo, descrizione e tag
- **Lightbox** con navigazione tastiera (←/→/Esc)
- **Commenti** per ogni foto
- **Dark/Light mode** con salvataggio preferenze
- **Statistiche** in tempo reale
- **SPA-like** — navigazione senza ricaricare la pagina

## Personalizzazione

### Colore primario (default: Flickr blue)
Modifica in `css/style.css`:
```css
:root {
    --primary: #0063dc;      /* Blu Flickr */
    --accent: #ff0084;        /* Rosa preferiti */
}
```

### Limite upload
Modifica in `includes/config.php`:
```php
define('MAX_FILE_SIZE', 10 * 1024 * 1024);  // 10MB
```

## Note per Altervista

- Altervista ha un limite di upload predefinito di 2-5MB (dipende dal piano)
- Per aumentare il limite, contatta il supporto Altervista
- La cache delle immagini è configurata via .htaccess per performance ottimali
- I file nella cartella `includes/` sono protetti da accesso diretto
