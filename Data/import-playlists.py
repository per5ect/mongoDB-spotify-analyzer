import pandas as pd
from pymongo import MongoClient
from pymongo.errors import BulkWriteError

MONGO_URI = "mongodb://admin:adminPassword123@mongos:27017/admin"
DB_NAME = "spotify"
COLLECTION_NAME = "playlists"
CSV_PATH = "/data/playlists.csv"
BATCH_SIZE = 1000

print("============================================================")
print("Importing playlists.csv...")
print("============================================================")

client = MongoClient(MONGO_URI)
db = client[DB_NAME]
collection = db[COLLECTION_NAME]

print("Reading CSV...")
df = pd.read_csv(CSV_PATH)
print(f"Rows loaded: {len(df)}")


df = df.dropna(subset=["track_id", "playlist_id", "playlist_name"])

df["track_popularity"] = pd.to_numeric(df["track_popularity"], errors="coerce").fillna(0).astype(int)
df["duration_ms"]      = pd.to_numeric(df["duration_ms"],      errors="coerce").fillna(0).astype(int)
df["key"]              = pd.to_numeric(df["key"],              errors="coerce").fillna(0).astype(int)
df["mode"]             = pd.to_numeric(df["mode"],             errors="coerce").fillna(0).astype(int)
df["danceability"]     = pd.to_numeric(df["danceability"],     errors="coerce")
df["energy"]           = pd.to_numeric(df["energy"],           errors="coerce")
df["loudness"]         = pd.to_numeric(df["loudness"],         errors="coerce")
df["speechiness"]      = pd.to_numeric(df["speechiness"],      errors="coerce")
df["acousticness"]     = pd.to_numeric(df["acousticness"],     errors="coerce")
df["instrumentalness"] = pd.to_numeric(df["instrumentalness"], errors="coerce")
df["liveness"]         = pd.to_numeric(df["liveness"],         errors="coerce")
df["valence"]          = pd.to_numeric(df["valence"],          errors="coerce")
df["tempo"]            = pd.to_numeric(df["tempo"],            errors="coerce")

print(f"Rows after cleaning: {len(df)}")


records = df.to_dict("records")
total = len(records)
inserted = 0

for i in range(0, total, BATCH_SIZE):
    batch = records[i:i + BATCH_SIZE]
    try:
        collection.insert_many(batch, ordered=False)
        inserted += len(batch)
        print(f"Progress: {inserted}/{total}")
    except BulkWriteError as e:
        inserted += e.details["nInserted"]
        print(f"Progress: {inserted}/{total} (some duplicates skipped)")

print("============================================================")
print(f"playlists imported: {inserted}/{total}")
print("============================================================")

client.close()