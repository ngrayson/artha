#!/usr/bin/env node

// Manual test script for MCP server functionality
console.log('🧪 Manual Testing MCP Server Functionality...\n');

// Test the compiled server
async function testServer() {
  try {
    // Import the compiled server
    const { ObsidianVaultMCPServer } = await import('./dist/index.js');
    
    console.log('✅ Successfully imported ObsidianVaultMCPServer');
    
    // Create server instance
    const server = new ObsidianVaultMCPServer();
    console.log('✅ Successfully created server instance');
    
    // Test scan_vault tool
    console.log('\n🔍 Testing scan_vault tool...');
    const scanResponse = await server.handleScanVault('C:/Users/test/Documents/Vaults/TestVault');
    console.log('📋 Scan Response:');
    console.log(JSON.stringify(scanResponse, null, 2));
    
    // Test create_task tool
    console.log('\n✅ Testing create_task tool...');
    const createResponse = await server.handleCreateTask({
      title: 'Manual Test Task',
      area: 'Testing',
      priority: 'High',
      dueDate: '2025-09-01'
    });
    console.log('📝 Create Response:');
    console.log(JSON.stringify(createResponse, null, 2));
    
    // Test update_task tool
    console.log('\n🔄 Testing update_task tool...');
    const updateResponse = await server.handleUpdateTask('test-task-123', {
      status: 'In Progress',
      priority: 'Medium'
    });
    console.log('📝 Update Response:');
    console.log(JSON.stringify(updateResponse, null, 2));
    
    // Test search_tasks tool
    console.log('\n🔍 Testing search_tasks tool...');
    const searchResponse = await server.handleSearchTasks({
      query: 'manual test',
      limit: 5
    });
    console.log('🔍 Search Response:');
    console.log(JSON.stringify(searchResponse, null, 2));
    
    console.log('\n🎉 All manual tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Manual test failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the manual test
testServer();
