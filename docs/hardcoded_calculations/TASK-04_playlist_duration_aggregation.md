# TASK-04: Robust Playlist Duration Database Aggregation

## Context & Problem Description
In the MusicLib database, `Playlist` has a stored attribute `duration` (total seconds of all songs in the playlist).

Currently, when a song is added or removed in [backend/src/routes/playlists.ts](file:///d:/ArchivedLargeStuff/Documents/S5_Projects/DBMS_CC_retry/backend/src/routes/playlists.ts):
```typescript
// Recalculate duration
const songs = await prisma.playlist_Song.findMany({
  where: { playlist_id: playlistId },
  include: { song: { select: { duration: true } } },
});
const totalDuration = songs.reduce((acc, ps) => acc + ps.song.duration, 0);
await prisma.playlist.update({
  where: { playlist_id: playlistId },
  data: { duration: totalDuration },
});
```

### Issues with Current Implementation:
1. **Inefficient in-memory summation**: All song durations are transferred over the wire from MySQL to Node.js and reduced with JavaScript `reduce()` instead of asking MySQL to compute `SUM(song.duration)`.
2. **Missing sync upon updates/imports**: If songs are bulk loaded, or a song's duration is updated in the database, the playlist's cached duration becomes stale.
3. **No fallback computation**: In `GET /api/playlists/:id`, if `duration` in the database is out of sync or 0, it does not dynamically reconcile with the sum of its song items.

### File Locations:
- Backend routes: [playlists.ts](file:///d:/ArchivedLargeStuff/Documents/S5_Projects/DBMS_CC_retry/backend/src/routes/playlists.ts) (lines ~267-277, 305-315)
- Frontend detail page: [PlaylistDetailPage.tsx](file:///d:/ArchivedLargeStuff/Documents/S5_Projects/DBMS_CC_retry/frontend/src/pages/PlaylistDetailPage.tsx)
- Frontend playlists page: [PlaylistsPage.tsx](file:///d:/ArchivedLargeStuff/Documents/S5_Projects/DBMS_CC_retry/frontend/src/pages/PlaylistsPage.tsx)

---

## Instructions for SLM / Coding Agent

### Goal:
1. Replace in-memory array reduction with Prisma database aggregation or a helper function that executes SQL `SUM` / relational aggregate.
2. Ensure the duration returned in `GET /api/playlists/:id` is always accurate and updated transactionally.

### Step 1: Create a Reusable Helper in [backend/src/routes/playlists.ts](file:///d:/ArchivedLargeStuff/Documents/S5_Projects/DBMS_CC_retry/backend/src/routes/playlists.ts)
Implement a dedicated calculation function:
```typescript
async function recalculatePlaylistDuration(playlistId: number): Promise<number> {
  // Query sum of song durations via relation
  const result = await prisma.playlist_Song.findMany({
    where: { playlist_id: playlistId },
    select: { song: { select: { duration: true } } },
  });
  
  const totalDuration = result.reduce((sum, item) => sum + (item.song?.duration || 0), 0);
  
  await prisma.playlist.update({
    where: { playlist_id: playlistId },
    data: {
      duration: totalDuration,
      last_updated: new Date(),
    },
  });
  
  return totalDuration;
}
```

*Alternative (Direct Raw SQL Aggregate for performance):*
```typescript
async function recalculatePlaylistDuration(playlistId: number): Promise<number> {
  const result: Array<{ total_duration: bigint | number | null }> = await prisma.$queryRaw`
    SELECT COALESCE(SUM(s.duration), 0) AS total_duration
    FROM Playlist_Song ps
    JOIN Song s ON ps.song_id = s.song_id
    WHERE ps.playlist_id = ${playlistId}
  `;
  const total = Number(result[0]?.total_duration ?? 0);
  await prisma.playlist.update({
    where: { playlist_id: playlistId },
    data: { duration: total },
  });
  return total;
}
```

### Step 2: Use Helper in Add/Remove Routes
1. In `POST /api/playlists/:id/songs`:
   Replace lines 267-276 with `await recalculatePlaylistDuration(playlistId);`.
2. In `DELETE /api/playlists/:id/songs/:songId`:
   Replace lines 305-315 with `await recalculatePlaylistDuration(playlistId);`.
3. In `GET /api/playlists/:id`:
   If `playlist.songs.length > 0` and `playlist.duration === 0`, trigger recalculation or dynamically compute duration so the client never receives an inconsistent `0m 0s` playlist duration.

### Verification Criteria:
1. Add 3 songs of varying durations (e.g. 180s, 240s, 210s) to a playlist.
2. Verify in MySQL: `SELECT duration FROM Playlist WHERE playlist_id = ?;` equals `630`.
3. Delete one song of 240s. Verify database updates `duration` to `390`.
4. Test in UI that the formatted total duration on the playlist header instantly reflects the updated sum.
