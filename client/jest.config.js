// client/jest.config.js
module.exports = {
  roots: ['<rootDir>/src'],
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  // Map CSS files to identity-obj-proxy
  moduleNameMapper: {
    '\\.(css|less)$': 'identity-obj-proxy',
  },
  moduleDirectories: ['node_modules', 'src'],
  // Ensure that react-router-dom is transformed, because it is published as an ES module.
  transformIgnorePatterns: [
    '/node_modules/(?!(react-router-dom)/)',
  ],
  reporters: [
    "default",
    ["jest-html-reporter", { pageTitle: "Test Report" }]
  ]
};
