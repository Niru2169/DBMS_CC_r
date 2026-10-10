# TASK-06: Accurate Database Filtering & Aggregation for Song Genres

## Context & Problem Description
In [backend/prisma/schema.prisma](file:///d:/ArchivedLargeStuff/Documents/S5_Projects/DBMS_CC_retry/backend/prisma/schema.prisma), `Song.genres` is modeled as a JSON field:
```prisma
model Song {
  song_id      Int      @id @default(autoincrement())
  song_name    String   @db.VarChar(255)
  duration     Int      // in seconds
  publish_date DateTime @db.Date
  genres       Json
  listen_count Int      @default(0)
  ...
}
```

### The Problematic Implementation:
In [backend/src/routes/songs.ts](file:///d:/ArchivedLargeStuff/Documents/S5_Projects/DBMS_CC_retry/backend/src/routes/songs.ts):
```typescript
const { q, genre } = req.query;

const songs = await prisma.song.findMany({
  where: {
    is_published: true,
    ...(q && { song_name: { contains: String(q) } }),
    // Genre is stored as a JSON array — filter using string_contains on serialized value
    ...(genre && { genres: { string_contains: String(genre) } }),
  },
  ...
```

### Why This Is Flawed / Pseudo-Calculation:
1. `string_contains` on a serialized JSON blob (e.g. `["Pop", "K-Pop", "Pop-Rock"]`) causes false positives:
   - A query for `genre=Pop` will accidentally match `K-Pop` and `Pop-Rock`.
   - Searching for partial substring matches rather than exact discrete element inclusion violates relational database query design.
2. In [frontend/src/pages/SongsPage.tsx](file:///d:/ArchivedLargeStuff/Documents/S5_Projects/DBMS_CC_retry/frontend/src/pages/SongsPage.tsx), the genres list is statically hardcoded in the frontend:
   ```typescript
   const ALL_GENRES = ['Pop', 'Rock', 'Electronic', 'Jazz', 'Classical', 'Hip Hop', 'R&B', 'Metal'];
   ```
   If a song with a new genre like "Blues" or "Indie" is inserted in the DB, it never appears in the filter chips because the filter list is hardcoded rather than dynamically queried or aggregated from the database (`SELECT DISTINCT` or genre aggregation).

### File Locations:
- Backend songs route: [songs.ts](file:///d:/ArchivedLargeStuff/Documents/S5_Projects/DBMS_CC_retry/backend/src/routes/songs.ts)
- Frontend songs page: [SongsPage.tsx](file:///d:/ArchivedLargeStuff/Documents/S5_Projects/DBMS_CC_retry/frontend/src/pages/SongsPage.tsx) (lines ~25-30)

---

## Instructions for SLM / Coding Agent

### Goal:
1. Provide a dynamic endpoint or database query to fetch available genres directly from the catalog.
2. Ensure genre matching checks array membership or structured JSON containment rather than raw substring searching.

### Step 1: Add Dynamic Genre Endpoint in [backend/src/routes/songs.ts](file:///d:/ArchivedLargeStuff/Documents/S5_Projects/DBMS_CC_retry/backend/src/routes/songs.ts)
Expose `GET /api/songs/genres`:
```typescript
// GET /api/songs/genres — dynamically list all unique genres in catalog
router.get('/genres', authenticate, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const songs = await prisma.song.findMany({
      where: { is_published: true },
      select: { genres: true },
    });

    const genreSet = new Set<string>();
    for (const s of songs) {
      if (Array.isArray(s.genres)) {
        s.genres.forEach((g) => {
          if (typeof g === 'string' && g.trim()) {
            genreSet.add(g.trim());
          }
        });
      }
    }

    res.json(Array.from(genreSet).sort());
  } catch (err) {
    next(err);
  }
});
```
*(Place this before `GET /:id` to prevent route collision).*

### Step 2: Use Exact JSON or Array Filter in `GET /api/songs`
In [backend/src/routes/songs.ts](file:///d:/ArchivedLargeStuff/Documents/S5_Projects/DBMS_CC_retry/backend/src/routes/songs.ts):
```typescript
// Filter exact JSON array membership or use Raw Query / path search
...(genre && {
  genres: {
    array_contains: String(genre),
  },
}),
```
*Note for MySQL / Prisma*: If Prisma's `array_contains` filter is supported for MySQL JSON arrays, use `array_contains`. If your Prisma version requires raw SQL for JSON arrays:
```typescript
// Or using MySQL JSON_CONTAINS
// WHERE JSON_CONTAINS(genres, JSON_QUOTE(genre))
```

### Step 3: Update Frontend [frontend/src/pages/SongsPage.tsx](file:///d:/ArchivedLargeStuff/Documents/S5_Projects/DBMS_CC_retry/frontend/src/pages/SongsPage.tsx)
1. Replace static `ALL_GENRES` array with dynamic state fetched on mount:
   ```typescript
   const [availableGenres, setAvailableGenres] = useState<string[]>([]);
   
   useEffect(() => {
     api.get('/songs/genres')
       .then((res) => setAvailableGenres(res.data))
       .catch(() => setAvailableGenres(['Pop', 'Rock', 'Electronic', 'Jazz']));
   }, []);
   ```
2. Render `availableGenres.map((g) => ...)` so the filter chips dynamically adapt to whatever songs exist in the database.

### Verification Criteria:
1. Insert a song in MySQL with `genres = '["Folk", "Bluegrass"]'`.
2. Call `GET /api/songs/genres` and confirm `"Bluegrass"` and `"Folk"` appear in the returned list.
3. On the frontend, verify the chips dynamically render the new genres without manual code changes.
4. Filter by `Pop` and verify songs with only `K-Pop` are not returned.
