import { VaultItem, VaultItemType } from './vault-items';

// Base request interface
export interface BaseRequest {
  id?: string;
  type?: VaultItemType;
}

// Create item requests
export interface CreateTaskRequest {
  type: 'Task';
  title: string;
  status?: 'To Do' | 'In Progress' | 'Done' | 'Blocked';
  dueDate?: string;
  parentProjects?: string[];
  area?: string;
  priority?: 'Low' | 'Medium' | 'High' | 'Urgent';
  tags?: string[];
  content?: string;
}

export interface CreateEpicRequest {
  type: 'Epic';
  title: string;
  status?: 'Planning' | 'Active' | 'On Hold' | 'Completed';
  dueDate?: string;
  area: string;
  image?: string;
  tags?: string[];
  content?: string;
}

export interface CreateAreaRequest {
  type: 'Area';
  title: string;
  status?: 'Active' | 'Inactive' | 'Archived';
  maintenance?: 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly';
  pinned?: boolean;
  purpose: string;
  tags?: string[];
  content?: string;
}

export interface CreateResourceRequest {
  type: 'Resource';
  title: string;
  status?: 'Active' | 'Archived';
  pinned?: boolean;
  areas: string[];
  tags?: string[];
  purpose: string;
  contentOverview: string;
  keyTopics: string[];
  usageNotes: string;
  maintenance: string;
  content?: string;
}

export type CreateItemRequest = CreateTaskRequest | CreateEpicRequest | CreateAreaRequest | CreateResourceRequest;

// Update item requests
export interface UpdateItemRequest {
  id: string;
  updates: Partial<Omit<VaultItem, 'id' | 'filePath' | 'createdAt'>>;
}

// Search and query requests
export interface SearchRequest {
  query: string;
  type?: VaultItemType;
  limit?: number;
  area?: string;
  status?: string;
  tags?: string[];
}

export interface ListItemsRequest {
  type?: VaultItemType;
  area?: string;
  status?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
  sortBy?: 'title' | 'status' | 'dueDate' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

// Response types
export interface CreateItemResponse {
  success: boolean;
  item?: VaultItem;
  error?: string;
}

export interface UpdateItemResponse {
  success: boolean;
  item?: VaultItem;
  error?: string;
}

export interface DeleteItemResponse {
  success: boolean;
  error?: string;
}

export interface SearchResponse {
  success: boolean;
  items: VaultItem[];
  total: number;
  error?: string;
}

export interface ListItemsResponse {
  success: boolean;
  items: VaultItem[];
  total: number;
  hasMore: boolean;
  error?: string;
}

export interface GetItemResponse {
  success: boolean;
  item?: VaultItem;
  error?: string;
}

// Bulk operation requests
export interface BulkUpdateRequest {
  ids: string[];
  updates: Partial<Omit<VaultItem, 'id' | 'filePath' | 'createdAt'>>;
}

export interface BulkDeleteRequest {
  ids: string[];
}

export interface BulkUpdateResponse {
  success: boolean;
  updated: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
}

export interface BulkDeleteResponse {
  success: boolean;
  deleted: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
}
