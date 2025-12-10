import { Effect } from "effect";
import { StreamError } from "@/lib/errors.js";

/**
 * Consumes a text stream and displays it in real-time
 */
export const displayStream = <R>(
	stream: { textStream: AsyncIterable<string>; fullText: Promise<string> },
	highlighter: (text: string) => Effect.Effect<string, never, R>,
) =>
	Effect.gen(function* () {
		// Save cursor position
		yield* Effect.sync(() => {
			globalThis.process.stdout.write("\x1b[s");
		});

		const streamData = yield* Effect.tryPromise({
			try: async () => {
				let accumulated = "";
				for await (const chunk of stream.textStream) {
					accumulated += chunk;
					// Display chunk immediately for real-time feedback
					globalThis.process.stdout.write(chunk);
				}
				return accumulated;
			},
			catch: (error) =>
				new StreamError({
					message: "Failed to consume text stream",
					cause: error,
				}),
		});

		const highlighted = yield* highlighter(streamData);

		// Restore cursor to the saved position
		globalThis.process.stdout.write("\x1b[u");
		// Clear from cursor to end of screen
		globalThis.process.stdout.write("\x1b[J");

		globalThis.process.stdout.write(highlighted);

		return streamData;
	});
