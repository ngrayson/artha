#!/usr/bin/env node

// Simple test script for the MCP server
import { spawn } from 'child_process';
import path from 'path';

const serverPath = path.join(process.cwd(), 'dist', 'index.js');

console.log('🧪 Testing MCP Server...');
console.log(`📁 Server path: ${serverPath}`);
console.log('');

// Start the MCP server
const server = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'pipe']
});

// Test data for different tools
const testCases = [
  {
    name: 'scan_vault',
    args: { vaultPath: 'C:/Users/test/Documents/Vaults/TestVault' }
  },
  {
    name: 'create_task',
    args: { title: 'Test Task', area: 'Work', priority: 'High' }
  },
  {
    name: 'search_tasks',
    args: { query: 'test', limit: 5 }
  }
];

let testIndex = 0;

// Send test requests
function sendTestRequest() {
  if (testIndex >= testCases.length) {
    console.log('✅ All tests completed');
    server.kill();
    return;
  }

  const testCase = testCases[testIndex];
  console.log(`🔍 Testing: ${testCase.name}`);
  
  const request = {
    jsonrpc: '2.0',
    id: testIndex + 1,
    method: 'tools/call',
    params: {
      name: testCase.name,
      arguments: testCase.args
    }
  };

  console.log(`📤 Sending: ${JSON.stringify(request, null, 2)}`);
  server.stdin.write(JSON.stringify(request) + '\n');
  
  testIndex++;
}

// Handle server output
server.stdout.on('data', (data) => {
  const response = data.toString().trim();
  if (response) {
    console.log(`📥 Response: ${response}`);
    try {
      const parsed = JSON.parse(response);
      if (parsed.result) {
        console.log(`✅ Success: ${parsed.result.content?.[0]?.text || 'No content'}`);
      } else if (parsed.error) {
        console.log(`❌ Error: ${parsed.error.message}`);
      }
    } catch (e) {
      console.log(`📝 Raw output: ${response}`);
    }
    console.log('');
  }
});

// Handle server errors
server.stderr.on('data', (data) => {
  console.log(`⚠️  Server log: ${data.toString().trim()}`);
});

// Handle server exit
server.on('close', (code) => {
  console.log(`🏁 Server exited with code ${code}`);
});

// Wait a moment for server to start, then begin testing
setTimeout(() => {
  console.log('🚀 Starting tests...\n');
  sendTestRequest();
  
  // Send next test after a delay
  setInterval(sendTestRequest, 2000);
}, 1000);

// Handle process exit
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping tests...');
  server.kill();
  process.exit(0);
});
