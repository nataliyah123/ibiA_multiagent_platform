# Multiagent System Development Platform

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/your-org/multiagent-platform)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/your-org/multiagent-platform/actions)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Netlify Status](https://api.netlify.com/api/v1/badges/your-site-id/deploy-status)](https://app.netlify.com/sites/your-site/deploys)

> A production-ready platform for automating multiagent system development with intelligent code generation, RAG-powered insights, and seamless deployment capabilities. Powered by Google Gemini AI and ElevenLabs voice technology.

## Table of Contents

- [Project Overview](#project-overview)
- [Getting Started](#getting-started)
- [Development Environment Setup](#development-environment-setup)
- [Production Deployment](#production-deployment)
- [ElevenLabs Voice Integration](#elevenlabs-voice-integration)
- [Google Gemini AI Integration](#google-gemini-ai-integration)
- [UX Pilot Integration](#ux-pilot-integration)
- [Future Roadmap](#future-roadmap)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Project Overview

The Multiagent System Development Platform is a comprehensive solution for creating, configuring, and deploying AI agent systems across multiple frameworks. It combines intelligent code generation, real-time data scraping, and intuitive user interfaces to streamline the development of production-ready multiagent applications.

### Key Features

- **Multi-Framework Support**: CrewAI, Google ADK, and AutoGen with intelligent comparison matrix
- **Google Gemini AI Integration**: Free-tier AI model for natural language processing and code generation
- **ElevenLabs Voice Technology**: Advanced speech-to-text, transcript enhancement, and intent analysis
- **RAG-Powered Intelligence**: GitHub repository scraping with vector storage for up-to-date code insights
- **Dual Input Modes**: Voice-powered specifications and structured form inputs
- **Visual Workflow Builder**: Drag-and-drop interface with Mermaid diagram export
- **One-Click Deployment**: Automated Netlify deployment with serverless backend
- **Enterprise Security**: Web Crypto API encryption and code sanitization
- **Production-Ready Output**: Complete project packages with Docker and deployment configurations

### Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   RAG System    │    │   Code Gen      │
│   (React/TS)    │◄──►│   (IndexedDB)   │◄──►│   (Templates)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Netlify       │    │   GitHub API    │    │   Package       │
│   (Hosting)     │    │   (Scraping)    │    │   (Download)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Supabase      │    │   ChromaDB      │    │   ElevenLabs    │
│   (Database)    │    │   (Vectors)     │    │   (Voice AI)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher)
- **npm** (v8.0.0 or higher) or **yarn** (v1.22.0 or higher)
- **Git** (v2.30.0 or higher)
- **Modern Browser** (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)

### Required Accounts

- **GitHub Account** (for repository access and deployment)
- **Netlify Account** (for frontend deployment)
- **Google Account** (for free Gemini API access)
- **Supabase Account** (for database storage)
- **ElevenLabs Account** (optional, for enhanced voice features)

### Installation Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/multiagent-platform.git
   cd multiagent-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

4. **Configure environment variables**
   ```bash
   # Edit .env file with your API keys
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   VITE_GITHUB_TOKEN=your_github_token_here
   VITE_SUPABASE_URL=your_supabase_url_here
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   VITE_ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
   ```

## Development Environment Setup

### Step-by-Step Local Development

1. **Get your Gemini API key**
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Sign in with your Google account
   - Create a new API key
   - Copy the key to your `.env` file

2. **Get your ElevenLabs API key (optional)**
   - Visit [ElevenLabs API Settings](https://elevenlabs.io/app/settings/api-keys)
   - Sign up for a free account
   - Generate an API key
   - Copy the key to your `.env` file

3. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Access the application**
   - Open your browser to `http://localhost:5173`
   - The application will automatically reload on file changes

### Configuration Requirements

#### Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
# Required - Google Gemini API for AI features (FREE)
VITE_GEMINI_API_KEY=your-gemini-api-key

# Required - GitHub token for repository scraping
VITE_GITHUB_TOKEN=ghp_your-github-token

# Required - Supabase for database storage
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Optional - ElevenLabs for enhanced voice features
VITE_ELEVENLABS_API_KEY=your-elevenlabs-api-key

# Optional - Analytics and monitoring
VITE_ANALYTICS_ID=your-analytics-id

# Development only
VITE_DEBUG_MODE=true
VITE_LOG_LEVEL=debug
```

#### Google Gemini API Setup

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key
5. Add it to your `.env` file as `VITE_GEMINI_API_KEY`

**Gemini API Benefits:**
- **Free Tier**: 60 requests per minute, 1,500 requests per day
- **No Credit Card Required**: Completely free to get started
- **Advanced AI**: Latest Google AI technology
- **Multiple Models**: Text generation, embeddings, and more

#### ElevenLabs API Setup

1. Go to [ElevenLabs](https://elevenlabs.io) and create a free account
2. Navigate to [API Settings](https://elevenlabs.io/app/settings/api-keys)
3. Generate a new API key
4. Copy the key to your `.env` file as `VITE_ELEVENLABS_API_KEY`

**ElevenLabs Features:**
- **Free Tier**: 10,000 characters per month
- **High-Quality Voice**: Realistic text-to-speech
- **Speech-to-Text**: Advanced transcription capabilities
- **Voice Cloning**: Custom voice creation (paid tiers)

#### GitHub Token Setup

1. Go to [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Select the following scopes:
   - `public_repo` (for accessing public repositories)
   - `read:org` (for organization repositories)
4. Copy the token to your `.env` file

#### Supabase Setup

1. Go to [Supabase](https://supabase.com) and create a new project
2. Get your project URL and anon key from the project settings
3. Add them to your `.env` file

### Common Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint

# Run type checking
npm run type-check

# Clean build artifacts
npm run clean

# Update dependencies
npm run update-deps
```

### Development Workflow

1. **Feature Development**
   ```bash
   git checkout -b feature/your-feature-name
   npm run dev
   # Make your changes
   npm run lint
   npm run build
   git commit -m "feat: add your feature"
   git push origin feature/your-feature-name
   ```

2. **Testing Changes**
   ```bash
   # Test production build locally
   npm run build && npm run preview
   
   # Test with different frameworks
   # Navigate to Framework Comparison and test each option
   ```

## Production Deployment

### Netlify Deployment (Recommended)

#### Automatic Deployment

1. **Connect to Netlify**
   - Push your code to GitHub
   - Connect your repository to Netlify
   - Netlify will automatically deploy using `netlify.toml`

2. **Configure Environment Variables in Netlify**
   ```bash
   # In Netlify Dashboard > Site settings > Environment variables
   VITE_GEMINI_API_KEY=your_production_gemini_key
   VITE_GITHUB_TOKEN=your_production_github_token
   VITE_SUPABASE_URL=your_production_supabase_url
   VITE_SUPABASE_ANON_KEY=your_production_supabase_key
   VITE_ELEVENLABS_API_KEY=your_production_elevenlabs_key
   ```

#### Manual Deployment

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Build and deploy
npm run build
netlify deploy --prod --dir=dist
```

### Backend Deployment (Railway.app)

1. **Create Railway Account**
   - Sign up at [Railway.app](https://railway.app)
   - Connect your GitHub repository

2. **Configure Environment Variables**
   ```bash
   # In Railway dashboard
   GEMINI_API_KEY=your_gemini_api_key
   GITHUB_TOKEN=your_github_token
   NODE_ENV=production
   PORT=8000
   ```

3. **Deploy**
   - Railway automatically deploys on git push
   - Monitor logs in Railway dashboard

### Configuration Differences from Development

#### Production Environment Variables

```bash
# Remove debug flags
VITE_DEBUG_MODE=false
VITE_LOG_LEVEL=error

# Add production URLs
VITE_API_BASE_URL=https://your-api.railway.app
VITE_FRONTEND_URL=https://your-site.netlify.app

# Add monitoring
VITE_SENTRY_DSN=your_sentry_dsn
VITE_ANALYTICS_ID=your_analytics_id
```

#### Performance Optimizations

```bash
# Build with optimizations
npm run build

# Enable compression in netlify.toml
[[headers]]
  for = "*.js"
  [headers.values]
    Content-Encoding = "gzip"
```

### Scaling Considerations

#### Frontend Scaling
- **CDN**: Netlify provides global CDN automatically
- **Caching**: Static assets cached for 1 year
- **Compression**: Gzip/Brotli compression enabled

#### Backend Scaling
- **Horizontal Scaling**: Deploy multiple Railway instances
- **Database**: PostgreSQL for persistent data
- **Caching**: Redis for session management

### Monitoring Setup

#### Error Tracking
```bash
# Install Sentry
npm install @sentry/react @sentry/tracing

# Configure in src/main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
});
```

#### Analytics
```bash
# Google Analytics 4
npm install gtag

# Configure in src/services/analytics.ts
```

## ElevenLabs Voice Integration

### Features

The platform integrates ElevenLabs for advanced voice processing capabilities:

#### Speech-to-Text
- **High Accuracy**: Superior transcription quality compared to browser APIs
- **Real-time Processing**: Live audio streaming and transcription
- **Multiple Languages**: Support for various languages and accents
- **Noise Reduction**: Advanced audio processing for clear transcription

#### Text-to-Speech
- **Natural Voices**: Realistic human-like voice synthesis
- **Voice Selection**: Multiple voice options and personalities
- **Custom Voices**: Voice cloning capabilities (paid tiers)
- **Emotional Range**: Expressive speech with varied tones

#### Transcript Enhancement
- **AI-Powered Cleanup**: Automatic grammar and punctuation correction
- **Context Preservation**: Maintains original meaning and intent
- **Readability Improvement**: Enhanced formatting and structure
- **Technical Accuracy**: Preserves technical terms and specifications

#### Intent Analysis
- **Natural Language Understanding**: Extracts user intentions from speech
- **Entity Recognition**: Identifies frameworks, agent roles, and configurations
- **Confidence Scoring**: Provides reliability metrics for detected intents
- **Auto-Application**: Automatically applies detected configurations

### Usage Examples

#### Basic Voice Input
```typescript
// The system automatically detects and processes voice input
// Users simply click the microphone and speak naturally

"I want to create a multiagent system using CrewAI with three agents: 
a researcher, a writer, and a reviewer for content creation."
```

#### Enhanced Processing
```typescript
// Original transcript (from speech-to-text)
"um so i need like a crew ai system with uh three agents you know"

// Enhanced transcript (AI-processed)
"I need a CrewAI system with three agents."

// Intent analysis
{
  "intent": "create_agents",
  "entities": [
    {"type": "framework", "value": "crewai"},
    {"type": "agent_count", "value": "3"}
  ],
  "confidence": 0.92
}
```

### Configuration

#### Voice Settings
- **Provider Selection**: Choose between browser speech recognition and ElevenLabs
- **Voice Selection**: Pick from available ElevenLabs voices
- **Enhancement Options**: Enable/disable transcript enhancement and intent analysis
- **Quality Settings**: Adjust processing parameters for optimal results

#### API Limits
- **Free Tier**: 10,000 characters per month for text-to-speech
- **Speech-to-Text**: Generous limits for transcription
- **Rate Limits**: Automatic handling with fallback to browser APIs
- **Usage Monitoring**: Track API usage within the application

### Fallback Behavior

The system gracefully handles ElevenLabs unavailability:

1. **No API Key**: Falls back to browser speech recognition
2. **Rate Limits**: Switches to browser APIs temporarily
3. **Network Issues**: Uses cached voices and local processing
4. **Service Outage**: Maintains full functionality with reduced features

## Google Gemini AI Integration

### Why Gemini?

- **Free Tier**: Generous free limits for development and testing
- **No Credit Card**: Get started immediately without payment info
- **Latest Technology**: Google's most advanced AI model
- **Multiple Capabilities**: Text generation, embeddings, reasoning

### API Limits and Usage

#### Free Tier Limits:
- **Rate Limit**: 60 requests per minute
- **Daily Limit**: 1,500 requests per day
- **Token Limit**: Up to 30,000 tokens per minute
- **Model Access**: Gemini Pro, Gemini Pro Vision, Embedding models

#### Usage Optimization:
- Implement request caching
- Use batch processing where possible
- Monitor usage in Google AI Studio
- Implement exponential backoff for rate limits

### Supported Models

1. **Gemini Pro**: Advanced text generation and reasoning
2. **Gemini Pro Vision**: Image and text understanding
3. **Embedding-001**: Text embeddings for semantic search

### Code Examples

#### Basic Text Generation:
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

const result = await model.generateContent('Your prompt here');
console.log(result.response.text());
```

#### Embeddings:
```typescript
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent?key=${apiKey}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'models/embedding-001',
      content: { parts: [{ text: 'Your text here' }] }
    })
  }
);
```

## UX Pilot Integration

### What is UX Pilot?

UX Pilot is an AI-powered interface design system that enables drag-and-drop creation of user interfaces with intelligent component suggestions and real-time code generation.

### Current Implementation Status

> **Note**: UX Pilot integration is planned for v2.0. Current implementation includes the foundation architecture and placeholder components.

### Enabling UX Pilot (Future Release)

1. **Install UX Pilot SDK**
   ```bash
   npm install @uxpilot/react @uxpilot/core
   ```

2. **Configure UX Pilot**
   ```typescript
   // src/config/uxpilot.ts
   import { UXPilot } from '@uxpilot/react';
   
   export const uxPilotConfig = {
     apiKey: process.env.VITE_UXPILOT_API_KEY,
     theme: 'multiagent-platform',
     components: ['forms', 'dashboards', 'workflows']
   };
   ```

3. **Enable in Environment**
   ```bash
   VITE_UXPILOT_ENABLED=true
   VITE_UXPILOT_API_KEY=your_uxpilot_api_key
   ```

### Usage Guide (Planned)

#### Basic Interface Creation
```typescript
import { UXPilotBuilder } from '@uxpilot/react';

function InterfaceBuilder() {
  return (
    <UXPilotBuilder
      onSave={(design) => generateCode(design)}
      templates={['agent-dashboard', 'workflow-builder']}
      constraints={{
        framework: selectedFramework,
        agentCount: agents.length
      }}
    />
  );
}
```

#### Advanced Workflow Integration
```typescript
// Generate workflow-specific interfaces
const workflowInterface = await uxPilot.generateInterface({
  type: 'workflow',
  agents: selectedAgents,
  complexity: 'advanced',
  style: 'modern-dashboard'
});
```

### Best Practices (Planned)

1. **Component Reusability**
   - Use UX Pilot's component library
   - Create custom components for agent-specific needs
   - Maintain design system consistency

2. **Performance Optimization**
   - Lazy load UX Pilot components
   - Cache generated interfaces
   - Optimize for mobile devices

3. **Accessibility**
   - Ensure WCAG 2.1 AA compliance
   - Test with screen readers
   - Provide keyboard navigation

## Future Roadmap

### Planned Agent Platform Integrations

We're committed to expanding platform support based on community needs and industry adoption:

#### Q2 2024
- **LangChain Integration**
  - Full LangChain agent support
  - Custom chain builder
  - Memory management tools

- **Haystack Framework**
  - Document processing agents
  - RAG pipeline builder
  - Search optimization tools

#### Q3 2024
- **Microsoft Semantic Kernel**
  - .NET agent support
  - Azure integration
  - Enterprise features

- **Gemini Pro Vision**
  - Image processing agents
  - Multimodal workflows
  - Visual content analysis

#### Q4 2024
- **Custom Framework Support**
  - Plugin architecture for custom frameworks
  - Template creation tools
  - Community marketplace

### Expected Timeline

| Quarter | Features | Status |
|---------|----------|--------|
| Q1 2024 | Core platform, CrewAI, AutoGen, Google ADK, Gemini AI, ElevenLabs | ✅ Complete |
| Q2 2024 | LangChain, Haystack, UX Pilot integration | 🔄 In Progress |
| Q3 2024 | Semantic Kernel, Gemini Pro Vision | 📋 Planned |
| Q4 2024 | Custom frameworks, marketplace | 📋 Planned |

### Contribution Guidelines for New Platforms

#### Adding a New Framework

1. **Create Framework Definition**
   ```typescript
   // src/frameworks/your-framework.ts
   export const yourFrameworkConfig = {
     id: 'your-framework',
     name: 'Your Framework',
     description: 'Framework description',
     codeTemplates: {
       agent: 'template string',
       workflow: 'template string'
     }
   };
   ```

2. **Add Code Generator**
   ```typescript
   // src/services/generators/yourFrameworkGenerator.ts
   export class YourFrameworkGenerator {
     generateProject(config: ProjectConfig): GeneratedProject {
       // Implementation
     }
   }
   ```

3. **Update Framework Registry**
   ```typescript
   // src/config/frameworks.ts
   import { yourFrameworkConfig } from '../frameworks/your-framework';
   
   export const supportedFrameworks = [
     // existing frameworks
     yourFrameworkConfig
   ];
   ```

#### Testing Requirements

```bash
# Test framework integration
npm run test:framework your-framework

# Test code generation
npm run test:codegen your-framework

# Test deployment package
npm run test:package your-framework
```

### How to Request New Platform Integrations

1. **GitHub Issues**
   - Use the "Framework Request" template
   - Provide framework documentation links
   - Include use case examples

2. **Community Discussion**
   - Join our [Discord community](https://discord.gg/multiagent-platform)
   - Participate in monthly framework discussions
   - Vote on priority frameworks

3. **Contribution Process**
   - Fork the repository
   - Implement framework support
   - Submit pull request with tests
   - Participate in code review

## Troubleshooting

### Common Issues and Solutions

#### Installation Issues

**Problem**: `npm install` fails with dependency conflicts
```bash
# Solution: Clear cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**Problem**: TypeScript compilation errors
```bash
# Solution: Update TypeScript and regenerate types
npm update typescript
npm run type-check
```

#### Development Issues

**Problem**: Hot reload not working
```bash
# Solution: Check Vite configuration
# Ensure vite.config.ts has proper HMR settings
export default defineConfig({
  server: {
    hmr: true,
    port: 5173
  }
});
```

**Problem**: Environment variables not loading
```bash
# Solution: Verify .env file format
# Ensure variables start with VITE_
# Restart development server after changes
```

#### API Issues

**Problem**: Gemini API rate limit exceeded
```bash
# Solution: Implement rate limiting and caching
# Check usage in Google AI Studio
# Implement exponential backoff
```

**Problem**: ElevenLabs API errors
```bash
# Solution: Verify API key and quota
# Check ElevenLabs dashboard for usage
# System automatically falls back to browser speech recognition
```

**Problem**: GitHub API rate limit exceeded
```bash
# Solution: Use authenticated requests
# Add VITE_GITHUB_TOKEN to .env
# Implement request caching
```

#### Deployment Issues

**Problem**: Netlify build fails
```bash
# Solution: Check build logs
# Verify environment variables in Netlify dashboard
# Ensure all dependencies are in package.json
```

**Problem**: Functions not working
```bash
# Solution: Check function logs in Netlify
# Verify function syntax and exports
# Test functions locally with netlify dev
```

#### Voice Input Issues

**Problem**: ElevenLabs not working
```bash
# Solution: Check API key in .env file
# Verify account has available credits
# System falls back to browser speech recognition
```

**Problem**: Microphone not accessible
```bash
# Solution: Check browser permissions
# Ensure HTTPS in production
# Test with different browsers
```

### Getting Support

#### Community Support
- **Discord**: [Join our community](https://discord.gg/multiagent-platform)
- **GitHub Discussions**: [Ask questions](https://github.com/your-org/multiagent-platform/discussions)
- **Stack Overflow**: Tag questions with `multiagent-platform`

#### Documentation
- **API Reference**: [docs.multiagent-platform.com/api](https://docs.multiagent-platform.com/api)
- **Tutorials**: [docs.multiagent-platform.com/tutorials](https://docs.multiagent-platform.com/tutorials)
- **Examples**: [github.com/your-org/multiagent-examples](https://github.com/your-org/multiagent-examples)

#### Professional Support
- **Enterprise Support**: Contact enterprise@multiagent-platform.com
- **Custom Development**: Contact consulting@multiagent-platform.com
- **Training**: Contact training@multiagent-platform.com

## Contributing

We welcome contributions from the community! Please read our contribution guidelines before submitting pull requests.

### Guidelines for Contributors

#### Code Style Requirements

1. **TypeScript Standards**
   ```typescript
   // Use strict typing
   interface AgentConfig {
     id: string;
     name: string;
     capabilities: string[];
   }
   
   // Prefer interfaces over types for objects
   // Use meaningful variable names
   // Add JSDoc comments for public APIs
   ```

2. **React Best Practices**
   ```typescript
   // Use functional components with hooks
   // Implement proper error boundaries
   // Follow React naming conventions
   // Use memo for performance optimization
   ```

3. **Styling Guidelines**
   ```css
   /* Use Tailwind CSS classes */
   /* Follow mobile-first responsive design */
   /* Maintain consistent spacing (8px grid) */
   /* Use semantic color names */
   ```

#### Testing Requirements

1. **Unit Tests**
   ```bash
   # Test all utility functions
   npm run test:unit
   
   # Test React components
   npm run test:components
   ```

2. **Integration Tests**
   ```bash
   # Test API integrations
   npm run test:integration
   
   # Test framework generators
   npm run test:generators
   ```

3. **E2E Tests**
   ```bash
   # Test complete user workflows
   npm run test:e2e
   ```

#### Pull Request Process

1. **Before Submitting**
   ```bash
   # Run all checks
   npm run lint
   npm run type-check
   npm run test
   npm run build
   ```

2. **PR Requirements**
   - Clear description of changes
   - Link to related issues
   - Screenshots for UI changes
   - Updated documentation
   - Passing CI/CD checks

3. **Review Process**
   - Code review by maintainers
   - Testing on multiple browsers
   - Performance impact assessment
   - Security review for sensitive changes

### Development Setup for Contributors

```bash
# Fork and clone the repository
git clone https://github.com/your-username/multiagent-platform.git
cd multiagent-platform

# Add upstream remote
git remote add upstream https://github.com/your-org/multiagent-platform.git

# Create feature branch
git checkout -b feature/your-feature-name

# Install dependencies
npm install

# Start development
npm run dev

# Make changes and test
npm run test

# Commit changes
git commit -m "feat: add your feature"

# Push to your fork
git push origin feature/your-feature-name

# Create pull request
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### MIT License Summary

- ✅ Commercial use
- ✅ Modification
- ✅ Distribution
- ✅ Private use
- ❌ Liability
- ❌ Warranty

### Third-Party Licenses

This project uses several open-source libraries. See [THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md) for complete license information.

---

## Acknowledgments

- **Bolt.new** - For providing the development platform
- **Google Gemini** - For free AI API access and advanced capabilities
- **ElevenLabs** - For cutting-edge voice AI technology
- **CrewAI Team** - For the innovative multiagent framework
- **Microsoft AutoGen** - For conversational AI capabilities
- **Google** - For the Agent Development Kit
- **Supabase** - For the database infrastructure
- **Community Contributors** - For ongoing improvements and feedback

---

**Built with ❤️ by the Multiagent Platform Team**

*Powered by Google Gemini AI and ElevenLabs Voice Technology*

For more information, visit our [website](https://multiagent-platform.com) or follow us on [Twitter](https://twitter.com/multiagent_platform).