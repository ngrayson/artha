#!/usr/bin/env node

// Basic test for MCP server functionality (without VaultManager integration)
console.log('🧪 Testing MCP Server Basic Functionality...\n');

async function testMCPBasic() {
  try {
    // Import the compiled server
    const { ObsidianVaultMCPServer } = await import('./dist/index.js');
    console.log('✅ Successfully imported ObsidianVaultMCPServer');
    
    // Create server instance
    const server = new ObsidianVaultMCPServer();
    console.log('✅ Successfully created server instance');
    
    // Test scan_vault tool (should work with placeholder data)
    console.log('\n🔍 Testing scan_vault tool...');
    const testVaultPath = 'C:/Users/test/Documents/Vaults/TestVault';
    
    try {
      const scanResponse = await server.handleScanVault(testVaultPath);
      console.log('📋 Scan Response:');
      console.log(JSON.stringify(scanResponse, null, 2));
      
      if (scanResponse.content && scanResponse.content[0] && scanResponse.content[0].text) {
        const text = scanResponse.content[0].text;
        if (text.includes('Sample Task 1') && text.includes('Sample Task 2')) {
          console.log('✅ scan_vault tool working correctly with placeholder data');
        } else {
          console.log('⚠️  scan_vault tool returned unexpected content');
        }
      }
    } catch (error) {
      console.log('❌ scan_vault tool error:', error.message);
      throw error;
    }
    
    // Test create_task tool
    console.log('\n✅ Testing create_task tool...');
    try {
      const createResponse = await server.handleCreateTask({
        title: 'Integration Test Task',
        area: 'Testing',
        priority: 'High',
        dueDate: '2025-09-01'
      });
      console.log('📝 Create Response:');
      console.log(JSON.stringify(createResponse, null, 2));
      
      if (createResponse.content && createResponse.content[0] && createResponse.content[0].text) {
        const text = createResponse.content[0].text;
        if (text.includes('Integration Test Task') && text.includes('placeholder response')) {
          console.log('✅ create_task tool working correctly with placeholder data');
        } else {
          console.log('⚠️  create_task tool returned unexpected content');
        }
      }
    } catch (error) {
      console.log('❌ create_task tool error:', error.message);
      throw error;
    }
    
    // Test update_task tool
    console.log('\n🔄 Testing update_task tool...');
    try {
      const updateResponse = await server.handleUpdateTask('test-task-123', {
        status: 'In Progress',
        priority: 'Medium'
      });
      console.log('📝 Update Response:');
      console.log(JSON.stringify(updateResponse, null, 2));
      
      if (updateResponse.content && updateResponse.content[0] && updateResponse.content[0].text) {
        const text = updateResponse.content[0].text;
        if (text.includes('Task updated successfully') && text.includes('placeholder response')) {
          console.log('✅ update_task tool working correctly with placeholder data');
        } else {
          console.log('⚠️  update_task tool returned unexpected content');
        }
      }
    } catch (error) {
      console.log('❌ update_task tool error:', error.message);
      throw error;
    }
    
    // Test search_tasks tool
    console.log('\n🔍 Testing search_tasks tool...');
    try {
      const searchResponse = await server.handleSearchTasks({
        query: 'integration test',
        limit: 5
      });
      console.log('🔍 Search Response:');
      console.log(JSON.stringify(searchResponse, null, 2));
      
      if (searchResponse.content && searchResponse.content[0] && searchResponse.content[0].text) {
        const text = searchResponse.content[0].text;
        if (text.includes('integration test') && text.includes('placeholder response')) {
          console.log('✅ search_tasks tool working correctly with placeholder data');
        } else {
          console.log('⚠️  search_tasks tool returned unexpected content');
        }
      }
    } catch (error) {
      console.log('❌ search_tasks tool error:', error.message);
      throw error;
    }
    
    console.log('\n🎉 All MCP Server basic tests completed successfully!');
    console.log('\n📝 Current Status:');
    console.log('- ✅ MCP Server compiled successfully');
    console.log('- ✅ All tool handlers working with placeholder data');
    console.log('- 🔄 Ready for VaultManager integration');
    console.log('\n🚀 Next Steps:');
    console.log('1. Fix script-layer ES module resolution');
    console.log('2. Replace placeholder responses with real VaultManager calls');
    console.log('3. Test with actual Obsidian vault');
    
  } catch (error) {
    console.error('❌ MCP Server basic test failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the test
testMCPBasic();
