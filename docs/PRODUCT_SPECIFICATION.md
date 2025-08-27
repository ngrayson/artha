# Obsidian Project Management Tool - Product Specification

## Overview
A comprehensive project management tool integrated with Obsidian markdown vaults, providing MCP (Model Context Protocol) CRUD operations and a script layer for direct vault management without requiring server startup.

## Core Architecture

### 1. Script Layer (Core Foundation)
- **Purpose**: Direct vault manipulation without server dependencies
- **Location**: `packages/script-layer/`
- **Capabilities**: 
  - Parse and modify Obsidian markdown files
  - Manage frontmatter metadata
  - Handle file operations (create, read, update, delete)
  - Support PARA organization structure
  - Template generation and application

### 2. MCP Server Layer
- **Purpose**: AI agent integration via Model Context Protocol
- **Location**: `packages/mcp-server/`
- **Dependencies**: Script layer for all vault operations
- **Capabilities**:
  - Full CRUD operations for Tasks, Epics, Areas, Resources
  - Fuzzy search using fzf algorithm
  - Type-safe operations with TypeScript
  - Automatic template application

### 3. Shared Types and Utilities
- **Purpose**: Common interfaces and utilities across all packages
- **Location**: `packages/shared/`
- **Contents**:
  - TypeScript interfaces for vault items
  - Utility functions for markdown parsing
  - Constants and enums
  - Validation schemas

## PARA Organization Structure

### Projects Directory (`_projects/`)
- **Tasks**: Time-bound actionable items with due dates
- **Epics**: Large-scale project initiatives containing multiple tasks
- **Metadata**: Status, due dates, parent projects, areas

### Areas Directory (`_areas/`)
- **Ongoing responsibilities**: Work, health, learning, relationships
- **Maintenance frequency**: Weekly, monthly, quarterly
- **Active projects**: Links to current project work

### Resources Directory (`_resources/`)
- **Reference materials**: Documentation, guides, templates
- **Tagged organization**: Areas, topics, relevance
- **Maintenance**: Update frequency and triggers

### Archive Directory (`_archive/`)
- **Completed projects**: Moved from _projects when finished
- **Historical data**: Past areas, resources, completed tasks

## Data Models

### Task
```typescript
interface Task {
  id: string;
  type: 'Task';
  title: string;
  status: 'To Do' | 'In Progress' | 'Done' | 'Blocked';
  dueDate?: string;
  parentProjects?: string[];
  area?: string;
  priority?: 'Low' | 'Medium' | 'High' | 'Urgent';
  tags: string[];
  content: string;
  createdAt: string;
  updatedAt: string;
}
```

### Epic
```typescript
interface Epic {
  id: string;
  type: 'Epic';
  title: string;
  status: 'Planning' | 'Active' | 'On Hold' | 'Completed';
  dueDate?: string;
  area: string;
  image?: string;
  tasks: string[]; // Task IDs
  content: string;
  createdAt: string;
  updatedAt: string;
}
```

### Area
```typescript
interface Area {
  id: string;
  type: 'Area';
  title: string;
  status: 'Active' | 'Inactive' | 'Archived';
  maintenance: 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly';
  pinned: boolean;
  purpose: string;
  activeProjects: string[]; // Project IDs
  currentFocus: {
    primary: string;
    secondary: string;
    ongoing: string[];
  };
  content: string;
  createdAt: string;
  updatedAt: string;
}
```

### Resource
```typescript
interface Resource {
  id: string;
  type: 'Resource';
  title: string;
  status: 'Active' | 'Archived';
  pinned: boolean;
  areas: string[]; // Area IDs
  tags: string[];
  purpose: string;
  contentOverview: string;
  keyTopics: string[];
  usageNotes: string;
  maintenance: string;
  createdAt: string;
  updatedAt: string;
}
```

## Implementation Approach

### Phase 1: Script Layer Foundation
1. **Markdown Parser**: Robust parsing of Obsidian files with frontmatter
2. **File Operations**: CRUD operations for markdown files
3. **Template System**: Dynamic template generation and application
4. **Validation**: Input validation and data integrity checks
5. **Testing**: Comprehensive test suite for all operations

### Phase 2: MCP Server Integration
1. **Server Setup**: MCP protocol implementation
2. **Tool Definitions**: CRUD operation tools for AI agents
3. **Error Handling**: Graceful error handling and reporting
4. **Performance**: Optimized search and operations
5. **Integration Testing**: End-to-end MCP client testing

### Phase 3: Advanced Features
1. **Search Optimization**: Enhanced fuzzy search with context
2. **Bulk Operations**: Batch processing for multiple items
3. **Change Tracking**: Version history and change logs
4. **Export/Import**: Data portability and backup
5. **Performance Monitoring**: Metrics and optimization

## Open Problems and Challenges

### 1. File Locking and Concurrency
- **Problem**: Multiple processes modifying the same vault simultaneously
- **Impact**: Data corruption, lost updates
- **Potential Solutions**:
  - File-based locking mechanisms
  - Transaction-like operations
  - Conflict resolution strategies
  - Real-time change detection

### 2. Large Vault Performance
- **Problem**: Vaults with thousands of files causing slow operations
- **Impact**: Poor user experience, timeouts
- **Potential Solutions**:
  - Incremental scanning and caching
  - Index-based operations
  - Background processing
  - Lazy loading strategies

### 3. Template Versioning
- **Problem**: Templates evolve over time, existing items become outdated
- **Impact**: Inconsistent structure, maintenance overhead
- **Potential Solutions**:
  - Template version tracking
  - Migration scripts
  - Backward compatibility
  - Template validation

### 4. Cross-References and Links
- **Problem**: Maintaining valid links between items when files move/rename
- **Impact**: Broken references, navigation issues
- **Potential Solutions**:
  - Link validation and repair
  - Automatic link updates
  - Reference tracking
  - Link integrity checks

### 5. Data Validation and Integrity
- **Problem**: Ensuring data consistency across the vault
- **Impact**: Invalid states, corrupted data
- **Potential Solutions**:
  - Schema validation
  - Constraint checking
  - Data repair tools
  - Integrity monitoring

### 6. Backup and Recovery
- **Problem**: Safely backing up and restoring vault data
- **Impact**: Data loss, recovery complexity
- **Potential Solutions**:
  - Automated backup strategies
  - Incremental backups
  - Recovery procedures
  - Data integrity verification

### 7. Integration Complexity
- **Problem**: Coordinating between script layer and MCP server
- **Impact**: Development complexity, maintenance overhead
- **Potential Solutions**:
  - Clear interface contracts
  - Shared testing strategies
  - Dependency management
  - Version compatibility

## Technical Requirements

### Dependencies
- **Node.js**: 18+ for modern ES modules and performance
- **TypeScript**: 5.0+ for type safety and modern features
- **MCP SDK**: Latest version for protocol compliance
- **Markdown Parsing**: Robust frontmatter and content handling
- **File System**: Async operations with proper error handling

### Performance Targets
- **Search Response**: <100ms for typical vaults (<1000 items)
- **CRUD Operations**: <50ms for individual operations
- **Vault Scanning**: <5 seconds for large vaults (>10000 items)
- **Memory Usage**: <100MB for typical operations

### Security Considerations
- **Input Validation**: Sanitize all user inputs
- **File Permissions**: Respect existing file permissions
- **Path Traversal**: Prevent directory traversal attacks
- **Data Privacy**: No external data transmission

## Success Criteria

### Functional Requirements
- [ ] Create, read, update, delete all item types
- [ ] Fuzzy search with sub-100ms response time
- [ ] Template generation and application
- [ ] PARA organization compliance
- [ ] MCP protocol compliance
- [ ] Script layer independence

### Quality Requirements
- [ ] 95%+ test coverage
- [ ] Type safety with TypeScript
- [ ] Comprehensive error handling
- [ ] Performance benchmarks met
- [ ] Documentation completeness

### Integration Requirements
- [ ] Seamless Obsidian vault integration
- [ ] MCP client compatibility
- [ ] Script layer usability
- [ ] Template system flexibility
- [ ] PARA structure compliance

## Next Steps

1. **Set up monorepo structure** with proper package management
2. **Implement script layer** with core file operations
3. **Create shared types** and validation schemas
4. **Build MCP server** using script layer
5. **Develop comprehensive testing** strategy
6. **Document and validate** against requirements

---

*This specification will evolve as we implement and discover new requirements and constraints.*
