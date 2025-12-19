
# Test Login Flow

# 1. Random Device ID
DEVICE_ID="test-device-$(uuidgen)"
HANDLE="tester"
PIN="1234"

# 2. Join (Create User)
echo "Joining..."
curl -X POST http://localhost:3001/api/user/update \
  -H "Content-Type: application/json" \
  -d "{\"device_id\": \"$DEVICE_ID\", \"handle\": \"$HANDLE\", \"pin\": \"$PIN\", \"college_id\": \"rvce\", \"name\": \"Tester\"}"

# 3. Check if exists
echo "\nChecking status..."
curl "http://localhost:3001/api/user/check?device_id=$DEVICE_ID"

# 4. Login (Success Case)
echo "\nLogging in (Correct)..."
curl -X POST http://localhost:3001/api/user/login \
  -H "Content-Type: application/json" \
  -d "{\"handle\": \"$HANDLE\", \"pin\": \"$PIN\"}"

# 5. Login (Fail Case - Wrong PIN)
echo "\nLogging in (Wrong PIN)..."
curl -X POST http://localhost:3001/api/user/login \
  -H "Content-Type: application/json" \
  -d "{\"handle\": \"$HANDLE\", \"pin\": \"0000\"}"
