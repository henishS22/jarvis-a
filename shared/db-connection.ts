// Database connection utilities for high-scale JARVIS system

// Simple database query interface that will be injected at runtime
export interface DatabaseClient {
  query(text: string, params?: any[]): Promise<any>;
}

// Database connection utilities
export class DatabaseConnection {
  private static client: DatabaseClient;

  static setClient(client: DatabaseClient) {
    this.client = client;
  }

  static async query(text: string, params?: any[]) {
    const start = Date.now();
    try {
      const result = await this.client.query(text, params);
      const duration = Date.now() - start;
      
      // Log slow queries (>1 second)
      if (duration > 1000) {
        console.warn(`Slow query detected: ${duration}ms`, { query: text.substring(0, 100) });
      }
      
      return result;
    } catch (error) {
      console.error('Database query error:', { error, query: text.substring(0, 100) });
      throw error;
    }
  }

  static async transaction<T>(callback: () => Promise<T>): Promise<T> {
    try {
      await this.client.query('BEGIN');
      const result = await callback();
      await this.client.query('COMMIT');
      return result;
    } catch (error) {
      await this.client.query('ROLLBACK');
      throw error;
    }
  }

  // Health check for monitoring
  static async healthCheck(): Promise<boolean> {
    try {
      await this.client.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }
}