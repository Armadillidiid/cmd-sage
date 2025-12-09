import { Args, Command, Options, Prompt } from "@effect/cli";
import { Console, Effect, Layer, Option } from "effect";
import { AiService } from "@/services/ai.js";
import { ConfigService } from "@/services/config.js";
import type { SuggestAction } from "@/types.js";
import { handleAction } from "@/utils/actions.js";

const programLayer = Layer.mergeAll(AiService.Default, ConfigService.Default);

const targetChoices = ["shell", "git"] as const;

const target = Options.choice("target", targetChoices).pipe(
	Options.withAlias("t"),
	Options.withDefault(targetChoices[0]),
);

const prompt = Args.optional(Args.text({ name: "prompt" }));

const actionChoices: Array<{ title: string; value: SuggestAction }> = [
	{ title: "Run", value: "run" },
	{ title: "Revise", value: "revise" },
	{ title: "Explain", value: "explain" },
	{ title: "Copy", value: "copy" },
	{ title: "Cancel", value: "cancel" },
];

const suggestCommand = Command.make(
	"suggest",
	{
		target: target,
		prompt: prompt,
	},
	({ target, prompt }: { target: string; prompt: Option.Option<string> }) =>
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
		const initialCommand = yield* ai.suggest(target, userPrompt);
		yield* Console.log(`\n${initialCommand}\n`);

		// Get default action from config
		const configService = yield* ConfigService;
		const config = yield* configService.config();
      const defaultAction = config?.defaultSuggestAction;


		yield* Effect.iterate(
			{ command: initialCommand, shouldContinue: true },
			{
				while: (state) => state.shouldContinue,
				body: (state) =>
					Effect.gen(function* () {
						const action: SuggestAction = defaultAction
							? defaultAction
							: yield* Prompt.select({
									message: "What would you like to do?",
									choices: actionChoices,
								});

						const [continueLoop, newCommand] = yield* handleAction(
							action,
							state.command,
							target,
							userPrompt,
						);

							return {
								command: newCommand ?? state.command,
								shouldContinue: continueLoop,
							};
						}),
				},
			);
		}).pipe(Effect.provide(programLayer)),
);

export { suggestCommand };
