import { BotOptions } from 'mineflayer';
import { ServerOptions } from 'minecraft-protocol';

export interface ProxyOptions {
  botOptions: BotOptions;
  server: ServerOptions;
  webserver?: WebServerOptions;
  discordtoken: string;
  config?: Partial<extraOptions>;
}
export interface WebServerOptions {
  host: string;
  port: number;
  password?: string;
}
export interface extraOptions {
  whitelist: boolean;
  console: boolean;
  is2b2t: boolean;
  expandQueueData: boolean;
  reconnect: {
    timeout: number;
  }
  logging: boolean;
}
