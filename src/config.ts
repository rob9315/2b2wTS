import type { BotOptions as IBotOptions } from 'mineflayer';
import type { ServerOptions as IServerOptions } from 'minecraft-protocol';

export class ProxyOptions {
  mcclient: IBotOptions = new BotOptions();
  mcserver: IServerOptions = new ServerOptions();
  webserver: WebServerOptions|null = new WebServerOptions();
  discord: DiscordOptions|null = null;
  extra?: Partial<extraOptions>;
}

export class BotOptions implements IBotOptions {
  username = '2b2wUser';
}

export class ServerOptions implements IServerOptions {
  'online-mode' = false;
  host = '0.0.0.0';
  port? = 25565;
  version = '1.12.2';
  maxPlayers? = 1;
}

export class WebServerOptions {
  host: string = '0.0.0.0';
  port: number = 80;
  password?: string;
}

export class DiscordOptions {
  commands?: { prefix: string };
  status?: boolean = true;
  constructor(public token: string){}
}

export interface extraOptions {
  whitelist: boolean;
  console: boolean;
  is2b2t: boolean;
  expandQueueData: boolean;
  reconnect: { timeout: number };
  logging: boolean;
}
