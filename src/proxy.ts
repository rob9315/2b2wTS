import { Conn } from 'mcproxy';
import { Client, Server, createServer, PacketMeta } from 'minecraft-protocol';
import { Client as djsClient, Intents } from 'discord.js';
import { WebServer } from './webserver';
import { log, logActivity, logErrorIfExists, setETA } from './util';
import * as util from './util';
import { DateTime } from 'luxon';
import { onDiscordMessage } from './discord';

import type { ProxyOptions } from './config';

export class Proxy {
  server: Server;
  conn?: Conn;
  webserver: WebServer;
  discord?: djsClient;

  // current State of the Proxy
  // 'idle', 'auth', 'queue', 'connected' and 'antiafk' do what their name implies.
  // 'timeStart', 'timePlay' and 'reconnect' means that currently a timeout is running
  // for the implied reason
  state: 'idle' | 'timeStart' | 'timePlay' | 'auth' | 'queue' | 'connected' | 'antiafk' | 'reconnect';
  // only assigned, when state is 'timeStart' or 'timePlay'
  extraStateInformation?: DateTime;

  queueStartPlace?: number;
  queueStartTime?: DateTime;

  timeout?: NodeJS.Timeout;
  timeoutStartTime?: DateTime;
  timeoutDuration?: number;

  logActivity = logActivity.bind(this);
  setETA = setETA.bind(this);
  log = log.bind(this);

  constructor(public options: ProxyOptions) {
    this.state = 'idle';
    options.discord = !!options.discord && options.discord?.token !== '' ? options.discord : null;
    if (!!options.discord) {
      this.discord = new djsClient({ ws: { intents: new Intents(['DIRECT_MESSAGES', 'GUILDS']) } });
      this.discord.login(options.discord.token).then(() => this.log('Discord Bot started'));
      this.discord.on('message', onDiscordMessage.bind(this));
    }
    this.webserver = new WebServer(options.webserver, this);
    this.server = createServer(options.mcserver);
    this.server.on('login', this.onClientLogin.bind(this));
  }
  startQueuing() {
    this.clearCurrentTimeout();
    this.state = 'auth';
    this.conn = new Conn(this.options.mcclient);
    this.conn.bot.once('login', () => {
      this.state = this.options.mcclient.host?.includes('2b2t.org') ? 'queue' : 'connected';
    });
    this.conn.bot._client.on('end', this.onClientEnd.bind(this));
    this.conn.bot._client.on('error', this.onClientEnd.bind(this));
    this.conn.bot._client.on('packet', this.onClientPacket.bind(this));
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
  private updateQueuePosition() {
    if (!['antiafk', 'connected'].includes(this.state)) return this.setETA();
    this.webserver.queuePlace = 'FINISHED';
    this.webserver.ETA = 'NOW';
  }
  command(cmd: string): string {
    function preventAccidentalRestart(this: Proxy, cmd?: string): string | undefined {
      if (['auth', 'queue'].includes(this.state)) return 'Already Queuing';
      if (['antiafk', 'connected'].includes(this.state)) return 'Already Ingame';
      if (!!cmd) {
        this.clearCurrentTimeout();
        this.extraStateInformation = util.timeStringtoDateTime(cmd);
      }
    }
    let quitmsg: string | undefined;
    switch (cmd) {
      case 'start':
        if (!!(quitmsg = preventAccidentalRestart.bind(this)())) return quitmsg;
        this.startQueuing();
        return 'Started Queuing';
      case 'stop':
        quitmsg = ['idle'].includes(this.state) ? 'Not Queuing currently' : 'Stopped Queuing';
        this.stopQueuing();
        return quitmsg;
      case 'update':
        return `current state: "${this.state}"`;
      case 'help':
        return `current state: "${this.state}"\nread the available commands on https://github.com/rob9315/2b2wts/blob/master/README.md`;
      case 'exit':
      case 'quit':
        process.exit(0);
      default:
        switch (true) {
          case /^start (\d|[0-1]\d|2[0-3]):[0-5]\d$/.test(cmd):
            if (!!(quitmsg = preventAccidentalRestart.bind(this)(cmd))) return quitmsg;
            this.state = 'timeStart';
            this.setCurrentTimeout(this.startQueuing.bind(this), util.timeStringtoDateTime(cmd).diffNow().toMillis());
            return `Queuing starting at ${this.extraStateInformation?.toLocaleString(DateTime.DATETIME_FULL)}`;
          case /^play (\d|[0-1]\d|2[0-3]):[0-5]\d$/.test(cmd):
            if (!!(quitmsg = preventAccidentalRestart.bind(this)(cmd))) return quitmsg;
            this.state = 'timePlay';
            this.setCurrentTimeout(this.timePlay.bind(this), this.options.extra?.reconnect?.timeout ?? 30000, this.extraStateInformation);
            return `Waiting to Queue until the estimated waiting time is right so that you can play at ${this.extraStateInformation?.toLocaleString(DateTime.DATETIME_FULL)}`;
          default:
            return 'Unknown Command, maybe try `help`';
        }
    }
  }
  private setCurrentTimeout(callback: (...args: any[]) => void, ms?: number, ...args: any[]) {
    if (!!this.timeout) clearTimeout(this.timeout);
    this.timeout = setTimeout(callback, ms, ...args);
    this.timeoutStartTime = DateTime.local();
    this.timeoutDuration = ms;
  }
  private clearCurrentTimeout() {
    if (!!this.timeout) clearTimeout(this.timeout);
    this.timeoutStartTime = undefined;
    this.timeoutDuration = undefined;
  }
  private async timePlay(time: DateTime) {
    let queueLength = await util.getQueueLength();
    if (typeof queueLength != 'number') return this.startQueuing();
    if (time.diffNow().seconds < util.getWaitTime(queueLength, queueLength)) return this.startQueuing();
    this.setCurrentTimeout(this.timePlay.bind(this), this.options.extra?.reconnect?.timeout ?? 30000, time);
  }

  private onClientLogin(this: Proxy, client: Client) {
    if (this.options.mcserver['online-mode'] && client.uuid !== this.conn?.bot._client.uuid) {
      return client.end('whitelist is enabled and you are using the wrong account.');
    }
    if (!!(this.conn?.bot?.entity as any)?.id) {
      this.conn?.sendPackets(client);
      this.conn?.link(client);
      return;
    }
    return client.end('problem with conn, are you not queuing?');
  }
  private onClientEnd(err?: Error) {
    logErrorIfExists(err);
    if (this.state !== 'idle' && !!this.options.extra?.reconnect) {
      log(`Connection reset by 2b2t server. Reconnecting in ${this.options.extra.reconnect.timeout}ms`);
      this.state = 'reconnect';
      this.setCurrentTimeout(() => {
        //TODO! implement the pinging stuff
        this.startQueuing();
      }, this.options.extra?.reconnect?.timeout);
    } else this.stopQueuing();
  }
  private onClientPacket(data: any, packetMeta: PacketMeta) {
    switch (packetMeta.name) {
      case 'playerlist_header':
        if (this.state === 'queue') {
          let prevQueuePlace = this.webserver.queuePlace;
          let headermessage = JSON.parse(data.header);
          try {
            let queuePlace = headermessage.text.split('\n')[5].substring(25);
            this.webserver.queuePlace = queuePlace === 'None' ? 'None' : Number(queuePlace);
          } catch (e) {
            if (e instanceof TypeError) log("Reading position in queue from tab failed! Is the queue empty, or the server isn't 2b2t?");
          }
          if (prevQueuePlace === 'None' && this.webserver.queuePlace !== 'None') {
            this.queueStartPlace = this.webserver.queuePlace as number;
            this.queueStartTime = DateTime.local();
          }
          if (prevQueuePlace !== this.webserver.queuePlace) this.updateQueuePosition();
        }
        break;
      case 'chat':
        if (this.state === 'queue') {
          let chatMessage = JSON.parse(data.message);
          if (chatMessage.text === 'Connecting to the server...') {
            // if (this.options.extra?.expandQueueData && !!this.queueStartPlace && !!this.queueStartTime) expandQueueData(this.queueStartPlace, this.queueStartTime);
            if (this.webserver.restartQueue && !!this.conn?.pclient) this.reconnect();
            else {
              this.state = 'connected';
              this.updateQueuePosition();
              this.logActivity('Queue is finished');
            }
          }
        }
    }
  }
}
