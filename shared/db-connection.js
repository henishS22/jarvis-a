"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseConnection = void 0;
class DatabaseConnection {
    static setClient(client) {
        this.client = client;
    }
    static async query(text, params) {
        const start = Date.now();
        try {
            const result = await this.client.query(text, params);
            const duration = Date.now() - start;
            if (duration > 1000) {
                console.warn(`Slow query detected: ${duration}ms`, { query: text.substring(0, 100) });
            }
            return result;
        }
        catch (error) {
            console.error('Database query error:', { error, query: text.substring(0, 100) });
            throw error;
        }
    }
    static async transaction(callback) {
        try {
            await this.client.query('BEGIN');
            const result = await callback();
            await this.client.query('COMMIT');
            return result;
        }
        catch (error) {
            await this.client.query('ROLLBACK');
            throw error;
        }
    }
    static async healthCheck() {
        try {
            await this.client.query('SELECT 1');
            return true;
        }
        catch {
            return false;
        }
    }
}
exports.DatabaseConnection = DatabaseConnection;
//# sourceMappingURL=db-connection.js.map