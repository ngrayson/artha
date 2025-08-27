import { ItemFactory } from '../utils/item-factory';
import { CreateTaskRequest } from '@artha/shared';

describe('ItemFactory - Basic Tests', () => {
  let itemFactory: ItemFactory;
  const testRootPath = '/test/vault';

  beforeEach(() => {
    itemFactory = new ItemFactory(testRootPath);
  });

  describe('createItem', () => {
    it('should create a Task item with basic properties', async () => {
      const request: CreateTaskRequest = {
        type: 'Task',
        title: 'Test Task'
      };

      const result = await itemFactory.createItem(request);

      expect(result.item).toBeDefined();
      expect(result.item.id).toBeDefined();
      expect(result.item.type).toBe('Task');
      expect(result.item.title).toBe('Test Task');
      expect(result.item.status).toBe('To Do');
      expect(result.item.tags).toEqual([]);
      expect(result.item.content).toBe('');
      expect(result.item.createdAt).toBeDefined();
      expect(result.item.updatedAt).toBeDefined();
    });

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

  describe('createTemplateItem', () => {
    it('should create template Task item', () => {
      const item = itemFactory.createTemplateItem('Task', 'Template Task');

      expect(item).toBeDefined();
      expect(item.type).toBe('Task');
      expect(item.title).toBe('Template Task');
      expect(item.status).toBe('To Do');
      expect(item.tags).toEqual([]);
      expect(item.content).toBe('');
    });

    it('should create template Epic item', () => {
      const item = itemFactory.createTemplateItem('Epic', 'Template Epic');

      expect(item).toBeDefined();
      expect(item.type).toBe('Epic');
      expect(item.title).toBe('Template Epic');
      expect(item.status).toBe('Planning');
    });

    it('should create template Area item', () => {
      const item = itemFactory.createTemplateItem('Area', 'Template Area');

      expect(item).toBeDefined();
      expect(item.type).toBe('Area');
      expect(item.title).toBe('Template Area');
      expect(item.status).toBe('Active');
    });

    it('should create template Resource item', () => {
      const item = itemFactory.createTemplateItem('Resource', 'Template Resource');

      expect(item).toBeDefined();
      expect(item.type).toBe('Resource');
      expect(item.title).toBe('Template Resource');
      expect(item.status).toBe('Active');
    });
  });

  describe('validateItem', () => {
    it('should validate a valid Task item', () => {
      const item = itemFactory.createTemplateItem('Task', 'Test Task');
      const result = itemFactory.validateItem(item);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should validate a valid Epic item', () => {
      const item = itemFactory.createTemplateItem('Epic', 'Test Epic');
      const result = itemFactory.validateItem(item);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should validate a valid Area item', () => {
      const item = itemFactory.createTemplateItem('Area', 'Test Area');
      const result = itemFactory.validateItem(item);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should validate a valid Resource item', () => {
      const item = itemFactory.createTemplateItem('Resource', 'Test Resource');
      const result = itemFactory.validateItem(item);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe('file path generation', () => {
    it('should generate correct file paths for different item types', async () => {
      const taskRequest: CreateTaskRequest = {
        type: 'Task',
        title: 'Test Task'
      };

      const result = await itemFactory.createItem(taskRequest);

      expect(result.filePath).toContain('_projects');
      expect(result.filePath).toContain('.md');
      expect(result.filePath).toContain('test-task');
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

