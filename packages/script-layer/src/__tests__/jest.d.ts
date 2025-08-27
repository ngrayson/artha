declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidVaultItem(): R;
    }
  }
  
  var testUtils: {
    createMockVaultItem: (type: string, overrides?: any) => any;
    createMockCreateRequest: (type: string, overrides?: any) => any;
    createMockTemplate: (type: string, content: string) => any;
    createTempDir: () => string;
    cleanupTempDir: () => void;
  };
}

export {};
