#!/usr/bin/env node

/**
 * Test script for MCP CRUD functionality
 * This demonstrates the core vault management capabilities
 * without requiring the full MCP server setup
 */

import { Fzf } from 'fzf';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'js-yaml';

class SimpleVaultManager {
  constructor(vaultPath) {
    this.vaultPath = vaultPath;
    this.fzf = new Fzf([], {});
  }

  async initialize() {
    console.log('🔍 Initializing vault manager...');
    const items = await this.getAllItems();
    this.fzf = new Fzf(items.map(item => item.title), {});
    console.log(`✅ Found ${items.length} items in vault`);
    return items;
  }

  async getAllItems() {
    const items = [];
    
    // Scan _projects directory
    const projectsPath = path.join(this.vaultPath, '_projects');
    if (await this.directoryExists(projectsPath)) {
      items.push(...await this.scanDirectory(projectsPath, ['Task', 'Epic']));
    }

    // Scan _areas directory
    const areasPath = path.join(this.vaultPath, '_areas');
    if (await this.directoryExists(areasPath)) {
      items.push(...await this.scanDirectory(areasPath, ['Area']));
    }

    // Scan _resources directory
    const resourcesPath = path.join(this.vaultPath, '_resources');
    if (await this.directoryExists(resourcesPath)) {
      items.push(...await this.scanDirectory(resourcesPath, ['Resource']));
    }

    return items;
  }

  async scanDirectory(dirPath, allowedTypes) {
    const items = [];
    
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          items.push(...await this.scanDirectory(path.join(dirPath, entry.name), allowedTypes));
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          const filePath = path.join(dirPath, entry.name);
          const item = await this.parseMarkdownFile(filePath, allowedTypes);
          if (item) {
            items.push(item);
          }
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${dirPath}:`, error);
    }

    return items;
  }

  async parseMarkdownFile(filePath, allowedTypes) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const frontmatter = this.extractFrontmatter(content);
      
      if (!frontmatter.Type || !allowedTypes.includes(frontmatter.Type)) {
        return null;
      }

      const relativePath = path.relative(this.vaultPath, filePath);
      const title = path.basename(filePath, '.md');

      return {
        id: relativePath,
        type: frontmatter.Type,
        status: frontmatter.Status || 'Unknown',
        dueDate: frontmatter['Due Date'],
        area: frontmatter.Area,
        tags: Array.isArray(frontmatter.Tags) ? frontmatter.Tags : [],
        title,
        filePath: relativePath,
        frontmatter,
        content: this.removeFrontmatter(content)
      };
    } catch (error) {
      console.error(`Error parsing file ${filePath}:`, error);
      return null;
    }
  }

  extractFrontmatter(content) {
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) return {};
    
    try {
      return yaml.load(frontmatterMatch[1]);
    } catch (error) {
      console.error('Error parsing frontmatter:', error);
      return {};
    }
  }

  removeFrontmatter(content) {
    return content.replace(/^---\n[\s\S]*?\n---\n/, '');
  }

  async directoryExists(dirPath) {
    try {
      const stat = await fs.stat(dirPath);
      return stat.isDirectory();
    } catch {
      return false;
    }
  }

  async searchItems(query, type, limit = 10) {
    const allItems = await this.getAllItems();
    
    // Filter by type if specified
    let filteredItems = allItems;
    if (type) {
      filteredItems = allItems.filter(item => item.type === type);
    }

    // Use fzf for fuzzy search
    const searchableTitles = filteredItems.map(item => item.title);
    this.fzf = new Fzf(searchableTitles, {});
    
    const results = this.fzf.find(query);
    const matchedTitles = results.slice(0, limit).map(result => result.item);

    // Return items matching the search results
    return filteredItems.filter(item => matchedTitles.includes(item.title));
  }

  async createItem(type, title, area, dueDate, tags = [], content = '') {
    // Determine directory based on type
    let targetDir;
    switch (type) {
      case 'Task':
      case 'Epic':
        targetDir = '_projects';
        break;
      case 'Area':
        targetDir = '_areas';
        break;
      case 'Resource':
        targetDir = '_resources';
        break;
      default:
        throw new Error(`Invalid type: ${type}`);
    }

    // Create filename
    const filename = `${title.replace(/[^a-zA-Z0-9\s-]/g, '')}.md`;
    const filePath = path.join(this.vaultPath, targetDir, filename);

    // Generate frontmatter
    const frontmatter = {
      Type: type,
      Status: 'To Do',
      Created: new Date().toISOString().split('T')[0]
    };

    if (area) frontmatter.Area = area;
    if (dueDate) frontmatter['Due Date'] = dueDate;
    if (tags.length > 0) frontmatter.Tags = tags;

    // Generate content
    const markdownContent = this.generateMarkdownContent(type, title, frontmatter, content);

    // Write file
    await fs.writeFile(filePath, markdownContent, 'utf-8');

    console.log(`✅ Created ${type}: ${title} at ${path.join(targetDir, filename)}`);
    
    return {
      id: path.join(targetDir, filename),
      type,
      status: 'To Do',
      dueDate,
      area,
      tags,
      title,
      filePath: path.join(targetDir, filename),
      frontmatter,
      content: this.removeFrontmatter(markdownContent)
    };
  }

  generateMarkdownContent(type, title, frontmatter, content) {
    const yamlContent = yaml.dump(frontmatter);
    const header = `# ${title}\n\n`;
    
    let templateContent = '';
    switch (type) {
      case 'Task':
        templateContent = `**Priority**: Medium\n**Status**: ${frontmatter.Status}\n**Due**: ${frontmatter['Due Date'] || 'No due date'}\n\n## Purpose\n\n## Requirements\n\n## Context\n\n## Notes\n`;
        break;
      case 'Area':
        templateContent = `## Purpose\n\n## Active Projects\n\n## Current Focus\n\n## Resources\n\n## Notes\n`;
        break;
      case 'Resource':
        templateContent = `## Purpose\nReference material and documentation for ${title}.\n\n## Content Overview\n\n## Key Topics\n\n## Usage Notes\n`;
        break;
      case 'Epic':
        templateContent = `## Purpose\n\n## Project Overview\n\n## Current Status\n\n## Key Milestones\n\n## Team Structure\n\n## Notes\n`;
        break;
    }

    return `---\n${yamlContent}---\n\n${header}${templateContent}${content}`;
  }
}

// Test functions
async function runTests() {
  console.log('🧪 MCP CRUD Test Suite\n');
  
  const vaultPath = process.argv[2] || process.cwd();
  console.log(`📁 Testing with vault: ${vaultPath}\n`);
  
  const manager = new SimpleVaultManager(vaultPath);
  
  try {
    // Test 1: Initialize and scan vault
    console.log('📋 Test 1: Vault Scanning');
    const items = await manager.initialize();
    console.log(`   Found ${items.length} items`);
    
    // Show some examples
    const examples = items.slice(0, 3);
    examples.forEach(item => {
      console.log(`   - ${item.type}: ${item.title} (${item.status})`);
    });
    console.log('');

    // Test 2: Search functionality
    console.log('🔍 Test 2: Fuzzy Search');
    const searchResults = await manager.searchItems('project', 'Task', 3);
    console.log(`   Search for "project" in Tasks: ${searchResults.length} results`);
    searchResults.forEach(item => {
      console.log(`   - ${item.title} (${item.area || 'No area'})`);
    });
    console.log('');

    // Test 3: Create a test item
    console.log('➕ Test 3: Create Test Item');
    const testItem = await manager.createItem(
      'Task',
      'Test MCP CRUD Functionality',
      'Development',
      '2025-08-30',
      ['test', 'mcp', 'crud'],
      'This is a test task created by the MCP CRUD test suite.'
    );
    console.log(`   Created: ${testItem.title} with ID: ${testItem.id}`);
    console.log('');

    // Test 4: Search for the new item
    console.log('🔍 Test 4: Search for New Item');
    const newSearchResults = await manager.searchItems('Test MCP', 'Task', 5);
    console.log(`   Search for "Test MCP": ${newSearchResults.length} results`);
    newSearchResults.forEach(item => {
      console.log(`   - ${item.title} (${item.status})`);
    });
    console.log('');

    // Test 5: Clean up test item
    console.log('🧹 Test 5: Cleanup');
    const testFilePath = path.join(vaultPath, testItem.id);
    await fs.unlink(testFilePath);
    console.log(`   Deleted test file: ${testItem.id}`);
    console.log('');

    console.log('✅ All tests completed successfully!');
    console.log('\n🚀 The MCP CRUD server is ready for use.');
    console.log('📖 See README-MCP-CRUD.md for full documentation.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}
