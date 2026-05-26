echo "============================================================"
echo "Initializing ConfigServer replica set..."
echo "============================================================"

echo "Waiting for configsvr1 (localhost)..."
until mongosh --host 127.0.0.1:27017 --eval "db.runCommand('ping').ok" --quiet; do
  sleep 2
done

echo "Waiting for configsvr2..."
until mongosh --host configsvr2:27017 --eval "db.runCommand('ping').ok" --quiet; do
  sleep 2
done

echo "Waiting for configsvr3..."
until mongosh --host configsvr3:27017 --eval "db.runCommand('ping').ok" --quiet; do
  sleep 2
done

echo "All configsvr nodes are up. Initializing replica set..."


mongosh --host 127.0.0.1:27017 <<EOF
rs.initiate({
  _id: "configReplSet",
  configsvr: true,
  members: [
    { _id: 0, host: "configsvr1:27017", priority: 2 },
    { _id: 1, host: "configsvr2:27017", priority: 1 },
    { _id: 2, host: "configsvr3:27017", priority: 1 }
  ]
})
EOF

echo "Waiting for PRIMARY to be elected..."
sleep 15

mongosh --host 127.0.0.1:27017 --eval "rs.status()" --quiet

echo "============================================================"
echo "ConfigServer replica set initialized successfully!"
echo "============================================================"