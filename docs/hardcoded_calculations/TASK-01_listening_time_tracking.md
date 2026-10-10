# TASK-01: Realistic Listening Time Calculation in Listening Activity

## Context & Problem Description
In the MusicLib application, user song listens are recorded to demonstrate database transactions and write operations in a MySQL database. However, currently the listen time calculation is hardcoded to `0` seconds.

### File Locations:
- Frontend caller: [SongsPage.tsx](file:///d:/ArchivedLargeStuff/Documents/S5_Projects/DBMS_CC_retry/frontend/src/pages/SongsPage.tsx) (lines ~73-81)
- Backend endpoint: [songs.ts](file:///d:/ArchivedLargeStuff/Documents/S5_Projects/DBMS_CC_retry/backend/src/routes/songs.ts) (lines ~76-106)
- Database schema: [schema.prisma](file:///d:/ArchivedLargeStuff/Documents/S5_Projects/DBMS_CC_retry/backend/prisma/schema.prisma) (`model Listening_Activity`)

### The Hardcoded Implementation:
In [frontend/src/pages/SongsPage.tsx](file:///d:/ArchivedLargeStuff/Documents/S5_Projects/DBMS_CC_retry/frontend/src/pages/SongsPage.tsx):
```typescript
const recordListen = async (songId: number) => {
  try {
    await api.post(`/songs/${songId}/listen`, { listening_time: 0 }); // <-- HARDCODED TO 0
    ...
```

The database column `listening_time` in `Listening_Activity` is intended to store actual listened seconds. Because `listening_time` is sent as `0`, any future aggregations (e.g., total hours listened, top user listening times) evaluate to `0`.

---

## Instructions for SLM / Coding Agent

### Goal:
Calculate realistic listening duration. When a user clicks to listen or plays a song, either compute the duration from the song's actual length or track the elapsed seconds.

### Step 1: Update Frontend [frontend/src/pages/SongsPage.tsx](file:///d:/ArchivedLargeStuff/Documents/S5_Projects/DBMS_CC_retry/frontend/src/pages/SongsPage.tsx)
1. In `recordListen`, accept the song object or song duration:
   ```typescript
   const recordListen = async (song: Song) => {
     try {
       // Send the full song duration or a calculated playback time (e.g., Math.round(song.duration))
       const timeListened = song.duration > 0 ? song.duration : 180;
       await api.post(`/songs/${song.song_id}/listen`, { listening_time: timeListened });
       setSongs((prev) =>
         prev.map((s) => s.song_id === song.song_id ? { ...s, listen_count: s.listen_count + 1 } : s)
       );
     } catch { /* silently ignore */ }
   };
   ```
2. Update the click handler for the song row or play action:
   Change `onClick={() => recordListen(song.song_id)}` to `onClick={() => recordListen(song)}`.

### Step 2: Validate Backend [backend/src/routes/songs.ts](file:///d:/ArchivedLargeStuff/Documents/S5_Projects/DBMS_CC_retry/backend/src/routes/songs.ts)
1. Verify that `POST /api/songs/:id/listen` parses and validates `listening_time`:
   ```typescript
   const songId = parseInt(req.params.id);
   const userId = req.user!.userId;
   let { listening_time } = req.body;
   
   // If listening_time is not provided or <= 0, query the song's duration as default
   if (!listening_time || typeof listening_time !== 'number' || listening_time <= 0) {
     const song = await prisma.song.findUnique({
       where: { song_id: songId },
       select: { duration: true }
     });
     listening_time = song?.duration || 0;
   }
   ```
2. Store `listening_time` in `Listening_Activity`:
   ```typescript
   prisma.listening_Activity.create({
     data: {
       user_id: userId,
       song_id: songId,
       listening_time: Math.round(listening_time),
     },
   })
   ```

### Verification Criteria:
1. Run backend unit/integration tests or test with curl/postman:
   `POST /api/songs/1/listen` with `{ listening_time: 195 }`.
2. Inspect the MySQL database: `SELECT * FROM Listening_Activity ORDER BY timestamp DESC LIMIT 1;` confirms `listening_time` is `195` (not `0`).
3. Check `npm run build` in both frontend and backend to verify TypeScript types compile with zero errors.
