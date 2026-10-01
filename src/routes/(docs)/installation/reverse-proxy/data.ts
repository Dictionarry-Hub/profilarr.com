import type { MarkdownColumn } from '$lib/shared/utils/llm/components.js';

// Component data for the Reverse Proxies page. The page renders it and the
// Markdown mirror serializes it, so both show the same thing.

type Requirement = {
	requirement: string;
	/** A variable named after `requirement`, linked to its docs, and the text
	    that follows it. */
	variable?: { name: string; href: string; after: string };
	why: string;
	without: string;
	seeAlso?: { label: string; href: string };
};

export const requirements: Requirement[] = [
	{
		requirement: 'Set',
		variable: {
			name: 'ORIGIN',
			href: '/installation#authentication',
			after: 'to the address you open Profilarr at'
		},
		why: "Profilarr only accepts forms submitted from its own address. The proxy talks to Profilarr over plain HTTP, so without ORIGIN, Profilarr thinks its address starts with http:// and rejects your browser's https:// forms.",
		without: 'Pages load, but every form fails with "Request blocked: origin mismatch".'
	},
	{
		requirement: 'Use one address',
		why: 'ORIGIN holds one address, and Profilarr only accepts forms submitted from that address.',
		without:
			'Pages load at other addresses, like http://192.168.1.10:6868, but every form fails there.',
		seeAlso: { label: '#927', href: 'https://github.com/Dictionarry-Hub/profilarr/issues/927' }
	},
	{
		requirement: 'Use a subdomain',
		why: 'Every link and request Profilarr makes points at the root of its address.',
		without: 'Pages break in a folder like example.com/profilarr.',
		seeAlso: { label: '#245', href: 'https://github.com/Dictionarry-Hub/profilarr/issues/245' }
	},
	{
		requirement: "Don't buffer `/jobs/events`, and allow more than 30 seconds between messages",
		why: 'Profilarr streams job progress from `/jobs/events` and sends a message every 30 seconds to keep the stream open.',
		without: "Job progress doesn't update while a job runs."
	},
	{
		requirement: 'Accept uploads up to 1 GB, and give them time to finish',
		why: 'You can upload backups of up to 1 GB.',
		without: 'Backup uploads fail with "Failed to upload backup".'
	}
];

export const requirementColumns: MarkdownColumn<Requirement>[] = [
	{
		key: 'requirement',
		header: 'Requirement',
		markdown: (row) =>
			row.variable
				? `${row.requirement} [\`${row.variable.name}\`](${row.variable.href}) ${row.variable.after}`
				: row.requirement
	},
	{ key: 'why', header: 'Why' },
	{
		key: 'without',
		header: 'Without it',
		markdown: (row) =>
			row.seeAlso
				? `${row.without} See [${row.seeAlso.label}](${row.seeAlso.href}).`
				: row.without
	}
];

type Guide = {
	proxy: string;
	description: string;
	status: 'Available' | 'Not written';
	href?: string;
};

export const guides: Guide[] = [
	{
		proxy: 'Traefik',
		description:
			'Configures itself from labels on your Docker containers. Recommended if you run Profilarr with Docker.',
		status: 'Available',
		href: '/installation/reverse-proxy/traefik'
	},
	{
		proxy: 'Caddy',
		description: 'Gets and renews HTTPS certificates automatically, with a short config file.',
		status: 'Not written'
	},
	{
		proxy: 'nginx',
		description:
			'A general-purpose web server. This guide also covers SWAG and Nginx Proxy Manager, which run nginx underneath.',
		status: 'Not written'
	}
];

export const guideColumns: MarkdownColumn<Guide>[] = [
	{
		key: 'proxy',
		header: 'Proxy',
		markdown: (row) => (row.href ? `[${row.proxy}](${row.href})` : row.proxy)
	},
	{ key: 'description', header: 'Description' },
	{ key: 'status', header: 'Status' }
];
