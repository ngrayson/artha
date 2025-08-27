import { ParsedMarkdown, FrontmatterData } from '../types/common';
import { VaultItem, VaultItemType } from '../types/vault-items';
import { TEMPLATE_VARIABLES } from './constants';

/**
 * Parse markdown content with YAML frontmatter
 */
export function parseMarkdown(content: string): ParsedMarkdown {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (match) {
    const [, frontmatterYaml, markdownContent] = match;
    const frontmatter = parseYamlFrontmatter(frontmatterYaml);
    return {
      frontmatter,
      content: markdownContent.trim(),
      raw: content,
    };
  }

  // No frontmatter found
  return {
    frontmatter: {},
    content: content.trim(),
    raw: content,
  };
}

/**
 * Parse YAML frontmatter string into object
 */
export function parseYamlFrontmatter(yamlString: string): FrontmatterData {
  try {
    // Simple YAML parsing for basic key-value pairs
    const lines = yamlString.trim().split('\n');
    const result: FrontmatterData = {};

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const colonIndex = trimmedLine.indexOf(':');
        if (colonIndex > 0) {
          const key = trimmedLine.substring(0, colonIndex).trim();
          let value: any = trimmedLine.substring(colonIndex + 1).trim();
          
          // Handle quoted strings
          if ((value.startsWith('"') && value.endsWith('"')) || 
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          
          // Handle arrays
          if (value.startsWith('[') && value.endsWith(']')) {
            value = parseArrayValue(value);
          }
          
          // Handle booleans
          if (value === 'true' || value === 'false') {
            value = value === 'true';
          }
          
          // Handle numbers
          if (!isNaN(Number(value)) && value !== '') {
            value = Number(value);
          }
          
          result[key] = value;
        }
      }
    }

    return result;
  } catch (error) {
    console.warn('Failed to parse YAML frontmatter:', error);
    return {};
  }
}

/**
 * Parse array values from YAML frontmatter
 */
function parseArrayValue(arrayString: string): any[] {
  try {
    // Remove brackets and split by comma
    const content = arrayString.slice(1, -1).trim();
    if (!content) return [];
    
    return content.split(',').map(item => {
      const trimmed = item.trim();
      // Handle quoted strings
      if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || 
          (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
        return trimmed.slice(1, -1);
      }
      return trimmed;
    });
  } catch (error) {
    console.warn('Failed to parse array value:', arrayString, error);
    return [];
  }
}

/**
 * Generate markdown content with frontmatter
 */
export function generateMarkdown(frontmatter: FrontmatterData, content: string): string {
  const frontmatterYaml = generateYamlFrontmatter(frontmatter);
  return `---\n${frontmatterYaml}\n---\n\n${content}`;
}

/**
 * Generate YAML frontmatter string from object
 */
export function generateYamlFrontmatter(data: FrontmatterData): string {
  const lines: string[] = [];
  
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        lines.push(`${key}: [${value.map(v => `"${v}"`).join(', ')}]`);
      } else if (typeof value === 'string') {
        // Escape quotes in strings
        const escapedValue = value.replace(/"/g, '\\"');
        lines.push(`${key}: "${escapedValue}"`);
      } else if (typeof value === 'boolean') {
        lines.push(`${key}: ${value}`);
      } else {
        lines.push(`${key}: ${value}`);
      }
    }
  }
  
  return lines.join('\n');
}

/**
 * Extract title from markdown content (first heading or filename)
 */
export function extractTitle(content: string, filename?: string): string {
  // Try to find first heading
  const headingMatch = content.match(/^#\s+(.+)$/m);
  if (headingMatch) {
    return headingMatch[1].trim();
  }
  
  // Fall back to filename without extension
  if (filename) {
    return filename.replace(/\.md$/, '');
  }
  
  return 'Untitled';
}

/**
 * Generate filename from title
 */
export function generateFilename(title: string, type: VaultItemType): string {
  const sanitizedTitle = title
    .replace(/[<>:"/\\|?*]/g, '') // Remove invalid characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .toLowerCase()
    .trim();
  
  return `${sanitizedTitle}.md`;
}

/**
 * Apply template variables to content
 */
export function applyTemplateVariables(template: string, variables: Record<string, any>): string {
  let result = template;
  
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    if (typeof value === 'string') {
      result = result.replace(new RegExp(placeholder, 'g'), value);
    } else if (Array.isArray(value)) {
      result = result.replace(new RegExp(placeholder, 'g'), value.join(', '));
    } else if (value !== undefined && value !== null) {
      result = result.replace(new RegExp(placeholder, 'g'), String(value));
    }
  }
  
  return result;
}

/**
 * Validate markdown content structure
 */
export function validateMarkdownStructure(content: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check for basic markdown structure
  if (!content.trim()) {
    errors.push('Content cannot be empty');
  }
  
  // Check for excessive length
  if (content.length > 10000) {
    errors.push('Content exceeds maximum length of 10,000 characters');
  }
  
  // Check for balanced frontmatter
  const frontmatterCount = (content.match(/---/g) || []).length;
  if (frontmatterCount % 2 !== 0) {
    errors.push('Unbalanced frontmatter delimiters (---)');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Clean and normalize markdown content
 */
export function normalizeMarkdown(content: string): string {
  return content
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\n{3,}/g, '\n\n') // Remove excessive blank lines
    .trim();
}

/**
 * Extract tags from content and frontmatter
 */
export function extractTags(content: string, frontmatter: FrontmatterData): string[] {
  const tags: Set<string> = new Set();
  
  // Add tags from frontmatter
  if (frontmatter.tags && Array.isArray(frontmatter.tags)) {
    frontmatter.tags.forEach(tag => {
      if (typeof tag === 'string' && tag.trim()) {
        tags.add(tag.trim());
      }
    });
  }
  
  // Extract hashtags from content
  const hashtagRegex = /#([a-zA-Z0-9_-]+)/g;
  let match;
  while ((match = hashtagRegex.exec(content)) !== null) {
    tags.add(match[1]);
  }
  
  return Array.from(tags).sort();
}

/**
 * Generate summary from markdown content
 */
export function generateSummary(content: string, maxLength: number = 150): string {
  // Remove markdown formatting
  const plainText = content
    .replace(/[#*`~\[\]()]/g, '') // Remove markdown syntax
    .replace(/\n+/g, ' ') // Replace newlines with spaces
    .trim();
  
  if (plainText.length <= maxLength) {
    return plainText;
  }
  
  // Truncate at word boundary
  const truncated = plainText.substring(0, maxLength);
  const lastSpaceIndex = truncated.lastIndexOf(' ');
  
  if (lastSpaceIndex > 0) {
    return truncated.substring(0, lastSpaceIndex) + '...';
  }
  
  return truncated + '...';
}
