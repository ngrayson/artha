#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { Fzf } from 'fzf';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'js-yaml';

interface VaultItem {
  id: string;
  type: 'Task' | 'Area' | 'Resource' | 'Epic';
  status: string;
  dueDate?: string;
  area?: string;
  tags: string[];
  title: string;
  filePath: string;
  frontmatter: Record<string, any>;
  content: string;
}

interface CreateItemRequest {
  type: 'Task' | 'Area' | 'Resource' | 'Epic';
  title: string;
  area?: string;
  dueDate?: string;
  tags?: string[];
  content?: string;
}

interface UpdateItemRequest {
  id: string;
  updates: Partial<Omit<VaultItem, 'id' | 'filePath'>>;
}

interface SearchRequest {
  query: string;
  type?: 'Task' | 'Area' | 'Resource' | 'Epic';
  limit?: number;
}

class ObsidianVaultManager {
  private vaultPath: string;
  private fzf: Fzf<string[]>;

  constructor(vaultPath: string) {
    this.vaultPath = vaultPath;
    this.fzf = new Fzf<string[]>([], {});
  }

  async initialize(): Promise<void> {
    // Initialize fzf with current vault items
    const items = await this.getAllItems();
    this.fzf = new Fzf(items.map(item => item.title), {});
  }

  async getAllItems(): Promise<VaultItem[]> {
    const items: VaultItem[] = [];
    
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

  private async scanDirectory(dirPath: string, allowedTypes: string[]): Promise<VaultItem[]> {
    const items: VaultItem[] = [];
    
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          // Recursively scan subdirectories
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

  private async parseMarkdownFile(filePath: string, allowedTypes: string[]): Promise<VaultItem | null> {
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

  private extractFrontmatter(content: string): Record<string, any> {
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) return {};
    
    try {
      return yaml.load(frontmatterMatch[1]) as Record<string, any>;
    } catch (error) {
      console.error('Error parsing frontmatter:', error);
      return {};
    }
  }

  private removeFrontmatter(content: string): string {
    return content.replace(/^---\n[\s\S]*?\n---\n/, '');
  }

  private async directoryExists(dirPath: string): Promise<boolean> {
    try {
      const stat = await fs.stat(dirPath);
      return stat.isDirectory();
    } catch {
      return false;
    }
  }

  async createItem(request: CreateItemRequest): Promise<VaultItem> {
    const { type, title, area, dueDate, tags = [], content = '' } = request;
    
    // Determine directory based on type
    let targetDir: string;
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
    const frontmatter: Record<string, any> = {
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

    // Return created item
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

  private generateMarkdownContent(type: string, title: string, frontmatter: Record<string, any>, content: string): string {
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

  async updateItem(request: UpdateItemRequest): Promise<VaultItem> {
    const { id, updates } = request;
    const fullPath = path.join(this.vaultPath, id);
    
    if (!await this.directoryExists(path.dirname(fullPath))) {
      throw new Error(`File not found: ${id}`);
    }

    // Read current file
    const currentContent = await fs.readFile(fullPath, 'utf-8');
    const currentFrontmatter = this.extractFrontmatter(currentContent);
    const currentBody = this.removeFrontmatter(currentContent);

    // Update frontmatter
    const updatedFrontmatter = { ...currentFrontmatter, ...updates.frontmatter };
    
    // Update content if provided
    const updatedBody = updates.content !== undefined ? updates.content : currentBody;

    // Generate new content
    const title = path.basename(id, '.md');
    const newContent = this.generateMarkdownContent(
      updatedFrontmatter.Type || currentFrontmatter.Type,
      title,
      updatedFrontmatter,
      updatedBody
    );

    // Write updated file
    await fs.writeFile(fullPath, newContent, 'utf-8');

    // Return updated item
    return {
      id,
      type: updatedFrontmatter.Type || currentFrontmatter.Type,
      status: updatedFrontmatter.Status || currentFrontmatter.Status,
      dueDate: updatedFrontmatter['Due Date'],
      area: updatedFrontmatter.Area,
      tags: updatedFrontmatter.Tags || [],
      title,
      filePath: id,
      frontmatter: updatedFrontmatter,
      content: updatedBody
    };
  }

  async deleteItem(id: string): Promise<void> {
    const fullPath = path.join(this.vaultPath, id);
    
    if (!await this.directoryExists(path.dirname(fullPath))) {
      throw new Error(`File not found: ${id}`);
    }

    await fs.unlink(fullPath);
  }

  async searchItems(request: SearchRequest): Promise<VaultItem[]> {
    const { query, type, limit = 10 } = request;
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

  async getItem(id: string): Promise<VaultItem | null> {
    const allItems = await this.getAllItems();
    return allItems.find(item => item.id === id) || null;
  }
}

// MCP Server Implementation
class ObsidianMCPServer {
  private server: Server;
  private vaultManager: ObsidianVaultManager;

  constructor(vaultPath: string) {
    this.server = new Server(
      {
        name: 'obsidian-vault-manager',
        version: '1.0.0',
      }
    );

    this.vaultManager = new ObsidianVaultManager(vaultPath);
    this.setupToolHandlers();
  }

  private setupToolHandlers(): void {
    // List all items
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'list_items',
            description: 'List all items in the Obsidian vault',
            inputSchema: {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  enum: ['Task', 'Area', 'Resource', 'Epic'],
                  description: 'Filter by item type'
                }
              }
            }
          },
          {
            name: 'create_item',
            description: 'Create a new item in the Obsidian vault',
            inputSchema: {
              type: 'object',
              properties: {
                type: { type: 'string', enum: ['Task', 'Area', 'Resource', 'Epic'] },
                title: { type: 'string' },
                area: { type: 'string' },
                dueDate: { type: 'string' },
                tags: { type: 'array', items: { type: 'string' } },
                content: { type: 'string' }
              },
              required: ['type', 'title']
            }
          },
          {
            name: 'update_item',
            description: 'Update an existing item in the Obsidian vault',
            inputSchema: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                updates: { type: 'object' }
              },
              required: ['id', 'updates']
            }
          },
          {
            name: 'delete_item',
            description: 'Delete an item from the Obsidian vault',
            inputSchema: {
              type: 'object',
              properties: {
                id: { type: 'string' }
              },
              required: ['id']
            }
          },
          {
            name: 'search_items',
            description: 'Search items in the Obsidian vault using fuzzy finding',
            inputSchema: {
              type: 'object',
              properties: {
                query: { type: 'string' },
                type: { type: 'string', enum: ['Task', 'Area', 'Resource', 'Epic'] },
                limit: { type: 'number' }
              },
              required: ['query']
            }
          },
          {
            name: 'get_item',
            description: 'Get a specific item by ID',
            inputSchema: {
              type: 'object',
              properties: {
                id: { type: 'string' }
              },
              required: ['id']
            }
          }
        ]
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'list_items':
            const items = await this.vaultManager.getAllItems();
            if (args && args.type) {
              return { content: items.filter(item => item.type === args.type) };
            }
            return { content: items };

          case 'create_item':
            if (!args || !args.type || !args.title) {
              throw new Error('Missing required arguments: type and title');
            }
            const createdItem = await this.vaultManager.createItem(args as unknown as CreateItemRequest);
            return { content: createdItem };

          case 'update_item':
            if (!args || !args.id || !args.updates) {
              throw new Error('Missing required arguments: id and updates');
            }
            const updatedItem = await this.vaultManager.updateItem(args as unknown as UpdateItemRequest);
            return { content: updatedItem };

          case 'delete_item':
            if (!args || !args.id) {
              throw new Error('Missing required argument: id');
            }
            await this.vaultManager.deleteItem(args.id as string);
            return { content: { message: `Item ${args.id} deleted successfully` } };

          case 'search_items':
            if (!args || !args.query) {
              throw new Error('Missing required argument: query');
            }
            const searchResults = await this.vaultManager.searchItems(args as unknown as SearchRequest);
            return { content: searchResults };

          case 'get_item':
            if (!args || !args.id) {
              throw new Error('Missing required argument: id');
            }
            const item = await this.vaultManager.getItem(args.id as string);
            return { content: item };

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true
        };
      }
    });
  }

  async start(): Promise<void> {
    await this.vaultManager.initialize();
    
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    console.error('Obsidian Vault MCP Server started');
  }
}

// Main execution
async function main() {
  const vaultPath = process.argv[2] || process.cwd();
  
  try {
    const server = new ObsidianMCPServer(vaultPath);
    await server.start();
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
