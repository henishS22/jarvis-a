import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { processWithAgent } from './controllers/agentController';
import { logger } from './utils/logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    requestId: req.get('X-Request-ID'),
    timestamp: new Date().toISOString()
  });
  next();
});

// Health check endpoints
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'ai-agent-processor',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'ai-agent-processor',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    availableModels: {
      openai: process.env.OPENAI_API_KEY ? 'configured' : 'not_configured',
      anthropic: process.env.ANTHROPIC_API_KEY ? 'configured' : 'not_configured'
    }
  });
});

// Available agents endpoint
app.get('/api/v1/agents', (req, res) => {
  res.json({
    agents: [
      'recruitment_agent',
      'crm_agent',
      'content_agent',
      'project_agent',
      'treasury_agent',
      'general_assistant'
    ],
    capabilities: {
      recruitment_agent: ['resume_processing', 'candidate_scoring', 'interview_scheduling'],
      crm_agent: ['lead_management', 'sales_optimization', 'customer_insights'],
      content_agent: ['text_generation', 'content_optimization', 'multi_language'],
      project_agent: ['task_scheduling', 'resource_allocation', 'progress_tracking'],
      treasury_agent: ['payment_processing', 'financial_analysis', 'compliance_check'],
      general_assistant: ['general_query_processing', 'basic_nlp', 'error_handling']
    }
  });
});

// Main agent processing endpoint
app.post('/api/v1/process', processWithAgent);

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred during agent processing',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    },
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found`
    },
    timestamp: new Date().toISOString()
  });
});

app.listen(Number(PORT), '0.0.0.0', () => {
  logger.info(`AI Agent Processor Service running on port ${PORT}`);
});

export default app;
