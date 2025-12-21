import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const options = {
  vus: 5,
  duration: '30s',
};

export default function () {
  const res = http.get(`${BASE_URL}/health`);
  check(res, {
    'status is 200': (r) => r.status === 200,
  });

  // Basic unauthenticated endpoints smoke (adjust as implemented)
  const matches = http.get(`${BASE_URL}/matches`);
  check(matches, {
    'matches status 200': (r) => r.status === 200,
  });

  sleep(1);
}
