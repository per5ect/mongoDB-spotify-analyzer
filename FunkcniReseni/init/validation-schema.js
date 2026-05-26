db = db.getSiblingDB("spotify");

db.runCommand({
  collMod: "tracks",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["id", "name", "popularity", "duration_ms"],
      properties: {
        id: {
          bsonType: "string",
        },
        name: {
          bsonType: "string",
        },
        popularity: {
          bsonType: "int",
          minimum: 0,
          maximum: 100,
        },
        duration_ms: {
          bsonType: "int",
          minimum: 0,
        },
        explicit: {
          bsonType: "int",
          enum: [0, 1],
        },
        artists: {
          bsonType: "string",
        },
        id_artists: {
          bsonType: "array",
          items: { bsonType: "string" },
        },
        release_date: {
          bsonType: "string",
        },
        danceability: {
          bsonType: "double",
          minimum: 0,
          maximum: 1,
        },
        energy: {
          bsonType: "double",
          minimum: 0,
          maximum: 1,
        },
        key: {
          bsonType: "int",
          minimum: -1,
          maximum: 11,
        },
        loudness: {
          bsonType: "double",
        },
        mode: {
          bsonType: "int",
          enum: [0, 1],
        },
        speechiness: {
          bsonType: "double",
          minimum: 0,
          maximum: 1,
        },
        acousticness: {
          bsonType: "double",
          minimum: 0,
          maximum: 1,
        },
        instrumentalness: {
          bsonType: "double",
          minimum: 0,
          maximum: 1,
        },
        liveness: {
          bsonType: "double",
          minimum: 0,
          maximum: 1,
        },
        valence: {
          bsonType: "double",
          minimum: 0,
          maximum: 1,
        },
        tempo: {
          bsonType: "double",
          minimum: 0,
        },
        time_signature: {
          bsonType: "int",
          minimum: 0,
          maximum: 7,
        },
      },
    },
  },
  validationLevel: "moderate",
  validationAction: "warn",
});

db.runCommand({
  collMod: "artists",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["id", "name"],
      properties: {
        id: {
          bsonType: "string",
        },
        name: {
          bsonType: "string",
        },
        popularity: {
          bsonType: "int",
          minimum: 0,
          maximum: 100,
        },
        followers: {
          bsonType: "double",
          minimum: 0,
        },
        genres: {
          bsonType: "array",
          items: { bsonType: "string" },
        },
      },
    },
  },
  validationLevel: "moderate",
  validationAction: "warn",
});

db.runCommand({
  collMod: "playlists",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["track_id", "playlist_id", "playlist_name"],
      properties: {
        track_id: {
          bsonType: "string",
        },
        playlist_id: {
          bsonType: "string",
        },
        playlist_name: {
          bsonType: "string",
        },
        track_name: {
          bsonType: "string",
        },
        track_artist: {
          bsonType: "string",
        },
        track_popularity: {
          bsonType: "int",
          minimum: 0,
          maximum: 100,
        },
        track_album_id: {
          bsonType: "string",
        },
        track_album_name: {
          bsonType: "string",
        },
        track_album_release_date: {
          bsonType: "string",
        },
        playlist_genre: {
          bsonType: "string",
        },
        playlist_subgenre: {
          bsonType: "string",
        },
        danceability: {
          bsonType: "double",
          minimum: 0,
          maximum: 1,
        },
        energy: {
          bsonType: "double",
          minimum: 0,
          maximum: 1,
        },
        key: {
          bsonType: "int",
          minimum: -1,
          maximum: 11,
        },
        loudness: {
          bsonType: "double",
        },
        mode: {
          bsonType: "int",
          enum: [0, 1],
        },
        speechiness: {
          bsonType: "double",
          minimum: 0,
          maximum: 1,
        },
        acousticness: {
          bsonType: "double",
          minimum: 0,
          maximum: 1,
        },
        instrumentalness: {
          bsonType: "double",
          minimum: 0,
          maximum: 1,
        },
        liveness: {
          bsonType: "double",
          minimum: 0,
          maximum: 1,
        },
        valence: {
          bsonType: "double",
          minimum: 0,
          maximum: 1,
        },
        tempo: {
          bsonType: "double",
          minimum: 0,
        },
        duration_ms: {
          bsonType: "int",
          minimum: 0,
        },
      },
    },
  },
  validationLevel: "moderate",
  validationAction: "warn",
});

db.runCommand({
  collMod: "genres",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["track_id", "track_genre"],
      properties: {
        track_id: {
          bsonType: "string",
        },
        track_genre: {
          bsonType: "string",
        },
        track_name: {
          bsonType: "string",
        },
        artists: {
          bsonType: "string",
        },
        album_name: {
          bsonType: "string",
        },
        popularity: {
          bsonType: "int",
          minimum: 0,
          maximum: 100,
        },
        duration_ms: {
          bsonType: "int",
          minimum: 0,
        },
        explicit: {
          bsonType: "bool",
        },
        danceability: {
          bsonType: "double",
          minimum: 0,
          maximum: 1,
        },
        energy: {
          bsonType: "double",
          minimum: 0,
          maximum: 1,
        },
        key: {
          bsonType: "int",
          minimum: -1,
          maximum: 11,
        },
        loudness: {
          bsonType: "double",
        },
        mode: {
          bsonType: "int",
          enum: [0, 1],
        },
        speechiness: {
          bsonType: "double",
          minimum: 0,
          maximum: 1,
        },
        acousticness: {
          bsonType: "double",
          minimum: 0,
          maximum: 1,
        },
        instrumentalness: {
          bsonType: "double",
          minimum: 0,
          maximum: 1,
        },
        liveness: {
          bsonType: "double",
          minimum: 0,
          maximum: 1,
        },
        valence: {
          bsonType: "double",
          minimum: 0,
          maximum: 1,
        },
        tempo: {
          bsonType: "double",
          minimum: 0,
        },
        time_signature: {
          bsonType: "int",
          minimum: 0,
          maximum: 7,
        },
      },
    },
  },
  validationLevel: "moderate",
  validationAction: "warn",
});
