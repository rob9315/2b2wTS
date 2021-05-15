import { Conn } from 'mcproxy';
import { Client, Server, createServer, PacketMeta } from 'minecraft-protocol';
import { Client as djsClient } from 'discord.js';
import { WebServer } from './webserver';
import { expandQueueData, log, logActivity, logErrorIfExists, setETA } from './util';
import { DateTime } from 'luxon';

import type { ProxyOptions } from './config';

export class Proxy {
  server: Server;
  conn?: Conn;
  webserver: WebServer;
  discord?: djsClient;
  state: 'idle' | 'auth' | 'queue' | 'waiting' | 'antiafk' | 'connected' | 'reconnect';

  timeout?: NodeJS.Timeout;
  timeoutStartTime?: DateTime;
  timeoutDuration?: number;

  logActivity = logActivity.bind(this);
  setETA = setETA.bind(this);
  log = log.bind(this);

  constructor(public options: ProxyOptions) {
    this.state = 'idle';
    if (!!options.discordtoken) {
      this.discord = new djsClient({});
      this.discord.login(options.discordtoken);
    }
    this.webserver = new WebServer(options.webserver, this);
    this.server = createServer(options.server);
    this.server.on('login', this.onLogin.bind(this));
  }
  onLogin(client: Client) {
    if (this.options.config?.whitelist && client.uuid !== this.conn?.bot._client.uuid) {
      return client.end('whitelist is enabled and you are using the wrong account.');
    }
    if (!!(this.conn?.bot?.entity as any)?.id) {
      this.conn?.sendPackets(client);
      this.conn?.link(client);
      return;
    }
    return client.end('problem with conn, are you not queuing?');
  }
  startQueuing() {
    this.state = 'auth';
    this.conn = new Conn(this.options.botOptions);
    this.conn.bot.once('login', () => {
      this.state = this.options.config?.is2b2t ? 'queue' : 'connected';
    });
    this.conn.bot._client.on('end', this.end.bind(this));
    this.conn.bot._client.on('error', this.end.bind(this));
    this.conn.bot._client.on('packet', this.onPacketListener.bind(this));
    this.webserver.isInQueue = true;
  }
  stopQueuing() {
    this.state = 'idle';
    this.stop();
  }
  reconnect() {
    this.state = 'reconnect';
    this.stop();
  }
  private stop() {
    this.clearCurrentTimeout();
    this.webserver.isInQueue = false;
    this.conn?.disconnect();
    this.conn = undefined;
  }
  updateQueuePosition() {
    switch (true) {
      case this.state === 'connected':
        (this.webserver.queuePlace as any) = 'FINISHED';
        this.webserver.ETA = 'NOW';
        break;
      default:
        this.setETA();
    }
  }
  command(cmd: string): string {
    switch (cmd) {
      case 'start':
        if (['queue'].includes(this.state)) return 'Already Queuing';
        if (['antiafk', 'connected'].includes(this.state)) return 'Already Ingame';
        this.startQueuing();
        return 'Started Queuing';
      case 'stop':
        if (['idle'].includes(this.state)) return 'Not Queuing currently';
        this.stopQueuing();
        return 'Stopped Queuing';
      case 'help':
        return `current state: "${this.state}"\npossible commands:\nstart\nstop\nhelp\n`;
      case 'exit':
      case 'quit':
        process.exit(0);
      default:
        return 'Unknown Command, maybe try `help`';
    }
  }
  setCurrentTimeout(callback: (...args: any[]) => void, ms?: number, ...args: any[]) {
    if (!!this.timeout) clearTimeout(this.timeout);
    this.timeout = setTimeout(callback, ms, ...args);
    this.timeoutStartTime = DateTime.local();
    this.timeoutDuration = ms;
  }
  clearCurrentTimeout() {
    if (!!this.timeout) clearTimeout(this.timeout);
    this.timeoutStartTime = undefined;
    this.timeoutDuration = undefined;
  }

  queueStartPlace?: number;
  queueStartTime?: DateTime;
  end(err?: Error) {
    logErrorIfExists(err);
    if (this.state !== 'idle' && this.options.config?.reconnect) {
      log(`Connection reset by 2b2t server. Reconnecting in ${this.options.config.reconnect.timeout}ms`);
      this.state = 'reconnect';
      this.setCurrentTimeout(() => {
        //TODO! implement the pinging stuff
        this.startQueuing();
      }, this.options.config?.reconnect?.timeout);
    } else this.stopQueuing();
  }
  onPacketListener(data: any, packetMeta: PacketMeta) {
    switch (packetMeta.name) {
      case 'playerlist_header':
        if (this.state === 'queue') {
          let prevQueuePlace = this.webserver.queuePlace;
          let headermessage = JSON.parse(data.header);
          try {
            let queuePlace = headermessage.text.split('\n')[5].substring(25);
            this.webserver.queuePlace = queuePlace === 'None' ? queuePlace : Number(queuePlace);
          } catch (e) {
            if (e instanceof TypeError) log("Reading position in queue from tab failed! Is the queue empty, or the server isn't 2b2t?");
          }
          if (this.options.config?.expandQueueData && prevQueuePlace === 'None' && this.webserver.queuePlace !== 'None') {
            this.queueStartPlace = this.webserver.queuePlace;
            this.queueStartTime = DateTime.local();
          }
          if (prevQueuePlace !== this.webserver.queuePlace) this.updateQueuePosition();
        }
        break;
      case 'chat':
        if (this.state === 'queue') {
          let chatMessage = JSON.parse(data.message);
          if (chatMessage.text === 'Connecting to the server...') {
            if (this.options.config?.expandQueueData && !!this.queueStartPlace && !!this.queueStartTime) {
              expandQueueData(this.queueStartPlace, this.queueStartTime);
            }
            if (this.webserver.restartQueue && !!this.conn?.pclient) {
              this.reconnect();
            } else {
              this.state = 'connected';
              this.updateQueuePosition();
              this.logActivity('Queue is finished');
            }
          }
        }
    }
  }
}
