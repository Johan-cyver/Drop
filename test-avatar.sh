
# Test Profile Avatar

DEVICE_ID="avatar-test-$(uuidgen)"
HANDLE="avatar_$(uuidgen | cut -c1-5)"
PIN="1234"
# Using a simple emoji as avatar for test clarity
AVATAR="🎃" 

echo "Creating User with Avatar: $AVATAR"
curl -s -X POST http://localhost:3001/api/user/update \
  -H "Content-Type: application/json" \
  -d "{\"device_id\": \"$DEVICE_ID\", \"handle\": \"$HANDLE\", \"pin\": \"$PIN\", \"college_id\": \"rvce\", \"name\": \"AvatarTester\", \"avatar\": \"$AVATAR\"}"

echo "\n\nFetching Profile..."
curl -s "http://localhost:3001/api/user/profile?device_id=$DEVICE_ID"
