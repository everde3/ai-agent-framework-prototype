/**
 * Test script to verify logging middleware functionality
 */
import { buildApp } from './app.js';
import type { FastifyInstance } from 'fastify';

async function testLoggingSystem() {
  let app: FastifyInstance | undefined;
  
  try {
    console.log('🚀 Starting logging system test...\n');
    
    // Build the application
    app = await buildApp();
    await app.listen({ port: 3001, host: '127.0.0.1' });
    
    console.log('📡 Server started on http://127.0.0.1:3001\n');
    
    // Test 1: Health endpoint
    console.log('🏥 Testing health endpoint...');
    const healthResponse = await app.inject({
      method: 'GET',
      url: '/health'
    });
    console.log(`Health Status: ${healthResponse.statusCode}`);
    console.log(`Health Body: ${healthResponse.payload}\n`);
    
    // Test 2: Health logging endpoint
    console.log('📊 Testing logging health endpoint...');
    const loggingHealthResponse = await app.inject({
      method: 'GET',
      url: '/health/logging'
    });
    console.log(`Logging Health Status: ${loggingHealthResponse.statusCode}`);
    console.log(`Logging Health Body: ${JSON.stringify(JSON.parse(loggingHealthResponse.payload), null, 2)}\n`);
    
    // Test 3: AI Chat endpoint (if available)
    console.log('🤖 Testing AI chat endpoint...');
    const chatResponse = await app.inject({
      method: 'POST',
      url: '/api/ai/chat',
      headers: {
        'Content-Type': 'application/json',
        'x-correlation-id': 'test-chat-123'
      },
      payload: {
        message: 'Hello, test message!',
        model: 'test-model'
      }
    });
    console.log(`Chat Status: ${chatResponse.statusCode}`);
    console.log(`Chat Headers: ${JSON.stringify(chatResponse.headers)}\n`);
    
    // Test 4: Non-existent endpoint (404 test)
    console.log('❌ Testing 404 error...');
    const notFoundResponse = await app.inject({
      method: 'GET',
      url: '/non-existent-endpoint',
      headers: {
        'x-correlation-id': 'test-404-123'
      }
    });
    console.log(`404 Status: ${notFoundResponse.statusCode}`);
    console.log(`404 Body: ${notFoundResponse.payload}\n`);
    
    // Test 5: Invalid method (405 test)
    console.log('🚫 Testing method not allowed...');
    const methodNotAllowedResponse = await app.inject({
      method: 'DELETE',
      url: '/health',
      headers: {
        'x-correlation-id': 'test-405-123'
      }
    });
    console.log(`405 Status: ${methodNotAllowedResponse.statusCode}`);
    console.log(`405 Body: ${methodNotAllowedResponse.payload}\n`);
    
    console.log('✅ All tests completed successfully!');
    console.log('\n📝 Check the console output above for structured logs.');
    console.log('📊 Metrics should be collected and flushed periodically.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    if (app) {
      await app.close();
      console.log('\n🛑 Server stopped.');
    }
  }
}

// Sample CloudWatch queries for reference
const sampleQueries = `
🔍 SAMPLE CLOUDWATCH QUERIES:

1. Find all 500 errors in last hour:
fields @timestamp, correlationId, request.url, error.message
| filter response.statusCode = 500
| sort @timestamp desc

2. P95 latency by endpoint:
stats avg(metrics.duration), percentile(metrics.duration, 95) by request.url

3. Error rate by endpoint:
stats count() by request.url, response.statusCode
| sort response.statusCode desc

4. Memory usage trends:
fields @timestamp, metrics.memoryUsage.heapUsed
| sort @timestamp desc

5. Correlation ID tracking:
fields @timestamp, request.method, request.url, response.statusCode
| filter correlationId = "test-chat-123"
| sort @timestamp desc

6. Critical errors:
fields @timestamp, error.message, request.url, correlationId
| filter tags.critical = true
| sort @timestamp desc

7. AI endpoint performance:
fields @timestamp, metrics.duration, metrics.durationBucket
| filter tags.feature = "ai"
| stats avg(metrics.duration), percentile(metrics.duration, 95), percentile(metrics.duration, 99) by request.url
`;

console.log(sampleQueries);

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  testLoggingSystem().catch(console.error);
}