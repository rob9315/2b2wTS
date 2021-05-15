import { Proxy } from './proxy';
import dtenv from 'dotenv';
import readline from 'readline';
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
async function question(text: string): Promise<string> {
  return new Promise((resolve) => rl.question(text, resolve));
}

const { error } = dtenv.config();
if (!!error) {
  console.error(error);
  process.exit(1);
}

const proxy = new Proxy(JSON.parse(process.env['NODE_CONFIG'] as string));

(async () => {
  while (true) console.log(proxy.command(await question('$ ')));
})();
