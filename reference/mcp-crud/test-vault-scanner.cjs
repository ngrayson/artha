#!/usr/bin/env node

/**
 * Test script for the new MCP-enabled vault scanner
 */

const VaultScannerMCPAdvanced = require('./vault-scanner-mcp.cjs');

async function testVaultScanner() {
    console.log('🧪 Testing MCP-enabled Vault Scanner\n');
    
    // Test with current directory
    const vaultPath = process.argv[2] || process.cwd();
    console.log(`📁 Testing with vault: ${vaultPath}\n`);
    
    const scanner = new VaultScannerMCPAdvanced(vaultPath);
    
    try {
        // Test scanning
        console.log('🔍 Testing vault scanning...');
        await scanner.scan();
        
        // Test summary
        console.log('📊 Testing summary generation...');
        scanner.printSummary();
        
        // Test project details
        console.log('📋 Testing project details...');
        scanner.printProjectDetails();
        
        // Test urgent projects
        console.log('⚠️  Testing urgent projects...');
        const urgent = scanner.getUrgentProjects(7);
        if (urgent.length > 0) {
            console.log('Found urgent projects:');
            urgent.forEach(p => {
                console.log(`  • ${p.title} - Due: ${p.dueDate}`);
            });
        } else {
            console.log('No urgent projects found');
        }
        
        // Test search
        console.log('\n🔍 Testing search functionality...');
        const searchResults = await scanner.searchItems('project');
        console.log(`Search for "project" returned ${searchResults.length} results`);
        
        console.log('\n✅ All tests completed successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
            } finally {
            // Cleanup if method exists
            if (scanner.cleanupMCP && typeof scanner.cleanupMCP === 'function') {
                scanner.cleanupMCP();
            }
        }
}

// Run the test
testVaultScanner();
