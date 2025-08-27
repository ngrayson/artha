// Mock fs/promises
jest.mock('fs/promises', () => ({
  readFile: jest.fn(),
  writeFile: jest.fn(),
  unlink: jest.fn(),
  access: jest.fn(),
  mkdir: jest.fn(),
  stat: jest.fn(),
  readdir: jest.fn(),
  rename: jest.fn(),
  copyFile: jest.fn(),
}));

// Mock path
jest.mock('path', () => ({
  join: (...args) => args.join('/'),
  dirname: (filePath) => filePath.split('/').slice(0, -1).join('/'),
  basename: (filePath, ext) => {
    const name = filePath.split('/').pop() || '';
    return ext ? name.replace(ext, '') : name;
  },
  extname: (filePath) => {
    const match = filePath.match(/\.[^.]*$/);
    return match ? match[0] : '';
  },
  relative: (from, to) => {
    const fromParts = from.split('/');
    const toParts = to.split('/');
    let i = 0;
    while (i < fromParts.length && i < toParts.length && fromParts[i] === toParts[i]) {
      i++;
    }
    return toParts.slice(i).join('/');
  },
}));

// Mock fzf
jest.mock('fzf', () => {
  const MockFzf = jest.fn().mockImplementation(() => ({
    find: jest.fn().mockReturnValue([
      { item: '0', positions: new Set([0, 1, 2]) }
    ]),
  }));
  return { Fzf: MockFzf };
});

// Global test utilities
global.testUtils = {
  createMockVaultItem: (type, overrides = {}) => {
    const baseItem = {
      id: `test-${type.toLowerCase()}-1`,
      type,
      title: `Test ${type}`,
      status: 'Active',
      tags: [],
      content: `Test content for ${type}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Add type-specific properties
    switch (type) {
      case 'Task':
        return {
          ...baseItem,
          priority: 'Medium',
          area: '',
          dueDate: undefined,
          parentProjects: [],
          ...overrides,
        };
      case 'Epic':
        return {
          ...baseItem,
          area: '',
          dueDate: undefined,
          image: '',
          tasks: [],
          ...overrides,
        };
      case 'Area':
        return {
          ...baseItem,
          maintenance: 'Monthly',
          pinned: false,
          purpose: '',
          activeProjects: [],
          currentFocus: {
            primary: '',
            secondary: '',
            ongoing: [],
          },
          ...overrides,
        };
      case 'Resource':
        return {
          ...baseItem,
          pinned: false,
          areas: [],
          purpose: '',
          contentOverview: '',
          keyTopics: [],
          usageNotes: '',
          maintenance: 'Monthly',
          ...overrides,
        };
      default:
        return { ...baseItem, ...overrides };
    }
  },
  
  createMockCreateRequest: (type, overrides = {}) => ({
    type,
    title: `Test ${type}`,
    ...overrides,
  }),
  
  createMockTemplate: (type, content) => ({
    name: `Test ${type} Template`,
    type,
    content,
    variables: ['title', 'status', 'tags', 'content'],
    description: `Test template for ${type} items`
  }),
  
  createTempDir: () => `/tmp/test-vault-${Date.now()}`,
  
  cleanupTempDir: () => {
    // Cleanup logic for temporary directories
  },
};

// Extend Jest matchers for better assertions
expect.extend({
  toBeValidVaultItem(received) {
    const pass = received && 
                 typeof received.id === 'string' &&
                 typeof received.type === 'string' &&
                 typeof received.title === 'string' &&
                 typeof received.status === 'string' &&
                 Array.isArray(received.tags) &&
                 typeof received.content === 'string' &&
                 typeof received.createdAt === 'string' &&
                 typeof received.updatedAt === 'string';
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid vault item`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid vault item`,
        pass: false,
      };
    }
  },
});

