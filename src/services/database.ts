import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { compress, decompress } from 'fflate';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

interface FrameworkData {
  id: string;
  framework: string;
  content: string;
  url: string;
  stars: number;
  lastUpdated: string;
  vectorEmbedding?: number[];
  contentType: 'repo' | 'documentation' | 'example';
  compressedSize: number;
}

interface CacheEntry {
  key: string;
  value: any;
  timestamp: number;
  size: number;
  accessCount: number;
}

interface VectorEmbedding {
  id: string;
  framework: string;
  content_id: string;
  embedding: number[];
  metadata: Record<string, any>;
}

interface AppDB extends DBSchema {
  cache: {
    key: string;
    value: CacheEntry;
  };
  userQueries: {
    key: string;
    value: {
      query: string;
      timestamp: number;
      results: any[];
      framework: string;
    };
  };
  apiKeys: {
    key: string;
    value: { service: string; encryptedKey: string };
  };
}

class DatabaseService {
  private static instance: DatabaseService;
  private db: IDBPDatabase<AppDB> | null = null;
  private supabase: SupabaseClient | null = null;
  private cacheSize = 0;
  private readonly MAX_CACHE_SIZE = 500 * 1024 * 1024; // 500MB
  private readonly VECTOR_API_BASE = '/api/vectors'; // ChromaDB endpoint
  private initialized = false;

  // Singleton pattern to prevent multiple instances
  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  async init(): Promise<void> {
    if (this.initialized) {
      console.log('Database service already initialized');
      return;
    }

    try {
      // Initialize Supabase client only once
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (supabaseUrl && supabaseKey) {
        this.supabase = createClient(supabaseUrl, supabaseKey);
        console.log('Supabase client initialized');
        
        // Create tables if they don't exist
        await this.createTablesIfNotExist();
      } else {
        console.warn('Supabase credentials not found. Server-side storage disabled.');
      }

      // Initialize IndexedDB for client-side caching
      this.db = await openDB<AppDB>('multiagent-platform-cache', 2, {
        upgrade(db, oldVersion) {
          // Cache store for LRU caching
          if (!db.objectStoreNames.contains('cache')) {
            db.createObjectStore('cache', { keyPath: 'key' });
          }

          // User queries store
          if (!db.objectStoreNames.contains('userQueries')) {
            const queryStore = db.createObjectStore('userQueries', { keyPath: 'query' });
            queryStore.createIndex('by-timestamp', 'timestamp');
            queryStore.createIndex('by-framework', 'framework');
          }

          // API keys store
          if (!db.objectStoreNames.contains('apiKeys')) {
            db.createObjectStore('apiKeys', { keyPath: 'service' });
          }
        },
      });

      await this.calculateCacheSize();
      this.initialized = true;
      console.log('IndexedDB initialized with cache size:', this.formatBytes(this.cacheSize));
    } catch (error) {
      console.error('Failed to initialize database service:', error);
      throw error;
    }
  }

  private async createTablesIfNotExist(): Promise<void> {
    if (!this.supabase) return;

    try {
      // Create framework_data table
      const { error: tableError } = await this.supabase.rpc('create_framework_data_table');
      
      if (tableError && !tableError.message.includes('already exists')) {
        // If RPC doesn't exist, try direct SQL
        const { error: sqlError } = await this.supabase
          .from('framework_data')
          .select('id')
          .limit(1);
        
        if (sqlError && sqlError.code === '42P01') {
          console.log('Creating framework_data table...');
          // Table doesn't exist, but we can't create it directly from client
          // This would need to be done in Supabase dashboard or via migration
          console.warn('Please create the framework_data table in your Supabase dashboard');
        }
      }
    } catch (error) {
      console.warn('Could not verify/create tables:', error);
    }
  }

  // Server-side storage methods (Supabase)
  async storeFrameworkData(data: FrameworkData[]): Promise<void> {
    if (!this.supabase) {
      console.warn('Supabase not initialized. Storing data in local cache only.');
      // Store in IndexedDB as fallback
      for (const item of data) {
        await this.cacheSet(`framework_${item.framework}_${item.id}`, item);
      }
      return;
    }

    try {
      // Compress and store data in batches
      const batchSize = 50;
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        
        const compressedBatch = await Promise.all(
          batch.map(async (item) => {
            const compressedContent = await this.compressWithBrotli(item.content);
            return {
              ...item,
              content: compressedContent,
              compressedSize: compressedContent.length,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
          })
        );

        const { error } = await this.supabase
          .from('framework_data')
          .upsert(compressedBatch, { onConflict: 'id' });

        if (error) {
          console.error('Error storing framework data batch:', error);
          // Store in cache as fallback
          for (const item of batch) {
            await this.cacheSet(`framework_${item.framework}_${item.id}`, item);
          }
        }
      }

      console.log(`Stored ${data.length} framework data items`);
    } catch (error) {
      console.error('Failed to store framework data:', error);
      // Store in cache as fallback
      for (const item of data) {
        await this.cacheSet(`framework_${item.framework}_${item.id}`, item);
      }
    }
  }

  async getFrameworkData(framework: string, limit = 100): Promise<FrameworkData[]> {
    // Try Supabase first
    if (this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('framework_data')
          .select('*')
          .eq('framework', framework)
          .order('stars', { ascending: false })
          .limit(limit);

        if (!error && data && data.length > 0) {
          // Decompress content
          const decompressedData = await Promise.all(
            data.map(async (item) => ({
              ...item,
              content: await this.decompressFromBrotli(item.content),
            }))
          );
          return decompressedData;
        }
      } catch (error) {
        console.error('Error fetching from Supabase:', error);
      }
    }

    // Fallback to cache
    console.log('Falling back to cached data for', framework);
    const cachedData: FrameworkData[] = [];
    
    if (this.db) {
      const allCached = await this.db.getAll('cache');
      for (const cached of allCached) {
        if (cached.key.startsWith(`framework_${framework}_`)) {
          cachedData.push(cached.value);
        }
      }
    }

    // If no cached data, return mock data for development
    if (cachedData.length === 0) {
      return this.getMockFrameworkData(framework);
    }

    return cachedData.slice(0, limit);
  }

  private getMockFrameworkData(framework: string): FrameworkData[] {
    return [
      {
        id: `${framework}-mock-1`,
        framework,
        content: `# ${framework.toUpperCase()} Framework Documentation\n\nThis is mock data for development purposes.\n\n## Features\n- Multi-agent coordination\n- Task delegation\n- Memory management\n- Tool integration\n\n## Quick Start\n\`\`\`python\nfrom ${framework} import Agent\n\nagent = Agent(role="assistant")\nresult = agent.execute("Hello world")\n\`\`\``,
        url: `https://github.com/example/${framework}`,
        stars: 1000,
        lastUpdated: new Date().toISOString(),
        contentType: 'documentation',
        compressedSize: 500,
      },
      {
        id: `${framework}-mock-2`,
        framework,
        content: `# ${framework.toUpperCase()} Examples\n\nExample implementations and tutorials.\n\n## Basic Agent\n\`\`\`python\nagent = Agent(\n    name="Assistant",\n    role="Helper",\n    goal="Assist users"\n)\n\`\`\`\n\n## Multi-Agent System\n\`\`\`python\ncrew = Crew(agents=[agent1, agent2])\nresult = crew.kickoff()\n\`\`\``,
        url: `https://github.com/example/${framework}-examples`,
        stars: 500,
        lastUpdated: new Date().toISOString(),
        contentType: 'example',
        compressedSize: 300,
      },
    ];
  }

  async searchFrameworkData(query: string, framework?: string): Promise<FrameworkData[]> {
    // Try Supabase first
    if (this.supabase) {
      try {
        let queryBuilder = this.supabase
          .from('framework_data')
          .select('*')
          .ilike('content', `%${query}%`); // Use ilike instead of textSearch for better compatibility

        if (framework) {
          queryBuilder = queryBuilder.eq('framework', framework);
        }

        const { data, error } = await queryBuilder
          .order('stars', { ascending: false })
          .limit(50);

        if (!error && data && data.length > 0) {
          const decompressedData = await Promise.all(
            data.map(async (item) => ({
              ...item,
              content: await this.decompressFromBrotli(item.content),
            }))
          );
          return decompressedData;
        }
      } catch (error) {
        console.error('Error searching Supabase:', error);
      }
    }

    // Fallback to local search
    const allData = framework 
      ? await this.getFrameworkData(framework, 100)
      : [];
    
    return allData.filter(item => 
      item.content.toLowerCase().includes(query.toLowerCase()) ||
      item.url.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 50);
  }

  // Vector database methods (ChromaDB)
  async storeVectorEmbeddings(embeddings: VectorEmbedding[]): Promise<void> {
    try {
      const response = await fetch(`${this.VECTOR_API_BASE}/store`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ embeddings }),
      });

      if (!response.ok) {
        throw new Error(`Vector storage failed: ${response.statusText}`);
      }

      console.log(`Stored ${embeddings.length} vector embeddings`);
    } catch (error) {
      console.warn('Vector storage failed, using local fallback:', error);
      // Store embeddings in IndexedDB as fallback
      for (const embedding of embeddings) {
        await this.cacheSet(`embedding_${embedding.id}`, embedding);
      }
    }
  }

  async searchVectorEmbeddings(
    query: string,
    framework?: string,
    limit = 10
  ): Promise<{ id: string; score: number; metadata: any }[]> {
    try {
      const params = new URLSearchParams({
        query,
        limit: limit.toString(),
        ...(framework && { framework }),
      });

      const response = await fetch(`${this.VECTOR_API_BASE}/search?${params}`);

      if (!response.ok) {
        throw new Error(`Vector search failed: ${response.statusText}`);
      }

      const results = await response.json();
      return results.matches || [];
    } catch (error) {
      console.warn('Vector search failed, using text search fallback:', error);
      
      // Fallback to text search
      const textResults = await this.searchFrameworkData(query, framework);
      return textResults.slice(0, limit).map((item, index) => ({
        id: item.id,
        score: 1 - (index * 0.1), // Mock similarity scores
        metadata: {
          url: item.url,
          stars: item.stars,
          contentType: item.contentType,
          framework: item.framework,
        },
      }));
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      // Use Gemini API for embeddings
      const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!geminiApiKey) {
        throw new Error('Gemini API key not found');
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'models/embedding-001',
            content: {
              parts: [{ text }]
            }
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini embedding failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result.embedding.values;
    } catch (error) {
      console.warn('Failed to generate embedding with Gemini, using fallback:', error);
      
      // Fallback to simple hash-based embedding
      return this.generateSimpleEmbedding(text);
    }
  }

  private generateSimpleEmbedding(text: string): number[] {
    // Simple hash-based embedding for fallback
    const words = text.toLowerCase().split(/\s+/);
    const embedding = new Array(384).fill(0);
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const hash = this.simpleHash(word);
      
      for (let j = 0; j < embedding.length; j++) {
        embedding[j] += Math.sin(hash + j) * 0.1;
      }
    }
    
    // Normalize the vector
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => magnitude > 0 ? val / magnitude : 0);
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash;
  }

  // Client-side caching methods (IndexedDB with LRU)
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
      accessCount: 1,
    };
    
    await this.db!.put('cache', entry);
    this.cacheSize += size;
  }

  async cacheGet(key: string): Promise<any | null> {
    if (!this.db) await this.init();
    
    const entry = await this.db!.get('cache', key);
    if (!entry) return null;
    
    // Update timestamp and access count for LRU
    entry.timestamp = Date.now();
    entry.accessCount += 1;
    await this.db!.put('cache', entry);
    
    return entry.value;
  }

  async cacheUserQuery(query: string, results: any[], framework: string): Promise<void> {
    if (!this.db) await this.init();
    
    const queryEntry = {
      query,
      timestamp: Date.now(),
      results,
      framework,
    };
    
    await this.db!.put('userQueries', queryEntry);
    
    // Keep only recent queries (last 1000)
    const allQueries = await this.db!.getAllFromIndex('userQueries', 'by-timestamp');
    if (allQueries.length > 1000) {
      const oldQueries = allQueries.slice(0, allQueries.length - 1000);
      const tx = this.db!.transaction('userQueries', 'readwrite');
      for (const oldQuery of oldQueries) {
        await tx.objectStore('userQueries').delete(oldQuery.query);
      }
      await tx.done;
    }
  }

  async getCachedUserQueries(framework?: string): Promise<any[]> {
    if (!this.db) await this.init();
    
    if (framework) {
      return await this.db!.getAllFromIndex('userQueries', 'by-framework', framework);
    }
    
    return await this.db!.getAll('userQueries');
  }

  // Compression methods using Brotli
  private async compressWithBrotli(data: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const input = new TextEncoder().encode(data);
      
      // Use fflate's compress with high compression level
      compress(input, { level: 9, mem: 12 }, (err, compressed) => {
        if (err) {
          reject(err);
        } else {
          // Convert to base64 for storage
          resolve(btoa(String.fromCharCode(...compressed)));
        }
      });
    });
  }

  private async decompressFromBrotli(compressedData: string): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const compressed = Uint8Array.from(atob(compressedData), c => c.charCodeAt(0));
        
        decompress(compressed, (err, decompressed) => {
          if (err) {
            reject(err);
          } else {
            resolve(new TextDecoder().decode(decompressed));
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  // API key storage methods
  async storeEncryptedApiKey(service: string, encryptedKey: string): Promise<void> {
    if (!this.db) await this.init();
    
    await this.db!.put('apiKeys', { service, encryptedKey });
  }

  async getEncryptedApiKey(service: string): Promise<string | null> {
    if (!this.db) await this.init();
    
    const result = await this.db!.get('apiKeys', service);
    return result?.encryptedKey || null;
  }

  // Cache management methods
  private async calculateCacheSize(): Promise<void> {
    if (!this.db) return;
    
    const entries = await this.db.getAll('cache');
    this.cacheSize = entries.reduce((total, entry) => total + entry.size, 0);
  }

  private async ensureCacheSpace(newSize: number): Promise<void> {
    if (!this.db) return;
    
    if (this.cacheSize + newSize <= this.MAX_CACHE_SIZE) return;
    
    // Get all entries sorted by LRU algorithm (timestamp and access count)
    const entries = await this.db.getAll('cache');
    entries.sort((a, b) => {
      // Prioritize by access count, then by timestamp
      const scoreA = a.accessCount * 0.7 + (Date.now() - a.timestamp) * 0.3;
      const scoreB = b.accessCount * 0.7 + (Date.now() - b.timestamp) * 0.3;
      return scoreA - scoreB;
    });
    
    // Remove least recently used entries until we have space
    let freedSpace = 0;
    const tx = this.db.transaction('cache', 'readwrite');
    
    for (const entry of entries) {
      if (this.cacheSize - freedSpace + newSize <= this.MAX_CACHE_SIZE) break;
      
      await tx.objectStore('cache').delete(entry.key);
      freedSpace += entry.size;
    }
    
    await tx.done;
    this.cacheSize -= freedSpace;
    
    console.log(`Freed ${this.formatBytes(freedSpace)} from cache`);
  }

  async getCacheStats(): Promise<{
    size: number;
    maxSize: number;
    entryCount: number;
    utilizationPercent: number;
  }> {
    if (!this.db) await this.init();
    
    const entries = await this.db!.getAll('cache');
    
    return {
      size: this.cacheSize,
      maxSize: this.MAX_CACHE_SIZE,
      entryCount: entries.length,
      utilizationPercent: (this.cacheSize / this.MAX_CACHE_SIZE) * 100,
    };
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Database health check
  async healthCheck(): Promise<{
    supabase: boolean;
    indexedDB: boolean;
    vectorDB: boolean;
    cacheStats: any;
  }> {
    const health = {
      supabase: false,
      indexedDB: false,
      vectorDB: false,
      cacheStats: null,
    };

    // Check Supabase connection
    if (this.supabase) {
      try {
        const { error } = await this.supabase
          .from('framework_data')
          .select('count')
          .limit(1);
        health.supabase = !error;
      } catch {
        health.supabase = false;
      }
    }

    // Check IndexedDB
    try {
      if (!this.db) await this.init();
      health.indexedDB = !!this.db;
      health.cacheStats = await this.getCacheStats();
    } catch {
      health.indexedDB = false;
    }

    // Check Vector DB with fallback
    try {
      const response = await fetch(`${this.VECTOR_API_BASE}/health`);
      health.vectorDB = response.ok;
    } catch {
      // Vector DB not available, but that's okay - we have fallbacks
      health.vectorDB = false;
    }

    return health;
  }
}

// Export singleton instance
export const dbService = DatabaseService.getInstance();