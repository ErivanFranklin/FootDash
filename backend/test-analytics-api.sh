#!/bin/bash

# Analytics API Testing Script
# Run this with: bash test-analytics-api.sh

BASE_URL="http://localhost:3000"
echo "=== Testing Analytics API ==="
echo

# Step 1: Login
echo "1. Getting auth token..."
TOKEN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"local+test@example.com","password":"Password123!"}' \
  | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to get auth token"
  exit 1
fi
echo "✅ Got token: ${TOKEN:0:20}..."
echo

# Step 2: Check if we have teams
echo "2. Checking for teams..."
TEAM_RESPONSE=$(curl -s "$BASE_URL/teams/1")
if echo "$TEAM_RESPONSE" | grep -q "statusCode"; then
  echo "⚠️  No team with ID 1 found, response: $TEAM_RESPONSE"
  echo "   You may need to sync teams first"
else
  echo "✅ Team found"
fi
echo

# Step 3: Check if we have matches
echo "3. Checking for matches..."
MATCH_RESPONSE=$(curl -s "$BASE_URL/matches/1")
if echo "$MATCH_RESPONSE" | grep -q "statusCode"; then
  echo "⚠️  No match with ID 1 found"
  echo "   You may need to sync matches first"
else
  echo "✅ Match found"
fi
echo

# Step 4: Test Team Analytics Endpoints
echo "4. Testing team analytics endpoints..."

echo "   4a. GET /analytics/team/1"
curl -s -X GET "$BASE_URL/analytics/team/1" \
  -H "Authorization: Bearer $TOKEN" | head -c 200
echo "..."
echo

echo "   4b. GET /analytics/team/1/form"
curl -s -X GET "$BASE_URL/analytics/team/1/form" \
  -H "Authorization: Bearer $TOKEN" | head -c 200
echo "..."
echo

# Step 5: Test Prediction Endpoints
echo "5. Testing prediction endpoints..."

echo "   5a. POST /analytics/match/1/predict"
curl -s -X POST "$BASE_URL/analytics/match/1/predict" \
  -H "Authorization: Bearer $TOKEN" | head -c 300
echo "..."
echo

echo "   5b. GET /analytics/match/1/prediction"
curl -s -X GET "$BASE_URL/analytics/match/1/prediction" \
  -H "Authorization: Bearer $TOKEN" | head -c 300
echo "..."
echo

echo "=== Test Complete ==="
echo "Check responses above for any errors"
echo "Full Swagger docs at: $BASE_URL/api"
