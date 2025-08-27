import { VaultItem, Task, Epic, Area, Resource, CreateItemRequest, CreateTaskRequest, CreateEpicRequest, CreateAreaRequest, CreateResourceRequest, VaultItemType } from '@artha/shared';
import { validateData } from '@artha/shared';
import { generateMarkdown } from '@artha/shared';
import { TaskSchema, EpicSchema, AreaSchema, ResourceSchema } from '@artha/shared';
import * as path from 'path';
import { DIRECTORY_NAMES, FILE_EXTENSIONS } from '@artha/shared';

export interface ItemCreationResult {
  item: VaultItem;
  markdown: string;
  filePath: string;
}

export class ItemFactory {
  private rootPath: string;

  constructor(rootPath: string) {
    this.rootPath = rootPath;
  }

  /**
   * Create a new vault item
   */
  async createItem(request: CreateItemRequest): Promise<ItemCreationResult> {
    let item: VaultItem;
    let schema: any;

    // Validate and create item based on type
    switch (request.type) {
      case 'Task':
        schema = TaskSchema;
        item = this.createTask(request as CreateTaskRequest);
        break;
      case 'Epic':
        schema = EpicSchema;
        item = this.createEpic(request as CreateEpicRequest);
        break;
      case 'Area':
        schema = AreaSchema;
        item = this.createArea(request as CreateAreaRequest);
        break;
      case 'Resource':
        schema = ResourceSchema;
        item = this.createResource(request as CreateResourceRequest);
        break;
      default:
        throw new Error(`Unknown item type: ${(request as any).type}`);
    }

    // Validate the created item
    const validationResult = validateData(schema, item);
    if (!validationResult.success) {
      throw new Error(`Validation failed: ${validationResult.errors.map(e => `${e.field}: ${e.message}`).join(', ')}`);
    }

    // Generate markdown content
    const markdown = generateMarkdown(item, item.content);

    // Determine file path
    const filePath = this.determineFilePath(item);

    return {
      item,
      markdown,
      filePath
    };
  }

  /**
   * Create a Task item
   */
  private createTask(request: CreateTaskRequest): Task {
    const now = new Date().toISOString();
    const id = this.generateId(request.title, 'Task');

    return {
      id,
      type: 'Task',
      title: request.title,
      status: request.status || 'To Do',
      tags: request.tags || [],
      content: request.content || '',
      createdAt: now,
      updatedAt: now,
      dueDate: request.dueDate,
      parentProjects: request.parentProjects || [],
      area: request.area || '',
      priority: request.priority || 'Medium'
    };
  }

  /**
   * Create an Epic item
   */
  private createEpic(request: CreateEpicRequest): Epic {
    const now = new Date().toISOString();
    const id = this.generateId(request.title, 'Epic');

    return {
      id,
      type: 'Epic',
      title: request.title,
      status: request.status || 'Planning',
      tags: request.tags || [],
      content: request.content || '',
      createdAt: now,
      updatedAt: now,
      dueDate: request.dueDate,
      area: request.area,
      image: request.image || '',
      tasks: []
    };
  }

  /**
   * Create an Area item
   */
  private createArea(request: CreateAreaRequest): Area {
    const now = new Date().toISOString();
    const id = this.generateId(request.title, 'Area');

    return {
      id,
      type: 'Area',
      title: request.title,
      status: request.status || 'Active',
      tags: request.tags || [],
      content: request.content || '',
      createdAt: now,
      updatedAt: now,
      maintenance: request.maintenance || 'Weekly',
      pinned: request.pinned || false,
      purpose: request.purpose,
      activeProjects: [],
      currentFocus: {
        primary: '',
        secondary: '',
        ongoing: []
      }
    };
  }

  /**
   * Create a Resource item
   */
  private createResource(request: CreateResourceRequest): Resource {
    const now = new Date().toISOString();
    const id = this.generateId(request.title, 'Resource');

    return {
      id,
      type: 'Resource',
      title: request.title,
      status: request.status || 'Active',
      tags: request.tags || [],
      content: request.content || '',
      createdAt: now,
      updatedAt: now,
      pinned: request.pinned || false,
      areas: request.areas,
      purpose: request.purpose,
      contentOverview: request.contentOverview,
      keyTopics: request.keyTopics,
      usageNotes: request.usageNotes,
      maintenance: request.maintenance
    };
  }

  /**
   * Generate a unique ID for an item
   */
  private generateId(title: string, type: string): string {
    // Create a base ID from title
    const baseId = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim();

    // Add type prefix and timestamp for uniqueness
    const timestamp = Date.now().toString(36);
    return `${type.toLowerCase()}-${baseId}-${timestamp}`;
  }

  /**
   * Determine the file path for an item
   */
  private determineFilePath(item: VaultItem): string {
    let directory: string;
    
    switch (item.type) {
      case 'Task':
      case 'Epic':
        directory = DIRECTORY_NAMES.PROJECTS;
        break;
      case 'Area':
        directory = DIRECTORY_NAMES.AREAS;
        break;
      case 'Resource':
        directory = DIRECTORY_NAMES.RESOURCES;
        break;
      default:
        const _exhaustiveCheck: never = item;
        throw new Error(`Unknown item type: ${(item as any).type}`);
    }

    // Create filename from title
    const filename = this.sanitizeFilename(item.title) + FILE_EXTENSIONS.MARKDOWN;
    return path.join(this.rootPath, directory, filename);
  }

  /**
   * Sanitize filename for filesystem compatibility
   */
  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/[<>:"/\\|?*]/g, '') // Remove invalid characters
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim()
      .substring(0, 200); // Limit length
  }

  /**
   * Create a copy of an existing item with modifications
   */
  async cloneItem(originalItem: VaultItem, modifications: Partial<VaultItem>): Promise<ItemCreationResult> {
    // Create a new item with the original's data plus modifications
    const clonedItem: VaultItem = {
      ...originalItem,
      ...modifications,
      id: this.generateId(
        modifications.title || originalItem.title,
        originalItem.type
      ),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as VaultItem;

    // Validate the cloned item
    let schema: any;
    switch (clonedItem.type) {
      case 'Task':
        schema = TaskSchema;
        break;
      case 'Epic':
        schema = EpicSchema;
        break;
      case 'Area':
        schema = AreaSchema;
        break;
      case 'Resource':
        schema = ResourceSchema;
        break;
      default:
        const _exhaustiveCheck: never = clonedItem;
        throw new Error(`Unknown item type: ${(clonedItem as any).type}`);
    }

    const validationResult = validateData(schema, clonedItem);
    if (!validationResult.success) {
      throw new Error(`Validation failed: ${validationResult.errors.map(e => `${e.field}: ${e.message}`).join(', ')}`);
    }

    // Generate markdown content
    const markdown = generateMarkdown(clonedItem, clonedItem.content);

    // Determine file path
    const filePath = this.determineFilePath(clonedItem);

    return {
      item: clonedItem,
      markdown,
      filePath
    };
  }

  /**
   * Create a template item for a specific type
   */
  createTemplateItem(type: VaultItemType, title: string): VaultItem {
    const now = new Date().toISOString();
    const id = this.generateId(title, type);

    switch (type) {
      case 'Task':
        return {
          id,
          type: 'Task',
          title,
          status: 'To Do',
          tags: [],
          content: '',
          createdAt: now,
          updatedAt: now,
          dueDate: undefined,
          parentProjects: [],
          area: '',
          priority: 'Medium'
        } as Task;

      case 'Epic':
        return {
          id,
          type: 'Epic',
          title,
          status: 'Planning',
          tags: [],
          content: '',
          createdAt: now,
          updatedAt: now,
          dueDate: undefined,
          area: '',
          image: '',
          tasks: []
        } as Epic;

      case 'Area':
        return {
          id,
          type: 'Area',
          title,
          status: 'Active',
          tags: [],
          content: '',
          createdAt: now,
          updatedAt: now,
          maintenance: 'Weekly',
          pinned: false,
          purpose: '',
          activeProjects: [],
          currentFocus: {
            primary: '',
            secondary: '',
            ongoing: []
          }
        } as Area;

      case 'Resource':
        return {
          id,
          type: 'Resource',
          title,
          status: 'Active',
          tags: [],
          content: '',
          createdAt: now,
          updatedAt: now,
          pinned: false,
          areas: [],
          purpose: '',
          contentOverview: '',
          keyTopics: [],
          usageNotes: '',
          maintenance: ''
        } as Resource;

      default:
        throw new Error(`Unknown item type: ${type}`);
    }
  }

  /**
   * Validate an existing item
   */
  validateItem(item: VaultItem): { success: boolean; error?: string } {
    try {
      let schema: any;
      
      switch (item.type) {
        case 'Task':
          schema = TaskSchema;
          break;
        case 'Epic':
          schema = EpicSchema;
          break;
        case 'Area':
          schema = AreaSchema;
          break;
        case 'Resource':
          schema = ResourceSchema;
          break;
        default:
          const _exhaustiveCheck: never = item;
          return { success: false, error: `Unknown item type: ${(item as any).type}` };
      }

      const result = validateData(schema, item);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown validation error'
      };
    }
  }
}
