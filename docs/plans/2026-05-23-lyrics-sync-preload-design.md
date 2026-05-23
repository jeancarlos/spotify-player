# Synchronized Lyrics with LRCLIB

This plan outlines the implementation of synchronized lyrics using the LRCLIB API and preloading logic for better user experience.

## Objectives
1. Replace `api.lyrics.ovh` with `LRCLIB` for timestamped lyrics.
2. Implement LRC parsing for synchronized playback.
3. Update `LyricsView` to synchronize based on timestamps.
4. Add preloading for the next track in the queue.

## Architecture

### 1. Data Fetching (`src/hooks/queries/useLyrics.ts`)
- Use `https://lrclib.net/api/get` with `artist_name`, `track_name`, `album_name`, and `duration`.
- Prefer `syncedLyrics` (LRC format) from the response.
- Fallback to `plainLyrics` if synced is unavailable.

### 2. LRC Parsing
- New utility to parse `[mm:ss.xx] Text` into `{ time: number, text: string }`.
- Handle multiple timestamps per line and empty lines.

### 3. Synchronization (`src/components/layout/LyricsView.tsx`)
- Accept `LyricLine[]` instead of `string[]`.
- `activeIndex = lines.findLastIndex(l => l.time <= progress)`.
- Smooth scrolling remains.

### 4. Preloading
- Monitor current track and queue.
- Prefetch next track lyrics using `queryClient.prefetchQuery`.

## Implementation Steps (Surgical Commits)

### Step 1: Update `useLyrics` and parsing utility
- Change API endpoint to LRCLIB.
- Add `parseLRC` helper.
- Update `useLyrics` to return `LyricLine[]`.
- **Commit:** "refactor: update useLyrics to use LRCLIB and return timestamped lines"

### Step 2: Update `LyricsView` component
- Adapt props and types.
- Update `activeIndex` logic.
- **Commit:** "feat: implement precise lyrics synchronization in LyricsView"

### Step 3: Implement Preloading
- Add logic to fetch next track lyrics.
- **Commit:** "feat: add lyrics preloading for next track in queue"

## Verification
- Verify lyrics sync with various tracks.
- Check console for preloading requests.
- Ensure fallback to plain lyrics works for tracks without sync data.
