#!/usr/bin/env node

/**
 * Obsidian Vault Scanner
 * Pure JavaScript - no dependencies
 * Works on Windows and Linux
 */

const fs = require('fs');
const path = require('path');

class VaultScanner {
    constructor(vaultPath) {
        this.vaultPath = vaultPath;
        this.projects = []; // Contains Epics and Tasks
        this.areas = [];
        this.resources = [];
    }

    // Extract frontmatter from markdown files
    extractFrontmatter(content) {
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
        if (!frontmatterMatch) return {};
        
        const frontmatter = {};
        const lines = frontmatterMatch[1].split('\n');
        
        for (const line of lines) {
            const [key, ...valueParts] = line.split(':');
            if (key && valueParts.length > 0) {
                const value = valueParts.join(':').trim();
                frontmatter[key.trim()] = value;
            }
        }
        
        return frontmatter;
    }

    // Scan a directory recursively
    scanDirectory(dirPath, relativePath = '') {
        try {
            const items = fs.readdirSync(dirPath);
            
            for (const item of items) {
                // Skip hidden files and system files, but allow underscore directories
                if (item.startsWith('.') || (item.startsWith('_') && item.length === 1)) continue;
                
                const fullPath = path.join(dirPath, item);
                const relativeItemPath = path.join(relativePath, item);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory()) {
                    this.scanDirectory(fullPath, relativeItemPath);
                } else if (item.endsWith('.md')) {
                    this.processMarkdownFile(fullPath, relativeItemPath);
                }
            }
        } catch (error) {
            console.log(`Error scanning ${dirPath}: ${error.message}`);
        }
    }

    // Process individual markdown files
    processMarkdownFile(filePath, relativePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const frontmatter = this.extractFrontmatter(content);
            
            if (frontmatter.Type) {
                const item = {
                    path: relativePath,
                    type: frontmatter.Type,
                    status: frontmatter.Status || 'Unknown',
                    title: frontmatter.Title || path.basename(relativePath, '.md'),
                    dueDate: frontmatter['Due Date'] || null,
                    areas: frontmatter.Areas || [],
                    tags: frontmatter.Tags || [],
                    maintenance: frontmatter.Maintenance || null,
                    pinned: frontmatter.Pinned || false
                };

                switch (frontmatter.Type.toLowerCase()) {
                    case 'epic':
                        this.projects.push(item); // Epics are major initiatives
                        break;
                    case 'task':
                        this.projects.push(item); // Tasks are actionable items
                        break;
                    case 'area':
                        this.areas.push(item);
                        break;
                    case 'resource':
                        this.resources.push(item);
                        break;
                }
            }
        } catch (error) {
            console.log(`Error processing ${filePath}: ${error.message}`);
        }
    }

    // Get projects with due dates
    getProjectsWithDueDates() {
        return this.projects
            .filter(p => p.dueDate)
            .sort((a, b) => {
                const dateA = new Date(a.dueDate);
                const dateB = new Date(b.dueDate);
                return dateA - dateB;
            });
    }

    // Get active projects (epics and tasks)
    getActiveProjects() {
        return this.projects.filter(p => 
            p.status.toLowerCase() === 'active' || 
            p.status.toLowerCase() === 'in progress'
        );
    }

    // Get epics specifically
    getEpics() {
        return this.projects.filter(p => p.type.toLowerCase() === 'epic');
    }

    // Get tasks specifically
    getTasks() {
        return this.projects.filter(p => p.type.toLowerCase() === 'task');
    }

    // Get active tasks
    getActiveTasks() {
        return this.projects.filter(p => 
            p.type.toLowerCase() === 'task' && 
            (p.status.toLowerCase() === 'active' || 
             p.status.toLowerCase() === 'in progress' ||
             p.status.toLowerCase() === 'to do')
        );
    }

    // Get projects by area
    getProjectsByArea(areaName) {
        return this.projects.filter(p => 
            p.areas.some(area => 
                area.toLowerCase().includes(areaName.toLowerCase())
            )
        );
    }

    // Get urgent projects (epics and tasks due within days)
    getUrgentProjects(days = 7) {
        const now = new Date();
        const cutoff = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));
        
        return this.projects.filter(p => {
            if (!p.dueDate) return false;
            const dueDate = new Date(p.dueDate);
            return dueDate <= cutoff && dueDate >= now;
        }).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    }

    // Print summary
    printSummary() {
        console.log('\n=== OBSIDIAN VAULT SUMMARY ===\n');
        
        console.log(`📁 Projects: ${this.projects.length} (Epics + Tasks)`);
        console.log(`🏠 Areas: ${this.areas.length}`);
        console.log(`📚 Resources: ${this.resources.length}\n`);
        
        // Active projects
        const activeProjects = this.getActiveProjects();
        if (activeProjects.length > 0) {
            console.log('🚀 ACTIVE PROJECTS:');
            activeProjects.forEach(p => {
                const dueInfo = p.dueDate ? ` (Due: ${p.dueDate})` : ` (${p.type})`;
                console.log(`  • ${p.title}${dueInfo}`);
            });
            console.log('');
        }
        
        // Urgent projects
        const urgentProjects = this.getUrgentProjects(7);
        if (urgentProjects.length > 0) {
            console.log('⚠️  URGENT PROJECTS (Next 7 days):');
            urgentProjects.forEach(p => {
                console.log(`  • ${p.title} - Due: ${p.dueDate}`);
            });
            console.log('');
        }

        // Overdue tasks
        const overdueTasks = this.projects.filter(p => {
            if (!p.dueDate || p.type.toLowerCase() !== 'task') return false;
            const dueDate = new Date(p.dueDate);
            const now = new Date();
            return dueDate < now && p.status.toLowerCase() !== 'completed';
        });
        if (overdueTasks.length > 0) {
            console.log('🚨 OVERDUE TASKS:');
            overdueTasks.forEach(p => {
                console.log(`  • ${p.title} - Was due: ${p.dueDate}`);
            });
            console.log('');
        }
        
        // Areas needing attention
        const areasNeedingAttention = this.areas.filter(a => 
            a.maintenance && a.status.toLowerCase() === 'active'
        );
        if (areasNeedingAttention.length > 0) {
            console.log('🔧 AREAS NEEDING ATTENTION:');
            areasNeedingAttention.forEach(a => {
                console.log(`  • ${a.title} (${a.maintenance})`);
            });
            console.log('');
        }
    }

    // Print detailed project list
    printProjectDetails() {
        console.log('\n=== PROJECT DETAILS ===\n');
        
        this.projects.forEach(p => {
            console.log(`📋 ${p.title}`);
            console.log(`   Type: ${p.type}`);
            console.log(`   Status: ${p.status}`);
            if (p.dueDate) console.log(`   Due: ${p.dueDate}`);
            if (p.areas.length > 0) console.log(`   Areas: ${p.areas.join(', ')}`);
            if (p.tags.length > 0) console.log(`   Tags: ${p.tags.join(', ')}`);
            console.log('');
        });
    }

    // Main scan method
    scan() {
        console.log(`Scanning vault: ${this.vaultPath}`);
        
        // Scan main directories
        const mainDirs = ['_projects', '_areas', '_resources'];
        
        for (const dir of mainDirs) {
            const fullPath = path.join(this.vaultPath, dir);
            if (fs.existsSync(fullPath)) {
                console.log(`Scanning ${dir}...`);
                this.scanDirectory(fullPath, dir);
            }
        }
        
        return this;
    }
}

// Main execution
if (require.main === module) {
    const args = process.argv.slice(2);
    const vaultPath = args.find(arg => !arg.startsWith('--')) || process.cwd();
    const scanner = new VaultScanner(vaultPath);
    
    scanner.scan();
    scanner.printSummary();
    
    // Show detailed projects if requested
    if (args.includes('--details')) {
        scanner.printProjectDetails();
    }
    
    // Show urgent projects if requested
    if (args.includes('--urgent')) {
        const urgent = scanner.getUrgentProjects(7);
        console.log('\n=== URGENT PROJECTS ===\n');
        urgent.forEach(p => {
            console.log(`⚠️  ${p.title} - Due: ${p.dueDate}`);
        });
    }
}

module.exports = VaultScanner;
