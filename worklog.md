---
Task ID: 1
Agent: Main Agent
Task: Add custom cover and logo images for user profiles + fix photostream

Work Log:
- Added `coverImage` and `logoImage` fields to User model in Prisma schema
- Created `/api/upload/cover/route.ts` - POST (upload) and DELETE (remove) cover images
- Created `/api/upload/logo/route.ts` - POST (upload) and DELETE (remove) logo images
- Updated cloudinary.ts to support isCover and isLogo upload options with proper transforms
- Updated `/api/users/[username]/route.ts` to include coverImage and logoImage in GET and PUT
- Rewrote profile page `/persone/[username]/page.tsx` with:
  - Custom cover image display (falls back to blurred avatar then gradient)
  - Cover upload overlay on hover (own profile only) with Upload/Remove buttons
  - Custom logo badge displayed at bottom-right of avatar
  - Logo upload button when no logo (own profile only)
  - Logo remove on hover over badge
- Updated settings page `/impostazioni/page.tsx` with:
  - Cover image card with preview, upload, and remove
  - Logo image card with preview, upload, and remove
  - Added Upload and ImageIconLucide imports
  - Added coverUploading, coverUrl, logoUploading, logoUrl state variables
  - Added coverInputRef, logoInputRef refs
  - Added handleCoverChange, handleCoverRemove, handleLogoChange, handleLogoRemove handlers
- Added 21 new i18n keys across all 10 languages (it, en, fr, de, es, pt-BR, ja, ko, zh-CN, zh-TW)
- Fixed photostream/favorites issue: Added `favoritesUserId` parameter handling to `/api/photos/route.ts`
- Created `/api/migrate/route.ts` for production database migration
- Ran migration on production: cover_image and logo_image columns added to users table
- Built and deployed successfully to Vercel

Stage Summary:
- Users can now customize their profile cover image and logo
- Cover images display on profile page with upload overlay on hover
- Logo badges appear next to the avatar
- Settings page has dedicated Cover and Logo management cards
- Favorites tab on profile now works correctly (API was missing favorites filter)
- All 10 languages supported for new features
