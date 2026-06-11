# Worklog - creami Memoro (Flickr Clone)

## Task ID: 1

### Completed Steps

1. **Environment Initialization**
   - Ran fullstack init script
   - Verified project structure and dependencies

2. **Prisma Schema & Database**
   - Replaced default User/Post schema with Photo/Album/Comment models
   - Ran `prisma db push` to sync schema with SQLite database
   - Ran `prisma generate` for client generation

3. **API Routes** (7 endpoints)
   - `/api/photos` - GET (list with search/filter), POST (create)
   - `/api/photos/[id]` - GET (with view increment), PATCH, DELETE
   - `/api/photos/[id]/comments` - GET, POST
   - `/api/albums` - GET (with photo count), POST
   - `/api/albums/[id]` - GET, PATCH, DELETE
   - `/api/upload` - POST (multipart file upload with sharp thumbnails)
   - `/api/stats` - GET (totals)

4. **Zustand Store** (`src/lib/store.ts`)
   - Full state management for navigation, data, and loading states
   - Actions for all CRUD operations and view navigation

5. **UI Components**
   - `theme-provider.tsx` - next-themes wrapper
   - `header.tsx` - Logo, search, nav, upload button, theme toggle
   - `photo-grid.tsx` - Masonry grid with hover overlays
   - `photo-detail.tsx` - Lightbox with editing, comments, keyboard nav
   - `upload-modal.tsx` - Drag-and-drop with progress tracking
   - `albums-view.tsx` - Album cards, create/delete, album detail

6. **Main Page** (`src/app/page.tsx`)
   - SPA architecture with client-side routing
   - Data fetching on mount
   - View switching: explore, albums, favorites, recent, search
   - Stats bar, responsive layout

7. **Theme Support**
   - Dark/light mode via next-themes
   - Fixed lint issue with useSyncExternalStore for mounted state
   - Custom CSS for scrollbar, masonry, animations

8. **Sample Data**
   - Generated 12 AI photos (z-ai-generate CLI)
   - Created thumbnails with sharp
   - Seeded DB with 4 albums, 12 photos (Italian titles/tags/descriptions), 32 comments

9. **Testing & Verification**
   - All API endpoints returning 200
   - Page rendering correctly with data
   - ESLint passes with no errors
   - Next.js config updated for allowedDevOrigins

### Key Decisions
- Used `useSyncExternalStore` instead of `useEffect` + `useState` for mounted state (lint compliance)
- Flickr color scheme: #0063dc (blue) primary, #ff0084 (pink) for favorites
- Italian language throughout the UI
- CSS columns for masonry effect (lightweight, responsive)
- Thumbnails: 400px wide, JPEG 80% quality

---

## Task ID: vercel-migration

### Vercel Deployment Migration (SQLite → Vercel Postgres + Vercel Blob)

#### Completed Changes

1. **Prisma Schema → PostgreSQL** (`prisma/schema.prisma`)
   - Changed `provider` from `"sqlite"` to `"postgresql"`
   - Added `@map` annotations for PostgreSQL column naming:
     - `albumId` → `album_id`, `photoId` → `photo_id`
     - `createdAt` → `created_at`, `updatedAt` → `updated_at`
   - Added `@@map` table names: `photos`, `albums`, `comments`
   - Added `thumbnail` field (String?) to Photo model for storing blob thumbnail URLs
   - Did NOT run `db:push` (requires actual Postgres URL; will run on Vercel)

2. **Installed @vercel/blob** (`package.json`)
   - `bun add @vercel/blob` — installed v2.4.0

3. **Upload API Route** (`src/app/api/upload/route.ts`)
   - Replaced `fs/promises` (writeFile, mkdir) with `@vercel/blob` `put()`
   - Original file uploaded to `photos/{uniqueName}` via `put()`
   - Thumbnail created with sharp, then uploaded to `photos/thumb-{uniqueName}` via `put()`
   - Returns blob URLs as `filepath` and `thumbnail`
   - Removed all local filesystem references (UPLOAD_DIR, writeFile, mkdir)

4. **Photo Delete API Route** (`src/app/api/photos/[id]/route.ts`)
   - Added `import { del } from '@vercel/blob'`
   - Before deleting from DB, now deletes blob files (both original and thumbnail)
   - Only deletes if URL contains `blob.vercel-storage.com` (safe for local dev)

5. **Photos POST Route** (`src/app/api/photos/route.ts`)
   - Added `thumbnail` field extraction from FormData
   - Included `thumbnail` in `db.photo.create()` data

6. **Upload Modal** (`src/components/upload-modal.tsx`)
   - Now sends `uploadData.thumbnail` to the photos POST route via FormData

7. **Photo Grid** (`src/components/photo-grid.tsx`)
   - Updated thumbnail logic: uses `photo.thumbnail` field first, falls back to local `/uploads/thumb-` pattern
   - Ensures backward compatibility with existing local photos

8. **Store Type** (`src/lib/store.ts`)
   - Added `thumbnail: string | null` to `Photo` interface

9. **Next.js Config** (`next.config.ts`)
   - Removed `output: "standalone"` (not needed on Vercel)
   - Added `images.remotePatterns` for `**.blob.vercel-storage.com` and `**.public.blob.vercel-storage.com`
   - Kept `typescript.ignoreBuildErrors: true` and `reactStrictMode: false`

10. **Database Client** (`src/lib/db.ts`)
    - Conditional query logging: only in development mode (`['query']`), empty array in production

11. **Environment Example** (`.env.example`)
    - Created with `DATABASE_URL` and `BLOB_READ_WRITE_TOKEN` placeholders

#### Important Notes

- Local dev still works with the existing SQLite database (old Prisma client is still cached)
- The `thumbnail` field is added to the schema but won't exist in the local SQLite DB until deployed
- `photo-grid.tsx` gracefully falls back: `photo.thumbnail || photo.filepath.replace('/uploads/', '/uploads/thumb-')`
- Photo delete gracefully handles both blob and local file URLs
- Do NOT run `bun run build` or `prisma db push` locally — they require a real Postgres connection
- ESLint passes with no errors after all changes

---

## Task ID: i18n-foto-page

### i18n Migration for `/src/app/foto/[id]/page.tsx`

#### Completed Changes

1. **Added i18n import and hook**
   - Added `import { useI18n } from "@/lib/i18n";` at top of file
   - Added `const { t } = useI18n();` inside `FotoDetailPage` component

2. **Replaced all hardcoded Italian visible text with t() calls** (38 replacements total):

   | Original Italian | Translation Key |
   |---|---|
   | `"Foto non trovata"` (error state) | `t("photo.notFound")` |
   | `"Errore nel caricamento della foto"` | `t("common.error")` |
   | `"Sei sicuro di voler eliminare questa foto?"` | `t("photo.deleteConfirm")` |
   | `"Foto non trovata"` (fallback display) | `t("photo.notFound")` |
   | `Torna a Esplora` | `{t("photo.backToExplore")}` |
   | `placeholder="Aggiungi una descrizione..."` | `placeholder={t("photo.addDescription")}` |
   | `Preferito` | `{t("photo.favorite")}` |
   | `Galleria` | `{t("photo.gallery")}` |
   | `Condividi` | `{t("photo.share")}` |
   | `Scarica` | `{t("photo.download")}` |
   | `Modifica` | `{t("photo.edit")}` |
   | `Aggiungi ai gruppi` (dropdown) | `{t("photo.addToGroups")}` |
   | `Elimina foto` | `{t("photo.deletePhoto")}` |
   | `Segnala` | `{t("photo.report")}` |
   | `Salva` | `{t("common.save")}` |
   | `Annulla` | `{t("common.cancel")}` |
   | `Tag` (label) | `{t("photo.tag")}` |
   | `placeholder="Tag separati da virgola..."` | `placeholder={t("photo.tagPlaceholder")}` |
   | `Livello di sicurezza:` | `{t("safety.level")}` |
   | `Dati EXIF` | `{t("photo.exifData")}` |
   | `Fotocamera` | `{t("photo.camera")}` |
   | `Obiettivo` | `{t("photo.lens")}` |
   | `Lunghezza focale` | `{t("photo.focalLength")}` |
   | `Apertura` | `{t("photo.aperture")}` |
   | `Tempo di esposizione` | `{t("photo.shutterSpeed")}` |
   | `Dettagli` | `{t("photo.details")}` |
   | `Dimensioni` | `{t("photo.dimensions")}` |
   | `Caricata il` | `{t("photo.uploadedOn")}` |
   | `Album` | `{t("photo.album")}` |
   | `Dimensione file` | `{t("photo.fileSize")}` |
   | `Aggiungi alla galleria` (dialog title) | `{t("photo.addToGallery")}` |
   | `Non hai ancora creato gallerie.` | `{t("photo.noGalleries")}` |
   | `Crea una galleria` | `{t("photo.createGallery")}` |
   | `Aggiungi ai gruppi` (dialog title) | `{t("photo.addToGroup")}` |
   | `Non sei membro di nessun gruppo.` | `{t("photo.noGroups")}` |
   | `Esplora i gruppi` | `{t("photo.exploreGroups")}` |
   | `membri` | `{t("common.members")}` |

3. **Not translated** (correctly excluded):
   - `console.error("Errore nel preferito:", ...)` — developer-facing, not visible
   - `console.error("Errore nel salvataggio:", ...)` — developer-facing, not visible
   - `console.error("Errore nell'eliminazione:", ...)` — developer-facing, not visible
   - Brand names, CSS classes, API endpoints, variable names — all preserved

4. **Verification**: Read through entire updated file — all JSX is valid, all Italian visible text replaced, no broken tags

---

## Task ID: 2

### i18n Migration for `/src/app/impostazioni/page.tsx` (Settings Page)

#### Completed Changes

1. **Added i18n import and hook**
   - Added `import { useI18n } from "@/lib/i18n";` at top of file
   - Added `const { t } = useI18n();` inside `ImpostazioniPage` component

2. **Moved `sidebarItems` inside component** so it can use `t()`:
   - Was: top-level `const sidebarItems = [...]` with hardcoded Italian labels
   - Now: inside component function, using `t("settings.profile")`, `t("settings.privacy")`, etc.

3. **Fixed typo bug**:
   - Line was: `}, andleSaveSettings]);` (missing `[` and `h`)
   - Fixed to: `}, [handleSaveSettings]);`

4. **Replaced all hardcoded Italian visible text with t() calls** (~70+ replacements):

   **Page header & auth:**
   | Original | Key |
   |---|---|
   | `"Impostazioni"` | `t("settings.title")` |
   | `"Gestisci il tuo account e le tue preferenze"` | `t("settings.subtitle")` |
   | `"Accedi per gestire le impostazioni"` | `t("settings.loginToManage")` |
   | `"Effettua l'accesso per visualizzare e modificare le tue impostazioni"` | `t("settings.loginToManageDesc")` |

   **Profile section:**
   | Original | Key |
   |---|---|
   | `"Il tuo profilo"` | `t("settings.profileTitle")` |
   | `"Gestisci le informazioni del tuo profilo pubblico"` | `t("settings.profileDesc")` |
   | `"Cambia avatar"` | `t("settings.changeAvatar")` |
   | `"Nome"` | `t("settings.name")` |
   | `"Bio"` | `t("settings.bio")` |
   | `"Racconta qualcosa di te..."` | `t("settings.bioPlaceholder")` |
   | `"Posizione"` | `t("settings.location")` |
   | `"es. Roma, Italia"` | `t("settings.locationPlaceholder")` |
   | `"Sito web"` | `t("settings.website")` |
   | `"Salva profilo"` / `"Salvataggio..."` | `t("settings.saveProfile")` / `t("common.saving")` |
   | `"Profilo aggiornato"` | `t("settings.profileUpdated")` |
   | `"Errore nell'aggiornamento del profilo"` | `t("settings.profileUpdateError")` |

   **Privacy section:**
   | Original | Key |
   |---|---|
   | `"Privacy e autorizzazioni"` | `t("settings.privacyTitle")` |
   | `"Controlla chi può vedere e interagire con i tuoi contenuti"` | `t("settings.privacyDesc")` |
   | `"Visibilità del profilo"` | `t("settings.profileVisibility")` |
   | `"Pubblico"` / `"Solo contatti"` / `"Privato"` | `t("settings.public")` / `t("settings.contactsOnly")` / `t("settings.private")` |
   | `"Chi può inviarti messaggi"` | `t("settings.whoCanMessage")` |
   | `"Tutti"` / `"Nessuno"` | `t("settings.everyone")` / `t("settings.nobody")` |
   | `"Permetti commenti"` + desc | `t("settings.allowComments")` + `t("settings.allowCommentsDesc")` |
   | `"Permetti download"` + desc | `t("settings.allowDownloads")` + `t("settings.allowDownloadsDesc")` |
   | `"Mostra rullino"` + desc | `t("settings.showCameraRoll")` + `t("settings.showCameraRollDesc")` |

   **Content Filters section:**
   | Original | Key |
   |---|---|
   | `"Filtri contenuti"` | `t("settings.contentFiltersTitle")` |
   | `"Gestisci i filtri per i contenuti adulti"` | `t("settings.contentFiltersDesc")` |
   | `"Ricerca sicura (SafeSearch)"` | `t("settings.safeSearch")` |
   | `"Rigorosa"` + desc | `t("settings.strict")` + `t("settings.strictDesc")` |
   | `"Moderata"` + desc | `t("settings.moderate")` + `t("settings.moderateDesc")` |
   | `"Predefinito"` | `t("settings.default")` |
   | `"Disattivata"` + desc | `t("settings.off")` + `t("settings.offDesc")` |
   | Badge: `"Sicuro"` / `"Moderato"` / `"Restretto"` | `t("safety.safe")` / `t("safety.moderate")` / `t("safety.restricted")` |
   | `"Mostra contenuti per adulti"` + desc | `t("settings.showAdultContent")` + `t("settings.showAdultContentDesc")` |
   | `"Mostra contenuti limitati"` + desc | `t("settings.showRestrictedContent")` + `t("settings.showRestrictedContentDesc")` |
   | `"Consenti caricamenti per adulti"` + desc | `t("settings.allowMatureUploads")` + `t("settings.allowMatureUploadsDesc")` |
   | Warning paragraph | `t("settings.adultContentWarning")` |

   **Notifications section:**
   | Original | Key |
   |---|---|
   | `"Notifiche"` | `t("settings.notificationsTitle")` |
   | `"Scegli quali notifiche ricevere"` | `t("settings.notificationsDesc")` |
   | `"Notifiche email"` + desc | `t("settings.emailNotifications")` + `t("settings.emailNotificationsDesc")` |
   | `"Preferiti"` + desc | `t("settings.notifyFavorites")` + `t("settings.notifyFavoritesDesc")` |
   | `"Commenti"` + desc | `t("settings.notifyComments")` + `t("settings.notifyCommentsDesc")` |
   | `"Nuovi follower"` + desc | `t("settings.notifyFollows")` + `t("settings.notifyFollowsDesc")` |
   | `"Inviti ai gruppi"` + desc | `t("settings.notifyGroupInvites")` + `t("settings.notifyGroupInvitesDesc")` |
   | `"Messaggi"` + desc | `t("settings.notifyMessages")` + `t("settings.notifyMessagesDesc")` |

   **Appearance section:**
   | Original | Key |
   |---|---|
   | `"Aspetto"` | `t("settings.appearanceTitle")` |
   | `"Personalizza l'aspetto di Memoro"` | `t("settings.appearanceDesc")` |
   | `"Tema"` | `t("settings.theme")` |
   | `"Scuro"` / `"Chiaro"` / `"Sistema"` | `t("settings.dark")` / `t("settings.light")` / `t("settings.system")` |
   | `"Vista predefinita"` | `t("settings.defaultView")` |
   | `"Griglia"` / `"Lista"` / `"Giustificata"` | `t("settings.gridView")` / `t("settings.listView")` / `t("settings.justifiedView")` |
   | `"Lingua"` | `t("common.language")` |

   **EXIF section:**
   | Original | Key |
   |---|---|
   | `"Dati EXIF"` | `t("settings.exifTitle")` |
   | `"Gestisci la visibilità dei dati EXIF delle tue foto"` | `t("settings.exifDesc")` |
   | `"Mostra dati EXIF"` + desc | `t("settings.showExif")` + `t("settings.showExifDesc")` |

   **Account section:**
   | Original | Key |
   |---|---|
   | `"Cambia password"` | `t("settings.changePassword")` |
   | `"Aggiorna la tua password..."` | `t("settings.changePasswordDesc")` |
   | `"Password attuale"` / `"Nuova password"` / `"Conferma nuova password"` | `t("settings.currentPassword")` / `t("settings.newPassword")` / `t("settings.confirmNewPassword")` |
   | `"Aggiorna password"` | `t("settings.updatePassword")` |
   | `"Le password non coincidono"` | `t("settings.passwordMismatch")` |
   | `"Password aggiornata"` | `t("settings.passwordUpdated")` |
   | `"Elimina account"` | `t("settings.deleteAccount")` |
   | `"Questa azione è irreversibile..."` | `t("settings.deleteAccountDesc")` |
   | `"Elimina il mio account"` | `t("settings.deleteMyAccount")` |
   | `"Sei assolutamente sicuro?"` | `t("settings.areYouSure")` |
   | `"Questa azione non può essere annullata..."` | `t("settings.deleteWarning")` |
   | `"Sì, elimina il mio account"` | `t("settings.yesDeleteAccount")` |
   | `"Annulla"` | `t("common.cancel")` |

   **Toast messages:**
   | Original | Key |
   |---|---|
   | `"Impostazioni salvate"` | `t("settings.settingsSaved")` |
   | `"Errore nel salvataggio delle impostazioni"` | `t("settings.saveError")` |
   | `"Errore nel salvataggio"` | `t("settings.saveError")` |

   **Footer:**
   | Original | Key |
   |---|---|
   | `"Condividi i Tuoi Ricordi"` | `t("home.footerShort")` |

5. **Not translated** (correctly excluded):
   - `ImpostazioniPage` — component name, not visible text
   - `"Memoro"` — brand name
   - `"https://..."` — URL placeholder
   - Language names (`Italiano`, `English`, `Français`, `Deutsch`, `Español`) — native language names are intentional
   - `console.error("Errore:", err)` — developer-facing, not visible
   - CSS classes, API endpoints, variable names, HTML entities (`&apos;`, `&mdash;`)

6. **Renamed variable**: In the appearance section theme options `.map()`, renamed the loop variable from `t` to `themeOpt` to avoid shadowing the i18n `t` function.

7. **Added `t` to useCallback deps**: `handleSaveSettings` and `handleSaveProfile` now include `t` in their dependency arrays since they call `t()` inside.

8. **Verification**: Checked for remaining hardcoded Italian strings (none found except component name), confirmed typo fix, confirmed sidebarItems moved inside component

---

## Task ID: 2 - i18n Component Migration

### i18n Migration for Core Components (Replacing Hardcoded Italian with t() Calls)

#### Completed Changes

1. **`src/components/photo-card.tsx`** — Added `useI18n` import and hook
   - `di {photo.user.name}` → `{t("common.by")} {photo.user.name}`

2. **`src/components/photo-grid.tsx`** — Added `useI18n` import and hook
   - `"Nessuna foto trovata"` → `{t("photoGrid.noPhotos")}`
   - `"Prova a cercare qualcos'altro o carica una foto"` → `{t("photoGrid.trySearching")}`
   - `di {photo.user.name}` → `{t("common.by")} {photo.user.name}`

3. **`src/components/photo-detail.tsx`** — Added `useI18n` import and hook (22 replacements)
   - `"Preferito"` → `{t("photo.favorite")}`
   - `"Condividi"` → `{t("photo.share")}`
   - `"Scarica"` → `{t("photo.download")}`
   - `"Salva"` → `{t("common.save")}`
   - `"Modifica"` → `{t("common.edit")}`
   - `"Elimina"` → `{t("common.delete")}`
   - `"Info"` → `{t("photo.info")}`
   - `placeholder="Aggiungi una descrizione..."` → `placeholder={t("photo.addDescription")}`
   - `placeholder="Tag separati da virgola..."` → `placeholder={t("photo.tagPlaceholder")}`
   - `"Tag"` (label) → `{t("photo.tag")}`
   - `"Dettagli foto"` → `{t("photo.photoDetails")}`
   - `"Dimensioni"` → `{t("photo.dimensions")}`
   - `"Dimensione file"` → `{t("photo.fileSize")}`
   - `"Tipo"` → `{t("photo.type")}`
   - `"Album"` → `{t("photo.album")}`
   - `"Date"` → `{t("photo.dates")}`
   - `"Scattata"` → `{t("photo.taken")}`
   - `"Caricata"` → `{t("photo.uploadedOn")}`
   - `"Commenti"` → `{t("comments.title")}`
   - `placeholder="Aggiungi un commento..."` → `placeholder={t("comments.addComment")}`

4. **`src/components/albums-view.tsx`** — Added `useI18n` import and hook (12 replacements)
   - `"Tutti gli Album"` → `{t("albums.allAlbums")}`
   - `"Album"` (fallback) → `{t("nav.album")}`
   - `"foto"` (count) → `{t("common.photos")}` (3 occurrences)
   - `"Nuovo Album"` → `{t("albums.newAlbum")}`
   - `"Crea Nuovo Album"` → `{t("albums.createTitle")}`
   - `placeholder="Nome dell'album"` → `placeholder={t("albums.albumName")}`
   - `placeholder="Descrizione (opzionale)"` → `placeholder={t("albums.albumDesc")}`
   - `"Creazione..."` / `"Crea Album"` → `t("common.creating")` / `t("albums.createButton")`
   - `"Nessun album ancora"` → `{t("albums.noAlbums")}`
   - `"Crea il tuo primo album per organizzare le foto"` → `{t("albums.noAlbumsDesc")}`

5. **`src/components/galleries-view.tsx`** — Added `useI18n` import and hook (10 replacements)
   - `"Tutte le Gallerie"` → `{t("galleries.allGalleries")}`
   - `"Gallerie"` → `{t("nav.galleries")}`
   - `"Nuova Galleria"` → `{t("galleries.createNew")}`
   - `"Crea Nuova Galleria"` → `{t("galleries.createTitle")}`
   - `placeholder="Nome della galleria"` → `placeholder={t("galleries.galleryName")}`
   - `placeholder="Descrizione (opzionale)"` → `placeholder={t("galleries.galleryDesc")}`
   - `"Creazione..."` / `"Crea Galleria"` → `t("common.creating")` / `t("galleries.createButton")`
   - `"Le gallerie sono collezioni curate..."` → `{t("galleries.subtitleShort")}`
   - `"Nessuna galleria"` → `{t("galleries.noGalleries")}`
   - `"foto"` → `{t("common.photos")}`

6. **`src/components/groups-view.tsx`** — Added `useI18n` import and hook (15 replacements)
   - `"Tutti i Gruppi"` → `{t("groups.allGroupsNav")}`
   - `"Gruppi"` → `{t("groups.title")}`
   - `"Nuovo Gruppo"` → `{t("groups.createGroup")}`
   - `"Crea Nuovo Gruppo"` → `{t("groups.createTitle")}`
   - `placeholder="Nome del gruppo"` → `placeholder={t("groups.groupName")}`
   - `placeholder="Descrizione (opzionale)"` → `placeholder={t("groups.groupDesc")}`
   - `placeholder="Regole del gruppo (opzionale)"` → `placeholder={t("groups.groupRules")}`
   - `"Creazione..."` / `"Crea Gruppo"` → `t("common.creating")` / `t("groups.createButton")`
   - `"Regole del gruppo"` → `{t("groups.groupRulesTitle")}`
   - `"membri"` → `{t("common.members")}`
   - `"foto"` → `{t("common.photos")}`
   - `"Pubblico"` → `{t("groups.public")}`
   - `"Privato"` → `{t("groups.private")}`
   - `"Nessun gruppo ancora"` → `{t("groups.noGroups")}`
   - `"Crea un gruppo per condividere foto con la community"` → `{t("groups.noGroupsCreateAlt")}`

7. **`src/components/messages-view.tsx`** — Added `useI18n` import and hook (13 replacements)
   - `"Messaggi"` → `{t("messages.title")}`
   - `"Nuovo Messaggio"` (button) → `{t("messages.newMessage")}`
   - `"Nessun messaggio"` → `{t("messages.noMessages")}`
   - `"Invia un messaggio per iniziare"` → `{t("messages.noMessagesDesc")}`
   - `"Da:"` → `{t("messages.from")}`
   - `"A:"` → `{t("messages.toLabel")}`
   - `"Seleziona un messaggio per leggerlo"` → `{t("messages.selectMessage")}`
   - `"Nuovo Messaggio"` (dialog) → `{t("messages.composeTitle")}`
   - `placeholder="A (nome utente)"` → `placeholder={t("messages.to")}`
   - `placeholder="Oggetto"` → `placeholder={t("messages.subject")}`
   - `placeholder="Scrivi il tuo messaggio..."` → `placeholder={t("messages.body")}`
   - `"Invio..."` → `{t("messages.sending")}`
   - `"Invia Messaggio"` → `{t("messages.sendButton")}`

8. **`src/components/notifications-view.tsx`** — Added `useI18n` import and hook (4 replacements)
   - `"Notifiche"` → `{t("notifications.title")}`
   - `"Segna tutto come letto"` → `{t("notifications.markAllRead")}`
   - `"Nessuna notifica"` → `{t("notifications.noNotifications")}`
   - `"Le tue notifiche appariranno qui"` → `{t("notifications.noNotificationsDesc")}`

9. **`src/components/upload-modal.tsx`** — Added `useI18n` import and hook (12 replacements)
   - `"Carica Foto"` → `{t("upload.title")}`
   - `"Trascina le foto qui"` → `{t("upload.dragHere")}`
   - `"oppure clicca per selezionare file"` → `{t("upload.orClick")}`
   - `"Scegli File"` → `{t("upload.chooseFiles")}`
   - `placeholder="Titolo"` → `placeholder={t("upload.photoTitle")}`
   - `placeholder="Album"` → `placeholder={t("upload.album")}`
   - `"Nessun album"` → `{t("upload.noAlbum")}`
   - `placeholder="Tag (virgola)"` → `placeholder={t("upload.tags")}`
   - `placeholder="Descrizione..."` → `placeholder={t("upload.description")}`
   - `"Errore"` → `{t("common.error")}`
   - `"Caricamento..."` → `{t("upload.uploading")}`
   - `"Completato!"` → `{t("common.completed")}`
   - `"Carica ... foto"` → `{t("common.create")} ... {t("common.photos")}`

10. **`src/components/user-card.tsx`** — Already uses `useI18n`, no changes needed
11. **`src/components/follow-button.tsx`** — Already uses `useI18n`, no changes needed

12. **Created `src/components/html-lang.tsx`** — New client component that dynamically updates `<html lang>` based on i18n locale

13. **Updated `src/app/layout.tsx`** — Added `HtmlLang` component import and placed it inside `<I18nProvider>`

#### Not translated (correctly excluded):
- `console.error(...)` — developer-facing, not visible
- CSS classes, API endpoints, variable names
- Brand names ("Memoro")
- Date-fns locale import (used for date formatting, not UI text)

#### Verification:
- `npx next build` — passes with 0 TypeScript errors
- `bun run lint` — 0 errors (1 pre-existing warning in carousel.tsx, unrelated)

---

## Task ID: 3b

### Fix Asian & ptBR Translation Fallbacks in translations.ts

#### Problem
The translations file at `/src/lib/i18n/translations.ts` had 10 languages with 428 keys each, but 5 languages had many English fallback values instead of proper native translations:
- **ptBR (Portuguese Brazil)** — ~109 keys had English values
- **ja (Japanese)** — many keys had English values
- **ko (Korean)** — many keys had English values
- **zhCN (Chinese Simplified)** — many keys had English values
- **zhTW (Chinese Traditional)** — many keys had English values

#### Approach
1. Read the current `translations.ts` file (4326 lines)
2. Identified all keys from the `en` dictionary (428 keys total)
3. For each of the 5 languages, created a COMPLETE dictionary with all 428 keys properly translated
4. Wrote a Node.js script (`scripts/fix-asian-translations.js`) that:
   - Reads the current file
   - Uses regex to find and replace each language section
   - Generates proper TypeScript dict syntax from JS objects
   - Writes the complete file back
   - Includes verification (key count + spot-checks)

#### Script Details
- **File**: `/home/z/my-project/scripts/fix-asian-translations.js`
- Hardcodes complete translation dictionaries for all 5 languages
- Uses `replaceLangSection()` helper to swap each `const LANG: TranslationDict = { ... };` block
- Handles backslash escaping in values (e.g., `\\` in `settings.showRestrictedContentDesc`)

#### Key Translations Fixed (examples)
| Key | Before (English fallback) | After (Native) |
|---|---|---|
| `photo.addToGroups` | "Add to groups" | ptBR: "Adicionar aos grupos", ja: "グループに追加", ko: "그룹에 추가", zhCN: "添加到群组", zhTW: "新增到群組" |
| `upload.photoTitle` | "Photo title" | ptBR: "Título da foto", ja: "写真のタイトル", ko: "사진 제목", zhCN: "照片标题", zhTW: "照片標題" |
| `settings.allowComments` | "Allow comments" | ptBR: "Permitir comentários", ja: "コメントを許可", ko: "댓글 허용", zhCN: "允许评论", zhTW: "允許留言" |
| `comments.at` | "at" | ptBR: "às", ja: "に", ko: "에", zhCN: "于", zhTW: "於" |
| `photo.focalLength` | "Focal length" | ptBR: "Distância focal", ja: "焦点距離", ko: "초점 거리", zhCN: "焦距", zhTW: "焦距" |

#### Verification Results
- **All 10 languages still have 428 keys each** ✓
- **No English fallbacks remain** in ja, ko, zhCN, zhTW (only "EXIF" flagged — correct, it's a universal technical term)
- **ptBR**: All previously-English keys replaced with proper Portuguese; detection script flags legitimate Portuguese words (same Latin alphabet) as false positives
- **Spot-checks passed** for `nav.explore`, `photo.addToGroups`, `settings.allowComments`, `upload.photoTitle`, `comments.at`

#### Note on ptBR False Positives
The verification script's ASCII detection flags legitimate Portuguese words (e.g., "Explorar", "Salvar", "Cancelar") because they use the Latin alphabet like English. Manual review confirms all 428 ptBR values are proper Brazilian Portuguese — none are English fallbacks.
