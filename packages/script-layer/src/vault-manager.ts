import * as fs from 'fs/promises';
import * as path from 'path';
import { 
  VaultItem, 
  Task, 
  Epic, 
  Area, 
  Resource,
  CreateItemRequest,
  UpdateItemRequest,
  SearchRequest,
  ListItemsRequest,
  CreateItemResponse,
  UpdateItemResponse,
  DeleteItemResponse,
  SearchResponse,
  ListItemsResponse,
  GetItemResponse
} from '@artha/shared';
import { TemplateManager } from './template-manager';
import { SearchManager } from './search-manager';
import { VaultScanner } from './utils/vault-scanner';
import { ItemFactory } from './utils/item-factory';
import { 
  DIRECTORY_NAMES, 
  ERROR_CODES, 
  SEARCH_LIMITS,
  PAGINATION 
} from '@artha/shared';

export interface VaultManagerOptions {
  rootPath: string;
  autoScan?: boolean;
  cacheEnabled?: boolean;
  maxCacheSize?: number;
}

export class VaultManager {
  private rootPath: string;
  private templateManager: TemplateManager;
  private searchManager: SearchManager;
  private vaultScanner: VaultScanner;
  private itemFactory: ItemFactory;
  private cache: Map<string, VaultItem>;
  private cacheEnabled: boolean;
  private maxCacheSize: number;

  constructor(options: VaultManagerOptions) {
    this.rootPath = options.rootPath;
    this.cacheEnabled = options.cacheEnabled ?? true;
    this.maxCacheSize = options.maxCacheSize ?? 1000;
    this.cache = new Map();

    this.templateManager = new TemplateManager(this.rootPath);
    this.searchManager = new SearchManager();
    this.vaultScanner = new VaultScanner(this.rootPath);
    this.itemFactory = new ItemFactory(this.rootPath);

    if (options.autoScan ?? true) {
      this.scanVault();
    }
  }

  /**
   * Scan the entire vault and populate the cache
   */
  async scanVault(): Promise<void> {
    try {
      const items = await this.vaultScanner.scanAllItems();
      
      // Clear existing cache
      this.cache.clear();
      
      // Populate cache
      for (const item of items) {
        this.cache.set(item.id, item);
      }

      // Update search index
      await this.searchManager.updateIndex(items);
    } catch (error) {
      console.error('Failed to scan vault:', error);
      throw new Error(`Vault scan failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a new vault item
   */
  async createItem(request: CreateItemRequest): Promise<CreateItemResponse> {
    try {
      // Create item using ItemFactory
      const result = await this.itemFactory.createItem(request);
      
      // Ensure directory exists
      const directory = this.getDirectoryForType(result.item.type);
      await this.ensureDirectoryExists(directory);

      // Write file
      await fs.writeFile(result.filePath, result.markdown, 'utf-8');

      // Add to cache
      if (this.cacheEnabled) {
        this.cache.set(result.item.id, result.item);
        this.searchManager.addToIndex(result.item);
      }

      return {
        success: true,
        item: result.item
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create item: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get a vault item by ID
   */
  async getItem(id: string): Promise<GetItemResponse> {
    try {
      // Check cache first
      if (this.cacheEnabled && this.cache.has(id)) {
        return {
          success: true,
          item: this.cache.get(id)!
        };
      }

      // Find item in vault
      const item = await this.vaultScanner.findItemById(id);
      if (!item) {
        return {
          success: false,
          error: `Item not found: ${id}`
        };
      }

      // Add to cache
      if (this.cacheEnabled) {
        this.cache.set(id, item);
      }

      return {
        success: true,
        item
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get item: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Update an existing vault item
   */
  async updateItem(request: UpdateItemRequest): Promise<UpdateItemResponse> {
    try {
      // Get existing item
      const existingItem = await this.getItem(request.id);
      if (!existingItem.success) {
        return {
          success: false,
          error: existingItem.error
        };
      }

      // Apply updates
      const updatedItem = { ...existingItem.item!, ...request.updates, updatedAt: new Date().toISOString() } as VaultItem;
      
      // Generate updated content
      const template = await this.templateManager.getTemplate(updatedItem.type);
      const content = this.templateManager.applyTemplate(template, updatedItem);

      // Find file path
      const filePath = await this.vaultScanner.findFilePathById(request.id);
      if (!filePath) {
        return {
          success: false,
          error: `File not found for item: ${request.id}`
        };
      }

      // Write updated content
      await fs.writeFile(filePath, content, 'utf-8');

      // Update cache
      if (this.cacheEnabled) {
        this.cache.set(request.id, updatedItem);
        this.searchManager.updateItemInIndex(updatedItem);
      }

      return {
        success: true,
        item: updatedItem
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to update item: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Delete a vault item
   */
  async deleteItem(id: string): Promise<DeleteItemResponse> {
    try {
      // Find file path
      const filePath = await this.vaultScanner.findFilePathById(id);
      if (!filePath) {
        return {
          success: false,
          error: `File not found for item: ${id}`
        };
      }

      // Delete file
      await fs.unlink(filePath);

      // Remove from cache
      if (this.cacheEnabled) {
        this.cache.delete(id);
        this.searchManager.removeFromIndex(id);
      }

      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to delete item: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Search for vault items
   */
  async searchItems(request: SearchRequest): Promise<SearchResponse> {
    try {
      const results = await this.searchManager.search(request);
      
      return {
        success: true,
        items: results.items,
        total: results.total
      };
    } catch (error) {
      return {
        success: false,
        items: [],
        total: 0,
        error: `Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * List vault items with filtering and pagination
   */
  async listItems(request: ListItemsRequest): Promise<ListItemsResponse> {
    try {
      const items = await this.vaultScanner.scanAllItems();
      
      // Apply filters
      let filteredItems = this.applyFilters(items, request);
      
      // Apply sorting
      filteredItems = this.applySorting(filteredItems, request.sortBy, request.sortOrder);
      
      // Apply pagination
      const limit = Math.min(request.limit ?? PAGINATION.DEFAULT_PAGE_SIZE, PAGINATION.MAX_PAGE_SIZE);
      const offset = request.offset ?? 0;
      const paginatedItems = filteredItems.slice(offset, offset + limit);
      
      return {
        success: true,
        items: paginatedItems,
        total: filteredItems.length,
        hasMore: offset + limit < filteredItems.length
      };
    } catch (error) {
      return {
        success: false,
        items: [],
        total: 0,
        hasMore: false,
        error: `Failed to list items: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get all items of a specific type
   */
  async getItemsByType(type: string): Promise<VaultItem[]> {
    const items = await this.vaultScanner.scanAllItems();
    return items.filter(item => item.type === type);
  }

  /**
   * Get items by area
   */
  async getItemsByArea(area: string): Promise<VaultItem[]> {
    const items = await this.vaultScanner.scanAllItems();
    return items.filter(item => {
      if (item.type === 'Task' || item.type === 'Epic') {
        return (item as Task | Epic).area === area;
      }
      if (item.type === 'Resource') {
        return (item as Resource).areas.includes(area);
      }
      return false;
    });
  }

  /**
   * Get items by status
   */
  async getItemsByStatus(status: string): Promise<VaultItem[]> {
    const items = await this.vaultScanner.scanAllItems();
    return items.filter(item => item.status === status);
  }

  /**
   * Get items by tags
   */
  async getItemsByTags(tags: string[]): Promise<VaultItem[]> {
    const items = await this.vaultScanner.scanAllItems();
    return items.filter(item => 
      tags.some(tag => item.tags.includes(tag))
    );
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; maxSize: number; hitRate: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      hitRate: this.searchManager.getHitRate()
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    this.searchManager.clearIndex();
  }

  /**
   * Get directory path for item type
   */
  private getDirectoryForType(type: string): string {
    switch (type) {
      case 'Task':
      case 'Epic':
        return DIRECTORY_NAMES.PROJECTS;
      case 'Area':
        return DIRECTORY_NAMES.AREAS;
      case 'Resource':
        return DIRECTORY_NAMES.RESOURCES;
      default:
        throw new Error(`Unknown item type: ${type}`);
    }
  }

  /**
   * Ensure directory exists
   */
  private async ensureDirectoryExists(directory: string): Promise<void> {
    const fullPath = path.join(this.rootPath, directory);
    try {
      await fs.access(fullPath);
    } catch {
      await fs.mkdir(fullPath, { recursive: true });
    }
  }

  /**
   * Apply filters to items
   */
  private applyFilters(items: VaultItem[], request: ListItemsRequest): VaultItem[] {
    let filtered = items;

    if (request.type) {
      filtered = filtered.filter(item => item.type === request.type);
    }

    if (request.area) {
      filtered = filtered.filter(item => {
        if (item.type === 'Task' || item.type === 'Epic') {
          return (item as Task | Epic).area === request.area;
        }
        if (item.type === 'Resource') {
          return (item as Resource).areas.includes(request.area!);
        }
        return false;
      });
    }

    if (request.status) {
      filtered = filtered.filter(item => item.status === request.status);
    }

    if (request.tags && request.tags.length > 0) {
      filtered = filtered.filter(item => 
        request.tags!.some(tag => item.tags.includes(tag))
      );
    }

    return filtered;
  }

  /**
   * Apply sorting to items
   */
  private applySorting(items: VaultItem[], sortBy?: string, sortOrder?: string): VaultItem[] {
    if (!sortBy) return items;

    const sorted = [...items].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'status':
          aValue = a.status.toLowerCase();
          bValue = b.status.toLowerCase();
          break;
        case 'dueDate':
          aValue = (a as Task | Epic).dueDate || '';
          bValue = (b as Task | Epic).dueDate || '';
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case 'updatedAt':
          aValue = new Date(a.updatedAt);
          bValue = new Date(b.updatedAt);
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'desc' ? 1 : -1;
      if (aValue > bValue) return sortOrder === 'desc' ? -1 : 1;
      return 0;
    });

    return sorted;
  }
}
