import { z } from 'zod';

// Base item interface with common properties
export interface BaseVaultItem {
  id: string;
  type: VaultItemType;
  title: string;
  status: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

// Specific item types
export interface Task extends BaseVaultItem {
  type: 'Task';
  status: TaskStatus;
  dueDate?: string;
  parentProjects?: string[];
  area?: string;
  priority?: TaskPriority;
}

export interface Epic extends BaseVaultItem {
  type: 'Epic';
  status: EpicStatus;
  dueDate?: string;
  area: string;
  image?: string;
  tasks: string[]; // Task IDs
}

export interface Area extends BaseVaultItem {
  type: 'Area';
  status: AreaStatus;
  maintenance: MaintenanceFrequency;
  pinned: boolean;
  purpose: string;
  activeProjects: string[]; // Project IDs
  currentFocus: {
    primary: string;
    secondary: string;
    ongoing: string[];
  };
}

export interface Resource extends BaseVaultItem {
  type: 'Resource';
  status: ResourceStatus;
  pinned: boolean;
  areas: string[]; // Area IDs
  purpose: string;
  contentOverview: string;
  keyTopics: string[];
  usageNotes: string;
  maintenance: string;
}

// Union type for all vault items
export type VaultItem = Task | Epic | Area | Resource;

// Enums for status and types
export type VaultItemType = 'Task' | 'Epic' | 'Area' | 'Resource';

export type TaskStatus = 'To Do' | 'In Progress' | 'Done' | 'Blocked';
export type EpicStatus = 'Planning' | 'Active' | 'On Hold' | 'Completed';
export type AreaStatus = 'Active' | 'Inactive' | 'Archived';
export type ResourceStatus = 'Active' | 'Archived';

export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type MaintenanceFrequency = 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly';

// Zod schemas for validation
export const TaskSchema = z.object({
  id: z.string(),
  type: z.literal('Task'),
  title: z.string(),
  status: z.enum(['To Do', 'In Progress', 'Done', 'Blocked']),
  dueDate: z.string().optional(),
  parentProjects: z.array(z.string()).optional(),
  area: z.string().optional(),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent']).optional(),
  tags: z.array(z.string()),
  content: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const EpicSchema = z.object({
  id: z.string(),
  type: z.literal('Epic'),
  title: z.string(),
  status: z.enum(['Planning', 'Active', 'On Hold', 'Completed']),
  dueDate: z.string().optional(),
  area: z.string(),
  image: z.string().optional(),
  tasks: z.array(z.string()),
  tags: z.array(z.string()),
  content: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const AreaSchema = z.object({
  id: z.string(),
  type: z.literal('Area'),
  title: z.string(),
  status: z.enum(['Active', 'Inactive', 'Archived']),
  maintenance: z.enum(['Daily', 'Weekly', 'Monthly', 'Quarterly']),
  pinned: z.boolean(),
  purpose: z.string(),
  activeProjects: z.array(z.string()),
  currentFocus: z.object({
    primary: z.string(),
    secondary: z.string(),
    ongoing: z.array(z.string()),
  }),
  tags: z.array(z.string()),
  content: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const ResourceSchema = z.object({
  id: z.string(),
  type: z.literal('Resource'),
  title: z.string(),
  status: z.enum(['Active', 'Archived']),
  pinned: z.boolean(),
  areas: z.array(z.string()),
  tags: z.array(z.string()),
  purpose: z.string(),
  contentOverview: z.string(),
  keyTopics: z.array(z.string()),
  usageNotes: z.string(),
  maintenance: z.string(),
  content: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const VaultItemSchema = z.union([TaskSchema, EpicSchema, AreaSchema, ResourceSchema]);
