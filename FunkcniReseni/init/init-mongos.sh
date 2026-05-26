echo "============================================================"
echo "Initializing mongos router..."
echo "============================================================"


echo "Waiting for mongos..."
until mongosh --host 127.0.0.1:27017 \
  -u admin -p adminPassword123 \
  --authenticationDatabase admin \
  --eval "db.runCommand('ping').ok" --quiet; do
  sleep 2
done

echo "mongos is up. Adding shards to cluster..."

mongosh --host 127.0.0.1:27017 \
  -u admin -p adminPassword123 \
  --authenticationDatabase admin <<EOF


sh.addShard("shard1ReplSet/shard1-primary:27017,shard1-secondary1:27017,shard1-secondary2:27017");
sh.addShard("shard2ReplSet/shard2-primary:27017,shard2-secondary1:27017,shard2-secondary2:27017");
sh.addShard("shard3ReplSet/shard3-primary:27017,shard3-secondary1:27017,shard3-secondary2:27017");

print("Shards added. Waiting for balancer...");
sleep(5000);

sh.enableSharding("spotify");

sh.shardCollection("spotify.tracks",    { id: "hashed" });
sh.shardCollection("spotify.artists",   { id: "hashed" });
sh.shardCollection("spotify.playlists", { playlist_id: "hashed" });
sh.shardCollection("spotify.genres",    { track_id: "hashed" });

print("Cluster status:");
sh.status();

EOF

echo "============================================================"
echo "mongos initialized successfully!"
echo "All shards added to cluster."
echo "Sharding enabled for all collections."
echo "============================================================"