import { Args, Command, Options, Prompt } from "@effect/cli";
import { Console, Effect, Layer, Option } from "effect";
import { AiService } from "@/services/ai.js";

const programLayer = Layer.mergeAll(AiService.Default);

const targetChoices = ["shell", "git"] as const;

const target = Options.choice("target", targetChoices).pipe(
	Options.withAlias("t"),
	Options.withDefault(targetChoices[0]),
);

const prompt = Args.optional(Args.text({ name: "prompt" }));

const suggestCommand = Command.make(
	"suggest",
	{
		target: target,
		prompt: prompt,
	},
	({ target, prompt }) =>
		Effect.gen(function* () {
			const userPrompt = yield* Option.match(prompt, {
				onNone: () =>
					Prompt.text({
						message: `What ${target} command would you like?`,
						validate: (input) => {
							if (!input || input.trim().length === 0) {
								return Effect.fail("Prompt cannot be empty");
							}
							return Effect.succeed(input);
						},
					}),
				onSome: (p) => Effect.succeed(p),
			});

			const ai = yield* AiService;
			const res = yield* ai.suggest(target, userPrompt);
			yield* Console.log(`\n ${res}\n`);
		}).pipe(Effect.provide(programLayer)),
);

export { suggestCommand };
