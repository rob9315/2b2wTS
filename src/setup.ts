import * as util from './util';
import { ProxyOptions } from './config';
import { writeFile, mkdirSync, exists } from 'fs';
import merge from 'deepmerge';
import { util as cfgutil } from 'config';

const configQuestion = async (questionString: string, prevOption: string, blankStringValid?: boolean, stars?: number | boolean) => {
  let answer = await util.question(`${questionString}${blankStringValid ? '' : ` [${!!stars ? starString(prevOption, typeof stars === 'number' ? stars : undefined) : prevOption}]`}\n> `);
  return answer === '' && !blankStringValid ? prevOption : answer;
};

const starString = (string: string, amount?: number) => (!!amount ? string.substring(0, string.length > amount ? amount : string.length) + (string.length > amount ? '*'.repeat(string.length - amount - 1) : '') : '*'.repeat(string.length));

const isTrue = (string: string | undefined) => ['y', 'yes', 'true'].includes(string?.toLowerCase() ?? '');

const undefinedIfNone = <T extends string | string[]>(string: T) => (string.length === 0 ? undefined : string);

const displayObject = (obj: any, ...toCensor: (string | undefined)[]) => {
  let str = JSON.stringify(obj, undefined, 2);
  toCensor.forEach((string) => (str = string ? str.replace(string, starString(string)) : str));
  console.clear();
  console.log(str === 'null' ? 'disabled' : str);
};

export const allDefaults = new ProxyOptions(true);
export const defaultOptions = new ProxyOptions();

export async function setup(config?: ProxyOptions) {
  config = merge(defaultOptions, config ?? {});
  displayObject(config.mcclient, config.mcclient.password);
  if (isTrue(await configQuestion('Do you want to edit the mcclient/user account options?', `${false}`))) {
    config.mcclient.username = await configQuestion('Please enter your minecraft email (or username if offline)', config.mcclient.username ?? 'user@example.com');
    config.mcclient.password = config.mcclient.username.match(/.+@.+\..+/) ? await configQuestion('Please enter your minecraft password', config.mcclient.password ?? 'password', undefined, true) : undefined;
    config.mcclient.host = await configQuestion('Enter the host you want to connect to', config.mcclient.host ?? (allDefaults.mcclient.host as string));
    config.mcclient.port = Number(config.mcclient.host === allDefaults.mcclient.host ? 25565 : await configQuestion('Enter the port you want to connect to', `${config.mcclient.port ?? (allDefaults.mcclient.port as number)}`));
    config.mcclient.version = config.mcclient.host !== '2b2t.org' ? await configQuestion('Please enter the version you want to connect as', config.mcclient.version ?? (allDefaults.mcclient.version as string)) : (allDefaults.mcclient.version as string);
  }
  displayObject(config.mcserver);
  if (isTrue(await configQuestion('Do you want to edit the mcserver options?', `${false}`))) {
    config.mcserver['online-mode'] = config.mcclient.username.match(/.+@.+\..+/) ? isTrue(await configQuestion('Do you want to enable the whitelist? (only your account will be able to join, you will have to be logged in)', `${config.mcserver['online-mode'] ?? (allDefaults.mcserver['online-mode'] as boolean)}`)) : (allDefaults.mcserver['online-mode'] as boolean);
    config.mcserver.host = await configQuestion('Please enter the hostname you want to host 2b2w on', config.mcserver.host ?? (allDefaults.mcserver.host as string));
    config.mcserver.port = Number(await configQuestion('Please enter the port you want to host 2b2w on', `${config.mcserver.port ?? (allDefaults.mcserver.port as number)}`));
  }
  //TODO change next line after adding multi-version support to mcproxy
  config.mcserver.version = config.mcserver.version;
  displayObject(config.webserver);
  if (isTrue(await configQuestion('Do you want to change the webserver options?', `${false}`)))
    config.webserver = isTrue(await configQuestion('Do you want to host the web-interface?', `${!!config.webserver ?? !!allDefaults.webserver}`))
      ? {
          host: await configQuestion('Please enter the host you want to host the web-interface on', `${config.webserver?.host ?? allDefaults.webserver?.host}`),
          port: Number(await configQuestion('Please enter the port you want to host the web-interface on', `${config.webserver?.port ?? allDefaults.webserver?.port}`)),
          password: undefinedIfNone(await configQuestion('If you want to have a password for the web-interface, enter it here. Otherwise leave this blank.', config.webserver?.password ?? '', true)),
        }
      : null;
  displayObject(config.discord, config.discord?.token);
  if (isTrue(await configQuestion('Do you want to change the discord options?', `${false}`)))
    config.discord = isTrue(await configQuestion('Do you want to use the discord bot?', `${!!config.discord ?? !!allDefaults.discord}`))
      ? {
          token: await configQuestion('Enter your discord bot Token. (more information on how to get one at https://github.com/rob9315/2b2wts/blob/master/README.md)', config.discord?.token ?? '', undefined, 15),
          status: isTrue(await configQuestion('Do you want the status of the discord bot to be set to the current queue progress?', `${config.discord ? config.discord.status : (allDefaults.discord?.status as boolean)}`)),
          commands: isTrue(await configQuestion('Do you want the bot to react to commands?', `${config.discord ? !!config.discord.commands : !!(allDefaults.discord?.commands as {})}`))
            ? {
                prefix: await configQuestion('Please enter a prefix, can also be blank', config.discord?.commands?.prefix ?? (allDefaults.discord?.commands?.prefix as string), true),
                allowedIds: undefinedIfNone((await configQuestion('Enter the whitelisted discord user ids. Separate them with a comma or leave blank for no whitelist. (more information at https://github.com/rob9315/2b2wts/blob/master/README.md)', config.discord?.commands?.allowedIds ? String(config.discord?.commands?.allowedIds) : '', true)).replace(' ', '').split(',')),
              }
            : undefined,
        }
      : null;
  displayObject(config.extra);
  if (isTrue(await configQuestion('Do you want to change any of the extraOptions?', `${false}`)))
    config.extra = {
      reconnect: isTrue(await configQuestion('Do you want to reconnect if an error occurred? (for example after a server restart)', `${config.extra ? !!config.extra.reconnect : (!!allDefaults.extra?.reconnect as {})}`))
        ? {
            timeout: Number(await configQuestion('Enter a custom timeout after which to attempt a reconnection (in ms)', `${config.extra?.reconnect?.timeout ?? (allDefaults.extra?.reconnect?.timeout as number)}`)),
          }
        : null,
      console: isTrue(await configQuestion('Do you want the program to print to and react to commands from console?', `${config.extra?.console ?? (allDefaults.extra?.console as boolean)}`)),
      // expandQueueData: isTrue(await configQuestion('Do you want to expand the queue data? This can improve the accuracy of the time estimate', `${config.extra?.expandQueueData ?? (allDefaults.extra?.expandQueueData as boolean)}`)),
      logging: isTrue(await configQuestion('Do you want the program to log the chat output to file?', `${!!config.extra?.logging ?? !!(allDefaults.extra?.logging as {})}`))
        ? {
            maxLines: Number(await configQuestion('Amount of lines in the logs to keep, leave blank for no limit', `${config.extra?.logging?.maxLines ?? (allDefaults.extra?.logging?.maxLines as number)}`, true)),
          }
        : null,
      expandQueueData: isTrue(await configQuestion('Do you want to expand the Queue Data? Can improve ETA accuracy.', `${config.extra?.expandQueueData ?? allDefaults.extra?.expandQueueData}`)),
      //TODO add more
    };
  displayObject(config, config.mcclient.password, config.discord?.token);
  let diff = cfgutil.diffDeep(new ProxyOptions(), config);
  if (diff !== {} && isTrue(await util.question('Do you want to save your configuration?\n> '))) await new Promise((resolve) => `${exists('config', (bool) => (bool ? undefined : mkdirSync('config')))}` && writeFile('config/local.json', JSON.stringify(diff, null, 2), resolve));
  console.clear();
  return config;
}
