/**
 * bun run fault on <id> | off <id> | list | status | reset
 * Edits faults/active.json and appends to faults/LOG.md.
 */
import { appendFileSync } from "node:fs";
import { FAULTS } from "../faults/registry";

const activePath = new URL("../faults/active.json", import.meta.url).pathname;
const logPath = new URL("../faults/LOG.md", import.meta.url).pathname;
const ids = new Set<string>(FAULTS.map((f) => f.id));
const [cmd, id] = process.argv.slice(2);

const read = async (): Promise<string[]> => (await Bun.file(activePath).json()) as string[];
const write = (list: string[]) => Bun.write(activePath, JSON.stringify(list, null, 2) + "\n");
const git = (...args: string[]): string => {
  const r = Bun.spawnSync(["git", ...args], { cwd: new URL("..", import.meta.url).pathname });
  return r.exitCode === 0 ? r.stdout.toString().trim() : "";
};
const headSha = (): string => git("rev-parse", "--short", "HEAD") || "nogit";
// Line format: `- <ISO time> <action> <id> @<sha at toggle time>`
const log = (action: string, fid: string) =>
  appendFileSync(logPath, `- ${new Date().toISOString()} ${action} ${fid} @${headSha()}\n`);

const usage = () => {
  console.error("usage: bun run fault <on|off> <id> | list | status | reset");
  process.exit(2);
};

const current = await read();
switch (cmd) {
  case "on":
  case "off": {
    if (!id || !ids.has(id)) {
      console.error(`unknown fault id: ${id ?? "(none)"}. Run: bun run fault list`);
      process.exit(1);
    }
    const next = cmd === "on" ? [...new Set([...current, id])] : current.filter((x) => x !== id);
    if (next.length === current.length && cmd === "on" && current.includes(id)) {
      console.log(`${id} already on`);
      break;
    }
    if (cmd === "off" && !current.includes(id)) {
      console.log(`${id} already off`);
      break;
    }
    await write(next);
    log(cmd, id);
    console.log(`${cmd} ${id}. active: [${next.join(", ")}]`);
    break;
  }
  case "list":
    for (const f of FAULTS)
      console.log(
        `${current.includes(f.id) ? "[ON ] " : "[off] "}${f.id.padEnd(36)} ${f.severity.padEnd(6)} ${f.expectedRule}  ${f.title}`,
      );
    break;
  case "status": {
    if (!current.length) {
      console.log("healthy baseline: no active faults");
      break;
    }
    const lines = (await Bun.file(logPath).text()).split("\n");
    for (const fid of current) {
      const on = lines.filter((l) => new RegExp(`^- \\S+ on ${fid}( |$)`).test(l)).pop();
      const [, at, , , sha] = on?.match(/^- (\S+) (on) (\S+)(?: @(\S+))?/) ?? [];
      // The commit that deployed it: the first commit that put the id into active.json.
      const deployed = git(
        "log",
        "--reverse",
        "--format=%h %cI",
        `-S"${fid}"`,
        "--",
        "faults/active.json",
      ).split("\n")[0];
      console.log(
        `${fid}\n  switched on:   ${at ?? "(not in LOG.md)"} at ${sha ? `@${sha}` : "(no sha)"}\n  deploying commit: ${deployed || "(not committed yet: commit and push faults/active.json, then deploy)"}`,
      );
    }
    break;
  }
  case "reset": {
    for (const x of current) log("off", x);
    log("reset", `(${current.length} cleared)`);
    await write([]);
    console.log("reset: healthy baseline");
    break;
  }
  default:
    usage();
}
