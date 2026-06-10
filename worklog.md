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
