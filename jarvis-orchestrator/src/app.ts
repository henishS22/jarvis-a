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
            font-family: "Söhne", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Ubuntu, Cantarell, "Noto Sans", sans-serif, "Helvetica Neue", Arial, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
            background: #343541;
            color: #ececf1;
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
            padding: 12px 16px;
            background: #343541;
            border-bottom: 1px solid #565869;
            position: sticky;
            top: 0;
            z-index: 100;
        }

        .header h1 {
            font-size: 16px;
            font-weight: 600;
            color: #ececf1;
            text-align: center;
        }

        .messages-container {
            flex: 1;
            overflow-y: auto;
            scroll-behavior: smooth;
        }

        .welcome-screen {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            height: 100%;
            text-align: center;
            padding: 48px 16px;
        }

        .welcome-title {
            font-size: 32px;
            font-weight: 600;
            margin-bottom: 16px;
            color: #ececf1;
        }

        .welcome-subtitle {
            font-size: 16px;
            color: #c5c5d2;
            margin-bottom: 32px;
            line-height: 1.5;
            max-width: 400px;
        }

        .message {
            border-bottom: 1px solid #565869;
            padding: 24px 16px;
        }

        .message-content {
            max-width: 768px;
            margin: 0 auto;
            display: flex;
            gap: 16px;
        }

        .message-avatar {
            width: 30px;
            height: 30px;
            border-radius: 2px;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            font-size: 14px;
            margin-top: 4px;
        }

        .message.user {
            background: #444654;
        }

        .message.user .message-avatar {
            background: #5436da;
            color: white;
        }

        .message.assistant .message-avatar {
            background: #19c37d;
            color: white;
        }

        .message-text {
            flex: 1;
            line-height: 1.75;
            color: #ececf1;
            font-size: 16px;
        }

        .message.user .message-text {
            color: #ececf1;
        }

        .thinking {
            border-bottom: 1px solid #565869;
            padding: 24px 16px;
        }

        .thinking .message-content {
            max-width: 768px;
            margin: 0 auto;
            display: flex;
            gap: 16px;
        }

        .thinking .message-avatar {
            background: #19c37d;
            color: white;
        }

        .thinking-text {
            flex: 1;
            display: flex;
            align-items: center;
            gap: 8px;
            color: #c5c5d2;
            font-style: italic;
        }

        .typing-dots {
            display: flex;
            gap: 4px;
        }

        .typing-dots span {
            width: 4px;
            height: 4px;
            background: #c5c5d2;
            border-radius: 50%;
            animation: typing 1.4s infinite;
        }

        .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
        .typing-dots span:nth-child(3) { animation-delay: 0.4s; }

        @keyframes typing {
            0%, 60%, 100% { opacity: 0.25; }
            30% { opacity: 1; }
        }

        .input-container {
            padding: 12px 16px 24px;
            background: #343541;
        }

        .input-wrapper {
            position: relative;
            max-width: 768px;
            margin: 0 auto;
        }

        .input-field {
            width: 100%;
            background: #40414f;
            border: 1px solid #565869;
            border-radius: 12px;
            padding: 12px 48px 12px 16px;
            font-size: 16px;
            color: #ececf1;
            resize: none;
            min-height: 24px;
            max-height: 200px;
            outline: none;
            transition: border-color 0.2s ease;
            font-family: inherit;
            line-height: 24px;
        }

        .input-field:focus {
            border-color: #565869;
            box-shadow: 0 0 0 2px rgba(86, 88, 105, 0.1);
        }

        .input-field::placeholder {
            color: #8e8ea0;
        }

        .send-button {
            position: absolute;
            right: 8px;
            bottom: 8px;
            width: 32px;
            height: 32px;
            background: #ececf1;
            border: none;
            border-radius: 6px;
            color: #343541;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background-color 0.2s ease;
        }

        .send-button:hover:not(:disabled) {
            background: #d1d5db;
        }

        .send-button:disabled {
            background: #565869;
            color: #8e8ea0;
            cursor: not-allowed;
        }

        .metadata {
            font-size: 12px;
            color: #8e8ea0;
            margin-top: 12px;
            padding-top: 12px;
            border-top: 1px solid #565869;
        }

        /* Scrollbar styling */
        .messages-container::-webkit-scrollbar {
            width: 8px;
        }

        .messages-container::-webkit-scrollbar-track {
            background: transparent;
        }

        .messages-container::-webkit-scrollbar-thumb {
            background: #565869;
            border-radius: 4px;
        }

        .messages-container::-webkit-scrollbar-thumb:hover {
            background: #6b7280;
        }

        @media (max-width: 640px) {
            .header {
                padding: 12px 16px;
            }
            
            .message {
                padding: 20px 12px;
            }
            
            .message-content {
                gap: 12px;
            }
            
            .input-container {
                padding: 12px;
            }
            
            .welcome-screen {
                padding: 32px 16px;
            }
        }
    </style>
</head>
<body>
    <div class="chat-container">
        <div class="header">
            <h1>JARVIS</h1>
        </div>
        
        <div class="messages-container" id="messagesContainer">
            <div class="welcome-screen" id="welcomeScreen">
                <div class="welcome-title">How can I help you today?</div>
                <div class="welcome-subtitle">I'm JARVIS, your AI assistant with specialized capabilities for recruitment and content creation.</div>
            </div>
        </div>
        
        <div class="input-container">
            <div class="input-wrapper">
                <textarea 
                    class="input-field" 
                    id="messageInput" 
                    placeholder="Message JARVIS..."
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
            
            const messageContent = document.createElement('div');
            messageContent.className = 'message-content';
            
            const avatar = document.createElement('div');
            avatar.className = 'message-avatar';
            avatar.textContent = isUser ? 'U' : 'J';
            
            const textDiv = document.createElement('div');
            textDiv.className = 'message-text';
            
            if (isUser) {
                textDiv.textContent = content;
            } else {
                // Format assistant response
                if (typeof content === 'object') {
                    try {
                        const result = content.results && content.results[0] ? content.results[0].data : 'Processing completed';
                        textDiv.innerHTML = \`
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
                            textDiv.appendChild(metaDiv);
                        }
                    } catch (e) {
                        textDiv.textContent = JSON.stringify(content, null, 2);
                    }
                } else {
                    textDiv.textContent = content;
                }
            }
            
            messageContent.appendChild(avatar);
            messageContent.appendChild(textDiv);
            messageDiv.appendChild(messageContent);
            messagesContainer.appendChild(messageDiv);
            
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        function showThinking() {
            hideWelcomeScreen();
            
            const messagesContainer = document.getElementById('messagesContainer');
            const thinkingDiv = document.createElement('div');
            thinkingDiv.className = 'thinking';
            thinkingDiv.id = 'thinking-message';
            
            const messageContent = document.createElement('div');
            messageContent.className = 'message-content';
            
            const avatar = document.createElement('div');
            avatar.className = 'message-avatar';
            avatar.textContent = 'J';
            
            const thinkingText = document.createElement('div');
            thinkingText.className = 'thinking-text';
            thinkingText.innerHTML = \`
                JARVIS is thinking
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            \`;
            
            messageContent.appendChild(avatar);
            messageContent.appendChild(thinkingText);
            thinkingDiv.appendChild(messageContent);
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
