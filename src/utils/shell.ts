import * as os from "node:os";

export const detectShell = (): string => {
	const p = os.platform();

	if (p === "win32") {
		if (process.env.PSModulePath) {
			return "powershell";
		}
		const comspec = process.env.COMSPEC || process.env.ComSpec;
		if (comspec) {
			return comspec.split(/[\\/]/).pop() || "cmd";
		}
		return "cmd";
	}

	// Unix-like systems
	const shell = process.env.SHELL || "/bin/sh";
	const shellName = shell.split("/").pop() || "unknown";

	if (process.env.ZSH_NAME || process.env.ZSH_VERSION) return "zsh";
	if (process.env.BASH_VERSION) return "bash";
	if (process.env.FISH_VERSION) return "fish";

	return shellName;
};
