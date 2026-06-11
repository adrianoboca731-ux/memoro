# Task 2-a: Fix Date Locale Hardcoding

## Agent: main

## Summary
Fixed date locale hardcoding across 6 Memoro project files by following the locale-aware pattern from `comment-section.tsx`. The key pattern is:
1. Import all date-fns locales at module level
2. Create a `dateLocales` mapping object
3. Derive `dateLocale` from `useI18n().locale` at component level
4. Use `dateLocale` instead of hardcoded `it` in `format()` calls
5. Replace hardcoded `'alle'` with `t("comments.at")` translation key
6. Replace Italian console.error messages with English equivalents

## Files Modified
1. `src/app/esplora/page.tsx` - console.error only
2. `src/app/gruppi/page.tsx` - console.error only
3. `src/app/gruppi/[id]/page.tsx` - date locale + console.error
4. `src/app/gruppi/[id]/discussioni/[discussionId]/page.tsx` - date locale + alle + console.error
5. `src/app/rullino/page.tsx` - date locale + console.error
6. `src/app/foto/[id]/page.tsx` - date locale + console.error

## Notes
- Trending tags in esplora/page.tsx were left as-is because no translation keys exist for them (content tags, not UI text)
- API route files still contain Italian error messages but were NOT in scope for this task
- Other pages (messaggi, gallerie, notifiche, persone, album) already had the dateLocales pattern from prior work
