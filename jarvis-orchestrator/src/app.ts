import express from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import { orchestrate } from "./controllers/orchestratorController";
import { logger } from "./utils/logger";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`, {
        userAgent: req.get("User-Agent"),
        ip: req.ip,
        timestamp: new Date().toISOString(),
    });
    next();
});

// Main web interface
app.get("/", (req, res) => {
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
            background: #212121;
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
            padding: 16px 20px;
            background: rgba(26, 26, 26, 0.95);
            border-bottom: 1px solid #333333;
            backdrop-filter: blur(10px);
            position: sticky;
            top: 0;
            z-index: 100;
        }

        .header h1 {
            font-size: 18px;
            font-weight: 600;
            color: #f7f7f8;
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
            width: 64px;
            height: 64px;
            border-radius: 50%;
            background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 32px;
            font-size: 28px;
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
            font-size: 16px;
            color: #b4b4b4;
            margin-bottom: 32px;
            line-height: 1.5;
            font-weight: 400;
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
            margin: 12px 0;
            display: flex;
            gap: 8px;
            align-items: flex-start;
        }

        .message.user {
            flex-direction: row-reverse;
            margin: 12px 0;
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
            margin-top: 2px;
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
            min-width: 0;
        }

        .message.assistant .message-wrapper {
            display: flex;
            flex-direction: column;
            width: 100%;
            min-width: 0;
        }

        .message.user .message-content {
            background: #333333;
            padding: 12px 16px;
            border-radius: 18px 18px 6px 18px;
            color: #ececf1;
            font-size: 16px;
            line-height: 1.5;
            margin: 0;
            word-wrap: break-word;
        }

        .message.assistant .message-content {
            background: transparent;
            padding: 8px 0;
            line-height: 1.7;
            color: #ececf1;
            font-size: 16px;
            margin: 0;
            word-wrap: break-word;
        }

        .thinking {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #b4b4b4;
            font-style: normal;
            padding: 8px 0;
            font-size: 14px;
        }

        .typing-dots {
            display: flex;
            gap: 2px;
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
            background: #40414f;
            border: 1px solid #565869;
            border-radius: 12px;
            padding: 12px 50px 12px 16px;
            font-size: 16px;
            color: #ececf1;
            resize: none;
            min-height: 24px;
            max-height: 200px;
            outline: none;
            transition: border-color 0.2s ease;
            font-family: inherit;
            line-height: 1.5;
        }

        .input-field:focus {
            border-color: #00d4ff;
        }

        .input-field::placeholder {
            color: #8e8ea0;
        }

        .send-button {
            position: absolute;
            right: 8px;
            top: 50%;
            transform: translateY(-50%);
            width: 32px;
            height: 32px;
            background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%);
            border: none;
            border-radius: 6px;
            color: #202123;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background-color 0.2s ease;
        }

        .send-button:hover:not(:disabled) {
            background: #d9d9e3;
        }

        .send-button:disabled {
            background: #565869;
            color: #40414f;
            cursor: not-allowed;
        }

        .metadata {
            font-size: 12px;
            color: #8e8ea0;
            margin-top: 8px;
            padding-top: 8px;
            border-top: 1px solid #565869;
            width: 100%;
            clear: both;
        }

        .model-selector {
            position: absolute;
            top: 12px;
            right: 60px;
            z-index: 10;
        }

        .model-dropdown {
            background: #40414f;
            border: 1px solid #565869;
            border-radius: 6px;
            color: #ececf1;
            padding: 4px 8px;
            font-size: 12px;
            outline: none;
            cursor: pointer;
        }

        .model-dropdown:focus {
            border-color: #00d4ff;
        }

        /* Scrollbar styling */
        .messages-container::-webkit-scrollbar {
            width: 4px;
        }

        .messages-container::-webkit-scrollbar-track {
            background: transparent;
        }

        .messages-container::-webkit-scrollbar-thumb {
            background: #565869;
            border-radius: 2px;
        }

        .messages-container::-webkit-scrollbar-thumb:hover {
            background: #676767;
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
            <div class="model-selector">
                <select class="model-dropdown" id="modelSelector">
                    <option value="auto">Auto</option>
                    <option value="claude-sonnet-4">Claude Sonnet 4</option>
                    <option value="chatgpt-4o">ChatGPT 4.0</option>
                </select>
            </div>
        </div>

        <div class="messages-container" id="messagesContainer">
            <div class="welcome-screen" id="welcomeScreen">
                <div class="welcome-icon">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                        <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"/>
                    </svg>
                </div>
                <div class="welcome-title">How can I help you today?</div>
                <div class="welcome-subtitle">I'm JARVIS, your AI assistant with specialized agents for recruitment and content creation.</div>
                <div class="agent-pills">
                    <div class="agent-pill">Recruitment</div>
                    <div class="agent-pill">Content Creation</div>
                </div>
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

            const avatar = document.createElement('div');
            avatar.className = 'message-avatar';
            avatar.textContent = isUser ? 'U' : 'J';

            const contentDiv = document.createElement('div');
            contentDiv.className = 'message-content';

            if (isUser) {
                contentDiv.textContent = content;
            } else {
                // Clean assistant response formatting - show only the content
                if (typeof content === 'object') {
                    try {
                        // Extract the actual AI response content
                        const result = content.results && content.results[0] ? content.results[0].data : 'Processing completed';
                        
                        // Display only the clean content, properly formatted
                        if (typeof result === 'string') {
                            contentDiv.textContent = result;
                        } else if (result && typeof result === 'object') {
                            // If result is an object, try to extract meaningful content
                            const extractedContent = result.content || result.text || result.response || result.analysis || JSON.stringify(result, null, 2);
                            contentDiv.textContent = extractedContent;
                        } else {
                            contentDiv.textContent = 'Response received successfully';
                        }
                    } catch (e) {
                        contentDiv.textContent = 'Response received successfully';
                    }
                } else {
                    contentDiv.textContent = content;
                }
            }

            messageDiv.appendChild(avatar);
            
            // Create wrapper for content and metadata to ensure proper stacking
            const messageWrapper = document.createElement('div');
            messageWrapper.className = 'message-wrapper';
            messageWrapper.appendChild(contentDiv);
            
            // Add metadata display for assistant messages
            if (!isUser && metadata) {
                const metadataDiv = document.createElement('div');
                metadataDiv.className = 'metadata';
                
                let metadataContent = '';
                
                // Extract intent information
                if (metadata.nlpAnalysis && metadata.nlpAnalysis.intent) {
                    const intent = metadata.nlpAnalysis.intent;
                    // Handle both string and object intent values
                    const intentValue = typeof intent === 'string' ? intent : 
                                       (intent.category || intent.action || JSON.stringify(intent));
                    metadataContent += \`Intent: \${intentValue} | \`;
                }
                
                // Extract processing time
                if (metadata.processingTime) {
                    metadataContent += \`Processing Time: \${metadata.processingTime}ms | \`;
                }
                
                // Extract agent information
                if (metadata.agentCount) {
                    metadataContent += \`Agents: \${metadata.agentCount} | \`;
                }
                
                // Extract model information from results - always show model
                let modelInfo = 'Auto'; // Default fallback
                let agentInfo = null;
                
                // Try to get model from response data
                if (content && typeof content === 'object' && content.results && content.results[0]) {
                    const result = content.results[0];
                    
                    // Extract agent type
                    if (result.agentType) {
                        agentInfo = result.agentType.replace('_', ' ');
                        metadataContent += \`Agent: \${agentInfo} | \`;
                    }
                    
                    // Extract model from metadata
                    if (result.metadata && result.metadata.aiModel) {
                        const aiModel = result.metadata.aiModel;
                        // Map technical model names to user-friendly names
                        const modelMappings = {
                            'claude-sonnet-4-20250514': 'Claude Sonnet 4',
                            'claude-3-7-sonnet-20250219': 'Claude 3.7 Sonnet',
                            'claude-3-5-sonnet-20241022': 'Claude 3.5 Sonnet',
                            'gpt-4o': 'ChatGPT 4.0',
                            'gpt-4': 'ChatGPT 4',
                            'gpt-3.5-turbo': 'ChatGPT 3.5'
                        };
                        modelInfo = modelMappings[aiModel] || aiModel;
                    }
                }
                
                // Fallback: try to determine from user's selection if no model found in response
                if (modelInfo === 'Auto') {
                    const modelSelector = document.getElementById('modelSelector');
                    if (modelSelector && modelSelector.value !== 'auto') {
                        if (modelSelector.value === 'claude-sonnet-4') {
                            modelInfo = 'Claude Sonnet 4';
                        } else if (modelSelector.value === 'chatgpt-4o') {
                            modelInfo = 'ChatGPT 4.0';
                        }
                    }
                }
                
                metadataContent += \`Model: \${modelInfo} | \`;
                
                // Add timestamp
                const timestamp = new Date().toLocaleTimeString();
                metadataContent += \`\${timestamp}\`;
                
                // Remove trailing separator if exists
                metadataContent = metadataContent.replace(/ \| $/, '');
                
                metadataDiv.textContent = metadataContent;
                messageWrapper.appendChild(metadataDiv);
            }
            
            messageDiv.appendChild(messageWrapper);

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
                const modelSelector = document.getElementById('modelSelector');
                const selectedModel = modelSelector.value;
                
                // Get or create session ID for chat continuity
                let sessionId = localStorage.getItem('jarvis_session_id');
                if (!sessionId) {
                    sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                    localStorage.setItem('jarvis_session_id', sessionId);
                }
                
                // Get or create user ID for guest mode
                let userId = localStorage.getItem('jarvis_user_id');
                if (!userId) {
                    userId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                    localStorage.setItem('jarvis_user_id', userId);
                }
                
                const response = await fetch('/api/v1/orchestrate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        query: message,
                        context: { userId, source: 'web', sessionId },
                        modelPreference: selectedModel,
                        sessionId,
                        userId
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
app.get("/api/v1/health", (req, res) => {
    res.json({
        status: "healthy",
        service: "jarvis-orchestrator",
        timestamp: new Date().toISOString(),
        version: "1.0.0",
    });
});

// Main orchestration endpoint
app.post("/api/v1/orchestrate", orchestrate);

// Error handling middleware
app.use(
    (
        error: any,
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
    ) => {
        logger.error("Unhandled error:", error);
        res.status(500).json({
            error: "Internal Server Error",
            message: "An unexpected error occurred during request processing",
            timestamp: new Date().toISOString(),
        });
    },
);

// 404 handler
app.use("*", (req, res) => {
    res.status(404).json({
        error: "Not Found",
        message: `Route ${req.method} ${req.originalUrl} not found`,
        timestamp: new Date().toISOString(),
    });
});

app.listen(Number(PORT), "0.0.0.0", () => {
    logger.info(`JARVIS Orchestrator Service running on port ${PORT}`);
});

export default app;
