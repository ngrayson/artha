#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const Table = require('cli-table3');

function parseFrontmatter(content) {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) return {};
  
  const frontmatter = frontmatterMatch[1];
  const result = {};
  
  frontmatter.split('\n').forEach(line => {
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
        value = true;
      } else if (value === 'false') {
        value = false;
      }
      
      result[key] = value;
    }
  });
  
  return result;
}

function scanVault(vaultPath) {
  // Extract just the vault name from the path
  const vaultName = path.basename(vaultPath);
  
  const projectsDir = path.join(vaultPath, '_projects');
  
  if (!fs.existsSync(projectsDir)) {
    console.log('❌ _projects directory not found');
    return;
  }
  
  const files = fs.readdirSync(projectsDir);
  const tasks = [];
  
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
  const sortedTasks = outstandingTasks.sort((a, b) => {
    // First sort by status priority
    const statusPriority = {
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
    
    // Then sort by due date (earliest first, no due date last)
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate) - new Date(b.dueDate);
  });
  
  // Take top 7 tasks
  const topTasks = sortedTasks.slice(0, 7);
  
  // Create table using cli-table3
  const table = new Table({
    head: ['Task', 'Status', 'Due Date', 'Area', 'Parent Project'],
    colWidths: [40, 14, 12, 18, 18],
    style: {
      head: ['cyan', 'bold'],
      border: ['gray']
    },
    chars: {
      'top': '═', 'top-mid': '╤', 'top-left': '╔', 'top-right': '╗',
      'bottom': '═', 'bottom-mid': '╧', 'bottom-left': '╚', 'bottom-right': '╝',
      'left': '║', 'left-mid': '╟', 'mid': '─', 'mid-mid': '┼',
      'right': '║', 'right-mid': '╢', 'middle': '│'
    }
  });
  
  // Add rows to table
  topTasks.forEach(task => {
    const title = task.title || 'Untitled';
    const status = task.status || 'Unknown';
    const dueDate = task.dueDate || 'No Due Date';
    const area = (task.area || 'Unassigned').replace(/[\[\]"]/g, '');
    
    // Extract parent project from content or use empty string
    let parentProject = '';
    if (task.parentProjects && Array.isArray(task.parentProjects) && task.parentProjects.length > 0) {
      parentProject = task.parentProjects[0].replace(/[\[\]]/g, '');
    } else if (task.parentProjects && typeof task.parentProjects === 'string') {
      // Handle case where Parent Projects is stored as a string with Obsidian links
      const parentMatch = task.parentProjects.match(/\[\[([^\]]+)\]\]/);
      if (parentMatch) {
        parentProject = parentMatch[1];
      }
    } else if (task.content) {
      // Look for parent project in content as fallback
      const parentMatch = task.content.match(/Parent Projects?:\s*\[\[([^\]]+)\]\]/);
      if (parentMatch) {
        parentProject = parentMatch[1];
      }
    }
    
    table.push([title, status, dueDate, area, parentProject]);
  });
  
  // Display table directly
  console.log(table.toString());
  console.log('');
  
  // Summary statistics
  console.log('📊 Summary:');
  console.log(`   Total outstanding tasks: ${outstandingTasks.length}`);
  
  const overdueTasks = outstandingTasks.filter(task => {
    if (!task.dueDate) return false;
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    return dueDate < today;
  });
  console.log(`   Overdue tasks: ${overdueTasks.length}`);
  
  const dueThisWeek = outstandingTasks.filter(task => {
    if (!task.dueDate) return false;
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return dueDate <= weekFromNow;
  });
  console.log(`   Due this week: ${dueThisWeek.length}`);
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Usage: node simple-scan.js <vault-path>');
  console.log('Example: node simple-scan.js /path/to/obsidian/vault');
  process.exit(1);
}

const vaultPath = path.resolve(args[0]);

try {
  scanVault(vaultPath);
} catch (error) {
  console.error('❌ Error scanning vault:', error);
  process.exit(1);
}
