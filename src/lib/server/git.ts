import { execFileSync } from 'node:child_process';

// The last commit to touch each source file, from git at build time. Builds
// without full history get nothing rather than something wrong: in a shallow
// clone every file's last commit is the one commit the clone has.

function git(args: string[]): string | undefined {
	try {
		return execFileSync('git', args, {
			encoding: 'utf8',
			stdio: ['ignore', 'pipe', 'ignore']
		}).trim();
	} catch {
		return undefined;
	}
}

let history: boolean | undefined;

function hasHistory(): boolean {
	history ??= git(['rev-parse', '--is-shallow-repository']) === 'false';
	return history;
}

export interface Commit {
	hash: string;
	/** ISO commit date. */
	date: string;
}

const cache = new Map<string, Commit | undefined>();

/** The last commit that touched `path` (relative to the repo root), or
    undefined without full git history or any commit for it. */
export function lastCommit(path: string): Commit | undefined {
	if (!hasHistory()) return undefined;
	if (!cache.has(path)) {
		const [hash, date] = git(['log', '-1', '--format=%H %cI', '--', path])?.split(' ') ?? [];
		cache.set(path, hash && date ? { hash, date } : undefined);
	}
	return cache.get(path);
}
