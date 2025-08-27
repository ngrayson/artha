# Obsidian Vault MCP Server - API Reference

This document provides the complete API specification for the Obsidian Vault MCP Server, designed for AI agents and developers to integrate with the system programmatically.

## MCP Protocol Specification

### Server Information
- **Name**: `obsidian-vault-mcp-server`
- **Version**: `0.1.0`
- **Transport**: stdio (standard input/output)
- **Protocol**: MCP 2.0

### Capabilities
```json
{
  "tools": {
    "scan_vault": "Vault scanning and analysis",
    "create_task": "Task creation and management",
    "update_task": "Task updates and modifications",
    "search_tasks": "Task search and filtering"
  }
}
```

## Tool Specifications

### 1. scan_vault

**Purpose**: Analyzes an Obsidian vault and returns outstanding tasks with summary statistics.

**Tool Name**: `scan_vault`

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "vaultPath": {
      "type": "string",
      "description": "Path to the Obsidian vault directory",
      "examples": [
        "C:/Users/username/Documents/Vaults/MyVault",
        "/Users/username/Documents/Vaults/MyVault"
      ]
    }
  },
  "required": ["vaultPath"]
}
```

**Output Schema**:
```json
{
  "type": "object",
  "properties": {
    "content": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "type": {
            "type": "string",
            "enum": ["text"]
          },
          "text": {
            "type": "string",
            "description": "Formatted task list and summary"
          }
        }
      }
    }
  }
}
```

**Response Format**:
```
🔍 Vault: [vault-path]

📋 Top 7 Outstanding Tasks:

1. **[Task Title]** ([Status]) - Due: [YYYY-MM-DD] - Area: [AreaName] - Project: [ProjectName]
2. **[Task Title]** ([Status]) - Due: [No Due Date] - Area: [AreaName]

📊 Summary:
   Total outstanding tasks: [number]
   Overdue tasks: [number]
   Due this week: [number]
```

**Example Request**:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "scan_vault",
    "arguments": {
      "vaultPath": "C:/Users/Nick/Documents/Vaults/The Study"
    }
  }
}
```

**Example Response**:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "🔍 Vault: C:/Users/Nick/Documents/Vaults/The Study\n\n📋 Top 7 Outstanding Tasks:\n\n1. **Elden Ring** (In Progress) - Due: 2025-08-29 - Area: Unassigned\n2. **The Left Hand of Darkness** (In Progress) - Due: No Due Date - Area: Unassigned\n\n📊 Summary:\n   Total outstanding tasks: 32\n   Overdue tasks: 8\n   Due this week: 5"
      }
    ]
  }
}
```

### 2. create_task

**Purpose**: Creates a new task in the specified Obsidian vault.

**Tool Name**: `create_task`

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "title": {
      "type": "string",
      "description": "Task title",
      "minLength": 1
    },
    "area": {
      "type": "string",
      "description": "Area/context for the task",
      "minLength": 1
    },
    "status": {
      "type": "string",
      "enum": ["To Do", "In Progress", "Done", "Blocked"],
      "default": "To Do",
      "description": "Task status"
    },
    "dueDate": {
      "type": "string",
      "pattern": "^\\d{4}-\\d{2}-\\d{2}$",
      "description": "Due date in YYYY-MM-DD format"
    },
    "priority": {
      "type": "string",
      "enum": ["Low", "Medium", "High"],
      "default": "Medium",
      "description": "Task priority level"
    },
    "parentProjects": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "Array of parent project names"
    },
    "tags": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "Array of tags"
    },
    "description": {
      "type": "string",
      "description": "Task description/content"
    }
  },
  "required": ["title", "area"]
}
```

**Output Schema**:
```json
{
  "type": "object",
  "properties": {
    "content": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "type": {
            "type": "string",
            "enum": ["text"]
          },
          "text": {
            "type": "string",
            "description": "Task creation confirmation with metadata"
          }
        }
      }
    }
  }
}
```

**Response Format**:
```
✅ Task "[Task Title]" created successfully!

Task ID: [generated-task-id]
Status: [Status]
Area: [Area]
Due Date: [YYYY-MM-DD or No due date]
```

**Example Request**:
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "create_task",
    "arguments": {
      "title": "Review Quarterly Report",
      "area": "Work",
      "priority": "High",
      "dueDate": "2025-09-15",
      "description": "Review and approve Q3 quarterly report for stakeholders",
      "tags": ["work", "report", "quarterly"]
    }
  }
}
```

**Example Response**:
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "✅ Task \"Review Quarterly Report\" created successfully!\n\nTask ID: task-review-quarterly-report-abc123\nStatus: To Do\nArea: Work\nDue Date: 2025-09-15"
      }
    ]
  }
}
```

### 3. update_task

**Purpose**: Updates an existing task in the vault.

**Tool Name**: `update_task`

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "taskId": {
      "type": "string",
      "description": "ID of the task to update",
      "minLength": 1
    },
    "updates": {
      "type": "object",
      "properties": {
        "title": {
          "type": "string",
          "description": "New task title"
        },
        "status": {
          "type": "string",
          "enum": ["To Do", "In Progress", "Done", "Blocked"],
          "description": "New task status"
        },
        "priority": {
          "type": "string",
          "enum": ["Low", "Medium", "High"],
          "description": "New priority level"
        },
        "dueDate": {
          "type": "string",
          "pattern": "^\\d{4}-\\d{2}-\\d{2}$",
          "description": "New due date in YYYY-MM-DD format"
        },
        "area": {
          "type": "string",
          "description": "New area/context"
        },
        "tags": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "description": "New tags array"
        },
        "description": {
          "type": "string",
          "description": "New task description"
        }
      }
    }
  },
  "required": ["taskId", "updates"]
}
```

**Output Schema**:
```json
{
  "type": "object",
  "properties": {
    "content": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "type": {
            "type": "string",
            "enum": ["text"]
          },
          "text": {
            "type": "string",
            "description": "Update confirmation with current task information"
          }
        }
      }
    }
  }
}
```

**Response Format**:
```
✅ Task "[Task Title]" updated successfully!

Updated fields: [list of updated fields]

Current status: [Status]
Priority: [Priority]
Area: [Area]
```

**Example Request**:
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "update_task",
    "arguments": {
      "taskId": "task-review-quarterly-report-abc123",
      "updates": {
        "status": "In Progress",
        "description": "Started reviewing the report - found several areas that need attention"
      }
    }
  }
}
```

**Example Response**:
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "✅ Task \"Review Quarterly Report\" updated successfully!\n\nUpdated fields: status, description\n\nCurrent status: In Progress\nPriority: High\nArea: Work"
      }
    ]
  }
}
```

### 4. search_tasks

**Purpose**: Searches for tasks in the vault based on various criteria.

**Tool Name**: `search_tasks`

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "query": {
      "type": "string",
      "description": "Search query text",
      "minLength": 1
    },
    "status": {
      "type": "string",
      "enum": ["To Do", "In Progress", "Done", "Blocked"],
      "description": "Filter by task status"
    },
    "area": {
      "type": "string",
      "description": "Filter by area/context"
    },
    "tags": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "Filter by tags"
    },
    "limit": {
      "type": "number",
      "minimum": 1,
      "maximum": 100,
      "default": 20,
      "description": "Maximum number of results to return"
    }
  },
  "required": ["query"]
}
```

**Output Schema**:
```json
{
  "type": "object",
  "properties": {
    "content": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "type": {
            "type": "string",
            "enum": ["text"]
          },
          "text": {
            "type": "string",
            "description": "Formatted search results"
          }
        }
      }
    }
  }
}
```

**Response Format**:
```
🔍 Search Results for "[query]":

1. **[Task Title]** ([Status]) - [Area] - Project: [ProjectName]
2. **[Task Title]** ([Status]) - [Area]

Found [number] tasks.
```

**Example Request**:
```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "tools/call",
  "params": {
    "name": "search_tasks",
    "arguments": {
      "query": "meeting",
      "area": "Work",
      "status": "To Do",
      "limit": 10
    }
  }
}
```

**Example Response**:
```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "🔍 Search Results for \"meeting\":\n\n1. **Team Standup** (To Do) - Work - Project: Daily Operations\n2. **Project Review Meeting** (To Do) - Work - Project: Q3 Planning\n\nFound 2 tasks."
      }
    ]
  }
}
```

## Error Handling

### Error Response Format
```json
{
  "jsonrpc": "2.0",
  "id": [request-id],
  "error": {
    "code": [error-code],
    "message": "[error-message]",
    "data": {
      "details": "[additional-error-details]"
    }
  }
}
```

### Common Error Codes
- **-32600**: Invalid Request (malformed JSON-RPC)
- **-32601**: Method Not Found (unknown tool)
- **-32602**: Invalid Params (invalid arguments)
- **-32603**: Internal Error (server-side error)

### Error Scenarios

#### Vault Not Initialized
```json
{
  "content": [
    {
      "type": "text",
      "text": "❌ Error: Vault not initialized. Please scan a vault first."
    }
  ]
}
```

#### Task Creation Failed
```json
{
  "content": [
    {
      "type": "text",
      "text": "❌ Error creating task: Failed to create task: [specific-error-message]"
    }
  ]
}
```

#### Task Not Found
```json
{
  "content": [
    {
      "type": "text",
      "text": "❌ Error updating task: Failed to update task: Item not found: [task-id]"
    }
  ]
}
```

## Workflow Patterns

### 1. Initial Vault Setup
```json
// Step 1: Scan vault to establish connection
{
  "name": "scan_vault",
  "arguments": {
    "vaultPath": "/path/to/vault"
  }
}
```

### 2. Task Management Workflow
```json
// Step 1: Create a new task
{
  "name": "create_task",
  "arguments": {
    "title": "New Task",
    "area": "Work",
    "priority": "High"
  }
}

// Step 2: Update task status
{
  "name": "update_task",
  "arguments": {
    "taskId": "task-id-from-step-1",
    "updates": {
      "status": "In Progress"
    }
  }
}

// Step 3: Search for related tasks
{
  "name": "search_tasks",
  "arguments": {
    "query": "work",
    "area": "Work"
  }
}
```

### 3. Bulk Operations
```json
// Create multiple related tasks
[
  {
    "name": "create_task",
    "arguments": {
      "title": "Task 1",
      "area": "Project A"
    }
  },
  {
    "name": "create_task", 
    "arguments": {
      "title": "Task 2",
      "area": "Project A"
    }
  }
]
```

## Data Types and Constraints

### Task Status Values
- `"To Do"`: Task is pending
- `"In Progress"`: Task is currently being worked on
- `"Done"`: Task is completed
- `"Blocked"`: Task is blocked and cannot proceed

### Priority Levels
- `"Low"`: Low priority task
- `"Medium"`: Normal priority task (default)
- `"High"`: High priority task

### Date Format
- **Format**: `YYYY-MM-DD`
- **Example**: `2025-08-30`
- **Validation**: Must be a valid date string

### File Paths
- **Windows**: `C:/Users/username/Documents/Vaults/VaultName`
- **Unix/Mac**: `/Users/username/Documents/Vaults/VaultName`
- **Note**: Use forward slashes even on Windows for consistency

## Performance Considerations

### Response Times
- **Vault Scan**: 100-500ms depending on vault size
- **Task Creation**: 50-200ms
- **Task Update**: 50-150ms
- **Task Search**: 100-300ms

### Scalability
- **Vault Size**: Tested with vaults containing 1000+ files
- **Concurrent Operations**: Supports multiple simultaneous requests
- **Memory Usage**: Minimal memory footprint, scales with vault size

### Caching
- **Vault Index**: Cached after initial scan
- **Search Results**: Not cached (always fresh)
- **Task Metadata**: Cached during session

## Security and Permissions

### File System Access
- **Read Access**: Required for all operations
- **Write Access**: Required for create/update operations
- **Directory Creation**: Required for new task files

### Data Privacy
- **Local Only**: No data transmitted externally
- **File Permissions**: Respects existing file system permissions
- **No Logging**: No sensitive data logged

### Validation
- **Input Sanitization**: All inputs validated and sanitized
- **Path Validation**: Prevents directory traversal attacks
- **Type Checking**: Strict type validation for all inputs

## Integration Examples

### Python Client Example
```python
import json
import subprocess

class ObsidianMCPClient:
    def __init__(self, server_path):
        self.server_path = server_path
    
    def call_tool(self, tool_name, arguments):
        request = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "tools/call",
            "params": {
                "name": tool_name,
                "arguments": arguments
            }
        }
        
        process = subprocess.Popen(
            ["node", self.server_path],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        stdout, stderr = process.communicate(json.dumps(request))
        return json.loads(stdout)
    
    def scan_vault(self, vault_path):
        return self.call_tool("scan_vault", {"vaultPath": vault_path})
    
    def create_task(self, title, area, **kwargs):
        args = {"title": title, "area": area, **kwargs}
        return self.call_tool("create_task", args)

# Usage
client = ObsidianMCPClient("./dist/index.js")
result = client.scan_vault("/path/to/vault")
print(result)
```

### JavaScript Client Example
```javascript
import { spawn } from 'child_process';

class ObsidianMCPClient {
    constructor(serverPath) {
        this.serverPath = serverPath;
    }
    
    async callTool(toolName, arguments) {
        return new Promise((resolve, reject) => {
            const process = spawn('node', [this.serverPath]);
            
            const request = {
                jsonrpc: "2.0",
                id: 1,
                method: "tools/call",
                params: {
                    name: toolName,
                    arguments: arguments
                }
            };
            
            let stdout = '';
            process.stdout.on('data', (data) => {
                stdout += data.toString();
            });
            
            process.on('close', (code) => {
                if (code === 0) {
                    try {
                        const response = JSON.parse(stdout);
                        resolve(response);
                    } catch (error) {
                        reject(new Error('Invalid JSON response'));
                    }
                } else {
                    reject(new Error(`Process exited with code ${code}`));
                }
            });
            
            process.stdin.write(JSON.stringify(request));
            process.stdin.end();
        });
    }
    
    async scanVault(vaultPath) {
        return this.callTool('scan_vault', { vaultPath });
    }
    
    async createTask(title, area, options = {}) {
        return this.callTool('create_task', { title, area, ...options });
    }
}

// Usage
const client = new ObsidianMCPClient('./dist/index.js');
client.scanVault('/path/to/vault')
    .then(result => console.log(result))
    .catch(error => console.error(error));
```

## Testing and Validation

### Test Vault Structure
```
test-vault/
├── _projects/
│   ├── project-a.md
│   └── project-b.md
├── _areas/
│   ├── work.md
│   └── personal.md
└── _resources/
    └── reference.md
```

### Validation Commands
```bash
# Test server compilation
npm run build

# Run unit tests
npm test

# Test with real vault
node test-vault-integration.js

# Test MCP protocol
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | node dist/index.js
```

### Expected Test Results
- **Vault Scan**: Should return formatted task list
- **Task Creation**: Should create file and return confirmation
- **Task Update**: Should modify existing file and return confirmation
- **Task Search**: Should return filtered results

## Troubleshooting Guide

### Common Issues and Solutions

#### 1. Server Won't Start
**Symptoms**: `npm start` fails or hangs
**Solutions**:
- Check Node.js version (requires 18+)
- Verify all dependencies installed (`npm install`)
- Check for port conflicts
- Review error logs

#### 2. Vault Access Denied
**Symptoms**: Permission errors when scanning vault
**Solutions**:
- Verify vault directory permissions
- Check if directory exists and is accessible
- Ensure user has read/write access
- Try running with elevated permissions

#### 3. Tool Not Found
**Symptoms**: "Method not found" errors
**Solutions**:
- Verify tool name spelling
- Check if server is running
- Ensure MCP protocol version compatibility
- Review server logs for errors

#### 4. Invalid Arguments
**Symptoms**: "Invalid params" errors
**Solutions**:
- Check argument schema requirements
- Verify data types (string, number, array)
- Ensure required fields are provided
- Validate date format (YYYY-MM-DD)

#### 5. Task Creation Fails
**Symptoms**: Task creation returns error
**Solutions**:
- Verify vault has proper structure (_projects, _areas)
- Check write permissions in vault directory
- Ensure task title is not empty
- Validate all required fields

### Debug Mode
Enable detailed logging:
```bash
DEBUG=true npm start
```

### Log Analysis
Common log patterns:
- **Vault Scan**: `Scanning vault: [path]`
- **Task Creation**: `Creating task: [title]`
- **Task Update**: `Updating task: [id]`
- **Task Search**: `Searching for: [query]`

## Support and Resources

### Documentation
- **README.md**: Getting started and basic usage
- **API_REFERENCE.md**: This document - complete API specification
- **Implementation Status**: Current development status

### Testing
- **Unit Tests**: `npm test`
- **Integration Tests**: `node test-vault-integration.js`
- **Manual Testing**: Direct MCP protocol testing

### Community
- **GitHub Issues**: Bug reports and feature requests
- **Discussions**: General questions and support
- **Contributions**: Pull requests and improvements

---

**This API reference provides everything needed for AI agents and developers to integrate with the Obsidian Vault MCP Server. For additional support, refer to the main README.md or open an issue on GitHub.**

