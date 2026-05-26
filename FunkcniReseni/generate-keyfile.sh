KEYFILE_PATH="./keyfile"

echo "Generating keyfile..."

openssl rand -base64 756 > "$KEYFILE_PATH"

chmod 400 "$KEYFILE_PATH"

echo "Keyfile generated: $KEYFILE_PATH"
echo "Permissions:"
ls -la "$KEYFILE_PATH"