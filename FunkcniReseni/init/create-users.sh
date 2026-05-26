echo "============================================================"
echo "Creating users and roles..."
echo "============================================================"

echo "Waiting for mongos (localhost)..."
until mongosh --host 127.0.0.1:27017 --eval "db.runCommand('ping').ok" --quiet; do
  sleep 2
done

mongosh --host 127.0.0.1:27017 <<EOF

db = db.getSiblingDB("admin");

db.createUser({
  user: "admin",
  pwd: "adminPassword123",
  roles: [
    { role: "root", db: "admin" }
  ]
});

print("Admin user created.");

EOF

echo "Admin created. Now creating readUser with auth..."

mongosh --host 127.0.0.1:27017 \
  -u admin -p adminPassword123 \
  --authenticationDatabase admin <<EOF


db = db.getSiblingDB("spotify");

db.createUser({
  user: "readUser",
  pwd: "readPassword123",
  roles: [
    { role: "read", db: "spotify" }
  ]
});

print("Read-only user created.");

EOF

echo "============================================================"
echo "Users created successfully!"
echo ""
echo "Users:"
echo "  admin    / adminPassword123  (root)"
echo "  readUser / readPassword123   (read)"
echo "============================================================"