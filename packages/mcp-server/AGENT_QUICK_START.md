# AI Agent Quick Start Guide - Obsidian Vault MCP Server

This guide is designed for AI agents to quickly understand and start using the Obsidian Vault MCP Server. It provides the essential information needed to integrate with and manage Obsidian vaults programmatically.

## 🚀 What This MCP Server Does

The Obsidian Vault MCP Server gives AI agents the ability to:
- **Read** and analyze Obsidian vaults
- **Create** new tasks with full metadata
- **Update** existing tasks (status, priority, due dates, etc.)
- **Search** through tasks using various filters
- **Manage** task organization and priorities

## 🎯 Essential Tools Overview

### 1. `scan_vault` - Your Starting Point
**Always start here!** This tool establishes your connection to a vault and shows you what's in it.

```json
{
  "name": "scan_vault",
  "arguments": {
    "vaultPath": "C:/Users/username/Documents/Vaults/MyVault"
  }
}
```

**What you get back:**
- Top 7 outstanding tasks
- Total task count
- Overdue tasks count
- Tasks due this week

### 2. `create_task` - Add New Tasks
Create tasks with rich metadata:

```json
{
  "name": "create_task",
  "arguments": {
    "title": "Task Title",
    "area": "Work",           // Required
    "priority": "High",       // Optional: Low/Medium/High
    "dueDate": "2025-09-15", // Optional: YYYY-MM-DD
    "description": "Task details",
    "tags": ["urgent", "work"]
  }
}
```

### 3. `update_task` - Modify Existing Tasks
Update any task property:

```json
{
  "name": "update_task",
  "arguments": {
    "taskId": "task-id-from-create-or-scan",
    "updates": {
      "status": "In Progress",
      "priority": "High"
    }
  }
}
```

### 4. `search_tasks` - Find Specific Tasks
Search with flexible filters:

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

## 🔄 Standard Workflow for AI Agents

### Step 1: Connect to a Vault
```json
// Always start by scanning a vault
{
  "name": "scan_vault",
  "arguments": {
    "vaultPath": "C:/Users/username/Documents/Vaults/MyVault"
  }
}
```

### Step 2: Understand Current State
The scan response will tell you:
- How many tasks exist
- Which ones are overdue
- What's due soon
- Current priorities

### Step 3: Take Action
Based on what you find, you can:
- Create new tasks for missing items
- Update status of existing tasks
- Search for specific information
- Prioritize urgent items

### Step 4: Iterate
Continue managing tasks as needed:
- Update progress
- Add new requirements
- Search for related items
- Monitor deadlines

## 💡 Common Use Cases for AI Agents

### 1. **Daily Task Review**
```json
// Scan vault to see what's happening today
{
  "name": "scan_vault",
  "arguments": {
    "vaultPath": "C:/Users/username/Documents/Vaults/MyVault"
  }
}

// Create a daily review task
{
  "name": "create_task",
  "arguments": {
    "title": "Daily Task Review",
    "area": "Personal",
    "priority": "Medium",
    "dueDate": "2025-08-26"
  }
}
```

### 2. **Project Planning**
```json
// Search for existing project tasks
{
  "name": "search_tasks",
  "arguments": {
    "query": "project planning",
    "area": "Work"
  }
}

// Create new project tasks
{
  "name": "create_task",
  "arguments": {
    "title": "Project Kickoff Meeting",
    "area": "Work",
    "priority": "High",
    "dueDate": "2025-08-30",
    "description": "Initial project planning session"
  }
}
```

### 3. **Task Status Updates**
```json
// Update task progress
{
  "name": "update_task",
  "arguments": {
    "taskId": "task-id-from-scan",
    "updates": {
      "status": "In Progress",
      "description": "Started working on this task - making good progress"
    }
  }
}
```

### 4. **Priority Management**
```json
// Find high-priority items
{
  "name": "search_tasks",
  "arguments": {
    "query": "urgent",
    "priority": "High",
    "status": "To Do"
  }
}

// Update priorities as needed
{
  "name": "update_task",
  "arguments": {
    "taskId": "task-id",
    "updates": {
      "priority": "High",
      "dueDate": "2025-08-27"
    }
  }
}
```

## 📋 Data Structure Understanding

### Task Properties
- **title**: What needs to be done
- **status**: Current state (To Do, In Progress, Done, Blocked)
- **area**: Context/domain (Work, Personal, Health, etc.)
- **priority**: Importance level (Low, Medium, High)
- **dueDate**: When it's due (YYYY-MM-DD format)
- **description**: Detailed information about the task
- **tags**: Labels for categorization
- **parentProjects**: Related projects/epics

### Vault Organization
```
vault-root/
├── _projects/     # Project/epic files
├── _areas/        # Area/context files
├── _resources/    # Reference materials
└── other/         # Additional content
```

## ⚠️ Important Rules for AI Agents

### 1. **Always Scan First**
- Never try to create/update tasks without scanning a vault first
- The scan establishes your connection and shows current state

### 2. **Use Real File Paths**
- Use actual paths to Obsidian vaults on the user's system
- Windows: `C:/Users/username/Documents/Vaults/VaultName`
- Mac/Linux: `/Users/username/Documents/Vaults/VaultName`

### 3. **Handle Errors Gracefully**
- If a task creation fails, check the error message
- If a task update fails, verify the task ID exists
- Always provide helpful error context to users

### 4. **Respect User Intent**
- Don't create duplicate tasks
- Ask before making major changes
- Explain what you're doing and why

## 🔧 Technical Integration

### MCP Protocol
- **Transport**: stdio (standard input/output)
- **Format**: JSON-RPC 2.0
- **Authentication**: None required (local file system)

### Response Format
All responses include a `content` array with text responses:
```json
{
  "content": [
    {
      "type": "text",
      "text": "✅ Task created successfully!"
    }
  ]
}
```

### Error Handling
Errors are returned in the same format:
```json
{
  "content": [
    {
      "type": "text",
      "text": "❌ Error: [specific error message]"
    }
  ]
}
```

## 🎯 Best Practices for AI Agents

### 1. **Start Simple**
- Begin with `scan_vault` to understand the current state
- Create simple tasks first, then add complexity
- Test with one operation before doing multiple

### 2. **Be Descriptive**
- Use clear, actionable task titles
- Include relevant context in descriptions
- Add appropriate tags for organization

### 3. **Think Ahead**
- Consider due dates and priorities
- Group related tasks with similar areas/projects
- Plan for task dependencies

### 4. **Stay Organized**
- Use consistent area names
- Apply consistent priority levels
- Maintain consistent tag conventions

### 5. **Monitor Progress**
- Regularly scan vaults for updates
- Update task status as work progresses
- Search for related items to maintain context

## 🚨 Common Pitfalls to Avoid

### 1. **Forgetting to Scan**
- Always scan before other operations
- The vault connection is session-based

### 2. **Invalid File Paths**
- Use correct path separators
- Ensure the vault directory exists
- Check file permissions

### 3. **Missing Required Fields**
- `title` and `area` are required for task creation
- `taskId` is required for updates
- `query` is required for searches

### 4. **Ignoring Error Messages**
- Read error responses carefully
- They often contain specific guidance
- Use errors to improve future requests

## 🔍 Testing Your Integration

### Quick Test Sequence
1. **Scan a vault** to establish connection
2. **Create a test task** to verify creation works
3. **Update the task** to verify updates work
4. **Search for the task** to verify search works

### Test Vault Path
Use a test vault first:
```
C:/_Dev/Artha/artha/test-vault-real
```

### Expected Results
- Scan: Should return task list and summary
- Create: Should return success message with task ID
- Update: Should return confirmation of changes
- Search: Should return matching results

## 📚 Next Steps

1. **Read the full API Reference** (`API_REFERENCE.md`) for complete details
2. **Test with a real vault** to understand your user's setup
3. **Implement error handling** for robust operation
4. **Add logging** to track your operations
5. **Consider user preferences** for task organization

## 🆘 Getting Help

- **Check error messages** - they often contain the solution
- **Verify vault structure** - ensure proper directory organization
- **Test with simple operations** - start basic, then add complexity
- **Review this guide** - covers the most common scenarios

---

**You're now ready to help users manage their Obsidian vaults! Start with a vault scan, understand the current state, and then help organize and prioritize their tasks effectively.** 🎉

