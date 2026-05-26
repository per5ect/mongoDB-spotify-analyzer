import ast
import pandas as pd
from pymongo import MongoClient
from pymongo.errors import BulkWriteError

MONGO_URI = "mongodb://admin:adminPassword123@mongos:27017/admin"
DB_NAME = "spotify"
COLLECTION_NAME = "artists"
CSV_PATH = "/data/artists.csv"
BATCH_SIZE = 1000

print("============================================================")
print("Importing artists.csv...")
print("============================================================")

client = MongoClient(MONGO_URI)
db = client[DB_NAME]
collection = db[COLLECTION_NAME]

print("Reading CSV...")
df = pd.read_csv(CSV_PATH)
print(f"Rows loaded: {len(df)}")


df = df.dropna(subset=["id", "name"])

def parse_list(val):
    try:
        return ast.literal_eval(val)
    except:
        return []

df["genres"] = df["genres"].apply(parse_list)

df["popularity"] = pd.to_numeric(df["popularity"], errors="coerce").fillna(0).astype(int)
df["followers"]  = pd.to_numeric(df["followers"],  errors="coerce").fillna(0.0)

df = df.drop_duplicates(subset=["id"])

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
print(f"artists imported: {inserted}/{total}")
print("============================================================")

client.close()