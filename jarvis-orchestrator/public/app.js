// JARVIS AI Frontend Application
let isWaiting = false;
let currentSessionId = null;
let currentUserId = null;
let chatHistory = [];
const API_BASE_URL = window.location.origin;

// Session management with proper UUID generation
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function getOrCreateSessionId() {
    if (!currentSessionId) {
        currentSessionId = localStorage.getItem('jarvis_session_id');
        if (!currentSessionId) {
            currentSessionId = generateUUID();
            localStorage.setItem('jarvis_session_id', currentSessionId);
        }
    }
    return currentSessionId;
}

function getOrCreateUserId() {
    if (!currentUserId) {
        currentUserId = localStorage.getItem('jarvis_user_id');
        if (!currentUserId) {
            currentUserId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('jarvis_user_id', currentUserId);
        }
    }
    return currentUserId;
}

// Chat History Management
function createNewChat() {
    // Generate new session ID
    currentSessionId = generateUUID();
    localStorage.setItem('jarvis_session_id', currentSessionId);
    
    // Clear current chat
    clearCurrentChat();
    
    // Show welcome screen
    showWelcomeScreen();
    
    // Update chat history list
    loadChatHistory();
    
    console.log('New chat created:', currentSessionId);
}

function clearCurrentChat() {
    const messagesContainer = document.getElementById('messagesContainer');
    messagesContainer.innerHTML = '';
}

function showWelcomeScreen() {
    const messagesContainer = document.getElementById('messagesContainer');
    messagesContainer.innerHTML = `
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
                <div class="agent-pill">CRM Management</div>
                <div class="agent-pill">Project Management</div>
                <div class="agent-pill">Treasury</div>
            </div>
        </div>
    `;
}

async function loadChatHistory() {
    try {
        const userId = getOrCreateUserId();
        const response = await fetch(`${API_BASE_URL}/api/v1/chat-history?userId=${userId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
            const data = await response.json();
            chatHistory = data.sessions || [];
            displayChatHistory();
        } else {
            console.warn('Failed to load chat history:', response.status);
            displayEmptyHistory();
        }
    } catch (error) {
        console.warn('Error loading chat history:', error);
        displayEmptyHistory();
    }
}

function displayChatHistory() {
    const chatHistoryList = document.getElementById('chatHistoryList');
    
    if (!chatHistory || chatHistory.length === 0) {
        displayEmptyHistory();
        return;
    }

    chatHistoryList.innerHTML = '';
    
    chatHistory.forEach(session => {
        const item = document.createElement('div');
        item.className = 'chat-history-item';
        if (session.session_id === currentSessionId) {
            item.classList.add('active');
        }
        
        const title = session.title || 'New Conversation';
        const lastMessage = session.last_message || 'No messages yet';
        const timestamp = formatTimestamp(session.last_activity || session.created_at);
        
        item.innerHTML = `
            <h3>${escapeHtml(title)}</h3>
            <p>${escapeHtml(lastMessage.substring(0, 60))}${lastMessage.length > 60 ? '...' : ''}</p>
            <div class="timestamp">${timestamp}</div>
        `;
        
        item.addEventListener('click', () => {
            switchToSession(session.session_id);
        });
        
        chatHistoryList.appendChild(item);
    });
}

function displayEmptyHistory() {
    const chatHistoryList = document.getElementById('chatHistoryList');
    chatHistoryList.innerHTML = `
        <div class="no-history">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M8 6l4-4 4 4"/>
                <path d="M12 2v10.3a4 4 0 0 1-1.172 2.828L4 22"/>
            </svg>
            <p>Start a conversation to see your chat history</p>
        </div>
    `;
}

async function switchToSession(sessionId) {
    try {
        if (sessionId === currentSessionId) {
            console.log('Already on this session:', sessionId);
            return;
        }
        
        currentSessionId = sessionId;
        localStorage.setItem('jarvis_session_id', sessionId);
        
        // Clear current messages
        clearCurrentChat();
        
        // Load messages for this session
        await loadSessionMessages(sessionId);
        
        // Update active item in history
        document.querySelectorAll('.chat-history-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Find and activate the correct item by matching session ID
        const activeItem = Array.from(document.querySelectorAll('.chat-history-item'))
            .find(item => {
                // Get the session from chatHistory by matching position
                const itemIndex = Array.from(item.parentNode.children).indexOf(item);
                return chatHistory[itemIndex] && chatHistory[itemIndex].session_id === sessionId;
            });
        if (activeItem) {
            activeItem.classList.add('active');
        }
        
        console.log('Switched to session:', sessionId);
    } catch (error) {
        console.error('Error switching session:', error);
        addMessage('Sorry, failed to load this conversation. Please try again.', false);
    }
}

async function loadSessionMessages(sessionId) {
    try {
        console.log('Loading messages for session:', sessionId);
        
        const response = await fetch(`${API_BASE_URL}/api/v1/chat-messages?sessionId=${sessionId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Received messages data:', data);
            
            const messages = data.messages || [];
            
            const messagesContainer = document.getElementById('messagesContainer');
            messagesContainer.innerHTML = '';
            
            if (messages.length === 0) {
                console.log('No messages found for session:', sessionId);
                showWelcomeScreen();
                return;
            }
            
            // Sort messages by created_at to ensure proper order
            messages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            
            console.log('Loading', messages.length, 'messages in chronological order');
            
            // Display all messages in chronological order
            messages.forEach((message, index) => {
                console.log(`Loading message ${index + 1}:`, {
                    role: message.role,
                    content: message.content.substring(0, 50) + '...',
                    timestamp: message.created_at
                });
                
                // Parse assistant message content if it's JSON
                let messageContent = message.content;
                if (message.role === 'assistant') {
                    messageContent = parseAssistantContent(message.content);
                }
                
                addMessage(
                    messageContent, 
                    message.role === 'user',
                    message.metadata || null,
                    false, // Don't hide welcome screen for loaded messages
                    message.created_at // Pass the actual message timestamp
                );
            });
            
            // Scroll to bottom to show latest messages
            setTimeout(() => {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }, 100);
            
        } else {
            console.warn('Failed to load session messages:', response.status, response.statusText);
            const errorData = await response.text();
            console.warn('Error response:', errorData);
            showWelcomeScreen();
        }
    } catch (error) {
        console.error('Error loading session messages:', error);
        showWelcomeScreen();
    }
}

// Sidebar toggle functionality
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    
    if (window.innerWidth <= 768) {
        // Mobile: toggle sidebar
        sidebar.classList.toggle('open');
        
        if (!overlay) {
            const overlayDiv = document.createElement('div');
            overlayDiv.className = 'sidebar-overlay';
            overlayDiv.addEventListener('click', closeSidebar);
            document.body.appendChild(overlayDiv);
        }
        
        if (sidebar.classList.contains('open')) {
            document.querySelector('.sidebar-overlay').classList.add('active');
        } else {
            document.querySelector('.sidebar-overlay').classList.remove('active');
        }
    }
}

function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    
    sidebar.classList.remove('open');
    if (overlay) {
        overlay.classList.remove('active');
    }
}

// Utility functions
function formatTimestamp(timestamp) {
    try {
        const date = new Date(timestamp);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
            return 'Today';
        } else if (diffDays === 2) {
            return 'Yesterday';
        } else if (diffDays <= 7) {
            return `${diffDays} days ago`;
        } else {
            return date.toLocaleDateString();
        }
    } catch (error) {
        return 'Recently';
    }
}

function parseAssistantContent(content) {
    try {
        // If content is already a clean string (not JSON), return as is
        if (typeof content === 'string' && !content.trim().startsWith('{')) {
            return content;
        }
        
        // Handle escaped JSON content that might come from database
        let cleanContent = content;
        if (typeof content === 'string' && content.startsWith('"{') && content.endsWith('}"')) {
            // Remove outer quotes and unescape internal quotes
            cleanContent = content.slice(1, -1).replace(/""/g, '"');
        }
        
        // Try to parse as JSON and extract meaningful content
        const parsed = JSON.parse(cleanContent);
        
        if (typeof parsed === 'object' && parsed !== null) {
            // Try different common keys in order of preference
            const possibleKeys = ['content', 'analysis', 'text', 'response', 'message', 'result', 'data'];
            
            for (const key of possibleKeys) {
                if (parsed[key] && typeof parsed[key] === 'string') {
                    console.log(`Frontend: Extracted ${key} from assistant message`);
                    return parsed[key];
                }
            }
            
            // If no common keys found, try to find the first string value
            for (const [key, value] of Object.entries(parsed)) {
                if (typeof value === 'string' && value.length > 0) {
                    console.log(`Frontend: Extracted ${key} from assistant message`);
                    return value;
                }
            }
            
            // If still no string found, return the entire JSON as formatted string
            return JSON.stringify(parsed, null, 2);
        }
        
        return cleanContent;
    } catch (error) {
        // If parsing fails, return the original content
        console.log('Frontend: Failed to parse assistant content, using as-is:', error);
        return content;
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function hideWelcomeScreen() {
    const welcomeScreen = document.getElementById('welcomeScreen');
    if (welcomeScreen) {
        welcomeScreen.style.display = 'none';
    }
}

function addMessage(content, isUser = false, metadata = null, hideWelcome = true, messageTimestamp = null) {
    if (hideWelcome) {
        hideWelcomeScreen();
    }

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
        
        // Extract agent information - check stored metadata first, then response data
        let agentInfo = null;
        if (metadata.agentType) {
            // For loaded messages - get from stored metadata
            agentInfo = metadata.agentType.replace('_', ' ');
            metadataContent += 'Agent: ' + agentInfo + ' | ';
        } else if (content && typeof content === 'object' && content.results && content.results[0]) {
            // For live messages - get from response data
            const result = content.results[0];
            if (result.agentType) {
                agentInfo = result.agentType.replace('_', ' ');
                metadataContent += 'Agent: ' + agentInfo + ' | ';
            }
        }
        
        // Extract model information - check stored metadata first, then response data
        let modelInfo = 'Auto'; // Default fallback
        const modelMappings = {
            'claude-sonnet-4-20250514': 'Claude Sonnet 4',
            'claude-3-7-sonnet-20250219': 'Claude 3.7 Sonnet',
            'claude-3-5-sonnet-20241022': 'Claude 3.5 Sonnet',
            'gpt-4o': 'ChatGPT 4.0',
            'gpt-4': 'ChatGPT 4',
            'gpt-3.5-turbo': 'ChatGPT 3.5'
        };
        
        if (metadata.aiModel) {
            // For loaded messages - get from stored metadata
            modelInfo = modelMappings[metadata.aiModel] || metadata.aiModel;
        } else if (content && typeof content === 'object' && content.results && content.results[0]) {
            // For live messages - get from response data
            const result = content.results[0];
            if (result.metadata && result.metadata.aiModel) {
                const aiModel = result.metadata.aiModel;
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
        
        // Add timestamp - use provided timestamp or current time
        let timestamp;
        if (messageTimestamp) {
            // Use the actual message timestamp for loaded messages
            const messageDate = new Date(messageTimestamp);
            timestamp = messageDate.toLocaleTimeString();
        } else {
            // Use current time for new messages
            timestamp = new Date().toLocaleTimeString();
        }
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
            
            // Refresh chat history to show this conversation
            setTimeout(() => {
                loadChatHistory();
            }, 1000);
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
    const newChatBtn = document.getElementById('newChatBtn');
    const sidebarToggle = document.getElementById('sidebarToggle');

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

    // New chat button
    newChatBtn.addEventListener('click', createNewChat);

    // Sidebar toggle for mobile
    sidebarToggle.addEventListener('click', toggleSidebar);

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 768) {
            const sidebar = document.getElementById('sidebar');
            const sidebarToggle = document.getElementById('sidebarToggle');
            
            if (!sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
                closeSidebar();
            }
        }
    });

    // Handle window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            closeSidebar();
        }
    });

    // Initialize session and load data
    getOrCreateSessionId();
    getOrCreateUserId();
    loadChatHistory();
    
    console.log('JARVIS Frontend initialized');
    console.log('Session ID:', getOrCreateSessionId());
    console.log('User ID:', getOrCreateUserId());
});