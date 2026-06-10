# Task: vercel-migration — Vercel Deployment Migration

## Summary

Migrated creami Memoro from SQLite + local filesystem to Vercel Postgres + Vercel Blob.

## Files Changed

| File | Change |
|------|--------|
| `prisma/schema.prisma` | SQLite → PostgreSQL, added `@map`/`@@map` annotations, added `thumbnail` field |
| `src/app/api/upload/route.ts` | Replaced filesystem upload with `@vercel/blob` `put()` |
| `src/app/api/photos/[id]/route.ts` | Added `del()` from `@vercel/blob` for blob cleanup on delete |
| `src/app/api/photos/route.ts` | Added `thumbnail` field to photo creation |
| `src/components/upload-modal.tsx` | Sends `thumbnail` to photos POST API |
| `src/components/photo-grid.tsx` | Uses `photo.thumbnail` with fallback to local path pattern |
| `src/lib/store.ts` | Added `thumbnail: string \| null` to Photo interface |
| `next.config.ts` | Removed `output: "standalone"`, added blob image remote patterns |
| `src/lib/db.ts` | Conditional query logging (dev only) |
| `.env.example` | Created with DATABASE_URL and BLOB_READ_WRITE_TOKEN |
| `package.json` | Added `@vercel/blob@2.4.0` |

## Key Decisions

- Added `thumbnail` field to Photo model — necessary because blob URLs aren't derivable via string replacement like local paths
- Graceful fallback in `photo-grid.tsx`: `photo.thumbnail || photo.filepath.replace('/uploads/', '/uploads/thumb-')`
- Blob deletion in photo DELETE is conditional on URL containing `blob.vercel-storage.com` (safe for local dev)
- Did NOT run `prisma db push` or `prisma generate` — requires actual Postgres connection, will run on Vercel
- Local dev still works via cached Prisma client with existing SQLite DB

## Post-Deployment Steps for User

1. Create Vercel Postgres database
2. Create Vercel Blob store
3. Run `npx prisma db push` on Vercel
4. Seed the database
