// Jest setup file for MCP server tests
const { TextEncoder, TextDecoder } = require('util');

// Polyfill for TextEncoder/TextDecoder in Node.js
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock console.error to avoid noise in tests
const originalConsoleError = console.error;
console.error = jest.fn();

// Restore console.error after tests
afterAll(() => {
  console.error = originalConsoleError;
});

// Global test utilities
global.testUtils = {
  // Create mock MCP request
  createMockRequest: (method, params = {}, id = 1) => ({
    jsonrpc: '2.0',
    id,
    method,
    params
  }),

  // Create mock tool call request
  createToolCallRequest: (toolName, args = {}, id = 1) => ({
    jsonrpc: '2.0',
    id,
    method: 'tools/call',
    params: {
      name: toolName,
      arguments: args
    }
  }),

  // Create mock list tools request
  createListToolsRequest: (id = 1) => ({
    jsonrpc: '2.0',
    id,
    method: 'tools/list',
    params: {}
  }),

  // Validate MCP response format
  validateMCPResponse: (response) => {
    expect(response).toHaveProperty('jsonrpc', '2.0');
    expect(response).toHaveProperty('id');
    expect(response).toHaveProperty('result');
    expect(response.result).toHaveProperty('content');
    expect(Array.isArray(response.result.content)).toBe(true);
    expect(response.result.content.length).toBeGreaterThan(0);
    expect(response.result.content[0]).toHaveProperty('type', 'text');
    expect(response.result.content[0]).toHaveProperty('text');
  },

  // Validate error response format
  validateErrorResponse: (response) => {
    expect(response).toHaveProperty('jsonrpc', '2.0');
    expect(response).toHaveProperty('id');
    expect(response).toHaveProperty('error');
    expect(response.error).toHaveProperty('code');
    expect(response.error).toHaveProperty('message');
  }
};
