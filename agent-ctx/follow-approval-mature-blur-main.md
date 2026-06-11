# Task: Follow Approval System + Mature Content Blur

## Summary of Changes

### Feature 1: Follow Approval System for Private Profiles

1. **Prisma Schema** (`prisma/schema.prisma`)
   - Added `status` field to Follow model: `status String @default("approved") @map("status")` with values "pending", "approved", "rejected"
   - Default is "approved" so existing follows continue to work

2. **Follow API** (`src/app/api/users/[username]/follow/route.ts`)
   - Rewrote with GET, POST, DELETE endpoints
   - GET: Returns follow status `{ following, followStatus }`
   - POST: Follow with status based on target user's isPublic flag
     - Public profile: instant follow (status = "approved")
     - Private profile: pending follow (status = "pending")
   - DELETE: Unfollow regardless of status, only decrement counts for approved follows

3. **Pending Follows API** (`src/app/api/follows/pending/route.ts`)
   - GET: Lists pending follow requests for the logged-in user (private profile owners)

4. **Approve/Reject Follow API** (`src/app/api/follows/[id]/approve/route.ts`)
   - POST: Approve pending follow request (owner only), increments counts, sends notification
   - DELETE: Reject pending follow request (owner only), deletes follow entry

5. **Follow Button** (`src/components/follow-button.tsx`)
   - Added `isPrivate`, `followStatus`, and `onStatusChange` props
   - Shows "Pending" with Clock icon for pending requests (amber color)
   - Shows "Following" for approved follows
   - Shows "Follow" for default state

6. **User API** (`src/app/api/users/[username]/route.ts`)
   - Added `viewerFollowStatus` field to GET response

7. **Profile Page** (`src/app/persone/[username]/page.tsx`)
   - Private profiles now check for approved follower status (not just any follow)
   - Shows "Pending follow request" message for pending followers
   - Shows FollowButton on private profile page for non-followers
   - Shows pending follow requests section for own private profiles with approve/reject buttons

### Feature 2: Mature Content Blur Instead of Hiding

1. **Photos API** (`src/app/api/photos/route.ts`)
   - Removed safety level filtering from where clause
   - Added `shouldBlur` computation to each photo based on viewer settings
   - Photo owner always sees unblurred
   - `showMatureContent = true` bypasses blur
   - isMature/restricted + safeSearch != "off" → blur
   - moderate + strict → blur

2. **Photo Detail API** (`src/app/api/photos/[id]/route.ts`)
   - Replaced 403 blocking with `shouldBlur` flag in response
   - Same blur logic as photos API

3. **Search API** (`src/app/api/search/route.ts`)
   - Same treatment: removed safety filter from where clause, added shouldBlur flag

4. **Photo Card** (`src/components/photo-card.tsx`)
   - Added `shouldBlur` prop support
   - When blurred: applies `blur-xl` class to image
   - Shows overlay with warning icon, "Mature content"/"Restricted content" text
   - Clickable button to temporarily reveal with confirmation dialog

5. **Photo Detail Page** (`src/app/foto/[id]/page.tsx`)
   - Applied blur with overlay on individual photo page
   - Same blur logic and reveal functionality

### i18n Translations

Added 13 new keys to all 10 languages:
- `profile.pendingFollow`, `profile.followPending`, `profile.followPendingDesc`
- `profile.pendingRequests`, `profile.approveFollow`, `profile.rejectFollow`
- `profile.noPendingRequests`
- `photo.matureContent`, `photo.matureContentDesc`
- `photo.restrictedContent`, `photo.restrictedContentDesc`
- `photo.showContent`, `photo.confirmShowMature`

## Build Status
- Build passes successfully
- Prisma schema generates correctly (database unreachable for push, but schema is valid)
- Lint only has pre-existing errors in scripts/ directory
