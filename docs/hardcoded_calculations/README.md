# Hardcoded vs Actual Calculations Audit

This document inventories all places in the **MusicLib** codebase where values, statistics, aggregates, or parameters are hardcoded, artificially populated, or bypassed with static constants instead of performing real database calculations, aggregations, or dynamic logic.

---

## Executive Summary & Inventory

| ID | Module / Feature | Current Implementation (Hardcoded / Mocked) | Expected Implementation (Actual Calculation / Aggregate) | Impact Area |
|---|---|---|---|---|
| **TASK-01** | **Listening Time in Listening Activity** | Frontend hardcodes `{ listening_time: 0 }` in [SongsPage.tsx](file:///d:/ArchivedLargeStuff/Documents/S5_Projects/DBMS_CC_retry/frontend/src/pages/SongsPage.tsx) | Record actual audio playback time (or simulated active duration / song duration) | Frontend + Backend Activity Logging |
| **TASK-02** | **Profile Follower Count & Following Metrics** | [ProfilePage.tsx](file:///d:/ArchivedLargeStuff/Documents/S5_Projects/DBMS_CC_retry/frontend/src/pages/ProfilePage.tsx) only counts client-side `following.length` and shows 0 follower metrics; backend `/auth/me` does not return follower/following counts | Query relational aggregates (`_count: { followers: true, following: true }`) in [backend/src/routes/auth.ts](file:///d:/ArchivedLargeStuff/Documents/S5_Projects/DBMS_CC_retry/backend/src/routes/auth.ts) and render both on Profile | Fullstack Profile & DBMS Relations |
| **TASK-03** | **Artist Total Songs & Song Count** | [ArtistsPage.tsx](file:///d:/ArchivedLargeStuff/Documents/S5_Projects/DBMS_CC_retry/frontend/src/pages/ArtistsPage.tsx) relies on `artist.songs?.length` which is capped by query pagination/take limit (`take: 20` or relation array length) | SQL/Prisma `_count: { songs: true }` aggregation on the Artist model in [backend/src/routes/artists.ts](file:///d:/ArchivedLargeStuff/Documents/S5_Projects/DBMS_CC_retry/backend/src/routes/artists.ts) | Fullstack Artist Metrics & DB Aggregation |
| **TASK-04** | **Playlist Duration Recalculation Resiliency** | [playlists.ts](file:///d:/ArchivedLargeStuff/Documents/S5_Projects/DBMS_CC_retry/backend/src/routes/playlists.ts) re-sums duration in Node.js application memory on add/delete song instead of database aggregation (`prisma.playlist_Song.aggregate` or SQL sum trigger) and does not calculate on song duration edits | Use SQL aggregate sum (`_sum: { duration: true }` via relation) or dedicated calculation endpoint/service to guarantee transactional consistency | Backend DB Aggregations & Consistency |
| **TASK-05** | **Dashboard Top Stats & Recent Data Fetching** | [DashboardPage.tsx](file:///d:/ArchivedLargeStuff/Documents/S5_Projects/DBMS_CC_retry/frontend/src/pages/DashboardPage.tsx) fetches entire arrays to calculate lengths on client; lacks total listening time, total plays, and liked counts | Implement dedicated summary statistics endpoint (`GET /api/users/me/stats`) calculating total listening time from `Listening_Activity` and song counts | Performance & DBMS Analytical Querying |
| **TASK-06** | **Search by Genre in Songs via Serialized String Match** | [backend/src/routes/songs.ts](file:///d:/ArchivedLargeStuff/Documents/S5_Projects/DBMS_CC_retry/backend/src/routes/songs.ts) does string substring matching (`string_contains`) on JSON column rather than structured JSON array querying or relation querying | Use structured JSON path filters or normalized genre querying | DBMS Query Precision & Data Modeling |

---

## Detailed Task Files

Dedicated task specifications with self-contained context, precise file links, step-by-step instructions, and verification criteria for Small Language Models (SLMs) are located in:

- [ ] [TASK-01_listening_time_tracking.md](file:///d:/ArchivedLargeStuff/Documents/S5_Projects/DBMS_CC_retry/docs/hardcoded_calculations/TASK-01_listening_time_tracking.md)
- [ ] [TASK-02_profile_followers_aggregates.md](file:///d:/ArchivedLargeStuff/Documents/S5_Projects/DBMS_CC_retry/docs/hardcoded_calculations/TASK-02_profile_followers_aggregates.md)
- [ ] [TASK-03_artist_song_counts_aggregation.md](file:///d:/ArchivedLargeStuff/Documents/S5_Projects/DBMS_CC_retry/docs/hardcoded_calculations/TASK-03_artist_song_counts_aggregation.md)
- [x] [TASK-04_playlist_duration_aggregation.md](file:///d:/ArchivedLargeStuff/Documents/S5_Projects/DBMS_CC_retry/docs/hardcoded_calculations/TASK-04_playlist_duration_aggregation.md)
- [ ] [TASK-05_dashboard_user_analytics.md](file:///d:/ArchivedLargeStuff/Documents/S5_Projects/DBMS_CC_retry/docs/hardcoded_calculations/TASK-05_dashboard_user_analytics.md)
- [ ] [TASK-06_genre_filtering_and_indexing.md](file:///d:/ArchivedLargeStuff/Documents/S5_Projects/DBMS_CC_retry/docs/hardcoded_calculations/TASK-06_genre_filtering_and_indexing.md)
