import { Fzf } from 'fzf';
import { VaultItem, SearchRequest, SearchResult } from '@artha/shared';
import { SEARCH_LIMITS } from '@artha/shared';

export interface SearchIndex {
  items: VaultItem[];
  fzf: Fzf<string[]>;
  lastUpdated: Date;
}

export interface SearchResults {
  items: VaultItem[];
  total: number;
  query: string;
  highlights: Map<string, string[]>;
  success: boolean;
}

export class SearchManager {
  private index: SearchIndex | null = null;
  private hitCount: number = 0;
  private missCount: number = 0;

  /**
   * Update the search index with new items
   */
  async updateIndex(items: VaultItem[]): Promise<void> {
    try {
      // Create searchable strings for each item
      const searchableStrings = items.map(item => this.createSearchableString(item));
      
      // Initialize fzf with searchable strings
      const fzf = new Fzf(searchableStrings, {
        limit: SEARCH_LIMITS.MAX_LIMIT,
        fuzzy: "v2",
        sort: true
      });

      this.index = {
        items,
        fzf,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Failed to update search index:', error);
      throw new Error(`Search index update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Add a single item to the search index
   */
  addToIndex(item: VaultItem): void {
    if (!this.index) {
      this.updateIndex([item]);
      return;
    }

    // Add to items array
    this.index.items.push(item);
    
    // Rebuild fzf index
    const searchableStrings = this.index.items.map(item => this.createSearchableString(item));
    this.index.fzf = new Fzf(searchableStrings, {
      limit: SEARCH_LIMITS.MAX_LIMIT,
      fuzzy: "v2",
      sort: true
    });
    
    this.index.lastUpdated = new Date();
  }

  /**
   * Update an item in the search index
   */
  updateItemInIndex(item: VaultItem): void {
    if (!this.index) {
      this.addToIndex(item);
      return;
    }

    // Find and update existing item
    const existingIndex = this.index.items.findIndex(i => i.id === item.id);
    if (existingIndex >= 0) {
      this.index.items[existingIndex] = item;
    } else {
      this.index.items.push(item);
    }
    
    // Rebuild fzf index
    const searchableStrings = this.index.items.map(item => this.createSearchableString(item));
    this.index.fzf = new Fzf(searchableStrings, {
      limit: SEARCH_LIMITS.MAX_LIMIT,
      fuzzy: "v2",
      sort: true
    });
    
    this.index.lastUpdated = new Date();
  }

  /**
   * Remove an item from the search index
   */
  removeFromIndex(itemId: string): void {
    if (!this.index) return;

    // Remove from items array
    this.index.items = this.index.items.filter(item => item.id !== itemId);
    
    // Rebuild fzf index
    const searchableStrings = this.index.items.map(item => this.createSearchableString(item));
    this.index.fzf = new Fzf(searchableStrings, {
      limit: SEARCH_LIMITS.MAX_LIMIT,
      fuzzy: "v2",
      sort: true
    });
    
    this.index.lastUpdated = new Date();
  }

  /**
   * Search for items using fuzzy search
   */
  async search(request: SearchRequest): Promise<SearchResults> {
    if (!this.index) {
      throw new Error('Search index not initialized');
    }

    try {
      const startTime = Date.now();
      
      // Perform fuzzy search
      const searchResults = this.index.fzf.find(request.query);
      
      // Map results back to items
      const items: VaultItem[] = [];
      const highlights = new Map<string, string[]>();
      
      for (const result of searchResults) {
        const itemIndex = parseInt(result.item);
        if (itemIndex >= 0 && itemIndex < this.index.items.length) {
          const item = this.index.items[itemIndex];
          items.push(item);
          
          // Store highlights
          if (result.positions && Array.isArray(result.positions)) {
            highlights.set(item.id, Array.from(result.positions).map((pos: unknown) => {
              if (typeof pos === 'number') {
                return this.index!.items[itemIndex].title.substring(pos, pos + 1);
              }
              return '';
            }).filter(Boolean));
          }
        }
      }

      // Apply type filter if specified
      let filteredItems = items;
      if (request.type) {
        filteredItems = items.filter(item => item.type === request.type);
      }

      // Apply area filter if specified
      if (request.area) {
        filteredItems = filteredItems.filter(item => {
          if (item.type === 'Task' || item.type === 'Epic') {
            return (item as any).area === request.area;
          }
          if (item.type === 'Resource') {
            return (item as any).areas.includes(request.area);
          }
          return false;
        });
      }

      // Apply status filter if specified
      if (request.status) {
        filteredItems = filteredItems.filter(item => item.status === request.status);
      }

      // Apply tags filter if specified
      if (request.tags && request.tags.length > 0) {
        filteredItems = filteredItems.filter(item => 
          request.tags!.some(tag => item.tags.includes(tag))
        );
      }

      // Apply limit
      const limitedItems = filteredItems.slice(0, request.limit ?? SEARCH_LIMITS.DEFAULT_LIMIT);

      // Update hit/miss statistics
      this.hitCount++;
      
      const searchTime = Date.now() - startTime;
      if (searchTime > 100) {
        console.warn(`Slow search query: "${request.query}" took ${searchTime}ms`);
      }

      return {
        items: limitedItems,
        total: filteredItems.length,
        query: request.query,
        highlights,
        success: true
      };
    } catch (error) {
      this.missCount++;
      throw new Error(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a searchable string for an item
   */
  private createSearchableString(item: VaultItem): string {
    const parts: string[] = [
      item.title,
      item.type,
      item.status,
      ...item.tags
    ];

    // Add type-specific searchable content
    switch (item.type) {
      case 'Task':
        const task = item as any;
        if (task.area) parts.push(task.area);
        if (task.priority) parts.push(task.priority);
        if (task.dueDate) parts.push(task.dueDate);
        if (task.parentProjects) parts.push(...task.parentProjects);
        break;
        
      case 'Epic':
        const epic = item as any;
        if (epic.area) parts.push(epic.area);
        if (epic.dueDate) parts.push(epic.dueDate);
        if (epic.tasks) parts.push(...epic.tasks);
        break;
        
      case 'Area':
        const area = item as any;
        if (area.purpose) parts.push(area.purpose);
        if (area.maintenance) parts.push(area.maintenance);
        if (area.activeProjects) parts.push(...area.activeProjects);
        if (area.currentFocus?.primary) parts.push(area.currentFocus.primary);
        break;
        
      case 'Resource':
        const resource = item as any;
        if (resource.purpose) parts.push(resource.purpose);
        if (resource.contentOverview) parts.push(resource.contentOverview);
        if (resource.keyTopics) parts.push(...resource.keyTopics);
        if (resource.usageNotes) parts.push(resource.usageNotes);
        if (resource.areas) parts.push(...resource.areas);
        break;
    }

    // Add content (first 200 characters for performance)
    if (item.content) {
      parts.push(item.content.substring(0, 200));
    }

    return parts.join(' ').toLowerCase();
  }

  /**
   * Get search statistics
   */
  getStats(): { hitRate: number; totalSearches: number; lastUpdated: Date | null } {
    const totalSearches = this.hitCount + this.missCount;
    const hitRate = totalSearches > 0 ? this.hitCount / totalSearches : 0;
    
    return {
      hitRate,
      totalSearches,
      lastUpdated: this.index?.lastUpdated ?? null
    };
  }

  /**
   * Get hit rate for cache statistics
   */
  getHitRate(): number {
    const stats = this.getStats();
    return stats.hitRate;
  }

  /**
   * Clear the search index
   */
  clearIndex(): void {
    this.index = null;
    this.hitCount = 0;
    this.missCount = 0;
  }

  /**
   * Get index size
   */
  getIndexSize(): number {
    return this.index?.items.length ?? 0;
  }

  /**
   * Check if index is initialized
   */
  isInitialized(): boolean {
    return this.index !== null;
  }

  /**
   * Get index age in milliseconds
   */
  getIndexAge(): number {
    if (!this.index) return 0;
    return Date.now() - this.index.lastUpdated.getTime();
  }

  /**
   * Force index rebuild
   */
  async rebuildIndex(): Promise<void> {
    if (!this.index) return;
    
    const items = [...this.index.items];
    await this.updateIndex(items);
  }
}
