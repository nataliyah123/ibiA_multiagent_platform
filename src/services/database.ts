import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { compress, decompress } from 'fflate';

interface FrameworkData {
  id: string;
  framework: string;
  content: string;
  url: string;
  stars: number;
  lastUpdated: string;
  vectorEmbedding?: number[];
}

interface CacheEntry {
  key: string;
  value: any;
  timestamp: number;
  size: number;
}

interface AppDB extends DBSchema {
  frameworkData: {
    key: string;
    value: FrameworkData;
    indexes: { 'by-framework': string; 'by-stars': number };
  };
  cache: {
    key: string;
    value: CacheEntry;
  };
  apiKeys: {
    key: string;
    value: { service: string; encryptedKey: string };
  };
}

class DatabaseService {
  private db: IDBPDatabase<AppDB> | null = null;
  private cacheSize = 0;
  private readonly MAX_CACHE_SIZE = 500 * 1024 * 1024; // 500MB

  async init(): Promise<void> {
    this.db = await openDB<AppDB>('multiagent-platform', 1, {
      upgrade(db) {
        // Framework data store
        const frameworkStore = db.createObjectStore('frameworkData', {
          keyPath: 'id',
        });
        frameworkStore.createIndex('by-framework', 'framework');
        frameworkStore.createIndex('by-stars', 'stars');

        // Cache store
        db.createObjectStore('cache', {
          keyPath: 'key',
        });

        // API keys store
        db.createObjectStore('apiKeys', {
          keyPath: 'service',
        });
      },
    });

    await this.calculateCacheSize();
  }

  async storeFrameworkData(data: FrameworkData[]): Promise<void> {
    if (!this.db) await this.init();
    
    const tx = this.db!.transaction('frameworkData', 'readwrite');
    
    for (const item of data) {
      // Compress content before storing
      const compressed = await this.compressData(item.content);
      await tx.objectStore('frameworkData').put({
        ...item,
        content: compressed,
      });
    }
    
    await tx.done;
  }

  async getFrameworkData(framework: string): Promise<FrameworkData[]> {
    if (!this.db) await this.init();
    
    const data = await this.db!.getAllFromIndex('frameworkData', 'by-framework', framework);
    
    // Decompress content
    return Promise.all(
      data.map(async (item) => ({
        ...item,
        content: await this.decompressData(item.content),
      }))
    );
  }

  async cacheSet(key: string, value: any): Promise<void> {
    if (!this.db) await this.init();
    
    const serialized = JSON.stringify(value);
    const size = new Blob([serialized]).size;
    
    // Implement LRU eviction if needed
    await this.ensureCacheSpace(size);
    
    const entry: CacheEntry = {
      key,
      value,
      timestamp: Date.now(),
      size,
    };
    
    await this.db!.put('cache', entry);
    this.cacheSize += size;
  }

  async cacheGet(key: string): Promise<any | null> {
    if (!this.db) await this.init();
    
    const entry = await this.db!.get('cache', key);
    if (!entry) return null;
    
    // Update timestamp for LRU
    entry.timestamp = Date.now();
    await this.db!.put('cache', entry);
    
    return entry.value;
  }

  async storeEncryptedApiKey(service: string, encryptedKey: string): Promise<void> {
    if (!this.db) await this.init();
    
    await this.db!.put('apiKeys', { service, encryptedKey });
  }

  async getEncryptedApiKey(service: string): Promise<string | null> {
    if (!this.db) await this.init();
    
    const result = await this.db!.get('apiKeys', service);
    return result?.encryptedKey || null;
  }

  private async compressData(data: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const input = new TextEncoder().encode(data);
      compress(input, { level: 9 }, (err, compressed) => {
        if (err) reject(err);
        else resolve(btoa(String.fromCharCode(...compressed)));
      });
    });
  }

  private async decompressData(compressedData: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const compressed = Uint8Array.from(atob(compressedData), c => c.charCodeAt(0));
      decompress(compressed, (err, decompressed) => {
        if (err) reject(err);
        else resolve(new TextDecoder().decode(decompressed));
      });
    });
  }

  private async calculateCacheSize(): Promise<void> {
    if (!this.db) return;
    
    const entries = await this.db.getAll('cache');
    this.cacheSize = entries.reduce((total, entry) => total + entry.size, 0);
  }

  private async ensureCacheSpace(newSize: number): Promise<void> {
    if (!this.db) return;
    
    if (this.cacheSize + newSize <= this.MAX_CACHE_SIZE) return;
    
    // Get all entries sorted by timestamp (LRU)
    const entries = await this.db.getAll('cache');
    entries.sort((a, b) => a.timestamp - b.timestamp);
    
    // Remove oldest entries until we have space
    let freedSpace = 0;
    const tx = this.db.transaction('cache', 'readwrite');
    
    for (const entry of entries) {
      if (this.cacheSize - freedSpace + newSize <= this.MAX_CACHE_SIZE) break;
      
      await tx.objectStore('cache').delete(entry.key);
      freedSpace += entry.size;
    }
    
    await tx.done;
    this.cacheSize -= freedSpace;
  }
}

export const dbService = new DatabaseService();