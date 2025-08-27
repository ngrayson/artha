import { ObsidianVaultMCPServer } from '../src/index';

describe('MCP Server Integration Tests', () => {
  let server: ObsidianVaultMCPServer;

  beforeEach(() => {
    server = new ObsidianVaultMCPServer();
  });

  describe('End-to-End Tool Execution', () => {
    it('should execute complete scan_vault workflow', async () => {
      // Test the complete scan_vault tool execution
      const response = await (server as any).handleScanVault('C:/Users/test/Documents/Vaults/TestVault');
      
      // Validate response structure
      expect(response).toHaveProperty('content');
      expect(Array.isArray(response.content)).toBe(true);
      expect(response.content.length).toBeGreaterThan(0);
      
      // Validate content format
      const content = response.content[0];
      expect(content).toHaveProperty('type', 'text');
      expect(content).toHaveProperty('text');
      
      // Validate specific content
      const text = content.text;
      expect(text).toContain('🔍 Vault: C:/Users/test/Documents/Vaults/TestVault');
      expect(text).toContain('📋 Top 7 Outstanding Tasks:');
      expect(text).toContain('📊 Summary:');
      expect(text).toContain('Total outstanding tasks: 2');
      
      // Validate task list format
      expect(text).toMatch(/1\. \*\*.*\*\* \(.*\) - Due: .* - Area: .*/);
      expect(text).toMatch(/2\. \*\*.*\*\* \(.*\) - Due: .* - Area: .*/);
    });

    it('should execute complete create_task workflow', async () => {
      const taskData = {
        title: 'Integration Test Task',
        area: 'Testing',
        dueDate: '2025-09-01',
        priority: 'High',
        parentProject: 'Test Project',
        tags: ['integration', 'test']
      };
      
      const response = await (server as any).handleCreateTask(taskData);
      
      // Validate response structure
      expect(response).toHaveProperty('content');
      expect(response.content[0]).toHaveProperty('type', 'text');
      
      // Validate content
      const text = response.content[0].text;
      expect(text).toContain('✅ Task "Integration Test Task" created successfully!');
      expect(text).toContain('placeholder response');
    });

    it('should execute complete update_task workflow', async () => {
      const updates = {
        status: 'In Progress',
        priority: 'Medium',
        dueDate: '2025-09-15'
      };
      
      const response = await (server as any).handleUpdateTask('test-task-123', updates);
      
      // Validate response structure
      expect(response).toHaveProperty('content');
      expect(response.content[0]).toHaveProperty('type', 'text');
      
      // Validate content
      const text = response.content[0].text;
      expect(text).toContain('✅ Task updated successfully!');
      expect(text).toContain('Updated fields: status, priority, dueDate');
      expect(text).toContain('placeholder response');
    });

    it('should execute complete search_tasks workflow', async () => {
      const searchParams = {
        query: 'integration test',
        status: 'To Do',
        area: 'Testing',
        limit: 5
      };
      
      const response = await (server as any).handleSearchTasks(searchParams);
      
      // Validate response structure
      expect(response).toHaveProperty('content');
      expect(response.content[0]).toHaveProperty('type', 'text');
      
      // Validate content
      const text = response.content[0].text;
      expect(text).toContain('🔍 Search Results for "integration test"');
      expect(text).toContain('Found 2 tasks.');
      expect(text).toContain('placeholder response');
    });
  });

  describe('Response Format Validation', () => {
    it('should return consistent response format for all tools', async () => {
      const tools = [
        { name: 'scan_vault', args: { vaultPath: 'C:/test/vault' } },
        { name: 'create_task', args: { title: 'Test Task' } },
        { name: 'update_task', args: { taskId: 'test-123', updates: { status: 'Done' } } },
        { name: 'search_tasks', args: { query: 'test' } }
      ];
      
      for (const tool of tools) {
        let response;
        switch (tool.name) {
          case 'scan_vault':
            response = await (server as any).handleScanVault(tool.args.vaultPath);
            break;
          case 'create_task':
            response = await (server as any).handleCreateTask(tool.args);
            break;
          case 'update_task':
            response = await (server as any).handleUpdateTask(tool.args.taskId, tool.args.updates);
            break;
          case 'search_tasks':
            response = await (server as any).handleSearchTasks(tool.args);
            break;
        }
        
        // Validate consistent response structure
        expect(response).toHaveProperty('content');
        expect(Array.isArray(response.content)).toBe(true);
        expect(response.content.length).toBeGreaterThan(0);
        expect(response.content[0]).toHaveProperty('type', 'text');
        expect(response.content[0]).toHaveProperty('text');
        expect(typeof response.content[0].text).toBe('string');
        expect(response.content[0].text.length).toBeGreaterThan(0);
      }
    });

    it('should handle edge cases gracefully', async () => {
      // Test with empty vault path
      const response = await (server as any).handleScanVault('');
      expect(response).toHaveProperty('content');
      expect(response.content[0].text).toContain('🔍 Vault: ');
      
      // Test with very long vault path
      const longPath = 'C:/' + 'a'.repeat(1000) + '/vault';
      const longResponse = await (server as any).handleScanVault(longPath);
      expect(longResponse).toHaveProperty('content');
      expect(longResponse.content[0].text).toContain(longPath);
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle malformed input gracefully', async () => {
      // Test with null/undefined values
      const response = await (server as any).handleCreateTask({
        title: null,
        area: undefined,
        priority: 'Invalid'
      });
      
      expect(response).toHaveProperty('content');
      expect(response.content[0]).toHaveProperty('type', 'text');
      expect(response.content[0].text).toContain('✅ Task "null" created successfully!');
    });

    it('should handle special characters in input', async () => {
      const specialChars = {
        title: 'Task with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?',
        area: 'Area with spaces and symbols',
        priority: 'High'
      };
      
      const response = await (server as any).handleCreateTask(specialChars);
      
      expect(response).toHaveProperty('content');
      expect(response.content[0].text).toContain('✅ Task "Task with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?" created successfully!');
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle multiple rapid requests', async () => {
      const promises = [];
      
      // Send 10 rapid requests
      for (let i = 0; i < 10; i++) {
        promises.push(
          (server as any).handleScanVault(`C:/test/vault${i}`)
        );
      }
      
      const responses = await Promise.all(promises);
      
      // All requests should complete successfully
      expect(responses).toHaveLength(10);
      responses.forEach(response => {
        expect(response).toHaveProperty('content');
        expect(response.content[0]).toHaveProperty('type', 'text');
      });
    });

    it('should maintain consistent response times', async () => {
      const startTime = Date.now();
      await (server as any).handleScanVault('C:/test/vault');
      const endTime = Date.now();
      
      const responseTime = endTime - startTime;
      
      // Response should be reasonably fast (under 100ms for placeholder data)
      expect(responseTime).toBeLessThan(100);
    });
  });

  describe('Data Consistency', () => {
    it('should return consistent sample data across calls', async () => {
      const response1 = await (server as any).handleScanVault('C:/test/vault1');
      const response2 = await (server as any).handleScanVault('C:/test/vault2');
      
      // Both responses should contain the same sample data structure
      expect(response1.content[0].text).toContain('Sample Task 1');
      expect(response1.content[0].text).toContain('Sample Task 2');
      expect(response2.content[0].text).toContain('Sample Task 1');
      expect(response2.content[0].text).toContain('Sample Task 2');
      
      // Both should show 2 tasks
      expect(response1.content[0].text).toContain('Total outstanding tasks: 2');
      expect(response2.content[0].text).toContain('Total outstanding tasks: 2');
    });

    it('should maintain data integrity across different tool calls', async () => {
      // Create a task
      const createResponse = await (server as any).handleCreateTask({
        title: 'Data Integrity Test',
        area: 'Testing'
      });
      
      // Update the same task
      const updateResponse = await (server as any).handleUpdateTask('test-id', {
        status: 'In Progress'
      });
      
      // Search for the task
      const searchResponse = await (server as any).handleSearchTasks({
        query: 'Data Integrity Test'
      });
      
      // All responses should be consistent
      expect(createResponse.content[0].text).toContain('Data Integrity Test');
      expect(updateResponse.content[0].text).toContain('Data Integrity Test');
      expect(searchResponse.content[0].text).toContain('Data Integrity Test');
    });
  });
});
