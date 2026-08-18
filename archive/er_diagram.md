# Entity-Relationship (ER) Diagrams

This document presents the ER diagrams for the **Music Streaming Platform Database Schema** based on the refined tables in `archive/`.

---

## 1. Chen Notation ER Diagram (Conceptual Model)

*Matches the classical Chen Notation layout: Rectangles for **Entities**, Diamonds for **Relationships**, Ovals/Stadiums for **Attributes** (Primary Keys <u>underlined</u>), and branching for **Composite Attributes**.*

```mermaid
flowchart LR
    classDef entity fill:#ffffff,stroke:#3b429f,stroke-width:2px,color:#1e1e38,font-weight:bold;
    classDef relationship fill:#ffffff,stroke:#3b429f,stroke-width:2px,color:#1e1e38,font-weight:bold;
    classDef attribute fill:#ffffff,stroke:#3b429f,stroke-width:1.5px,color:#2b2b4a;
    classDef pk fill:#f0f2ff,stroke:#3b429f,stroke-width:2px,color:#1a1a36,font-weight:bold;
    classDef comp fill:#ffffff,stroke:#7b82c9,stroke-width:1.5px,color:#2b2b4a;

    %% ================= ENTITIES =================
    E_USER["User"]:::entity
    E_PROD["Production House"]:::entity
    E_ARTIST["Artist"]:::entity
    E_SONG["Song"]:::entity
    E_PLAYLIST["Playlist"]:::entity
    E_LYRICS["Lyrics"]:::entity
    E_ACT["Listening Activity"]:::entity

    %% ================= RELATIONSHIPS =================
    R_CREATES{\creates/}:::relationship
    R_MANAGES{\manages/}:::relationship
    R_PERFORMS{\sit for / performs/}:::relationship
    R_HAS{\has/}:::relationship
    R_CONTAINS{\contains/}:::relationship
    R_RECORDS{\record/}:::relationship

    %% ================= ATTRIBUTES =================
    
    %% User Attributes
    A_U1(["<u>user_id</u>"]):::pk
    A_U2(["username"]):::attribute
    A_U3(["password_hash"]):::attribute
    A_U4(["is_artist"]):::attribute
    A_U5(["created_at"]):::attribute
    A_U6(["last_login"]):::attribute

    E_USER --- A_U1
    E_USER --- A_U2
    E_USER --- A_U3
    E_USER --- A_U4
    E_USER --- A_U5
    E_USER --- A_U6

    %% Production House Attributes
    A_PH1(["<u>production_house_id</u>"]):::pk
    A_PH2(["name"]):::attribute
    A_PH3(["type"]):::attribute

    E_PROD --- A_PH1
    E_PROD --- A_PH2
    E_PROD --- A_PH3

    %% Artist Attributes (with Composite Band Info)
    A_A1(["<u>artist_id</u>"]):::pk
    A_A2(["name"]):::attribute
    A_A3(["country"]):::attribute
    A_A4(["n_of_listeners"]):::attribute
    A_A5(["country_of_origin"]):::attribute
    A_A6(["created_at"]):::attribute
    A_A_BAND(["Band Details"]):::attribute
    A_A_B1(["is_band"]):::comp
    A_A_B2(["n_of_members"]):::comp

    E_ARTIST --- A_A1
    E_ARTIST --- A_A2
    E_ARTIST --- A_A3
    E_ARTIST --- A_A4
    E_ARTIST --- A_A5
    E_ARTIST --- A_A6
    E_ARTIST --- A_A_BAND
    A_A_BAND --- A_A_B1
    A_A_BAND --- A_A_B2

    %% Song Attributes
    A_S1(["<u>song_id</u>"]):::pk
    A_S2(["song_name"]):::attribute
    A_S3(["duration"]):::attribute
    A_S4(["publish_date"]):::attribute
    A_S5(["genres"]):::attribute
    A_S6(["listen_count"]):::attribute
    A_S7(["is_published"]):::attribute

    E_SONG --- A_S1
    E_SONG --- A_S2
    E_SONG --- A_S3
    E_SONG --- A_S4
    E_SONG --- A_S5
    E_SONG --- A_S6
    E_SONG --- A_S7

    %% Playlist Attributes
    A_P1(["<u>playlist_id</u>"]):::pk
    A_P2(["name"]):::attribute
    A_P3(["cover_art_url"]):::attribute
    A_P4(["duration"]):::attribute
    A_P5(["release_type"]):::attribute
    A_P6(["last_updated"]):::attribute

    E_PLAYLIST --- A_P1
    E_PLAYLIST --- A_P2
    E_PLAYLIST --- A_P3
    E_PLAYLIST --- A_P4
    E_PLAYLIST --- A_P5
    E_PLAYLIST --- A_P6

    %% Lyrics Attributes
    A_L1(["<u>lyrics_id</u>"]):::pk
    A_L2(["lyrics_text"]):::attribute
    A_L3(["lyrics_filename"]):::attribute

    E_LYRICS --- A_L1
    E_LYRICS --- A_L2
    E_LYRICS --- A_L3

    %% Listening Activity Attributes
    A_LA1(["<u>activity_id</u>"]):::pk
    A_LA2(["listening_time"]):::attribute
    A_LA3(["timestamp"]):::attribute

    E_ACT --- A_LA1
    E_ACT --- A_LA2
    E_ACT --- A_LA3

    %% Relationship Attributes
    A_R_PERF1(["role"]):::attribute
    A_R_PERF2(["is_primary"]):::attribute
    R_PERFORMS --- A_R_PERF1
    R_PERFORMS --- A_R_PERF2

    A_R_CONT1(["order"]):::attribute
    R_CONTAINS --- A_R_CONT1

    %% ================= ENTITY-RELATIONSHIP CONNECTIONS =================
    
    E_USER -- "1" --- R_CREATES -- "N" --- E_PLAYLIST
    E_PROD -- "1" --- R_MANAGES -- "N" --- E_ARTIST
    E_ARTIST -- "M" --- R_PERFORMS -- "N" --- E_SONG
    E_SONG -- "1" --- R_HAS -- "1" --- E_LYRICS
    E_PLAYLIST -- "M" --- R_CONTAINS -- "N" --- E_SONG
    E_USER -- "1" --- R_RECORDS -- "N" --- E_ACT
    E_ACT -- "N" --- R_RECORDS -- "1" --- E_SONG
```

---

## 2. Relational Crow's Foot ER Diagram (Database Schema View)

```mermaid
erDiagram
    USER {
        int user_id PK
        string username
        string password_hash
        boolean is_artist
        datetime created_at
        datetime last_login
    }

    PRODUCTION_HOUSE {
        int production_house_id PK
        string name
        string type
    }

    ARTIST {
        int artist_id PK
        string name
        string country
        boolean is_band
        int n_of_listeners
        int n_of_members
        string country_of_origin
        int production_house_id FK
        datetime created_at
    }

    SONG {
        int song_id PK
        string song_name
        int duration
        date publish_date
        json genres
        int listen_count
        boolean is_published
    }

    LYRICS {
        int lyrics_id PK
        int song_id FK
        text lyrics_text
        string lyrics_filename
    }

    PLAYLIST {
        int playlist_id PK
        string name
        int created_by_user_id FK
        string cover_art_url
        int duration
        string release_type
        datetime last_updated
    }

    LISTENING_ACTIVITY {
        int activity_id PK
        int user_id FK
        int song_id FK
        int listening_time
        datetime timestamp
    }

    SONG_ARTIST_RELATIONSHIP {
        int song_id FK
        int artist_id FK
        string role
        boolean is_primary
    }

    PLAYLIST_SONG {
        int playlist_id FK
        int song_id FK
        int order
    }

    USER ||--o{ PLAYLIST : "creates (1:N)"
    PRODUCTION_HOUSE ||--o{ ARTIST : "manages (1:N)"
    ARTIST ||--o{ SONG_ARTIST_RELATIONSHIP : "performs (M:N)"
    SONG ||--o{ SONG_ARTIST_RELATIONSHIP : "has_artist (M:N)"
    SONG ||--o{ LYRICS : "has (1:1)"
    PLAYLIST ||--o{ PLAYLIST_SONG : "contains (M:N)"
    SONG ||--o{ PLAYLIST_SONG : "belongs_to (M:N)"
    USER ||--o{ LISTENING_ACTIVITY : "records (1:N)"
    SONG ||--o{ LISTENING_ACTIVITY : "logged_in (1:N)"
```
