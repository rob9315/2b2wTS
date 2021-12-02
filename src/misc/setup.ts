import { p } from './util';
import { ProxyOptions } from './config';
import { writeFile, mkdirSync, exists } from 'fs';
import merge from 'deepmerge';
import { util as cfgutil } from 'config';

const q = (questionString: string, prevOption: string, blankStringValid?: boolean, stars?: number | boolean) => {
  console.log(`${questionString}${blankStringValid ? '' : ` [${!!stars ? censor(prevOption, typeof stars === 'number' ? stars : undefined) : prevOption}]`}`);
  let answer = p('> ', !stars ? {} : { echo: '*' });
  return answer === '' && !blankStringValid ? prevOption : answer;
};



// bool check
const bool = (x: string | boolean) => typeof x == 'boolean' || !!x.match(/^([YNyn]|yes|no|true|false)$/);

// number check
const num = (x: string | number) => typeof x == 'number' || !isNaN(Number(x));

// int check
const int = (x: string | number) => !isNaN(Number(x)) && Number.isInteger(Number(x));

// check prompt (repeats until true)
const cp = <T>(check: (x: string | T) => boolean, ask: string, value: T, options = {}) => {
  let x;
  do {
    console.log(ask);
    x = p('> ', value as unknown as string, options);
    x = x === '' ? value : x;
  } while (!check(x));
  return x;
};

// bool prompt
const b = (ask: string, value: boolean, options: import('prompt-sync').Option = {}) => isTrue(cp(bool, `${ask} ${value ? '[Y|n]' : '[y|N]'}`, value, options));

// number prompt
const n = (ask: string, value: number, options: import('prompt-sync').Option = {}) => Number(cp(num, `${ask} [${value}]`, value, options));

// integer prompt
const i = (ask: string, value: number, options: import('prompt-sync').Option = {}) => Number(cp(int, `${ask} [${value}]`, value, options));

const censor = (string: string, amount?: number) => (!!amount ? string.substring(0, string.length > amount ? amount : string.length) + (string.length > amount ? '*'.repeat(string.length - amount - 1) : '') : '*'.repeat(string.length));

const isTrue = (input: string | undefined | boolean) => (typeof input == 'boolean' ? input : ['y', 'ye', 'yes', 't', 'tr', 'tru', 'true', '1'].includes(input?.toLowerCase() ?? ''));

const undefinedIfNone = <T extends string | string[]>(string: T) => (string.length === 0 ? undefined : string);

const displayObject = (obj: any, ...toCensor: (string | undefined)[]) => {
  let str = JSON.stringify(obj, undefined, 2);
  toCensor.forEach((string) => (str = string ? str.replace(string, censor(string)) : str));
  console.clear();
  console.log(str === 'null' ? 'disabled' : str);
};

export const allDefaults = new ProxyOptions(true);
export const defaultOptions = new ProxyOptions();

export async function setup(config?: ProxyOptions) {
  (defaultOptions.antiafk as any).actions = [];
  config = merge(defaultOptions, config ?? {});
  displayObject(config.mcclient, config.mcclient.password);
  if (b('Do you want to basic setup?', JSON.stringify(config.mcclient) == JSON.stringify(allDefaults.mcclient))) {
    config.mcclient.username = q('Please enter your minecraft email (or username if offline)', config.mcclient.username ?? 'user@example.com');
    config.mcclient.password = config.mcclient.username.match(/.+@.+\..+/) ? q('Please enter your minecraft password', config.mcclient.password ?? 'password', undefined, true) : undefined;
    config.mcclient.auth = config.mcclient.username.match(/.+@.+\..+/) ? (q('Which kind of account is this ("mojang" or "microsoft")', config.mcclient.auth ?? 'mojang') === 'microsoft' ? 'microsoft' : 'mojang') : undefined;
  } else {
  if (b('Do you want to edit the mcclient/user account options?', JSON.stringify(config.mcclient) == JSON.stringify(allDefaults.mcclient))) {
    config.mcclient.username = q('Please enter your minecraft email (or username if offline)', config.mcclient.username ?? 'user@example.com');
    config.mcclient.password = config.mcclient.username.match(/.+@.+\..+/) ? q('Please enter your minecraft password', config.mcclient.password ?? 'password', undefined, true) : undefined;
    config.mcclient.auth = config.mcclient.username.match(/.+@.+\..+/) ? (q('Which kind of account is this ("mojang" or "microsoft")', config.mcclient.auth ?? 'mojang') === 'microsoft' ? 'microsoft' : 'mojang') : undefined;
    config.mcclient.host = q('Enter the host you want to connect to', config.mcclient.host ?? (allDefaults.mcclient.host as string));
    config.mcclient.port = config.mcclient.host === allDefaults.mcclient.host ? 25565 : i('Enter the port you want to connect to', config.mcclient.port ?? (allDefaults.mcclient.port as number));
    config.mcclient.version = config.mcclient.host !== '2b2t.org' ? q('Please enter the version you want to connect as', config.mcclient.version ?? (allDefaults.mcclient.version as string)) : (allDefaults.mcclient.version as string);
  }
  displayObject(config.mcserver);
  if (b('Do you want to edit the mcserver options?', false)) {
    config.mcserver['online-mode'] = config.mcclient.username.match(/.+@.+\..+/) ? b('Do you want to enable the whitelist? (only your account will be able to join, you will have to be logged in)', config.mcserver['online-mode'] ?? (allDefaults.mcserver['online-mode'] as boolean)) : (allDefaults.mcserver['online-mode'] as boolean);
    config.mcserver.host = q('Please enter the hostname you want to host 2b2w on', config.mcserver.host ?? (allDefaults.mcserver.host as string));
    config.mcserver.port = i('Please enter the port you want to host 2b2w on', config.mcserver.port ?? (allDefaults.mcserver.port as number));
  }
  //TODO change next line after adding multi-version support to mcproxy
  config.mcserver.version = config.mcserver.version;
  displayObject(config.webserver);
  if (b('Do you want to change the webserver options?', false))
    config.webserver = b('Do you want to host the web-interface?', !!config.webserver ?? !!allDefaults.webserver)
      ? {
          host: q('Please enter the host you want to host the web-interface on', `${config.webserver?.host ?? allDefaults.webserver?.host}`),
          port: i('Please enter the port you want to host the web-interface on', config.webserver?.port ?? (allDefaults.webserver?.port as number)),
          password: undefinedIfNone(q('If you want to have a password for the web-interface, enter it here. Otherwise leave this blank.', config.webserver?.password ?? '', true)),
        }
      : null;
  displayObject(config.discord, config.discord?.token);
  if (b('Do you want to change the discord options?', false))
    config.discord = b('Do you want to use the discord bot?', !!config.discord ?? !!allDefaults.discord)
      ? {
          token: q('Enter your discord bot Token. (more information on how to get one at https://github.com/rob9315/2b2wts/blob/master/README.md)', config.discord?.token ?? '', undefined, 15),
          status: b('Do you want the status of the discord bot to be set to the current queue progress?', !!(config.discord?.status ?? allDefaults.discord?.status)),
          commands: b('Do you want the bot to react to commands?', !!(config.discord?.commands ?? allDefaults.discord?.commands))
            ? {
                prefix: q('Please enter a prefix, can also be blank', config.discord?.commands?.prefix ?? (allDefaults.discord?.commands?.prefix as string), true),
                allowedIds: undefinedIfNone(
                  q('Enter the whitelisted discord user ids. Separate them with a comma or leave blank for no whitelist. (more information at https://github.com/rob9315/2b2wts/blob/master/README.md)', String(config.discord?.commands?.allowedIds ?? ''), true)
                    .replace(' ', '')
                    .split(',')
                ),
              }
            : undefined,
        }
      : null;
  displayObject(config.antiafk);
  if (b('Do you want to change the antiAFK options?', false))
    config.antiafk = b("Do you want to enable antiAFK?, It can keep you logged in longer while you aren't connected with your minecraft client.", !!config.antiafk)
      ? {
          ...(b('Do you want to enable autoEat?', !!(config.antiafk?.autoEatEnabled ?? allDefaults.antiafk?.autoEatEnabled))
            ? {
                autoEatEnabled: true,
                autoEatConfig: {
                  priority: q('What do you want to prioritize? ("saturation" or "foodPoints")', `${config.antiafk?.autoEatConfig?.priority ?? allDefaults.antiafk?.autoEatConfig?.priority}`) as 'saturation' | 'foodPoints',
                  startAt: n('Which Hunger Point value do want to start eating from?', config.antiafk?.autoEatConfig?.startAt ?? (allDefaults.antiafk?.autoEatConfig?.startAt as number)),
                  bannedFood: undefinedIfNone(
                    q("Enter the banned Foods, which shouldn't be used to regenerate food points. Separate them with a comma or leave blank for no blacklist. (more information at https://github.com/rob9315/2b2wts/blob/master/README.md)", String(config.antiafk?.autoEatConfig?.bannedFood ?? ''))
                      .replace(' ', '')
                      .split(',')
                      .filter((x) => x != '')
                  ),
                },
              }
            : { autoEatEnabled: false }),
          ...(b('Do you want to enable AFK chatting?', !!config.antiafk?.chatting)
            ? {
                chatting: true,
                chatInterval: n('Enter the interval between messages (in ms)', config.antiafk?.chatInterval ?? (allDefaults.antiafk?.chatInterval as number)),
                chatMessages: undefinedIfNone(
                  q('Enter the messages the bot should send while AFK. Separate them with a comma. (more information at https://github.com/rob9315/2b2wts/blob/master/README.md)', config.antiafk?.chatMessages ? String(config.antiafk?.chatMessages) : '', true)
                    .split(',')
                    .filter((x) => x != '')
                ),
              }
            : { chatting: false }),
          fishing: b('Do you want to enable AFK fishing?', !!config.antiafk?.fishing),
          minWalkingTime: n('Enter the minimum walking time (ms)', config.antiafk?.minWalkingTime as number),
          maxWalkingTime: n('Enter the maximum walking time (ms)', config.antiafk?.maxWalkingTime as number),
          minActionsInterval: n('Enter the minimum actions interval (ms)', config.antiafk?.minActionsInterval as number),
          maxActionsInterval: n('Enter the maximum actions interval (ms)', config.antiafk?.maxActionsInterval as number),
          killauraEnabled: b('Do you want to enable KillAura while AFK?', !!config.antiafk?.killauraEnabled),
          actions: undefinedIfNone(
            q(`Enter the actions to do while AFK (and not fishing), more information on this option here: https://github.com/etiaro/mineflayer-antiafk#actions. Separate them with a comma. (more information at https://github.com/rob9315/2b2wts/blob/master/README.md)`, config.antiafk?.actions ? String(config.antiafk?.actions) : '')
              .replace(' ', '')
              .split(',')
              .filter((x) => x != '')
          ),
          breaking: undefinedIfNone(
            q(`Enter the IDs of blocks which are allowed to be broken while AFK, more information on this option here: https://github.com/etiaro/mineflayer-antiafk#breaking. Separate them with a comma. (more information at https://github.com/rob9315/2b2wts/blob/master/README.md)`, config.antiafk?.breaking ? String(config.antiafk?.breaking) : '')
              .replace(' ', '')
              .split(',')
              .filter((x) => x != '')
          )?.map((s) => Number(s)),
          placing: undefinedIfNone(
            q(`Enter the IDs of blocks which are allowed to be placed while AFK, more information on this option here: https://github.com/etiaro/mineflayer-antiafk#placing. Separate them with a comma. (more information at https://github.com/rob9315/2b2wts/blob/master/README.md)`, config.antiafk?.placing ? String(config.antiafk?.placing) : '')
              .replace(' ', '')
              .split(',')
              .filter((x) => x != '')
          )?.map((s) => Number(s)),
        }
      : null;
  displayObject(config.extra);
  if (b('Do you want to change any of the extraOptions?', false))
    config.extra = {
      reconnect: b('Do you want to reconnect if an error occurred? (for example after a server restart)', !!(config.extra?.reconnect ?? allDefaults.extra?.reconnect))
        ? {
            timeout: n('Enter a custom timeout after which to attempt a reconnection (in ms)', config.extra?.reconnect?.timeout ?? (allDefaults.extra?.reconnect?.timeout as number)),
          }
        : null,
      console: b('Do you want the program to print to and react to commands from console?', !!(config.extra?.console ?? allDefaults.extra?.console)),
      // expandQueueData: isTrue(await configQuestion('Do you want to expand the queue data? This can improve the accuracy of the time estimate', `${config.extra?.expandQueueData ?? (allDefaults.extra?.expandQueueData as boolean)}`)),
      logging: b('Do you want the program to log the chat output to file?', !!(config.extra?.logging ?? allDefaults.extra?.logging))
        ? {
            maxLines: n('Amount of lines in the logs to keep, set to 0 for infinite', config.extra?.logging?.maxLines ?? (allDefaults.extra?.logging?.maxLines as number)),
          }
        : null,
      expandQueueData: b('Do you want to expand the Queue Data? Can improve ETA accuracy.', !!config.extra?.expandQueueData ?? allDefaults.extra?.expandQueueData),
      //TODO add more
    };
  };
  config.extensions = undefined;
  displayObject(config, config.mcclient.password, config.discord?.token);
  let diff = cfgutil.diffDeep(new ProxyOptions(), config);
  if (diff !== {} && b('Do you want to save your configuration?', true)) await new Promise((resolve) => `${exists('config', (bool) => (bool ? undefined : mkdirSync('config')))}` && writeFile('config/local.json', JSON.stringify(diff, null, 2), resolve));
  console.clear();
  return config;
}
