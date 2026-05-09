import { connect } from "framer-api";

type FramerClient = Awaited<ReturnType<typeof connect>>;

export class FramerConnection {
  private client: FramerClient | null = null;
  private connecting: Promise<FramerClient> | null = null;
  private projectUrl: string;
  private apiKey: string | undefined;

  constructor(projectUrl: string, apiKey?: string) {
    this.projectUrl = projectUrl;
    this.apiKey = apiKey;
  }

  private async doConnect(): Promise<FramerClient> {
    if (this.connecting) return this.connecting;

    this.connecting = connect(this.projectUrl, this.apiKey).then((client) => {
      this.client = client;
      this.connecting = null;
      return client;
    }).catch((err) => {
      this.connecting = null;
      this.client = null;
      throw err;
    });

    return this.connecting;
  }

  async getClient(): Promise<FramerClient> {
    if (this.client) return this.client;
    return this.doConnect();
  }

  /**
   * Execute a callback with auto-reconnect on connection errors.
   * All tools should use this instead of getClient() directly.
   */
  async exec<T>(fn: (client: FramerClient) => Promise<T>): Promise<T> {
    let client = await this.getClient();
    try {
      return await fn(client);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes("closed") || msg.includes("Connection") || msg.includes("disconnected") || msg.includes("ECONNRESET")) {
        this.client = null;
        client = await this.doConnect();
        return await fn(client);
      }
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.disconnect();
      } catch {
        // ignore
      }
      this.client = null;
    }
  }

  get isConnected(): boolean {
    return this.client !== null;
  }

  get url(): string {
    return this.projectUrl;
  }
}
