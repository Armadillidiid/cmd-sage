import { Effect } from "effect";
import { StreamError } from "@/lib/errors.js";

/**
 * NOTE: In-place text replacement only works when content fits within the terminal viewport.
 * When output exceeds terminal height, earlier lines scroll into the unreachable scrollback buffer,
 * making cursor-based replacement not to work as intended.
 */

/**
 * Minimum terminal width required for syntax highlighting replacement.
 * Below this width, we skip the cursor manipulation to avoid duplication issues.
 */
const MIN_TERMINAL_WIDTH = 80;

/**
 * Calculate the number of terminal lines a text string will occupy,
 * accounting for line wrapping based on terminal width.
 */
const calculateRenderedLines = (text: string): number => {
	const termWidth = globalThis.process.stdout.columns || 80;
	const lines = text.split("\n");
	let totalLines = 0;

	for (const line of lines) {
		// Remove ANSI escape codes to get actual visible character count
		// biome-ignore lint/suspicious/noControlCharactersInRegex: false positive
		const cleanLine = line.replace(/\x1b\[[0-9;]*m/g, "");
		const lineLength = cleanLine.length;
		// Each line takes at least 1 terminal line, plus additional lines if it wraps
		// If line is empty, it still takes 1 line
		const wrappedLines =
			lineLength === 0 ? 1 : Math.ceil(lineLength / termWidth);
		totalLines += wrappedLines;
	}

	return totalLines;
};

/**
 * Consumes a text stream and displays it in real-time
 */
export const displayStream = <R>(
	stream: { textStream: AsyncIterable<string>; fullText: Promise<string> },
	highlighter: (text: string) => Effect.Effect<string, never, R>,
) =>
	Effect.gen(function* () {
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

		// Only replace text with highlighted version if stdout is a TTY and terminal is wide enough
		// In non-TTY contexts (pipes, redirects) or narrow terminals, just append the highlighted version
		const termWidth = globalThis.process.stdout.columns || 80;
		const canReplace =
			globalThis.process.stdout.isTTY && termWidth >= MIN_TERMINAL_WIDTH;

		if (canReplace) {
			// Calculate how many terminal lines the streamed text occupied
			const numLines = calculateRenderedLines(streamData);

			// Move cursor up by (numLines - 1) because we're already on the last line
			// If text ends without a newline, cursor is on the last line with content
			// If text ends with a newline, cursor is on an empty line after content
			if (numLines > 1) {
				globalThis.process.stdout.write(`\x1b[${numLines - 1}A`);
			}

			// Move cursor to the beginning of the line
			globalThis.process.stdout.write("\r");
			// Clear from cursor to end of screen
			globalThis.process.stdout.write("\x1b[J");

			globalThis.process.stdout.write(highlighted);
		} else {
			// If not a TTY or terminal is too narrow, just output the highlighted text after the plain text
			// This happens when output is piped, redirected, or terminal width is below minimum
			globalThis.process.stdout.write("\n");
			globalThis.process.stdout.write(highlighted);
		}

		return streamData;
	});
