import { ObsidianVaultMCPServer } from '../src/index';

describe('ObsidianVaultMCPServer - Basic Functionality', () => {
  let server: ObsidianVaultMCPServer;

  beforeEach(() => {
    server = new ObsidianVaultMCPServer();
  });

  describe('Core Tool Handlers', () => {
    it('should handle scan_vault tool correctly', async () => {
      const response = await server.handleScanVault('C:/test/vault');
      
      expect(response).toHaveProperty('content');
      expect(Array.isArray(response.content)).toBe(true);
      expect(response.content.length).toBeGreaterThan(0);
      
      const content = response.content[0];
      expect(content).toHaveProperty('type', 'text');
      expect(content).toHaveProperty('text');
      
      const text = content.text;
      expect(text).toContain('🔍 Vault: C:/test/vault');
      expect(text).toContain('📋 Top 7 Outstanding Tasks:');
      expect(text).toContain('📊 Summary:');
      expect(text).toContain('Total outstanding tasks: 2');
      expect(text).toContain('Sample Task 1');
      expect(text).toContain('Sample Task 2');
    });

    it('should handle create_task tool correctly', async () => {
      const taskData = {
        title: 'Test Task',
        area: 'Work',
        priority: 'High'
      };
      
      const response = await server.handleCreateTask(taskData);
      
      expect(response).toHaveProperty('content');
      expect(response.content[0]).toHaveProperty('type', 'text');
      expect(response.content[0].text).toContain('✅ Task "Test Task" created successfully!');
      expect(response.content[0].text).toContain('placeholder response');
    });

    it('should handle update_task tool correctly', async () => {
      const updates = {
        status: 'In Progress',
        priority: 'Medium'
      };
      
      const response = await server.handleUpdateTask('task-123', updates);
      
      expect(response).toHaveProperty('content');
      expect(response.content[0]).toHaveProperty('type', 'text');
      expect(response.content[0].text).toContain('✅ Task updated successfully!');
      expect(response.content[0].text).toContain('Updated fields: status, priority');
      expect(response.content[0].text).toContain('placeholder response');
    });

    it('should handle search_tasks tool correctly', async () => {
      const searchParams = {
        query: 'test query',
        limit: 5
      };
      
      const response = await server.handleSearchTasks(searchParams);
      
      expect(response).toHaveProperty('content');
      expect(response.content[0]).toHaveProperty('type', 'text');
      expect(response.content[0].text).toContain('🔍 Search Results for "test query"');
      expect(response.content[0].text).toContain('Found 2 tasks.');
      expect(response.content[0].text).toContain('placeholder response');
    });
  });

  describe('Response Format Consistency', () => {
    it('should return consistent response structure for all tools', async () => {
      const tools = [
        { name: 'scan_vault', handler: () => server.handleScanVault('C:/test/vault') },
        { name: 'create_task', handler: () => server.handleCreateTask({ title: 'Test' }) },
        { name: 'update_task', handler: () => server.handleUpdateTask('test-id', { status: 'Done' }) },
        { name: 'search_tasks', handler: () => server.handleSearchTasks({ query: 'test' }) }
      ];
      
      for (const tool of tools) {
        const response = await tool.handler();
        
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
  });

  describe('Input Handling', () => {
    it('should handle edge cases gracefully', async () => {
      // Test with empty vault path
      const emptyResponse = await server.handleScanVault('');
      expect(emptyResponse.content[0].text).toContain('🔍 Vault: ');
      
      // Test with very long vault path
      const longPath = 'C:/' + 'a'.repeat(100) + '/vault';
      const longResponse = await server.handleScanVault(longPath);
      expect(longResponse.content[0].text).toContain(longPath);
    });

    it('should handle special characters in input', async () => {
      const specialChars = {
        title: 'Task with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?',
        area: 'Area with spaces and symbols',
        priority: 'High'
      };
      
      const response = await server.handleCreateTask(specialChars);
      expect(response.content[0].text).toContain('✅ Task "Task with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?" created successfully!');
    });

    it('should handle null/undefined values gracefully', async () => {
      const response = await server.handleCreateTask({
        title: null,
        area: undefined,
        priority: 'Invalid'
      });
      
      expect(response.content[0].text).toContain('✅ Task "null" created successfully!');
    });
  });

  describe('Performance', () => {
    it('should handle multiple rapid requests', async () => {
      const promises = [];
      
      // Send 5 rapid requests
      for (let i = 0; i < 5; i++) {
        promises.push(server.handleScanVault(`C:/test/vault${i}`));
      }
      
      const responses = await Promise.all(promises);
      
      // All requests should complete successfully
      expect(responses).toHaveLength(5);
      responses.forEach(response => {
        expect(response).toHaveProperty('content');
        expect(response.content[0]).toHaveProperty('type', 'text');
      });
    });

    it('should maintain reasonable response times', async () => {
      const startTime = Date.now();
      await server.handleScanVault('C:/test/vault');
      const endTime = Date.now();
      
      const responseTime = endTime - startTime;
      
      // Response should be reasonably fast (under 100ms for placeholder data)
      expect(responseTime).toBeLessThan(100);
    });
  });

  describe('Data Consistency', () => {
    it('should return consistent sample data across calls', async () => {
      const response1 = await server.handleScanVault('C:/test/vault1');
      const response2 = await server.handleScanVault('C:/test/vault2');
      
      // Both responses should contain the same sample data structure
      expect(response1.content[0].text).toContain('Sample Task 1');
      expect(response1.content[0].text).toContain('Sample Task 2');
      expect(response2.content[0].text).toContain('Sample Task 1');
      expect(response2.content[0].text).toContain('Sample Task 2');
      
      // Both should show 2 tasks
      expect(response1.content[0].text).toContain('Total outstanding tasks: 2');
      expect(response2.content[0].text).toContain('Total outstanding tasks: 2');
    });
  });
});
