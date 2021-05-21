import type { BotOptions as IBotOptions } from 'mineflayer';
import type { ServerOptions as IServerOptions } from 'minecraft-protocol';

export class ProxyOptions {
  mcclient: IBotOptions = new BotOptions();
  mcserver: IServerOptions = new ServerOptions();
  webserver: WebServerOptions | null = new WebServerOptions();
  discord: DiscordOptions | null = null;
  extra? = new ExtraOptions();
  constructor(everythingSet?: boolean) {
    if (everythingSet) {
      this.discord = new DiscordOptions();
      this.extra = new ExtraOptions();
    }
  }
}

export class BotOptions implements IBotOptions {
  username = '2b2wUser';
  host = '2b2t.org';
  port = 25565;
  version = '1.12.2';
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
  token = '';
  commands?: { prefix: string; allowedIds?: string[] } = { prefix: '', allowedIds: undefined };
  status?: boolean = true;
}

export class ExtraOptions {
  console = true;
  reconnect: { timeout: number } | null = { timeout: 30000 };
  logging: { maxLines?: number } | null = {
    maxLines: 1000,
  };
}
