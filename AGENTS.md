# AGENTS.md

Instructions for coding agents working in this repo. Humans: see [README.md](README.md).

## What this repo is

The markdown source of truth for **https://onedroid.ai/blog**. The repo is authoritative; the site is a build
artefact. If a published page disagrees with the markdown here, the markdown is right and the site is stale.

## Layout

- `content/*.md` — the posts. `content/img/` — images. This is the only place to change what the blog says.
- `build.mjs` — markdown → `dist/`. One dependency (`marked`). `SITE_ORIGIN` and `BASE_PATH` at the top drive every URL.
- `middleware.js` — serves the markdown source to AI agents at the canonical URL.
- `test/build.test.mjs` — `node:test` suite. `dist/` and `node_modules/` are not content; never edit `dist/`.

## Making a change

```bash
npm install
npm test          # must pass
npm run build     # regenerate dist/
npm run check     # exits 1 if dist/ is stale
```

## Rules

Posts and changes reach `main` only through a pull request. Agents open pull requests; agents never merge them and never push to `main`. Only Michal merges.

Every factual claim in a post needs a source the reader can check; never invent numbers, quotes, customers or results.

- Frontmatter: `title`, `description`, `date` (YYYY-MM-DD), `author` are required; `tags`, `updated`, `draft` optional.
  The build fails without the required ones, deliberately.
- Every internal link and image starts with `/blog/`. Anything else breaks behind the rewrite from onedroid.ai.
- No client-side JavaScript, no analytics, no third-party fonts, no new dependencies without a reason in the PR.
- "OneDroid Argus", never bare "Argus", in public text.
- The index, feed, sitemap and llms.txt are generated. Do not maintain a post list by hand.
- Run `npm test` and `npm run check` before opening a PR, and paste the output into the PR description.
