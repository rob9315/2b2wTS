import { DateTime } from 'luxon';
import { appendFile } from 'fs';
import { get } from 'https';
import rl from 'readline';
//@ts-ignore (no type definitions)
import everpolate from 'everpolate';
import { averageQueueData, c } from './queue';

import type { Proxy } from './proxy';

// helper interface for chat commands
export const rlIf = rl.createInterface({ input: process.stdin, output: process.stdout });
export async function question(text: string): Promise<string> {
  return new Promise((resolve) => rlIf.question(text, resolve));
}

export function setETA(this: Proxy) {
  switch (this.state) {
    case 'queue':
      let totalWaitTime = getWaitTime(this.queueStartPlace as number, 0);
      let timePassed = getWaitTime(this.queueStartPlace as number, (this.webserver.queuePlace === 'None' ? this.queueStartPlace : this.webserver.queuePlace) as number);
      let ETA = (totalWaitTime - timePassed) / 60;
      this.webserver.ETA = `${Math.floor(ETA / 60)}h ${Math.floor(ETA % 60)}m`;
      this.logActivity(`P: ${this.webserver.queuePlace} E: ${this.webserver.ETA}`);
      //todo add notifications
      break;
    case 'connected':
    case 'antiafk':
      this.webserver.ETA = 'None';
      this.logActivity('Not Queuing');
    default:
      return;
  }
  this.saveCurrentQueueData();
}
export function getWaitTime(queueLength: number, queuePos: number) {
  let b = everpolate.linear(queueLength, ...averageQueueData)[0];
  return Math.log((queuePos + c) / (queueLength + c)) / Math.log(b); // see issue 141
}
export function timeStringtoDateTime(time: string) {
  let starttime = time.split(' ')[1].split(':');
  let startdt = DateTime.local().set({ hour: Number(starttime[0]), minute: Number(starttime[1]), second: 0, millisecond: 0 });
  if (startdt.toMillis() < DateTime.local().toMillis()) startdt = startdt.plus({ days: 1 });
  return startdt;
}

// logging
export async function log(this: any, message: string) {
  process.stdout.write(`\x1B[F\n${message}\n$ ${rlIf.line}`);
  if (this?.options?.config?.logging) appendFile('.2bored2wait', message, () => {});
}
export function logActivity(this: Proxy, message: string) {
  log(message);
  this.discord?.user?.setActivity(message);
  this.server.motd = message;
}
export function logErrorIfExists(err?: Error | null) {
  if (!!err) log(String(err));
}

export async function getQueueLength(): Promise<number | 'None'> {
  return new Promise((resolve) => {
    get('https://2b2t.io/api/queue')
      .on('error', logErrorIfExists)
      .on('response', (resp) => {
        let data = '';
        resp.on('data', (chunk) => {
          data += chunk;
        });
        resp.on('end', () => {
          let parsedData = JSON.parse(data);
          resolve(parsedData[0][1] === 'None' ? 'None' : parsedData[0][1]);
        });
      });
  });
}

// https://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex#6969486
export const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
