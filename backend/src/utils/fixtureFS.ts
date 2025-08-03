import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config';

const dir = config.fixtureDir;

// Ensure fixture directory exists
async function ensureDir() {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (error) {
    // Directory might already exist, ignore error
  }
}

// Convert cache key to Windows-safe filename
function sanitizeFilename(key: string): string {
  return key.replace(/:/g, '_').replace(/[<>:"/\\|?*]/g, '_');
}

export async function readFixture(key: string) {
  try { 
    const safeKey = sanitizeFilename(key);
    return JSON.parse(await fs.readFile(path.join(dir, `${safeKey}.json`), 'utf8')); 
  } catch { 
    return null; 
  }
}

export async function writeFixture(key: string, data: unknown) {
  await ensureDir();
  const safeKey = sanitizeFilename(key);
  const file = path.join(dir, `${safeKey}.json`);
  await fs.writeFile(file, JSON.stringify(data, null, 2), { flag: 'wx' }); // atomic, fails if exists
}