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
  type: 'repo' | 'documentation' | 'example';
}

class ScraperService {
  private readonly GITHUB_API_BASE = 'https://api.github.com';
  private readonly RATE_LIMIT_DELAY = 1000; // 1 second between requests
  private lastRequestTime = 0;

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
            id: `${framework}-${repo.full_name}`,
            framework,
            content,
            url: repo.html_url,
            stars: repo.stargazers_count,
            lastUpdated: new Date().toISOString(),
            type: 'repo',
          });
        } catch (error) {
          console.warn(`Failed to scrape ${repo.full_name}:`, error);
        }
      }
      
      // Scrape official documentation
      const docData = await this.scrapeDocumentation(framework);
      results.push(...docData);
      
    } catch (error) {
      console.error(`Failed to scrape ${framework} data:`, error);
      
      if (error instanceof Error && error.message.includes('rate limit')) {
        throw new Error(`GitHub API rate limit exceeded. Please try again later.`);
      }
    }
    
    return results;
  }

  private async searchRepositories(framework: string): Promise<GitHubRepo[]> {
    const queries = this.getSearchQueries(framework);
    const allRepos: GitHubRepo[] = [];
    
    for (const query of queries) {
      await this.rateLimitDelay();
      
      try {
        const response = await fetch(
          `${this.GITHUB_API_BASE}/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=20`
        );
        
        if (!response.ok) {
          if (response.status === 403) {
            throw new Error('GitHub API rate limit exceeded');
          }
          throw new Error(`GitHub API error: ${response.status}`);
        }
        
        const data = await response.json();
        const repos = data.items.filter((repo: GitHubRepo) => repo.stargazers_count >= 100);
        allRepos.push(...repos);
      } catch (error) {
        console.warn(`Failed to search with query "${query}":`, error);
      }
    }
    
    // Remove duplicates and sort by stars
    const uniqueRepos = allRepos.filter((repo, index, self) => 
      self.findIndex(r => r.full_name === repo.full_name) === index
    );
    
    return uniqueRepos.sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, 50);
  }

  private getSearchQueries(framework: string): string[] {
    const baseQueries = {
      'crewai': [
        'crewai agent framework',
        'crewai multi-agent',
        'crewai python',
        'crew ai examples',
      ],
      'google-adk': [
        'google agent development kit',
        'google adk agent',
        'google agent framework',
      ],
      'autogen': [
        'microsoft autogen',
        'autogen multi-agent',
        'autogen conversational ai',
        'autogen framework python',
      ],
    };
    
    return baseQueries[framework as keyof typeof baseQueries] || [`${framework} agent framework`];
  }

  private async getRepositoryContent(repo: GitHubRepo): Promise<string> {
    const contentParts: string[] = [];
    
    // Get README
    try {
      const readmeResponse = await fetch(`${this.GITHUB_API_BASE}/repos/${repo.full_name}/readme`);
      if (readmeResponse.ok) {
        const readmeData = await readmeResponse.json();
        const readmeContent = atob(readmeData.content);
        contentParts.push(`# README\n${readmeContent}`);
      }
    } catch (error) {
      console.warn(`Failed to get README for ${repo.full_name}`);
    }
    
    // Get key files
    const keyFiles = ['setup.py', 'requirements.txt', 'package.json', 'examples', 'docs'];
    
    for (const fileName of keyFiles) {
      try {
        await this.rateLimitDelay();
        const fileResponse = await fetch(`${this.GITHUB_API_BASE}/repos/${repo.full_name}/contents/${fileName}`);
        
        if (fileResponse.ok) {
          const fileData = await fileResponse.json();
          
          if (Array.isArray(fileData)) {
            // It's a directory
            contentParts.push(`# ${fileName.toUpperCase()}\n${fileData.map(f => f.name).join(', ')}`);
          } else if (fileData.content) {
            // It's a file
            const content = atob(fileData.content);
            contentParts.push(`# ${fileName.toUpperCase()}\n${content}`);
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
        // Note: In a real implementation, you'd use a proper web scraping service
        // For now, we'll simulate documentation scraping
        const docContent = await this.simulateDocScraping(framework, url);
        
        results.push({
          id: `${framework}-docs-${Date.now()}`,
          framework,
          content: docContent,
          url,
          stars: 0,
          lastUpdated: new Date().toISOString(),
          type: 'documentation',
        });
      } catch (error) {
        console.warn(`Failed to scrape documentation from ${url}:`, error);
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
      ],
      'autogen': [
        'https://microsoft.github.io/autogen/',
        'https://github.com/microsoft/autogen/tree/main/notebook',
      ],
    };
    
    return docUrls[framework as keyof typeof docUrls] || [];
  }

  private async simulateDocScraping(framework: string, url: string): Promise<string> {
    // In a real implementation, this would scrape actual documentation
    // For the demo, we'll return simulated content
    return `
# ${framework.toUpperCase()} Documentation

This is simulated documentation content for ${framework}.

## Quick Start Guide

1. Installation
2. Basic Configuration
3. Creating Your First Agent
4. Advanced Features

## Examples

- Basic agent creation
- Multi-agent workflows
- Integration patterns
- Best practices

Source: ${url}
Last scraped: ${new Date().toISOString()}
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
}

export const scraperService = new ScraperService();