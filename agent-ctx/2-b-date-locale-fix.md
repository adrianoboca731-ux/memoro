# Task 2-b: Fix Date Locale Hardcoding

## Agent: Main Agent
## Status: Completed

## Summary
Fixed hardcoded Italian date locale (`locale: it`) and Italian console.error/throw messages across 6 page files, following the locale-aware pattern from `comment-section.tsx`.

## Files Modified
1. `src/app/messaggi/page.tsx` — locale imports, dateLocales map, dateLocale variable, `{ locale: it }` → `{ locale: dateLocale }`, `'alle'` → `t("comments.at")`, 4× error messages
2. `src/app/gallerie/page.tsx` — 3× Italian error messages → English
3. `src/app/gallerie/[id]/page.tsx` — locale imports, dateLocales map, dateLocale variable, `{ locale: it }` → `{ locale: dateLocale }`, 1× error message
4. `src/app/impostazioni/page.tsx` — 1× error message
5. `src/app/carica/page.tsx` — 2× Italian throw messages → English
6. `src/app/cerca/page.tsx` — 1× error message

## Lint: Passes (0 new errors)
