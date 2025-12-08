const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
// A known team ID from the seed data
const TEAM_ID_TO_SYNC = parseInt(process.env.TEAM_ID || '1', 10);
// You can provide a real token via `SMOKE_TEST_TOKEN` env var to avoid the placeholder
const FAKE_FCM_TOKEN = process.env.FAKE_FCM_TOKEN || 'c_n7v5nL-fM:APA91bH...for-testing-only';
const SMOKE_TEST_TOKEN = process.env.SMOKE_TEST_TOKEN || null;

async function runSmokeTest() {
  console.log('--- Running Staging Smoke Test ---');

  try {
    // 1. Register a token for a user (use SMOKE_TEST_TOKEN if provided)
    const tokenToRegister = SMOKE_TEST_TOKEN || FAKE_FCM_TOKEN;
    console.log(`[1/2] Registering FCM token: ${tokenToRegister}`);
    const registerRes = await axios.post(
      `${API_BASE_URL}/notifications/tokens`,
      {
        // numeric userId matches DTO expectation
        userId: 1,
        token: tokenToRegister,
      },
      { timeout: 10000 },
    );
    console.log('✅ Token registration response status:', registerRes.status);

    // 2. Trigger a match sync to generate potential notifications
    console.log(`[2/2] Triggering match sync for team ID: ${TEAM_ID_TO_SYNC}`);
    const response = await axios.post(`${API_BASE_URL}/matches/team/${TEAM_ID_TO_SYNC}/sync`, {}, { timeout: 20000 });
    console.log('✅ Match sync triggered successfully.');
    console.log('Sync response status:', response.status);
    if (response.data) console.log('Sync response data:', response.data);

    console.log('\n--- Smoke Test Finished ---');
    console.log('Check the backend server logs for notification processing messages (search for "Sending notification").');

  } catch (error) {
    console.error('\n❌ Smoke test failed!');
    if (error.response) {
      console.error('HTTP Status:', error.response.status);
      console.error('Headers:', JSON.stringify(error.response.headers, null, 2));
      console.error('Response body:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('No response received; request details:', error.request);
    } else {
      console.error('Error:', error.message);
    }
    process.exit(1);
  }
}

runSmokeTest();
