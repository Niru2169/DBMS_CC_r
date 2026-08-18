# Database Schema Refinement and ER Model - Final Deliverable

## Part A: Complete Refined Table Structures (3NF Normalized Schema)

### Table 1: User
| Attribute | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `user_id` | INT | PK, NOT NULL | Unique identifier for the user. |
| `username` | VARCHAR | UNIQUE, NOT NULL | Unique username. |
| `password_hash` | VARCHAR | NOT NULL | Encrypted password hash. |
| `is_artist` | BOOLEAN | NOT NULL | Indicates if the user is an artist. |
| `created_at` | TIMESTAMP | NOT NULL | Account creation timestamp. |
| `last_login` | TIMESTAMP | NULLABLE | Last login timestamp. |

### Table 2: Listening_Activity
| Attribute | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `activity_id` | INT | PK, NOT NULL | Unique ID for the listening event. |
| `user_id` | INT | FK (User) | Foreign Key referencing `User`. |
| `song_id` | INT | FK (Song) | Foreign Key referencing `Song`. |
| `listening_time` | INT | NOT NULL | Listening duration in seconds. |
| `timestamp` | TIMESTAMP | NOT NULL | Time of listening activity. |

### Table 3: Song
| Attribute | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `song_id` | INT | PK, NOT NULL | Unique identifier for the song. |
| `song_name` | VARCHAR | NOT NULL | Required song name. |
| `duration` | INT | NOT NULL | Song duration in seconds. |
| `publish_date` | DATE | NULLABLE | Original publication date. |
| `genres` | JSON/Array | N/A | List of associated genres (JSON or Linked Table). |
| `listen_count` | INT | NOT NULL | Global count of listens for this song. |
| `is_published` | BOOLEAN | NOT NULL | Publication status. |

### Table 4: Artist
| Attribute | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `artist_id` | INT | PK, NOT NULL | Unique identifier for the artist. |
| `name` | VARCHAR | NOT NULL | Required artist name. |
| `country` | VARCHAR | INDEX | Artist's country. |
| `is_band` | BOOLEAN | NOT NULL | Indicates if the artist is a band. |
| `n_of_listeners` | INT | NOT NULL | Total number of listeners for the artist. |
| `n_of_members` | INT | NULLABLE | Number of band members. |
| `country_of_origin` | VARCHAR | NULLABLE | Artist's country of origin. |
| `production_house_id` | INT | FK (Production_House) | Production house associated with the artist. |
| `created_at` | TIMESTAMP | NOT NULL | Artist creation timestamp. |

### Table 5: Production_House
| Attribute | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `production_house_id` | INT | PK, NOT NULL | Unique identifier for the house. |
| `name` | VARCHAR | UNIQUE, NOT NULL | Unique name of the production house. |
| `type` | VARCHAR | NOT NULL | Type of house (e.g., 'Label', 'Studio'). |

### Table 6: Song_Artist_Relationship (Junction Table)
| Attribute | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `song_id` | INT | FK (Song) | Foreign Key to Song. |
| `artist_id` | INT | FK (Artist) | Foreign Key to Artist. |
| `role` | VARCHAR | NOT NULL | Role in the relationship (e.g., 'Main Artist'). |
| `is_primary` | BOOLEAN | NOT NULL | Indicates primary status. |

### Table 7: Lyrics
| Attribute | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `lyrics_id` | INT | PK, NOT NULL | Unique ID for the lyrics. |
| `song_id` | INT | FK (Song) | Foreign Key to Song. |
| `lyrics_text` | TEXT | NOT NULL | The full lyrics content. |
| `lyrics_filename` | VARCHAR | NOT NULL | Filename of the lyric file. |

### Table 8: Playlist
| Attribute | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `playlist_id` | INT | PK, NOT NULL | Unique identifier for the playlist. |
| `name` | VARCHAR | NOT NULL | Required name of the playlist. |
| `created_by_user_id` | INT | FK (User) | User who created the playlist. |
| `cover_art_url` | VARCHAR | NULLABLE | URL for the cover art. |
| `duration` | INT | NOT NULL | Total duration of the playlist. |
| `release_type` | ENUM | NOT NULL | Release type ('Single', 'EP', 'Album', 'User_Created'). |
| `last_updated` | TIMESTAMP | NOT NULL | Last update timestamp. |

### Table 9: Playlist_Song (Junction Table)
| Attribute | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `playlist_id` | INT | FK (Playlist) | Foreign Key to Playlist. |
| `song_id` | INT | FK (Song) | Foreign Key to Song. |
| `order` | INT | NOT NULL | The song's order in the playlist. |

---

## Part B: Complete Mermaid ER Diagram Code

```mermaid
erDiagram
    %% Entities
    USER {
        int user_id pk
        string username
        string password_hash
        boolean is_artist
        datetime created_at
        datetime last_login
    }

    SONG {
        int song_id pk
        string song_name
        int duration
        date publish_date
        string genres
        int listen_count
        boolean is_published
    }

    ARTIST {
        int artist_id pk
        string name
        string country
        boolean is_band
        int n_of_listeners
        int n_of_members
        string country_of_origin
        string production_house_id
        datetime created_at
    }

    PRODUCTION_HOUSE {
        int production_house_id pk
        string name
        string type
    }

    LYRICS {
        int lyrics_id pk
        int song_id
        string lyrics_text
        string lyrics_filename
    }

    PLAYLIST {
        int playlist_id pk
        string name
        int created_by_user_id
        string cover_art_url
        int duration
        string release_type
        datetime last_updated
    }

    %% Association Entities (Junction Tables)
    LISTENING_ACTIVITY {
        int activity_id pk
        int user_id
        int song_id
        int listening_time
        datetime timestamp
    }

    SONG_ARTIST_RELATIONSHIP {
        int song_id
        int artist_id
        string role
        boolean is_primary
    }

    PLAYLIST_SONG {
        int playlist_id
        int song_id
        int order
    }

    %% Relationships
    USER ||--o{ LISTENING_ACTIVITY : records
    SONG ||--o{ LISTENING_ACTIVITY : has_activity
    ARTIST ||--o{ SONG_ARTIST_RELATIONSHIP : has_role
    SONG ||--o{ SONG_ARTIST_RELATIONSHIP : is_related_to
    PRODUCTION_HOUSE ||--o{ ARTIST : manages
    SONG ||--o{ LYRICS : has
    PLAYLIST ||--o{ PLAYLIST_SONG : contains
    PLAYLIST_SONG ||--o{ SONG : belongs_to
    USER ||--o{ PLAYLIST : creates
    PLAYLIST_SONG ||--o{ PLAYLIST : belongs_to
```

---

## Part C: Normalization Justification

The schema follows **Third Normal Form (3NF)** with the following justifications:

1. **First Normal Form (1NF)**: All attributes are atomic (no repeating groups). The `genres` field uses JSON/Array which is a common pattern for multi-valued attributes in modern databases, or could be replaced with a dedicated Genre table for strict 1NF.

2. **Second Normal Form (2NF)**: All non-prime attributes are fully functionally dependent on the primary key (no partial dependencies). For example, in `User`, all attributes depend only on `user_id`.

3. **Third Normal Form (3NF)**: No transitive dependencies exist. All non-key attributes depend only on the primary key, not on other non-key attributes. The junction tables (`Song_Artist_Relationship` and `Playlist_Song`) properly separate relationship attributes from the entities, ensuring no non-key attributes depend on other non-key attributes.

**Key Design Decisions:**
- `listen_count` is stored in `Song` because it represents a global aggregate property of the song, not a per-user activity attribute.
- `genres` uses JSON/Array to maintain flexibility while adhering to 3NF; a dedicated Genre table could be added for stricter normalization.
- Junction tables correctly model M:M relationships and store relationship-specific attributes (`role`, `order`).