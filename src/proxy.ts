import { Conn } from '@rob9315/mcproxy';
import { Client, createServer, PacketMeta, Server } from 'minecraft-protocol';
import { Client as Discord, Intents } from 'discord.js';
import { ProxyOptions, WebServerOptions } from './config';
import { Server as HTTP } from 'http';
import serveStatic from 'serve-static';
import { Server as IO, Socket } from 'socket.io';
//@ts-ignore (no type definitions)
import everpolate from 'everpolate';
import { onDiscordMessage } from './discord';

import type { Bot, BotOptions } from 'mineflayer';

export class Proxy {
  conn: Conn | undefined;
  server: Server;

  // optional features
  webserver?: WebServer;
  discord?: Discord;

  // keeping track of the state of the proxy
  private _state: 'idle' | 'condition' | 'auth' | 'connected' | 'afk' | 'reconnecting' | 'queue' = 'idle';

  private _queue: number | undefined;
  private _queuelength: number | undefined;

  private _timeout: (NodeJS.Timeout & { start: number; end: number }) | undefined;

  constructor(public options: ProxyOptions) {
    this.server = createServer(this.options.mcserver).on('login', onServerLogin.bind(this));
    if (this.options.discord) {
      this.discord = new Discord({ ws: { intents: Intents.ALL } }).on('message', onDiscordMessage);
      this.discord.login(this.options.discord.token);
    }
    if (this.options.webserver) this.webserver = new WebServer(this.options.webserver, this);
    if (this.options.extra?.startImmediately) this.state = 'auth';
  }

  set state(state: typeof Proxy.prototype._state) {
    switch (this._state) {
      case 'queue':
        [this._queue, this._queuelength] = [undefined, undefined];
        break;
      case 'afk':
        if (this.options.antiafk) (this.conn?.bot as any)?.afk?.stop();
        break;
      case 'reconnecting':
        this.timeout = undefined;
        break;
    }
    switch (state) {
      case 'idle':
        this.conn?.disconnect();
        this.conn = undefined;
        break;
      case 'auth':
        this.options.mcclient.plugins = this.options.mcclient.plugins ?? {};
        if (!!this.options.antiafk) this.options.mcclient.plugins['afk'] = require('mineflayer-antiafk');
        this.conn = new Conn(this.options.mcclient);
        //* load/customize extensions
        this.options.extensions?.reduce((arr, fn) => [...arr, fn(this.conn as Conn)], [] as (void | ((bot: Bot, options: BotOptions) => void))[]).forEach((v) => !!v && this.conn?.bot.loadPlugin(v));
        if (this.options.antiafk)
          this.conn.bot.once('spawn', async () => {
            (this.conn?.bot as any)?.afk?.setOptions(this.options.antiafk);
            if ((this.conn?.bot as any)?.afk?.chat) (this.conn?.bot as any).afk.chat = function(){};
            if (!this.conn?.pclient) await (this.conn?.bot as any)?.afk?.start();
          });
        this.conn.bot.on('login', () => (this.state = 'queue'));
        this.conn.bot._client.on('end', () => (this.state = this.options.extra?.reconnect ? 'reconnecting' : 'idle'));
        this.conn.bot._client.on('error', () => (this.state = this.options.extra?.reconnect ? 'reconnecting' : 'idle'));
        this.conn.bot._client.on('packet', onClientPacket.bind(this));
        break;
      case 'afk':
        if (this.options.antiafk)
          (async () => {
            while (!(this.conn?.bot as any)?.afk?.enabled) await (this.conn?.bot as any)?.afk?.start();
          })();
        break;
      case 'reconnecting':
        this.conn?.disconnect();
        this.conn = undefined;
        this.timeout = [() => (this.state = 'auth'), this.options.extra?.reconnect?.timeout as number];
        break;
    }
    this._state = state;
    this.update();
  }
  get state() {
    return this._state;
  }

  set setqueue(position: number) {
    if (this._queue == position) return;
    this._queue = position;
    if (!this._queuelength) this._queuelength = position;
    this.update();
  }
  get getqueue() {
    if (!this._queue || !this._queuelength) return undefined;
    return {
      position: this._queue,
      length: this._queuelength,
      eta: eta(this._queue, this._queuelength),
    };
  }

  private set timeout(options: [callback: (...args: any[]) => any, duration: number, ...args: any[]] | undefined) {
    if (this._timeout) clearTimeout(this._timeout);
    this._timeout = options ? Object.assign(setTimeout(...options), { start: Date.now(), end: Date.now() }) : undefined;
  }

  update() {
    if (this.state === 'queue' && typeof this.getqueue == 'object') {
      let { position, eta } = this.getqueue;
      this.server.motd = `Position: ${position}\tETA: ${Math.floor(eta / 3600)}:${Math.floor((eta / 60) % 60)}h`;
      console.log(`Position: ${position}\tETA: ${Math.floor(eta / 3600)}:${Math.floor((eta / 60) % 60)}h`);
    } else {
      this.server.motd = this.state;
      console.log(this._state);
    }
    this.webserver?.update();
  }
}

class WebServer extends HTTP {
  private serve = serveStatic('./frontend');
  private io = new IO({ serveClient: true }).listen(this);
  private sockets = <Socket[]>[];
  constructor(public options: WebServerOptions, private proxy: Proxy) {
    super((req, res) => this.serve(req, res, () => {}));
    this.listen(this.options.port, this.options.host);
    this.io
      .use((socket, next) => {
        if (!this.options.password && this.options.password == socket.request.headers.authorization) next();
        else next(new Error('ClientError'));
      })
      .on('connect', (socket) => this.sockets.push(socket))
      .on('start', () => {
        if (this.proxy.state === 'idle') this.proxy.state = 'auth';
      })
      .on('stop', () => (this.proxy.state = 'idle'));
  }
  get status() {
    return {
      state: this.proxy.state,
      queue: this.proxy.getqueue,
    };
  }

  update() {
    const status = this.status;
    this.sockets.forEach((socket) => socket.emit('update', status));
  }
}

// 0   300
// 280 300
// a - b

export function eta(position: number, length: number) {
  const a = (position: number) => Math.log((position + 150) / (length + 150)) / b;
  const b = Math.log(linear(length, ...queueData)[0]);
  return a(0) - a(position);
}

export const linear = <T extends number[], K extends number[]>(x: number | K, knownX: T, knownY: T): K => {
  knownX.push(knownX[knownX.length - 1] + (knownX[0] > knownX[1] ? -1 : 1));
  knownY.push(knownY[knownY.length - 1]);
  knownX.unshift(knownX[0] + (knownX[0] < knownX[1] ? -1 : 1));
  knownY.unshift(knownY[0]);
  return everpolate.linear(x, knownX, knownY);
};

function onClientPacket(this: Proxy, data: any, { name }: PacketMeta) {
  if (this.state == 'queue') {
    let pos: number | undefined;
    switch (name) {
      case 'playerlist_header':
        pos = parseTabMenu(data);
        break;
      case 'chat':
        pos = parseChatMessage(data);
        break;
      case 'map_chunk':
        this.state = this.conn?.pclient ? 'connected' : 'afk';
    }
    if (pos) this.setqueue = pos;
  }
  if (name == 'kick_disconnect') this.options.extra?.reconnect ? 'reconnecting' : 'idle';
}

async function onServerLogin(this: Proxy, client: Client) {
  if (this.options.mcserver['online-mode'] && client.uuid !== this.conn?.bot._client.uuid) {
    return client.end('whitelist is enabled, make sure you are using the correct account.');
  }
  if (!this.conn?.bot?.entity?.id) {
    return client.end(`not connected yet...\ncurrent state: '${this.state}'`);
  }
  if (this.state == 'afk') this.state = 'connected';
  this.conn?.sendPackets(client);
  this.conn?.link(client);
  client.on('end', () => (this.state == 'queue' ? undefined : (this.state = 'afk')));
}

export function parseChatMessage(data: { message: string }) {
  try {
    return Number(JSON.parse(data.message).extra[1].text);
  } catch {}
}

export function parseTabMenu(data: { header: string }) {
  try {
    return Number((JSON.parse(data.header)?.text as string).match(/(?<=Position in queue: (?:§.)*)\d+/)?.[0]);
  } catch {}
}

const queueData: [number[], number[]] = [
  [93, 207, 231, 257, 412, 418, 486, 506, 550, 586, 666, 758, 789, 826],
  [0.9998618838664679, 0.9999220416881794, 0.9999234240704379, 0.9999291667668093, 0.9999410569845172, 0.9999168965649361, 0.9999440195022513, 0.9999262577896301, 0.9999462301738332, 0.999938895110192, 0.9999219189483673, 0.9999473463335498, 0.9999337457796981, 0.9999279556964097],
];
