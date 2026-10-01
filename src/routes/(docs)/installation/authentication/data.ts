import type { MarkdownColumn } from '$lib/shared/utils/llm/components.js';

// Component data for the Authentication page. The page renders it and the
// Markdown mirror serializes it, so both show the same thing.

type StartupError = {
	cause: string;
	error: string;
	fix: string;
	seeAlso?: { label: string; href: string };
};

export const startupErrors: StartupError[] = [
	{
		cause: 'Only some of the OIDC variables are set',
		error: 'OIDC is partially configured',
		fix: 'Set all three or remove all three. A missing secret file leaves its variable unset.'
	},
	{
		cause: 'AUTH=oidc is set without any OIDC variables',
		error: 'AUTH=oidc requires OIDC_DISCOVERY_URL, OIDC_CLIENT_ID, OIDC_CLIENT_SECRET.',
		fix: 'Set the three variables.'
	},
	{
		cause: "SSO accounts exist, the OIDC variables are gone, and there's no password account",
		error: 'SSO accounts exist but the OIDC_* settings are missing',
		fix: 'Restore the OIDC variables.',
		seeAlso: {
			label: 'Password and SSO Together',
			href: '/installation/authentication#password-and-sso-together'
		}
	},
	{
		cause: 'PROFILARR_API_KEY is shorter than 32 characters',
		error: 'PROFILARR_API_KEY must be at least 32 characters long',
		fix: 'Use a longer key.'
	}
];

export const startupErrorColumns: MarkdownColumn<StartupError>[] = [
	{ key: 'error', header: 'Error', markdown: (row) => `\`${row.error}\`` },
	{ key: 'cause', header: 'Cause' },
	{
		key: 'fix',
		header: 'Fix',
		markdown: (row) =>
			row.seeAlso ? `${row.fix} See [${row.seeAlso.label}](${row.seeAlso.href}).` : row.fix
	}
];
