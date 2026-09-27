import type { CodeExample, MarkdownColumn, TreeNode } from '$lib/shared/utils/llm/components.js';

// Component data for the Docker page. The page renders it and the Markdown
// mirror serializes it, so both show the same thing.

export const install: CodeExample[] = [
	{
		title: 'Docker Compose',
		language: 'yaml',
		code: `services:
  profilarr:
    image: ghcr.io/dictionarry-hub/profilarr:latest
    container_name: profilarr
    restart: unless-stopped
    ports:
      - '6868:6868'
    volumes:
      - ./config:/config
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=Etc/UTC
      # Uncomment if you use a reverse proxy.
      # - ORIGIN=https://profilarr.example.com
      - PARSER_HOST=parser
      - PARSER_PORT=5000
    depends_on:
      parser:
        condition: service_healthy

  # Optional, only needed for custom format and quality profile testing.
  parser:
    image: ghcr.io/dictionarry-hub/profilarr-parser:latest
    container_name: profilarr-parser
    restart: unless-stopped
    expose:
      - '5000'`
	},
	{
		title: 'docker run',
		language: 'sh',
		code: `docker network create profilarr

# Optional, only needed for custom format and quality profile testing.
docker run -d \\
  --name profilarr-parser \\
  --network profilarr \\
  --restart unless-stopped \\
  ghcr.io/dictionarry-hub/profilarr-parser:latest

docker run -d \\
  --name profilarr \\
  --network profilarr \\
  --restart unless-stopped \\
  -p 6868:6868 \\
  -v "$(pwd)/config:/config" \\
  -e PUID=1000 \\
  -e PGID=1000 \\
  -e TZ=Etc/UTC \\
  -e PARSER_HOST=profilarr-parser \\
  -e PARSER_PORT=5000 \\
  ghcr.io/dictionarry-hub/profilarr:latest`
	}
];

export const configTree: TreeNode[] = [
	{
		name: 'config',
		children: [
			{
				name: 'backups',
				note: 'Backup archives',
				children: [{ name: 'backup-2026-09-27-043000.tar.gz' }]
			},
			{
				name: 'data',
				children: [
					{
						name: 'databases',
						note: 'A Git clone of each linked database',
						children: [{ name: '<id>', children: [] }]
					},
					{ name: 'profilarr.db', note: 'Settings, Arr instances, and linked databases' }
				]
			},
			{
				name: 'logs',
				note: 'One log file per day',
				children: [{ name: '2026-09-27.log' }]
			}
		]
	}
];

export const idExample: CodeExample[] = [
	{
		title: 'Terminal',
		language: 'sh',
		code: `$ id
uid=1000(you) gid=1000(you) groups=1000(you)`
	}
];

export const nonRootExample: CodeExample[] = [
	{
		title: 'compose.yml',
		language: 'yaml',
		code: `services:
  profilarr:
    image: ghcr.io/dictionarry-hub/profilarr:latest
    user: '1000:1000'
    # ...`
	}
];

type HealthCheck = {
	container: string;
	check: string;
	every: string;
};

export const healthChecks: HealthCheck[] = [
	{
		container: 'Profilarr',
		check: '/api/v1/health',
		every: '30 seconds, after a 10 second start period'
	},
	{
		container: 'Parser',
		check: '/health',
		every: '30 seconds, after a 5 second start period'
	}
];

export const healthCheckColumns: MarkdownColumn<HealthCheck>[] = [
	{ key: 'container', header: 'Container' },
	{ key: 'check', header: 'Check', markdown: (row) => `\`${row.check}\`` },
	{ key: 'every', header: 'Every' }
];

export const dockerPsExample: CodeExample[] = [
	{
		title: 'Terminal',
		language: 'sh',
		code: `$ docker ps --format "table {{.Names}}\\t{{.Status}}"
NAMES              STATUS
profilarr          Up 2 hours (healthy)
profilarr-parser   Up 2 hours (healthy)`
	}
];

export const updateByHand: CodeExample[] = [
	{
		title: 'Docker Compose',
		language: 'sh',
		code: `docker compose pull
docker compose up -d`
	},
	{
		title: 'docker run',
		language: 'sh',
		code: `docker pull ghcr.io/dictionarry-hub/profilarr:latest
docker stop profilarr
docker rm profilarr

# Then run your original docker run command again.
# Repeat for profilarr-parser if you use it.`
	}
];

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
