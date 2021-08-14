import {Proxy} from "./proxy.js";
import cfg from "config";
import {question} from "./util.js";
import {config} from "dotenv";
import {ProxyOptions} from "./config.js";
import merge from "deepmerge";
import {setup} from "./setup.js";
try {
  config();
} catch {
}
(async () => {
  if (process.argv.includes("config") || process.argv.includes("setup") || JSON.stringify(cfg) == "{}")
    Object.assign(cfg, merge(cfg, await setup(merge(new ProxyOptions(), cfg.util.toObject(cfg)))));
  if (process.argv.includes("config"))
    process.exit(0);
  const proxy = new Proxy(merge(new ProxyOptions(), cfg));
  while (true)
    console.log(await command(proxy, await question("$ ")));
})();
async function command(proxy, cmd) {
  switch (cmd?.split("0")[0]) {
    case null:
      break;
    case "exit":
      process.exit(0);
    default:
      break;
  }
}
