import type { CodeExample } from '$lib/shared/utils/llm/components.js';

// Component data for the Quick Start page. The page renders it and the
// Markdown mirror serializes it, so both show the same thing.

// The smallest compose that runs Profilarr. The Docker page has the full one,
// with the parser and reverse proxy settings.
export const install: CodeExample[] = [
	{
		title: 'compose.yml',
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
      - TZ=Etc/UTC`
	}
];
