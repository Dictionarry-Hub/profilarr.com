# LLM Consumption

How the site makes its content consumable by LLMs and AI agents. Humans write everything on this
site (see the AI policy in [CONTRIBUTING.md](../CONTRIBUTING.md)); this module makes it easy for
readers to hand that content to a model. Human-written, AI-consumable.

## Philosophy

People increasingly read documentation through an AI assistant. The site treats this as a
first-class reading mode. Every meaningful unit of content gets a canonical markdown artifact at a
stable URL. The same artifact serves two consumers:

1. **Humans**, via copy buttons that fetch the artifact and put it on the clipboard.
2. **Agents**, by fetching the URL directly.

This mirrors the pattern Anthropic, Mintlify, and Cloudflare converged on: copy buttons never
serialize the page client-side, they fetch a canonical `.md` URL. The artifact is the contract.

## Design Principles

- **One artifact, two consumers.** Copy buttons and agents read the same URL. No drift between what
  a button copies and what an agent fetches.
- **Build time only.** Artifacts are prerendered `+server.ts` endpoints. adapter-static writes them
  out as plain `.md` files served by GitHub Pages. No runtime, consistent with the rest of the site.
- **Self-contained at every granularity.** Every artifact begins with a preamble carrying the
  context needed to act on it (base URL, auth, placeholder conventions). A single endpoint pasted
  into a chat is enough for the model to write working code.
- **Plain markdown.** Headings, tables, fenced code. No prompt scaffolding ("You are a helpful
  assistant..."), no HTML. Users paste artifacts into their own conversations with their own
  context.
- **Content-agnostic UI.** The copy component takes a URL and nothing else. It knows nothing about
  OpenAPI, dev logs, or wiki articles.

## Module Layout

```
src/lib/shared/utils/llm/         # serializers: typed content -> markdown strings
src/routes/**/<artifact>.md/      # prerendered +server.ts artifact routes
src/lib/client/ui/copy-markdown/  # copy button component
```

### Serializers

Pure functions, one module per content layer, that turn typed data into markdown strings. They run
inside prerendered server routes at build time. Formatting decisions live here and nowhere else: if
an artifact looks wrong, the fix is in the serializer.

### Artifact routes

Each granularity gets a real URL via a prerendered `+server.ts` GET endpoint returning
`text/markdown; charset=utf-8`. Dynamic segments enumerate their pages through an `EntryGenerator`
so adapter-static knows every artifact at build time. Sub-page granularities (e.g. a single
endpoint) get URLs even though they have no HTML page of their own.

### Copy component

One component, `CopyMarkdown`, in `src/lib/client/ui/copy-markdown/`. Required prop: the artifact
URL. It fetches the URL and writes the response text to the clipboard, with the same
copy-to-checkmark feedback as `CodeBlock`. Placed next to the heading of whatever it copies.

## API Reference Artifacts

The first implemented layer. Serializers consume the parsed `ApiSpec` from
`src/lib/shared/utils/openapi/`, the same data the `/api/v1` page renders.

| Granularity | URL                     | Example                             | Serializer           |
| ----------- | ----------------------- | ----------------------------------- | -------------------- |
| Whole API   | `/api/v1.md`            | `/api/v1.md`                        | `specToMarkdown`     |
| Tag         | `/api/v1/{tag}.md`      | `/api/v1/databases.md`              | `tagToMarkdown`      |
| Endpoint    | `/api/v1/{tag}/{op}.md` | `/api/v1/databases/get-database.md` | `endpointToMarkdown` |

Slugs: the tag slug comes from the parser (`ApiTag.slug`). The operation slug is the kebab-cased
`operationId` (`getDatabase` becomes `get-database`). Every operation in the spec has a unique
`operationId`; the parser should fail the build if one is missing rather than invent a fallback.

### Artifact shape

Every artifact is `preamble + body`. The preamble appears exactly once, at the top, regardless of
granularity:

```markdown
# Profilarr API v1: Databases

> Part of the Profilarr API reference. Full reference: https://profilarr.com/api/v1.md

All requests use the base URL `${PROFILARR_URL}/api/v1` and authenticate with an `X-Api-Key` header.
`${PROFILARR_URL}` and `${API_KEY}` are placeholders for the user's own instance URL and API key.
```

Bodies compose downward by concatenation, so heading depths are fixed across all granularities: tags
are `##`, endpoints are `###`, endpoint subsections are `####`. The whole-API body is the tag bodies
concatenated, a tag body is its endpoint bodies under a `##` tag heading, and an endpoint body is:

```markdown
### GET /databases/{id}

Get a database by ID.

(description, if present)

#### Parameters

| Name | In   | Type    | Required | Description  |
| ---- | ---- | ------- | -------- | ------------ |
| id   | path | integer | yes      | Database ID. |

#### Request Body

(content type plus fenced JSON example, if present)

#### Responses

(bold status line with description, fenced JSON example per response)

#### Example

(fenced curl snippet)
```

### Format decisions

- **Markdown, not raw OpenAPI JSON.** Rendered markdown resolves `$ref`s, drops spec boilerplate,
  and is meaningfully more token-efficient. The raw spec stays available for type-level accuracy and
  is linked from the whole-API artifact.
- **curl snippets only.** The page renders four languages; artifacts include just curl. It is the
  most universal expression of a request and models translate it to any language trivially.
  Including all four would triple artifact size for no information gain.
- **Markdown descriptions, not HTML.** Serializers use the raw `description` fields from the parser,
  never the `descriptionHtml` variants.

## Docs, Dev Log, and Wiki Artifacts

The mdsvex content layers. The source `.svx` files are already markdown, so the serializers at
`src/lib/shared/utils/llm/docs.ts`, `src/lib/shared/utils/llm/devlog.ts`, and
`src/lib/shared/utils/llm/wiki.ts` are thin. The shared stripping and date helpers (`articleBody`,
`isoDate`) live in `md.ts`; each layer module owns only its formatting strings.

| Artifact      | URL                   | Content                                                       |
| ------------- | --------------------- | ------------------------------------------------------------- |
| Home page     | `/index.md`           | Preamble from frontmatter, then the source body verbatim      |
| Docs page     | `/{slug}.md`          | Preamble from frontmatter, then the source body verbatim      |
| Docs group    | `/{slug}.group.md`    | A page and every page under it, in one file (see Docs Groups) |
| Dev log index | `/dev-logs.md`        | One line per log (title, date, blurb), newest first           |
| Dev log       | `/dev-logs/{slug}.md` | Preamble from frontmatter, then the source body verbatim      |
| Wiki index    | `/wiki.md`            | One line per article (title, date, blurb), newest first       |
| Wiki article  | `/wiki/{slug}.md`     | Preamble from frontmatter, then the source body verbatim      |

The slug is the route directory name, the same derivation the nav uses; a docs page's slug is its
route path (`installation/docker`), so its mirror sits next to its URL. The preamble is synthesized
from frontmatter: title as H1, blurb as blockquote, then a context line with author, date, tags, and
the web URL. Docs pages have no publish date or tags, so their context line names the docs, the
page's authors when it has any, its last-updated date and commit link from git when the build has
them, the web URL, and the GitHub link to edit the page. The docs root page is the home page at `/`,
not an index, so its mirror is `/index.md` and there is no docs index artifact; `llms.txt` lists the
docs pages in reading order instead, with child pages indented under their parent. The body ships
nearly verbatim: frontmatter and `<script>` blocks are stripped, but embedded Svelte components stay
intact, the same approach Anthropic's docs use. Components often carry real content in their props
(e.g. `CodeBlock` code), so stripping them would lose information; models read component tags fine.

Docs pages go one step further, because a docs page can keep its component data in a `data.ts` next
to `+page.svx` instead of in its `<script>` block. The page imports that module to render, and the
docs mirror route imports the same module and passes it to `componentsToMarkdown`
(`src/lib/shared/utils/llm/components.ts`), which swaps component tags for plain Markdown: an
`AdaptiveList` (and its `mb-5` spacing wrapper) becomes a Markdown table, a `CodeBlock` becomes a
fenced block per tab under its title (a `marks` block gets a line after it saying the square
brackets mark matched text), a `FileTree` becomes a plain-text tree like the `tree` command prints,
a `Screenshots` becomes each image with its caption, and a `Callout` becomes a blockquote led by its
label ("Help wanted" for `help`, the capitalized type otherwise). Columns are typed as
`MarkdownColumn`, whose optional `markdown(row)` formats a cell for the mirror, so styling the page
adds in snippets (badges, links, placeholders) has a text form. A tag that names data the module
doesn't export, and any other component, stays as it is.

An `AdaptiveList` with `markdown="code"` exports each row as a title, optional description, and
fenced code using the row's `language`. The upgrade examples use this to keep JSON out of the
browser layout while including it in the Markdown artifact. Their Copy Filter buttons copy the
same JSON string directly, rather than the page's Markdown artifact.

A `PromptBuilder` exports its prompt template as a titled fenced block from the page's `data.ts`.
The browser form replaces `[User’s description]` with the user's input when copying; the Markdown
artifact keeps the placeholder. Upgrade prompt data lives beside the Quick Start page in `ai.ts`.
The Quick Start page currently omits the tool and its Markdown export pending further testing.
Its field IDs, operators, selector IDs, and search limits are a snapshot
of Profilarr's source and need updating when that contract changes. Field and selector descriptions
reuse the existing documentation data; schemas do not appear on those pages.

Images and videos are serialized in every article mirror, docs, dev logs, and wiki alike, by
`mediaToMarkdown` in the same file, since it needs no page data: a `ThemeImage` becomes
`![alt](light image)` followed by its caption, so a model can read the alt text or fetch the image,
a `Video` becomes its title and `description` followed by a link to the file, a `Dimensions`
animation becomes its `description`, and an `InlineIcon` becomes its `label`. The
`require-media-alt` lint rule makes sure that text exists.

A docs page with `next` frontmatter ends its mirror with a `## Next` list of those pages, each a
link with its blurb, matching the footer on the web page.

A `MoreInfo` tag becomes `More info:` followed by its links, resolved against every docs page's
metadata by `moreInfoToMarkdown`.

Mermaid diagrams need no serializer. A ` ```mermaid ` fence is already Markdown, so the mirror ships
the diagram source, including its `accTitle` and `accDescr` lines, while the HTML page renders it to
SVG (see [markdown.md](../frontend/markdown.md#diagrams)).

Index links point at the `.md` artifacts, so each index doubles as a machine-readable directory of
its layer.

### Docs Groups

A docs page with child pages heads a group, and the group has its own artifact: the page and every
page under it in one file, nested groups included. Its path is the page's mirror path with `.group`
before the extension, so `/deploy/upgrades.group.md` holds Upgrades and its five child pages. The
root page heads every other docs page, so `/index.group.md` is the whole documentation, without the
API reference.

`docGroupToMarkdown` in `docs.ts` builds the file. It opens with the header page's title, its
`groupDescription` frontmatter as a blockquote, a context line with the page count and web URL, and
a contents list that links each page's own mirror, nested like the sidebar. The pages follow in
reading order, each parent before its child pages, separated by rules. Each page is its own mirror
with two changes. A page under the header puts its parent's title in front of its own
(`# Upgrades: Quick Start`), as search results do, since titles repeat across sections. The
`## Next` list is left out, since the file already holds the pages in reading order. Headings are
not shifted, so every page starts at `#`.

A `groupDescription` of `#todo` marks a description that isn't written yet, and the file leaves it
out. The `require-group-description` lint rule checks the field (see
[tooling/lint.md](../tooling/lint.md)).

Page mirrors and groups come from one route, `src/routes/(docs)/[...slug].md/`. Its rest parameter
takes the `.group` suffix along with the slug, which avoids a second rest route that SvelteKit would
have to rank against the first.

## PCD Entity Artifacts

The first structured-data layer outside the API reference. PCD entities are compiled JSON, not
mdsvex, so the serializers at `src/lib/shared/utils/llm/pcd.ts` are API-style: they consume the same
`CompiledDatabase` data the entity pages render, one serializer per entity type.

| Artifact            | URL                                                       | Serializer                     |
| ------------------- | --------------------------------------------------------- | ------------------------------ |
| Custom format       | `/pcd/{database}/custom-formats/{slug}.md`                | `customFormatToMarkdown`       |
| Regular expression  | `/pcd/{database}/regular-expressions/{slug}.md`           | `regexToMarkdown`              |
| Quality profile     | `/pcd/{database}/quality-profiles/{slug}.md`              | `qualityProfileToMarkdown`     |
| Delay profile       | `/pcd/{database}/delay-profiles/{slug}.md`                | `delayProfileToMarkdown`       |
| Naming config       | `/pcd/{database}/naming/{arrType}/{slug}.md`              | `namingConfigToMarkdown`       |
| Media settings      | `/pcd/{database}/media-settings/{arrType}/{slug}.md`      | `mediaSettingsToMarkdown`      |
| Quality definitions | `/pcd/{database}/quality-definitions/{arrType}/{slug}.md` | `qualityDefinitionsToMarkdown` |

The slug is `slugify(name)`, the same derivation the entity pages use. Each artifact route
enumerates its entries by globbing the compiled `src/lib/data/pcd/*.json` output (excluding the
nav-only `index.json`), so every database in `tooling/pcd/config.json` gets artifacts automatically.
Names that slugify to the empty string are skipped: those entities have no reachable HTML page
either.

### Artifact shape

Every artifact is H1 name, then a context line (entity type, database, web URL) in the wiki preamble
style, then sections mirroring what the HTML page shows, under the same labels the page uses.
Configuration values render as a `| Setting | Value |` table. Value display formatting (label maps,
delay and protocol formatting) lives in `src/lib/shared/utils/pcd/format.ts`, imported by both the
entity pages and the serializers, so page and artifact cannot drift apart.

- **Custom format**: `## Description` when present, `## Configuration` for rename inclusion,
  `## Conditions` with the type, value, arr applicability, required state, and negation for each
  condition, then `## Tests` when tests exist.
- **Regular expression**: `## Pattern` fenced as `regex` plus a regex101 link when the entity has a
  `regex101Id`; `## Description` with the raw markdown `description` verbatim (omitted entirely when
  null; the joke placeholder the HTML page shows never ships in artifacts); `## References` linking
  the custom formats whose conditions use the regex at their expected `.md` URLs
  (`/pcd/{database}/custom-formats/{slug}.md`).
- **Quality profile**: the context line carries the language and tags; `## Description` when
  present; `## Scoring` with a `| Setting | Value | Meaning |` table (the meanings stand in for the
  page's tooltips; Upgrade Until Score and Upgrade Score Increment are omitted when upgrades are
  off), then `### Custom Formats` with every scored format in the page's default order (Radarr score
  highest first, missing scores last), signed effective scores per app, tags, and links to the HTML
  pages; `## Qualities` with an explanatory intro, the single-enabled-entry note when it applies, a
  table through the last enabled entry (position, name, items, status), and the disabled tail the
  page hides as one "Also listed, disabled" line.
- **Delay profile**: `## Configuration` with protocol, delays, and bypass settings. Delay values use
  the page's human formatting (`No delay`, `2h 30m`); protocol-irrelevant delays are omitted, as on
  the page.
- **Naming config**: `## Configuration` (rename, character replacement, colon replacement,
  multi-episode style for Sonarr), then `## Naming Scheme` with each format string in a fenced block
  under an `###` heading.
- **Media settings**: `## Configuration` with propers/repacks preference and media info.
- **Quality definitions**: `## Quality Tiers` with a per-quality table of min, preferred, and max
  sizes in megabytes per minute (the native arr unit; the HTML page's unit dropdown is
  display-only). A max of 0, or at or above the arr's slider cap (2000 for Radarr, 1000 for Sonarr),
  renders as `Unlimited`.
- **History** (every type): `## History` with a `| Commit | Change | Date |` table, newest first,
  the commit linked to GitHub and the change title suffixed with the kind when it is not a plain
  update (`Created`, `Renamed`). Field-level diffs stay on the page. Omitted when the entity has no
  compiled history. Kind labels and links come from `src/lib/shared/utils/pcd/history.ts`, shared
  with the page's History section.

Only detail pages have mirrors. The entity list pages do not, so `/pcd/*` stays in the lint rule's
`pending` list and the detail artifacts are guaranteed by their own build instead: entries derive
from the same compiled data the pages render, and a missing entity throws during prerender.

## Discovery

Three pieces let a reader find the Markdown artifacts without a copy button.

- **`/llms.txt`**, per the [llms.txt](https://llmstxt.org/) convention
  (`src/routes/(meta)/llms.txt/`, serializer `llmsTxt` in `src/lib/shared/utils/llm/llms.ts`): an
  H1, a blockquote summary of Profilarr and the site, then sections linking every docs page in
  reading order, the API reference, every dev log and wiki article with its blurb, and, per compiled
  PCD database, every quality profile with its tags plus counts of the other entity types. It points
  to `/pcd/{database}/nav.json` for the full entity list and explains how an entity's URL is built
  from its name, rather than listing hundreds of entities, since the PCD list pages are not all
  built and the sitemap lists only quality profiles. Its intro says where the docs groups are:
  `.group.md` on a docs page with child pages, and `/index.group.md` for every docs page. Served as
  plain text so the footer hook skips it.
- **Footer.** Every Markdown artifact ends with a rule and a link to `/llms.txt`, so a reader that
  lands on one page can find the rest. `src/hooks.server.ts` appends it (`withIndexFooter` in
  `md.ts`) to any `text/markdown` response, which covers every `.md` route, current and future, and
  bakes the footer into the prerendered files. The same hook rewrites site-relative Markdown links
  (`](/installation/docker)`) to full URLs with `absoluteLinks`, skipping fenced code, so a page
  pasted into a chat on its own still resolves its links.
- **Alternate link.** Pages with a Markdown version pass its path to the `SEO` component's
  `markdown` prop, which renders `<link rel="alternate" type="text/markdown">` in the head, so tools
  that fetch the HTML learn the Markdown version exists.

## Copy Buttons and the AI Menu

On `/api/v1`:

- Page header: an `AiMenu` (sparkle icon dropdown) with "Copy page as Markdown" (`/api/v1.md`),
  "View as Markdown", "Open in Claude", and "Open in ChatGPT".
- Each tag heading: a `CopyMarkdown` icon button copying `/api/v1/{tag}.md`.
- Each endpoint heading: a `CopyMarkdown` icon button copying `/api/v1/{tag}/{op}.md`.

The fuller menu exists only at page level, never repeated per section. With several copy affordances
on one page, every icon-only button's tooltip and aria-label state the copy scope ("Copy Databases
as Markdown"), not just the format.

Docs, dev log, and wiki pages get an `AiMenu` automatically: the shared `Article` layout renders one
in its `PageHeader` actions, deriving the artifact path from the current pathname plus `.md` and
using the default prompt. On a docs page that heads a group, the layout also passes the group's
path, and the menu adds a Group section: "Copy group as Markdown", "View group as Markdown", "Open
group in Claude", and "Open group in ChatGPT" (see [groups](#docs-groups)). A group has no HTML page
of its own, so both assistant links point at its Markdown.

### Assistant deep links

"Open in" links carry a short prompt referencing a URL, never content (URL prompt payloads cap
around 14k characters). Claude is pointed at the markdown artifact, ChatGPT at the HTML page, which
its fetcher handles better. The default prompt is the Mintlify pattern
(`Read {url} so I can ask questions about it.`); pages with a clear task override it via the
`prompt` prop (the API reference uses `Read {url} and help me use this API.`).

The URL formats live in `assistantLink` in `src/lib/shared/utils/llm/assistants.ts`. They are owned
by the receiving apps and undocumented, so they can break silently; that file is the one place to
fix them. The links only work against the deployed site, since the assistant has to fetch a public
URL.

## Enforcement

A custom lint rule, `require-md-mirror` (category: `llm`), guards the failure mode of adding a page
and forgetting its markdown mirror. See [tooling/lint.md](../tooling/lint.md) for the framework.

- **Checks build output, not source.** The rule globs `build/**/*.{html,md}` and asserts every HTML
  page has a sibling `.md` artifact. Entry generators are dynamic, so source analysis cannot know
  what pages exist; the build output is ground truth. This works because `pnpm lint` already runs
  after `pnpm build`.
- **Path mapping.** adapter-static emits flat pages (`api/v1.html`, `dev-logs/donuts.html`), so the
  mirror of `X.html` is `X.md`, and the root `index.html` maps to `index.md`.
- **Blacklist, not whitelist, in two lists.** Every page requires a mirror by default. The lists
  live in `tooling/lint/md-mirror.json` so they can be edited without touching code. `exempt` holds
  pages that will never have a mirror (redirect stubs such as `/pcd`); `pending` holds route groups
  whose mirror layer has not been built yet, which is debt, not policy, and shrinks to empty as
  layers land. Every entry is `{ "route", "reason" }`, where the route is either exact (`/pcd`) or
  ends in `/*` to match everything beneath it (`/pcd/*`). Adding to either list is a visible,
  reviewable act.
- **Page-level mirrors are the minimum guarantee.** The rule enforces one `.md` per built page.
  Sub-page granularities (API tags and endpoints) are extra surface on top, guaranteed by their own
  build instead: artifact routes derive from the same parsed data the page renders, and a throwing
  prerender endpoint fails the build.

## Future Layers

Planned but not yet built. Each reuses the same three pieces (serializer, artifact route, copy
component):

- **Remaining mdsvex surfaces.** Docs pages, including the home page, dev logs, and wiki articles
  are done (see Docs, Dev Log, and Wiki Artifacts). Landing each removes its entries from the rule's
  `PENDING` list (see Enforcement).
- **PCD entity mirrors.** Custom formats, regular expressions, delay profiles, naming configs, media
  settings, quality definitions, and quality profiles are done (see PCD Entity Artifacts); the
  entity list pages follow the same serializer-per-entity pattern in
  `src/lib/shared/utils/llm/pcd.ts`.

## Prior Art

- [llmstxt.org](https://llmstxt.org/): the llms.txt convention and the `.md` URL suffix pattern.
- [Mintlify contextual menu](https://www.mintlify.com/docs/ai/contextual-menu): copy page, view as
  markdown, open-in-assistant deep links.
- [Cloudflare docs for agents](https://developers.cloudflare.com/docs-for-agents/): page actions
  bar, per-product llms.txt, token-count response headers.
- [Scalar discussion #6973](https://github.com/scalar/scalar/discussions/6973): requested but
  unshipped multi-granularity copy for API references. Nobody has built the per-tag level yet.
