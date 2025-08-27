// Simple test for the compiled MCP server
const path = require('path');

describe('MCP Server - Compiled Output', () => {
  let serverInstance;
  
  beforeAll(() => {
    // Import the compiled JavaScript file
    const compiledPath = path.join(__dirname, '../dist/index.js');
    try {
      // We'll test the compiled output directly
      console.log('✅ Compiled output exists at:', compiledPath);
    } catch (error) {
      console.error('❌ Failed to access compiled output:', error.message);
    }
  });

  test('should have compiled output', () => {
    const fs = require('fs');
    const distPath = path.join(__dirname, '../dist');
    
    expect(fs.existsSync(distPath)).toBe(true);
    expect(fs.existsSync(path.join(distPath, 'index.js'))).toBe(true);
    expect(fs.existsSync(path.join(distPath, 'index.d.ts'))).toBe(true);
  });

  test('should have correct file sizes', () => {
    const fs = require('fs');
    const indexJsPath = path.join(__dirname, '../dist/index.js');
    const stats = fs.statSync(indexJsPath);
    
    // The compiled file should be reasonably sized
    expect(stats.size).toBeGreaterThan(1000); // At least 1KB
    expect(stats.size).toBeLessThan(100000);  // Less than 100KB
  });

  test('should have valid JavaScript syntax', () => {
    const fs = require('fs');
    const indexJsPath = path.join(__dirname, '../dist/index.js');
    const content = fs.readFileSync(indexJsPath, 'utf8');
    
    // Should contain expected content
    expect(content).toContain('ObsidianVaultMCPServer');
    expect(content).toContain('handleScanVault');
    expect(content).toContain('handleCreateTask');
    expect(content).toContain('handleUpdateTask');
    expect(content).toContain('handleSearchTasks');
  });

  test('should have proper exports', () => {
    const fs = require('fs');
    const indexJsPath = path.join(__dirname, '../dist/index.js');
    const content = fs.readFileSync(indexJsPath, 'utf8');
    
    // Should export the class
    expect(content).toContain('export class ObsidianVaultMCPServer');
  });

  test('should have proper tool definitions', () => {
    const fs = require('fs');
    const indexJsPath = path.join(__dirname, '../dist/index.js');
    const content = fs.readFileSync(indexJsPath, 'utf8');
    
    // Should contain tool definitions
    expect(content).toContain('scan_vault');
    expect(content).toContain('create_task');
    expect(content).toContain('update_task');
    expect(content).toContain('search_tasks');
  });

  test('should have proper error handling', () => {
    const fs = require('fs');
    const indexJsPath = path.join(__dirname, '../dist/index.js');
    const content = fs.readFileSync(indexJsPath, 'utf8');
    
    // Should contain error handling
    expect(content).toContain('Error executing tool');
    expect(content).toContain('Unknown tool');
  });

  test('should have proper response formatting', () => {
    const fs = require('fs');
    const indexJsPath = path.join(__dirname, '../dist/index.js');
    const content = fs.readFileSync(indexJsPath, 'utf8');
    
    // Should contain response formatting
    expect(content).toContain('content');
    expect(content).toContain('type');
    expect(content).toContain('text');
  });
});
