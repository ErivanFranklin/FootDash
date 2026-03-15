module.exports = {
  // Root-level fallback coverage policy for Jest runs started from repo root.
  // Main backend/frontend gates are configured in backend/package.json and
  // frontend/karma.conf.js.
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 70,
      functions: 80,
      lines: 80,
    },
  },
};
