# 🚀 Artha MCP Server

## Overview

The Artha MCP (Model Context Protocol) Server provides AI agents with tools to interact with Obsidian vaults. It enables AI assistants to scan vaults, create tasks, update task status, and search for information.

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   AI Agent      │    │   MCP Server    │    │  Script Layer   │
│   (Claude, etc.)│◄──►│   (This)        │◄──►│   (VaultManager)│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🛠️ Available Tools

### 1. `scan_vault`
Scans an Obsidian vault and returns outstanding tasks.

**Input:**
```json
{
  "vaultPath": "C:/Users/username/Documents/Vaults/MyVault"
}
```

**Output:** Top 7 outstanding tasks with status, due dates, areas, and parent projects.

### 2. `create_task`
Creates a new task in the vault.

**Input:**
```json
{
  "title": "New Task Title",
  "area": "Work",
  "dueDate": "2025-08-30",
  "priority": "High",
  "parentProject": "Project A",
  "tags": ["urgent", "work"]
}
```

**Output:** Confirmation of task creation.

### 3. `update_task`
Updates an existing task's properties.

**Input:**
```json
{
  "taskId": "task-123",
  "updates": {
    "status": "In Progress",
    "dueDate": "2025-09-01",
    "priority": "Medium"
  }
}
```

**Output:** Confirmation of task update.

### 4. `search_tasks`
Searches for tasks in the vault.

**Input:**
```json
{
  "query": "meeting",
  "status": "To Do",
  "area": "Work",
  "limit": 10
}
```

**Output:** List of matching tasks.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Access to an Obsidian vault
- MCP-compatible AI agent

### Installation
```bash
cd packages/mcp-server
npm install
npm run build
```

### Running the Server
```bash
npm start
```

### Testing
```bash
node test-mcp.js
```

## 🔧 Configuration

### MCP Client Integration

Add this to your MCP client configuration:

```json
{
  "mcpServers": {
    "artha-obsidian": {
      "command": "node",
      "args": ["/path/to/artha/packages/mcp-server/dist/index.js"],
      "env": {}
    }
  }
}
```

### Environment Variables
- `VAULT_PATH`: Default vault path (optional)
- `LOG_LEVEL`: Logging level (debug, info, warn, error)

## 📊 Current Status

### ✅ Implemented
- MCP protocol compliance
- Tool registration and handling
- Basic error handling
- Placeholder responses for all tools

### 🔄 In Progress
- Full VaultManager integration
- Real vault scanning
- Task creation and updates
- Search functionality

### 🎯 Next Steps
1. **Complete VaultManager Integration** - Connect to actual vault operations
2. **Real Data Processing** - Replace placeholder responses with actual vault data
3. **Advanced Features** - Add support for epics, areas, and resources
4. **Performance Optimization** - Add caching and indexing

## 🧪 Testing

### Manual Testing
```bash
# Start the server
npm start

# In another terminal, send test requests
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | node dist/index.js
```

### Automated Testing
```bash
npm test
```

## 🔍 Troubleshooting

### Common Issues

1. **Server won't start**
   - Check Node.js version (requires 18+)
   - Verify all dependencies are installed
   - Check console for error messages

2. **Tools not responding**
   - Ensure MCP client is properly configured
   - Check server logs for errors
   - Verify tool names match exactly

3. **Vault access issues**
   - Check vault path permissions
   - Ensure vault follows PARA organization
   - Verify `_projects` directory exists

### Debug Mode
```bash
DEBUG=* npm start
```

## 📚 API Reference

### MCP Protocol
- **Version**: 2.0
- **Transport**: stdio
- **Capabilities**: tools

### Tool Schemas
All tools follow JSON Schema standards with proper validation and error handling.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is part of the Artha project management tool suite.

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section
2. Review the implementation status
3. Open an issue on GitHub

---

**Ready to connect AI agents to your Obsidian vault!** 🎉
