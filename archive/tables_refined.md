**User**
*   **user_id** (Primary Key)
*   username (Unique, Indexed)
*   password_hash (String, Encrypted)
*   is_artist (Boolean)
*   created_at (Timestamp)
*   last_login (Timestamp)

**Listening_Activity**
*   **activity_id** (Primary Key)
*   user_id (Foreign Key -> User)
*   song_id (Foreign Key -> Song)
*   listening_time (Integer, Seconds)
*   timestamp (Timestamp)

**Song**
*   **song_id** (Primary Key)
*   song_name (String, Required)
*   duration (Integer, Seconds)
*   publish_date (Date)
*   genres (Array/JSON or Linked Table for multi-select)
*   listen_count (Integer, Global Counter)
*   is_published (Boolean)

**Artist**
*   **artist_id** (Primary Key)
*   name (String, Required)
*   country (String, Indexed)
*   is_band (Boolean)
*   band_member_ids (JSON/Array, Nullable)
*   country_of_origin (String, Nullable)
*   production_house_id (Foreign Key -> Production_House)
*   created_at (Timestamp)

**Production_House**
*   **production_house_id** (Primary Key)
*   name (String, Unique)
*   type (String, e.g., 'Label', 'Studio', 'Independent')

**Song_Artist_Relationship**
*   **song_id** (Foreign Key -> Song)
*   **artist_id** (Foreign Key -> Artist)
*   role (String, e.g., 'Main Artist', 'Featured Artist', 'Producer')
*   is_primary (Boolean)

**Lyrics**
*   **lyrics_id** (Primary Key)
*   song_id (Foreign Key -> Song)
*   lyrics_text (Text)
*   lyrics_filename (String)

**Playlist**
*   **playlist_id** (Primary Key)
*   name (String, Required)
*   created_by_user_id (Foreign Key -> User)
*   cover_art_url (String)
*   duration (Integer, Total Seconds)
*   release_type (Enum: 'Single', 'EP', 'Album', 'User_Created')
*   last_updated (Timestamp)

**Playlist_Song** (Junction Table)
*   **playlist_id** (Foreign Key -> Playlist)
*   **song_id** (Foreign Key -> Song)
*   order (Integer)

**Refined Table Relationships:**
1.  **User** 1:M **Listening_Activity**
2.  **Song** M:M **Song_Artist_Relationship**
3.  **Artist** M:M **Song_Artist_Relationship**
4.  **Production_House** 1:M **Artist** (One label/house manages many artists)
5.  **Song** 1:M **Lyrics**
6.  **Playlist** M:M **Playlist_Song**
7.  **Playlist** M:M **Song_Song** (via Playlist_Song)
8.  **User** M:M **Playlist** (User creates many playlists)