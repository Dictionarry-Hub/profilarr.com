export interface FileEntry {
	path: string;
	content: string;
}

export interface Violation {
	rule: string;
	file: string;
	message: string;
	line?: number;
	column?: number;
	/** Overrides the rule's severity for this violation. */
	severity?: 'error' | 'warn';
}

export interface LintRule {
	name: string;
	description: string;
	category: string;
	severity: 'error' | 'warn';
	files: string;
	check(files: FileEntry[]): Violation[];
}
