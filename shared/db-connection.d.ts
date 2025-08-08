export interface DatabaseClient {
    query(text: string, params?: any[]): Promise<any>;
}
export declare class DatabaseConnection {
    private static client;
    static setClient(client: DatabaseClient): void;
    static query(text: string, params?: any[]): Promise<any>;
    static transaction<T>(callback: () => Promise<T>): Promise<T>;
    static healthCheck(): Promise<boolean>;
}
//# sourceMappingURL=db-connection.d.ts.map