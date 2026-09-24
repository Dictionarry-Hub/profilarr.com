const STORAGE_KEY = 'pcd-database';

export const DATABASES = [
	{ id: 'dictionarry', name: 'Dictionarry' },
	{ id: 'trash', name: 'TRaSH' },
	{ id: 'trash-french', name: 'TRaSH French' },
	{ id: 'trash-german', name: 'TRaSH German' },
	{ id: 'dumpstarr', name: 'Dumpstarr' }
] as const;

export type DatabaseId = (typeof DATABASES)[number]['id'];

const DEFAULT: DatabaseId = DATABASES[0].id;

const validIds = new Set<string>(DATABASES.map((d) => d.id));

let current = $state<DatabaseId>(DEFAULT);

function isValidId(id: string): id is DatabaseId {
	return validIds.has(id);
}

function set(id: DatabaseId) {
	current = id;
	localStorage.setItem(STORAGE_KEY, id);
}

// `available` is the set of databases this build compiled. A stored choice
// outside it (e.g. from a build with more databases) falls back to the first
// available one.
function init(available: readonly string[]) {
	const stored = localStorage.getItem(STORAGE_KEY);
	if (stored && isValidId(stored) && available.includes(stored)) {
		current = stored;
	} else {
		current = DATABASES.find((entry) => available.includes(entry.id))?.id ?? DEFAULT;
	}
}

function syncFromUrl(pathname: string): boolean {
	const match = pathname.match(/^\/pcd\/([^/]+)/);
	if (match && isValidId(match[1])) {
		set(match[1]);
		return true;
	}
	return false;
}

function isPcdRoute(pathname: string): boolean {
	return pathname.startsWith('/pcd/');
}

export const database = {
	get current() {
		return current;
	},
	set,
	init,
	syncFromUrl,
	isPcdRoute,
	isValidId,
	DATABASES
};
