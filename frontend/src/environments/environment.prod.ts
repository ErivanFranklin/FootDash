export const environment = {
  production: true,
  // In containerized prod image served by Nginx, call the backend via Nginx proxy
  // so the browser hits /api and Nginx forwards to the backend container.
  apiBaseUrl: '/api',
  authPath: '/auth',
  websocketUrl: '/',
  pushPublicKey: 'BDqGD_yDIznkf3hEDXAp2YlErNyAphXBwLE7mgiOq2qsqRi6KYoIWJIA3LrSLg6wpQUyQKhKZYeTSYJsUuxsq7U'
};
