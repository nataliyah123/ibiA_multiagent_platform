import JSZip from 'jszip';
import { securityService } from './security';

interface PackageFile {
  path: string;
  content: string;
}

interface PackageConfig {
  projectName: string;
  framework: string;
  files: { [path: string]: string };
  includeNetlifyConfig?: boolean;
  includeServerless?: boolean;
}

class PackageService {
  async createDownloadPackage(config: PackageConfig): Promise<Blob> {
    const zip = new JSZip();
    const { projectName, framework, files, includeNetlifyConfig, includeServerless } = config;
    
    // Add project files
    for (const [path, content] of Object.entries(files)) {
      const sanitizedContent = securityService.sanitizeCode(content);
      zip.file(path, sanitizedContent);
    }
    
    // Add Netlify configuration if requested
    if (includeNetlifyConfig) {
      const netlifyConfig = this.generateNetlifyConfig(projectName, framework);
      zip.file('netlify.toml', netlifyConfig);
      
      // Add Netlify functions if serverless is enabled
      if (includeServerless) {
        const functions = this.generateServerlessFunctions(framework);
        for (const [path, content] of Object.entries(functions)) {
          zip.file(`netlify/functions/${path}`, securityService.sanitizeCode(content));
        }
      }
    }
    
    // Add deployment documentation
    const deploymentDocs = this.generateDeploymentDocs(projectName, framework);
    zip.file('DEPLOYMENT.md', deploymentDocs);
    
    // Add project metadata
    const metadata = this.generateProjectMetadata(config);
    zip.file('project-metadata.json', JSON.stringify(metadata, null, 2));
    
    // Generate and validate ZIP
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    
    // Validate the package
    const zipArray = new Uint8Array(await zipBlob.arrayBuffer());
    if (!securityService.validateDownloadPackage(zipArray)) {
      throw new Error('Generated package failed validation');
    }
    
    return zipBlob;
  }

  private generateNetlifyConfig(projectName: string, framework: string): string {
    return `# Netlify Configuration for ${projectName}
# Framework: ${framework}

[build]
  command = "npm run build"
  publish = "dist"
  functions = "netlify/functions"

[build.environment]
  NODE_VERSION = "18"
  PYTHON_VERSION = "3.11"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[dev]
  command = "npm run dev"
  port = 3000
  autoLaunch = false

# Edge Functions (if supported)
[[edge_functions]]
  function = "agent-runner"
  path = "/api/agents/*"
`;
  }

  private generateServerlessFunctions(framework: string): { [filename: string]: string } {
    const functions: { [filename: string]: string } = {};
    
    // Agent execution function
    functions['agent-runner.js'] = `
const { Handler } = require('@netlify/functions');

// Framework-specific imports
${framework === 'crewai' ? "// const { CrewAI } = require('crewai');" : ''}
${framework === 'autogen' ? "// const autogen = require('pyautogen');" : ''}

const handler = async (event, context) => {
  try {
    const { httpMethod, body, queryStringParameters } = event;
    
    // CORS headers
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    };
    
    if (httpMethod === 'OPTIONS') {
      return { statusCode: 200, headers, body: '' };
    }
    
    if (httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Method not allowed' }),
      };
    }
    
    const { agents, workflow, config } = JSON.parse(body || '{}');
    
    // TODO: Implement ${framework} agent execution logic
    const result = {
      framework: '${framework}',
      status: 'success',
      message: 'Agents executed successfully',
      timestamp: new Date().toISOString(),
      // Add actual execution results here
    };
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result),
    };
    
  } catch (error) {
    console.error('Agent execution error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
    };
  }
};

module.exports = { handler };
`;

    // Data scraping function
    functions['data-scraper.js'] = `
const { Handler } = require('@netlify/functions');

const handler = async (event, context) => {
  try {
    const { httpMethod, queryStringParameters } = event;
    
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    };
    
    if (httpMethod === 'OPTIONS') {
      return { statusCode: 200, headers, body: '' };
    }
    
    const { framework, forceUpdate } = queryStringParameters || {};
    
    if (!framework) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Framework parameter required' }),
      };
    }
    
    // TODO: Implement GitHub scraping logic
    // Note: In production, use proper GitHub API with authentication
    
    const scrapedData = {
      framework,
      lastUpdated: new Date().toISOString(),
      repositories: [
        // Mock data - replace with actual scraping results
        {
          name: \`\${framework}-example\`,
          url: \`https://github.com/example/\${framework}\`,
          stars: 1000,
          description: \`Example \${framework} repository\`,
        },
      ],
      documentation: [
        {
          title: \`\${framework} Documentation\`,
          url: \`https://docs.\${framework}.com\`,
          content: \`Documentation content for \${framework}\`,
        },
      ],
    };
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(scrapedData),
    };
    
  } catch (error) {
    console.error('Scraping error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        error: 'Scraping failed',
        message: error.message 
      }),
    };
  }
};

module.exports = { handler };
`;

    return functions;
  }

  private generateDeploymentDocs(projectName: string, framework: string): string {
    return `# Deployment Guide for ${projectName}

## Overview

This document provides comprehensive deployment instructions for your ${framework}-based multi-agent system powered by Google Gemini AI.

## Deployment Options

### 1. Netlify Deployment (Frontend)

#### Automatic Deployment
1. Push your code to a Git repository (GitHub, GitLab, Bitbucket)
2. Connect your repository to Netlify
3. Netlify will automatically deploy using the included \`netlify.toml\` configuration

#### Manual Deployment
1. Build your project:
   \`\`\`bash
   npm run build
   \`\`\`

2. Deploy the \`dist\` folder to Netlify:
   \`\`\`bash
   npx netlify deploy --prod --dir=dist
   \`\`\`

### 2. Backend Deployment (Agent System)

#### Railway.app (Recommended)
1. Create account at [Railway.app](https://railway.app)
2. Connect your repository
3. Add environment variables in Railway dashboard
4. Deploy with one click

#### Alternative: Docker Deployment
1. Build the Docker image:
   \`\`\`bash
   docker build -t ${projectName.toLowerCase().replace(/\s+/g, '-')} .
   \`\`\`

2. Run the container:
   \`\`\`bash
   docker run -d --env-file .env -p 8000:8000 ${projectName.toLowerCase().replace(/\s+/g, '-')}
   \`\`\`

## Environment Variables

Ensure these environment variables are set in your deployment:

### Required
- \`GEMINI_API_KEY\`: Your Google Gemini API key (get from [Google AI Studio](https://makersuite.google.com/app/apikey))
- \`LOG_LEVEL\`: Logging level (INFO, DEBUG, ERROR)

### Framework-Specific (${framework.toUpperCase()})
${this.getFrameworkEnvVars(framework)}

## Google Gemini API Setup

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the API key to your environment variables as \`GEMINI_API_KEY\`

### Gemini API Features:
- **Free Tier**: 60 requests per minute, 1,500 requests per day
- **Rate Limits**: Generous limits for development and testing
- **Models Available**: Gemini Pro, Gemini Pro Vision, Embedding models

## Database Setup

If your agents require persistent storage:

1. **PostgreSQL** (recommended for production)
2. **SQLite** (for development/testing)
3. **Redis** (for caching and queues)

## Monitoring and Logging

### Netlify
- Function logs available in Netlify dashboard
- Built-in analytics and performance monitoring

### Railway.app
- Application logs in Railway dashboard
- Metrics and resource usage tracking

## Security Considerations

1. **API Keys**: Never commit API keys to version control
2. **CORS**: Configure appropriate CORS headers for production
3. **Rate Limiting**: Implement rate limiting for API endpoints
4. **Input Validation**: Validate all user inputs

## Scaling

### Horizontal Scaling
- Use multiple instances of your agent system
- Implement load balancing between instances

### Vertical Scaling
- Increase memory/CPU resources
- Optimize agent execution efficiency

## Troubleshooting

### Common Issues

1. **Memory Limits**: Increase memory allocation if agents fail
2. **API Rate Limits**: Implement proper rate limiting and retries
3. **Cold Starts**: Use keep-alive strategies for serverless functions

### Debug Mode
Enable debug logging by setting \`LOG_LEVEL=DEBUG\` in environment variables.

## Performance Optimization

1. **Caching**: Implement caching for frequently accessed data
2. **Connection Pooling**: Use connection pooling for database access
3. **Async Operations**: Leverage async/await for I/O operations

## Backup and Recovery

1. Regular database backups
2. Environment variable backups
3. Code repository backups

---

*Generated on ${new Date().toISOString()}*
*Framework: ${framework}*
*AI Model: Google Gemini*
*Platform: Multiagent Development Platform*
`;
  }

  private getFrameworkEnvVars(framework: string): string {
    const envVars = {
      'crewai': `- \`CREWAI_API_KEY\`: CrewAI API key
- \`SERPER_API_KEY\`: Serper API key for web search`,
      'autogen': `- \`AUTOGEN_MODEL\`: Model to use (default: gemini-pro)
- \`AUTOGEN_TEMPERATURE\`: Model temperature (0.0-1.0)`,
      'google-adk': `- \`GOOGLE_APPLICATION_CREDENTIALS\`: Path to service account JSON
- \`GOOGLE_PROJECT_ID\`: Google Cloud project ID`,
    };
    
    return envVars[framework as keyof typeof envVars] || 'No additional environment variables required.';
  }

  private generateProjectMetadata(config: PackageConfig): any {
    return {
      name: config.projectName,
      framework: config.framework,
      aiModel: 'Google Gemini',
      version: '1.0.0',
      generated: new Date().toISOString(),
      platform: 'Multiagent Development Platform',
      structure: Object.keys(config.files).sort(),
      features: {
        netlifyConfig: config.includeNetlifyConfig || false,
        serverlessFunctions: config.includeServerless || false,
        sanitizedCode: true,
        securityValidated: true,
        geminiIntegration: true,
      },
      deployment: {
        frontend: 'Netlify',
        backend: 'Railway.app',
        containerized: true,
      },
      aiCapabilities: {
        model: 'Gemini Pro',
        embeddings: 'Gemini Embedding-001',
        freeApiTier: true,
        rateLimits: '60 requests/minute, 1,500 requests/day',
      },
    };
  }
}

export const packageService = new PackageService();