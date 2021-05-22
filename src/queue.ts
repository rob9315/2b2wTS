import { readFile, readFileSync, writeFileSync } from 'fs';
import { logErrorIfExists } from './util';
//@ts-ignore
import everpolate from 'everpolate';

import type { DateTime } from 'luxon';
import type { Proxy } from './proxy';

export type QueueData = [number[], number[]];

export const newQueueData = () => [[], []] as QueueData;

const posArr: number[] = [
  ...[1, 2, 4, 8],
  ...','
    .repeat(30)
    .split(',')
    .map((val, index, arr: any) => (arr[index] = (index + 1) * 16)),
];

export const c = 150;

const average = (array: number[]) => array.reduce((a, b) => a + b) / array.length;

export let multiQueueData: QueueData[];
export let averageQueueData = getQueueData();

function toPosArrValues([position, exponent]: QueueData, index: number) {
  multiQueueData[index] = newQueueData();
  posArr.forEach((pos) => {
    multiQueueData[index][0].push(pos);
    multiQueueData[index][1].push(everpolate.polynomial(pos, position, exponent));
  });
}

function getQueueData() {
  let averageQueueData = newQueueData();
  if (multiQueueData === undefined) {
    multiQueueData = [];
    JSON.parse(readFileSync('queue.json', 'utf-8')).forEach(toPosArrValues);
  }
  multiQueueData[0][0].forEach((position, index) => {
    let exponents: number[] = [];
    multiQueueData.forEach(([pos, exponent]) => exponents.push(exponent[index]));
    averageQueueData[0][index] = average(exponents);
    averageQueueData[1][index] = position;
  });
  return averageQueueData;
}

export async function saveCurrentQueueData(this: Proxy) {
  if (!!this.queueData)
    switch (this.webserver.queuePlace) {
      case 'None':
        break;
      case 'FINISHED':
        expandQueueData(this.queueData);
        break;
      default:
        this.queueData[0].push(this.webserver.queuePlace);
        this.queueData[1].push(Math.pow((0 + c) / (this.webserver.queuePlace + c), 1 / ((this.queueStartTime as DateTime).diffNow().milliseconds / 1000)));
        break;
    }
}

// old method for adding to the queue data, though it didn't help increase accuracy, it only broke stuff.
export async function expandQueueData(newQueueData: QueueData) {
  readFile('queue.json', 'utf-8', (err, data) => {
    logErrorIfExists(err);
    let multiQueueData: QueueData[] = [];
    let queueDataArr: QueueData[] = JSON.parse(data);
    queueDataArr.forEach(toPosArrValues);
    toPosArrValues(newQueueData, queueDataArr.length);
    writeFileSync('queue.json', JSON.stringify(multiQueueData), 'utf-8');
    averageQueueData = getQueueData();
  });

  // readFile('queue.json', 'utf-8', (err, data) => {
  // logErrorIfExists(err);
  // let queueData = JSON.parse(data);
  // queueData.place.push(place);
  // let b = Math.pow((0 + c) / (place + c), 1 / (time.diffNow().milliseconds / 1000));
  // queueData.factor.push(b);
  // writeFile('queue.json', JSON.stringify(queueData), 'utf-8', logErrorIfExists);
  // });
}
