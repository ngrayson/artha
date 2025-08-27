# 🌿 Git Branching Workflow for Artha Project

## 📋 **Branch Overview**

| Branch | Purpose | Status | Description |
|--------|---------|--------|-------------|
| **`main`** | Production | ✅ Stable | Working CommonJS implementation with CLI |
| **`develop`** | Integration | 🔄 Active | Integration branch for testing features |
| **`feature/es-module-conversion`** | Development | 🔄 Active | ES module conversion work |
| **`feature/vault-integration`** | Development | ⏳ Planned | VaultManager integration after ES modules |

---

## 🚀 **Development Workflow**

### **1. Starting New Features**
```bash
# Always start from develop branch
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/your-feature-name

# Work on your feature...
# Make commits with clear messages
git commit -m "feat: add new functionality"
git commit -m "fix: resolve module resolution issue"
git commit -m "test: add integration tests"
```

### **2. Feature Development Process**
```bash
# While working on feature
git add .
git commit -m "feat: progress on feature X"

# If you need to get latest changes from develop
git checkout develop
git pull origin develop
git checkout feature/your-feature-name
git merge develop
```

### **3. Completing Features**
```bash
# When feature is complete and tested
git checkout develop
git merge feature/your-feature-name

# Push to remote
git push origin develop

# Delete feature branch (optional)
git branch -d feature/your-feature-name
```

---

## 🔄 **Current Hybrid Approach Workflow**

### **Phase 1: ES Module Conversion** (Current)
- **Branch**: `feature/es-module-conversion`
- **Goal**: Convert script-layer to ES modules
- **Fallback**: If issues arise, we can quickly revert to `main` branch

### **Phase 2: VaultManager Integration**
- **Branch**: `feature/vault-integration`
- **Goal**: Connect MCP server to real VaultManager
- **Dependency**: ES module conversion must be complete

### **Phase 3: Testing & Validation**
- **Branch**: `develop`
- **Goal**: Integration testing of all components
- **Process**: Merge features and test together

---

## 🛡️ **Safety Measures**

### **1. Backup Strategy**
- **`main` branch**: Always contains working code
- **`backup-commonjs/`**: Local backup of working CommonJS files
- **Feature branches**: Isolated development environments

### **2. Rollback Plan**
```bash
# If ES module conversion fails
git checkout main
git checkout -b feature/fallback-commonjs

# If we need to revert develop
git checkout develop
git reset --hard main
```

### **3. Testing Strategy**
- **Unit tests**: Run on feature branches
- **Integration tests**: Run on develop branch
- **Manual testing**: Test CLI functionality on each branch

---

## 📝 **Commit Message Convention**

### **Format:**
```
type: brief description

Detailed description if needed
```

### **Types:**
- **`feat:`** - New feature
- **`fix:`** - Bug fix
- **`refactor:`** - Code refactoring
- **`test:`** - Adding or updating tests
- **`docs:`** - Documentation updates
- **`chore:`** - Maintenance tasks

### **Examples:**
```bash
git commit -m "feat: convert script-layer to ES modules"
git commit -m "fix: resolve frontmatter parsing for Windows line endings"
git commit -m "test: add comprehensive Jest test suite"
git commit -m "docs: update git workflow documentation"
```

---

## 🔍 **Current Status & Next Steps**

### **✅ What's Working (main branch):**
- CLI script (`simple-scan.cjs`) fully functional
- MCP server compiles successfully
- Comprehensive test suite (7/7 tests passing)
- CommonJS implementation stable

### **🔄 Current Work (feature/es-module-conversion):**
- Converting script-layer to ES modules
- Fixing module resolution issues
- Maintaining CLI functionality

### **⏳ Next Steps:**
1. **Complete ES module conversion**
2. **Test CLI functionality on new branch**
3. **Merge to develop for integration testing**
4. **Begin VaultManager integration**

---

## 🚨 **Emergency Procedures**

### **If CLI Breaks:**
```bash
# Quick restore from backup
git checkout main
cp backup-commonjs/simple-scan.cjs dist/
npm run scan  # Test CLI
```

### **If Module Resolution Fails:**
```bash
# Revert to working CommonJS
git checkout main
git checkout -b feature/emergency-rollback
# Continue development with CommonJS approach
```

### **If Tests Fail:**
```bash
# Check which branch has working tests
git checkout main
npm test  # Should pass
git checkout develop
npm test  # Check integration status
```

---

## 📊 **Branch Health Monitoring**

### **Daily Checks:**
- [ ] CLI functionality working
- [ ] Tests passing
- [ ] MCP server compiling
- [ ] No module resolution errors

### **Before Merging:**
- [ ] All tests pass
- [ ] CLI tested with real vault
- [ ] Code reviewed
- [ ] Integration tested

### **After Merging:**
- [ ] Deploy to develop branch
- [ ] Run full test suite
- [ ] Test CLI functionality
- [ ] Verify MCP server integration

---

## 🎯 **Success Criteria**

### **ES Module Conversion Success:**
- [ ] Script-layer compiles as ES module
- [ ] CLI functionality preserved
- [ ] MCP server can import VaultManager
- [ ] All tests passing

### **VaultManager Integration Success:**
- [ ] Real vault scanning working
- [ ] Task creation functional
- [ ] Task updates working
- [ ] Search functionality operational

### **Overall Project Success:**
- [ ] Production-ready MCP server
- [ ] Working CLI for vault management
- [ ] Comprehensive test coverage
- [ ] Clear documentation

---

**🌿 This branching strategy ensures we can safely experiment with ES modules while maintaining a stable, working codebase on the main branch.**
