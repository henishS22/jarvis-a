# Overview

The JARVIS AI system is a scalable microservices architecture designed for enterprise-level multi-agent AI orchestration using function-based programming paradigm. It implements a two-service architecture where the JARVIS Orchestrator Service handles query analysis, intent recognition, and task routing, while the AI Agent Processor Service manages AI model integrations and agent-specific processing. The system supports six specialized agents (Recruitment, CRM, Content, Project, Treasury, and General Assistant) with dual AI provider support for OpenAI GPT-4o and Anthropic Claude Sonnet 4.

## Recent Changes (August 7, 2025)
- **Complete Feature Elimination**: Removed complexity, priority, confidence, language, improvements, seo_recommendations, and tone_analysis completely from entire codebase
  - Updated all TypeScript interfaces and class definitions to remove eliminated features
  - Simplified NLPAnalysis interface to only include: intent, entities, sentiment, timestamp
  - Removed confidence scoring from QueryIntent and ServiceSelection interfaces
  - Eliminated priority system from AgentSelection and TaskContext
  - Removed maturityLevel and estimatedProcessingTime from all agent processing
  - Fixed all TypeScript compilation errors across both microservices

- **Streamlined AI-Powered NLP Integration**: Only 3 core functions remain
  - extractIntent: AI classifies queries into recruitment vs content_generation categories
  - extractEntities: AI extracts people, skills, companies, dates, currencies, etc.
  - analyzeSentiment: AI analyzes emotional tone (positive/neutral/negative)

- **Simplified Two-Agent System**: Focused on business-critical agents only
  - Content Generation Agent: Writing, marketing, documentation, creative content
  - Recruitment Agent: Resume processing, candidate evaluation, interview questions
  - Intelligent cross-agent fallbacks for enhanced reliability

- **Smart AI Service Selection**: 
  - Recruitment tasks use OpenAI GPT-4o for structured analysis
  - Content tasks use Anthropic Claude Sonnet 4 for superior writing quality
  - Graceful fallbacks when API quotas are exceeded

- **Enhanced Error Handling**: Robust fallback mechanisms ensure system reliability even when AI services are unavailable

- **Fixed Development Environment**: Resolved TypeScript compilation and port conflicts
  - Both JARVIS Orchestrator and AI Agent Processor services now running successfully
  - Development mode uses ports 5001/8001, production uses 5000/8000

# User Preferences

Preferred communication style: Simple, everyday language.
Architecture preference: Complete function-based programming paradigm implementation completed.

# System Architecture

## Core Services Architecture

The system follows a microservices pattern with two primary services:

**JARVIS Orchestrator Service (Port 5000)**
- Acts as the central orchestration hub for all user requests
- Implements NLP analysis for query understanding and intent extraction
- Provides intelligent task routing based on query analysis and context
- Manages inter-service communication and fallback mechanisms
- Handles request validation using Joi schemas

**AI Agent Processor Service (Port 8000)**
- Integrates with multiple AI providers (OpenAI and Anthropic)
- Implements agent-specific prompt engineering and processing
- Provides dynamic model selection based on agent type and query characteristics
- Handles AI service failover and error recovery

## Request Processing Flow

The architecture implements a sequential processing pipeline:
1. Request validation and NLP analysis in the Orchestrator
2. Intent recognition and entity extraction
3. Agent selection and routing decision
4. Communication with AI Agent Processor
5. AI model selection and query processing
6. Response aggregation and formatting

## Agent Specialization System

Six specialized agents handle different business domains:
- **Recruitment Agent**: Resume processing, candidate evaluation, interview scheduling
- **CRM Agent**: Lead management, sales optimization, customer insights  
- **Content Agent**: Text generation, content optimization, multi-language support
- **Project Agent**: Task scheduling, resource allocation, progress tracking
- **Treasury Agent**: Payment processing, financial analysis, compliance
- **General Assistant**: Fallback processing for unclassified queries

Each agent has defined maturity levels (M1-M5) and specific capabilities that influence routing decisions.

## AI Provider Integration

The system implements a dual-provider approach for AI services:
- **OpenAI Integration**: Primary model is GPT-4o with JSON response formatting
- **Anthropic Integration**: Uses Claude Sonnet 4 (claude-sonnet-4-20250514) for complex reasoning tasks
- **Dynamic Selection**: Agent selector chooses optimal AI service based on agent type, query complexity, and provider availability

## Error Handling and Resilience

Comprehensive error handling includes:
- Multi-level validation using Joi schemas
- Service health monitoring and availability checks  
- Fallback agent selection for failed routing
- Request timeout management and retry logic
- Structured error responses with detailed context

## Logging and Monitoring

Winston-based logging system provides:
- Structured JSON logging with timestamps and request IDs
- Service-specific log formatting and metadata
- File-based log rotation with size limits
- Console output for development environments
- Error tracking with stack traces

# External Dependencies

## AI Service Providers
- **OpenAI API**: GPT-4o model for text generation and analysis
- **Anthropic API**: Claude Sonnet 4 for advanced reasoning tasks

## Core Node.js Dependencies
- **Express.js**: Web server framework for RESTful API endpoints
- **TypeScript**: Static type checking and enhanced development experience
- **Axios**: HTTP client for inter-service communication
- **Winston**: Structured logging and monitoring
- **Joi**: Request validation and schema enforcement
- **CORS**: Cross-origin resource sharing middleware
- **dotenv**: Environment variable management

## Development Tools
- **ts-node**: TypeScript execution for development
- **nodemon**: Automatic server restart during development

## Configuration Requirements
- Environment variables for API keys (OPENAI_API_KEY, ANTHROPIC_API_KEY)
- Service URLs for inter-service communication
- Logging levels and file rotation settings
- Request timeout and retry configurations