// Core chat services for scalable JARVIS system
import { DatabaseConnection } from './db-connection';
import { ChatSession, ChatMessage, ConversationContext } from './database';

// Generate unique session ID for guest users
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Generate unique guest user ID
export function generateGuestUserId(): string {
  return `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Context Manager for efficient conversation retrieval
export class ContextManager {
  // Get conversation context with recent messages
  async getConversationContext(
    sessionId: string, 
    userId: string, 
    limit: number = 10
  ): Promise<ConversationContext> {
    const query = `
      SELECT message_id, session_id, user_id, role, content, metadata, created_at
      FROM chat_messages 
      WHERE session_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2
    `;
    
    const result = await DatabaseConnection.query(query, [sessionId, limit]);
    const recentMessages = result.rows.reverse(); // Chronological order
    
    // Get total message count efficiently
    const totalMessages = await this.getMessageCount(sessionId);
    
    return {
      recentMessages,
      totalMessages,
      sessionId,
      userId
    };
  }

  // Get message count from session table (efficient)
  async getMessageCount(sessionId: string): Promise<number> {
    const result = await DatabaseConnection.query(
      'SELECT message_count FROM chat_sessions WHERE session_id = $1',
      [sessionId]
    );
    return result.rows[0]?.message_count || 0;
  }

  // Get or create session
  async getOrCreateSession(sessionId: string, userId: string): Promise<ChatSession> {
    // Try to get existing session
    const existingResult = await DatabaseConnection.query(
      'SELECT * FROM chat_sessions WHERE session_id = $1',
      [sessionId]
    );

    if (existingResult.rows.length > 0) {
      return existingResult.rows[0];
    }

    // Create new session
    const result = await DatabaseConnection.query(
      `INSERT INTO chat_sessions (session_id, user_id, created_at, updated_at, last_activity)
       VALUES ($1, $2, NOW(), NOW(), NOW())
       RETURNING *`,
      [sessionId, userId]
    );

    return result.rows[0];
  }

  // Get user sessions with pagination
  async getUserSessions(userId: string, limit: number = 20, offset: number = 0): Promise<ChatSession[]> {
    const query = `
      SELECT session_id, user_id, title, created_at, updated_at, message_count, last_activity
      FROM chat_sessions 
      WHERE user_id = $1 
      ORDER BY last_activity DESC 
      LIMIT $2 OFFSET $3
    `;
    
    const result = await DatabaseConnection.query(query, [userId, limit, offset]);
    return result.rows;
  }
}

// Message Store for efficient batch operations
export class MessageStore {
  async storeMessage(
    sessionId: string,
    userId: string,
    role: 'user' | 'assistant',
    content: string,
    metadata?: any
  ): Promise<ChatMessage> {
    return await DatabaseConnection.transaction(async () => {
      // Insert message
      const messageResult = await DatabaseConnection.query(
        `INSERT INTO chat_messages (session_id, user_id, role, content, metadata, created_at) 
         VALUES ($1, $2, $3, $4, $5, NOW())
         RETURNING *`,
        [sessionId, userId, role, content, metadata]
      );
      
      // Update session activity and message count
      await DatabaseConnection.query(
        `UPDATE chat_sessions 
         SET last_activity = NOW(), 
             message_count = message_count + 1, 
             updated_at = NOW(),
             title = CASE 
               WHEN title IS NULL AND message_count = 0 AND $3 = 'user' 
               THEN SUBSTRING($4, 1, 50) 
               ELSE title 
             END
         WHERE session_id = $1`,
        [sessionId, userId, role, content]
      );
      
      return messageResult.rows[0];
    });
  }

  // Batch store multiple messages (for system initialization)
  async storeMessages(messages: Array<{
    sessionId: string;
    userId: string;
    role: 'user' | 'assistant';
    content: string;
    metadata?: any;
  }>): Promise<ChatMessage[]> {
    return await DatabaseConnection.transaction(async () => {
      const results: ChatMessage[] = [];
      
      for (const msg of messages) {
        const result = await DatabaseConnection.query(
          `INSERT INTO chat_messages (session_id, user_id, role, content, metadata, created_at) 
           VALUES ($1, $2, $3, $4, $5, NOW())
           RETURNING *`,
          [msg.sessionId, msg.userId, msg.role, msg.content, msg.metadata]
        );
        results.push(result.rows[0]);
        
        // Update session for each message
        await DatabaseConnection.query(
          `UPDATE chat_sessions 
           SET last_activity = NOW(), 
               message_count = message_count + 1, 
               updated_at = NOW()
           WHERE session_id = $1`,
          [msg.sessionId]
        );
      }
      
      return results;
    });
  }

  // Get messages for a session with pagination
  async getSessionMessages(
    sessionId: string, 
    limit: number = 50, 
    offset: number = 0
  ): Promise<ChatMessage[]> {
    const query = `
      SELECT message_id, session_id, user_id, role, content, metadata, created_at
      FROM chat_messages 
      WHERE session_id = $1 
      ORDER BY created_at ASC 
      LIMIT $2 OFFSET $3
    `;
    
    const result = await DatabaseConnection.query(query, [sessionId, limit, offset]);
    return result.rows;
  }
}