import { VaultManager } from '../vault-manager';
import { CreateTaskRequest, CreateEpicRequest, CreateAreaRequest, CreateResourceRequest, UpdateItemRequest, SearchRequest, ListItemsRequest } from '@artha/shared';

describe('VaultManager', () => {
  let vaultManager: VaultManager;
  const testRootPath = '/test/vault';

  beforeEach(() => {
    vaultManager = new VaultManager({
      rootPath: testRootPath,
      autoScan: false,
      cacheEnabled: true,
      maxCacheSize: 100
    });
  });

  describe('initialization', () => {
    it('should initialize with default options', () => {
      const manager = new VaultManager({ rootPath: testRootPath });

      expect(manager).toBeDefined();
      expect(manager.getCacheStats().maxSize).toBe(1000);
      expect(manager.getCacheStats().size).toBe(0);
    });

    it('should initialize with custom options', () => {
      const manager = new VaultManager({
        rootPath: testRootPath,
        autoScan: false,
        cacheEnabled: false,
        maxCacheSize: 500
      });

      expect(manager).toBeDefined();
      expect(manager.getCacheStats().maxSize).toBe(500);
    });
  });

  describe('scanVault', () => {
    it('should scan vault and populate cache', async () => {
      // Mock the vault scanner to return test items
      const mockItems = [
        testUtils.createMockVaultItem('Task', { title: 'Test Task 1' }),
        testUtils.createMockVaultItem('Epic', { title: 'Test Epic 1' }),
        testUtils.createMockVaultItem('Area', { title: 'Test Area 1' })
      ];

      // Mock the vault scanner methods
      jest.spyOn(vaultManager as any, 'vaultScanner', 'get').mockReturnValue({
        scanAllItems: jest.fn().mockResolvedValue(mockItems)
      });

      await vaultManager.scanVault();

      const cacheStats = vaultManager.getCacheStats();
      expect(cacheStats.size).toBe(3);
    });

    it('should handle scan errors gracefully', async () => {
      // Mock the vault scanner to throw an error
      jest.spyOn(vaultManager as any, 'vaultScanner', 'get').mockReturnValue({
        scanAllItems: jest.fn().mockRejectedValue(new Error('Scan failed'))
      });

      await expect(vaultManager.scanVault()).rejects.toThrow('Vault scan failed: Scan failed');
    });
  });

  describe('createItem', () => {
    it('should create a Task item successfully', async () => {
      const request: CreateTaskRequest = {
        type: 'Task',
        title: 'New Test Task',
        status: 'To Do',
        priority: 'High',
        area: 'Work',
        tags: ['urgent', 'work'],
        content: 'This is a new test task',
        dueDate: '2024-12-31',
        parentProjects: ['project-1']
      };

      const result = await vaultManager.createItem(request);

      expect(result.success).toBe(true);
      expect(result.item).toBeDefined();
      expect(result.item.type).toBe('Task');
      expect(result.item.title).toBe('New Test Task');
      expect(result.item.status).toBe('To Do');
      expect(result.item.priority).toBe('High');
      expect(result.item.area).toBe('Work');
      expect(result.item.tags).toEqual(['urgent', 'work']);
      expect(result.item.content).toBe('This is a new test task');
      expect(result.item.dueDate).toBe('2024-12-31');
      expect(result.item.parentProjects).toEqual(['project-1']);
    });

    it('should create an Epic item successfully', async () => {
      const request: CreateEpicRequest = {
        type: 'Epic',
        title: 'New Test Epic',
        status: 'Planning',
        area: 'Product',
        tags: ['product', 'planning'],
        content: 'This is a new test epic',
        dueDate: '2024-12-31',
        image: 'epic-image.png'
      };

      const result = await vaultManager.createItem(request);

      expect(result.success).toBe(true);
      expect(result.item).toBeDefined();
      expect(result.item.type).toBe('Epic');
      expect(result.item.title).toBe('New Test Epic');
      expect(result.item.status).toBe('Planning');
      expect(result.item.area).toBe('Product');
      expect(result.item.tags).toEqual(['product', 'planning']);
      expect(result.item.content).toBe('This is a new test epic');
      expect(result.item.dueDate).toBe('2024-12-31');
      expect(result.item.image).toBe('epic-image.png');
      expect(result.item.tasks).toEqual([]);
    });

    it('should create an Area item successfully', async () => {
      const request: CreateAreaRequest = {
        type: 'Area',
        title: 'New Test Area',
        status: 'Active',
        maintenance: 'Weekly',
        pinned: true,
        purpose: 'Test purpose',
        tags: ['area', 'test'],
        content: 'This is a new test area'
      };

      const result = await vaultManager.createItem(request);

      expect(result.success).toBe(true);
      expect(result.item).toBeDefined();
      expect(result.item.type).toBe('Area');
      expect(result.item.title).toBe('New Test Area');
      expect(result.item.status).toBe('Active');
      expect(result.item.maintenance).toBe('Weekly');
      expect(result.item.pinned).toBe(true);
      expect(result.item.purpose).toBe('Test purpose');
      expect(result.item.tags).toEqual(['area', 'test']);
      expect(result.item.content).toBe('This is a new test area');
    });

    it('should create a Resource item successfully', async () => {
      const request: CreateResourceRequest = {
        type: 'Resource',
        title: 'New Test Resource',
        status: 'Active',
        pinned: false,
        areas: ['area-1', 'area-2'],
        purpose: 'Test resource purpose',
        contentOverview: 'Overview of the resource',
        keyTopics: ['topic1', 'topic2'],
        usageNotes: 'How to use this resource',
        maintenance: 'Monthly',
        tags: ['resource', 'test'],
        content: 'This is a new test resource'
      };

      const result = await vaultManager.createItem(request);

      expect(result.success).toBe(true);
      expect(result.item).toBeDefined();
      expect(result.item.type).toBe('Resource');
      expect(result.item.title).toBe('New Test Resource');
      expect(result.item.status).toBe('Active');
      expect(result.item.pinned).toBe(false);
      expect(result.item.areas).toEqual(['area-1', 'area-2']);
      expect(result.item.purpose).toBe('Test resource purpose');
      expect(result.item.contentOverview).toBe('Overview of the resource');
      expect(result.item.keyTopics).toEqual(['topic1', 'topic2']);
      expect(result.item.usageNotes).toBe('How to use this resource');
      expect(result.item.maintenance).toBe('Monthly');
      expect(result.item.tags).toEqual(['resource', 'test']);
      expect(result.item.content).toBe('This is a new test resource');
    });

    it('should handle creation errors gracefully', async () => {
      // Mock the item factory to throw an error
      jest.spyOn(vaultManager as any, 'itemFactory', 'get').mockReturnValue({
        createItem: jest.fn().mockRejectedValue(new Error('Creation failed'))
      });

      const request: CreateTaskRequest = {
        type: 'Task',
        title: 'Failing Task'
      };

      const result = await vaultManager.createItem(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to create item: Creation failed');
    });
  });

  describe('getItem', () => {
    it('should retrieve item from cache when available', async () => {
      const mockItem = testUtils.createMockVaultItem('Task', { title: 'Cached Task' });
      
      // Mock the cache to return the item
      jest.spyOn(vaultManager as any, 'cache', 'get').mockReturnValue({
        has: jest.fn().mockReturnValue(true),
        get: jest.fn().mockReturnValue(mockItem)
      });

      const result = await vaultManager.getItem('test-task-1');

      expect(result.success).toBe(true);
      expect(result.item).toBe(mockItem);
    });

    it('should retrieve item from vault when not in cache', async () => {
      const mockItem = testUtils.createMockVaultItem('Task', { title: 'Vault Task' });
      
      // Mock the cache to not have the item
      jest.spyOn(vaultManager as any, 'cache', 'get').mockReturnValue({
        has: jest.fn().mockReturnValue(false),
        set: jest.fn()
      });

      // Mock the vault scanner to return the item
      jest.spyOn(vaultManager as any, 'vaultScanner', 'get').mockReturnValue({
        findItemById: jest.fn().mockResolvedValue(mockItem)
      });

      const result = await vaultManager.getItem('test-task-1');

      expect(result.success).toBe(true);
      expect(result.item).toBe(mockItem);
    });

    it('should return error when item not found', async () => {
      // Mock the cache to not have the item
      jest.spyOn(vaultManager as any, 'cache', 'get').mockReturnValue({
        has: jest.fn().mockReturnValue(false)
      });

      // Mock the vault scanner to return null
      jest.spyOn(vaultManager as any, 'vaultScanner', 'get').mockReturnValue({
        findItemById: jest.fn().mockResolvedValue(null)
      });

      const result = await vaultManager.getItem('non-existent-id');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Item not found: non-existent-id');
    });

    it('should handle retrieval errors gracefully', async () => {
      // Mock the cache to not have the item
      jest.spyOn(vaultManager as any, 'cache', 'get').mockReturnValue({
        has: jest.fn().mockReturnValue(false)
      });

      // Mock the vault scanner to throw an error
      jest.spyOn(vaultManager as any, 'vaultScanner', 'get').mockReturnValue({
        findItemById: jest.fn().mockRejectedValue(new Error('Retrieval failed'))
      });

      const result = await vaultManager.getItem('test-task-1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to get item: Retrieval failed');
    });
  });

  describe('updateItem', () => {
    it('should update an existing item successfully', async () => {
      const existingItem = testUtils.createMockVaultItem('Task', { 
        title: 'Original Title',
        status: 'To Do',
        priority: 'Medium'
      });

      const updateRequest: UpdateItemRequest = {
        id: existingItem.id,
        updates: {
          title: 'Updated Title',
          status: 'In Progress',
          priority: 'High'
        }
      };

      // Mock getItem to return the existing item
      jest.spyOn(vaultManager, 'getItem').mockResolvedValue({
        success: true,
        item: existingItem
      });

      // Mock template manager
      jest.spyOn(vaultManager as any, 'templateManager', 'get').mockReturnValue({
        getTemplate: jest.fn().mockResolvedValue('Template content'),
        applyTemplate: jest.fn().mockReturnValue('Updated content')
      });

      // Mock vault scanner to find file path
      jest.spyOn(vaultManager as any, 'vaultScanner', 'get').mockReturnValue({
        findFilePathById: jest.fn().mockResolvedValue('/test/path/file.md')
      });

      const result = await vaultManager.updateItem(updateRequest);

      expect(result.success).toBe(true);
      expect(result.item).toBeDefined();
      expect(result.item.title).toBe('Updated Title');
      expect(result.item.status).toBe('In Progress');
      expect(result.item.priority).toBe('High');
      expect(result.item.updatedAt).not.toBe(existingItem.updatedAt);
    });

    it('should return error when item not found for update', async () => {
      const updateRequest: UpdateItemRequest = {
        id: 'non-existent-id',
        updates: { title: 'Updated Title' }
      };

      // Mock getItem to return error
      jest.spyOn(vaultManager, 'getItem').mockResolvedValue({
        success: false,
        error: 'Item not found'
      });

      const result = await vaultManager.updateItem(updateRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Item not found');
    });

    it('should return error when file path not found', async () => {
      const existingItem = testUtils.createMockVaultItem('Task', { title: 'Original Title' });
      const updateRequest: UpdateItemRequest = {
        id: existingItem.id,
        updates: { title: 'Updated Title' }
      };

      // Mock getItem to return the existing item
      jest.spyOn(vaultManager, 'getItem').mockResolvedValue({
        success: true,
        item: existingItem
      });

      // Mock template manager
      jest.spyOn(vaultManager as any, 'templateManager', 'get').mockReturnValue({
        getTemplate: jest.fn().mockResolvedValue('Template content'),
        applyTemplate: jest.fn().mockReturnValue('Updated content')
      });

      // Mock vault scanner to not find file path
      jest.spyOn(vaultManager as any, 'vaultScanner', 'get').mockReturnValue({
        findFilePathById: jest.fn().mockResolvedValue(null)
      });

      const result = await vaultManager.updateItem(updateRequest);

      expect(result.success).toBe(false);
      expect(result.error).toContain('File not found for item');
    });
  });

  describe('deleteItem', () => {
    it('should delete an existing item successfully', async () => {
      // Mock vault scanner to find file path
      jest.spyOn(vaultManager as any, 'vaultScanner', 'get').mockReturnValue({
        findFilePathById: jest.fn().mockResolvedValue('/test/path/file.md')
      });

      const result = await vaultManager.deleteItem('test-task-1');

      expect(result.success).toBe(true);
    });

    it('should return error when file path not found for deletion', async () => {
      // Mock vault scanner to not find file path
      jest.spyOn(vaultManager as any, 'vaultScanner', 'get').mockReturnValue({
        findFilePathById: jest.fn().mockResolvedValue(null)
      });

      const result = await vaultManager.deleteItem('non-existent-id');

      expect(result.success).toBe(false);
      expect(result.error).toContain('File not found for item');
    });
  });

  describe('searchItems', () => {
    it('should perform search successfully', async () => {
      const mockSearchResults = {
        items: [testUtils.createMockVaultItem('Task', { title: 'Search Result Task' })],
        total: 1
      };

      // Mock search manager
      jest.spyOn(vaultManager as any, 'searchManager', 'get').mockReturnValue({
        search: jest.fn().mockResolvedValue(mockSearchResults)
      });

      const request: SearchRequest = {
        query: 'search term',
        limit: 10
      };

      const result = await vaultManager.searchItems(request);

      expect(result.success).toBe(true);
      expect(result.items).toEqual(mockSearchResults.items);
      expect(result.total).toBe(mockSearchResults.total);
    });

    it('should handle search errors gracefully', async () => {
      // Mock search manager to throw error
      jest.spyOn(vaultManager as any, 'searchManager', 'get').mockReturnValue({
        search: jest.fn().mockRejectedValue(new Error('Search failed'))
      });

      const request: SearchRequest = {
        query: 'search term',
        limit: 10
      };

      const result = await vaultManager.searchItems(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Search failed: Search failed');
      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('listItems', () => {
    it('should list items with filtering and pagination', async () => {
      const mockItems = [
        testUtils.createMockVaultItem('Task', { title: 'Task 1', status: 'Active' }),
        testUtils.createMockVaultItem('Task', { title: 'Task 2', status: 'Completed' }),
        testUtils.createMockVaultItem('Epic', { title: 'Epic 1', status: 'Planning' })
      ];

      // Mock vault scanner
      jest.spyOn(vaultManager as any, 'vaultScanner', 'get').mockReturnValue({
        scanAllItems: jest.fn().mockResolvedValue(mockItems)
      });

      const request: ListItemsRequest = {
        type: 'Task',
        status: 'Active',
        limit: 10,
        offset: 0,
        sortBy: 'title',
        sortOrder: 'asc'
      };

      const result = await vaultManager.listItems(request);

      expect(result.success).toBe(true);
      expect(result.items.length).toBeGreaterThan(0);
      expect(result.total).toBeGreaterThan(0);
      expect(result.hasMore).toBeDefined();
    });

    it('should handle listing errors gracefully', async () => {
      // Mock vault scanner to throw error
      jest.spyOn(vaultManager as any, 'vaultScanner', 'get').mockReturnValue({
        scanAllItems: jest.fn().mockRejectedValue(new Error('Listing failed'))
      });

      const request: ListItemsRequest = {
        limit: 10,
        offset: 0
      };

      const result = await vaultManager.listItems(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to list items: Listing failed');
      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.hasMore).toBe(false);
    });
  });

  describe('utility methods', () => {
    it('should get items by type', async () => {
      const mockItems = [
        testUtils.createMockVaultItem('Task', { title: 'Task 1' }),
        testUtils.createMockVaultItem('Task', { title: 'Task 2' }),
        testUtils.createMockVaultItem('Epic', { title: 'Epic 1' })
      ];

      // Mock vault scanner
      jest.spyOn(vaultManager as any, 'vaultScanner', 'get').mockReturnValue({
        scanAllItems: jest.fn().mockResolvedValue(mockItems)
      });

      const tasks = await vaultManager.getItemsByType('Task');

      expect(tasks).toHaveLength(2);
      expect(tasks.every(item => item.type === 'Task')).toBe(true);
    });

    it('should get items by area', async () => {
      const mockItems = [
        testUtils.createMockVaultItem('Task', { title: 'Task 1', area: 'Work' }),
        testUtils.createMockVaultItem('Epic', { title: 'Epic 1', area: 'Work' }),
        testUtils.createMockVaultItem('Task', { title: 'Task 2', area: 'Personal' })
      ];

      // Mock vault scanner
      jest.spyOn(vaultManager as any, 'vaultScanner', 'get').mockReturnValue({
        scanAllItems: jest.fn().mockResolvedValue(mockItems)
      });

      const workItems = await vaultManager.getItemsByArea('Work');

      expect(workItems).toHaveLength(2);
      expect(workItems.every(item => 
        item.type === 'Task' ? (item as any).area === 'Work' : 
        item.type === 'Epic' ? (item as any).area === 'Work' : false
      )).toBe(true);
    });

    it('should get items by status', async () => {
      const mockItems = [
        testUtils.createMockVaultItem('Task', { title: 'Task 1', status: 'Active' }),
        testUtils.createMockVaultItem('Task', { title: 'Task 2', status: 'Completed' }),
        testUtils.createMockVaultItem('Epic', { title: 'Epic 1', status: 'Active' })
      ];

      // Mock vault scanner
      jest.spyOn(vaultManager as any, 'vaultScanner', 'get').mockReturnValue({
        scanAllItems: jest.fn().mockResolvedValue(mockItems)
      });

      const activeItems = await vaultManager.getItemsByStatus('Active');

      expect(activeItems).toHaveLength(2);
      expect(activeItems.every(item => item.status === 'Active')).toBe(true);
    });

    it('should get items by tags', async () => {
      const mockItems = [
        testUtils.createMockVaultItem('Task', { title: 'Task 1', tags: ['urgent', 'work'] }),
        testUtils.createMockVaultItem('Task', { title: 'Task 2', tags: ['personal'] }),
        testUtils.createMockVaultItem('Epic', { title: 'Epic 1', tags: ['urgent', 'product'] })
      ];

      // Mock vault scanner
      jest.spyOn(vaultManager as any, 'vaultScanner', 'get').mockReturnValue({
        scanAllItems: jest.fn().mockResolvedValue(mockItems)
      });

      const urgentItems = await vaultManager.getItemsByTags(['urgent']);

      expect(urgentItems).toHaveLength(2);
      expect(urgentItems.every(item => item.tags.includes('urgent'))).toBe(true);
    });
  });

  describe('cache management', () => {
    it('should provide cache statistics', () => {
      const stats = vaultManager.getCacheStats();

      expect(stats.size).toBeDefined();
      expect(stats.maxSize).toBeDefined();
      expect(stats.hitRate).toBeDefined();
      expect(typeof stats.size).toBe('number');
      expect(typeof stats.maxSize).toBe('number');
      expect(typeof stats.hitRate).toBe('number');
    });

    it('should clear cache', () => {
      vaultManager.clearCache();

      const stats = vaultManager.getCacheStats();
      expect(stats.size).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should handle file system errors gracefully', async () => {
      // Mock file system operations to throw errors
      jest.spyOn(vaultManager as any, 'itemFactory', 'get').mockReturnValue({
        createItem: jest.fn().mockResolvedValue({
          item: testUtils.createMockVaultItem('Task'),
          markdown: 'Content',
          filePath: '/test/path/file.md'
        })
      });

      // Mock fs.writeFile to throw error
      const fs = require('fs/promises');
      jest.spyOn(fs, 'writeFile').mockRejectedValue(new Error('Write failed'));

      const request: CreateTaskRequest = {
        type: 'Task',
        title: 'Failing Task'
      };

      const result = await vaultManager.createItem(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to create item: Write failed');
    });
  });
});
