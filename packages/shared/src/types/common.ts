// Common utility types and interfaces

// File system related types
export interface FileInfo {
  path: string;
  name: string;
  extension: string;
  size: number;
  modified: Date;
  created: Date;
}

export interface DirectoryInfo {
  path: string;
  name: string;
  files: FileInfo[];
  subdirectories: DirectoryInfo[];
}

// Markdown parsing types
export interface FrontmatterData {
  [key: string]: any;
}

export interface ParsedMarkdown {
  frontmatter: FrontmatterData;
  content: string;
  raw: string;
}

// Search and filtering types
export interface SearchResult<T> {
  item: T;
  score: number;
  highlights: string[];
}

export interface FilterCriteria {
  type?: string;
  status?: string;
  area?: string;
  tags?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  priority?: string;
}

// Pagination types
export interface PaginationOptions {
  page: number;
  limit: number;
  offset?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// Sorting types
export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

// Error types
export interface AppError extends Error {
  code: string;
  statusCode?: number;
  details?: any;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

// Result types for functional programming
export type Result<T, E = Error> = Success<T> | Failure<E>;

export interface Success<T> {
  success: true;
  data: T;
}

export interface Failure<E> {
  success: false;
  error: E;
}

// Event types for system events
export interface VaultEvent {
  type: 'item_created' | 'item_updated' | 'item_deleted' | 'item_moved';
  itemId: string;
  itemType: string;
  timestamp: Date;
  details?: any;
}

// Configuration types
export interface VaultConfig {
  rootPath: string;
  projectsDir: string;
  areasDir: string;
  resourcesDir: string;
  archiveDir: string;
  templatesDir: string;
  maxFileSize: number;
  allowedExtensions: string[];
  backupEnabled: boolean;
  backupInterval: number;
}

// Template types
export interface Template {
  name: string;
  type: string;
  content: string;
  variables: string[];
  description?: string;
}

// Cache types
export interface CacheEntry<T> {
  key: string;
  value: T;
  timestamp: Date;
  ttl: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  maxSize: number;
}
