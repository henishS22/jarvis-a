// JARVIS AI Frontend Application
let isWaiting = false;
const API_BASE_URL = 'http://localhost:5000'; // Adjust this to your backend URL

// Session management
function getOrCreateSessionId() {
    let sessionId = localStorage.getItem('jarvis_session_id');
    if (!sessionId) {
        sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('jarvis_session_id', sessionId);
    }
    return sessionId;
}

function getOrCreateUserId() {
    let userId = localStorage.getItem('jarvis_user_id');
    if (!userId) {
        userId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('jarvis_user_id', userId);
    }
    return userId;
}

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
    messageDiv.className = 'message ' + (isUser ? 'user' : 'assistant');

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
            metadataContent += 'Intent: ' + intentValue + ' | ';
        }
        
        // Extract processing time
        if (metadata.processingTime) {
            metadataContent += 'Processing Time: ' + metadata.processingTime + 'ms | ';
        }
        
        // Extract agent information
        if (metadata.agentCount) {
            metadataContent += 'Agents: ' + metadata.agentCount + ' | ';
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
                metadataContent += 'Agent: ' + agentInfo + ' | ';
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
        
        metadataContent += 'Model: ' + modelInfo + ' | ';
        
        // Add timestamp
        const timestamp = new Date().toLocaleTimeString();
        metadataContent += timestamp;
        
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
    contentDiv.innerHTML = 'JARVIS is thinking<div class="typing-dots"><span></span><span></span><span></span></div>';

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
        
        // Get session and user IDs
        const sessionId = getOrCreateSessionId();
        const userId = getOrCreateUserId();
        
        const response = await fetch(API_BASE_URL + '/api/v1/orchestrate', {
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
    } finally {
        isWaiting = false;
        sendButton.disabled = false;
    }
}

// Auto-resize textarea
function autoResize() {
    const textarea = document.getElementById('messageInput');
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    const input = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');

    // Handle send button click
    sendButton.addEventListener('click', sendMessage);

    // Handle Enter key (but allow Shift+Enter for new lines)
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Auto resize textarea
    input.addEventListener('input', autoResize);

    // Initialize session
    getOrCreateSessionId();
    getOrCreateUserId();
    
    console.log('JARVIS Frontend initialized');
    console.log('Session ID:', getOrCreateSessionId());
    console.log('User ID:', getOrCreateUserId());
});