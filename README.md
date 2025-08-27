# Artha - Obsidian Project Management Tool

A comprehensive project management tool integrated with Obsidian markdown vaults, providing MCP (Model Context Protocol) CRUD operations and a script layer for direct vault management.

## 🏗️ Architecture

Artha is built as a monorepo with three core packages:

- **`@artha/shared`**: Common types, interfaces, and utilities
- **`@artha/script-layer`**: Direct vault manipulation without server dependencies
- **`@artha/mcp-server`**: MCP server for AI agent integration

## 🚀 Features

- **Full CRUD Operations**: Create, read, update, delete vault items
- **PARA Organization**: Projects, Areas, Resources, Archive structure
- **Template System**: Dynamic template generation and application
- **Fuzzy Search**: Fast search using fzf algorithm
- **Type Safety**: Built with TypeScript for robust development
- **MCP Integration**: AI agent integration via Model Context Protocol
- **Script Layer**: Direct vault manipulation without server startup

## 📋 Supported Item Types

- **Tasks**: Time-bound actionable items with due dates and priorities
- **Epics**: Large-scale project initiatives containing multiple tasks
- **Areas**: Ongoing responsibilities and domains
- **Resources**: Reference materials and documentation

## 🛠️ Prerequisites

- Node.js 18+
- npm 9+ or yarn
- TypeScript 5.0+

## 🔧 Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/ngrayson/artha.git
   cd artha
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Build all packages**:
   ```bash
   npm run build
   ```

## 📦 Package Structure

```
artha/
├── packages/
│   ├── shared/           # Common types and utilities
│   ├── script-layer/     # Direct vault manipulation
│   └── mcp-server/       # MCP server implementation
├── docs/                 # Documentation
├── examples/             # Example implementations
└── reference/            # Reference materials
```

## 🚀 Usage

### Script Layer (Direct Vault Access)

```typescript
import { VaultManager } from '@artha/script-layer';

const vault = new VaultManager('/path/to/vault');

// Create a new task
const task = await vault.createTask({
  title: 'Complete project documentation',
  status: 'To Do',
  priority: 'High',
  area: 'Development',
  dueDate: '2024-01-15'
});

// Search for items
const results = await vault.searchItems('documentation', { type: 'Task' });

// Update item
await vault.updateTask(task.id, { status: 'In Progress' });
```

### MCP Server (AI Agent Integration)

```bash
# Start the MCP server
npm run start --workspace=@artha/mcp-server

# Or with custom vault path
npm run start --workspace=@artha/mcp-server /path/to/vault
```

The MCP server provides tools for AI agents to:
- List and search vault items
- Create new items with proper templates
- Update existing items
- Delete items
- Bulk operations

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests for specific package
npm test --workspace=@artha/script-layer

# Watch mode
npm run test:watch --workspace=@artha/script-layer
```

## 🔨 Development

```bash
# Development mode with watch
npm run dev

# Type checking
npm run type-check

# Clean build artifacts
npm run clean
```

## 📚 Documentation

- [Product Specification](./docs/PRODUCT_SPECIFICATION.md) - Comprehensive project specification
- [API Reference](./docs/API_REFERENCE.md) - Detailed API documentation
- [Examples](./examples/) - Usage examples and implementations

## 🏛️ PARA Organization

Artha follows the PARA method for organizing information:

- **Projects**: Time-bound initiatives with specific goals
- **Areas**: Ongoing responsibilities and domains
- **Resources**: Reference materials and documentation
- **Archive**: Completed projects and historical data

## 🔍 Search Capabilities

- **Fuzzy Search**: Intelligent matching with typo tolerance
- **Type Filtering**: Filter by item type (Task, Epic, Area, Resource)
- **Area Filtering**: Filter by specific areas
- **Status Filtering**: Filter by current status
- **Tag-based Search**: Search by tags and categories

## 🎨 Template System

Dynamic template generation with:
- Automatic variable substitution
- Type-specific templates
- Customizable content structure
- Validation and error handling

## 🔒 Security Features

- Input validation and sanitization
- Path traversal protection
- File permission respect
- Secure error handling

## 📊 Performance

- **Search Response**: <100ms for typical vaults
- **CRUD Operations**: <50ms for individual operations
- **Vault Scanning**: <5 seconds for large vaults
- **Memory Usage**: <100MB for typical operations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

For questions and support:
- Check the [documentation](./docs/)
- Review [examples](./examples/)
- Open an [issue](https://github.com/ngrayson/artha/issues)

## 🔮 Roadmap

- [ ] Enhanced search with context awareness
- [ ] Bulk operations and batch processing
- [ ] Change tracking and version history
- [ ] Export/import functionality
- [ ] Performance monitoring and optimization
- [ ] Plugin system for extensibility

---

**Built with ❤️ by the Artha Development Team**
