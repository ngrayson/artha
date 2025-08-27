import * as fs from 'fs/promises';
import * as path from 'path';
import { VaultItem, VaultItemType } from '@artha/shared';
import { DIRECTORY_NAMES } from '@artha/shared';
import { generateMarkdown, applyTemplateVariables } from '@artha/shared';

export interface Template {
  name: string;
  type: string;
  content: string;
  variables: string[];
  description?: string;
}

export class TemplateManager {
  private rootPath: string;
  private templatesDir: string;
  private cache: Map<string, Template>;
  private defaultTemplates: Map<string, string>;

  constructor(rootPath: string) {
    this.rootPath = rootPath;
    this.templatesDir = path.join(rootPath, DIRECTORY_NAMES.TEMPLATES);
    this.cache = new Map();
    this.defaultTemplates = new Map();
    
    this.initializeDefaultTemplates();
  }

  /**
   * Get a template for a specific item type
   */
  async getTemplate(type: VaultItemType): Promise<Template> {
    // Check cache first
    if (this.cache.has(type)) {
      return this.cache.get(type)!;
    }

    // Try to load from file system
    const template = await this.loadTemplateFromFile(type);
    if (template) {
      this.cache.set(type, template);
      return template;
    }

    // Fall back to default template
    const defaultTemplate = this.getDefaultTemplate(type);
    this.cache.set(type, defaultTemplate);
    return defaultTemplate;
  }

  /**
   * Apply template to item data
   */
  applyTemplate(template: Template, item: VaultItem): string {
    // Extract variables from item
    const variables = this.extractVariables(item);
    
    // Apply template variables
    const content = applyTemplateVariables(template.content, variables);
    
    // Generate frontmatter
    const frontmatter = this.generateFrontmatter(item);
    
    // Combine into final markdown
    return generateMarkdown(frontmatter, content);
  }

  /**
   * Load template from file system
   */
  private async loadTemplateFromFile(type: VaultItemType): Promise<Template | null> {
    try {
      const templatePath = path.join(this.templatesDir, `${type.toLowerCase()}.md`);
      const content = await fs.readFile(templatePath, 'utf-8');
      
      // Parse template content
      const lines = content.split('\n');
      const variables: string[] = [];
      let description = '';
      
      // Extract variables and description from comments
      for (const line of lines) {
        if (line.startsWith('<!--')) {
          const comment = line.replace('<!--', '').replace('-->', '').trim();
          if (comment.startsWith('Variables:')) {
            const vars = comment.replace('Variables:', '').trim();
            variables.push(...vars.split(',').map(v => v.trim()));
          } else if (comment.startsWith('Description:')) {
            description = comment.replace('Description:', '').trim();
          }
        }
      }
      
      return {
        name: `${type} Template`,
        type,
        content,
        variables,
        description
      };
    } catch (error) {
      // Template file not found or unreadable
      return null;
    }
  }

  /**
   * Get default template for item type
   */
  private getDefaultTemplate(type: VaultItemType): Template {
    const content = this.defaultTemplates.get(type) || this.getBasicTemplate(type);
    
    return {
      name: `Default ${type} Template`,
      type,
      content,
      variables: this.getDefaultVariables(type),
      description: `Default template for ${type} items`
    };
  }

  /**
   * Initialize default templates
   */
  private initializeDefaultTemplates(): void {
    // Task template
    this.defaultTemplates.set('Task', `---
<!-- Variables: title, status, dueDate, parentProjects, area, priority, tags, createdAt, updatedAt -->
<!-- Description: Default template for Task items -->
Type: Task
Status: {{status}}
Due Date: {{dueDate}}
Parent Projects: {{parentProjects}}
Area: {{area}}
Priority: {{priority}}
Tags: {{tags}}
Created: {{createdAt}}
Updated: {{updatedAt}}
---

# {{title}}

## Status
{{status}}

## Details
- **Due Date**: {{dueDate}}
- **Area**: {{area}}
- **Priority**: {{priority}}
- **Tags**: {{tags}}

## Description
{{content}}

## Notes
- Created: {{createdAt}}
- Last Updated: {{updatedAt}}
`);

    // Epic template
    this.defaultTemplates.set('Epic', `---
<!-- Variables: title, status, dueDate, area, image, tasks, tags, createdAt, updatedAt -->
<!-- Description: Default template for Epic items -->
Type: Epic
Status: {{status}}
Due Date: {{dueDate}}
Area: {{area}}
Image: {{image}}
Tasks: {{tasks}}
Tags: {{tags}}
Created: {{createdAt}}
Updated: {{updatedAt}}
---

# {{title}}

## Status
{{status}}

## Details
- **Due Date**: {{dueDate}}
- **Area**: {{area}}
- **Image**: {{image}}

## Tasks
{{tasks}}

## Description
{{content}}

## Notes
- Created: {{createdAt}}
- Last Updated: {{updatedAt}}
`);

    // Area template
    this.defaultTemplates.set('Area', `---
<!-- Variables: title, status, maintenance, pinned, purpose, activeProjects, currentFocus, tags, createdAt, updatedAt -->
<!-- Description: Default template for Area items -->
Type: Area
Status: {{status}}
Maintenance: {{maintenance}}
Pinned: {{pinned}}
Purpose: {{purpose}}
Active Projects: {{activeProjects}}
Current Focus: {{currentFocus}}
Tags: {{tags}}
Created: {{createdAt}}
Updated: {{updatedAt}}
---

# {{title}}

## Status
{{status}}

## Purpose
{{purpose}}

## Maintenance
{{maintenance}}

## Current Focus
{{currentFocus}}

## Active Projects
{{activeProjects}}

## Description
{{content}}

## Notes
- Created: {{createdAt}}
- Last Updated: {{updatedAt}}
`);

    // Resource template
    this.defaultTemplates.set('Resource', `---
<!-- Variables: title, status, pinned, areas, tags, purpose, contentOverview, keyTopics, usageNotes, maintenance, createdAt, updatedAt -->
<!-- Description: Default template for Resource items -->
Type: Resource
Status: {{status}}
Pinned: {{pinned}}
Areas: {{areas}}
Tags: {{tags}}
Purpose: {{purpose}}
Content Overview: {{contentOverview}}
Key Topics: {{keyTopics}}
Usage Notes: {{usageNotes}}
Maintenance: {{maintenance}}
Created: {{createdAt}}
Updated: {{updatedAt}}
---

# {{title}}

## Status
{{status}}

## Purpose
{{purpose}}

## Content Overview
{{contentOverview}}

## Key Topics
{{keyTopics}}

## Usage Notes
{{usageNotes}}

## Maintenance
{{maintenance}}

## Areas
{{areas}}

## Description
{{content}}

## Notes
- Created: {{createdAt}}
- Last Updated: {{updatedAt}}
`);
  }

  /**
   * Get basic template as fallback
   */
  private getBasicTemplate(type: VaultItemType): string {
    return `---
Type: ${type}
Status: {{status}}
Tags: {{tags}}
Created: {{createdAt}}
Updated: {{updatedAt}}
---

# {{title}}

{{content}}

---
Created: {{createdAt}}
Last Updated: {{updatedAt}}
`;
  }

  /**
   * Get default variables for item type
   */
  private getDefaultVariables(type: VaultItemType): string[] {
    const baseVars = ['title', 'status', 'tags', 'createdAt', 'updatedAt', 'content'];
    
    switch (type) {
      case 'Task':
        return [...baseVars, 'dueDate', 'parentProjects', 'area', 'priority'];
      case 'Epic':
        return [...baseVars, 'dueDate', 'area', 'image', 'tasks'];
      case 'Area':
        return [...baseVars, 'maintenance', 'pinned', 'purpose', 'activeProjects', 'currentFocus'];
      case 'Resource':
        return [...baseVars, 'pinned', 'areas', 'purpose', 'contentOverview', 'keyTopics', 'usageNotes', 'maintenance'];
      default:
        return baseVars;
    }
  }

  /**
   * Extract variables from item
   */
  private extractVariables(item: VaultItem): Record<string, any> {
    const variables: Record<string, any> = {
      title: item.title,
      status: item.status,
      tags: item.tags.join(', '),
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      content: item.content || ''
    };

    // Add type-specific variables
    switch (item.type) {
      case 'Task':
        const task = item as any;
        variables.dueDate = task.dueDate || '';
        variables.parentProjects = (task.parentProjects || []).join(', ');
        variables.area = task.area || '';
        variables.priority = task.priority || '';
        break;
        
      case 'Epic':
        const epic = item as any;
        variables.dueDate = epic.dueDate || '';
        variables.area = epic.area || '';
        variables.image = epic.image || '';
        variables.tasks = (epic.tasks || []).join(', ');
        break;
        
      case 'Area':
        const area = item as any;
        variables.maintenance = area.maintenance || '';
        variables.pinned = area.pinned || false;
        variables.purpose = area.purpose || '';
        variables.activeProjects = (area.activeProjects || []).join(', ');
        variables.currentFocus = area.currentFocus?.primary || '';
        break;
        
      case 'Resource':
        const resource = item as any;
        variables.pinned = resource.pinned || false;
        variables.areas = (resource.areas || []).join(', ');
        variables.purpose = resource.purpose || '';
        variables.contentOverview = resource.contentOverview || '';
        variables.keyTopics = (resource.keyTopics || []).join(', ');
        variables.usageNotes = resource.usageNotes || '';
        variables.maintenance = resource.maintenance || '';
        break;
    }

    return variables;
  }

  /**
   * Generate frontmatter for item
   */
  private generateFrontmatter(item: VaultItem): Record<string, any> {
    const frontmatter: Record<string, any> = {
      Type: item.type,
      Status: item.status,
      Tags: item.tags,
      Created: item.createdAt,
      Updated: item.updatedAt
    };

    // Add type-specific frontmatter
    switch (item.type) {
      case 'Task':
        const task = item as any;
        if (task.dueDate) frontmatter['Due Date'] = task.dueDate;
        if (task.parentProjects?.length) frontmatter['Parent Projects'] = task.parentProjects;
        if (task.area) frontmatter['Area'] = task.area;
        if (task.priority) frontmatter['Priority'] = task.priority;
        break;
        
      case 'Epic':
        const epic = item as any;
        if (epic.dueDate) frontmatter['Due Date'] = epic.dueDate;
        if (epic.area) frontmatter['Area'] = epic.area;
        if (epic.image) frontmatter['Image'] = epic.image;
        if (epic.tasks?.length) frontmatter['Tasks'] = epic.tasks;
        break;
        
      case 'Area':
        const area = item as any;
        if (area.maintenance) frontmatter['Maintenance'] = area.maintenance;
        if (area.pinned !== undefined) frontmatter['Pinned'] = area.pinned;
        if (area.purpose) frontmatter['Purpose'] = area.purpose;
        if (area.activeProjects?.length) frontmatter['Active Projects'] = area.activeProjects;
        if (area.currentFocus) frontmatter['Current Focus'] = area.currentFocus;
        break;
        
      case 'Resource':
        const resource = item as any;
        if (resource.pinned !== undefined) frontmatter['Pinned'] = resource.pinned;
        if (resource.areas?.length) frontmatter['Areas'] = resource.areas;
        if (resource.purpose) frontmatter['Purpose'] = resource.purpose;
        if (resource.contentOverview) frontmatter['Content Overview'] = resource.contentOverview;
        if (resource.keyTopics?.length) frontmatter['Key Topics'] = resource.keyTopics;
        if (resource.usageNotes) frontmatter['Usage Notes'] = resource.usageNotes;
        if (resource.maintenance) frontmatter['Maintenance'] = resource.maintenance;
        break;
    }

    return frontmatter;
  }

  /**
   * Clear template cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cached template count
   */
  getCacheSize(): number {
    return this.cache.size;
  }
}
