import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { orchestrate } from './controllers/orchestratorController';
import { logger } from './utils/logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    timestamp: new Date().toISOString()
  });
  next();
});

// Main web interface
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>JARVIS Multi-AI Agent System</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; padding: 2rem; }
        .container { max-width: 900px; margin: 0 auto; background: rgba(255,255,255,0.95); border-radius: 20px; padding: 2rem; box-shadow: 0 20px 40px rgba(0,0,0,0.1); }
        h1 { color: #2c3e50; text-align: center; margin-bottom: 2rem; font-size: 2.5rem; }
        .subtitle { text-align: center; color: #7f8c8d; margin-bottom: 3rem; font-size: 1.2rem; }
        .agent-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 3rem; }
        .agent-card { background: white; padding: 1.5rem; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); border-left: 5px solid #3498db; transition: transform 0.3s ease; }
        .agent-card:hover { transform: translateY(-5px); }
        .agent-card h3 { color: #2c3e50; margin-bottom: 0.5rem; }
        .agent-card p { color: #7f8c8d; font-size: 0.9rem; line-height: 1.4; }
        .demo-section { background: #f8f9fa; padding: 2rem; border-radius: 15px; margin-bottom: 2rem; }
        .demo-section h3 { color: #2c3e50; margin-bottom: 1rem; }
        .query-input { width: 100%; padding: 1rem; border: 2px solid #e1e8ed; border-radius: 10px; font-size: 1rem; margin-bottom: 1rem; }
        .query-button { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 1rem 2rem; border-radius: 10px; font-size: 1rem; cursor: pointer; transition: transform 0.3s ease; }
        .query-button:hover { transform: scale(1.05); }
        .response-area { background: #2c3e50; color: #ecf0f1; padding: 1rem; border-radius: 10px; margin-top: 1rem; font-family: 'Courier New', monospace; font-size: 0.9rem; white-space: pre-wrap; min-height: 200px; overflow-y: auto; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-top: 2rem; }
        .stat-card { background: white; padding: 1rem; border-radius: 10px; text-align: center; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
        .stat-number { font-size: 1.8rem; font-weight: bold; color: #3498db; }
        .stat-label { color: #7f8c8d; margin-top: 0.5rem; }
    </style>
</head>
<body>
    <div class="container">
        <h1>JARVIS Multi-AI Agent System</h1>
        <div class="subtitle">Enterprise-level AI orchestration with specialized agents for different business functions</div>
        
        <div class="agent-grid">
            <div class="agent-card">
                <h3>Recruitment Agent</h3>
                <p>Resume processing, candidate evaluation, interview scheduling, and talent acquisition optimization.</p>
            </div>
            <div class="agent-card">
                <h3>CRM Agent</h3>
                <p>Lead management, sales optimization, customer insights, and relationship management.</p>
            </div>
            <div class="agent-card">
                <h3>Content Agent</h3>
                <p>Text generation, content optimization, creative writing, and multi-language support.</p>
            </div>
            <div class="agent-card">
                <h3>Project Agent</h3>
                <p>Task scheduling, resource allocation, progress tracking, and project management.</p>
            </div>
            <div class="agent-card">
                <h3>Treasury Agent</h3>
                <p>Payment processing, financial analysis, compliance checks, and accounting tasks.</p>
            </div>
            <div class="agent-card">
                <h3>General Assistant</h3>
                <p>Fallback processing, general queries, basic NLP, and error handling.</p>
            </div>
        </div>
        
        <div class="demo-section">
            <h3>Try the JARVIS System</h3>
            <textarea class="query-input" id="queryInput" placeholder="Example: 'I need help analyzing a resume for a software engineering position' or 'Generate a marketing blog post about AI' or 'Help me manage leads in my CRM system'"></textarea>
            <button class="query-button" onclick="sendQuery()">Send Query to JARVIS</button>
            <div class="response-area" id="responseArea">Response will appear here...</div>
        </div>
        
        <div class="stats">
            <div class="stat-card">
                <div class="stat-number">6</div>
                <div class="stat-label">Specialized Agents</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">2</div>
                <div class="stat-label">AI Providers</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">100%</div>
                <div class="stat-label">Operational</div>
            </div>
        </div>
    </div>
    
    <script>
        async function sendQuery() {
            const query = document.getElementById('queryInput').value;
            const responseArea = document.getElementById('responseArea');
            
            if (!query.trim()) {
                responseArea.textContent = 'Please enter a query first.';
                return;
            }
            
            responseArea.textContent = 'Processing query with JARVIS...';
            
            try {
                const response = await fetch('/api/v1/orchestrate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        query: query,
                        context: { priority: 'medium', userId: 'web-user' }
                    })
                });
                
                const data = await response.json();
                responseArea.textContent = JSON.stringify(data, null, 2);
            } catch (error) {
                responseArea.textContent = 'Error: ' + error.message;
            }
        }
        
        document.getElementById('queryInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && e.ctrlKey) {
                sendQuery();
            }
        });
    </script>
</body>
</html>
  `);
});

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'jarvis-orchestrator',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Main orchestration endpoint
app.post('/api/v1/orchestrate', orchestrate);

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred during request processing',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

app.listen(Number(PORT), '0.0.0.0', () => {
  logger.info(`JARVIS Orchestrator Service running on port ${PORT}`);
});

export default app;
