import { DateTime } from 'luxon';
import { readFile, readFileSync, writeFile, appendFile } from 'fs';
import { get } from 'https';
import rl from 'readline';
//@ts-ignore (no type definitions)
import everpolate from 'everpolate';

import type { Proxy } from './proxy';

//amount of premium players assumed on average in queue? maybe...
const c = 150;

// helper interface for chat commands
export const rlIf = rl.createInterface({
  input: process.stdin,
  output: process.stdout,
});
export async function question(text: string): Promise<string> {
  return new Promise((resolve) => rlIf.question(text, resolve));
}

let queueData = JSON.parse(readFileSync('queue.json', 'utf-8'));

export async function expandQueueData(place: number, time: DateTime) {
  readFile('queue.json', 'utf-8', (err, data) => {
    logErrorIfExists(err);
    let queueData = JSON.parse(data);
    queueData.place.push(place);
    let b = Math.pow((0 + c) / (place + c), 1 / (time.diffNow().milliseconds / 1000));
    queueData.factor.push(b);
    writeFile('queue.json', JSON.stringify(queueData), 'utf-8', logErrorIfExists);
  });
}
export function setETA(this: Proxy) {
  let totalWaitTime = getWaitTime(this.queueStartPlace as number, 0);
  let timePassed = getWaitTime(this.queueStartPlace as number, this.webserver.queuePlace as number);
  let ETA = (totalWaitTime - timePassed) / 60;
  this.webserver.ETA = `${Math.floor(ETA / 60)}h ${Math.floor(ETA % 60)}m`;
  this.logActivity(`P: ${this.webserver.queuePlace} E: ${this.webserver.ETA}`);
  //todo add notifications
}
export function getWaitTime(queueLength: number, queuePos: number) {
  let b = everpolate.linear(queueLength, queueData.place, queueData.factor)[0];
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
