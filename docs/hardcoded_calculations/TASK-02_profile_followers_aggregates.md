# TASK-02: User Profile Followers & Following Relational Aggregates

## Context & Problem Description
In the MusicLib schema, user relationships are bidirectional via the `Follow` join table:
- A user has a `following` relation (`follower_user_id == user_id`)
- A user has a `followers` relation (`followed_user_id == user_id`)

However, currently the user's Profile page only calculates `following.length` from an in-memory client fetch of `/users/me/following`. It does not calculate or display how many people follow the current user. Furthermore, `/api/auth/me` does not return relational counts, bypassing database aggregate calculations.

### File Locations:
- Backend auth route: [auth.ts](file:///d:/ArchivedLargeStuff/Documents/S5_Projects/DBMS_CC_retry/backend/src/routes/auth.ts) (lines ~124-150)
- Frontend profile page: [ProfilePage.tsx](file:///d:/ArchivedLargeStuff/Documents/S5_Projects/DBMS_CC_retry/frontend/src/pages/ProfilePage.tsx) (lines ~18-120)
- Database schema: [schema.prisma](file:///d:/ArchivedLargeStuff/Documents/S5_Projects/DBMS_CC_retry/backend/prisma/schema.prisma) (`model Follow`, `model User`)

### The Hardcoded / Omitted Implementation:
In [backend/src/routes/auth.ts](file:///d:/ArchivedLargeStuff/Documents/S5_Projects/DBMS_CC_retry/backend/src/routes/auth.ts):
```typescript
router.get('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  const user = await prisma.user.findUnique({
    where: { user_id: req.user!.userId },
    include: { artist: { include: { production_house: true } } },
    // OMITTED: _count for followers and following
  });
```

In [frontend/src/pages/ProfilePage.tsx](file:///d:/ArchivedLargeStuff/Documents/S5_Projects/DBMS_CC_retry/frontend/src/pages/ProfilePage.tsx):
- Displays `Following ({following.length})` based on array length.
- Does not show **Followers count** at all.

---

## Instructions for SLM / Coding Agent

### Goal:
Use Prisma's `_count` aggregation to query both `followers` and `following` at the SQL level, and display both statistics on the Profile page.

### Step 1: Update Backend [backend/src/routes/auth.ts](file:///d:/ArchivedLargeStuff/Documents/S5_Projects/DBMS_CC_retry/backend/src/routes/auth.ts)
1. In `router.get('/me', ...)`, add relational count aggregation to `findUnique`:
   ```typescript
   const user = await prisma.user.findUnique({
     where: { user_id: req.user!.userId },
     include: {
       artist: { include: { production_house: true } },
       _count: {
         select: {
           followers: true,
           following: true,
           playlists: true,
         },
       },
     },
   });
   ```
2. Include `_count` in the response payload:
   ```typescript
   res.json({
     user_id: user.user_id,
     username: user.username,
     is_artist: user.is_artist,
     created_at: user.created_at,
     last_login: user.last_login,
     artist: user.artist,
     _count: user._count,
   });
   ```

### Step 2: Update Frontend [frontend/src/pages/ProfilePage.tsx](file:///d:/ArchivedLargeStuff/Documents/S5_Projects/DBMS_CC_retry/frontend/src/pages/ProfilePage.tsx)
1. Update `UserStats` TypeScript interface:
   ```typescript
   interface UserStats {
     user_id: number;
     username: string;
     is_artist: boolean;
     created_at: string;
     last_login: string | null;
     artist?: {
       name: string;
       country: string | null;
       is_band: boolean;
       production_house?: { name: string; type: string } | null;
     } | null;
     _count?: {
       followers: number;
       following: number;
       playlists: number;
     };
   }
   ```
2. Add a followers metric badge/card in the profile header:
   ```tsx
   <div className="flex items-center gap-4 mt-3 text-sm">
     <div className="flex items-center gap-1 font-medium">
       <span className="text-foreground font-bold">{stats._count?.followers ?? 0}</span>
       <span className="text-muted-foreground">Followers</span>
     </div>
     <div className="flex items-center gap-1 font-medium">
       <span className="text-foreground font-bold">{stats._count?.following ?? following.length}</span>
       <span className="text-muted-foreground">Following</span>
     </div>
     <div className="flex items-center gap-1 font-medium">
       <span className="text-foreground font-bold">{stats._count?.playlists ?? 0}</span>
       <span className="text-muted-foreground">Playlists</span>
     </div>
   </div>
   ```

### Verification Criteria:
1. Verify with another user following the current user.
2. Check `GET /api/auth/me` returns `_count: { followers: X, following: Y, playlists: Z }`.
3. Open `http://localhost:5173/profile` in the browser and confirm both **Followers** and **Following** are accurately calculated and displayed.
4. Run `npm run build` in both backend and frontend to ensure no type errors.
