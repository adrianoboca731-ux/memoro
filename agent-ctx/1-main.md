# Task 1 - creami Memoro (Flickr Clone)

## Summary
Built a complete Flickr-like photo sharing web application called **creami Memoro** using Next.js 16 with App Router, TypeScript, Tailwind CSS 4, shadcn/ui, and Prisma ORM with SQLite.

## Architecture
- Single-page app (SPA-like) at `/` route with client-side state management using Zustand
- All views (explore, albums, favorites, recent, search) handled via client-side state
- Photo detail/lightbox view as a modal overlay
- Upload modal with drag-and-drop support

## Files Created/Modified

### Prisma Schema (`prisma/schema.prisma`)
- Replaced default User/Post models with Photo, Album, Comment models
- Photo: id, title, description, filename, filepath, mimetype, size, width, height, tags, albumId, views, favorite
- Album: id, name, description, cover
- Comment: id, text, author, photoId

### API Routes
1. `src/app/api/photos/route.ts` - GET (list, search, filter) + POST (create)
2. `src/app/api/photos/[id]/route.ts` - GET (single + increment views) + PATCH (update) + DELETE
3. `src/app/api/photos/[id]/comments/route.ts` - GET + POST
4. `src/app/api/albums/route.ts` - GET (list with photo count) + POST (create)
5. `src/app/api/albums/[id]/route.ts` - GET + PATCH + DELETE
6. `src/app/api/upload/route.ts` - POST (file upload with sharp thumbnail generation)
7. `src/app/api/stats/route.ts` - GET (total photos, albums, views)

### Zustand Store (`src/lib/store.ts`)
- Navigation state: currentView, selectedPhotoId, selectedAlbumId, isUploadOpen, searchQuery
- Data state: photos, albums, stats
- Actions: setCurrentView, selectPhoto, toggleUpload, setSearchQuery, setPhotos, setAlbums, toggleFavorite, deletePhoto, addPhoto, updatePhoto, addAlbum, deleteAlbum, addComment

### UI Components
- `src/components/theme-provider.tsx` - Theme provider using next-themes
- `src/components/header.tsx` - Logo, search bar, navigation, upload button, theme toggle
- `src/components/photo-grid.tsx` - Masonry-style photo grid with hover effects
- `src/components/photo-detail.tsx` - Lightbox with photo info, editing, comments
- `src/components/upload-modal.tsx` - Drag-and-drop upload with progress
- `src/components/albums-view.tsx` - Album grid with create/delete, album detail view

### Main Page (`src/app/page.tsx`)
- Client-side SPA with data fetching on mount
- View routing based on currentView state
- Stats bar, view headers, responsive grid

### Layout (`src/app/layout.tsx`)
- Italian language, metadata for SEO
- ThemeProvider + Toaster

### Styling (`src/app/globals.css`)
- Custom scrollbar styling
- Masonry column fixes
- Animation keyframes

### Seed Data (`prisma/seed.ts`)
- 4 albums: Paesaggi, Ritratti, Natura, Città
- 12 AI-generated photos with Italian titles, descriptions, tags
- 32 sample comments from Italian users

### Sample Photos
- Generated 12 photos using z-ai-generate CLI tool
- Topics: Italian landscapes (Lake Como, Tuscany, Cinque Terre, Amalfi Coast, Dolomites), cities (Rome, Florence, Venice), portraits, nature
- Thumbnails created with sharp (400px wide)

## UI Design
- Flickr-inspired color scheme: #0063dc (blue) for primary, #ff0084 (pink) for favorites
- Clean, photo-centric design with masonry grid
- Responsive: 2 cols mobile, 3 tablet, 4-5 desktop
- Dark/light mode with next-themes
- Italian language throughout the UI
- Smooth animations with framer-motion

## Technical Stack
- Next.js 16 + App Router
- TypeScript 5
- Tailwind CSS 4 + shadcn/ui
- Prisma ORM + SQLite
- Zustand for state management
- framer-motion for animations
- sharp for image processing
- date-fns for date formatting (Italian locale)
