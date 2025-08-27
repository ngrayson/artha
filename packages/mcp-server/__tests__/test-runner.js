#!/usr/bin/env node

// Simple test runner for MCP server tests
const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 Running MCP Server Test Suite...\n');

try {
  // Run Jest tests
  console.log('📋 Running Unit Tests...');
  execSync('npm test', { 
    stdio: 'inherit',
    cwd: __dirname + '/..'
  });
  
  console.log('\n✅ All tests completed successfully!');
  
} catch (error) {
  console.error('\n❌ Tests failed with error:', error.message);
  process.exit(1);
}
