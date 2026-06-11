---
Task ID: 2
Agent: Main Agent
Task: Implement follow approval for private profiles + mature content blur

Work Log:
- Added `status` field (pending/approved/rejected) to Follow model in Prisma schema
- Default is "approved" so existing follows still work
- Rewrote Follow API with GET/POST/DELETE methods
  - POST: public profiles = instant approved, private profiles = pending
  - GET: returns follow status for viewer
  - DELETE: removes follow regardless of status
- Created `/api/follows/pending` endpoint - lists pending follow requests
- Created `/api/follows/[id]/approve` endpoint - POST=approve, DELETE=reject
- Updated user API to include `viewerFollowStatus` in response
- Updated FollowButton component with isPrivate, followStatus props
  - Shows "Pending" with Clock icon for pending requests on private profiles
- Updated profile page:
  - Private profiles: only approved followers see content
  - Shows "Pending follow request" message for pending followers
  - Shows pending requests section with approve/reject buttons for own private profiles
- Updated Photos API:
  - Removed safety level filtering from WHERE clause
  - Added `shouldBlur` flag computation per photo based on viewer settings
  - Photo owners always see their own photos unblurred
  - Users with showMatureContent=true see mature content unblurred
- Updated PhotoCard component:
  - Added `shouldBlur` prop
  - When blurred: applies blur-xl class, shows overlay with warning icon + i18n text
  - "Show" button with confirmation to reveal
- Updated Photo detail page with same blur functionality
- Updated Search API with same shouldBlur logic
- Added 13 new i18n keys across all 10 languages
- Ran database migration: added status column to follows table
- Build and deploy successful

Stage Summary:
- Private profiles now require follow approval
- Profile owners can approve/reject follower requests
- Mature/restricted content is shown blurred instead of hidden
- Users can reveal mature content with confirmation click
- All 10 languages supported

---
Task ID: 2
Agent: Main Agent
Task: Fix profile page crash and implement Flickr-style photo cards

Work Log:
- Diagnosed profile page 500 error: `TypeError: Cannot read properties of null (reading 'isPublic')` - SSR crash because user state is null during initial render but code accessed `user.isPublic` without null check
- Fixed by adding optional chaining: `user?.isPublic !== false` instead of `user.isPublic !== false`
- Removed unused `ImageIconLucide` import from lucide-react (doesn't exist in the package)
- Deployed fix and verified profile page returns HTTP 200

- Analyzed user's screenshot reference showing Flickr-style photo cards with:
  - Photo title (bold, left-aligned)
  - Author attribution ("da [name]")
  - Visible engagement stats: star/favorites count, comment count
  - Interactive favorite/add button
- Rewrote PhotoCard component with new `flickrStyle` mode (default true):
  - Title and "by author" visible below image
  - Star icon with favorites count (clickable to toggle favorite)
  - MessageSquare icon with comment count (links to comments)
  - Hover overlay shows views count
  - Interactive favorite toggle using `/api/photos/[id]/favorite` API
- Updated all photo grid layouts from CSS columns (masonry) to CSS grid for consistent card sizing
- Updated pages: esplora, cerca, preferiti, album/[id], gallerie/[id], gruppi/[id], persone/[username]
- Added 3 new i18n keys × 10 languages: photo.addFavorite, photo.removeFavorite, photo.favoriteError
- Added DB migrations for birth_date and profile_viewers table
- Ran migrations successfully on production

Stage Summary:
- Profile page crash fixed (null reference error)
- Flickr-style photo cards implemented across all pages
- Photo grids use consistent CSS grid layout
- Interactive favorite toggle on photo cards
- DB schema updated with birth_date and profile_viewers
- All migrations applied on production
- All pages verified returning HTTP 200
