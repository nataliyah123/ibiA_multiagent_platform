
# Prompt 1:-

"Create a production-ready full-stack application that automates multiagent system development with the following specifications:

### **Core Features**

1. Framework Support  
   * Support CrewAI, Google ADK, and AutoGen with code generation templates   
   * Implement RAG system that:  
     * Periodically scrapes GitHub repositories (stars \> 100\) and documentation   
     * Stores framework-specific code in /data/{framework} folders   
     * Uses ChromaDB for vector storage of latest code snippets   
2. User Input System  
   * Dual Input Modes:  
     a) ElevenLabs-powered conversational AI for voice specifications   
   *  b) Dynamic form with conditional fields for agent count/workflow   
   * Collect:  
     * Number of agents and roles  
     * Workflow diagram (export as Mermaid)  
     * Framework selection (with comparison matrix)  
3. Frontend Builder  
   * Integrate UX Pilot for drag-and-drop interface design   
   * Generate full-stack code based on user specifications  
   * Bolt Badge Integration:  
     * Add clickable Bolt.new badge in top-right corner of all pages   
     * Use white-circle variant for dark backgrounds, black-circle for light backgrounds   
     * Hyperlink badge to [https://bolt.new/](https://bolt.new/)  
     * Implement responsive scaling for different screen sizes  
4. Deployment & Portability  
   * Frontend: Deploy to Netlify (35M+ sites use platform)   
   * Backend: Host on free tier cloud service (e.g., Railway.app)  
   * Add 'Download Project' button that packages:  
     * Framework-specific code from /data/{framework}  
     * Generated frontend/backend code  
     * Configuration files (netlify.toml, Dockerfile)

### **Technical Implementation**

1. Scraping & RAG  
   * Use Playwright for GitHub scraping with delta updates   
   * Update scraped data every 7 days automatically   
   * Prioritize local scraped data over LLM knowledge   
2. Data Management  
   * Store scraped data in client-side IndexedDB with Brotli compression   
   * The base folder for data should be named data and the scraped data should be saved in its own folder like google-adk, crewai, autogen  
   *  Implement LRU cache with 500MB max size   
3. Security  
   * Encrypt API keys using Web Crypto API  
   * Sanitize downloaded code (remove credentials)

### **Output Requirements**

Generate complete project with:

* netlify.toml configuration   
* Serverless function templates  
* Download system with ZIP validation  
* Framework comparison matrix in UI  
* Bolt Badge Implementation:  
  * Include all badge variations (PNG/SVG/WEBP) in /public/bolt-badge  
  * Add conditional rendering logic for background-aware badge display  
  * Implement accessibility features (alt text, ARIA labels)  
* Error handling for GitHub API rate limits 

Prioritize production-ready code with modern ES6+ features and comprehensive logging."

# Prompt 2:-

### Data Management  
- **Server-Side Storage**:  
  * Use free-tier PostgreSQL (e.g., Supabase)  to store scraped data in framework-specific tables/collections.  
  * Apply Brotli compression to raw scraped HTML before storage.  
- **Client-Side Caching**:  
  * Implement IndexedDB with LRU cache (500MB max) for temporary storage of recent user queries.  
- **Vector Database**:  
  * Host ChromaDB/FAISS on the backend server to serve embeddings from the centralized database.  

