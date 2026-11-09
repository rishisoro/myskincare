# My Plum Routine — PWA for GitHub Pages

Rishikanta's personal skincare routine tracker.
Plum Rice Water & Niacinamide routine · Sensitive skin · Goals: smooth skin, even tone, smaller-looking pores.
**Routine starts: Monday 9 Nov 2026 (Day 1).**

## Files in this folder — upload ALL of them, keeping the structure
```
index.html
styles.css
app.js
manifest.json
sw.js
icons/icon-192.png
icons/icon-512.png
README.md
```

## How to host on GitHub Pages (5 minutes, on phone or computer)
1. Go to github.com and create a **New repository**, e.g. name it `my-plum-routine`. Keep it Public (needed for free GitHub Pages).
2. In the repo, click **Add file → Upload files** and upload all the files above, **including the `icons` folder** (upload the folder contents keeping `icons/` as a folder — on desktop you can drag the whole `my-plum-routine-github` folder contents in).
3. Click **Commit changes**.
4. Go to repo **Settings → Pages** (left sidebar).
5. Under "Build and deployment", Source: **Deploy from a branch**. Branch: `main`, folder: `/ (root)`. Save.
6. Wait 1–2 minutes. GitHub shows your live URL at the top of the Pages settings, like:
   `https://<your-username>.github.io/my-plum-routine/`
7. Open that URL in **Chrome on your Android phone**.
8. Chrome menu (⋮) → **Add to Home screen / Install app**. The app icon appears on your home screen and opens full-screen like a normal app.

## How tracking works
- All ticks, times, logs, shave days and streaks are saved in **your browser's localStorage on your phone** — no server, no account.
- Data survives closing the app/browser. It does **not** survive clearing Chrome site data, uninstalling, or changing phone/browser.
- **Backup:** In the app → Progress tab → "Export backup (JSON)". Save that file (WhatsApp/Google Drive). Restore anytime with "Import backup" on the same tab.
- Offline: after the first visit, the service worker (`sw.js`) caches the app, so it opens even without internet.

## How the routine works in the app
- **Date-based:** Day 1–4 = Stage A (basics), Day 5–11 = Stage B (+ toner), Day 12+ = Stage C (+ serum, PM only, alternate nights at first).
- **Time-based (IST):** The app greets you by time of day and shows a "Do Now" card — morning = AM routine, midday = sunscreen check, evening = PM routine, late night = finish PM or rest + tomorrow preview.
- **Shave day:** Toggle on your weekly razor day — toner & serum are skipped automatically.
- Before 9 Nov 2026 the app is in preview mode: you can look around, but ticks/logs are not counted.

## What's new in v1.2.0
- One-screen Home: compact header, slimmer steps and progress ring, shave toggle folded into the Do Now card, other routines collapsed to one-line summaries (tap to view), Daily Log stays collapsed until tapped, and the Sunday photo card moved to the Progress tab (a slim Sunday strip on Home links to it on Sundays). The Today screen now fits a phone screen without scrolling.
- Missed-step popup: when a routine window has passed with steps unticked (this morning's steps by evening, or last night's steps the next day), a popup lists each missed step with three one-tap actions — ✓ Already done (ticks it), ✗ Missed it (records it as missed, shown on the step), ⏰ Remind me (snoozes that step for 1 hour). "Not now" snoozes everything shown for 20 minutes.

## What was new in v1.1.1
- Auto-update: the app checks for a new version every time it opens, whenever it returns to the foreground, and hourly while open. When a new version is pushed to this repo, the installed app downloads it, activates it and reloads itself automatically — no reinstall needed. The in-app update banner remains as a manual fallback. Service-worker cache bumped to v3.

## What was new in v1.1.0
- Safer backup import: validates the file, downloads your current data first, and asks for confirmation before replacing anything.
- Data now keeps a shadow safety copy + requests persistent browser storage.
- "New version available" notice in the app when an update is published (service-worker cache is now v2).
- Today screen: big progress ring, your NEXT step highlighted, completed steps collapse, auto dark mode at night.
- Settings: set your own morning/midday/night start times and a fixed weekly shave day.
- Stage safety gate: if redness was high for 2 days at a stage change, the app suggests holding the stage 3 days.
- Midday rescue routine if the morning was missed, sunscreen reapply timer, sunscreen reorder reminder from Day 20.
- Progress photos stored on-device in IndexedDB with a first-vs-latest comparison slider, 7-day score chart, and a Sunday weekly summary.

## Updating the app later
Replace the changed files in the repo (upload again with the same names) and commit. If the design/logic changes a lot, also change the cache name in `sw.js` (e.g. `my-plum-routine-v2`) so phones fetch the new version.
