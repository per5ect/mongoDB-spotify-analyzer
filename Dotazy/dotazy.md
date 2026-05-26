mongosh "mongodb://admin:adminPassword123@localhost:27017/admin"

## Kategorie 1 — Agregační funkce

### Dotaz 1 — Průměrná popularita skladeb podle desetiletí

```js
db.tracks.aggregate([
  {
    $match: {
      popularity: { $gt: 0 },
      release_date: { $regex: /^\d{4}/ },
    },
  },
  {
    $addFields: {
      decade: {
        $concat: [{ $substr: ["$release_date", 0, 3] }, "0s"],
      },
    },
  },
  {
    $group: {
      _id: "$decade",
      avgPopularity: { $avg: "$popularity" },
      totalTracks: { $sum: 1 },
      maxPopularity: { $max: "$popularity" },
    },
  },
  { $sort: { _id: 1 } },
]);
```

### Dotaz 2 — Segmentace skladeb podle úrovně energie ($bucket) //////////

```js
db.tracks.aggregate([
  { $match: { energy: { $exists: true, $ne: null } } },
  {
    $addFields: {
      energyRange: {
        $switch: {
          branches: [
            { case: { $lt: ["$energy", 0.2] }, then: "0-20% (velmi klidná)" },
            { case: { $lt: ["$energy", 0.4] }, then: "20-40% (klidná)" },
            { case: { $lt: ["$energy", 0.6] }, then: "40-60% (střední)" },
            { case: { $lt: ["$energy", 0.8] }, then: "60-80% (energická)" },
            {
              case: { $lte: ["$energy", 1.0] },
              then: "80-100% (velmi energická)",
            },
          ],
          default: "mimo rozsah",
        },
      },
    },
  },
  {
    $group: {
      _id: "$energyRange",
      count: { $sum: 1 },
      avgPopularity: { $avg: "$popularity" },
      avgTempo: { $avg: "$tempo" },
    },
  },
  {
    $project: {
      _id: 0,
      energyRange: "$_id",
      count: 1,
      avgPopularity: { $round: ["$avgPopularity", 1] },
      avgTempo: { $round: ["$avgTempo", 1] },
    },
  },
  { $sort: { energyRange: 1 } },
]);
```

### Dotaz 3 — Top 10 nejtančnějších žánrů playlistů

```js
db.playlists.aggregate([
  {
    $match: {
      danceability: { $exists: true },
      playlist_genre: { $exists: true },
    },
  },
  {
    $group: {
      _id: "$playlist_genre",
      avgDanceability: { $avg: "$danceability" },
      avgEnergy: { $avg: "$energy" },
      avgValence: { $avg: "$valence" },
      trackCount: { $sum: 1 },
    },
  },
  {
    $addFields: {
      danceScore: {
        $round: [{ $multiply: ["$avgDanceability", 100] }, 1],
      },
    },
  },
  { $sort: { danceScore: -1 } },
  { $limit: 10 },
]);
```

### Dotaz 4 — Top 10 žánrů podle popularity při dostatečném počtu umělců

```js
db.artists.aggregate([
  {
    $match: {
      popularity: { $gt: 0 },
      genres: { $ne: [] },
    },
  },
  { $unwind: "$genres" },
  {
    $group: {
      _id: "$genres",
      avgPopularity: { $avg: "$popularity" },
      avgFollowers: { $avg: "$followers" },
      artistCount: { $sum: 1 },
    },
  },
  { $match: { artistCount: { $gte: 50 } } },
  {
    $addFields: {
      popularityScore: { $round: ["$avgPopularity", 1] },
    },
  },
  { $sort: { popularityScore: -1, artistCount: -1 } },
  { $limit: 10 },
]);
```

### Dotaz 5 — Analýza nálady žánrů playlistů (valence) ////////////////////////

```js
db.playlists.aggregate([
  {
    $match: {
      playlist_genre: { $exists: true, $ne: null },
      track_popularity: { $exists: true, $ne: null },
      valence: { $exists: true, $ne: null },
      energy: { $exists: true, $ne: null },
      danceability: { $exists: true, $ne: null },
      tempo: { $exists: true, $ne: null },
      acousticness: { $exists: true, $ne: null },
    },
  },
  {
    $group: {
      _id: "$playlist_genre",
      trackCount: { $sum: 1 },
      avgPopularity: { $avg: "$track_popularity" },
      avgValence: { $avg: "$valence" },
      avgEnergy: { $avg: "$energy" },
      avgDanceability: { $avg: "$danceability" },
      avgTempo: { $avg: "$tempo" },
      avgAcousticness: { $avg: "$acousticness" },
    },
  },
  {
    $match: {
      trackCount: { $gte: 5000 },
    },
  },
  {
    $project: {
      _id: 0,
      genre: "$_id",
      trackCount: 1,
      avgPopularity: { $round: ["$avgPopularity", 1] },
      avgValence: { $round: ["$avgValence", 2] },
      avgEnergy: { $round: ["$avgEnergy", 2] },
      avgDanceability: { $round: ["$avgDanceability", 2] },
      avgTempo: { $round: ["$avgTempo", 1] },
      avgAcousticness: { $round: ["$avgAcousticness", 2] },
    },
  },
  {
    $facet: {
      bestGenres: [
        { $sort: { avgPopularity: -1, trackCount: -1 } },
        { $limit: 3 },
      ],
      worstGenres: [
        { $sort: { avgPopularity: 1, trackCount: -1 } },
        { $limit: 3 },
      ],
    },
  },
]);
```

### Dotaz 6 — Porovnání explicit vs clean skladeb se statistickým rozptylem

```js
db.tracks.aggregate([
  {
    $match: {
      popularity: { $gt: 50 },
      explicit: { $in: [0, 1] },
    },
  },
  {
    $group: {
      _id: "$explicit",
      avgPopularity: { $avg: "$popularity" },
      stdDevPopularity: { $stdDevPop: "$popularity" },
      avgDanceability: { $avg: "$danceability" },
      avgEnergy: { $avg: "$energy" },
      trackCount: { $sum: 1 },
      maxPopularity: { $max: "$popularity" },
    },
  },
  {
    $addFields: {
      explicitLabel: {
        $cond: [{ $eq: ["$_id", 1] }, "Explicit", "Clean"],
      },
    },
  },
  { $sort: { avgPopularity: -1 } },
]);
```

## Kategorie 2 — Vnořené dokumenty a pole

### Dotaz 7 — Analýza skladeb podle počtu spoluautorů

```js
db.tracks.aggregate([
  { $match: { id_artists: { $exists: true } } },
  {
    $addFields: {
      collaboratorCount: { $size: "$id_artists" },
    },
  },
  { $match: { collaboratorCount: { $gt: 1 } } },
  {
    $group: {
      _id: "$collaboratorCount",
      trackCount: { $sum: 1 },
      avgPopularity: { $avg: "$popularity" },
      exampleTracks: { $push: "$name" },
    },
  },
  {
    $addFields: {
      examples: { $slice: ["$exampleTracks", 3] },
    },
  },
  { $sort: { _id: -1 } },
  { $limit: 10 },
  { $project: { exampleTracks: 0 } },
]);
```

### Dotaz 8 — Vnořený profil prvního umělce u nejpopulárnějších skladeb

```js
db.tracks.aggregate([
  {
    $match: {
      popularity: { $gt: 0 },
      id_artists: { $type: "array", $ne: [] },
    },
  },
  { $sort: { popularity: -1 } },
  { $limit: 10 },
  {
    $addFields: {
      mainArtistId: { $arrayElemAt: ["$id_artists", 0] },
    },
  },
  {
    $lookup: {
      from: "artists",
      localField: "mainArtistId",
      foreignField: "id",
      as: "artistInfo",
    },
  },
  { $unwind: "$artistInfo" },
  {
    $project: {
      _id: 0,
      track: {
        id: "$id",
        name: "$name",
        popularity: "$popularity",
        releaseDate: "$release_date",
      },
      artistProfile: {
        id: "$artistInfo.id",
        name: "$artistInfo.name",
        popularity: "$artistInfo.popularity",
        followers: "$artistInfo.followers",
        genres: "$artistInfo.genres",
      },
    },
  },
]);
```

### Dotaz 9 — Vnořený kariérní profil umělce podle jeho skladeb

```js
db.artists.aggregate([
  {
    $match: {
      popularity: { $gt: 0 },
      followers: { $gt: 0 },
    },
  },
  { $sort: { followers: -1 } },
  { $limit: 10 },
  {
    $lookup: {
      from: "tracks",
      let: { artistId: "$id" },
      pipeline: [
        { $match: { $expr: { $in: ["$$artistId", "$id_artists"] } } },
        {
          $group: {
            _id: null,
            trackCount: { $sum: 1 },
            avgTrackPopularity: { $avg: "$popularity" },
            debutYear: { $min: { $substr: ["$release_date", 0, 4] } },
            latestYear: { $max: { $substr: ["$release_date", 0, 4] } },
            maxTrackPopularity: { $max: "$popularity" },
          },
        },
        {
          $project: {
            _id: 0,
            trackCount: 1,
            avgTrackPopularity: { $round: ["$avgTrackPopularity", 1] },
            debutYear: 1,
            latestYear: 1,
            maxTrackPopularity: 1,
          },
        },
      ],
      as: "careerStats",
    },
  },
  { $unwind: "$careerStats" },
  {
    $project: {
      _id: 0,
      artist: {
        id: "$id",
        name: "$name",
        popularity: "$popularity",
        followers: "$followers",
        genres: "$genres",
      },
      careerStats: 1,
    },
  },
]);
```

### Dotaz 10 — Vnořený profil nejlepších playlistů a jejich top skladeb

```js
db.playlists.aggregate([
  {
    $match: {
      playlist_id: { $exists: true, $ne: null },
      playlist_name: { $exists: true, $ne: null },
      track_popularity: { $exists: true, $ne: null },
      valence: { $exists: true, $ne: null },
      energy: { $exists: true, $ne: null },
      tempo: { $exists: true, $ne: null },
    },
  },
  { $sort: { track_popularity: -1 } },
  {
    $group: {
      _id: "$playlist_id",
      playlistProfile: {
        $first: {
          id: "$playlist_id",
          name: "$playlist_name",
          genre: "$playlist_genre",
          subgenre: "$playlist_subgenre",
        },
      },
      trackCount: { $sum: 1 },
      avgPopularity: { $avg: "$track_popularity" },
      avgValence: { $avg: "$valence" },
      avgEnergy: { $avg: "$energy" },
      avgTempo: { $avg: "$tempo" },
      topTrack: {
        $first: {
          id: "$track_id",
          name: "$track_name",
          artist: "$track_artist",
          popularity: "$track_popularity",
          durationMin: { $round: [{ $divide: ["$duration_ms", 60000] }, 2] },
        },
      },
    },
  },
  {
    $project: {
      _id: 0,
      playlistProfile: 1,
      stats: {
        trackCount: "$trackCount",
        avgPopularity: { $round: ["$avgPopularity", 1] },
        avgValence: { $round: ["$avgValence", 2] },
        avgEnergy: { $round: ["$avgEnergy", 2] },
        avgTempo: { $round: ["$avgTempo", 1] },
      },
      topTrack: 1,
    },
  },
  { $sort: { "stats.avgPopularity": -1, "stats.trackCount": -1 } },
  { $limit: 10 },
]);
```

### Dotaz 11 — Vnořený profil playlistů podle žánrové rozmanitosti

```js
db.playlists.aggregate([
  {
    $match: {
      playlist_id: { $exists: true, $ne: null },
      playlist_name: { $exists: true, $ne: null },
      track_id: { $exists: true, $ne: null },
      track_popularity: { $exists: true, $ne: null },
    },
  },
  {
    $lookup: {
      from: "genres",
      localField: "track_id",
      foreignField: "track_id",
      as: "genreInfo",
    },
  },
  { $unwind: "$genreInfo" },
  {
    $group: {
      _id: "$playlist_id",
      playlistProfile: {
        $first: {
          id: "$playlist_id",
          name: "$playlist_name",
          genre: "$playlist_genre",
          subgenre: "$playlist_subgenre",
        },
      },
      trackCount: { $sum: 1 },
      avgPopularity: { $avg: "$track_popularity" },
      genresSeen: { $addToSet: "$genreInfo.track_genre" },
      topTracks: {
        $push: {
          name: "$track_name",
          artist: "$track_artist",
          genre: "$genreInfo.track_genre",
          popularity: "$track_popularity",
        },
      },
    },
  },
  {
    $project: {
      _id: 0,
      playlistProfile: 1,
      diversityStats: {
        trackCount: "$trackCount",
        genreCount: { $size: "$genresSeen" },
        diversityRatio: {
          $round: [{ $divide: [{ $size: "$genresSeen" }, "$trackCount"] }, 3],
        },
        avgPopularity: { $round: ["$avgPopularity", 1] },
        topGenres: { $slice: ["$genresSeen", 3] },
        topTracks: { $slice: ["$topTracks", 3] },
      },
    },
  },
  {
    $sort: {
      "diversityStats.genreCount": -1,
      "diversityStats.trackCount": -1,
    },
  },
  { $limit: 10 },
]);
```

### Dotaz 12 — Klasifikace skladeb podle vibe score (kombinace danceability + valence + energy)

```js
db.tracks.aggregate([
  {
    $match: {
      popularity: { $gt: 0 },
      danceability: { $exists: true },
      energy: { $exists: true },
      valence: { $exists: true },
    },
  },
  {
    $addFields: {
      vibeScore: {
        $round: [
          {
            $multiply: [
              { $add: ["$danceability", "$valence", "$energy"] },
              33.33,
            ],
          },
          1,
        ],
      },
      durationMin: { $round: [{ $divide: ["$duration_ms", 60000] }, 2] },
    },
  },
  {
    $bucket: {
      groupBy: "$vibeScore",
      boundaries: [0, 25, 50, 75, 100],
      default: "other",
      output: {
        count: { $sum: 1 },
      },
    },
  },
  {
    $addFields: {
      vibeLabel: {
        $switch: {
          branches: [
            { case: { $eq: ["$_id", 0] }, then: "Depresivní" },
            { case: { $eq: ["$_id", 25] }, then: "Průměrná" },
            { case: { $eq: ["$_id", 50] }, then: "Pozitivní" },
            { case: { $eq: ["$_id", 75] }, then: "Euforická" },
          ],
          default: "Mimo rozsah",
        },
      },
      rangeLabel: {
        $switch: {
          branches: [
            { case: { $eq: ["$_id", 0] }, then: "0-25" },
            { case: { $eq: ["$_id", 25] }, then: "25-50" },
            { case: { $eq: ["$_id", 50] }, then: "50-75" },
            { case: { $eq: ["$_id", 75] }, then: "75-100" },
          ],
          default: "other",
        },
      },
    },
  },
  {
    $project: {
      _id: 0,
      vibeStats: {
        source: "tracks",
        metric: "vibeScore",
        description: "Track counts grouped by vibe score range",
        vibeScoreRange: "$_id",
        rangeLabel: 1,
        vibeLabel: 1,
        trackCount: "$count",
      },
    },
  },
]);
```

## Kategorie 3 — Propojování kolekcí ($lookup)

### Dotaz 13 — Nejpopulárnější skladby s daty umělců ($lookup tracks → artists)

```js
db.tracks.aggregate([
  {
    $match: {
      popularity: { $gte: 70 },
      id_artists: { $exists: true },
    },
  },
  { $unwind: "$id_artists" },
  {
    $lookup: {
      from: "artists",
      localField: "id_artists",
      foreignField: "id",
      as: "artistInfo",
    },
  },
  { $unwind: { path: "$artistInfo", preserveNullAndEmptyArrays: false } },
  {
    $group: {
      _id: "$id",
      trackName: { $first: "$name" },
      trackPopularity: { $first: "$popularity" },
      artistNames: { $addToSet: "$artistInfo.name" },
      totalFollowers: { $sum: "$artistInfo.followers" },
      genres: { $addToSet: "$artistInfo.genres" },
    },
  },
  { $sort: { trackPopularity: -1 } },
  { $limit: 5 },
  {
    $project: {
      trackName: 1,
      trackPopularity: 1,
      artistNames: 1,
      totalFollowers: 1,
      _id: 0,
    },
  },
]);
```

### Dotaz 14 — Pop skladby v nejvíce playlistech s audio features z tracks

```js
db.playlists.aggregate([
  {
    $match: {
      playlist_genre: "pop",
      track_popularity: { $gte: 80 },
    },
  },
  {
    $lookup: {
      from: "tracks",
      localField: "track_id",
      foreignField: "id",
      as: "trackInfo",
    },
  },
  { $unwind: { path: "$trackInfo", preserveNullAndEmptyArrays: false } },
  {
    $group: {
      _id: "$track_id",
      trackName: { $first: "$track_name" },
      playlistCount: { $sum: 1 },
      playlists: { $addToSet: "$playlist_name" },
      speechiness: { $first: "$trackInfo.speechiness" },
      acousticness: { $first: "$trackInfo.acousticness" },
      instrumentalness: { $first: "$trackInfo.instrumentalness" },
      popularity: { $first: "$track_popularity" },
    },
  },
  {
    $addFields: {
      playlistNames: { $slice: ["$playlists", 3] },
    },
  },
  { $sort: { playlistCount: -1 } },
  { $limit: 5 },
  {
    $project: {
      trackName: 1,
      popularity: 1,
      playlistCount: 1,
      playlistNames: 1,
      speechiness: 1,
      acousticness: 1,
      instrumentalness: 1,
      _id: 0,
    },
  },
]);
```

### Dotaz 15 — Audio charakteristiky žánrů přes $lookup genres → tracks

```js
db.genres.aggregate([
  { $match: { track_genre: { $exists: true } } },
  {
    $lookup: {
      from: "tracks",
      localField: "track_id",
      foreignField: "id",
      as: "trackData",
    },
  },
  { $unwind: { path: "$trackData", preserveNullAndEmptyArrays: false } },
  {
    $group: {
      _id: "$track_genre",
      avgEnergy: { $avg: "$trackData.energy" },
      avgDanceability: { $avg: "$trackData.danceability" },
      avgValence: { $avg: "$trackData.valence" },
      avgPopularity: { $avg: "$trackData.popularity" },
      trackCount: { $sum: 1 },
    },
  },
  {
    $addFields: {
      overallScore: {
        $round: [
          {
            $multiply: [
              { $add: ["$avgEnergy", "$avgDanceability", "$avgValence"] },
              33.33,
            ],
          },
          1,
        ],
      },
    },
  },
  { $sort: { overallScore: -1 } },
  { $limit: 10 },
]);
```

### Dotaz 16 — Detailní audio profil žánrů z playlistů přes $lookup

```js
db.playlists.aggregate([
  { $match: { track_popularity: { $gte: 80 } } },
  {
    $lookup: {
      from: "tracks",
      localField: "track_id",
      foreignField: "id",
      as: "trackData",
    },
  },
  { $unwind: { path: "$trackData", preserveNullAndEmptyArrays: false } },
  {
    $group: {
      _id: "$playlist_genre",
      avgSpeechiness: { $avg: "$trackData.speechiness" },
      avgLiveness: { $avg: "$trackData.liveness" },
      avgInstrumentalness: { $avg: "$trackData.instrumentalness" },
      trackCount: { $sum: 1 },
    },
  },
  { $sort: { avgSpeechiness: -1 } },
  { $limit: 10 },
]);
```

### Dotaz 17 — Zastoupení žánrů v playlistech ($lookup genres → playlists)

```js
db.genres.aggregate([
  {
    $group: {
      _id: "$track_genre",
      trackIds: { $addToSet: "$track_id" },
    },
  },
  {
    $lookup: {
      from: "playlists",
      localField: "trackIds",
      foreignField: "track_id",
      as: "playlistMatches",
    },
  },
  {
    $addFields: {
      trackCount: { $size: "$trackIds" },
      playlistCount: { $size: "$playlistMatches" },
      avgPlaylistPopularity: { $avg: "$playlistMatches.track_popularity" },
    },
  },
  { $match: { playlistCount: { $gt: 0 } } },
  { $sort: { playlistCount: -1 } },
  { $limit: 10 },
  {
    $project: {
      trackCount: 1,
      playlistCount: 1,
      avgPlaylistPopularity: { $round: ["$avgPlaylistPopularity", 1] },
    },
  },
]);
```

### Dotaz 18 — EDM subžánry s top žánry přes $lookup s vloženým pipeline

```js
db.playlists.aggregate([
  { $match: { playlist_genre: "edm" } },
  {
    $group: {
      _id: "$playlist_subgenre",
      trackIds: { $addToSet: "$track_id" },
      avgPlaylistPopularity: { $avg: "$track_popularity" },
    },
  },
  {
    $lookup: {
      from: "genres",
      let: { ids: "$trackIds" },
      pipeline: [
        { $match: { $expr: { $in: ["$track_id", "$$ids"] } } },
        { $group: { _id: "$track_genre", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 3 },
      ],
      as: "topGenres",
    },
  },
  { $addFields: { trackCount: { $size: "$trackIds" } } },
  { $sort: { avgPlaylistPopularity: -1 } },
  { $limit: 8 },
  {
    $project: {
      trackCount: 1,
      avgPlaylistPopularity: { $round: ["$avgPlaylistPopularity", 1] },
      topGenres: 1,
    },
  },
]);
```

## Kategorie 4 — Indexy a optimalizace

### Dotaz 19 — Top starších skladeb do roku 2005 s indexem

```js
db.tracks.createIndex({ release_date: 1, popularity: -1 });

db.tracks.aggregate([
  {
    $match: {
      popularity: { $gt: 0 },
      release_date: { $regex: /^\d{4}/ },
    },
  },
  {
    $addFields: {
      year: {
        $toInt: { $substr: ["$release_date", 0, 4] },
      },
    },
  },
  { $match: { year: { $lte: 2005 } } },
  { $sort: { popularity: -1 } },
  { $limit: 10 },
  {
    $project: {
      _id: 0,
      trackName: "$name",
      artist: "$artists",
      releaseDate: "$release_date",
      year: 1,
      popularity: 1,
      danceability: { $round: ["$danceability", 2] },
      energy: { $round: ["$energy", 2] },
    },
  },
]);
```

### Dotaz 20 — Compound index na playlists + analýza subžánrů

```js
db.playlists.createIndex({ playlist_genre: 1, track_popularity: -1 });

db.playlists.aggregate([
  {
    $match: {
      playlist_genre: { $in: ["pop", "rap", "rock"] },
      track_popularity: { $gte: 70 },
    },
  },
  {
    $group: {
      _id: { genre: "$playlist_genre", subgenre: "$playlist_subgenre" },
      avgPopularity: { $avg: "$track_popularity" },
      trackCount: { $sum: 1 },
      avgDanceability: { $avg: "$danceability" },
      avgEnergy: { $avg: "$energy" },
      avgValence: { $avg: "$valence" },
    },
  },
  {
    $addFields: {
      vibeScore: {
        $round: [
          {
            $multiply: [
              { $add: ["$avgDanceability", "$avgEnergy", "$avgValence"] },
              33.33,
            ],
          },
          1,
        ],
      },
      popularityTier: {
        $switch: {
          branches: [
            { case: { $gte: ["$avgPopularity", 85] }, then: "Top Hit" },
            { case: { $gte: ["$avgPopularity", 80] }, then: "Hit" },
            { case: { $gte: ["$avgPopularity", 75] }, then: "Popular" },
          ],
          default: "Average",
        },
      },
    },
  },
  { $sort: { vibeScore: -1 } },
  { $limit: 10 },
]);
```

### Dotaz 21 — Textový index na tracks.name + $text vyhledávání

```js
db.tracks.createIndex({ name: "text" });

db.tracks.aggregate([
  { $match: { $text: { $search: "love" } } },
  { $addFields: { score: { $meta: "textScore" } } },
  {
    $group: {
      _id: { $substr: ["$release_date", 0, 4] },
      trackCount: { $sum: 1 },
      avgPopularity: { $avg: "$popularity" },
      avgScore: { $avg: "$score" },
      topTrack: { $max: "$popularity" },
      examples: { $push: "$name" },
    },
  },
  { $addFields: { examples: { $slice: ["$examples", 2] } } },
  { $sort: { avgPopularity: -1 } },
  { $limit: 10 },
]);
```

### Dotaz 22 — Compound index na artists + segmentace umělců

```js
db.artists.createIndex({ popularity: -1, followers: -1 });

db.artists.aggregate([
  {
    $match: {
      popularity: { $gt: 0 },
      followers: { $gt: 0 },
      genres: { $ne: [] },
    },
  },
  {
    $bucket: {
      groupBy: "$popularity",
      boundaries: [0, 25, 50, 75, 100],
      default: "other",
      output: {
        count: { $sum: 1 },
        avgFollowers: { $avg: "$followers" },
        maxFollowers: { $max: "$followers" },
        avgGenreCount: { $avg: { $size: "$genres" } },
        examples: { $push: "$name" },
      },
    },
  },
  {
    $addFields: {
      tier: {
        $switch: {
          branches: [
            { case: { $eq: ["$_id", 0] }, then: "Neznámý" },
            { case: { $eq: ["$_id", 25] }, then: "Rozvíjející se" },
            { case: { $eq: ["$_id", 50] }, then: "Etablovaný" },
            { case: { $eq: ["$_id", 75] }, then: "Hvězda" },
          ],
          default: "other",
        },
      },
      top3: { $slice: ["$examples", 3] },
    },
  },
  { $project: { examples: 0 } },
]);
```

### Dotaz 23 — Index na genres.track_genre + $lookup analýza klasických žánrů

```js
db.genres.createIndex({ track_genre: 1 });

db.genres.aggregate([
  { $match: { track_genre: { $in: ["jazz", "blues", "soul"] } } },
  {
    $group: {
      _id: "$track_genre",
      trackIds: { $addToSet: "$track_id" },
      avgPopularity: { $avg: "$popularity" },
    },
  },
  {
    $lookup: {
      from: "playlists",
      localField: "trackIds",
      foreignField: "track_id",
      as: "playlistData",
    },
  },
  {
    $addFields: {
      trackCount: { $size: "$trackIds" },
      playlistCount: { $size: "$playlistData" },
      avgPlaylistPopularity: { $avg: "$playlistData.track_popularity" },
    },
  },
  {
    $project: {
      trackCount: 1,
      playlistCount: 1,
      avgPopularity: { $round: ["$avgPopularity", 1] },
      avgPlaylistPopularity: { $round: ["$avgPlaylistPopularity", 1] },
    },
  },
]);
```

### Dotaz 24 — Srovnání skladeb podle rozsahu popularity

```js
db.tracks.aggregate([
  {
    $match: {
      popularity: { $gte: 0 },
      duration_ms: { $exists: true },
      danceability: { $exists: true },
      energy: { $exists: true },
    },
  },
  {
    $bucket: {
      groupBy: "$popularity",
      boundaries: [0, 25, 50, 75, 101],
      default: "other",
      output: {
        trackCount: { $sum: 1 },
        avgDurationMin: { $avg: { $divide: ["$duration_ms", 60000] } },
        avgDanceability: { $avg: "$danceability" },
        avgEnergy: { $avg: "$energy" },
      },
    },
  },
  {
    $addFields: {
      popularityRange: {
        $switch: {
          branches: [
            { case: { $eq: ["$_id", 0] }, then: "0-24 (nízká popularita)" },
            { case: { $eq: ["$_id", 25] }, then: "25-49 (střední popularita)" },
            { case: { $eq: ["$_id", 50] }, then: "50-74 (vyšší popularita)" },
            { case: { $eq: ["$_id", 75] }, then: "75-100 (velmi populární)" },
          ],
          default: "mimo rozsah",
        },
      },
    },
  },
  { $sort: { _id: 1 } },
]);
```

## Kategorie 5 — Distribuce dat, cluster a replikace

### Dotaz 25 — Cílený dotaz podle shard key v kolekci `tracks`

```js
db.tracks.find({ id: "35iwgR4jXetI318WEWsa1Q" }).explain("executionStats");
```

### Dotaz 26 — Rozložení chunků kolekce `genres` podle shardů

```js
db.getSiblingDB("config").collections.aggregate([
  { $match: { _id: "spotify.genres" } },
  {
    $lookup: {
      from: "chunks",
      localField: "uuid",
      foreignField: "uuid",
      as: "chunks",
    },
  },
  { $unwind: "$chunks" },
  {
    $group: {
      _id: "$chunks.shard",
      chunkCount: { $sum: 1 },
    },
  },
  { $sort: { chunkCount: -1 } },
]);
```

### Dotaz 27 — Rozložení dokumentů kolekce `artists` mezi shardy

```js
db.artists.getShardDistribution();
```

### Dotaz 28 — Metadata shardování kolekce `genres`

```js
db.getSiblingDB("config").collections.findOne(
  { _id: "spotify.genres" },
  { _id: 1, key: 1, unique: 1, unsplittable: 1, distributionMode: 1 },
);
```

### Dotaz 29 — Přehled událostí v changelogu pro `spotify.*` kolekce

```js
db.getSiblingDB("config").changelog.aggregate([
  { $match: { ns: /^spotify\./ } },
  {
    $group: {
      _id: "$what",
      count: { $sum: 1 },
    },
  },
  { $sort: { count: -1 } },
]);
```

### Dotaz 30 — Přehled všech šardovaných kolekcí v databázi `spotify`

```js
db.getSiblingDB("config").collections.find(
  { _id: /^spotify\./ },
  { _id: 1, key: 1, unique: 1, unsplittable: 1 },
);
```
