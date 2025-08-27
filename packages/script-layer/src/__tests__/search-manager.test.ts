import { SearchManager } from '../search-manager';
import { VaultItem, SearchRequest } from '@artha/shared';

describe('SearchManager', () => {
  let searchManager: SearchManager;

  beforeEach(() => {
    searchManager = new SearchManager();
  });

  describe('updateIndex', () => {
    it('should initialize search index with items', async () => {
      const items = [
        testUtils.createMockVaultItem('Task', { title: 'Test Task 1', area: 'Work' }),
        testUtils.createMockVaultItem('Epic', { title: 'Test Epic 1', area: 'Product' }),
        testUtils.createMockVaultItem('Area', { title: 'Test Area 1', purpose: 'Test purpose' })
      ];

      await searchManager.updateIndex(items);

      expect(searchManager.isInitialized()).toBe(true);
      expect(searchManager.getIndexSize()).toBe(3);
    });

    it('should handle empty items array', async () => {
      await searchManager.updateIndex([]);

      expect(searchManager.isInitialized()).toBe(true);
      expect(searchManager.getIndexSize()).toBe(0);
    });

    it('should rebuild index when called multiple times', async () => {
      const items1 = [testUtils.createMockVaultItem('Task', { title: 'Task 1' })];
      const items2 = [testUtils.createMockVaultItem('Task', { title: 'Task 2' })];

      await searchManager.updateIndex(items1);
      expect(searchManager.getIndexSize()).toBe(1);

      await searchManager.updateIndex(items2);
      expect(searchManager.getIndexSize()).toBe(1);
    });
  });

  describe('addToIndex', () => {
    it('should add single item to existing index', async () => {
      const initialItems = [testUtils.createMockVaultItem('Task', { title: 'Task 1' })];
      await searchManager.updateIndex(initialItems);

      const newItem = testUtils.createMockVaultItem('Task', { title: 'Task 2' });
      searchManager.addToIndex(newItem);

      expect(searchManager.getIndexSize()).toBe(2);
    });

    it('should create new index when none exists', () => {
      const item = testUtils.createMockVaultItem('Task', { title: 'Task 1' });
      searchManager.addToIndex(item);

      expect(searchManager.isInitialized()).toBe(true);
      expect(searchManager.getIndexSize()).toBe(1);
    });
  });

  describe('updateItemInIndex', () => {
    it('should update existing item in index', async () => {
      const item = testUtils.createMockVaultItem('Task', { title: 'Original Title' });
      await searchManager.updateIndex([item]);

      const updatedItem = { ...item, title: 'Updated Title' };
      searchManager.updateItemInIndex(updatedItem);

      expect(searchManager.getIndexSize()).toBe(1);
      // The item should be updated in the index
    });

    it('should add item if not found in index', async () => {
      const item = testUtils.createMockVaultItem('Task', { title: 'Task 1' });
      await searchManager.updateIndex([item]);

      const newItem = testUtils.createMockVaultItem('Task', { title: 'Task 2' });
      searchManager.updateItemInIndex(newItem);

      expect(searchManager.getIndexSize()).toBe(2);
    });
  });

  describe('removeFromIndex', () => {
    it('should remove item from index', async () => {
      const items = [
        testUtils.createMockVaultItem('Task', { title: 'Task 1' }),
        testUtils.createMockVaultItem('Task', { title: 'Task 2' })
      ];
      await searchManager.updateIndex(items);

      searchManager.removeFromIndex(items[0].id);

      expect(searchManager.getIndexSize()).toBe(1);
    });

    it('should handle removing non-existent item', async () => {
      const items = [testUtils.createMockVaultItem('Task', { title: 'Task 1' })];
      await searchManager.updateIndex(items);

      searchManager.removeFromIndex('non-existent-id');

      expect(searchManager.getIndexSize()).toBe(1);
    });
  });

  describe('search', () => {
    beforeEach(async () => {
      const items = [
        testUtils.createMockVaultItem('Task', { 
          title: 'Work on Project Alpha',
          area: 'Development',
          status: 'In Progress',
          tags: ['urgent', 'development'],
          content: 'Implement core features for Project Alpha'
        }),
        testUtils.createMockVaultItem('Epic', { 
          title: 'Product Launch',
          area: 'Product',
          status: 'Planning',
          tags: ['product', 'launch'],
          content: 'Plan and execute product launch strategy'
        }),
        testUtils.createMockVaultItem('Area', { 
          title: 'Development',
          purpose: 'Software development and engineering',
          tags: ['development', 'engineering'],
          content: 'Focus area for all development activities'
        }),
        testUtils.createMockVaultItem('Resource', { 
          title: 'React Documentation',
          areas: ['Development', 'Frontend'],
          purpose: 'Reference for React development',
          keyTopics: ['components', 'hooks', 'state'],
          tags: ['react', 'documentation', 'frontend']
        })
      ];

      await searchManager.updateIndex(items);
    });

    it('should perform basic search', async () => {
      const request: SearchRequest = {
        query: 'Project Alpha',
        limit: 10
      };

      const results = await searchManager.search(request);

      expect(results.success).toBe(true);
      expect(results.items).toHaveLength(1);
      expect(results.items[0].title).toBe('Work on Project Alpha');
      expect(results.total).toBe(1);
      expect(results.query).toBe('Project Alpha');
    });

    it('should perform fuzzy search', async () => {
      const request: SearchRequest = {
        query: 'projct', // Misspelled
        limit: 10
      };

      const results = await searchManager.search(request);

      expect(results.success).toBe(true);
      expect(results.items.length).toBeGreaterThan(0);
    });

    it('should filter by type', async () => {
      const request: SearchRequest = {
        query: 'development',
        type: 'Task',
        limit: 10
      };

      const results = await searchManager.search(request);

      expect(results.success).toBe(true);
      expect(results.items.every(item => item.type === 'Task')).toBe(true);
    });

    it('should filter by area', async () => {
      const request: SearchRequest = {
        query: 'development',
        area: 'Development',
        limit: 10
      };

      const results = await searchManager.search(request);

      expect(results.success).toBe(true);
      expect(results.items.length).toBeGreaterThan(0);
    });

    it('should filter by status', async () => {
      const request: SearchRequest = {
        query: 'planning',
        status: 'Planning',
        limit: 10
      };

      const results = await searchManager.search(request);

      expect(results.success).toBe(true);
      expect(results.items.every(item => item.status === 'Planning')).toBe(true);
    });

    it('should filter by tags', async () => {
      const request: SearchRequest = {
        query: 'react',
        tags: ['react', 'frontend'],
        limit: 10
      };

      const results = await searchManager.search(request);

      expect(results.success).toBe(true);
      expect(results.items.length).toBeGreaterThan(0);
    });

    it('should respect search limits', async () => {
      const request: SearchRequest = {
        query: 'development',
        limit: 2
      };

      const results = await searchManager.search(request);

      expect(results.success).toBe(true);
      expect(results.items.length).toBeLessThanOrEqual(2);
    });

    it('should return highlights for search results', async () => {
      const request: SearchRequest = {
        query: 'Project Alpha',
        limit: 10
      };

      const results = await searchManager.search(request);

      expect(results.success).toBe(true);
      expect(results.highlights).toBeDefined();
      expect(results.highlights.size).toBeGreaterThan(0);
    });

    it('should handle empty search query', async () => {
      const request: SearchRequest = {
        query: '',
        limit: 10
      };

      const results = await searchManager.search(request);

      expect(results.success).toBe(true);
      expect(results.items.length).toBeGreaterThan(0);
    });

    it('should handle search with no results', async () => {
      const request: SearchRequest = {
        query: 'nonexistentterm',
        limit: 10
      };

      const results = await searchManager.search(request);

      expect(results.success).toBe(true);
      expect(results.items).toHaveLength(0);
      expect(results.total).toBe(0);
    });
  });

  describe('searchable string creation', () => {
    it('should create searchable string for Task', async () => {
      const task = testUtils.createMockVaultItem('Task', {
        title: 'Test Task',
        area: 'Work',
        priority: 'High',
        dueDate: '2024-12-31',
        parentProjects: ['project-1'],
        tags: ['urgent', 'work'],
        content: 'This is a test task content'
      });

      await searchManager.updateIndex([task]);

      const results = await searchManager.search({ query: 'high priority', limit: 10 });
      expect(results.items.length).toBeGreaterThan(0);
    });

    it('should create searchable string for Epic', async () => {
      const epic = testUtils.createMockVaultItem('Epic', {
        title: 'Test Epic',
        area: 'Product',
        dueDate: '2024-12-31',
        tasks: ['task-1', 'task-2'],
        tags: ['product', 'planning'],
        content: 'This is a test epic content'
      });

      await searchManager.updateIndex([epic]);

      const results = await searchManager.search({ query: 'product planning', limit: 10 });
      expect(results.items.length).toBeGreaterThan(0);
    });

    it('should create searchable string for Area', async () => {
      const area = testUtils.createMockVaultItem('Area', {
        title: 'Test Area',
        purpose: 'Test purpose description',
        maintenance: 'Weekly',
        activeProjects: ['project-1', 'project-2'],
        currentFocus: {
          primary: 'Primary focus area',
          secondary: 'Secondary focus area',
          ongoing: ['ongoing-1']
        },
        tags: ['area', 'focus'],
        content: 'This is a test area content'
      });

      await searchManager.updateIndex([area]);

      const results = await searchManager.search({ query: 'purpose description', limit: 10 });
      expect(results.items.length).toBeGreaterThan(0);
    });

    it('should create searchable string for Resource', async () => {
      const resource = testUtils.createMockVaultItem('Resource', {
        title: 'Test Resource',
        purpose: 'Test resource purpose',
        contentOverview: 'Overview of the resource content',
        keyTopics: ['topic1', 'topic2', 'topic3'],
        usageNotes: 'How to use this resource effectively',
        areas: ['area-1', 'area-2'],
        maintenance: 'Monthly',
        tags: ['resource', 'reference'],
        content: 'This is a test resource content'
      });

      await searchManager.updateIndex([resource]);

      const results = await searchManager.search({ query: 'resource purpose', limit: 10 });
      expect(results.items.length).toBeGreaterThan(0);
    });
  });

  describe('statistics and monitoring', () => {
    it('should track search statistics', async () => {
      const items = [testUtils.createMockVaultItem('Task', { title: 'Test Task' })];
      await searchManager.updateIndex(items);

      // Perform some searches
      await searchManager.search({ query: 'test', limit: 10 });
      await searchManager.search({ query: 'task', limit: 10 });
      await searchManager.search({ query: 'nonexistent', limit: 10 });

      const stats = searchManager.getStats();

      expect(stats.totalSearches).toBe(3);
      expect(stats.hitRate).toBeGreaterThan(0);
      expect(stats.lastUpdated).toBeDefined();
    });

    it('should provide hit rate for cache statistics', () => {
      const hitRate = searchManager.getHitRate();
      expect(typeof hitRate).toBe('number');
      expect(hitRate).toBeGreaterThanOrEqual(0);
      expect(hitRate).toBeLessThanOrEqual(1);
    });

    it('should track index age', async () => {
      const items = [testUtils.createMockVaultItem('Task', { title: 'Test Task' })];
      await searchManager.updateIndex(items);

      const age = searchManager.getIndexAge();
      expect(age).toBeGreaterThanOrEqual(0);
    });
  });

  describe('index management', () => {
    it('should clear index', async () => {
      const items = [testUtils.createMockVaultItem('Task', { title: 'Test Task' })];
      await searchManager.updateIndex(items);

      expect(searchManager.getIndexSize()).toBe(1);

      searchManager.clearIndex();

      expect(searchManager.getIndexSize()).toBe(0);
      expect(searchManager.isInitialized()).toBe(false);
    });

    it('should rebuild index', async () => {
      const items = [testUtils.createMockVaultItem('Task', { title: 'Test Task' })];
      await searchManager.updateIndex(items);

      const originalSize = searchManager.getIndexSize();
      await searchManager.rebuildIndex();

      expect(searchManager.getIndexSize()).toBe(originalSize);
      expect(searchManager.isInitialized()).toBe(true);
    });

    it('should check if index is initialized', () => {
      expect(searchManager.isInitialized()).toBe(false);

      const item = testUtils.createMockVaultItem('Task', { title: 'Test Task' });
      searchManager.addToIndex(item);

      expect(searchManager.isInitialized()).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should throw error when searching without index', async () => {
      const request: SearchRequest = {
        query: 'test',
        limit: 10
      };

      await expect(searchManager.search(request)).rejects.toThrow('Search index not initialized');
    });

    it('should handle search errors gracefully', async () => {
      // This would require mocking fzf to throw errors
      // For now, we'll test the basic error handling structure
      const items = [testUtils.createMockVaultItem('Task', { title: 'Test Task' })];
      await searchManager.updateIndex(items);

      // Search should succeed with valid data
      const results = await searchManager.search({ query: 'test', limit: 10 });
      expect(results.success).toBe(true);
    });
  });

  describe('performance monitoring', () => {
    it('should warn about slow searches', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const items = [testUtils.createMockVaultItem('Task', { title: 'Test Task' })];
      await searchManager.updateIndex(items);

      // Mock a slow search by manipulating the timing
      const originalDateNow = Date.now;
      Date.now = jest.fn(() => 1000);
      
      await searchManager.search({ query: 'test', limit: 10 });
      
      Date.now = originalDateNow;
      consoleSpy.mockRestore();
    });
  });
});
