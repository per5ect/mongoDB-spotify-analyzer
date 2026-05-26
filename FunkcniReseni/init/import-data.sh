echo "============================================================"
echo "Starting data import..."
echo "============================================================"

pip install pymongo pandas --quiet

echo ""
echo "Step 1/4: Importing tracks..."
python3 /data/import-tracks.py

echo ""
echo "Step 2/4: Importing artists..."
python3 /data/import-artists.py

echo ""
echo "Step 3/4: Importing playlists..."
python3 /data/import-playlists.py

echo ""
echo "Step 4/4: Importing genres..."
python3 /data/import-genres.py

echo ""
echo "============================================================"
echo "All data imported successfully!"
echo "============================================================"