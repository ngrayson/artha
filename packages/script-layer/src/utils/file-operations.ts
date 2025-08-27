import * as fs from 'fs/promises';
import * as path from 'path';
import { VaultItem } from '@artha/shared';
import { generateMarkdown, parseMarkdown } from '@artha/shared';
import { FILE_EXTENSIONS, DIRECTORY_NAMES } from '@artha/shared';

export interface FileOperationResult {
  success: boolean;
  error?: string;
  data?: any;
}

export interface FileInfo {
  path: string;
  size: number;
  lastModified: Date;
  exists: boolean;
}

export class FileOperations {
  private rootPath: string;
  private backupPath: string;

  constructor(rootPath: string) {
    this.rootPath = rootPath;
    this.backupPath = path.join(rootPath, '.backup');
  }

  /**
   * Create a new markdown file for a vault item
   */
  async createItemFile(item: VaultItem, content: string): Promise<FileOperationResult> {
    try {
      const filePath = this.getItemFilePath(item);
      
      // Ensure directory exists
      await this.ensureDirectoryExists(path.dirname(filePath));
      
      // Write file
      await fs.writeFile(filePath, content, 'utf-8');
      
      return {
        success: true,
        data: { filePath }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create file: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Update an existing markdown file
   */
  async updateItemFile(item: VaultItem, content: string): Promise<FileOperationResult> {
    try {
      const filePath = this.getItemFilePath(item);
      
      // Check if file exists
      if (!await this.fileExists(filePath)) {
        return {
          success: false,
          error: 'File does not exist'
        };
      }
      
      // Create backup before updating
      await this.createBackup(filePath);
      
      // Write updated content
      await fs.writeFile(filePath, content, 'utf-8');
      
      return {
        success: true,
        data: { filePath }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to update file: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Delete a markdown file
   */
  async deleteItemFile(item: VaultItem): Promise<FileOperationResult> {
    try {
      const filePath = this.getItemFilePath(item);
      
      // Check if file exists
      if (!await this.fileExists(filePath)) {
        return {
          success: false,
          error: 'File does not exist'
        };
      }
      
      // Create backup before deleting
      await this.createBackup(filePath);
      
      // Delete file
      await fs.unlink(filePath);
      
      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Read a markdown file and parse its content
   */
  async readItemFile(filePath: string): Promise<FileOperationResult> {
    try {
      if (!await this.fileExists(filePath)) {
        return {
          success: false,
          error: 'File does not exist'
        };
      }
      
      const content = await fs.readFile(filePath, 'utf-8');
      const parsed = parseMarkdown(content);
      
      return {
        success: true,
        data: {
          content,
          parsed,
          fileInfo: await this.getFileInfo(filePath)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Move a file to a new location
   */
  async moveItemFile(item: VaultItem, newPath: string): Promise<FileOperationResult> {
    try {
      const currentPath = this.getItemFilePath(item);
      
      if (!await this.fileExists(currentPath)) {
        return {
          success: false,
          error: 'Source file does not exist'
        };
      }
      
      // Ensure target directory exists
      await this.ensureDirectoryExists(path.dirname(newPath));
      
      // Create backup
      await this.createBackup(currentPath);
      
      // Move file
      await fs.rename(currentPath, newPath);
      
      return {
        success: true,
        data: { newPath }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to move file: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Copy a file to a new location
   */
  async copyItemFile(item: VaultItem, newPath: string): Promise<FileOperationResult> {
    try {
      const currentPath = this.getItemFilePath(item);
      
      if (!await this.fileExists(currentPath)) {
        return {
          success: false,
          error: 'Source file does not exist'
        };
      }
      
      // Ensure target directory exists
      await this.ensureDirectoryExists(path.dirname(newPath));
      
      // Copy file
      await fs.copyFile(currentPath, newPath);
      
      return {
        success: true,
        data: { newPath }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to copy file: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get file information
   */
  async getFileInfo(filePath: string): Promise<FileInfo> {
    try {
      const stats = await fs.stat(filePath);
      return {
        path: filePath,
        size: stats.size,
        lastModified: stats.mtime,
        exists: true
      };
    } catch {
      return {
        path: filePath,
        size: 0,
        lastModified: new Date(0),
        exists: false
      };
    }
  }

  /**
   * Check if a file exists
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Ensure a directory exists, create if it doesn't
   */
  async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  /**
   * List all files in a directory
   */
  async listDirectory(dirPath: string, recursive: boolean = false): Promise<string[]> {
    try {
      const files: string[] = [];
      
      if (recursive) {
        await this.scanDirectoryRecursive(dirPath, files);
      } else {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isFile()) {
            files.push(path.join(dirPath, entry.name));
          }
        }
      }
      
      return files;
    } catch (error) {
      console.warn(`Failed to list directory ${dirPath}:`, error);
      return [];
    }
  }

  /**
   * Recursively scan a directory for files
   */
  private async scanDirectoryRecursive(dirPath: string, files: string[]): Promise<void> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          await this.scanDirectoryRecursive(fullPath, files);
        } else if (entry.isFile()) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.warn(`Failed to scan directory ${dirPath}:`, error);
    }
  }

  /**
   * Create a backup of a file
   */
  private async createBackup(filePath: string): Promise<void> {
    try {
      // Ensure backup directory exists
      await this.ensureDirectoryExists(this.backupPath);
      
      // Create backup filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = path.basename(filePath, path.extname(filePath));
      const backupFileName = `${fileName}_${timestamp}${path.extname(filePath)}`;
      const backupPath = path.join(this.backupPath, backupFileName);
      
      // Copy file to backup location
      await fs.copyFile(filePath, backupPath);
    } catch (error) {
      console.warn(`Failed to create backup for ${filePath}:`, error);
    }
  }

  /**
   * Get the file path for a vault item
   */
  private getItemFilePath(item: VaultItem): string {
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
   * Clean up old backup files (older than 30 days)
   */
  async cleanupOldBackups(): Promise<FileOperationResult> {
    try {
      if (!await this.fileExists(this.backupPath)) {
        return { success: true };
      }
      
      const files = await this.listDirectory(this.backupPath);
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      let deletedCount = 0;
      
      for (const file of files) {
        try {
          const stats = await fs.stat(file);
          if (stats.mtime.getTime() < thirtyDaysAgo) {
            await fs.unlink(file);
            deletedCount++;
          }
        } catch (error) {
          console.warn(`Failed to process backup file ${file}:`, error);
        }
      }
      
      return {
        success: true,
        data: { deletedCount }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to cleanup backups: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get vault statistics
   */
  async getVaultStats(): Promise<FileOperationResult> {
    try {
      const stats = {
        totalFiles: 0,
        totalSize: 0,
        byType: {
          tasks: 0,
          epics: 0,
          areas: 0,
          resources: 0
        },
        byDirectory: {} as Record<string, number>
      };
      
      // Scan each directory
      for (const dirName of Object.values(DIRECTORY_NAMES)) {
        const dirPath = path.join(this.rootPath, dirName);
        if (await this.fileExists(dirPath)) {
          const files = await this.listDirectory(dirPath, true);
          stats.byDirectory[dirName] = files.length;
          stats.totalFiles += files.length;
          
          // Calculate total size
          for (const file of files) {
            try {
              const fileStats = await fs.stat(file);
              stats.totalSize += fileStats.size;
            } catch (error) {
              console.warn(`Failed to get stats for ${file}:`, error);
            }
          }
        } else {
          stats.byDirectory[dirName] = 0;
        }
      }
      
      return {
        success: true,
        data: stats
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get vault stats: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}
