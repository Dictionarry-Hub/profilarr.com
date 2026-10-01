import type { CodeExample, MarkdownColumn } from '$lib/shared/utils/llm/components.js';

// Component data for the Installation page. The page renders it and the
// Markdown mirror serializes it, so both show the same thing.

type Method = {
	method: string;
	runsOn: string;
	status: string;
	href?: string;
};

type Channel = {
	tag: string;
	description: string;
};

type EnvVar = {
	variable: string;
	default: string;
	description: string;
	dockerOnly?: boolean;
	/** Short link shown instead of a long default value. */
	defaultLabel?: string;
	defaultHref?: string;
	seeAlso?: { label: string; href: string };
};

export const methods: Method[] = [
	{
		method: 'Docker',
		runsOn: 'Any Docker host, amd64 or arm64',
		status: 'Available',
		href: '/installation/docker'
	},
	{
		method: 'Unraid',
		runsOn: 'Unraid, from Community Applications',
		status: 'Available',
		href: '/installation/docker#unraid'
	},
	{ method: 'Windows binary', runsOn: 'Windows', status: 'Planned' },
	{ method: 'macOS binary', runsOn: 'macOS', status: 'Planned' },
	{ method: 'Linux binary', runsOn: 'Linux', status: 'Planned' }
];

export const methodColumns: MarkdownColumn<Method>[] = [
	{
		key: 'method',
		header: 'Method',
		markdown: (row) => (row.href ? `[${row.method}](${row.href})` : row.method)
	},
	{ key: 'runsOn', header: 'Runs on' },
	{ key: 'status', header: 'Status' }
];

export const channels: Channel[] = [
	{ tag: 'latest', description: 'The newest stable release, including future major versions.' },
	{
		tag: '2',
		description: 'The newest stable release within v2. It never moves to a new major version.'
	},
	{ tag: '2.1.0', description: 'One specific release. It never updates.' },
	{
		tag: 'develop',
		description: 'Pre-release builds still being tested. Not guaranteed to be stable.'
	}
];

export const channelColumns: MarkdownColumn<Channel>[] = [
	{ key: 'tag', header: 'Tag', markdown: (row) => `\`${row.tag}\`` },
	{ key: 'description', header: 'What you get' }
];

export const envGeneral: EnvVar[] = [
	{
		variable: 'PUID',
		default: '1000',
		description: 'User ID that Profilarr runs as. Its config folder is owned by this user.',
		dockerOnly: true
	},
	{
		variable: 'PGID',
		default: '1000',
		description: 'Group ID that Profilarr runs as. Its config folder is owned by this group.',
		dockerOnly: true
	},
	{
		variable: 'UMASK',
		default: '022',
		description: 'File creation mask for files Profilarr writes.',
		dockerOnly: true
	},
	{
		variable: 'TZ',
		default: 'UTC',
		description: 'Timezone used for schedules, such as Australia/Adelaide.'
	},
	{ variable: 'PORT', default: '6868', description: 'Port the web UI listens on.' },
	{ variable: 'HOST', default: '0.0.0.0', description: 'Address the web UI binds to.' }
];

export const envAuth: EnvVar[] = [
	{
		variable: 'AUTH',
		default: 'on',
		description: 'Turns login on or off.',
		seeAlso: { label: 'Authentication', href: '/installation/authentication' }
	},
	{
		variable: 'OIDC_DISCOVERY_URL',
		default: '',
		description: 'Discovery URL of your OIDC provider.'
	},
	{
		variable: 'OIDC_CLIENT_ID',
		default: '',
		description: 'Client ID registered with your OIDC provider.'
	},
	{
		variable: 'OIDC_CLIENT_SECRET',
		default: '',
		description: 'Client secret registered with your OIDC provider.'
	},
	{
		variable: 'ORIGIN',
		default: '',
		description:
			'The URL you reach Profilarr at behind a reverse proxy, such as https://profilarr.example.com.',
		seeAlso: { label: 'Reverse Proxy', href: '/installation/reverse-proxy' }
	},
	{
		variable: 'PROFILARR_API_KEY',
		default: '',
		description: 'An API key with full access, for scripts and automated deployments.',
		seeAlso: { label: 'Authentication', href: '/installation/authentication' }
	}
];

export const envParser: EnvVar[] = [
	{
		variable: 'PARSER_HOST',
		default: 'localhost',
		description:
			'Host name of the parser service, such as its service name in your compose file.'
	},
	{ variable: 'PARSER_PORT', default: '5000', description: 'Port of the parser service.' }
];

export const envProxy: EnvVar[] = [
	{ variable: 'HTTPS_PROXY', default: '', description: 'Proxy for outbound https:// requests.' },
	{ variable: 'HTTP_PROXY', default: '', description: 'Proxy for outbound http:// requests.' },
	{
		variable: 'ALL_PROXY',
		default: '',
		description: 'Proxy for both http:// and https:// requests.'
	},
	{
		variable: 'NO_PROXY',
		default: '',
		description: 'Comma-separated hosts, IPs, or ranges that skip the proxy.'
	}
];

export const envAnnouncements: EnvVar[] = [
	{
		variable: 'PROFILARR_BULLETIN_URL',
		default: 'https://raw.githubusercontent.com/Dictionarry-Hub/bulletin/main',
		defaultLabel: 'Dictionarry-Hub/bulletin',
		defaultHref: 'https://github.com/Dictionarry-Hub/bulletin',
		description:
			'Where announcements and release information are fetched from. Only change it to point at a mirror.'
	}
];

export const envColumns: MarkdownColumn<EnvVar>[] = [
	{
		key: 'variable',
		header: 'Variable',
		markdown: (row) => `\`${row.variable}\`${row.dockerOnly ? ' (Docker only)' : ''}`
	},
	{
		key: 'default',
		header: 'Default',
		markdown: (row) => (row.default ? `\`${row.default}\`` : 'Not set')
	},
	{
		key: 'description',
		header: 'Description',
		markdown: (row) =>
			row.seeAlso
				? `${row.description} See [${row.seeAlso.label}](${row.seeAlso.href}).`
				: row.description
	}
];

export const proxyExample: CodeExample[] = [
	{
		title: 'compose.yml',
		language: 'yaml',
		code: `environment:
  - HTTPS_PROXY=http://user:pass@gluetun:8888
  - NO_PROXY=localhost,127.0.0.1,parser,radarr,sonarr`
	}
];

export const secretsExample: CodeExample[] = [
	{
		title: 'compose.yml',
		language: 'yaml',
		code: `environment:
  - OIDC_CLIENT_SECRET_FILE=/run/secrets/oidc_client_secret`
	}
];
