export class ProxyOptions {
  constructor(everythingSet) {
    this.mcclient = new BotOptions();
    this.mcserver = new ServerOptions();
    this.webserver = new WebServerOptions();
    this.discord = null;
    this.antiafk = new AntiAFKoptions();
    this.extra = new ExtraOptions();
    if (everythingSet) {
      this.discord = new DiscordOptions();
      this.extra = new ExtraOptions();
    }
  }
}
export class BotOptions {
  constructor() {
    this.username = "2b2wUser";
    this.host = "2b2t.org";
    this.port = 25565;
    this.version = "1.12.2";
  }
}
export class ServerOptions {
  constructor() {
    this["online-mode"] = false;
    this.host = "0.0.0.0";
    this.port = 25565;
    this.version = "1.12.2";
    this.maxPlayers = 1;
  }
}
export class WebServerOptions {
  constructor() {
    this.host = "0.0.0.0";
    this.port = 8080;
  }
}
export class DiscordOptions {
  constructor() {
    this.token = "";
    this.commands = {
      prefix: "",
      allowedIds: void 0
    };
    this.status = true;
  }
}
export class ExtraOptions {
  constructor() {
    this.console = true;
    this.reconnect = {timeout: 3e4};
    this.logging = {maxLines: 1e3};
    this.expandQueueData = true;
    this.startImmediately = true;
  }
}
export class AntiAFKoptions {
  constructor() {
    this.actions = ["rotate", "walk", "jump", "jumpWalk", "swingArm"];
    this.fishing = true;
    this.minWalkingTime = 2e3;
    this.maxWalkingTime = 4e3;
    this.minActionsInterval = 0;
    this.maxActionsInterval = 500;
    this.chatting = false;
    this.chatMessages = [];
    this.chatInterval = 3e5;
    this.killauraEnabled = true;
    this.autoEatEnabled = true;
    this.autoEatConfig = new AutoEatConfig();
  }
}
export class AutoEatConfig {
  constructor() {
    this.priority = "foodPoints";
    this.startAt = 14;
  }
}
