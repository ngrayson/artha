// System constants and configuration values

// File system constants
export const FILE_EXTENSIONS = {
  MARKDOWN: '.md',
  YAML: '.yml',
  YAML_ALT: '.yaml',
  JSON: '.json',
} as const;

export const DIRECTORY_NAMES = {
  PROJECTS: '_projects',
  AREAS: '_areas',
  RESOURCES: '_resources',
  ARCHIVE: '_archive',
  TEMPLATES: '_templates',
  BACKUPS: '_backups',
} as const;

// File size limits (in bytes)
export const FILE_SIZE_LIMITS = {
  MAX_MARKDOWN: 10 * 1024 * 1024, // 10MB
  MAX_FRONTMATTER: 1024 * 1024, // 1MB
  MAX_CONTENT: 9 * 1024 * 1024, // 9MB (leaving 1MB for frontmatter)
} as const;

// Search and pagination constants
export const SEARCH_LIMITS = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  MIN_LIMIT: 1,
} as const;

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  MIN_PAGE_SIZE: 1,
} as const;

// Performance constants
export const PERFORMANCE = {
  SEARCH_TIMEOUT_MS: 5000, // 5 seconds
  SCAN_TIMEOUT_MS: 30000, // 30 seconds
  CACHE_TTL_MS: 300000, // 5 minutes
  MAX_CACHE_SIZE: 1000, // items
} as const;

// Validation constants
export const VALIDATION = {
  MAX_TITLE_LENGTH: 200,
  MAX_CONTENT_LENGTH: 10000,
  MAX_TAGS_COUNT: 50,
  MAX_TAG_LENGTH: 50,
  MIN_PURPOSE_LENGTH: 10,
  MIN_CONTENT_OVERVIEW_LENGTH: 20,
  MIN_USAGE_NOTES_LENGTH: 10,
} as const;

// Status values
export const STATUS_VALUES = {
  TASK: ['To Do', 'In Progress', 'Done', 'Blocked'] as const,
  EPIC: ['Planning', 'Active', 'On Hold', 'Completed'] as const,
  AREA: ['Active', 'Inactive', 'Archived'] as const,
  RESOURCE: ['Active', 'Archived'] as const,
} as const;

export const PRIORITY_VALUES = ['Low', 'Medium', 'High', 'Urgent'] as const;

export const MAINTENANCE_FREQUENCIES = ['Daily', 'Weekly', 'Monthly', 'Quarterly'] as const;

// Template constants
export const TEMPLATE_VARIABLES = {
  TITLE: '{{title}}',
  STATUS: '{{status}}',
  DUE_DATE: '{{dueDate}}',
  AREA: '{{area}}',
  PRIORITY: '{{priority}}',
  TAGS: '{{tags}}',
  PURPOSE: '{{purpose}}',
  MAINTENANCE: '{{maintenance}}',
  CREATED_AT: '{{createdAt}}',
  UPDATED_AT: '{{updatedAt}}',
} as const;

// Error codes
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  INVALID_FORMAT: 'INVALID_FORMAT',
  DUPLICATE_ITEM: 'DUPLICATE_ITEM',
  OPERATION_FAILED: 'OPERATION_FAILED',
  TIMEOUT: 'TIMEOUT',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
} as const;

// Event types
export const EVENT_TYPES = {
  ITEM_CREATED: 'item_created',
  ITEM_UPDATED: 'item_updated',
  ITEM_DELETED: 'item_deleted',
  ITEM_MOVED: 'item_moved',
  VAULT_SCANNED: 'vault_scanned',
  BACKUP_CREATED: 'backup_created',
  ERROR_OCCURRED: 'error_occurred',
} as const;

// Cache keys
export const CACHE_KEYS = {
  VAULT_ITEMS: 'vault_items',
  SEARCH_INDEX: 'search_index',
  TEMPLATES: 'templates',
  CONFIG: 'config',
} as const;

// Default configuration
export const DEFAULT_CONFIG = {
  rootPath: '',
  projectsDir: DIRECTORY_NAMES.PROJECTS,
  areasDir: DIRECTORY_NAMES.AREAS,
  resourcesDir: DIRECTORY_NAMES.RESOURCES,
  archiveDir: DIRECTORY_NAMES.ARCHIVE,
  templatesDir: DIRECTORY_NAMES.TEMPLATES,
  maxFileSize: FILE_SIZE_LIMITS.MAX_MARKDOWN,
  allowedExtensions: [FILE_EXTENSIONS.MARKDOWN],
  backupEnabled: true,
  backupInterval: 3600, // 1 hour
} as const;

// MCP tool names
export const MCP_TOOLS = {
  LIST_ITEMS: 'list_items',
  CREATE_ITEM: 'create_item',
  UPDATE_ITEM: 'update_item',
  DELETE_ITEM: 'delete_item',
  SEARCH_ITEMS: 'search_items',
  GET_ITEM: 'get_item',
  BULK_UPDATE: 'bulk_update',
  BULK_DELETE: 'bulk_delete',
} as const;

// File patterns
export const FILE_PATTERNS = {
  MARKDOWN_FILES: '**/*.md',
  YAML_FILES: '**/*.{yml,yaml}',
  JSON_FILES: '**/*.json',
  ALL_SUPPORTED: '**/*.{md,yml,yaml,json}',
} as const;

// Backup constants
export const BACKUP = {
  MAX_BACKUPS: 10,
  BACKUP_PREFIX: 'backup_',
  BACKUP_SUFFIX: '.zip',
  BACKUP_INTERVAL_MS: 3600000, // 1 hour
} as const;
