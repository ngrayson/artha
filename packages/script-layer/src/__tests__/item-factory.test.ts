import { ItemFactory } from '../utils/item-factory';
import { CreateTaskRequest, CreateEpicRequest, CreateAreaRequest, CreateResourceRequest } from '@artha/shared';

describe('ItemFactory', () => {
  let itemFactory: ItemFactory;
  const testRootPath = '/test/vault';

  beforeEach(() => {
    itemFactory = new ItemFactory(testRootPath);
  });

  describe('createItem', () => {
    it('should create a Task item successfully', async () => {
      const request: CreateTaskRequest = {
        type: 'Task',
        title: 'Test Task',
        status: 'To Do',
        priority: 'High',
        area: 'Work',
        tags: ['urgent', 'work'],
        content: 'This is a test task',
        dueDate: '2024-12-31',
        parentProjects: ['project-1']
      };

      const result = await itemFactory.createItem(request);

      expect(result.item).toBeValidVaultItem();
      expect(result.item.type).toBe('Task');
      expect(result.item.title).toBe('Test Task');
      expect(result.item.status).toBe('To Do');
      expect(result.item.priority).toBe('High');
      expect(result.item.area).toBe('Work');
      expect(result.item.tags).toEqual(['urgent', 'work']);
      expect(result.item.content).toBe('This is a test task');
      expect(result.item.dueDate).toBe('2024-12-31');
      expect(result.item.parentProjects).toEqual(['project-1']);
      expect(result.markdown).toBeTruthy();
      expect(result.filePath).toContain('_projects');
      expect(result.filePath).toContain('.md');
    });

    it('should create an Epic item successfully', async () => {
      const request: CreateEpicRequest = {
        type: 'Epic',
        title: 'Test Epic',
        status: 'Planning',
        area: 'Product',
        tags: ['product', 'planning'],
        content: 'This is a test epic',
        dueDate: '2024-12-31',
        image: 'epic-image.png'
      };

      const result = await itemFactory.createItem(request);

      expect(result.item).toBeValidVaultItem();
      expect(result.item.type).toBe('Epic');
      expect(result.item.title).toBe('Test Epic');
      expect(result.item.status).toBe('Planning');
      expect(result.item.area).toBe('Product');
      expect(result.item.tags).toEqual(['product', 'planning']);
      expect(result.item.content).toBe('This is a test epic');
      expect(result.item.dueDate).toBe('2024-12-31');
      expect(result.item.image).toBe('epic-image.png');
      expect(result.item.tasks).toEqual([]);
      expect(result.filePath).toContain('_projects');
    });

    it('should create an Area item successfully', async () => {
      const request: CreateAreaRequest = {
        type: 'Area',
        title: 'Test Area',
        status: 'Active',
        maintenance: 'Weekly',
        pinned: true,
        purpose: 'Test purpose',
        tags: ['area', 'test'],
        content: 'This is a test area'
      };

      const result = await itemFactory.createItem(request);

      expect(result.item).toBeValidVaultItem();
      expect(result.item.type).toBe('Area');
      expect(result.item.title).toBe('Test Area');
      expect(result.item.status).toBe('Active');
      expect(result.item.maintenance).toBe('Weekly');
      expect(result.item.pinned).toBe(true);
      expect(result.item.purpose).toBe('Test purpose');
      expect(result.item.tags).toEqual(['area', 'test']);
      expect(result.item.content).toBe('This is a test area');
      expect(result.item.activeProjects).toEqual([]);
      expect(result.item.currentFocus.primary).toBe('');
      expect(result.filePath).toContain('_areas');
    });

    it('should create a Resource item successfully', async () => {
      const request: CreateResourceRequest = {
        type: 'Resource',
        title: 'Test Resource',
        status: 'Active',
        pinned: false,
        areas: ['area-1', 'area-2'],
        purpose: 'Test resource purpose',
        contentOverview: 'Overview of the resource',
        keyTopics: ['topic1', 'topic2'],
        usageNotes: 'How to use this resource',
        maintenance: 'Monthly',
        tags: ['resource', 'test'],
        content: 'This is a test resource'
      };

      const result = await itemFactory.createItem(request);

      expect(result.item).toBeValidVaultItem();
      expect(result.item.type).toBe('Resource');
      expect(result.item.title).toBe('Test Resource');
      expect(result.item.status).toBe('Active');
      expect(result.item.pinned).toBe(false);
      expect(result.item.areas).toEqual(['area-1', 'area-2']);
      expect(result.item.purpose).toBe('Test resource purpose');
      expect(result.item.contentOverview).toBe('Overview of the resource');
      expect(result.item.keyTopics).toEqual(['topic1', 'topic2']);
      expect(result.item.usageNotes).toBe('How to use this resource');
      expect(result.item.maintenance).toBe('Monthly');
      expect(result.item.tags).toEqual(['resource', 'test']);
      expect(result.item.content).toBe('This is a test resource');
      expect(result.filePath).toContain('_resources');
    });

    it('should use default values when optional fields are not provided', async () => {
      const request: CreateTaskRequest = {
        type: 'Task',
        title: 'Minimal Task'
      };

      const result = await itemFactory.createItem(request);

      expect(result.item.status).toBe('To Do');
      expect(result.item.priority).toBe('Medium');
      expect(result.item.tags).toEqual([]);
      expect(result.item.content).toBe('');
      expect(result.item.area).toBe('');
      expect(result.item.parentProjects).toEqual([]);
      expect(result.item.dueDate).toBeUndefined();
    });

    it('should throw error for unknown item type', async () => {
      const request = {
        type: 'UnknownType',
        title: 'Test Item'
      } as any;

      await expect(itemFactory.createItem(request)).rejects.toThrow('Unknown item type: UnknownType');
    });
  });

  describe('createTemplateItem', () => {
    it('should create template Task item', () => {
      const item = itemFactory.createTemplateItem('Task', 'Template Task');

      expect(item).toBeValidVaultItem();
      expect(item.type).toBe('Task');
      expect(item.title).toBe('Template Task');
      expect(item.status).toBe('To Do');
      expect(item.priority).toBe('Medium');
      expect(item.tags).toEqual([]);
      expect(item.content).toBe('');
    });

    it('should create template Epic item', () => {
      const item = itemFactory.createTemplateItem('Epic', 'Template Epic');

      expect(item).toBeValidVaultItem();
      expect(item.type).toBe('Epic');
      expect(item.title).toBe('Template Epic');
      expect(item.status).toBe('Planning');
      expect(item.tasks).toEqual([]);
      expect(item.image).toBe('');
    });

    it('should create template Area item', () => {
      const item = itemFactory.createTemplateItem('Area', 'Template Area');

      expect(item).toBeValidVaultItem();
      expect(item.type).toBe('Area');
      expect(item.title).toBe('Template Area');
      expect(item.status).toBe('Active');
      expect(item.maintenance).toBe('Weekly');
      expect(item.pinned).toBe(false);
      expect(item.purpose).toBe('');
      expect(item.activeProjects).toEqual([]);
    });

    it('should create template Resource item', () => {
      const item = itemFactory.createTemplateItem('Resource', 'Template Resource');

      expect(item).toBeValidVaultItem();
      expect(item.type).toBe('Resource');
      expect(item.title).toBe('Template Resource');
      expect(item.status).toBe('Active');
      expect(item.pinned).toBe(false);
      expect(item.areas).toEqual([]);
      expect(item.purpose).toBe('');
      expect(item.contentOverview).toBe('');
      expect(item.keyTopics).toEqual([]);
      expect(item.usageNotes).toBe('');
      expect(item.maintenance).toBe('');
    });

    it('should throw error for unknown template type', () => {
      expect(() => itemFactory.createTemplateItem('UnknownType' as any, 'Test')).toThrow('Unknown item type: UnknownType');
    });
  });

  describe('cloneItem', () => {
    it('should clone a Task item with modifications', async () => {
      const originalItem = testUtils.createMockVaultItem('Task', {
        priority: 'Low',
        area: 'Original Area'
      });

      const modifications = {
        title: 'Cloned Task',
        priority: 'High',
        area: 'New Area'
      };

      const result = await itemFactory.cloneItem(originalItem, modifications);

      expect(result.item).toBeValidVaultItem();
      expect(result.item.type).toBe('Task');
      expect(result.item.title).toBe('Cloned Task');
      expect(result.item.priority).toBe('High');
      expect(result.item.area).toBe('New Area');
      expect(result.item.id).not.toBe(originalItem.id);
      expect(result.item.createdAt).not.toBe(originalItem.createdAt);
      expect(result.item.updatedAt).not.toBe(originalItem.updatedAt);
      expect(result.markdown).toBeTruthy();
      expect(result.filePath).toContain('_projects');
    });

    it('should clone an Epic item with modifications', async () => {
      const originalItem = testUtils.createMockVaultItem('Epic', {
        area: 'Original Area',
        image: 'original.png'
      });

      const modifications = {
        title: 'Cloned Epic',
        area: 'New Area',
        image: 'new.png'
      };

      const result = await itemFactory.cloneItem(originalItem, modifications);

      expect(result.item).toBeValidVaultItem();
      expect(result.item.type).toBe('Epic');
      expect(result.item.title).toBe('Cloned Epic');
      expect(result.item.area).toBe('New Area');
      expect(result.item.image).toBe('new.png');
      expect(result.item.id).not.toBe(originalItem.id);
    });
  });

  describe('validateItem', () => {
    it('should validate a valid Task item', () => {
      const item = testUtils.createMockVaultItem('Task', {
        priority: 'Medium',
        area: 'Work'
      });

      const result = itemFactory.validateItem(item);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should validate a valid Epic item', () => {
      const item = testUtils.createMockVaultItem('Epic', {
        area: 'Product',
        tasks: ['task-1', 'task-2']
      });

      const result = itemFactory.validateItem(item);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should validate a valid Area item', () => {
      const item = testUtils.createMockVaultItem('Area', {
        maintenance: 'Weekly',
        pinned: false,
        purpose: 'Test purpose',
        activeProjects: ['project-1'],
        currentFocus: {
          primary: 'Primary focus',
          secondary: 'Secondary focus',
          ongoing: ['ongoing-1']
        }
      });

      const result = itemFactory.validateItem(item);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should validate a valid Resource item', () => {
      const item = testUtils.createMockVaultItem('Resource', {
        pinned: true,
        areas: ['area-1'],
        purpose: 'Test purpose',
        contentOverview: 'Overview',
        keyTopics: ['topic1'],
        usageNotes: 'Usage notes',
        maintenance: 'Monthly'
      });

      const result = itemFactory.validateItem(item);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return error for unknown item type', () => {
      const item = {
        ...testUtils.createMockVaultItem('Task'),
        type: 'UnknownType'
      };

      const result = itemFactory.validateItem(item);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown item type: UnknownType');
    });
  });

  describe('ID generation', () => {
    it('should generate unique IDs for different items', async () => {
      const request1: CreateTaskRequest = {
        type: 'Task',
        title: 'Test Task 1'
      };

      const request2: CreateTaskRequest = {
        type: 'Task',
        title: 'Test Task 2'
      };

      const result1 = await itemFactory.createItem(request1);
      const result2 = await itemFactory.createItem(request2);

      expect(result1.item.id).not.toBe(result2.item.id);
      expect(result1.item.id).toMatch(/^task-test-task-1-/);
      expect(result2.item.id).toMatch(/^task-test-task-2-/);
    });

    it('should handle special characters in titles', async () => {
      const request: CreateTaskRequest = {
        type: 'Task',
        title: 'Task with Special Chars: @#$%^&*()'
      };

      const result = await itemFactory.createItem(request);

      expect(result.item.id).toMatch(/^task-task-with-special-chars-/);
      expect(result.item.id).not.toContain('@');
      expect(result.item.id).not.toContain('#');
      expect(result.item.id).not.toContain('$');
    });
  });

  describe('File path generation', () => {
    it('should generate correct file paths for different item types', async () => {
      const taskRequest: CreateTaskRequest = {
        type: 'Task',
        title: 'Test Task'
      };

      const areaRequest: CreateAreaRequest = {
        type: 'Area',
        title: 'Test Area',
        purpose: 'Test'
      };

      const resourceRequest: CreateResourceRequest = {
        type: 'Resource',
        title: 'Test Resource',
        purpose: 'Test',
        areas: ['area-1'],
        contentOverview: 'Test',
        keyTopics: ['topic1'],
        usageNotes: 'Test',
        maintenance: 'Monthly'
      };

      const taskResult = await itemFactory.createItem(taskRequest);
      const areaResult = await itemFactory.createItem(areaRequest);
      const resourceResult = await itemFactory.createItem(resourceRequest);

      expect(taskResult.filePath).toContain('_projects');
      expect(areaResult.filePath).toContain('_areas');
      expect(resourceResult.filePath).toContain('_resources');

      expect(taskResult.filePath).toContain('.md');
      expect(areaResult.filePath).toContain('.md');
      expect(resourceResult.filePath).toContain('.md');
    });

    it('should sanitize filenames properly', async () => {
      const request: CreateTaskRequest = {
        type: 'Task',
        title: 'File Name with Invalid Chars: <>"|?*'
      };

      const result = await itemFactory.createItem(request);

      expect(result.filePath).not.toContain('<');
      expect(result.filePath).not.toContain('>');
      expect(result.filePath).not.toContain('"');
      expect(result.filePath).not.toContain('|');
      expect(result.filePath).not.toContain('?');
      expect(result.filePath).not.toContain('*');
    });
  });
});
