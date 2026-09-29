import type { CodeExample } from '$lib/shared/utils/llm/components.js';

// Component data for the Traefik page. The page renders it and the Markdown
// mirror serializes it, so both show the same thing.

export const compose: CodeExample[] = [
	{
		title: 'compose.yml',
		language: 'yaml',
		code: `services:
  profilarr:
    image: ghcr.io/dictionarry-hub/profilarr:latest
    container_name: profilarr
    restart: unless-stopped
    volumes:
      - ./config:/config
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=Etc/UTC
      - ORIGIN=https://profilarr.example.com
      - PARSER_HOST=parser
      - PARSER_PORT=5000
    networks:
      - default # Reaches the parser.
      - proxy # Reaches Traefik.
    labels:
      - traefik.enable=true # Opt this container in to Traefik.
      - traefik.docker.network=proxy # Without this, Traefik may pick another of Profilarr's networks and 502.
      - traefik.http.routers.profilarr.rule=Host(\`profilarr.example.com\`) # Must match ORIGIN.
      - traefik.http.routers.profilarr.entrypoints=websecure # HTTPS only.
      - traefik.http.routers.profilarr.tls.certresolver=letsencrypt # Gets the certificate.
      - traefik.http.services.profilarr.loadbalancer.server.port=6868 # Profilarr's port.
    depends_on:
      parser:
        condition: service_healthy

  # Not proxied: only Profilarr talks to the parser, and it has no login.
  parser:
    image: ghcr.io/dictionarry-hub/profilarr-parser:latest
    container_name: profilarr-parser
    restart: unless-stopped
    expose:
      - '5000'

networks:
  proxy:
    external: true`
	}
];

export const redirect: CodeExample[] = [
	{
		title: 'traefik.yml',
		language: 'yaml',
		code: `entryPoints:
  web:
    address: ':80'
    http:
      redirections:
        entryPoint:
          to: websecure
          scheme: https
  websecure:
    address: ':443'`
	}
];

export const forwardAuth: CodeExample[] = [
	{
		title: 'compose.yml',
		language: 'yaml',
		code: `    labels:
      # ...the labels from the example, plus:
      - traefik.http.routers.profilarr.middlewares=authelia@docker`
	}
];

export const apiRouter: CodeExample[] = [
	{
		title: 'compose.yml',
		language: 'yaml',
		code: `    labels:
      # ...the labels above, plus a second router without the middleware:
      - traefik.http.routers.profilarr-api.rule=Host(\`profilarr.example.com\`) && PathPrefix(\`/api/v1\`)
      - traefik.http.routers.profilarr-api.entrypoints=websecure
      - traefik.http.routers.profilarr-api.tls.certresolver=letsencrypt
      - traefik.http.routers.profilarr-api.service=profilarr`
	}
];

export const fileProvider: CodeExample[] = [
	{
		title: 'profilarr.yml',
		language: 'yaml',
		code: `http:
  routers:
    profilarr:
      rule: Host(\`profilarr.example.com\`)
      entryPoints:
        - websecure
      tls:
        certResolver: letsencrypt
      service: profilarr
  services:
    profilarr:
      loadBalancer:
        servers:
          - url: http://192.168.1.10:6868`
	}
];
