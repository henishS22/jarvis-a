# JARVIS AI System

## Overview

JARVIS is a sophisticated AI system built with a scalable microservices architecture featuring an orchestrator service that routes user queries to specialized AI agents. The system leverages both OpenAI and Anthropic language models to provide intelligent responses across different domains like recruitment and content generation. The architecture now includes comprehensive chat history management, session tracking for guest users, and performance analytics for AI agent optimization.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Microservices Design
The system follows a distributed microservices pattern with two core services:

**JARVIS Orchestrator (Port 5000)**
- Central coordination hub that receives user queries
- Performs NLP analysis using OpenAI's GPT-4o model
- Routes tasks to appropriate agents based on intent classification
- Aggregates responses from multiple agents
- Provides a web interface for user interaction

**AI Agent Processor (Port 8000)**
- Specialized service for executing AI agent tasks
- Supports multiple agent types: recruitment_agent, crm_agent, content_agent, project_agent, treasury_agent, general_assistant
- Handles both OpenAI and Anthropic model integrations
- Implements intelligent model selection based on agent type and query characteristics

### Request Flow Architecture
1. User submits query through web interface or API
2. Orchestrator analyzes query using NLP service (intent classification, entity extraction, sentiment analysis)
3. Task router determines routing strategy (single vs parallel agent execution)
4. Agent communicator sends requests to AI Agent Processor
5. AI Agent Processor selects optimal AI service (OpenAI/Anthropic) and model
6. Results are aggregated and returned to user

### Technology Stack
- **Backend**: Express.js with TypeScript for both services
- **AI Integration**: OpenAI SDK and Anthropic SDK
- **Validation**: Joi for request validation
- **Logging**: Winston with structured JSON logging
- **Development**: Nodemon and ts-node for hot reloading

### Data Flow and Communication
Inter-service communication uses HTTP REST APIs with structured request/response types defined in shared TypeScript interfaces. The system implements comprehensive error handling, request tracking via unique request IDs, and performance monitoring with processing time measurements.

### Agent Intelligence
The system implements sophisticated agent selection logic that considers:
- Agent type capabilities and specializations
- Query complexity and content analysis
- Available AI service APIs (OpenAI/Anthropic)
- Model-specific strengths for different tasks

## External Dependencies

### AI Service Providers
- **OpenAI API**: Primary AI service using GPT-4o model for chat completions and NLP analysis
- **Anthropic API**: Secondary AI service using Claude models for specialized tasks

### Development and Runtime
- **Node.js Runtime**: TypeScript execution environment
- **NPM Ecosystem**: Package management for all dependencies
- **Environment Configuration**: dotenv for API key and service configuration management

### Third-party Libraries
- **Express.js**: Web framework for REST API endpoints
- **Axios**: HTTP client for inter-service communication
- **Joi**: Schema validation for request/response data
- **Winston**: Structured logging with file and console outputs
- **CORS**: Cross-origin request handling for web interface

The system is designed to be highly modular and scalable, with clear separation of concerns between orchestration logic and AI processing capabilities.

## Recent Changes - Scalable Chat History Architecture (August 2025)

### New Database Schema
- **chat_sessions**: Session management for guest users with optimized indexing
- **chat_messages**: Message history with partitioning for scale
- **agent_performance_logs**: Performance analytics for AI agent optimization

### Enhanced Features
- **Guest Session Management**: Automatic session and user ID generation for seamless guest experience
- **Session Persistence**: Browser localStorage integration for session continuity
- **Performance Analytics**: Comprehensive tracking of AI agent performance metrics
- **Scalable Database Design**: Optimized indexes and partitioning for thousands of concurrent users
- **Context-Aware AI**: Conversation history integration for contextual responses

### Database Performance Optimizations
- Smart indexing for fast context retrieval (session_id, created_at DESC)
- Partitioned tables for efficient data management at scale
- Connection pooling for high concurrency support
- Performance monitoring with slow query detection

### Chat History UI/UX Improvements (August 8, 2025)
- **Fixed Empty History Display**: Removed static content when no chat history exists
- **Improved Message Loading**: Enhanced message parsing and display when switching conversations
- **Correct Message Ordering**: Messages now display in proper chronological order
- **Enhanced Session Switching**: Better active session highlighting and validation
- **Robust SQL Parsing**: Improved backend parsing of PostgreSQL query results
- **UUID Validation**: Added proper session ID format validation
- **Error Handling**: Better error messages and fallback behavior for failed loads

### Key Scalability Features Implemented
1. **Database Partitioning** - Messages partitioned by date for better performance
2. **Smart Indexing** - Optimized indexes for common query patterns  
3. **Connection Pooling** - Handle thousands of concurrent requests
4. **Efficient Context Retrieval** - Only fetch recent relevant messages
5. **Performance Analytics** - Track every request for optimization insights
6. **Batch Operations** - Efficient database writes
7. **Error Tracking** - Comprehensive error logging and analysis
8. **Session Management** - Guest-friendly chat persistence without signup requirements
9. **Improved Frontend UX** - Fixed chat history display and message loading issues