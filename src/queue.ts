import { readFile, readFileSync, writeFileSync } from 'fs';
import { logErrorIfExists } from './util';
//@ts-ignore (no type definitions)
import everpolate from 'everpolate';

import type { DateTime } from 'luxon';
import type { Proxy } from './proxy';

export type QueueData = [position: number[], exponent: number[]];

export const newQueueData = () => [[], []] as QueueData;

const posArr: number[] = [
  ...[1, 2, 4, 8],
  ...','
    .repeat(30)
    .split(',')
    .map((val, index, arr: any) => (arr[index] = (index + 1) * 32)),
];

export const c = 150;

const average = (array: number[]) => array.reduce((a, b) => a + b) / array.length;

export const linear = <T extends number[], K extends number[]>(x: number | K, knownX: T, knownY: T): K => {
  knownX.push(knownX[knownX.length - 1] + (knownX[0] > knownX[1] ? -1 : 1));
  knownY.push(knownY[knownY.length - 1]);
  knownX.unshift(knownX[0] + (knownX[0] < knownX[1] ? -1 : 1));
  knownY.unshift(knownY[0]);
  return everpolate.linear(x, knownX, knownY);
};

export let multiQueueData: QueueData[];
export let averageQueueData = getQueueData();

function toPosArrValues(queueData: QueueData, index: number) {
  multiQueueData[index] = newQueueData();
  multiQueueData[index][0] = posArr;
  multiQueueData[index][1] = linear(posArr, ...queueData);
}

function getQueueData() {
  let averageQueueData = newQueueData();
  if (multiQueueData === undefined) {
    multiQueueData = [];
    JSON.parse(readFileSync('queue.json', 'utf-8')).forEach(toPosArrValues);
  }
  posArr.forEach((position, index) => {
    let exponents: number[] = [];
    multiQueueData.forEach((queueData) => exponents.push(queueData[1][index]));
    averageQueueData[0][index] = position;
    averageQueueData[1][index] = average(exponents);
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

export async function expandQueueData(newQueueData: QueueData) {
  readFile('queue.json', 'utf-8', (err, data) => {
    logErrorIfExists(err);
    let queueDataArr: QueueData[] = JSON.parse(data);
    queueDataArr.forEach(toPosArrValues);
    toPosArrValues(newQueueData, queueDataArr.length);
    writeFileSync('queue.json', JSON.stringify(multiQueueData), 'utf-8');
    averageQueueData = getQueueData();
  });
}
