#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Table from 'cli-table3';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Task {
  file: string;
  title: string;
  status: string;
  priority: string;
  area: string;
  dueDate: string;
  parentProjects: string[] | string;
  tags: string[];
  content: string;
}

interface Frontmatter {
  Type?: string;
  Status?: string;
  Priority?: string;
  Area?: string;
  'Due Date'?: string;
  'Parent Projects'?: string[] | string;
  Tags?: string[];
  [key: string]: any;
}

function parseFrontmatter(content: string): Frontmatter {
  // Handle both Unix (\n) and Windows (\r\n) line endings
  const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!frontmatterMatch) return {};
  
  const frontmatter = frontmatterMatch[1];
  const result: Frontmatter = {};
  
  frontmatter.split(/\r?\n/).forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim();
      let value = line.substring(colonIndex + 1).trim();
      
      // Try to parse arrays and other values
      if (value.startsWith('[') && value.endsWith(']')) {
        try {
          value = JSON.parse(value);
        } catch (e) {
          // Keep as string if parsing fails
        }
      } else if (value === 'true') {
        value = 'true';
      } else if (value === 'false') {
        value = 'false';
      }
      
      result[key] = value;
    }
  });
  
  return result;
}

function scanVault(vaultPath: string): void {
  // Extract just the vault name from the path
  const vaultName = path.basename(vaultPath);
  
  const projectsDir = path.join(vaultPath, '_projects');
  
  if (!fs.existsSync(projectsDir)) {
    console.log('❌ _projects directory not found');
    return;
  }
  
  const files = fs.readdirSync(projectsDir);
  const tasks: Task[] = [];
  
  files.forEach(file => {
    if (file.endsWith('.md')) {
      const filePath = path.join(projectsDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const frontmatter = parseFrontmatter(content);
      
      if (frontmatter.Type === 'Task') {
        // Use filename as title, removing .md extension and converting to readable format
        const filename = file.replace('.md', '');
        const title = filename.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
        
        tasks.push({
          file: file,
          title: title,
          status: frontmatter.Status || 'Unknown',
          priority: frontmatter.Priority || 'Medium',
          area: frontmatter.Area || 'Unassigned',
          dueDate: frontmatter['Due Date'] || '',
          parentProjects: frontmatter['Parent Projects'] || [],
          tags: Array.isArray(frontmatter.Tags) ? frontmatter.Tags : [],
          content: content.replace(/^---[\s\S]*?---\n/, '').trim()
        });
      }
    }
  });
  
  // Filter for outstanding tasks
  const outstandingTasks = tasks.filter(task => 
    task.status !== 'Done' && task.status !== 'Completed'
  );
  
  if (outstandingTasks.length === 0) {
    console.log('🎉 No outstanding tasks found!');
    return;
  }
  
  // Sort tasks by status first, then by due date
  const sortedTasks = outstandingTasks.sort((a: Task, b: Task) => {
    // First sort by status priority
    const statusPriority: Record<string, number> = {
      'In Progress': 1,
      'To Do': 2,
      'Blocked': 3,
      'Unknown': 4
    };
    
    const statusA = statusPriority[a.status] || 5;
    const statusB = statusPriority[b.status] || 5;
    
    if (statusA !== statusB) {
      return statusA - statusB;
    }
    
    // Then sort by due date (earliest first)
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    
    return 0;
  });
  
  // Take top 7 tasks
  const topTasks = sortedTasks.slice(0, 7);
  
  // Create table
  const table = new Table({
    head: ['Task', 'Status', 'Due Date', 'Area', 'Parent Project'],
    colWidths: [40, 14, 12, 20, 20],
    chars: {
      'top': '═', 'top-mid': '╤', 'top-left': '╔', 'top-right': '╗',
      'bottom': '═', 'bottom-mid': '╧', 'bottom-left': '╚', 'bottom-right': '╝',
      'left': '║', 'left-mid': '╟', 'mid': '─', 'mid-mid': '┼',
      'right': '║', 'right-mid': '╢', 'middle': '│'
    }
  });
  
  topTasks.forEach((task: Task) => {
    // Format parent projects
    let parentProject = '';
    if (Array.isArray(task.parentProjects) && task.parentProjects.length > 0) {
      parentProject = task.parentProjects.join(', ');
    } else if (typeof task.parentProjects === 'string') {
      // Handle case where parentProjects is a string like "[[Project Name]]"
      const match = task.parentProjects.match(/\[\[([^\]]+)\]\]/);
      if (match) {
        parentProject = match[1];
      } else {
        parentProject = task.parentProjects;
      }
    }
    
    table.push([
      task.title,
      task.status,
      task.dueDate || '',
      task.area,
      parentProject
    ]);
  });
  
  // Display results
  console.log(`📋 ${vaultName}`);
  console.log(table.toString());
  
  // Summary
  const overdueTasks = outstandingTasks.filter(task => {
    if (!task.dueDate) return false;
    return new Date(task.dueDate) < new Date();
  });
  
  const thisWeekTasks = outstandingTasks.filter(task => {
    if (!task.dueDate) return false;
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return dueDate >= today && dueDate <= nextWeek;
  });
  
  console.log('\n📊 Summary:');
  console.log(`   Total outstanding tasks: ${outstandingTasks.length}`);
  console.log(`   Overdue tasks: ${overdueTasks.length}`);
  console.log(`   Due this week: ${thisWeekTasks.length}`);
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Usage: node simple-scan.js <vault-path>');
  console.log('Example: node simple-scan.js /path/to/obsidian/vault');
  process.exit(1);
}

const vaultPath = args[0];

if (!fs.existsSync(vaultPath)) {
  console.log(`❌ Vault path does not exist: ${vaultPath}`);
  process.exit(1);
}

scanVault(vaultPath);
