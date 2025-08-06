# JARVIS AI Microservices Architecture

A scalable microservices architecture for AI agent orchestration with OpenAI and Anthropic integration, designed for enterprise-level multi-agent AI systems.

## Architecture Overview

This system implements the JARVIS AI architecture with two core microservices:

### 1. JARVIS Orchestrator Service (Port 5000)
- **Purpose**: Central orchestration and task routing
- **Responsibilities**:
  - NLP analysis of user queries
  - Intent recognition and entity extraction
  - Agent selection and task routing
  - Inter-service communication management
  - Fallback handling and error recovery

### 2. AI Agent Processor Service (Port 8000)
- **Purpose**: AI model integration and agent processing
- **Responsibilities**:
  - OpenAI and Anthropic API integration
  - Agent-specific prompt engineering
  - Model selection optimization
  - Response processing and formatting

## Features

### Core Capabilities
- ✅ **Multi-Agent Support**: Recruitment, CRM, Content, Project, Treasury, and General agents
- ✅ **Dual AI Integration**: OpenAI GPT-4o and Anthropic Claude Sonnet 4 models
- ✅ **Intelligent Routing**: Automatic agent selection based on query analysis
- ✅ **Scalable Architecture**: Independent microservices with RESTful APIs
- ✅ **Error Handling**: Comprehensive error handling with fallback mechanisms
- ✅ **Structured Logging**: Detailed logging with Winston for monitoring
- ✅ **Type Safety**: Full TypeScript implementation
- ✅ **Request Validation**: Joi-based input validation

### Agent Types and Capabilities

| Agent Type | Capabilities | Maturity Level | Best Use Cases |
|------------|--------------|----------------|----------------|
| **Recruitment Agent** | Resume processing, candidate scoring, interview scheduling | M2 | HR tasks, talent acquisition |
| **CRM Agent** | Lead management, sales optimization, customer insights | M3 | Sales processes, customer relations |
| **Content Agent** | Text generation, content optimization, multi-language | M4 | Marketing, documentation, creative writing |
| **Project Agent** | Task scheduling, resource allocation, progress tracking | M2 | Project management, planning |
| **Treasury Agent** | Payment processing, financial analysis, compliance | M3 | Financial operations, accounting |
| **General Assistant** | General query processing, basic NLP, error handling | M2 | Fallback processing, general queries |

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm 8+
- OpenAI API Key
- Anthropic API Key

### Installation

1. **Clone and Install Dependencies**
```bash
# Install dependencies
npm install
