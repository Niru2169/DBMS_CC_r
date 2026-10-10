# TASK-05: Real Analytics Aggregations for User Dashboard

## Context & Problem Description
In [DashboardPage.tsx](file:///d:/ArchivedLargeStuff/Documents/S5_Projects/DBMS_CC_retry/frontend/src/pages/DashboardPage.tsx), the dashboard displays metrics:
- Playlists count: `totalPlaylists` (calculated by fetching the whole `/playlists` array into the browser and checking `.length`)
- Following count: `following.length` (calculated by fetching `/users/me/following` into the browser and checking `.length`)
- Account Type: Static `'Artist' : 'Listener'` based on user role flag.

### The Problem:
1. **Inefficient client-side counting**: To know a user has 100 playlists or follows 200 users, the client currently requests hundreds of full JSON objects over HTTP just to call `.length`.
2. **Missing key DBMS metric calculations**:
   - Total Listening Time (sum of all `listening_time` in `Listening_Activity` for the user)
   - Total Songs Listened to (count of records in `Listening_Activity`)
   - Most Listened Artist / Top Genre

All these metrics already have corresponding relational tables (`Listening_Activity`, `Song`, `Artist`), but currently there is no backend analytics aggregate endpoint, leaving the dashboard with only basic list-length metrics.

### File Locations:
- Frontend dashboard: [DashboardPage.tsx](file:///d:/ArchivedLargeStuff/Documents/S5_Projects/DBMS_CC_retry/frontend/src/pages/DashboardPage.tsx)
- Backend user routes: [users.ts](file:///d:/ArchivedLargeStuff/Documents/S5_Projects/DBMS_CC_retry/backend/src/routes/users.ts)
- Backend auth routes: [auth.ts](file:///d:/ArchivedLargeStuff/Documents/S5_Projects/DBMS_CC_retry/backend/src/routes/auth.ts)
- Schema: [schema.prisma](file:///d:/ArchivedLargeStuff/Documents/S5_Projects/DBMS_CC_retry/backend/prisma/schema.prisma) (`Listening_Activity`, `User`, `Playlist`)

---

## Instructions for SLM / Coding Agent

### Goal:
Create a dedicated backend analytics endpoint `GET /api/users/me/stats` that uses Prisma aggregate functions (`_sum`, `_count`) to calculate real metrics, and display them on the Dashboard.

### Step 1: Add Analytics Route in [backend/src/routes/users.ts](file:///d:/ArchivedLargeStuff/Documents/S5_Projects/DBMS_CC_retry/backend/src/routes/users.ts)
Add `GET /me/stats` (before `/:id`):
```typescript
// GET /api/users/me/stats — user summary analytics
router.get('/me/stats', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;

    const [userCounts, listeningAggregates] = await Promise.all([
      prisma.user.findUnique({
        where: { user_id: userId },
        select: {
          _count: {
            select: {
              playlists: true,
              following: true,
              followers: true,
              listening_activity: true,
            },
          },
        },
      }),
      prisma.listening_Activity.aggregate({
        where: { user_id: userId },
        _sum: { listening_time: true },
        _count: { activity_id: true },
      }),
    ]);

    const totalListeningSeconds = listeningAggregates._sum.listening_time || 0;

    res.json({
      playlistCount: userCounts?._count.playlists || 0,
      followingCount: userCounts?._count.following || 0,
      followersCount: userCounts?._count.followers || 0,
      totalListens: listeningAggregates._count.activity_id || 0,
      totalListeningMinutes: Math.round(totalListeningSeconds / 60),
    });
  } catch (err) {
    next(err);
  }
});
```

### Step 2: Update [frontend/src/pages/DashboardPage.tsx](file:///d:/ArchivedLargeStuff/Documents/S5_Projects/DBMS_CC_retry/frontend/src/pages/DashboardPage.tsx)
1. Fetch `/users/me/stats` alongside recent playlists:
   ```typescript
   interface UserSummaryStats {
     playlistCount: number;
     followingCount: number;
     followersCount: number;
     totalListens: number;
     totalListeningMinutes: number;
   }
   
   const [stats, setStats] = useState<UserSummaryStats | null>(null);
   
   useEffect(() => {
     Promise.all([
       api.get('/users/me/stats'),
       api.get('/playlists'),
       api.get('/users/me/following'),
     ]).then(([sRes, pRes, fRes]) => {
       setStats(sRes.data);
       setPlaylists(pRes.data.slice(0, 3));
       setFollowing(fRes.data.slice(0, 5));
     }).finally(() => setLoading(false));
   }, []);
   ```
2. Render stats cards using the aggregated database metrics:
   - Playlists: `stats?.playlistCount ?? 0`
   - Following: `stats?.followingCount ?? 0`
   - Total Listening Time: `${stats?.totalListeningMinutes ?? 0} mins`
   - Songs Listened: `stats?.totalListens ?? 0`

### Verification Criteria:
1. Listen to a song on the Songs page.
2. Navigate to Dashboard.
3. Confirm that `Total Listens` increases by 1 and `Total Listening Time` is calculated from the database records rather than hardcoded dummy values.
4. Check that no network requests need to download full collections solely for calculating `.length`.
