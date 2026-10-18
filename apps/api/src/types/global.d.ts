declare module "@volter/twin-mongodb" {
  export function createMongodbTwinServer(options?: {
    root?: string;
    readOnly?: boolean;
  }): Promise<{
    port: number;
    url: string;
    stop: () => Promise<void>;
  }>;
}
