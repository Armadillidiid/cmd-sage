import { codeToANSI } from "@shikijs/cli";
import { Effect } from "effect";

/**
 * Highlights shell command using shiki
 */
export const highlightShell = (command: string) =>
	Effect.promise(() => codeToANSI(command, "sh", "github-dark-default"));

/**
 * Highlights markdown using shiki
 */
export const highlightMarkdown = (markdown: string) =>
	Effect.promise(() => codeToANSI(markdown, "markdown", "github-dark-default"));
