import rl from 'readline';

const prompt: import('prompt-sync').Prompt = require('prompt-sync')();

// helper function for inputs during the setup
export const p = (ask: string, value: unknown, options?: import('prompt-sync').Option) => {
  let s = ask.split('\n'),
    p = s.pop() as string;
  s.length > 0 && console.log(s.join('\n'));
  return prompt(p, value as string, options ?? {});
};

// helper interface for terminal inputs while the program is running
export const rlIf = rl.createInterface({ input: process.stdin, output: process.stdout });
export async function question(text: string): Promise<string> {
  return new Promise((resolve) => rlIf.question(text, resolve));
}

// export function timeStringtoDateTime(time: string) {
//   let starttime = time.split(' ')[1].split(':');
//   let startdt = DateTime.local().set({ hour: Number(starttime[0]), minute: Number(starttime[1]), second: 0, millisecond: 0 });
//   if (startdt.toMillis() < DateTime.local().toMillis()) startdt = startdt.plus({ days: 1 });
//   return startdt;
// }

// logging
// export async function log(this: any, message: string) {
//   let time = DateTime.now().toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS);
//   process.stdout.write(`\x1B[F\n[${time}] ${message}\n$ ${rlIf.line}`);
//   if (this?.options?.config?.logging) appendFile('.2bored2wait', `[${time}] ${message}`, () => {});
// }
// export function logActivity(this: Proxy, message: string) {
//   log(message);
//   this.discord?.user?.setActivity(message);
//   this.server.motd = message;
// }
// export function logErrorIfExists(err?: Error | string | null) {
//   if (!!err) log(String(err));
// }

// export async function getQueueLength(): Promise<number | 'None'> {
//   return new Promise((resolve) => {
//     get('https://2b2t.io/api/queue')
//       .on('error', logErrorIfExists)
//       .on('response', (resp) => {
//         let data = '';
//         resp.on('data', (chunk) => {
//           data += chunk;
//         });
//         resp.on('end', () => {
//           let parsedData = JSON.parse(data);
//           resolve(parsedData[0][1] === 'None' ? 'None' : parsedData[0][1]);
//         });
//       });
//   });
// }

// https://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex#6969486
export const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
