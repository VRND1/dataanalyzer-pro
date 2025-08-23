// Test file to check TypeScript import resolution from node modules
import { promises as fs } from 'fs';

export const testNodeImport = async () => {
  const files = await fs.readdir('.');
  return files;
}; 