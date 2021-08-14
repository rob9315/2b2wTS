import type { BotOptions as IBotOptions, Bot } from 'mineflayer';
import type { ServerOptions as IServerOptions } from 'minecraft-protocol';
import type { Conn } from '@rob9315/mcproxy';

export class ProxyOptions {
  mcclient: IBotOptions = new BotOptions();
  mcserver: IServerOptions = new ServerOptions();
  webserver: WebServerOptions | null = new WebServerOptions();
  discord: DiscordOptions | null = null;
  antiafk: AntiAFKoptions | null = new AntiAFKoptions();
  extra? = new ExtraOptions();
  extensions?: ((conn: Conn) => void | ((bot: Bot, options?: IBotOptions) => void))[];
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
  port: number = 8080;
  password?: string;
}

export class DiscordOptions {
  token = '';
  commands?: { prefix: string; allowedIds?: string[] } = {
    prefix: '',
    allowedIds: undefined,
  };
  status?: boolean = true;
}

export class ExtraOptions {
  console = true;
  reconnect: { timeout: number } | null = { timeout: 30000 };
  logging: { maxLines?: number } | null = { maxLines: 1000 };
  expandQueueData? = true;
  startImmediately? = true;
  autoDisconnect?: number;
}

export class AntiAFKoptions {
  actions? = ['rotate', 'walk', 'jump', 'jumpWalk', 'swingArm'];
  fishing = true;
  minWalkingTime = 2000;
  maxWalkingTime = 4000;
  minActionsInterval = 0;
  maxActionsInterval = 500;
  breaking?: number[]; // minecraft block ids
  placing?: number[]; // (find them at https://minecraft-data.prismarine.js.org/)
  chatting = false;
  chatMessages?: string[] = [];
  chatInterval? = 300000;
  killauraEnabled = true;
  autoEatEnabled = true;
  autoEatConfig? = new AutoEatConfig();
}

export class AutoEatConfig {
  priority: 'saturation' | 'foodPoints' = 'foodPoints';
  startAt = 14;
  bannedFood?: string[]; // food names (look up on https://minecraft-data.prismarine.js.org/)
}
