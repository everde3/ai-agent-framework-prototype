# @repo/ai

## Purpose
AI-related utilities, prompts, model providers, and agent functionality for the AI demo application. Provides abstractions over various AI models and services.

## Contents
- **Prompt utilities** (`prompt`): Template management, prompt compilation, and prompt hashing
- **Model providers** (`providers`): Abstraction layer over different AI models (OpenAI, Claude, etc.)
- **Model registry** (`providers/model-registry`): Central registry for available AI models
- **Service actions** (`service-actions`): LLM logging, response caching, and AI operation tracking
- **Utilities** (`utils`): Token counting, message queuing, and AI-specific helpers
- **AI SDK exports**: Re-exports core functions from Vercel AI SDK

## Current Status
❌ Not currently used by apps (but contains comprehensive AI functionality)

## Future Use Cases
- **AI Agent creation**: Build conversational AI agents with different personalities and capabilities
- **Prompt management**: Template-based prompt generation with variable interpolation
- **Model switching**: Easy switching between different AI providers (OpenAI, Anthropic, etc.)
- **Response caching**: Cache AI responses to reduce costs and improve performance
- **Token tracking**: Monitor and control AI usage and costs
- **Streaming responses**: Real-time AI response streaming for chat interfaces

## Installation
```bash
pnpm add @repo/ai
```

## Usage Example
```typescript
import { generateText, streamText, createModelProvider } from '@repo/ai';
import type { ChatMessageDto } from '@repo/dtos';

// Generate a simple text response
const response = await generateText({
  model: 'gpt-4',
  prompt: 'Explain quantum computing in simple terms'
});

// Stream a response for real-time chat
const stream = await streamText({
  model: 'gpt-4',
  messages: [
    { role: 'user', content: 'Tell me a story' }
  ]
});

// Use custom model provider
const modelProvider = createModelProvider({
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY
});

// Generate with specific model configuration
const aiResponse = await modelProvider.generate({
  model: 'gpt-4',
  temperature: 0.7,
  maxTokens: 1000,
  prompt: 'Create a marketing plan for an AI startup'
});
```

## Architecture Notes
- **Provider abstraction**: Unified interface across different AI providers
- **Prompt templating**: Handlebars-based template system for dynamic prompts
- **Token management**: Built-in token counting and cost estimation
- **Response caching**: Intelligent caching based on prompt hashing
- **Streaming support**: Real-time response streaming for interactive experiences
- **Error handling**: Robust error handling for AI service failures
- **Logging and monitoring**: Comprehensive logging for AI operations and debugging

## Integration Points
- Uses `@repo/dtos` for type-safe AI request/response structures
- Uses `@repo/models` for database schema of AI-related data
- Integrates with various AI providers (OpenAI, Anthropic, AWS Bedrock)
- Supports both server-side and client-side AI operations