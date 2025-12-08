import * as Command from "@effect/cli/Command";

declare const __VERSION__: string;
const VERSION: string =
  typeof __VERSION__ !== "undefined" ? __VERSION__ : "0.0.0-dev";

const command = Command.make("cmd-sage");

export const run = Command.run(command, {
  name: "cmd-sage",
  version: VERSION,
});
