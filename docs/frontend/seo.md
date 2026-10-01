# SEO

Notes on how the site handles SEO through static generation.

## Pre-rendering

The entire site is pre-rendered via adapter-static. A single layout file enables this globally:

```ts
// src/routes/+layout.server.ts
export const prerender = true;
```

All data fetching and transformation happens in `+page.server.ts` load functions. These run at build
time, not in the browser. The output is plain HTML with all content baked in. No JavaScript is
required for crawlers to see the content.

The rule: if a crawler needs to see it, it goes in the server load function. Anything in `onMount`
or client-side fetch is invisible to crawlers.

### Navigation fetched at view time

The sidebar's PCD entity names are not in the prerendered HTML. The root layout fetches
`/pcd/{database}/nav.json` after mount and fills the groups in. Crawlers never saw those names as
links anyway (groups render collapsed), and every entity page is reachable through its list page,
which is prerendered with a link to each entity. Keeping the index out of page data saves about 55
KB on each of the 4,500 PCD pages. Without JavaScript the sidebar shows the seven group links and
the list pages still work.

### Locale-dependent text

Pre-rendered HTML carries whatever the build machine produced. Text that depends on the visitor's
locale, such as `DateTime` in its `numeric` format, is rendered once at build time with the build
machine's locale and then patched by Svelte during hydration to match the visitor. Crawlers see the
build machine's version, which is why any such element must also expose a locale-independent value:
`DateTime` always sets an ISO `datetime` attribute. Keep locale-dependent formatting out of titles,
descriptions, and other metadata, which are never re-rendered.

## Dynamic Routes

Routes with parameters (e.g. `/wiki/[slug]`) need SvelteKit to know which pages to generate. Two
options:

- If the pages are linked from a pre-rendered index page, SvelteKit's crawler discovers them
  automatically.
- If not linked from anywhere, export an `entries()` function in `+page.server.ts` that returns all
  valid parameter values.

Links rendered only after client interaction, such as items inside a collapsed navigation group, are
not visible to the prerender crawler. These routes must use explicit entries. CI compares the
compiled PCD navigation data with the generated HTML so missing pages fail lint.

## URL Structure

URLs follow the sidebar nesting. Docs pages live at the site root with no `/docs` prefix, and a page
listed under another page in the sidebar sits under that page's URL, so moving a page to another
section changes its URL. Dev logs and wiki articles have their own top-level sections, and the PCD
browser stays under `/pcd/<database>`. The PCD branch shows each page's index status (see
[Indexing](#indexing)) and a sample title; `+` marks Markdown mirrors.

```
/                                         home page                       + /index.md
├── quick-start
├── installation
│   ├── docker
│   ├── authentication
│   ├── reverse-proxy
│   │   └── traefik
│   └── backups
├── build
│   ├── databases
│   ├── local-changes
│   ├── regular-expressions
│   ├── custom-formats
│   ├── quality-profiles
│   ├── media-management
│   ├── delay-profiles
│   └── maintaining-a-database
├── test
│   ├── regular-expressions
│   ├── custom-formats
│   └── quality-profiles
├── deploy
│   ├── arr-instances
│   ├── sync
│   ├── drift
│   ├── cleanup
│   ├── upgrades
│   └── renames
├── monitoring
│   ├── jobs
│   ├── notifications
│   ├── logs
│   └── announcements
├── faq
├── community
├── contributing
├── sponsor
├── api
│   └── v1                                                                + /api/v1.md
│       ├── {tag}.md
│       └── {tag}/{op}.md
├── dev-logs                                                              + /dev-logs.md
│   ├── profilarr-v2
│   ├── donuts
│   ├── show-your-work
│   ├── mutable-immutability
│   ├── workflowd
│   └── rebirth
├── wiki                                                                  + /wiki.md
│   ├── anatomy-of-a-profile
│   ├── multi-episode-splitting
│   ├── edition-philosophy
│   ├── eei
│   └── gppi
├── pcd
│   └── dictionarry                       not indexed   Dictionarry | Profilarr
│       ├── quality-profiles              not indexed   Quality Profiles | Profilarr
│       │   └── 1080p-balanced            indexed       Quality Profile: 1080p Balanced | Profilarr
│       ├── custom-formats                not indexed   Custom Formats | Profilarr
│       │   └── 1080p-balanced-tier-1     not indexed   Custom Format: 1080p Balanced Tier 1 | Profilarr
│       ├── regular-expressions           not indexed   Regular Expressions | Profilarr
│       │   └── 0bsidian                  not indexed   Regular Expression: 0BSiDiAN | Profilarr
│       ├── delay-profiles                not indexed   Delay Profiles | Profilarr
│       │   └── radarr                    not indexed   Delay Profile: Radarr | Profilarr
│       ├── naming                        not indexed   Naming | Profilarr
│       │   └── radarr/radarr             not indexed   Naming: Radarr | Profilarr
│       ├── media-settings                not indexed   Media Settings | Profilarr
│       │   └── radarr/radarr             not indexed   Media Settings: Radarr | Profilarr
│       ├── quality-definitions           not indexed   Quality Definitions | Profilarr
│       │   └── radarr/radarr             not indexed   Quality Definitions: Radarr | Profilarr
│       └── nav.json
├── search-index
│   ├── core.json
│   ├── {database}.json
│   └── query-ratings.json
├── sitemap.xml
├── robots.txt
└── llms.txt
```

Moved pages are not redirected. Their old URLs return 404, and Google drops a previously indexed URL
from its index once a recrawl returns a 4xx status.

## Meta Tags

All meta tags are rendered by the `SEO` component (`src/lib/client/ui/utils/SEO.svelte`). Every page
must use it. The component handles the canonical URL, `<title>`, description, theme-color, Open
Graph, and Twitter Card tags via `<svelte:head>`. Canonical URLs use the public site origin and the
current pathname, excluding query parameters and fragments.

The public origin comes from the build-time `PUBLIC_SITE_URL` environment variable. Development
defaults to `http://localhost:5173` and accepts the same variable as an override. Production builds
require the variable and reject values that are not plain HTTP or HTTPS origins.

```svelte
<SEO
	title="Installation"
	description="How to install Profilarr." />
```

| Prop          | Type     | Required | Default                      |
| ------------- | -------- | -------- | ---------------------------- |
| `title`       | `string` | yes      |                              |
| `description` | `string` | no       | Site-wide default            |
| `image`       | `string` | no       | GitHub-hosted `icon.png` URL |
| `markdown`    | `string` | no       |                              |

`app.html` contains only structural head elements (charset, viewport, favicon links, manifest).
Social and SEO meta tags live exclusively in the `SEO` component to avoid duplicates.

The `og:image` and `twitter:image` must be absolute URLs.

Pages pass a bare `title`. The component renders the document `<title>` as `{title} | Profilarr`, so
searches for "profilarr" plus a topic match every page; the home page passes `Profilarr` itself and
gets it unsuffixed. Open Graph and Twitter titles stay bare, since `og:site_name` carries
"Profilarr" separately. The default description is Profilarr's own: "Configuration management
platform for Radarr and Sonarr."

PCD entity detail pages put the entity type in front of the name: `{Type}: {Name}`, rendered as
`Quality Profile: 1080p Balanced | Profilarr`. Entity names alone repeat across types (Dictionarry
has a Radarr delay profile, naming config, media settings, and quality definitions), and the type
keeps each title distinct. The types are Quality Profile, Custom Format, Regular Expression, Delay
Profile, Naming, Media Settings, and Quality Definitions. The database name is left out to keep
titles short. Production builds only the Dictionarry database, so titles stay unique there; a local
build with several databases repeats titles such as `Naming: Radarr`. The database landing page and
list pages keep their bare titles (`Quality Profiles | Profilarr`).

The home page also gets `WebSite` structured data (JSON-LD naming the site "Profilarr" at the site
origin), which Google uses for the site name shown above search results.

`markdown` is the site-relative path of the page's Markdown version (for example `/api/v1.md`). When
set, the component adds `<link rel="alternate" type="text/markdown">` pointing at it; see
[backend/llm.md](../backend/llm.md#discovery).

For mdsvex content, frontmatter provides the title and description. The layout component should
handle rendering the `SEO` component automatically so content authors only write frontmatter.

## Sitemap

`/sitemap.xml` is a prerendered route (`src/routes/(meta)/sitemap.xml/+server.ts`) listing every
HTML page: the static pages, docs pages without `lastmod` since they carry no date, dev logs and
wiki articles with their publish date as `lastmod`, and the PCD quality profile pages. PCD pages
that are not indexed (see [Indexing](#indexing)) are left out. Quality profile pages take `lastmod`
from the history replay, the date of the last commit that touched the profile, so crawlers re-fetch
pages that actually changed. Artifact routes (`.md`, `.yaml`, `.json`) are alternate representations
and are not listed. `robots.txt` is also a route so its `Sitemap:` line carries the configured site
origin. Entry building lives in `src/lib/shared/utils/seo/sitemap.ts` and the XML rendering in
`src/lib/shared/utils/seo/xml.ts`.

## Indexing

Every HTML page is indexed except most of the PCD browser. In `/pcd`, only the quality profile
detail pages are indexed. The database landing page, all seven list pages (the quality profiles list
included), and the detail pages of every other entity type render
`<meta name="robots" content="noindex">` and are left out of the sitemap. They stay prerendered and
linked, so visitors and the site's own search still reach them. The URL Structure tree marks each
PCD page's status.

Pages are kept out with the `noindex` tag, not `robots.txt`. Google finds pages through links as
well as the sitemap, so leaving a page out of the sitemap does not keep it out of the index, and a
page blocked in `robots.txt` cannot be crawled, so Google never reads its `noindex` and can still
list the URL.

The JSON endpoints (`/search-index/*.json`, `/pcd/<database>/nav.json`) need no handling. Google
does not index JSON, they are not in the sitemap, and only client code fetches them.

## Validation

The custom `require-seo` lint rule verifies that every route renders metadata through either the
`SEO` component directly or the approved `ListPage` composition. Run it with:

```bash
pnpm lint:seo
```

The complete custom lint framework and its other project-specific checks are documented in
[Linting](../tooling/lint.md).
