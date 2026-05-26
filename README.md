# Spotify Data Analyzer — MongoDB Sharded Cluster

A fully dockerized, production-grade MongoDB 8.0 sharded cluster for analyzing Spotify music data. The project loads four interconnected datasets (tracks, artists, playlists, genres) and explores them through 30 analytical aggregation queries organized into five categories.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Collections & Data Model](#collections--data-model)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Users & Authentication](#users--authentication)
- [Queries Overview](#queries-overview)
- [Data Import](#data-import)

---

## Overview

The application loads four CSV datasets sourced from Spotify into a sharded MongoDB database called `spotify`. It demonstrates:

- Horizontal scaling via **hashed sharding** across 3 shards
- **Replica sets** on every shard and the config server layer
- **JSON Schema validation** on all collections
- Advanced **aggregation pipelines** covering aggregation, `$lookup` joins, nested documents, index-accelerated queries, and shard/replication introspection

---

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                   mongos (port 27017)                │  ← single query router
└───────────────────────┬──────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
  ┌───────────┐   ┌───────────┐   ┌───────────┐
  │  Shard 1  │   │  Shard 2  │   │  Shard 3  │
  │ (1P + 2S) │   │ (1P + 2S) │   │ (1P + 2S) │
  └───────────┘   └───────────┘   └───────────┘
        ▲               ▲               ▲
        └───────────────┼───────────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
  ┌──────────┐   ┌──────────┐   ┌──────────┐
  │configsvr1│   │configsvr2│   │configsvr3│
  └──────────┘   └──────────┘   └──────────┘
         Config Replica Set (3 nodes)
```

| Layer | Containers | Replica Set |
|---|---|---|
| Config servers | `configsvr1`, `configsvr2`, `configsvr3` | `configReplSet` |
| Shard 1 | `shard1-primary`, `shard1-secondary1`, `shard1-secondary2` | `shard1ReplSet` |
| Shard 2 | `shard2-primary`, `shard2-secondary1`, `shard2-secondary2` | `shard2ReplSet` |
| Shard 3 | `shard3-primary`, `shard3-secondary1`, `shard3-secondary2` | `shard3ReplSet` |
| Router | `mongos` | — |
| Web UI | `compass` (port 8080) | — |

**Total: 13 containers.** All inter-node communication is secured with a shared keyfile generated on first boot via OpenSSL.

---

## Collections & Data Model

All collections live in the `spotify` database and are sharded using **hashed shard keys** for even data distribution.

### `tracks`
Shard key: `{ id: "hashed" }`

| Field | Type | Description |
|---|---|---|
| `id` | string | Spotify track ID |
| `name` | string | Track title |
| `artists` | string | Artist name(s) as text |
| `id_artists` | string[] | Array of Spotify artist IDs |
| `release_date` | string | Release date (YYYY or YYYY-MM-DD) |
| `popularity` | int [0–100] | Spotify popularity score |
| `duration_ms` | int | Duration in milliseconds |
| `explicit` | int (0/1) | Explicit content flag |
| `danceability` | double [0–1] | How suitable for dancing |
| `energy` | double [0–1] | Perceptual intensity |
| `valence` | double [0–1] | Musical positiveness |
| `tempo` | double | Estimated BPM |
| `speechiness` | double [0–1] | Presence of spoken words |
| `acousticness` | double [0–1] | Acoustic confidence |
| `instrumentalness` | double [0–1] | Instrumental prediction |
| `liveness` | double [0–1] | Audience presence detection |
| `loudness` | double | Overall loudness in dB |
| `key` | int [-1–11] | Musical key |
| `mode` | int (0/1) | Major (1) or minor (0) |
| `time_signature` | int [0–7] | Estimated time signature |

### `artists`
Shard key: `{ id: "hashed" }`

| Field | Type | Description |
|---|---|---|
| `id` | string | Spotify artist ID |
| `name` | string | Artist name |
| `popularity` | int [0–100] | Spotify popularity score |
| `followers` | double | Number of followers |
| `genres` | string[] | List of associated genres |

### `playlists`
Shard key: `{ playlist_id: "hashed" }`

Each document represents one track within a playlist, denormalized for query efficiency.

| Field | Type | Description |
|---|---|---|
| `playlist_id` | string | Playlist identifier |
| `playlist_name` | string | Playlist name |
| `playlist_genre` | string | Top-level genre label |
| `playlist_subgenre` | string | Sub-genre label |
| `track_id` | string | Spotify track ID |
| `track_name` | string | Track title |
| `track_artist` | string | Primary artist name |
| `track_popularity` | int [0–100] | Track popularity score |
| `track_album_id` | string | Album ID |
| `track_album_name` | string | Album name |
| `track_album_release_date` | string | Album release date |
| `danceability` … `valence` | double | Spotify audio features |

### `genres`
Shard key: `{ track_id: "hashed" }`

Links tracks to genre labels independently of playlist context.

| Field | Type | Description |
|---|---|---|
| `track_id` | string | Spotify track ID |
| `track_genre` | string | Genre label |
| `track_name` | string | Track title |
| `artists` | string | Artist name(s) |
| `album_name` | string | Album name |
| `popularity` | int [0–100] | Popularity score |
| `explicit` | bool | Explicit content flag |
| `danceability` … `tempo` | double | Spotify audio features |

---

## Project Structure

```
mongo_semestral/
├── Data/
│   ├── tracks.csv              # Raw Spotify tracks dataset
│   ├── artists.csv             # Raw Spotify artists dataset
│   ├── playlists.csv           # Raw Spotify playlists dataset
│   ├── genres.csv              # Raw Spotify genres dataset
│   ├── import-tracks.py        # Data import script for tracks
│   ├── import-artists.py       # Data import script for artists
│   ├── import-playlists.py     # Data import script for playlists
│   ├── import-genres.py        # Data import script for genres
│   └── analysis.ipynb          # Jupyter notebook for exploratory analysis
├── Dotazy/
│   └── dotazy.md               # All 30 analytical queries (MongoDB shell)
└── FunkcniReseni/
    ├── Dockerfile              # Init container image (mongosh + Python + pymongo)
    ├── docker-compose.yml      # Full cluster definition (13 containers)
    └── init/
        ├── generate-keyfile.sh     # Keyfile generation helper
        ├── init-configsvr.sh       # Config replica set initialization
        ├── init-shard1.sh          # Shard 1 replica set initialization
        ├── init-shard2.sh          # Shard 2 replica set initialization
        ├── init-shard3.sh          # Shard 3 replica set initialization
        ├── init-mongos.sh          # Adds shards + enables sharding on collections
        ├── create-users.sh         # Creates admin and read-only users
        ├── validation-schema.js    # JSON Schema validators for all collections
        └── import-data.sh          # Runs all four Python import scripts
```

---

## Getting Started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) with Docker Compose
- ~4 GB of free RAM (13 MongoDB containers)
- ~2 GB of free disk space for data volumes

### Start the cluster

```bash
cd FunkcniReseni
docker compose up -d
```

Docker Compose will automatically:

1. Generate a shared keyfile for inter-node authentication
2. Start and health-check all config servers and shard nodes
3. Initialize each replica set
4. Start the `mongos` router
5. Create users, apply validation schemas, and shard all collections
6. Import all CSV data into the `spotify` database
7. Start the Compass web UI

The full initialization takes **2–5 minutes** on first boot. Watch progress with:

```bash
docker compose logs -f mongo-init
```

### Access the cluster

| Interface | Address | Credentials |
|---|---|---|
| MongoDB shell | `localhost:27017` | `admin` / `adminPassword123` |
| Compass Web UI | `http://localhost:8080` | auto-connected |

```bash
mongosh "mongodb://admin:adminPassword123@localhost:27017/admin"
```

### Stop and clean up

```bash
# Stop but keep data volumes
docker compose down

# Full teardown including all data
docker compose down -v
```

---

## Users & Authentication

Two users are created automatically during initialization:

| User | Password | Role | Scope |
|---|---|---|---|
| `admin` | `adminPassword123` | `root` | `admin` db |
| `readUser` | `readPassword123` | `read` | `spotify` db |

All nodes use keyfile authentication — direct connections to individual shard or config nodes require the keyfile to be present.

---

## Queries Overview

All 30 queries are in [Dotazy/dotazy.md](Dotazy/dotazy.md). They are organized into five categories:

### Category 1 — Aggregation Functions (Queries 1–6)

Complex `$group`, `$bucket`, `$facet`, and `$stdDevPop` pipelines.

| # | Description |
|---|---|
| 1 | Average track popularity by decade |
| 2 | Track segmentation by energy level (`$switch` + `$bucket`) |
| 3 | Top 10 most danceable playlist genres |
| 4 | Top 10 genres by popularity (min. 50 artists) |
| 5 | Mood analysis by playlist genre (`$facet` — best/worst) |
| 6 | Explicit vs. clean tracks — popularity with standard deviation |

### Category 2 — Nested Documents & Arrays (Queries 7–12)

Working with array fields, `$lookup` for profile enrichment, and computed scores.

| # | Description |
|---|---|
| 7 | Track analysis by number of collaborating artists |
| 8 | Nested profile of the primary artist on the top 10 tracks |
| 9 | Nested career profile of top artists (debut year, track count, peak popularity) |
| 10 | Playlist profiles with their top track embedded |
| 11 | Playlist genre diversity via `$lookup` genres → playlists |
| 12 | Track classification by composite "vibe score" (danceability + valence + energy) |

### Category 3 — Cross-Collection Joins (`$lookup`) (Queries 13–18)

Multi-stage joins between the four collections.

| # | Description |
|---|---|
| 13 | Most popular tracks enriched with artist data (`tracks → artists`) |
| 14 | Pop tracks appearing in the most playlists with audio features (`playlists → tracks`) |
| 15 | Audio feature profile per genre (`genres → tracks`) |
| 16 | Detailed speechiness / liveness / instrumentalness profile per playlist genre |
| 17 | Genre representation across playlists (`genres → playlists`) |
| 18 | EDM sub-genres with top genres via correlated sub-pipeline `$lookup` |

### Category 4 — Indexes & Optimization (Queries 19–24)

Index creation followed by queries that benefit from them.

| # | Index | Query |
|---|---|---|
| 19 | `{ release_date: 1, popularity: -1 }` | Top tracks released before 2005 |
| 20 | `{ playlist_genre: 1, track_popularity: -1 }` | Sub-genre analysis for pop/rap/rock |
| 21 | `{ name: "text" }` | Full-text search — tracks containing "love" |
| 22 | `{ popularity: -1, followers: -1 }` | Artist segmentation by popularity tier |
| 23 | `{ track_genre: 1 }` | Jazz/blues/soul genre analysis via `$lookup` |
| 24 | — | Track comparison across popularity buckets (0–24, 25–49, 50–74, 75–100) |

### Category 5 — Distribution, Cluster & Replication (Queries 25–30)

Introspecting the sharded cluster itself via the `config` database.

| # | Description |
|---|---|
| 25 | Targeted query by shard key with `explain("executionStats")` |
| 26 | Chunk distribution of `genres` collection across shards |
| 27 | Document distribution of `artists` via `getShardDistribution()` |
| 28 | Sharding metadata for the `genres` collection |
| 29 | Changelog events for all `spotify.*` collections |
| 30 | Overview of all sharded collections in the `spotify` database |

---

## Data Import

Each CSV is imported by a dedicated Python script using **pymongo** and **pandas**. The import pipeline:

1. Reads the CSV and drops rows missing required keys
2. Parses array columns (e.g. `id_artists`) from their string representation
3. Casts all numeric columns to correct BSON types (`int` / `double`)
4. Deduplicates on the primary key
5. Inserts in batches of 1000 documents; duplicate key errors are counted and skipped

The `mongo-init` container runs all four scripts sequentially after the cluster is fully initialized. Import progress is visible in the container logs:

```bash
docker compose logs -f mongo-init
```
