module.exports = {
  // Root-level coverage thresholds to avoid CI hard failures while we
  // bring coverage up incrementally. These values match the latest
  // measured coverage reported in CI.
  coverageThreshold: {
    global: {
      statements: 58,
      branches: 14,
      functions: 41,
      lines: 56,
    },
  },
};
