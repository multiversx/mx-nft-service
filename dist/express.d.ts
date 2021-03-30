export declare class Express {
    private app;
    private server;
    init(): Promise<void>;
    getExpressApp(): any;
    listen(port: any): Promise<unknown>;
}
