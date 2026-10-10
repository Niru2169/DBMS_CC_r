# TASK-03: Artist Total Song Counts Database Aggregation

## Context & Problem Description
In [ArtistsPage.tsx](file:///d:/ArchivedLargeStuff/Documents/S5_Projects/DBMS_CC_retry/frontend/src/pages/ArtistsPage.tsx), each artist item renders a song count indicator:
```tsx
<p className="text-xs text-muted-foreground mt-0.5">
  @{artist.user?.username} · {artist.songs?.length || 0} songs
</p>
```
And in the detail panel:
```tsx
<h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
  <Music2 className="h-4 w-4" /> Songs ({selected.songs?.length || 0})
</h3>
```

However, in the backend route [backend/src/routes/artists.ts](file:///d:/ArchivedLargeStuff/Documents/S5_Projects/DBMS_CC_retry/backend/src/routes/artists.ts):
- For `GET /api/artists/:userId`, `songs` is limited by `take: 20`:
  ```typescript
  songs: {
    include: { song: true },
    where: { is_primary: true },
    take: 20, // <-- HARD LIMIT
  }
  ```
- If an artist has 50 songs, `artist.songs.length` will falsely report `20 songs`.
- Furthermore, `GET /api/artists` loads the entire songs relation table into memory just to determine the count, which is inefficient and inaccurate when relations are filtered or paginated.

### File Locations:
- Backend route: [artists.ts](file:///d:/ArchivedLargeStuff/Documents/S5_Projects/DBMS_CC_retry/backend/src/routes/artists.ts)
- Frontend page: [ArtistsPage.tsx](file:///d:/ArchivedLargeStuff/Documents/S5_Projects/DBMS_CC_retry/frontend/src/pages/ArtistsPage.tsx)
- Schema: [schema.prisma](file:///d:/ArchivedLargeStuff/Documents/S5_Projects/DBMS_CC_retry/backend/prisma/schema.prisma) (`model Artist`, `model Song_Artist_Relationship`)

---

## Instructions for SLM / Coding Agent

### Goal:
Leverage Prisma's relational count aggregate (`_count: { songs: true }`) so the database returns the true number of songs an artist has, regardless of pagination or `take` limits on the actual song records.

### Step 1: Update Backend [backend/src/routes/artists.ts](file:///d:/ArchivedLargeStuff/Documents/S5_Projects/DBMS_CC_retry/backend/src/routes/artists.ts)
1. In `GET /api/artists`, include `_count: { select: { songs: true } }`:
   ```typescript
   const artists = await prisma.artist.findMany({
     where: name ? { name: { contains: String(name) } } : undefined,
     include: {
       user: { select: { user_id: true, username: true } },
       production_house: true,
       songs: {
         include: { song: true },
         take: 5, // keep card payload lightweight
       },
       _count: {
         select: { songs: true },
       },
     },
     orderBy: { name: 'asc' },
     take: 50,
   });
   ```
2. In `GET /api/artists/:userId`, also include `_count`:
   ```typescript
   const artist = await prisma.artist.findUnique({
     where: { user_id: userId },
     include: {
       user: { select: { user_id: true, username: true, created_at: true } },
       production_house: true,
       songs: {
         include: { song: true },
         where: { is_primary: true },
         take: 50,
       },
       _count: {
         select: { songs: true },
       },
     },
   });
   ```

### Step 2: Update Frontend [frontend/src/pages/ArtistsPage.tsx](file:///d:/ArchivedLargeStuff/Documents/S5_Projects/DBMS_CC_retry/frontend/src/pages/ArtistsPage.tsx)
1. Add `_count?: { songs: number }` to the `Artist` interface:
   ```typescript
   interface Artist {
     user_id: number;
     name: string;
     country: string | null;
     is_band: boolean;
     country_of_origin: string | null;
     created_at: string;
     production_house: { name: string; type: string } | null;
     user: { user_id: number; username: string; created_at: string };
     songs: ArtistSong[];
     _count?: { songs: number };
   }
   ```
2. Replace `artist.songs?.length || 0` with `artist._count?.songs ?? artist.songs?.length ?? 0`.
3. In the detail panel header:
   ```tsx
   <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
     <Music2 className="h-4 w-4" /> Songs ({selected._count?.songs ?? selected.songs?.length ?? 0})
   </h3>
   ```

### Verification Criteria:
1. Seed or test with an artist who has more songs than the query's `take` limit (e.g., 25 songs).
2. Fetch `GET /api/artists` and check `_count.songs` equals 25.
3. Verify on the UI that `25 songs` is displayed accurately without loading all 25 rows on initial list render.
