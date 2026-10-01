# Content

Notes on the site's content layers and how data flows into pages.

## Content Types

The site has four content layers:

### Profilarr Documentation

Setup guides and user-facing documentation. Written as mdsvex markdown. Authored by hand.

Pages live in the `(docs)` route group at `src/routes/(docs)/<slug>/+page.svx` and render through
the `docs` mdsvex layout, which reuses `src/lib/layouts/Article.svelte`. A route group's name is not
part of the URL, so a page is served at `/<slug>`. The root page is the site's home page: it lives
at `src/routes/+page.svx`, is served at `/` with an empty slug, and is titled "Profilarr" so the
`SEO` component gives it the bare site name. There is no `/docs` page. Docs follow reading order
instead of publish date, so their frontmatter drops `created` and `tags`, makes `author` optional,
and adds `order` and `keywords`:

| Field      | Notes                                                                        |
| ---------- | ---------------------------------------------------------------------------- |
| `layout`   | `docs`                                                                       |
| `title`    | Display title and sidebar label                                              |
| `slug`     | Not set; derived from the route path, such as `installation/docker`          |
| `blurb`    | Short description; SEO meta, search blurb, artifact preamble                 |
| `order`    | Position among its siblings, ascending; pages without one sort last by title |
| `keywords` | Optional extra search terms that appear in no heading                        |
| `author`   | Optional GitHub profile URL (or list), shown in the page header              |
| `next`     | Optional list of docs slugs or site links to point readers at in the footer  |

A page with `next` set ends with a footer that links to those pages, as cards with each page's title
and blurb (`PageFooter` in `src/lib/client/ui/footer/`). An entry is a docs slug, or a link to
another page on the site written as `{ title, href, blurb }`, such as the database browser.
`docNext` in `src/lib/shared/utils/llm/docs.ts` resolves the entries and fails the build on an
unknown slug or a link that leaves the site. It runs in `src/routes/(docs)/+layout.server.ts`, which
reads the URL so each prerendered page carries only its own links, in `src/routes/+page.server.ts`
for the home page, and in the Markdown mirror route, which lists the same pages under a `## Next`
heading. `docsIndex` in `src/lib/server/docs.ts` holds every page's metadata for these lookups.
Pages without `next` have no footer.

Every docs page shows when its source last changed and links to where it can be edited. The page
header's meta row reads "Last updated" with the date, which links to the last commit that changed
the page on GitHub. The Actions menu gets an "Edit this page" item that opens the source file in
GitHub's editor. `docEditUrl` and `docSourcePath` in `src/lib/shared/utils/llm/docs.ts` build the
edit link, and `lastCommit` in `src/lib/server/git.ts` reads the last commit's hash and date from
`git log` at build time. `docSource` in `src/lib/server/docs.ts` puts them together for the page
loaders that resolve `next`. A build without full git history, like a shallow clone, gets no dates
rather than wrong ones, since every file's last commit there is the clone's one commit; the deploy
and the CI build check out with `fetch-depth: 0` for that reason. Content kept in a page's `data.ts`
doesn't change its date.

The Home section header links to the root page. Below it the sidebar lists the other top-level pages
in order above the API Reference, with icons keyed by slug in `src/routes/+layout.svelte`. URLs
follow the sidebar nesting: a page's route directory sits inside the route directory of the page it
is listed under, and a child page can have children of its own, as
`/installation/reverse-proxy/traefik` does. A page's parent is its slug minus the last segment
(`docParentSlug`), and `docTree` in `src/lib/shared/utils/llm/docs.ts` builds the nesting and fails
the build when a parent route has no page of its own. Moving a page to another section changes its
URL, and the old URL is not redirected (see [seo.md](../frontend/seo.md#url-structure)). The sidebar
nav, search index, sitemap, `llms.txt`, and the Markdown mirrors (`/index.md` for the root,
`/<slug>.md` for the rest) all glob the same two paths, `src/routes/+page.svx` and
`src/routes/?docs?/**/+page.svx`, where `?docs?` matches the `(docs)` folder without escaping its
parentheses, which Vite handles differently in dev and build. `docIndexEntry`, `docSlugFromPath`,
`docPath`, and `docMarkdownPath` in the same file map between source paths, slugs, and URLs. Titles
repeat across sections (Build and Test both have a Custom Formats page), so search results and the
document title put the parent's title in front of a child page's (`Test: Custom Formats`, built by
`docFullTitle`); the sidebar and page heading keep the short title. A page that embeds components
with data (AdaptiveList rows, CodeBlock examples) keeps that data in a `data.ts` next to its
`+page.svx`, so the Markdown mirror can serialize it (see
[llm.md](./llm.md#docs-dev-log-and-wiki-artifacts)).

### PCD Entity Browser

Browsable reference pages for PCD entities: quality profiles, custom formats, regular expressions,
delay profiles, and media management configs (naming, media settings, quality definitions). These
pages are generated at build time from PCD repositories.

Users select a database (e.g. Dictionarry, TRaSH, Dumpstarr) and browse its entities by type. The
database is part of the URL path (`/pcd/[database]/[entity-type]/[name]`) so every page is
independently crawlable.

Regular expression and custom format pages always render a Description section. When the source
entity has no description, the server load deterministically selects a type-specific fallback from
the entity name so prerendered output remains stable. Quality profile pages render the description
directly below the page header instead and omit it when the source entity has none.

Custom format pages also list the quality profiles that score them. References resolve shared and
application-specific scoring into effective Radarr and Sonarr scores and appear in both HTML and
Markdown representations. Quality profile pages resolve their own scoring the same way and list each
custom format with its effective scores, with a `FilterInput` over `name`, `tag`, `radarr`, and
`sonarr` and a sort menu beside it (Radarr score, Sonarr score, or name, either direction; Radarr
score highest first by default, with missing scores last). It appears in both HTML and Markdown
representations.

After Scoring, quality profile pages show a Qualities table in preference order, top first, as
stored: position, name, and items (a group's members, or the quality itself for a single quality).
Disabled entries have muted names and a disabled icon badge, and when upgrades are allowed the
upgrade-until entry carries an icon badge whose tooltip says upgrades continue until that quality or
group is reached. When only one entry is enabled, as in the Dictionarry profiles, an info callout
explains that custom formats usually separate qualities instead, linking to Scoring. Disabled
entries after the last enabled one are hidden behind a toggle, while disabled entries above it stay
in place. Only the entries a profile lists are shown, even though Profilarr fills in unlisted
qualities as disabled when it syncs.

Every detail page ends with a History section: one row per commit that touched the entity (commit
link, change title, date), expandable to the field-level diff and links to the other entities
changed in the same commit. History is compiled from the PCD repo's op log by the pipeline (see
[tooling/pcd.md](../tooling/pcd.md#history)) and appears in both HTML and Markdown representations.

The expanded diff is a list of one-line summaries, not raw fields.
`src/lib/shared/utils/pcd/history-view.ts` has a presenter per change shape that matters (profile
scoring, custom format conditions, regex patterns, profile qualities, tags, quality definition
tiers, and scalar fields), each writing a sentence like "Release Group coffee added" with entity
names as inline code, linked to their pages when they still exist. Plain text fields (regex
patterns, naming formats) carry a word-level inline diff when the edit is small, and a side-by-side
before and after when more than half the text changed, since a rewrite has nothing readable to diff.
Markdown fields (descriptions) are diffed block by block and rendered as markdown: unchanged
paragraphs render as they are, added and removed blocks are marked whole, and a paragraph edited in
place gets word-level highlights. Shapes without a presenter fall back to a line diff of the changed
subtree rendered as YAML, the same YAML the entity export view uses. Changes that display
identically before and after (a tier max size moving between two unlimited values) are hidden.

Seven entity types are browsable:

| Entity Type         | Route segment         | Arr-specific |
| ------------------- | --------------------- | ------------ |
| Quality Profiles    | `quality-profiles`    | No           |
| Custom Formats      | `custom-formats`      | No           |
| Regular Expressions | `regex`               | No           |
| Delay Profiles      | `delay-profiles`      | No           |
| Naming              | `naming`              | Yes          |
| Media Settings      | `media-settings`      | Yes          |
| Quality Definitions | `quality-definitions` | Yes          |

Arr-specific entities include the arr type in the URL: `/pcd/[database]/naming/[arrType]/[name]`.

Each database also has a landing page at `/pcd/[database]`. It renders the repo's `ABOUT.md` when
the database publishes one, falling back to the `pcd.json` description, and always lists the seven
entity types with their counts. `ABOUT.md` is read by the pipeline (see
[tooling/pcd.md](../tooling/pcd.md#output)) and rendered at build time by `renderAbout` in
`src/lib/shared/utils/pcd/about.ts`, which points relative links and images at the repo on GitHub.
Like entity descriptions, the markdown is trusted as-is, since only databases listed in the pipeline
config are compiled.

### API Reference

Auto-generated API documentation for the Profilarr REST API. The OpenAPI 3.1.0 spec is fetched at
build time from the Profilarr repo (`pnpm compile:api`) and rendered as a single page at `/api/v1`.

The page groups endpoints by tag, renders parameters, request/response schemas as JSON examples, and
generates code snippets in curl, Python, JavaScript/TypeScript, and C#. Adding an endpoint to the
OpenAPI spec automatically adds it to the docs on next build.

The spec JSON is output to `src/lib/data/api/v1.json` (gitignored). For pipeline implementation
details, see [tooling/api.md](../tooling/api.md).

### Dev Logs and Wiki Articles

Site-specific content written as mdsvex markdown. Dev logs cover releases and development progress.
Wiki articles cover broader topics. The Articles section page at `/articles`
(`src/routes/articles/+page.svelte`) introduces both and heads the sidebar section that groups them.

Both layers share the same article frontmatter and render through the same mdsvex layout
(`src/lib/layouts/Article.svelte`, registered as both the `dev-logs` and `wiki` layout keys):

| Field     | Notes                                                          |
| --------- | -------------------------------------------------------------- |
| `layout`  | `dev-logs` or `wiki`                                           |
| `title`   | Display title                                                  |
| `slug`    | Matches the route directory name (which is what routes derive) |
| `blurb`   | Short description; SEO meta, search blurb, artifact preamble   |
| `author`  | GitHub profile URL (or list); rendered with avatar and link    |
| `created` | Publish date, used for newest-first sorting                    |
| `tags`    | Displayed as chips and indexed as search keywords              |

Articles live at `src/routes/dev-logs/<slug>/+page.svx` and `src/routes/wiki/<slug>/+page.svx`. The
sidebar nav, search index, and markdown artifact routes all glob these paths and derive the slug
from the directory name.

## PCD Pipeline

The PCD pipeline is a pre-build step (`pnpm compile:pcd`) that fetches PCD repositories, compiles
their SQL operations into SQLite, and extracts entity state as JSON. For implementation details, see
[tooling/pcd.md](../tooling/pcd.md).

The pipeline outputs three things:

1. **Per-database JSON** (`src/lib/data/pcd/{id}.json`) containing full entity data, typed as
   `CompiledDatabase` from `src/lib/types/pcd.ts`. Consumed by `+page.server.ts` load functions.

2. **Nav index** (`src/lib/data/pcd/index.json`) containing entity names per database. Drives the
   prerender entries and is served per database as `/pcd/{database}/nav.json`, which the root layout
   fetches at view time to fill the sidebar. The prerendered HTML carries only the seven group
   links, not the entity names: the index is navigation, not content, and baking it into every page
   cost about 55 KB per page across 4,500 pages.

3. **Per-database history** (`src/lib/data/pcd/history/{id}.json`) containing each entity's change
   log. Consumed by `src/lib/shared/utils/pcd/history-data.ts` for the detail pages and markdown
   artifacts. Skipped with `pnpm compile:pcd -- --no-history`.

All outputs are gitignored. The build command is `pnpm compile:pcd && pnpm build`.

## Database Selection

The active database is determined by the URL when on PCD routes. A database selector dropdown in the
navbar, next to the theme switcher, lets users switch databases, which navigates to the equivalent
page for the new database. It only renders when the build compiled more than one database, so
production builds (Dictionarry only) never show it. The sidebar labels the PCD subtree with the
active database's name and icon and links it to the database landing page; it does not switch the
database.

On non-PCD pages, the selector updates a localStorage preference. Visiting `/pcd/` redirects to
`/pcd/{preference}/`, the landing page of the stored database (defaulting to the first database in
the config).

The database store lives at `src/lib/client/ui/database/database.svelte.ts` and follows the same
pattern as the theme store.
