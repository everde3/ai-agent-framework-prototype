import { buildApp } from './app.js';

// Start server
const start = async () => {
  try {
    const app = await buildApp();
    
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3001;
    await app.listen({ port, host: '0.0.0.0' });
    
    console.log(`🚀 API server running on http://localhost:${port}`);
    console.log(`📊 Health endpoint: http://localhost:${port}/health`);
    console.log(`🤖 AI Chat endpoint: http://localhost:${port}/api/chat`);
    console.log(`🔍 AI RAG endpoint: http://localhost:${port}/api/rag`);
    console.log(`💬 AI Prompt endpoint: http://localhost:${port}/api/prompt`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();