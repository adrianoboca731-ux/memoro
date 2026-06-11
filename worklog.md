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
