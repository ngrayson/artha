import { z } from 'zod';
import {
  TaskSchema,
  EpicSchema,
  AreaSchema,
  ResourceSchema,
  VaultItemSchema,
} from '../types/vault-items.js';

// Base validation schemas
export const IdSchema = z.string().min(1, 'ID cannot be empty');
export const TitleSchema = z.string().min(1, 'Title cannot be empty').max(200, 'Title too long');
export const ContentSchema = z.string().max(10000, 'Content too long');
export const TagsSchema = z.array(z.string()).default([]);
export const DateSchema = z.string().datetime().optional();

// Enhanced validation schemas with better error messages
export const TaskValidationSchema = TaskSchema.extend({
  title: TitleSchema,
  content: ContentSchema,
  tags: TagsSchema,
  dueDate: DateSchema,
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent']).optional(),
  area: z.string().optional(),
  parentProjects: z.array(z.string()).optional(),
});

export const EpicValidationSchema = EpicSchema.extend({
  title: TitleSchema,
  content: ContentSchema,
  tags: TagsSchema,
  dueDate: DateSchema,
  area: z.string().min(1, 'Area is required for epics'),
  image: z.string().url().optional(),
  tasks: z.array(z.string()).default([]),
});

export const AreaValidationSchema = AreaSchema.extend({
  title: TitleSchema,
  content: ContentSchema,
  tags: TagsSchema,
  purpose: z.string().min(10, 'Purpose must be at least 10 characters'),
  maintenance: z.enum(['Daily', 'Weekly', 'Monthly', 'Quarterly']),
  pinned: z.boolean().default(false),
  activeProjects: z.array(z.string()).default([]),
  currentFocus: z.object({
    primary: z.string().min(1, 'Primary focus is required'),
    secondary: z.string().optional(),
    ongoing: z.array(z.string()).default([]),
  }),
});

export const ResourceValidationSchema = ResourceSchema.extend({
  title: TitleSchema,
  content: ContentSchema,
  tags: TagsSchema,
  purpose: z.string().min(10, 'Purpose must be at least 10 characters'),
  contentOverview: z.string().min(20, 'Content overview must be at least 20 characters'),
  keyTopics: z.array(z.string()).min(1, 'At least one key topic is required'),
  usageNotes: z.string().min(10, 'Usage notes must be at least 10 characters'),
  maintenance: z.string().min(1, 'Maintenance information is required'),
  areas: z.array(z.string()).min(1, 'At least one area must be specified'),
  pinned: z.boolean().default(false),
});

// Request validation schemas
export const CreateTaskRequestSchema = z.object({
  type: z.literal('Task'),
  title: TitleSchema,
  status: z.enum(['To Do', 'In Progress', 'Done', 'Blocked']).default('To Do'),
  dueDate: DateSchema,
  parentProjects: z.array(z.string()).optional(),
  area: z.string().optional(),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent']).default('Medium'),
  tags: TagsSchema,
  content: ContentSchema.optional(),
});

export const CreateEpicRequestSchema = z.object({
  type: z.literal('Epic'),
  title: TitleSchema,
  status: z.enum(['Planning', 'Active', 'On Hold', 'Completed']).default('Planning'),
  dueDate: DateSchema,
  area: z.string().min(1, 'Area is required for epics'),
  image: z.string().url().optional(),
  tags: TagsSchema,
  content: ContentSchema.optional(),
});

export const CreateAreaRequestSchema = z.object({
  type: z.literal('Area'),
  title: TitleSchema,
  status: z.enum(['Active', 'Inactive', 'Archived']).default('Active'),
  maintenance: z.enum(['Daily', 'Weekly', 'Monthly', 'Quarterly']).default('Weekly'),
  pinned: z.boolean().default(false),
  purpose: z.string().min(10, 'Purpose must be at least 10 characters'),
  tags: TagsSchema,
  content: ContentSchema.optional(),
});

export const CreateResourceRequestSchema = z.object({
  type: z.literal('Resource'),
  title: TitleSchema,
  status: z.enum(['Active', 'Archived']).default('Active'),
  pinned: z.boolean().default(false),
  areas: z.array(z.string()).min(1, 'At least one area must be specified'),
  tags: TagsSchema,
  purpose: z.string().min(10, 'Purpose must be at least 10 characters'),
  contentOverview: z.string().min(20, 'Content overview must be at least 20 characters'),
  keyTopics: z.array(z.string()).min(1, 'At least one key topic is required'),
  usageNotes: z.string().min(10, 'Usage notes must be at least 10 characters'),
  maintenance: z.string().min(1, 'Maintenance information is required'),
  content: ContentSchema.optional(),
});

export const CreateItemRequestSchema = z.union([
  CreateTaskRequestSchema,
  CreateEpicRequestSchema,
  CreateAreaRequestSchema,
  CreateResourceRequestSchema,
]);

// Update validation schemas
export const UpdateItemRequestSchema = z.object({
  id: IdSchema,
  updates: z.object({
    title: TitleSchema.optional(),
    status: z.string().optional(),
    content: ContentSchema.optional(),
    tags: TagsSchema.optional(),
    dueDate: DateSchema,
    area: z.string().optional(),
    priority: z.enum(['Low', 'Medium', 'High', 'Urgent']).optional(),
    parentProjects: z.array(z.string()).optional(),
    image: z.string().url().optional(),
    tasks: z.array(z.string()).optional(),
    maintenance: z.enum(['Daily', 'Weekly', 'Monthly', 'Quarterly']).optional(),
    pinned: z.boolean().optional(),
    purpose: z.string().min(10).optional(),
    contentOverview: z.string().min(20).optional(),
    keyTopics: z.array(z.string()).optional(),
    usageNotes: z.string().min(10).optional(),
    areas: z.array(z.string()).optional(),
    currentFocus: z.object({
      primary: z.string().min(1).optional(),
      secondary: z.string().optional(),
      ongoing: z.array(z.string()).optional(),
    }).optional(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: 'At least one update field must be provided',
  }),
});

// Search and query validation schemas
export const SearchRequestSchema = z.object({
  query: z.string().min(1, 'Search query cannot be empty'),
  type: z.enum(['Task', 'Epic', 'Area', 'Resource']).optional(),
  limit: z.number().min(1).max(100).default(20),
  area: z.string().optional(),
  status: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const ListItemsRequestSchema = z.object({
  type: z.enum(['Task', 'Epic', 'Area', 'Resource']).optional(),
  area: z.string().optional(),
  status: z.string().optional(),
  tags: z.array(z.string()).optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
  sortBy: z.enum(['title', 'status', 'dueDate', 'createdAt', 'updatedAt']).default('title'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// Bulk operation validation schemas
export const BulkUpdateRequestSchema = z.object({
  ids: z.array(IdSchema).min(1, 'At least one ID must be provided'),
  updates: z.object({
    status: z.string().optional(),
    tags: TagsSchema.optional(),
    area: z.string().optional(),
    priority: z.enum(['Low', 'Medium', 'High', 'Urgent']).optional(),
    maintenance: z.enum(['Daily', 'Weekly', 'Monthly', 'Quarterly']).optional(),
    pinned: z.boolean().optional(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: 'At least one update field must be provided',
  }),
});

export const BulkDeleteRequestSchema = z.object({
  ids: z.array(IdSchema).min(1, 'At least one ID must be provided'),
});

// File operation validation schemas
export const FilePathSchema = z.string().min(1, 'File path cannot be empty');
export const DirectoryPathSchema = z.string().min(1, 'Directory path cannot be empty');

// Configuration validation schemas
export const VaultConfigSchema = z.object({
  rootPath: z.string().min(1, 'Root path cannot be empty'),
  projectsDir: z.string().default('_projects'),
  areasDir: z.string().default('_areas'),
  resourcesDir: z.string().default('_resources'),
  archiveDir: z.string().default('_archive'),
  templatesDir: z.string().default('_templates'),
  maxFileSize: z.number().min(1024).max(10485760).default(1048576), // 1MB default
  allowedExtensions: z.array(z.string()).default(['.md']),
  backupEnabled: z.boolean().default(true),
  backupInterval: z.number().min(300).max(86400).default(3600), // 1 hour default
});

// Export all schemas
export const ValidationSchemas = {
  // Item schemas
  Task: TaskValidationSchema,
  Epic: EpicValidationSchema,
  Area: AreaValidationSchema,
  Resource: ResourceValidationSchema,
  VaultItem: VaultItemSchema,
  
  // Request schemas
  CreateTask: CreateTaskRequestSchema,
  CreateEpic: CreateEpicRequestSchema,
  CreateArea: CreateAreaRequestSchema,
  CreateResource: CreateResourceRequestSchema,
  CreateItem: CreateItemRequestSchema,
  UpdateItem: UpdateItemRequestSchema,
  
  // Query schemas
  Search: SearchRequestSchema,
  ListItems: ListItemsRequestSchema,
  
  // Bulk operation schemas
  BulkUpdate: BulkUpdateRequestSchema,
  BulkDelete: BulkDeleteRequestSchema,
  
  // Configuration schemas
  VaultConfig: VaultConfigSchema,
  
  // Utility schemas
  Id: IdSchema,
  Title: TitleSchema,
  Content: ContentSchema,
  Tags: TagsSchema,
  Date: DateSchema,
  FilePath: FilePathSchema,
  DirectoryPath: DirectoryPathSchema,
};
