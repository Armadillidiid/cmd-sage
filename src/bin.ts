#!/usr/bin/env node

import * as NodeContext from "@effect/platform-node/NodeContext";
import * as NodeRuntime from "@effect/platform-node/NodeRuntime";
import { Effect, Layer, Console } from "effect";
import { CliService } from "./cli.js";

const layers = Layer.mergeAll(CliService.Default, NodeContext.layer);

Effect.gen(function* () {
  const cli = yield* CliService;
  yield* cli.run(process.argv);
}).pipe(
  Effect.catchTags({
    QuitException: () =>
      Console.log("\n\n❌ Operation cancelled by user.\n").pipe(Effect.asVoid),
  }),
  Effect.provide(layers),
  NodeRuntime.runMain(),
);
