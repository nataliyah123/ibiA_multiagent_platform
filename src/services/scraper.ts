import { dbService } from './database';

interface GitHubRepo {
  full_name: string;
  description: string;
  html_url: string;
  stargazers_count: number;
  updated_at: string;
  language: string;
}

interface ScrapedData {
  id: string;
  framework: string;
  content: string;
  url: string;
  stars: number;
  lastUpdated: string;
  contentType: 'repo' | 'documentation' | 'example';
  compressedSize?: number;
}

interface VectorEmbedding {
  id: string;
  framework: string;
  content_id: string;
  embedding: number[];
  metadata: Record<string, any>;
}

class ScraperService {
  private readonly GITHUB_API_BASE = 'https://api.github.com';
  private readonly RATE_LIMIT_DELAY = 1000; // 1 second between requests
  private lastRequestTime = 0;

  async scrapeAndStoreFrameworkData(framework: string, forceUpdate = false): Promise<ScrapedData[]> {
    console.log(`Starting data scraping for ${framework}...`);
    
    try {
      // Check if we have recent data (unless force update)
      if (!forceUpdate) {
        const existingData = await dbService.getFrameworkData(framework, 10);
        if (existingData.length > 0) {
          const lastUpdate = new Date(existingData[0].lastUpdated);
          const daysSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);
          
          if (daysSinceUpdate < 7) {
            console.log(`Using cached data for ${framework} (${daysSinceUpdate.toFixed(1)} days old)`);
            return existingData;
          }
        }
      }

      // Scrape fresh data
      const scrapedData = await this.scrapeFrameworkData(framework);
      
      if (scrapedData.length === 0) {
        console.warn(`No data scraped for ${framework}`);
        return [];
      }

      // Store in Supabase with compression
      await dbService.storeFrameworkData(scrapedData);
      
      // Generate and store vector embeddings
      await this.generateAndStoreEmbeddings(scrapedData);
      
      console.log(`Successfully scraped and stored ${scrapedData.length} items for ${framework}`);
      return scrapedData;
      
    } catch (error) {
      console.error(`Failed to scrape and store data for ${framework}:`, error);
      
      // Fallback to cached data if available
      const cachedData = await dbService.getFrameworkData(framework);
      if (cachedData.length > 0) {
        console.log(`Using fallback cached data for ${framework}`);
        return cachedData;
      }
      
      throw error;
    }
  }

  async scrapeFrameworkData(framework: string): Promise<ScrapedData[]> {
    const results: ScrapedData[] = [];
    
    try {
      // Search for repositories
      const repos = await this.searchRepositories(framework);
      console.log(`Found ${repos.length} repositories for ${framework}`);
      
      for (const repo of repos) {
        await this.rateLimitDelay();
        
        try {
          // Get repository content
          const content = await this.getRepositoryContent(repo);
          
          results.push({
            id: `${framework}-repo-${repo.full_name.replace('/', '-')}`,
            framework,
            content,
            url: repo.html_url,
            stars: repo.stargazers_count,
            lastUpdated: new Date().toISOString(),
            contentType: 'repo',
          });
        } catch (error) {
          console.warn(`Failed to scrape ${repo.full_name}:`, error);
        }
      }
      
      // Scrape official documentation
      const docData = await this.scrapeDocumentation(framework);
      results.push(...docData);
      
      // Scrape examples and tutorials
      const exampleData = await this.scrapeExamples(framework);
      results.push(...exampleData);
      
    } catch (error) {
      console.error(`Failed to scrape ${framework} data:`, error);
      
      if (error instanceof Error && error.message.includes('rate limit')) {
        throw new Error(`GitHub API rate limit exceeded. Please try again later.`);
      }
    }
    
    return results;
  }

  private async generateAndStoreEmbeddings(scrapedData: ScrapedData[]): Promise<void> {
    const embeddings: VectorEmbedding[] = [];
    
    for (const data of scrapedData) {
      try {
        // Split content into chunks for better embeddings
        const chunks = this.splitContentIntoChunks(data.content, 1000);
        
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          const embedding = await dbService.generateEmbedding(chunk);
          
          embeddings.push({
            id: `${data.id}-chunk-${i}`,
            framework: data.framework,
            content_id: data.id,
            embedding,
            metadata: {
              url: data.url,
              stars: data.stars,
              contentType: data.contentType,
              chunkIndex: i,
              totalChunks: chunks.length,
              lastUpdated: data.lastUpdated,
            },
          });
        }
      } catch (error) {
        console.warn(`Failed to generate embedding for ${data.id}:`, error);
      }
    }
    
    if (embeddings.length > 0) {
      await dbService.storeVectorEmbeddings(embeddings);
      console.log(`Generated and stored ${embeddings.length} vector embeddings`);
    }
  }

  private splitContentIntoChunks(content: string, maxChunkSize: number): string[] {
    const chunks: string[] = [];
    const sentences = content.split(/[.!?]+/);
    let currentChunk = '';
    
    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > maxChunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += sentence + '.';
      }
    }
    
    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks;
  }

  async searchFrameworkContent(
    query: string,
    framework?: string,
    useVector = true
  ): Promise<{ textResults: ScrapedData[]; vectorResults: any[] }> {
    const results = {
      textResults: [] as ScrapedData[],
      vectorResults: [] as any[],
    };
    
    try {
      // Search using traditional text search
      const textResults = await dbService.searchFrameworkData(query, framework);
      results.textResults = textResults;
      
      // Search using vector embeddings if enabled
      if (useVector) {
        const vectorResults = await dbService.searchVectorEmbeddings(query, framework, 20);
        results.vectorResults = vectorResults;
      }
      
      // Cache the search results
      await dbService.cacheUserQuery(query, results, framework || 'all');
      
    } catch (error) {
      console.error('Search failed:', error);
    }
    
    return results;
  }

  private async searchRepositories(framework: string): Promise<GitHubRepo[]> {
    const queries = this.getSearchQueries(framework);
    const allRepos: GitHubRepo[] = [];
    
    for (const query of queries) {
      await this.rateLimitDelay();
      
      try {
        const headers: Record<string, string> = {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Multiagent-Platform-Scraper',
        };
        
        // Add GitHub token if available
        const githubToken = import.meta.env.VITE_GITHUB_TOKEN;
        if (githubToken) {
          headers['Authorization'] = `token ${githubToken}`;
        }
        
        const response = await fetch(
          `${this.GITHUB_API_BASE}/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=30`,
          { headers }
        );
        
        if (!response.ok) {
          if (response.status === 403) {
            const resetTime = response.headers.get('X-RateLimit-Reset');
            throw new Error(`GitHub API rate limit exceeded. Reset at: ${new Date(parseInt(resetTime || '0') * 1000)}`);
          }
          throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        const repos = data.items.filter((repo: GitHubRepo) => repo.stargazers_count >= 50);
        allRepos.push(...repos);
        
        console.log(`Query "${query}" returned ${repos.length} repositories`);
      } catch (error) {
        console.warn(`Failed to search with query "${query}":`, error);
      }
    }
    
    // Remove duplicates and sort by stars
    const uniqueRepos = allRepos.filter((repo, index, self) => 
      self.findIndex(r => r.full_name === repo.full_name) === index
    );
    
    return uniqueRepos.sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, 100);
  }

  private getSearchQueries(framework: string): string[] {
    const baseQueries = {
      'crewai': [
        'crewai agent framework python',
        'crewai multi-agent system',
        'crew ai autonomous agents',
        'crewai examples tutorial',
        'crewai workflow automation',
      ],
      'google-adk': [
        'google agent development kit',
        'google adk agent framework',
        'google cloud agent builder',
        'google adk examples',
      ],
      'autogen': [
        'microsoft autogen multi-agent',
        'autogen conversational ai framework',
        'autogen python examples',
        'autogen agent conversation',
        'pyautogen microsoft',
      ],
    };
    
    return baseQueries[framework as keyof typeof baseQueries] || [`${framework} agent framework python`];
  }

  private async getRepositoryContent(repo: GitHubRepo): Promise<string> {
    const contentParts: string[] = [];
    
    // Add repository metadata
    contentParts.push(`# Repository: ${repo.full_name}
Description: ${repo.description || 'No description'}
Stars: ${repo.stargazers_count}
Language: ${repo.language || 'Unknown'}
URL: ${repo.html_url}
Last Updated: ${repo.updated_at}
`);
    
    // Get README
    try {
      const headers: Record<string, string> = {
        'Accept': 'application/vnd.github.v3+json',
      };
      
      const githubToken = import.meta.env.VITE_GITHUB_TOKEN;
      if (githubToken) {
        headers['Authorization'] = `token ${githubToken}`;
      }
      
      const readmeResponse = await fetch(`${this.GITHUB_API_BASE}/repos/${repo.full_name}/readme`, { headers });
      if (readmeResponse.ok) {
        const readmeData = await readmeResponse.json();
        const readmeContent = atob(readmeData.content);
        contentParts.push(`## README\n${readmeContent}`);
      }
    } catch (error) {
      console.warn(`Failed to get README for ${repo.full_name}`);
    }
    
    // Get key files
    const keyFiles = ['setup.py', 'requirements.txt', 'package.json', 'pyproject.toml'];
    
    for (const fileName of keyFiles) {
      try {
        await this.rateLimitDelay();
        
        const headers: Record<string, string> = {
          'Accept': 'application/vnd.github.v3+json',
        };
        
        const githubToken = import.meta.env.VITE_GITHUB_TOKEN;
        if (githubToken) {
          headers['Authorization'] = `token ${githubToken}`;
        }
        
        const fileResponse = await fetch(`${this.GITHUB_API_BASE}/repos/${repo.full_name}/contents/${fileName}`, { headers });
        
        if (fileResponse.ok) {
          const fileData = await fileResponse.json();
          
          if (fileData.content && fileData.size < 10000) { // Limit file size
            const content = atob(fileData.content);
            contentParts.push(`## ${fileName.toUpperCase()}\n${content}`);
          }
        }
      } catch (error) {
        // Ignore missing files
      }
    }
    
    return contentParts.join('\n\n---\n\n');
  }

  private async scrapeDocumentation(framework: string): Promise<ScrapedData[]> {
    const docUrls = this.getDocumentationUrls(framework);
    const results: ScrapedData[] = [];
    
    for (const url of docUrls) {
      try {
        // For now, simulate documentation scraping
        // In production, you would implement actual web scraping
        const docContent = await this.simulateDocScraping(framework, url);
        
        results.push({
          id: `${framework}-docs-${this.generateId()}`,
          framework,
          content: docContent,
          url,
          stars: 0,
          lastUpdated: new Date().toISOString(),
          contentType: 'documentation',
        });
      } catch (error) {
        console.warn(`Failed to scrape documentation from ${url}:`, error);
      }
    }
    
    return results;
  }

  private async scrapeExamples(framework: string): Promise<ScrapedData[]> {
    // Search for example repositories
    const exampleQueries = [`${framework} examples`, `${framework} tutorial`, `${framework} demo`];
    const results: ScrapedData[] = [];
    
    for (const query of exampleQueries) {
      try {
        await this.rateLimitDelay();
        
        const headers: Record<string, string> = {
          'Accept': 'application/vnd.github.v3+json',
        };
        
        const githubToken = import.meta.env.VITE_GITHUB_TOKEN;
        if (githubToken) {
          headers['Authorization'] = `token ${githubToken}`;
        }
        
        const response = await fetch(
          `${this.GITHUB_API_BASE}/search/repositories?q=${encodeURIComponent(query)}&sort=updated&per_page=10`,
          { headers }
        );
        
        if (response.ok) {
          const data = await response.json();
          
          for (const repo of data.items.slice(0, 5)) {
            const content = await this.getRepositoryContent(repo);
            
            results.push({
              id: `${framework}-example-${repo.full_name.replace('/', '-')}`,
              framework,
              content,
              url: repo.html_url,
              stars: repo.stargazers_count,
              lastUpdated: new Date().toISOString(),
              contentType: 'example',
            });
          }
        }
      } catch (error) {
        console.warn(`Failed to scrape examples for query "${query}":`, error);
      }
    }
    
    return results;
  }

  private getDocumentationUrls(framework: string): string[] {
    const docUrls = {
      'crewai': [
        'https://docs.crewai.com',
        'https://github.com/joaomdmoura/crewAI/wiki',
      ],
      'google-adk': [
        'https://developers.google.com/agent-development-kit',
        'https://cloud.google.com/agent-builder/docs',
      ],
      'autogen': [
        'https://microsoft.github.io/autogen/',
        'https://github.com/microsoft/autogen/tree/main/notebook',
      ],
    };
    
    return docUrls[framework as keyof typeof docUrls] || [];
  }

  private async simulateDocScraping(framework: string, url: string): Promise<string> {
    // In production, implement actual web scraping here
    // For now, return comprehensive simulated content
    return `
# ${framework.toUpperCase()} Official Documentation

## Overview
${framework} is a powerful framework for building multi-agent systems with advanced capabilities.

## Installation
\`\`\`bash
pip install ${framework}
\`\`\`

## Quick Start
\`\`\`python
from ${framework} import Agent, Crew

# Create an agent
agent = Agent(
    role="Assistant",
    goal="Help users with their tasks",
    backstory="You are a helpful AI assistant"
)

# Create a crew
crew = Crew(agents=[agent])
result = crew.kickoff()
\`\`\`

## Advanced Features
- Multi-agent coordination
- Task delegation
- Memory management
- Tool integration
- Custom workflows

## Best Practices
1. Define clear agent roles
2. Set specific goals
3. Use appropriate tools
4. Monitor performance
5. Handle errors gracefully

## Examples
- Basic agent setup
- Multi-agent workflows
- Integration patterns
- Custom tools
- Production deployment

## API Reference
Comprehensive API documentation with examples and use cases.

Source: ${url}
Last updated: ${new Date().toISOString()}
Framework: ${framework}
    `.trim();
  }

  private async rateLimitDelay(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.RATE_LIMIT_DELAY) {
      await new Promise(resolve => 
        setTimeout(resolve, this.RATE_LIMIT_DELAY - timeSinceLastRequest)
      );
    }
    
    this.lastRequestTime = Date.now();
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  // Public method to get scraping status
  async getScrapingStatus(framework: string): Promise<{
    lastUpdate: string | null;
    itemCount: number;
    isStale: boolean;
  }> {
    const data = await dbService.getFrameworkData(framework, 1);
    
    if (data.length === 0) {
      return {
        lastUpdate: null,
        itemCount: 0,
        isStale: true,
      };
    }
    
    const lastUpdate = data[0].lastUpdated;
    const daysSinceUpdate = (Date.now() - new Date(lastUpdate).getTime()) / (1000 * 60 * 60 * 24);
    
    return {
      lastUpdate,
      itemCount: data.length,
      isStale: daysSinceUpdate > 7,
    };
  }
}

export const scraperService = new ScraperService();