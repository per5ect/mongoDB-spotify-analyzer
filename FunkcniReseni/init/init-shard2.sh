echo "============================================================"
echo "Initializing Shard2 replica set..."
echo "============================================================"

echo "Waiting for shard2-primary (localhost)..."
until mongosh --host 127.0.0.1:27017 --eval "db.runCommand('ping').ok" --quiet; do
  sleep 2
done

echo "Waiting for shard2-secondary1..."
until mongosh --host shard2-secondary1:27017 --eval "db.runCommand('ping').ok" --quiet; do
  sleep 2
done

echo "Waiting for shard2-secondary2..."
until mongosh --host shard2-secondary2:27017 --eval "db.runCommand('ping').ok" --quiet; do
  sleep 2
done

echo "All shard2 nodes are up. Initializing replica set..."

mongosh --host 127.0.0.1:27017 <<EOF
rs.initiate({
  _id: "shard2ReplSet",
  members: [
    { _id: 0, host: "shard2-primary:27017",    priority: 2 },
    { _id: 1, host: "shard2-secondary1:27017", priority: 1 },
    { _id: 2, host: "shard2-secondary2:27017", priority: 1 }
  ]
})
EOF

echo "Waiting for PRIMARY to be elected..."
sleep 15

mongosh --host 127.0.0.1:27017 --eval "rs.status()" --quiet

echo "============================================================"
echo "Shard2 replica set initialized successfully!"
echo "============================================================"