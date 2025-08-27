# Obsidian Vault MCP CRUD Server

A Model Context Protocol (MCP) server that provides CRUD operations for managing Obsidian vault items with fuzzy search capabilities using the `fzf` package.

## 🚀 Features

- **Full CRUD Operations**: Create, Read, Update, Delete vault items
- **Fuzzy Search**: Fast, intelligent search using `fzf` algorithm
- **Type Safety**: Built with TypeScript for robust development
- **Template Integration**: Automatically generates proper markdown structure
- **Frontmatter Management**: Handles YAML frontmatter parsing and updates
- **Recursive Scanning**: Automatically discovers all vault items
- **MCP Standard**: Follows Model Context Protocol for AI agent integration

## 📋 Supported Item Types

- **Tasks**: Time-bound actionable items
- **Epics**: Large-scale project initiatives
- **Areas**: Ongoing responsibilities and domains
- **Resources**: Reference materials and documentation

## 🛠️ Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Setup
```bash
cd _agents/wendy/mcp-crud
npm install
```

## 🔧 Usage

### Development Mode
```bash
npm run dev
```

### Build and Run
```bash
npm run build
npm start
```

### With Custom Vault Path
```bash
npm start /path/to/your/vault
```

## 🧪 Testing

### Test the Core Functionality
```bash
node test-mcp-crud.js
```

### Test with Sample MCP Client
```bash
npm run dev
# Use an MCP-compatible client to test tool calls
```

## 📁 Files

- `mcp-crud-server.ts` - Main MCP server implementation
- `package.json` - Dependencies and build scripts
- `tsconfig.json` - TypeScript configuration
- `test-mcp-crud.js` - Test suite for functionality validation
- `README.md` - This documentation

## 🎯 MCP Tools Available

1. **`list_items`** - List all vault items (with type filtering)
2. **`create_item`** - Create new items with proper templates
3. **`update_item`** - Update existing items and frontmatter
4. **`delete_item`** - Remove items from vault
5. **`search_items`** - Fuzzy search using fzf algorithm
6. **`get_item`** - Retrieve specific items by ID

## 🔍 Search Capabilities

The fuzzy search uses the `fzf` algorithm to provide:
- **Intelligent matching**: Finds items even with typos or partial matches
- **Fast performance**: Optimized for large vaults
- **Context awareness**: Considers item type and metadata
- **Configurable limits**: Control result count and filtering

## 📁 Directory Structure

The server automatically organizes items based on type:
- **Tasks & Epics**: `_projects/` directory
- **Areas**: `_areas/` directory  
- **Resources**: `_resources/` directory

## 🎨 Template System

Each item type gets automatically generated with appropriate structure for Tasks, Areas, Resources, and Epics.

## 🚨 Error Handling

Comprehensive error handling for file operations, validation, and parsing errors.

## 🔧 Configuration

- Modify `generateMarkdownContent()` for custom templates
- Adjust `fzf` options in the `ObsidianVaultManager` constructor
- Extend supported item types in the type system

## 📊 Performance

- **Initialization**: Scans entire vault on startup
- **Search**: Sub-millisecond fuzzy search results
- **CRUD Operations**: Optimized file I/O with async operations
- **Memory Usage**: Efficient item caching and management

## 🔗 Integration

### With AI Agents
This MCP server enables AI agents to:
- Automatically create and manage vault items
- Search and retrieve relevant information
- Update project status and progress
- Maintain consistent vault organization

### With Other Tools
- **Obsidian Plugins**: Can integrate with existing vault plugins
- **External Systems**: Connect with project management tools
- **Automation**: Script vault maintenance and updates

---

**Built by Wendy (Project Management Agent) for efficient Obsidian vault management** 🧙‍♀️
