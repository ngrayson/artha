import { ObsidianVaultMCPServer } from '../src/index';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

// Mock the MCP SDK
jest.mock('@modelcontextprotocol/sdk/server/index.js');
jest.mock('@modelcontextprotocol/sdk/server/stdio.js');

describe('ObsidianVaultMCPServer', () => {
  let server: ObsidianVaultMCPServer;
  let mockServer: jest.Mocked<Server>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create mock server instance
    mockServer = {
      setRequestHandler: jest.fn(),
      connect: jest.fn(),
    } as any;

    // Mock the Server constructor
    (Server as jest.MockedClass<typeof Server>).mockImplementation(() => mockServer);
    
    // Create server instance
    server = new ObsidianVaultMCPServer();
  });

  describe('Constructor', () => {
    it('should create server with correct name and version', () => {
      expect(Server).toHaveBeenCalledWith({
        name: 'artha-obsidian-vault',
        version: '0.1.0',
      });
    });

    it('should setup tool handlers', () => {
      expect(mockServer.setRequestHandler).toHaveBeenCalledWith(
        ListToolsRequestSchema,
        expect.any(Function)
      );
      expect(mockServer.setRequestHandler).toHaveBeenCalledWith(
        CallToolRequestSchema,
        expect.any(Function)
      );
    });
  });

  describe('Tool Registration', () => {
    let listToolsHandler: Function;
    let callToolHandler: Function;

    beforeEach(() => {
      // Extract the handlers that were registered
      const setRequestHandlerCalls = mockServer.setRequestHandler.mock.calls;
      listToolsHandler = setRequestHandlerCalls.find(
        call => call[0] === ListToolsRequestSchema
      )?.[1] as Function;
      callToolHandler = setRequestHandlerCalls.find(
        call => call[0] === CallToolRequestSchema
      )?.[1] as Function;
    });

    describe('List Tools Handler', () => {
      it('should return all available tools', async () => {
        const request = testUtils.createListToolsRequest();
        const response = await listToolsHandler(request);

        expect(response).toEqual({
          tools: [
            {
              name: 'scan_vault',
              description: 'Scan an Obsidian vault and return outstanding tasks',
              inputSchema: {
                type: 'object',
                properties: {
                  vaultPath: {
                    type: 'string',
                    description: 'Path to the Obsidian vault directory',
                  },
                },
                required: ['vaultPath'],
              },
            },
            {
              name: 'create_task',
              description: 'Create a new task in the vault',
              inputSchema: {
                type: 'object',
                properties: {
                  title: { type: 'string', description: 'Title of the task' },
                  area: { type: 'string', description: 'Area to place the task in' },
                  dueDate: { type: 'string', description: 'Due date for the task (YYYY-MM-DD)' },
                  priority: {
                    type: 'string',
                    enum: ['Low', 'Medium', 'High', 'Urgent'],
                    description: 'Priority level of the task',
                  },
                  parentProject: { type: 'string', description: 'Parent project for the task' },
                  tags: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Tags for the task',
                  },
                },
                required: ['title'],
              },
            },
            {
              name: 'update_task',
              description: 'Update an existing task in the vault',
              inputSchema: {
                type: 'object',
                properties: {
                  taskId: { type: 'string', description: 'ID of the task to update' },
                  updates: {
                    type: 'object',
                    description: 'Fields to update',
                    properties: {
                      status: {
                        type: 'string',
                        enum: ['To Do', 'In Progress', 'Done', 'Blocked'],
                      },
                      dueDate: { type: 'string' },
                      priority: {
                        type: 'string',
                        enum: ['Low', 'Medium', 'High', 'Urgent'],
                      },
                      area: { type: 'string' },
                      tags: { type: 'array', items: { type: 'string' } },
                    },
                  },
                },
                required: ['taskId', 'updates'],
              },
            },
            {
              name: 'search_tasks',
              description: 'Search for tasks in the vault',
              inputSchema: {
                type: 'object',
                properties: {
                  query: { type: 'string', description: 'Search query' },
                  status: {
                    type: 'string',
                    enum: ['To Do', 'In Progress', 'Done', 'Blocked'],
                    description: 'Filter by status',
                  },
                  area: { type: 'string', description: 'Filter by area' },
                  limit: {
                    type: 'number',
                    description: 'Maximum number of results',
                    default: 10,
                  },
                },
                required: ['query'],
              },
            },
          ],
        });
      });
    });

    describe('Call Tool Handler', () => {
      it('should handle scan_vault tool', async () => {
        const request = testUtils.createToolCallRequest('scan_vault', {
          vaultPath: 'C:/test/vault'
        });
        
        const response = await callToolHandler(request);
        
        expect(response).toHaveProperty('content');
        expect(response.content[0]).toHaveProperty('type', 'text');
        expect(response.content[0].text).toContain('🔍 Vault: C:/test/vault');
        expect(response.content[0].text).toContain('📋 Top 7 Outstanding Tasks:');
      });

      it('should handle create_task tool', async () => {
        const request = testUtils.createToolCallRequest('create_task', {
          title: 'Test Task',
          area: 'Work',
          priority: 'High'
        });
        
        const response = await callToolHandler(request);
        
        expect(response).toHaveProperty('content');
        expect(response.content[0]).toHaveProperty('type', 'text');
        expect(response.content[0].text).toContain('✅ Task "Test Task" created successfully!');
      });

      it('should handle update_task tool', async () => {
        const request = testUtils.createToolCallRequest('update_task', {
          taskId: 'task-123',
          updates: { status: 'In Progress' }
        });
        
        const response = await callToolHandler(request);
        
        expect(response).toHaveProperty('content');
        expect(response.content[0]).toHaveProperty('type', 'text');
        expect(response.content[0].text).toContain('✅ Task updated successfully!');
        expect(response.content[0].text).toContain('Updated fields: status');
      });

      it('should handle search_tasks tool', async () => {
        const request = testUtils.createToolCallRequest('search_tasks', {
          query: 'meeting',
          limit: 5
        });
        
        const response = await callToolHandler(request);
        
        expect(response).toHaveProperty('content');
        expect(response.content[0]).toHaveProperty('type', 'text');
        expect(response.content[0].text).toContain('🔍 Search Results for "meeting"');
      });

      it('should handle unknown tool', async () => {
        const request = testUtils.createToolCallRequest('unknown_tool', {});
        
        const response = await callToolHandler(request);
        
        expect(response).toHaveProperty('content');
        expect(response.content[0]).toHaveProperty('type', 'text');
        expect(response.content[0].text).toContain('Error executing tool unknown_tool');
      });

      it('should handle missing arguments', async () => {
        const request = {
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/call',
          params: { name: 'scan_vault' } // Missing arguments
        };
        
        const response = await callToolHandler(request);
        
        expect(response).toHaveProperty('content');
        expect(response.content[0]).toHaveProperty('type', 'text');
        expect(response.content[0].text).toContain('Error: No arguments provided for tool scan_vault');
      });

      it('should handle tool execution errors', async () => {
        // Mock a tool that throws an error
        const originalHandler = callToolHandler;
        callToolHandler = jest.fn().mockRejectedValue(new Error('Test error'));
        
        const request = testUtils.createToolCallRequest('scan_vault', {
          vaultPath: 'C:/test/vault'
        });
        
        const response = await callToolHandler(request);
        
        expect(response).toHaveProperty('content');
        expect(response.content[0]).toHaveProperty('type', 'text');
        expect(response.content[0].text).toContain('Error executing tool scan_vault: Test error');
        
        // Restore original handler
        callToolHandler = originalHandler;
      });
    });
  });

  describe('Tool Handlers', () => {
    describe('handleScanVault', () => {
      it('should return formatted task list', async () => {
        const response = await (server as any).handleScanVault('C:/test/vault');
        
        expect(response).toHaveProperty('content');
        expect(response.content[0]).toHaveProperty('type', 'text');
        expect(response.content[0].text).toContain('🔍 Vault: C:/test/vault');
        expect(response.content[0].text).toContain('📋 Top 7 Outstanding Tasks:');
        expect(response.content[0].text).toContain('1. **Sample Task 1** (To Do)');
        expect(response.content[0].text).toContain('2. **Sample Task 2** (In Progress)');
        expect(response.content[0].text).toContain('📊 Summary:');
        expect(response.content[0].text).toContain('Total outstanding tasks: 2');
      });
    });

    describe('handleCreateTask', () => {
      it('should return success message', async () => {
        const response = await (server as any).handleCreateTask({
          title: 'New Task',
          area: 'Work',
          priority: 'High'
        });
        
        expect(response).toHaveProperty('content');
        expect(response.content[0]).toHaveProperty('type', 'text');
        expect(response.content[0].text).toContain('✅ Task "New Task" created successfully!');
        expect(response.content[0].text).toContain('placeholder response');
      });
    });

    describe('handleUpdateTask', () => {
      it('should return success message with updated fields', async () => {
        const response = await (server as any).handleUpdateTask('task-123', {
          status: 'In Progress',
          priority: 'Medium'
        });
        
        expect(response).toHaveProperty('content');
        expect(response.content[0]).toHaveProperty('type', 'text');
        expect(response.content[0].text).toContain('✅ Task updated successfully!');
        expect(response.content[0].text).toContain('Updated fields: status, priority');
        expect(response.content[0].text).toContain('placeholder response');
      });
    });

    describe('handleSearchTasks', () => {
      it('should return search results', async () => {
        const response = await (server as any).handleSearchTasks({
          query: 'meeting',
          limit: 5
        });
        
        expect(response).toHaveProperty('content');
        expect(response.content[0]).toHaveProperty('type', 'text');
        expect(response.content[0].text).toContain('🔍 Search Results for "meeting"');
        expect(response.content[0].text).toContain('1. **Sample Task 1** (To Do) - Unassigned');
        expect(response.content[0].text).toContain('2. **Sample Task 2** (In Progress) - Work');
        expect(response.content[0].text).toContain('Found 2 tasks.');
        expect(response.content[0].text).toContain('placeholder response');
      });
    });
  });

  describe('Server Start', () => {
    it('should connect to stdio transport', async () => {
      // Mock the StdioServerTransport
      const mockTransport = { connect: jest.fn() };
      jest.doMock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
        StdioServerTransport: jest.fn(() => mockTransport)
      }));

      await server.start();
      
      expect(mockServer.connect).toHaveBeenCalled();
    });

    it('should handle startup errors', async () => {
      const mockError = new Error('Connection failed');
      mockServer.connect.mockRejectedValue(mockError);
      
      // Mock console.error to capture the error
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      await server.start();
      
      expect(consoleSpy).toHaveBeenCalledWith('Failed to start MCP server:', mockError);
      consoleSpy.mockRestore();
    });
  });
});
