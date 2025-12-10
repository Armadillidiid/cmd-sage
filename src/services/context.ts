import * as os from "node:os";
import { Effect } from "effect";
import { detectShell } from "@/utils/shell.js";

const gatherContext = Effect.sync(() => {
	const platform = os.platform();
	const arch = os.arch();
	const shell = detectShell();

	return { platform, arch, shell };
});

const contextService = Effect.gen(function* () {
	const context = yield* gatherContext;

	return {
		context: () => Effect.succeed(context),
	};
});

export class ContextService extends Effect.Service<ContextService>()(
	"ContextService",
	{ effect: contextService },
) {}
