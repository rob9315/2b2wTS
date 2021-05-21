import { DateTime } from 'luxon';
import { readFile, readFileSync, writeFile, appendFile } from 'fs';
import { get } from 'https';
import rl from 'readline';
//@ts-ignore (no type definitions)
import everpolate from 'everpolate';

import type { Proxy } from './proxy';


// helper interface for chat commands
export const rlIf = rl.createInterface({ input: process.stdin, output: process.stdout });
export async function question(text: string): Promise<string> {
  return new Promise((resolve) => rlIf.question(text, resolve));
}

export function setETA(this: Proxy) {
  let totalWaitTime = getWaitTime(this.queueStartPlace as number, 0);
  let timePassed = getWaitTime(this.queueStartPlace as number, (this.webserver.queuePlace === 'None' ? this.queueStartPlace : this.webserver.queuePlace) as number);
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

// static data for queue Length calculation
const c = 150;
const queueData = {
  place: [826, 789, 758, 666, 586, 550, 506, 486, 418, 412, 257, 231, 207, 93],
  factor: [0.9999473463335498, 0.9999462301738332, 0.9999440195022513, 0.9999410569845172, 0.999938895110192, 0.9999337457796981, 0.9999291667668093, 0.9999279556964097, 0.9999262577896301, 0.9999234240704379, 0.9999220416881794, 0.9999219189483673, 0.9999168965649361, 0.9998618838664679],
};

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

// old method for adding to the queue data, though it didn't help increase accuracy, it only broke stuff.
// export async function expandQueueData(place: number, time: DateTime) {
//   readFile('queue.json', 'utf-8', (err, data) => {
//     logErrorIfExists(err);
//     let queueData = JSON.parse(data);
//     queueData.place.push(place);
//     let b = Math.pow((0 + c) / (place + c), 1 / (time.diffNow().milliseconds / 1000));
//     queueData.factor.push(b);
//     writeFile('queue.json', JSON.stringify(queueData), 'utf-8', logErrorIfExists);
//   });
// }
