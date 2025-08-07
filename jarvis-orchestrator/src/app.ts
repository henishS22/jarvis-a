import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
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
    <title>JARVIS AI</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background: #1a1a1a;
            color: #ffffff;
            height: 100vh;
            overflow: hidden;
        }

        .chat-container {
            display: flex;
            flex-direction: column;
            height: 100vh;
            max-width: 768px;
            margin: 0 auto;
            position: relative;
        }

        .header {
            padding: 16px 20px;
            background: rgba(26, 26, 26, 0.95);
            border-bottom: 1px solid #333333;
            backdrop-filter: blur(10px);
            position: sticky;
            top: 0;
            z-index: 100;
        }

        .header h1 {
            font-size: 20px;
            font-weight: 600;
            color: #ffffff;
            text-align: center;
            background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .messages-container {
            flex: 1;
            overflow-y: auto;
            padding: 0 20px;
            scroll-behavior: smooth;
        }

        .welcome-screen {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            height: 100%;
            text-align: center;
            padding: 40px 20px;
        }

        .welcome-icon {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 24px;
            font-size: 32px;
        }

        .welcome-title {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 16px;
            background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .welcome-subtitle {
            font-size: 18px;
            color: #a0a0a0;
            margin-bottom: 32px;
            line-height: 1.5;
        }

        .agent-pills {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            justify-content: center;
            margin-bottom: 40px;
        }

        .agent-pill {
            background: rgba(0, 212, 255, 0.1);
            border: 1px solid rgba(0, 212, 255, 0.3);
            color: #00d4ff;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 500;
        }

        .message {
            margin: 24px 0;
            display: flex;
            gap: 12px;
        }

        .message.user {
            flex-direction: row-reverse;
        }

        .message-avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            font-size: 14px;
        }

        .message.user .message-avatar {
            background: #404040;
            color: white;
        }

        .message.assistant .message-avatar {
            background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%);
            color: white;
        }

        .message-content {
            flex: 1;
            max-width: 70%;
        }

        .message.user .message-content {
            background: #333333;
            padding: 12px 16px;
            border-radius: 18px 18px 6px 18px;
            color: #ffffff;
        }

        .message.assistant .message-content {
            background: transparent;
            padding: 0;
            line-height: 1.7;
            color: #e5e5e5;
        }

        .thinking {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #a0a0a0;
            font-style: italic;
            padding: 8px 0;
        }

        .typing-dots {
            display: flex;
            gap: 4px;
        }

        .typing-dots span {
            width: 6px;
            height: 6px;
            background: #00d4ff;
            border-radius: 50%;
            animation: typing 1.4s infinite;
        }

        .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
        .typing-dots span:nth-child(3) { animation-delay: 0.4s; }

        @keyframes typing {
            0%, 60%, 100% { transform: translateY(0); }
            30% { transform: translateY(-10px); }
        }

        .input-container {
            padding: 20px;
            background: rgba(26, 26, 26, 0.95);
            border-top: 1px solid #333333;
            backdrop-filter: blur(10px);
        }

        .input-wrapper {
            position: relative;
            max-width: 100%;
        }

        .input-field {
            width: 100%;
            background: #2a2a2a;
            border: 1px solid #404040;
            border-radius: 24px;
            padding: 16px 60px 16px 20px;
            font-size: 16px;
            color: #ffffff;
            resize: none;
            min-height: 56px;
            max-height: 200px;
            outline: none;
            transition: border-color 0.2s ease;
        }

        .input-field:focus {
            border-color: #00d4ff;
        }

        .input-field::placeholder {
            color: #888;
        }

        .send-button {
            position: absolute;
            right: 12px;
            top: 50%;
            transform: translateY(-50%);
            width: 32px;
            height: 32px;
            background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%);
            border: none;
            border-radius: 50%;
            color: white;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.2s ease;
            opacity: 0.7;
        }

        .send-button:hover {
            transform: translateY(-50%) scale(1.1);
            opacity: 1;
        }

        .send-button:disabled {
            opacity: 0.3;
            cursor: not-allowed;
            transform: translateY(-50%) scale(1);
        }

        .metadata {
            font-size: 12px;
            color: #888;
            margin-top: 8px;
            padding-top: 8px;
            border-top: 1px solid #444;
        }

        /* Scrollbar styling */
        .messages-container::-webkit-scrollbar {
            width: 6px;
        }

        .messages-container::-webkit-scrollbar-track {
            background: transparent;
        }

        .messages-container::-webkit-scrollbar-thumb {
            background: #404040;
            border-radius: 3px;
        }

        .messages-container::-webkit-scrollbar-thumb:hover {
            background: #555;
        }

        @media (max-width: 640px) {
            .chat-container {
                height: 100vh;
            }
            
            .header {
                padding: 12px 16px;
            }
            
            .messages-container {
                padding: 0 16px;
            }
            
            .input-container {
                padding: 16px;
            }
        }
    </style>
</head>
<body>
    <div class="chat-container">
        <div class="header">
            <h1>JARVIS AI</h1>
        </div>
        
        <div class="messages-container" id="messagesContainer">
            <div class="welcome-screen" id="welcomeScreen">
                <div class="welcome-icon">🤖</div>
                <div class="welcome-title">Welcome to JARVIS</div>
                <div class="welcome-subtitle">Your intelligent AI assistant with specialized agents for recruitment and content creation</div>
                <div class="agent-pills">
                    <div class="agent-pill">Recruitment Agent</div>
                    <div class="agent-pill">Content Agent</div>
                </div>
            </div>
        </div>
        
        <div class="input-container">
            <div class="input-wrapper">
                <textarea 
                    class="input-field" 
                    id="messageInput" 
                    placeholder="Ask me anything about recruitment, content creation, or general questions..."
                    rows="1"
                ></textarea>
                <button class="send-button" id="sendButton" onclick="sendMessage()">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/>
                    </svg>
                </button>
            </div>
        </div>
    </div>

    <script>
        let isWaiting = false;

        function hideWelcomeScreen() {
            const welcomeScreen = document.getElementById('welcomeScreen');
            if (welcomeScreen) {
                welcomeScreen.style.display = 'none';
            }
        }

        function addMessage(content, isUser = false, metadata = null) {
            hideWelcomeScreen();
            
            const messagesContainer = document.getElementById('messagesContainer');
            const messageDiv = document.createElement('div');
            messageDiv.className = \`message \${isUser ? 'user' : 'assistant'}\`;
            
            const avatar = document.createElement('div');
            avatar.className = 'message-avatar';
            avatar.textContent = isUser ? 'U' : 'J';
            
            const contentDiv = document.createElement('div');
            contentDiv.className = 'message-content';
            
            if (isUser) {
                contentDiv.textContent = content;
            } else {
                // Format assistant response
                if (typeof content === 'object') {
                    try {
                        const result = content.results && content.results[0] ? content.results[0].data : 'Processing completed';
                        contentDiv.innerHTML = \`
                            <div style="margin-bottom: 12px;">\${typeof result === 'string' ? result : JSON.stringify(result, null, 2)}</div>
                        \`;
                        
                        if (metadata || (content.metadata && content.metadata.nlpAnalysis)) {
                            const meta = metadata || content.metadata;
                            const metaDiv = document.createElement('div');
                            metaDiv.className = 'metadata';
                            metaDiv.innerHTML = \`
                                <strong>Analysis:</strong> Intent: \${meta.nlpAnalysis?.intent || 'unknown'}, 
                                Sentiment: \${meta.nlpAnalysis?.sentiment || 'neutral'} | 
                                <strong>Agent:</strong> \${content.results?.[0]?.agentType || 'content_agent'} | 
                                <strong>Model:</strong> \${content.results?.[0]?.metadata?.aiModel || 'claude-sonnet-4-20250514'}
                            \`;
                            contentDiv.appendChild(metaDiv);
                        }
                    } catch (e) {
                        contentDiv.textContent = JSON.stringify(content, null, 2);
                    }
                } else {
                    contentDiv.textContent = content;
                }
            }
            
            messageDiv.appendChild(avatar);
            messageDiv.appendChild(contentDiv);
            messagesContainer.appendChild(messageDiv);
            
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        function showThinking() {
            hideWelcomeScreen();
            
            const messagesContainer = document.getElementById('messagesContainer');
            const thinkingDiv = document.createElement('div');
            thinkingDiv.className = 'message assistant';
            thinkingDiv.id = 'thinking-message';
            
            const avatar = document.createElement('div');
            avatar.className = 'message-avatar';
            avatar.textContent = 'J';
            
            const contentDiv = document.createElement('div');
            contentDiv.className = 'message-content thinking';
            contentDiv.innerHTML = \`
                JARVIS is thinking
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            \`;
            
            thinkingDiv.appendChild(avatar);
            thinkingDiv.appendChild(contentDiv);
            messagesContainer.appendChild(thinkingDiv);
            
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        function removeThinking() {
            const thinkingMessage = document.getElementById('thinking-message');
            if (thinkingMessage) {
                thinkingMessage.remove();
            }
        }

        async function sendMessage() {
            const input = document.getElementById('messageInput');
            const sendButton = document.getElementById('sendButton');
            const message = input.value.trim();
            
            if (!message || isWaiting) return;
            
            isWaiting = true;
            sendButton.disabled = true;
            
            // Add user message
            addMessage(message, true);
            input.value = '';
            
            // Show thinking state
            showThinking();
            
            try {
                const response = await fetch('/api/v1/orchestrate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        query: message,
                        context: { userId: 'web-user', source: 'web' }
                    })
                });
                
                const data = await response.json();
                
                removeThinking();
                
                if (response.ok) {
                    addMessage(data, false, data.metadata);
                } else {
                    addMessage('Sorry, I encountered an error processing your request. Please try again.', false);
                }
                
            } catch (error) {
                removeThinking();
                addMessage('Sorry, I encountered a network error. Please check your connection and try again.', false);
                console.error('Error:', error);
            }
            
            isWaiting = false;
            sendButton.disabled = false;
            input.focus();
        }

        // Auto-resize textarea
        document.getElementById('messageInput').addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 200) + 'px';
        });

        // Send on Enter (not Shift+Enter)
        document.getElementById('messageInput').addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        // Focus input on load
        window.addEventListener('load', function() {
            document.getElementById('messageInput').focus();
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
