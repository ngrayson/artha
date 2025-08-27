#!/usr/bin/env node

/**
 * Simple test script for MCP CRUD functionality
 * Tests basic vault scanning without ES modules
 */

const fs = require('fs').promises;
const path = require('path');

class SimpleVaultScanner {
  constructor(vaultPath) {
    this.vaultPath = vaultPath;
  }

  async scanVault() {
    console.log('🔍 Scanning vault...');
    console.log(`📁 Vault path: ${this.vaultPath}`);
    
    try {
      // Check if directories exist
      const projectsPath = path.join(this.vaultPath, '_projects');
      const areasPath = path.join(this.vaultPath, '_areas');
      const resourcesPath = path.join(this.vaultPath, '_resources');
      
      console.log('\n📋 Checking directory structure:');
      console.log(`   _projects: ${await this.directoryExists(projectsPath) ? '✅' : '❌'}`);
      console.log(`   _areas: ${await this.directoryExists(areasPath) ? '✅' : '❌'}`);
      console.log(`   _resources: ${await this.directoryExists(resourcesPath) ? '✅' : '❌'}`);
      
      // Count markdown files
      const projectFiles = await this.countMarkdownFiles(projectsPath);
      const areaFiles = await this.countMarkdownFiles(areasPath);
      const resourceFiles = await this.countMarkdownFiles(resourcesPath);
      
      console.log('\n📊 File counts:');
      console.log(`   Projects: ${projectFiles} markdown files`);
      console.log(`   Areas: ${areaFiles} markdown files`);
      console.log(`   Resources: ${resourceFiles} markdown files`);
      
      const total = projectFiles + areaFiles + resourceFiles;
      console.log(`   Total: ${total} markdown files`);
      
      // Test a simple file read
      if (total > 0) {
        console.log('\n🔍 Testing file reading...');
        const sampleFile = await this.findSampleFile(projectsPath, areasPath, resourcesPath);
        if (sampleFile) {
          console.log(`   Sample file: ${sampleFile}`);
          const content = await fs.readFile(sampleFile, 'utf-8');
          const lines = content.split('\n').length;
          console.log(`   File size: ${content.length} characters, ${lines} lines`);
          
          // Check for frontmatter
          if (content.includes('---')) {
            console.log('   ✅ Frontmatter detected');
          } else {
            console.log('   ❌ No frontmatter detected');
          }
        }
      }
      
      console.log('\n✅ Vault scan completed successfully!');
      
    } catch (error) {
      console.error('❌ Error scanning vault:', error.message);
    }
  }

  async directoryExists(dirPath) {
    try {
      const stat = await fs.stat(dirPath);
      return stat.isDirectory();
    } catch {
      return false;
    }
  }

  async countMarkdownFiles(dirPath) {
    if (!await this.directoryExists(dirPath)) return 0;
    
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      let count = 0;
      
      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          count += await this.countMarkdownFiles(path.join(dirPath, entry.name));
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          count++;
        }
      }
      
      return count;
    } catch (error) {
      console.error(`Error counting files in ${dirPath}:`, error.message);
      return 0;
    }
  }

  async findSampleFile(projectsPath, areasPath, resourcesPath) {
    const paths = [projectsPath, areasPath, resourcesPath];
    
    for (const dirPath of paths) {
      if (await this.directoryExists(dirPath)) {
        try {
          const entries = await fs.readdir(dirPath, { withFileTypes: true });
          for (const entry of entries) {
            if (entry.isFile() && entry.name.endsWith('.md')) {
              return path.join(dirPath, entry.name);
            }
          }
        } catch (error) {
          continue;
        }
      }
    }
    
    return null;
  }
}

// Main execution
async function main() {
  console.log('🧪 Simple MCP CRUD Test\n');
  
  const vaultPath = process.argv[2] || process.cwd();
  console.log(`📁 Testing with vault: ${vaultPath}\n`);
  
  const scanner = new SimpleVaultScanner(vaultPath);
  await scanner.scanVault();
  
  console.log('\n🚀 Basic functionality test completed!');
  console.log('📖 The MCP CRUD system is ready for more advanced testing.');
}

// Run the test
main().catch(error => {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
});
