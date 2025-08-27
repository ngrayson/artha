import * as fs from 'fs/promises';
import * as path from 'path';
import { VaultItem, Task, Epic, Area, Resource } from '@artha/shared';
import { DIRECTORY_NAMES, FILE_EXTENSIONS } from '@artha/shared';
import { parseMarkdown, extractTitle } from '@artha/shared';

export interface ScannedItem {
  item: VaultItem;
  filePath: string;
  lastModified: Date;
}

export class VaultScanner {
  private rootPath: string;
  private cache: Map<string, ScannedItem>;
  private lastScanTime: Date | null = null;

  constructor(rootPath: string) {
    this.rootPath = rootPath;
    this.cache = new Map();
  }

  /**
   * Scan all items in the vault
   */
  async scanAllItems(): Promise<VaultItem[]> {
    try {
      const items: VaultItem[] = [];
      
      // Scan each directory type
      const projects = await this.scanDirectory(DIRECTORY_NAMES.PROJECTS, ['Task', 'Epic']);
      const areas = await this.scanDirectory(DIRECTORY_NAMES.AREAS, ['Area']);
      const resources = await this.scanDirectory(DIRECTORY_NAMES.RESOURCES, ['Resource']);

      items.push(...projects, ...areas, ...resources);
      
      // Update cache
      this.updateCache(items);
      this.lastScanTime = new Date();
      
      return items;
    } catch (error) {
      console.error('Failed to scan vault:', error);
      throw new Error(`Vault scan failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find an item by ID
   */
  async findItemById(id: string): Promise<VaultItem | null> {
    // Check cache first
    if (this.cache.has(id)) {
      return this.cache.get(id)!.item;
    }

    // Scan all items if cache is empty
    if (this.cache.size === 0) {
      await this.scanAllItems();
      return this.cache.get(id)?.item ?? null;
    }

    return null;
  }

  /**
   * Find file path by item ID
   */
  async findFilePathById(id: string): Promise<string | null> {
    // Check cache first
    if (this.cache.has(id)) {
      return this.cache.get(id)!.filePath;
    }

    // Scan all items if cache is empty
    if (this.cache.size === 0) {
      await this.scanAllItems();
      return this.cache.get(id)?.filePath ?? null;
    }

    return null;
  }

  /**
   * Scan a specific directory for items of given types
   */
  private async scanDirectory(dirName: string, allowedTypes: string[]): Promise<VaultItem[]> {
    const items: VaultItem[] = [];
    const dirPath = path.join(this.rootPath, dirName);
    
    try {
      // Check if directory exists
      await fs.access(dirPath);
    } catch {
      // Directory doesn't exist, return empty array
      return items;
    }

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          // Recursively scan subdirectories
          const subItems = await this.scanDirectory(path.join(dirName, entry.name), allowedTypes);
          items.push(...subItems);
        } else if (entry.isFile() && entry.name.endsWith(FILE_EXTENSIONS.MARKDOWN)) {
          // Parse markdown file
          const filePath = path.join(dirPath, entry.name);
          const item = await this.parseMarkdownFile(filePath, allowedTypes);
          if (item) {
            items.push(item);
          }
        }
      }
    } catch (error) {
      console.warn(`Failed to scan directory ${dirName}:`, error);
    }

    return items;
  }

  /**
   * Parse a markdown file and extract vault item data
   */
  private async parseMarkdownFile(filePath: string, allowedTypes: string[]): Promise<VaultItem | null> {
    try {
      // Read file content
      const content = await fs.readFile(filePath, 'utf-8');
      const stats = await fs.stat(filePath);
      
      // Parse markdown
      const parsed = parseMarkdown(content);
      
      // Extract item type from frontmatter
      const itemType = parsed.frontmatter.Type || parsed.frontmatter.type;
      if (!itemType || !allowedTypes.includes(itemType)) {
        return null;
      }

      // Extract title
      const title = extractTitle(parsed.content, path.basename(filePath, FILE_EXTENSIONS.MARKDOWN));
      
      // Generate ID from file path
      const id = this.generateIdFromPath(filePath);
      
      // Create item based on type
      const item = this.createItemFromParsedData(id, itemType, title, parsed, stats);
      
      return item;
    } catch (error) {
      console.warn(`Failed to parse file ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Create a vault item from parsed data
   */
  private createItemFromParsedData(
    id: string,
    type: string,
    title: string,
    parsed: any,
    stats: any
  ): VaultItem {
    const now = new Date().toISOString();
    const frontmatter = parsed.frontmatter;
    
    const baseItem = {
      id,
      type,
      title,
      status: frontmatter.Status || frontmatter.status || 'Active',
      tags: this.parseTags(frontmatter.Tags || frontmatter.tags),
      content: parsed.content,
      createdAt: frontmatter.Created || frontmatter.Created || now,
      updatedAt: frontmatter.Updated || frontmatter.Updated || now
    };

    switch (type) {
      case 'Task':
        return {
          ...baseItem,
          type: 'Task',
          dueDate: frontmatter['Due Date'] || frontmatter.dueDate,
          parentProjects: this.parseArray(frontmatter['Parent Projects'] || frontmatter.parentProjects),
          area: frontmatter.Area || frontmatter.area,
          priority: frontmatter.Priority || frontmatter.priority || 'Medium'
        } as Task;

      case 'Epic':
        return {
          ...baseItem,
          type: 'Epic',
          dueDate: frontmatter['Due Date'] || frontmatter.dueDate,
          area: frontmatter.Area || frontmatter.area,
          image: frontmatter.Image || frontmatter.image,
          tasks: this.parseArray(frontmatter.Tasks || frontmatter.tasks)
        } as Epic;

      case 'Area':
        return {
          ...baseItem,
          type: 'Area',
          maintenance: frontmatter.Maintenance || frontmatter.maintenance || 'Weekly',
          pinned: frontmatter.Pinned || frontmatter.pinned || false,
          purpose: frontmatter.Purpose || frontmatter.purpose || '',
          activeProjects: this.parseArray(frontmatter['Active Projects'] || frontmatter.activeProjects),
          currentFocus: {
            primary: frontmatter['Current Focus'] || frontmatter.currentFocus || '',
            secondary: '',
            ongoing: []
          }
        } as Area;

      case 'Resource':
        return {
          ...baseItem,
          type: 'Resource',
          pinned: frontmatter.Pinned || frontmatter.pinned || false,
          areas: this.parseArray(frontmatter.Areas || frontmatter.areas),
          purpose: frontmatter.Purpose || frontmatter.purpose || '',
          contentOverview: frontmatter['Content Overview'] || frontmatter.contentOverview || '',
          keyTopics: this.parseArray(frontmatter['Key Topics'] || frontmatter.keyTopics),
          usageNotes: frontmatter['Usage Notes'] || frontmatter.usageNotes || '',
          maintenance: frontmatter.Maintenance || frontmatter.maintenance || ''
        } as Resource;

      default:
        throw new Error(`Unknown item type: ${type}`);
    }
  }

  /**
   * Generate ID from file path
   */
  private generateIdFromPath(filePath: string): string {
    // Remove root path and extension, convert to lowercase, replace separators with hyphens
    const relativePath = path.relative(this.rootPath, filePath);
    const withoutExt = relativePath.replace(FILE_EXTENSIONS.MARKDOWN, '');
    return withoutExt.toLowerCase().replace(/[\/\\]/g, '-');
  }

  /**
   * Parse tags from frontmatter
   */
  private parseTags(tags: any): string[] {
    if (!tags) return [];
    if (Array.isArray(tags)) return tags;
    if (typeof tags === 'string') {
      // Handle comma-separated string
      return tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    }
    return [];
  }

  /**
   * Parse array from frontmatter
   */
  private parseArray(value: any): string[] {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      // Handle comma-separated string
      return value.split(',').map(item => item.trim()).filter(item => item.length > 0);
    }
    return [];
  }

  /**
   * Update cache with scanned items
   */
  private updateCache(items: VaultItem[]): void {
    this.cache.clear();
    
    for (const item of items) {
      // Find file path for this item
      const filePath = this.findFilePathForItem(item);
      if (filePath) {
        this.cache.set(item.id, {
          item,
          filePath,
          lastModified: new Date()
        });
      }
    }
  }

  /**
   * Find file path for an item (reverse lookup)
   */
  private findFilePathForItem(item: VaultItem): string | null {
    // This is a simplified implementation
    // In a real implementation, you'd want to maintain a mapping
    // For now, we'll reconstruct the path based on the ID
    const idParts = item.id.split('-');
    const type = item.type;
    
    let directory: string;
    switch (type) {
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
        return null;
    }
    
    // Reconstruct filename from ID
    const filename = idParts.slice(-1)[0] + FILE_EXTENSIONS.MARKDOWN;
    return path.join(this.rootPath, directory, filename);
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; lastScanTime: Date | null } {
    return {
      size: this.cache.size,
      lastScanTime: this.lastScanTime
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    this.lastScanTime = null;
  }

  /**
   * Check if cache is stale (older than 5 minutes)
   */
  isCacheStale(): boolean {
    if (!this.lastScanTime) return true;
    const fiveMinutes = 5 * 60 * 1000;
    return Date.now() - this.lastScanTime.getTime() > fiveMinutes;
  }

  /**
   * Force cache refresh if stale
   */
  async refreshCacheIfStale(): Promise<void> {
    if (this.isCacheStale()) {
      await this.scanAllItems();
    }
  }
}
