#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { VaultManager } from '@artha/script-layer';
import { 
  CreateTaskRequest, 
  UpdateItemRequest, 
  SearchRequest,
  ListItemsRequest,
  Task,
  TaskStatus,
  TaskPriority
} from '@artha/shared';

export class ObsidianVaultMCPServer {
  private server: Server;
  private vaultManager: VaultManager | null = null;
  private vaultPath: string | null = null;

  constructor() {
    this.server = new Server(
      {
        name: 'obsidian-vault-mcp-server',
        version: '0.1.0',
      }
    );

    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    // Register tools
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      if (!args) {
        return {
          content: [{ type: 'text', text: `Error: No arguments provided for tool ${name}` }],
        };
      }
      try {
        switch (name) {
          case 'scan_vault':
            return await this.handleScanVault(args.vaultPath as string);
          case 'create_task':
            return await this.handleCreateTask(args);
          case 'update_task':
            return await this.handleUpdateTask(args.taskId as string, args.updates as any);
          case 'search_tasks':
            return await this.handleSearchTasks(args);
          default:
            return {
              content: [{ type: 'text', text: `Unknown tool: ${name}` }],
            };
        }
      } catch (error) {
        return {
          content: [{ 
            type: 'text', 
            text: `Error executing tool ${name}: ${error instanceof Error ? error.message : 'Unknown error'}` 
          }],
        };
      }
    });

    // Register tool definitions
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'scan_vault',
          description: 'Scan an Obsidian vault and return outstanding tasks',
          inputSchema: {
            type: 'object',
            properties: {
              vaultPath: {
                type: 'string',
                description: 'Path to the Obsidian vault directory'
              }
            },
            required: ['vaultPath']
          }
        },
        {
          name: 'create_task',
          description: 'Create a new task in the Obsidian vault',
          inputSchema: {
            type: 'object',
            properties: {
              title: { type: 'string', description: 'Task title' },
              area: { type: 'string', description: 'Area/context for the task' },
              dueDate: { type: 'string', description: 'Due date (YYYY-MM-DD)' },
              priority: { type: 'string', enum: ['Low', 'Medium', 'High'], description: 'Task priority' },
              parentProjects: { type: 'array', items: { type: 'string' }, description: 'Parent projects/epics' },
              tags: { type: 'array', items: { type: 'string' }, description: 'Task tags' },
              description: { type: 'string', description: 'Task description' }
            },
            required: ['title', 'area']
          }
        },
        {
          name: 'update_task',
          description: 'Update an existing task in the Obsidian vault',
          inputSchema: {
            type: 'object',
            properties: {
              taskId: { type: 'string', description: 'ID of the task to update' },
              updates: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  status: { type: 'string', enum: ['To Do', 'In Progress', 'Done', 'Blocked'] },
                  priority: { type: 'string', enum: ['Low', 'Medium', 'High'] },
                  dueDate: { type: 'string' },
                  area: { type: 'string' },
                  tags: { type: 'array', items: { type: 'string' } },
                  description: { type: 'string' }
                }
              }
            },
            required: ['taskId', 'updates']
          }
        },
        {
          name: 'search_tasks',
          description: 'Search for tasks in the Obsidian vault',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Search query text' },
              status: { type: 'string', description: 'Filter by status' },
              area: { type: 'string', description: 'Filter by area' },
              tags: { type: 'array', items: { type: 'string' }, description: 'Filter by tags' },
              limit: { type: 'number', description: 'Maximum number of results' }
            },
            required: ['query']
          }
        }
      ]
    }));
  }

  public async handleScanVault(vaultPath: string) {
    if (!this.vaultManager || this.vaultPath !== vaultPath) {
      this.vaultPath = vaultPath;
      this.vaultManager = new VaultManager({ rootPath: vaultPath });
    }

    // For now, we'll use a simplified approach since getAllItems isn't implemented yet
    // This will be updated once the VaultManager API is fully implemented
    const outstandingTasks = [
      {
        title: 'Sample Task 1',
        status: 'To Do',
        dueDate: '2025-08-30',
        area: 'Unassigned',
        parentProjects: [],
      },
      {
        title: 'Sample Task 2',
        status: 'In Progress',
        dueDate: '2025-08-29',
        area: 'Work',
        parentProjects: ['Project A'],
      },
    ];

    const taskList = outstandingTasks
      .map((task, index) => {
        const dueDate = task.dueDate || 'No Due Date';
        const area = task.area || 'Unassigned';
        const parentProject = task.parentProjects?.[0] || '';
        
        return `${index + 1}. **${task.title}** (${task.status}) - Due: ${dueDate} - Area: ${area}${parentProject ? ` - Project: ${parentProject}` : ''}`;
      })
      .join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `🔍 Vault: ${this.vaultPath}\n\n📋 Top 7 Outstanding Tasks:\n\n${taskList}\n\n📊 Summary:\n   Total outstanding tasks: ${outstandingTasks.length}`,
        },
      ],
    };
  }

  public async handleCreateTask(args: any) {
    if (!this.vaultManager) {
      throw new Error('Vault not initialized. Please scan a vault first.');
    }

    // For now, return a success message since the full API isn't implemented yet
    return {
      content: [
        {
          type: 'text',
          text: `✅ Task "${args.title}" created successfully!\n\nNote: This is a placeholder response. Full task creation will be implemented once the VaultManager API is complete.`,
        },
      ],
    };
  }

  public async handleUpdateTask(taskId: string, updates: any) {
    if (!this.vaultManager) {
      throw new Error('Vault not initialized. Please scan a vault first.');
    }

    // For now, return a success message since the full API isn't implemented yet
    return {
      content: [
        {
          type: 'text',
          text: `✅ Task updated successfully!\n\nUpdated fields: ${Object.keys(updates).join(', ')}\n\nNote: This is a placeholder response. Full task updates will be implemented once the VaultManager API is complete.`,
        },
      ],
    };
  }

  public async handleSearchTasks(args: any) {
    if (!this.vaultManager) {
      throw new Error('Vault not initialized. Please scan a vault first.');
    }

    // For now, return a placeholder response since the full API isn't implemented yet
    const taskList = [
      '1. **Sample Task 1** (To Do) - Unassigned',
      '2. **Sample Task 2** (In Progress) - Work',
    ].join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `🔍 Search Results for "${args.query}":\n\n${taskList}\n\nFound ${2} tasks.\n\nNote: This is a placeholder response. Full search functionality will be implemented once the VaultManager API is complete.`,
        },
      ],
    };
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('MCP server started and connected');
  }
}

// Start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new ObsidianVaultMCPServer();
  server.start().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}
