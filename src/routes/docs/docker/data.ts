import type { CodeExample } from '$lib/shared/utils/llm/components.js';

// Component data for the Docker page. The page renders it and the Markdown
// mirror serializes it, so both show the same thing.

export const watchtowerCompose: CodeExample[] = [
	{
		title: 'compose.yml',
		language: 'yaml',
		code: `services:
  profilarr:
    image: ghcr.io/dictionarry-hub/profilarr:latest
    container_name: profilarr
    # ...

  profilarr-parser:
    image: ghcr.io/dictionarry-hub/profilarr-parser:latest
    container_name: profilarr-parser
    # ...

  watchtower:
    image: nickfedor/watchtower
    container_name: watchtower
    restart: unless-stopped
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    command: profilarr profilarr-parser`
	}
];

export const scheduledPull: CodeExample[] = [
	{
		title: 'crontab',
		language: 'sh',
		code: `0 4 * * * cd /path/to/profilarr && docker compose pull && docker compose up -d`
	}
];

export const renovateImage: CodeExample[] = [
	{
		title: 'compose.yml',
		language: 'yaml',
		code: `image: ghcr.io/dictionarry-hub/profilarr:develop@sha256:<digest>`
	}
];

export const renovateRule: CodeExample[] = [
	{
		title: 'renovate.json',
		language: 'json',
		code: `{
  "packageRules": [
    {
      "matchPackageNames": [
        "ghcr.io/dictionarry-hub/profilarr",
        "ghcr.io/dictionarry-hub/profilarr-parser"
      ],
      "groupName": "Profilarr"
    }
  ]
}`
	}
];
