const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// In-memory storage for demo (use actual ChromaDB in production)
let vectorStore = new Map();
let embeddingCounter = 0;

const handler = async (event, context) => {
  try {
    const { httpMethod, path, body, queryStringParameters } = event;
    
    if (httpMethod === 'OPTIONS') {
      return { statusCode: 200, headers: corsHeaders, body: '' };
    }
    
    // Extract endpoint from path
    const pathParts = path.split('/');
    const endpoint = pathParts[pathParts.length - 1];
    
    console.log(`Vector store endpoint: ${endpoint}, method: ${httpMethod}`);
    
    switch (endpoint) {
      case 'store':
        return await handleStore(httpMethod, body);
      case 'search':
        return await handleSearch(httpMethod, queryStringParameters);
      case 'embed':
        return await handleEmbed(httpMethod, body);
      case 'health':
        return await handleHealth();
      default:
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Endpoint not found', path, endpoint }),
        };
    }
    
  } catch (error) {
    console.error('Vector store error:', error);
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
    };
  }
};

async function handleStore(httpMethod, body) {
  if (httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }
  
  try {
    const { embeddings } = JSON.parse(body || '{}');
    
    if (!embeddings || !Array.isArray(embeddings)) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Invalid embeddings data' }),
      };
    }
    
    // Store embeddings (in production, use ChromaDB)
    for (const embedding of embeddings) {
      vectorStore.set(embedding.id, {
        ...embedding,
        stored_at: new Date().toISOString(),
      });
    }
    
    console.log(`Stored ${embeddings.length} embeddings`);
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ 
        message: `Stored ${embeddings.length} embeddings`,
        count: embeddings.length 
      }),
    };
  } catch (error) {
    console.error('Store error:', error);
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Invalid JSON in request body' }),
    };
  }
}

async function handleSearch(httpMethod, queryStringParameters) {
  if (httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }
  
  const { query, framework, limit = '10' } = queryStringParameters || {};
  
  if (!query) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Query parameter required' }),
    };
  }
  
  try {
    // Generate embedding for query (simplified)
    const queryEmbedding = await generateSimpleEmbedding(query);
    
    // Search similar embeddings (simplified cosine similarity)
    const results = [];
    const maxResults = parseInt(limit);
    
    for (const [id, stored] of vectorStore.entries()) {
      if (framework && stored.framework !== framework) continue;
      
      const similarity = calculateCosineSimilarity(queryEmbedding, stored.embedding);
      
      results.push({
        id,
        score: similarity,
        metadata: stored.metadata,
      });
    }
    
    // Sort by similarity and limit results
    results.sort((a, b) => b.score - a.score);
    const matches = results.slice(0, maxResults);
    
    console.log(`Search for "${query}" returned ${matches.length} results`);
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ 
        matches,
        total: results.length,
        query,
      }),
    };
  } catch (error) {
    console.error('Search error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Search failed', message: error.message }),
    };
  }
}

async function handleEmbed(httpMethod, body) {
  if (httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }
  
  try {
    const { text } = JSON.parse(body || '{}');
    
    if (!text) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Text parameter required' }),
      };
    }
    
    // Generate embedding (simplified - in production use OpenAI or similar)
    const embedding = await generateSimpleEmbedding(text);
    
    console.log(`Generated embedding for text: "${text.substring(0, 50)}..."`);
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ 
        embedding,
        dimensions: embedding.length,
      }),
    };
  } catch (error) {
    console.error('Embed error:', error);
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Invalid JSON in request body' }),
    };
  }
}

async function handleHealth() {
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({ 
      status: 'healthy',
      vectorCount: vectorStore.size,
      timestamp: new Date().toISOString(),
      service: 'vector-store',
      version: '1.0.0',
    }),
  };
}

// Simplified embedding generation (use actual embedding service in production)
async function generateSimpleEmbedding(text) {
  // This is a very simplified embedding generation
  // In production, use OpenAI embeddings API or similar
  const words = text.toLowerCase().split(/\s+/);
  const embedding = new Array(384).fill(0); // 384-dimensional vector
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const hash = simpleHash(word);
    
    for (let j = 0; j < embedding.length; j++) {
      embedding[j] += Math.sin(hash + j) * 0.1;
    }
  }
  
  // Normalize the vector
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return magnitude > 0 ? embedding.map(val => val / magnitude) : embedding;
}

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash;
}

function calculateCosineSimilarity(vecA, vecB) {
  if (vecA.length !== vecB.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator > 0 ? dotProduct / denominator : 0;
}

module.exports = { handler };