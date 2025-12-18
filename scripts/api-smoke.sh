#!/usr/bin/env bash
set -euo pipefail

BASE=${BASE:-http://localhost:3000}

echo "Running API smoke tests against $BASE"

# Register two users
register() {
  local email="$1"
  curl -s -X POST "$BASE/auth/register" -H "Content-Type: application/json" -d "{\"email\":\"${email}\",\"password\":\"Password123!\"}"
}

login() {
  local email="$1"
  curl -s -X POST "$BASE/auth/login" -H "Content-Type: application/json" -d "{\"email\":\"${email}\",\"password\":\"Password123!\"}"
}

# create users
register "smoke-a@example.com" > /tmp/smoke_a.json || true
register "smoke-b@example.com" > /tmp/smoke_b.json || true

# login
login "smoke-a@example.com" > /tmp/smoke_a_login.json
login "smoke-b@example.com" > /tmp/smoke_b_login.json

A_TOKEN=$(jq -r '.tokens.accessToken' /tmp/smoke_a_login.json)
B_TOKEN=$(jq -r '.tokens.accessToken' /tmp/smoke_b_login.json)

# Extract ids
A_ID=$(jq -r '.user.id' /tmp/smoke_a.json)
B_ID=$(jq -r '.user.id' /tmp/smoke_b.json)

echo "A_ID=$A_ID B_ID=$B_ID"

# A follows B
curl -s -o /tmp/smoke_follow_resp.json -w "%{http_code}" -X POST "$BASE/follow" -H "Authorization: Bearer $A_TOKEN" -H "Content-Type: application/json" -d "{\"followingId\":${B_ID}}" > /tmp/smoke_follow_code.txt || true

echo "Follow response code: $(cat /tmp/smoke_follow_code.txt)"
cat /tmp/smoke_follow_resp.json | jq -C '.' || true

# Check followers list for B
curl -s "$BASE/follow/followers/${B_ID}" | jq -C '.' || true

# A unfollows B
curl -s -X DELETE "$BASE/follow/${B_ID}" -H "Authorization: Bearer $A_TOKEN" -o /tmp/smoke_unfollow_resp.json -w "%{http_code}" > /tmp/smoke_unfollow_code.txt || true

echo "Unfollow response code: $(cat /tmp/smoke_unfollow_code.txt)"
cat /tmp/smoke_unfollow_resp.json | jq -C '.' || true


echo "Smoke tests completed"
