# Obsidian Vault MCP Server

A Model Context Protocol (MCP) server that provides AI agents with tools to interact with Obsidian vaults. This server enables AI agents to scan vaults, create tasks, update tasks, and search through vault items programmatically.

## Overview

The Obsidian Vault MCP Server acts as a bridge between AI agents and Obsidian vaults, allowing agents to:
- Scan and analyze vault contents
- Create new tasks with metadata
- Update existing tasks
- Search through vault items
- Manage task priorities, due dates, and areas

## Installation & Setup

### Prerequisites
- Node.js 18+ 
- Access to an Obsidian vault directory
- MCP-compatible AI agent

### Installation
```bash
cd packages/mcp-server
npm install
npm run build
```

### Starting the Server
```bash
npm start
```

The server runs as a stdio-based MCP server, communicating with AI agents through standard input/output.

## Available Tools

### 1. `scan_vault` - Vault Analysis
Scans an Obsidian vault and returns outstanding tasks with summary statistics.

**Input Schema:**
```json
{
  "vaultPath": "string" // Path to the Obsidian vault directory
}
```

**Output:**
Returns a formatted list of top 7 outstanding tasks, sorted by priority and due date, along with summary statistics including:
- Total outstanding tasks
- Overdue tasks count
- Tasks due this week

**Example Response:**
```
🔍 Vault: /path/to/vault

📋 Top 7 Outstanding Tasks:

1. **Task Title** (Status) - Due: YYYY-MM-DD - Area: AreaName - Project: ProjectName
2. **Another Task** (In Progress) - Due: No Due Date - Area: Work

📊 Summary:
   Total outstanding tasks: 25
   Overdue tasks: 3
   Due this week: 7
```

### 2. `create_task` - Task Creation
Creates a new task in the specified Obsidian vault.

**Input Schema:**
```json
{
  "title": "string",           // Required: Task title
  "area": "string",            // Required: Area/context for the task
  "status": "string",          // Optional: Task status (default: "To Do")
  "dueDate": "string",         // Optional: Due date in YYYY-MM-DD format
  "priority": "string",        // Optional: Priority level (Low/Medium/High, default: Medium)
  "parentProjects": ["string"], // Optional: Array of parent project names
  "tags": ["string"],          // Optional: Array of tags
  "description": "string"      // Optional: Task description/content
}
```

**Output:**
Returns confirmation of task creation with task ID and metadata.

**Example Response:**
```
✅ Task "New Task Title" created successfully!

Task ID: task-new-task-title-abc123
Status: To Do
Area: Work
Due Date: 2025-09-01
```

### 3. `update_task` - Task Updates
Updates an existing task in the vault.

**Input Schema:**
```json
{
  "taskId": "string",          // Required: ID of the task to update
  "updates": {
    "title": "string",         // Optional: New title
    "status": "string",        // Optional: New status
    "priority": "string",      // Optional: New priority
    "dueDate": "string",       // Optional: New due date
    "area": "string",          // Optional: New area
    "tags": ["string"],        // Optional: New tags array
    "description": "string"    // Optional: New description
  }
}
```

**Output:**
Returns confirmation of successful update with current task information.

**Example Response:**
```
✅ Task "Updated Task Title" updated successfully!

Updated fields: status, priority

Current status: In Progress
Priority: High
Area: Work
```

### 4. `search_tasks` - Task Search
Searches for tasks in the vault based on various criteria.

**Input Schema:**
```json
{
  "query": "string",           // Required: Search query text
  "status": "string",          // Optional: Filter by status
  "area": "string",            // Optional: Filter by area
  "tags": ["string"],          // Optional: Filter by tags
  "limit": "number"            // Optional: Maximum results (default: 20)
}
```

**Output:**
Returns formatted search results with task details.

**Example Response:**
```
🔍 Search Results for "project planning":

1. **Project Planning Meeting** (To Do) - Work - Project: Q4 Planning
2. **Review Project Timeline** (In Progress) - Work - Project: Q4 Planning

Found 2 tasks.
```

## Vault Structure Requirements

The MCP server expects the Obsidian vault to follow a specific structure:

```
vault-root/
├── _projects/          # Project/epic files
├── _areas/            # Area/context files  
├── _resources/        # Resource files
└── other-directories/ # Other content
```

### File Format Requirements
- Files must be in Markdown format (.md)
- Frontmatter must be in YAML format
- Task files should include status, due date, area, and other metadata

### Supported Task Statuses
- "To Do"
- "In Progress" 
- "Done"
- "Blocked"

### Supported Priority Levels
- "Low"
- "Medium" 
- "High"

## Error Handling

The server provides comprehensive error handling:

- **Vault Not Initialized**: Error when trying to use tools before scanning a vault
- **File System Errors**: Permission errors, missing directories, etc.
- **Validation Errors**: Invalid input data, missing required fields
- **Item Not Found**: Attempting to update non-existent tasks

All errors are returned in a user-friendly format with actionable information.

## Usage Examples

### Basic Vault Scanning
```json
{
  "name": "scan_vault",
  "arguments": {
    "vaultPath": "/Users/username/Documents/ObsidianVault"
  }
}
```

### Creating a High-Priority Task
```json
{
  "name": "create_task", 
  "arguments": {
    "title": "Urgent Bug Fix",
    "area": "Development",
    "priority": "High",
    "dueDate": "2025-08-30",
    "description": "Fix critical authentication bug in production"
  }
}
```

### Updating Task Status
```json
{
  "name": "update_task",
  "arguments": {
    "taskId": "task-urgent-bug-fix-abc123",
    "updates": {
      "status": "In Progress",
      "description": "Working on authentication fix - found root cause"
    }
  }
}
```

### Searching for Work Tasks
```json
{
  "name": "search_tasks",
  "arguments": {
    "query": "meeting",
    "area": "Work",
    "status": "To Do",
    "limit": 10
  }
}
```

## Integration with AI Agents

### MCP Protocol Compliance
This server implements the Model Context Protocol specification, making it compatible with:
- Claude Desktop
- GPT-4 with MCP support
- Other MCP-compatible AI agents

### Communication Protocol
- **Transport**: stdio (standard input/output)
- **Format**: JSON-based request/response
- **Authentication**: None required (local file system access)

### Agent Workflow
1. **Initialize**: Scan a vault to establish connection
2. **Analyze**: Use scan_vault to understand current state
3. **Create**: Add new tasks as needed
4. **Update**: Modify existing tasks based on progress
5. **Search**: Find specific tasks or information
6. **Iterate**: Continue managing tasks as needed

## Security Considerations

- **Local Access Only**: Server only accesses local file systems
- **No Network Exposure**: All operations are local to the machine
- **File Permissions**: Respects existing file system permissions
- **Data Privacy**: No data is transmitted externally

## Troubleshooting

### Common Issues

1. **Permission Denied**
   - Ensure the vault directory is accessible
   - Check file system permissions

2. **Vault Not Found**
   - Verify the vault path is correct
   - Ensure the directory contains Obsidian files

3. **Task Creation Fails**
   - Check if the vault has proper structure (_projects, _areas directories)
   - Verify write permissions in the vault directory

4. **Search Returns No Results**
   - Ensure the vault has been scanned first
   - Check if tasks exist with the specified criteria

### Debug Mode
Enable debug logging by setting environment variable:
```bash
DEBUG=true npm start
```

## Development

### Building from Source
```bash
npm install
npm run build
npm test
```

### Testing
```bash
npm test                    # Run unit tests
node test-vault-integration.js  # Integration test with real vault
```

### Architecture
- **MCP Server**: Handles protocol communication
- **VaultManager**: Core vault operations
- **Tool Handlers**: Individual tool implementations
- **Error Handling**: Comprehensive error management

## License

This project is part of the Artha workspace and follows the same licensing terms.

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review error messages for specific guidance
3. Verify vault structure and permissions
4. Ensure all prerequisites are met
