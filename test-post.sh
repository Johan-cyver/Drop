
# Test Post Flow

# 1. Reuse previous Valid Device ID (or create new verified one)
# We'll create a new one to be sure
DEVICE_ID="test-poster-$(uuidgen)"
HANDLE="poster_$(uuidgen | cut -c1-5)"
PIN="1234"

echo "Creating Verified User..."
curl -s -X POST http://localhost:3001/api/user/update \
  -H "Content-Type: application/json" \
  -d "{\"device_id\": \"$DEVICE_ID\", \"handle\": \"$HANDLE\", \"pin\": \"$PIN\", \"college_id\": \"rvce\", \"name\": \"Poster\"}" > /dev/null

# 2. Try Posting (Should Success)
echo "\n\nAttempting to Post..."
curl -v -X POST http://localhost:3001/api/confess \
  -H "Content-Type: application/json" \
  -d "{\"content\": \"This is a test post #RVCE\", \"device_id\": \"$DEVICE_ID\"}"
