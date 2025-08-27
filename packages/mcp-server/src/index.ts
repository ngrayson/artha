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

    try {
      // Use the real VaultManager to scan the vault
      await this.vaultManager.scanVault();
      
      // Get all items and filter for tasks
      const allItems = await this.vaultManager.listItems({
        type: 'Task',
        limit: 100,
        offset: 0,
        sortBy: 'dueDate',
        sortOrder: 'asc'
      });

      if (!allItems.success) {
        throw new Error(`Failed to list items: ${allItems.error}`);
      }

      // Filter for outstanding tasks
      const outstandingTasks = allItems.items.filter(item => 
        item.type === 'Task' && item.status !== 'Done'
      ) as Task[];

      if (outstandingTasks.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: `🎉 No outstanding tasks found in vault: ${this.vaultPath}`,
            },
          ],
        };
      }

      // Sort by status priority, then by due date
      const sortedTasks = outstandingTasks.sort((a, b) => {
        const statusPriority: Record<string, number> = {
          'In Progress': 1,
          'To Do': 2,
          'Blocked': 3,
          'Unknown': 4
        };
        
        const statusA = statusPriority[a.status] || 5;
        const statusB = statusPriority[b.status] || 5;
        
        if (statusA !== statusB) {
          return statusA - statusB;
        }
        
        // Then sort by due date (earliest first)
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        
        return 0;
      });

      // Take top 7 tasks
      const topTasks = sortedTasks.slice(0, 7);

      const taskList = topTasks
        .map((task, index) => {
          const dueDate = task.dueDate || 'No Due Date';
          const area = task.area || 'Unassigned';
          const parentProjects = task.parentProjects || [];
          const parentProject = Array.isArray(parentProjects) && parentProjects.length > 0 
            ? parentProjects[0] 
            : '';
          
          return `${index + 1}. **${task.title}** (${task.status}) - Due: ${dueDate} - Area: ${area}${parentProject ? ` - Project: ${parentProject}` : ''}`;
        })
        .join('\n');

      // Calculate summary statistics
      const overdueTasks = outstandingTasks.filter(task => {
        if (!task.dueDate) return false;
        return new Date(task.dueDate) < new Date();
      });

      const thisWeekTasks = outstandingTasks.filter(task => {
        if (!task.dueDate) return false;
        const dueDate = new Date(task.dueDate);
        const today = new Date();
        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        return dueDate >= today && dueDate <= nextWeek;
      });

      return {
        content: [
          {
            type: 'text',
            text: `🔍 Vault: ${this.vaultPath}\n\n📋 Top 7 Outstanding Tasks:\n\n${taskList}\n\n📊 Summary:\n   Total outstanding tasks: ${outstandingTasks.length}\n   Overdue tasks: ${overdueTasks.length}\n   Due this week: ${thisWeekTasks.length}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Error scanning vault: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
      };
    }
  }

  public async handleCreateTask(args: any) {
    if (!this.vaultManager) {
      throw new Error('Vault not initialized. Please scan a vault first.');
    }

    try {
      // Create the task request
      const createRequest: CreateTaskRequest = {
        type: 'Task',
        title: args.title,
        status: args.status || 'To Do',
        dueDate: args.dueDate,
        parentProjects: args.parentProjects || [],
        area: args.area,
        priority: args.priority || 'Medium',
        tags: args.tags || [],
        content: args.description || ''
      };

      // Use VaultManager to create the task
      const result = await this.vaultManager.createItem(createRequest);

      if (!result.success) {
        throw new Error(`Failed to create task: ${result.error}`);
      }

      return {
        content: [
          {
            type: 'text',
            text: `✅ Task "${args.title}" created successfully!\n\nTask ID: ${result.item?.id}\nStatus: ${createRequest.status}\nArea: ${createRequest.area || 'Unassigned'}\nDue Date: ${createRequest.dueDate || 'No due date'}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Error creating task: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
      };
    }
  }

  public async handleUpdateTask(taskId: string, updates: any) {
    if (!this.vaultManager) {
      throw new Error('Vault not initialized. Please scan a vault first.');
    }

    try {
      // Prepare the update request
      const updateRequest: UpdateItemRequest = {
        id: taskId,
        updates: {
          title: updates.title,
          status: updates.status,
          dueDate: updates.dueDate,
          area: updates.area,
          tags: updates.tags,
          content: updates.description,
          ...(updates.priority && { priority: updates.priority })
        }
      };

      // Use VaultManager to update the task
      const result = await this.vaultManager.updateItem(updateRequest);

      if (!result.success) {
        throw new Error(`Failed to update task: ${result.error}`);
      }

      const updatedTask = result.item as Task;
      const updatedFields = Object.keys(updates).filter(key => updates[key] !== undefined);

      return {
        content: [
          {
            type: 'text',
            text: `✅ Task "${updatedTask.title}" updated successfully!\n\nUpdated fields: ${updatedFields.join(', ')}\n\nCurrent status: ${updatedTask.status}\nPriority: ${(updatedTask as any).priority || 'Medium'}\nArea: ${updatedTask.area || 'Unassigned'}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Error updating task: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
      };
    }
  }

  public async handleSearchTasks(args: any) {
    if (!this.vaultManager) {
      throw new Error('Vault not initialized. Please scan a vault first.');
    }

    try {
      // Prepare the search request
      const searchRequest: SearchRequest = {
        query: args.query,
        type: 'Task',
        limit: args.limit || 20,
        area: args.area,
        status: args.status,
        tags: args.tags
      };

      // Use VaultManager to search for tasks
      const result = await this.vaultManager.searchItems(searchRequest);

      if (!result.success) {
        throw new Error(`Search failed: ${result.error}`);
      }

      if (result.items.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: `🔍 No tasks found matching "${args.query}"`,
            },
          ],
        };
      }

      // Format the search results
      const taskList = result.items
        .map((task, index) => {
          const area = (task as any).area || 'Unassigned';
          const parentProjects = (task as any).parentProjects || [];
          const parentProject = Array.isArray(parentProjects) && parentProjects.length > 0 
            ? parentProjects[0] 
            : '';
          
          return `${index + 1}. **${task.title}** (${task.status}) - ${area}${parentProject ? ` - Project: ${parentProject}` : ''}`;
        })
        .join('\n');

      return {
        content: [
          {
            type: 'text',
            text: `🔍 Search Results for "${args.query}":\n\n${taskList}\n\nFound ${result.total} tasks.`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Error searching tasks: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
      };
    }
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
