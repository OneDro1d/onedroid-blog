# CLAUDE.md

**`AGENTS.md` is the house rules for this repo — read it first.** This file does not restate them beyond the two
that must never be missed; two homes for one rule is how a correction reaches one and not the other.

Posts and changes reach `main` only through a pull request. Agents open pull requests; agents never merge them and never push to `main`. Only Michal merges.

Every factual claim in a post needs a source the reader can check; never invent numbers, quotes, customers or results.

## Working here

- Structure and commands: `AGENTS.md` (Layout, Making a change). Frontmatter table and the `/blog` prefix: `README.md`.
- The build is one file, `build.mjs`; the tests in `test/build.test.mjs` are the executable specification. Change
  behaviour and the test together.
- `middleware.js` and `vercel.json` repeat the `/blog` prefix; keep them in step with `BASE_PATH`.
- Do not add a LICENSE; the owner decides.
