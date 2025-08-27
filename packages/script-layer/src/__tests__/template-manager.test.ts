import { TemplateManager } from '../template-manager';
import { VaultItem } from '@artha/shared';

describe('TemplateManager', () => {
  let templateManager: TemplateManager;
  const testRootPath = '/test/vault';

  beforeEach(() => {
    templateManager = new TemplateManager(testRootPath);
  });

  describe('getTemplate', () => {
    it('should return Task template', async () => {
      const template = await templateManager.getTemplate('Task');

      expect(template).toBeDefined();
      expect(template).toContain('Type: Task');
      expect(template).toContain('Title: {{title}}');
      expect(template).toContain('Status: {{status}}');
      expect(template).toContain('Priority: {{priority}}');
      expect(template).toContain('Area: {{area}}');
      expect(template).toContain('Due Date: {{dueDate}}');
      expect(template).toContain('Parent Projects: {{parentProjects}}');
      expect(template).toContain('Tags: {{tags}}');
    });

    it('should return Epic template', async () => {
      const template = await templateManager.getTemplate('Epic');

      expect(template).toBeDefined();
      expect(template).toContain('Type: Epic');
      expect(template).toContain('Title: {{title}}');
      expect(template).toContain('Status: {{status}}');
      expect(template).toContain('Area: {{area}}');
      expect(template).toContain('Due Date: {{dueDate}}');
      expect(template).toContain('Image: {{image}}');
      expect(template).toContain('Tasks: {{tasks}}');
      expect(template).toContain('Tags: {{tags}}');
    });

    it('should return Area template', async () => {
      const template = await templateManager.getTemplate('Area');

      expect(template).toBeDefined();
      expect(template).toContain('Type: Area');
      expect(template).toContain('Title: {{title}}');
      expect(template).toContain('Status: {{status}}');
      expect(template).toContain('Maintenance: {{maintenance}}');
      expect(template).toContain('Pinned: {{pinned}}');
      expect(template).toContain('Purpose: {{purpose}}');
      expect(template).toContain('Active Projects: {{activeProjects}}');
      expect(template).toContain('Current Focus: {{currentFocus.primary}}');
      expect(template).toContain('Tags: {{tags}}');
    });

    it('should return Resource template', async () => {
      const template = await templateManager.getTemplate('Resource');

      expect(template).toBeDefined();
      expect(template).toContain('Type: Resource');
      expect(template).toContain('Title: {{title}}');
      expect(template).toContain('Status: {{status}}');
      expect(template).toContain('Pinned: {{pinned}}');
      expect(template).toContain('Areas: {{areas}}');
      expect(template).toContain('Purpose: {{purpose}}');
      expect(template).toContain('Content Overview: {{contentOverview}}');
      expect(template).toContain('Key Topics: {{keyTopics}}');
      expect(template).toContain('Usage Notes: {{usageNotes}}');
      expect(template).toContain('Maintenance: {{maintenance}}');
      expect(template).toContain('Tags: {{tags}}');
    });

    it('should throw error for unknown template type', async () => {
      await expect(templateManager.getTemplate('UnknownType' as any)).rejects.toThrow('Unknown template type: UnknownType');
    });
  });

  describe('applyTemplate', () => {
    it('should apply Task template variables correctly', () => {
      const template = testUtils.createMockTemplate('Task', `---
Type: Task
Title: {{title}}
Status: {{status}}
Priority: {{priority}}
Area: {{area}}
Due Date: {{dueDate}}
Parent Projects: {{parentProjects}}
Tags: {{tags}}
---

{{content}}`);

      const item = testUtils.createMockVaultItem('Task', {
        priority: 'High',
        area: 'Work',
        dueDate: '2024-12-31',
        parentProjects: ['project-1', 'project-2'],
        tags: ['urgent', 'work']
      });

      const result = templateManager.applyTemplate(template, item);

      expect(result).toContain('Title: Test Task');
      expect(result).toContain('Status: Active');
      expect(result).toContain('Priority: High');
      expect(result).toContain('Area: Work');
      expect(result).toContain('Due Date: 2024-12-31');
      expect(result).toContain('Parent Projects: project-1, project-2');
      expect(result).toContain('Tags: urgent, work');
      expect(result).toContain('This is a test task');
    });

    it('should apply Epic template variables correctly', () => {
      const template = testUtils.createMockTemplate('Epic', `---
Type: Epic
Title: {{title}}
Status: {{status}}
Area: {{area}}
Due Date: {{dueDate}}
Image: {{image}}
Tasks: {{tasks}}
Tags: {{tags}}
---

{{content}}`);

      const item = testUtils.createMockVaultItem('Epic', {
        area: 'Product',
        dueDate: '2024-12-31',
        image: 'epic-image.png',
        tasks: ['task-1', 'task-2']
      });

      const result = templateManager.applyTemplate(template, item);

      expect(result).toContain('Title: Test Epic');
      expect(result).toContain('Status: Active');
      expect(result).toContain('Area: Product');
      expect(result).toContain('Due Date: 2024-12-31');
      expect(result).toContain('Image: epic-image.png');
      expect(result).toContain('Tasks: task-1, task-2');
      expect(result).toContain('Tags: ');
      expect(result).toContain('This is a test epic');
    });

    it('should apply Area template variables correctly', () => {
      const template = testUtils.createMockTemplate('Area', `---
Type: Area
Title: {{title}}
Status: {{status}}
Maintenance: {{maintenance}}
Pinned: {{pinned}}
Purpose: {{purpose}}
Active Projects: {{activeProjects}}
Current Focus: {{currentFocus.primary}}
Tags: {{tags}}
---

{{content}}`);

      const item = testUtils.createMockVaultItem('Area', {
        maintenance: 'Weekly',
        pinned: true,
        purpose: 'Test purpose',
        activeProjects: ['project-1', 'project-2'],
        currentFocus: {
          primary: 'Primary focus',
          secondary: 'Secondary focus',
          ongoing: ['ongoing-1']
        }
      });

      const result = templateManager.applyTemplate(template, item);

      expect(result).toContain('Title: Test Area');
      expect(result).toContain('Status: Active');
      expect(result).toContain('Maintenance: Weekly');
      expect(result).toContain('Pinned: true');
      expect(result).toContain('Purpose: Test purpose');
      expect(result).toContain('Active Projects: project-1, project-2');
      expect(result).toContain('Current Focus: Primary focus');
      expect(result).toContain('Tags: ');
      expect(result).toContain('This is a test area');
    });

    it('should apply Resource template variables correctly', () => {
      const template = testUtils.createMockTemplate('Resource', `---
Type: Resource
Title: {{title}}
Status: {{status}}
Pinned: {{pinned}}
Areas: {{areas}}
Purpose: {{purpose}}
Content Overview: {{contentOverview}}
Key Topics: {{keyTopics}}
Usage Notes: {{usageNotes}}
Maintenance: {{maintenance}}
Tags: {{tags}}
---

{{content}}`);

      const item = testUtils.createMockVaultItem('Resource', {
        pinned: false,
        areas: ['area-1', 'area-2'],
        purpose: 'Test purpose',
        contentOverview: 'Overview of the resource',
        keyTopics: ['topic1', 'topic2'],
        usageNotes: 'How to use this resource',
        maintenance: 'Monthly'
      });

      const result = templateManager.applyTemplate(template, item);

      expect(result).toContain('Title: Test Resource');
      expect(result).toContain('Status: Active');
      expect(result).toContain('Pinned: false');
      expect(result).toContain('Areas: area-1, area-2');
      expect(result).toContain('Purpose: Test purpose');
      expect(result).toContain('Content Overview: Overview of the resource');
      expect(result).toContain('Key Topics: topic1, topic2');
      expect(result).toContain('Usage Notes: How to use this resource');
      expect(result).toContain('Maintenance: Monthly');
      expect(result).toContain('Tags: ');
      expect(result).toContain('This is a test resource');
    });

    it('should handle missing template variables gracefully', () => {
      const template = testUtils.createMockTemplate('Task', `---
Type: Task
Title: {{title}}
Status: {{status}}
Priority: {{priority}}
Area: {{area}}
Due Date: {{dueDate}}
Parent Projects: {{parentProjects}}
Tags: {{tags}}
---

{{content}}`);

      const item = testUtils.createMockVaultItem('Task');

      const result = templateManager.applyTemplate(template, item);

      expect(result).toContain('Title: Test Task');
      expect(result).toContain('Status: Active');
      expect(result).toContain('Priority: ');
      expect(result).toContain('Area: ');
      expect(result).toContain('Due Date: ');
      expect(result).toContain('Parent Projects: ');
      expect(result).toContain('Tags: ');
      expect(result).toContain('This is a test task');
    });

    it('should handle nested object properties', () => {
      const template = testUtils.createMockTemplate('Area', `---
Type: Area
Current Focus Primary: {{currentFocus.primary}}
Current Focus Secondary: {{currentFocus.secondary}}
Current Focus Ongoing: {{currentFocus.ongoing}}
---

Content`);

      const item = testUtils.createMockVaultItem('Area', {
        currentFocus: {
          primary: 'Primary focus',
          secondary: 'Secondary focus',
          ongoing: ['ongoing-1', 'ongoing-2']
        }
      });

      const result = templateManager.applyTemplate(template, item);

      expect(result).toContain('Current Focus Primary: Primary focus');
      expect(result).toContain('Current Focus Secondary: Secondary focus');
      expect(result).toContain('Current Focus Ongoing: ongoing-1, ongoing-2');
    });

    it('should handle array properties correctly', () => {
      const template = testUtils.createMockTemplate('Task', `---
Type: Task
Tags: {{tags}}
Parent Projects: {{parentProjects}}
---

Content`);

      const item = testUtils.createMockVaultItem('Task', {
        tags: ['urgent', 'work', 'important'],
        parentProjects: ['project-1', 'project-2', 'project-3']
      });

      const result = templateManager.applyTemplate(template, item);

      expect(result).toContain('Tags: urgent, work, important');
      expect(result).toContain('Parent Projects: project-1, project-2, project-3');
    });

    it('should handle boolean properties correctly', () => {
      const template = testUtils.createMockTemplate('Area', `---
Type: Area
Pinned: {{pinned}}
---

Content`);

      const item = testUtils.createMockVaultItem('Area', {
        pinned: true
      });

      const result = templateManager.applyTemplate(template, item);

      expect(result).toContain('Pinned: true');
    });
  });

  describe('template caching', () => {
    it('should cache templates after first load', async () => {
      // First call should load from file
      const template1 = await templateManager.getTemplate('Task');
      
      // Second call should use cached version
      const template2 = await templateManager.getTemplate('Task');
      
      expect(template1).toBe(template2);
    });

    it('should handle multiple template types independently', async () => {
      const taskTemplate = await templateManager.getTemplate('Task');
      const epicTemplate = await templateManager.getTemplate('Epic');
      const areaTemplate = await templateManager.getTemplate('Area');
      const resourceTemplate = await templateManager.getTemplate('Resource');

      expect(taskTemplate).not.toBe(epicTemplate);
      expect(taskTemplate).not.toBe(areaTemplate);
      expect(taskTemplate).not.toBe(resourceTemplate);
      expect(epicTemplate).not.toBe(areaTemplate);
      expect(epicTemplate).not.toBe(resourceTemplate);
      expect(areaTemplate).not.toBe(resourceTemplate);
    });
  });

  describe('template content validation', () => {
    it('should include all required frontmatter fields', async () => {
      const taskTemplate = await templateManager.getTemplate('Task');
      
      expect(taskTemplate.content).toContain('---');
      expect(taskTemplate.content).toContain('Type: Task');
      expect(taskTemplate.content).toContain('Title: {{title}}');
      expect(taskTemplate.content).toContain('Status: {{status}}');
      expect(taskTemplate.content).toContain('Tags: {{tags}}');
      expect(taskTemplate.content).toContain('---');
    });

    it('should include content placeholder', async () => {
      const taskTemplate = await templateManager.getTemplate('Task');
      
      expect(taskTemplate.content).toContain('{{content}}');
    });

    it('should have proper YAML frontmatter structure', async () => {
      const taskTemplate = await templateManager.getTemplate('Task');
      
      const lines = taskTemplate.content.split('\n');
      const frontmatterStart = lines.indexOf('---');
      const frontmatterEnd = lines.lastIndexOf('---');
      
      expect(frontmatterStart).toBeGreaterThanOrEqual(0);
      expect(frontmatterEnd).toBeGreaterThan(frontmatterStart);
      
      // Check that frontmatter is properly formatted
      const frontmatterLines = lines.slice(frontmatterStart + 1, frontmatterEnd);
      frontmatterLines.forEach((line: string) => {
        if (line.trim() && !line.startsWith('---')) {
          expect(line).toMatch(/^[A-Za-z\s]+:\s*{{[^}]+}}$/);
        }
      });
    });
  });

  describe('error handling', () => {
    it('should handle template loading errors gracefully', async () => {
      // This test would require mocking file system failures
      // For now, we'll test the error case for unknown types
      await expect(templateManager.getTemplate('UnknownType' as any)).rejects.toThrow();
    });

    it('should handle malformed templates gracefully', () => {
      const malformedTemplate = testUtils.createMockTemplate('Task', `---
Type: Task
Title: {{title}
Status: {{status}}
---

{{content}}`);

      const item = testUtils.createMockVaultItem('Task');

      // Should not throw error, just apply what it can
      const result = templateManager.applyTemplate(malformedTemplate, item);
      
      expect(result).toContain('Title: {{title}'); // Malformed variable not replaced
      expect(result).toContain('Status: Active'); // Valid variable replaced
    });
  });
});
