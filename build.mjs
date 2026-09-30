// Build the OneDroid blog (https://onedroid.ai/blog) from the markdown in content/.
//
// The repo is the source of truth and the site is a build artefact. Merge markdown, Vercel
// runs this, the blog updates. There is exactly one copy of every sentence.
//
// The blog is served under a path prefix through a rewrite from another Vercel project, so
// EVERY URL emitted here lives under BASE_PATH. Change the two constants below and the whole
// site moves; nothing else hard-codes the origin or the prefix.
//
// Design constraints, in order (same as onedroid-docs):
//   1. The markdown source is served as-is at /blog/<slug>.md, and to AI-agent user-agents at
//      the canonical URL. An agent reading the blog gets the original, not a reconstruction.
//   2. One dependency (marked).
//   3. No client-side JavaScript. (The JSON-LD block is data, not script.)
//   4. Images live in content/img/** and are copied byte for byte.
//
// Usage: node build.mjs          build into dist/
//        node build.mjs --check  exit 1 if dist/ is stale or missing (CI gate)
// Env:   BLOG_CONTENT_DIR (default content), BLOG_OUT_DIR (default dist)

const SITE_ORIGIN = 'https://onedroid.ai';
const BASE_PATH = '/blog';

import { readFileSync, writeFileSync, readdirSync, mkdirSync, rmSync, existsSync, statSync } from 'node:fs';
import { join, relative, dirname, resolve, sep } from 'node:path';
import { Marked } from 'marked';

const ROOT = dirname(new URL(import.meta.url).pathname);
const CONTENT = resolve(process.env.BLOG_CONTENT_DIR || join(ROOT, 'content'));
const DIST = resolve(process.env.BLOG_OUT_DIR || join(ROOT, 'dist'));
const CHECK = process.argv.includes('--check');

const BASE = BASE_PATH.replace(/\/+$/, ''); // '/blog'
const BASE_DIR = BASE.replace(/^\/+/, ''); // 'blog' (directory under dist)
const ABS = SITE_ORIGIN + BASE; // 'https://onedroid.ai/blog'
const DOCS = 'https://docs.onedroid.ai';
const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const IMG_EXT = /\.(png|jpe?g|gif|webp)$/i;

class BuildError extends Error {}
const fail = (msg) => {
  throw new BuildError(msg);
};
// Validation runs at module top level; turn a BuildError anywhere into one clean line + exit 1.
process.on('uncaughtException', (e) => {
  if (!(e instanceof BuildError)) throw e;
  console.error(`ERROR: ${e.message}`);
  process.exit(1);
});

// ---------------------------------------------------------------- frontmatter

/** Parse the `---` block. Deliberately not a YAML parser: keys are flat strings. */
function parse(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { meta: {}, body: raw };
  const meta = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z_-]+):\s*(.*)$/);
    if (kv) meta[kv[1]] = kv[2].trim().replace(/^["']|["']$/g, '');
  }
  return { meta, body: raw.slice(m[0].length) };
}

/** True only for a real calendar date written YYYY-MM-DD (rejects 2026-02-30). */
function validDate(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return false;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
}

// ---------------------------------------------------------------- discovery

if (!existsSync(CONTENT)) fail(`content directory not found: ${CONTENT}`);

const IMG_DIR = join(CONTENT, 'img');

function walkImages(dir) {
  const out = [];
  for (const entry of readdirSync(dir).sort()) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walkImages(full));
    else if (IMG_EXT.test(entry)) out.push(full);
    else fail(`${relative(CONTENT, full)}: only png, jpg, gif and webp files belong under content/img/`);
  }
  return out;
}

const images = existsSync(IMG_DIR) ? walkImages(IMG_DIR) : [];
const imagePaths = new Set(images.map((f) => `${BASE}/${relative(CONTENT, f).split(sep).join('/')}`));

const allPosts = readdirSync(CONTENT)
  .filter((f) => f.endsWith('.md') && statSync(join(CONTENT, f)).isFile())
  .sort()
  .map((file) => {
    const buf = readFileSync(join(CONTENT, file));
    const raw = buf.toString('utf8');
    const { meta, body } = parse(raw);
    const slug = file.replace(/\.md$/, '');
    if (!SLUG_RE.test(slug)) fail(`${file}: invalid slug "${slug}" (file name must match ${SLUG_RE})`);
    for (const field of ['title', 'description', 'date', 'author']) {
      if (!meta[field]) fail(`${file}: frontmatter needs a ${field}`);
    }
    if (!validDate(meta.date)) fail(`${file}: frontmatter field date "${meta.date}" is not a valid YYYY-MM-DD date`);
    if (meta.updated && !validDate(meta.updated)) {
      fail(`${file}: frontmatter field updated "${meta.updated}" is not a valid YYYY-MM-DD date`);
    }
    if (/<script\b/i.test(body)) fail(`${file}: <script> is not allowed in a post (no client-side JavaScript)`);
    const tags = (meta.tags || '').split(',').map((t) => t.trim()).filter(Boolean);
    return {
      file,
      slug,
      url: `${BASE}/${slug}`,
      abs: `${ABS}/${slug}`,
      meta,
      tags,
      body,
      buf,
      draft: String(meta.draft).toLowerCase() === 'true',
      date: meta.date,
      updated: meta.updated || meta.date,
    };
  });

// Newest first; ties broken by slug so the output is deterministic.
const posts = allPosts
  .filter((p) => !p.draft)
  .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.slug.localeCompare(b.slug)));

// Internal links and images must live under BASE_PATH and must resolve. A link that escapes
// the prefix works locally and 404s behind the rewrite, silently.
for (const p of posts) {
  for (const m of p.body.matchAll(/!\[([^\]]*)\]\(([^)\s]+)[^)]*\)/g)) {
    const [, alt, src] = m;
    if (/^https?:\/\//.test(src)) continue;
    if (!src.startsWith(`${BASE}/img/`)) fail(`${p.file}: image ${src} must live under ${BASE}/img/`);
    if (!imagePaths.has(src)) fail(`${p.file}: image ${src} does not exist under content/img/`);
    if (!alt.trim()) fail(`${p.file}: image ${src} needs alt text`);
  }
  for (const m of p.body.matchAll(/(?<!!)\[[^\]]*\]\((\/[^)\s]*)/g)) {
    const href = m[1];
    if (href.startsWith('//')) continue;
    if (href !== BASE && !href.startsWith(`${BASE}/`)) fail(`${p.file}: internal link ${href} must start with ${BASE}/`);
  }
}

// ---------------------------------------------------------------- rendering

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const anchor = (s) =>
  s
    .toLowerCase()
    .replace(/<[^>]*>/g, '')
    .replace(/&[a-z]+;/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');

/** Heading anchors by hand (marked removed headerIds); duplicates get -2, -3, ... */
function render(body) {
  const seen = new Map();
  const md = new Marked({
    gfm: true,
    renderer: {
      heading({ tokens, depth }) {
        const text = this.parser.parseInline(tokens);
        const base = anchor(text) || 'section';
        const n = (seen.get(base) || 0) + 1;
        seen.set(base, n);
        return `<h${depth} id="${n > 1 ? `${base}-${n}` : base}">${text}</h${depth}>\n`;
      },
    },
  });
  return md.parse(body);
}

const CSS = `
:root{--bg:#0f1012;--fg:#e8e6e3;--muted:#a5a29d;--line:#2a2c30;--accent:#e8e6e3;--code:#16181b}
@media(prefers-color-scheme:light){:root{--bg:#fbfaf9;--fg:#1a1a1a;--muted:#5c5a57;--line:#e3e0dc;--accent:#111;--code:#f3f1ee}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.65 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased}
a{color:inherit;text-decoration:underline;text-underline-offset:.2em;text-decoration-color:var(--muted)}
a:hover{text-decoration-color:var(--fg)}
.wrap{max-width:760px;margin:0 auto;padding:0 24px}
header{border-bottom:1px solid var(--line)}
header .wrap{display:flex;justify-content:space-between;align-items:center;padding-top:18px;padding-bottom:18px;gap:24px}
.brand{font-weight:600;letter-spacing:.02em;text-decoration:none}
.brand span{color:var(--muted);font-weight:400}
header nav.top{display:flex;gap:20px;font-size:14px}
header nav.top a{text-decoration:none;color:var(--muted)}
header nav.top a:hover{color:var(--fg)}
main{padding:36px 0 96px;min-width:0}
main h1{font-size:34px;line-height:1.2;margin:0 0 .3em;letter-spacing:-.02em}
main h2{font-size:23px;margin:2em 0 .5em;letter-spacing:-.01em}
main h3{font-size:17px;margin:1.8em 0 .4em}
main .lede{color:var(--muted);font-size:18px;margin:0 0 1em}
.meta{color:var(--muted);font-size:14px;margin:0 0 2em}
.back{font-size:14px;margin:0 0 1.5em}
.posts{list-style:none;margin:0;padding:0}
.posts li{margin:0 0 2em}
.posts h2{font-size:21px;margin:0 0 .15em}
.posts h2 a{text-decoration:none}
.posts h2 a:hover{text-decoration:underline}
.posts p{margin:.2em 0;color:var(--muted)}
code{background:var(--code);padding:.15em .4em;border-radius:4px;font-size:.88em;font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
pre{background:var(--code);padding:16px 18px;border-radius:8px;overflow-x:auto;border:1px solid var(--line)}
pre code{background:none;padding:0;font-size:13.5px;line-height:1.6}
blockquote{margin:1.5em 0;padding:.1em 0 .1em 18px;border-left:3px solid var(--line);color:var(--muted)}
table{border-collapse:collapse;width:100%;margin:1.5em 0;font-size:14.5px;display:block;overflow-x:auto}
th,td{border:1px solid var(--line);padding:9px 12px;text-align:left;vertical-align:top}
th{background:var(--code);font-weight:600}
hr{border:0;border-top:1px solid var(--line);margin:2.5em 0}
main img{display:block;max-width:100%;height:auto;margin:1.5em 0;border:1px solid var(--line);border-radius:8px}
footer{border-top:1px solid var(--line);color:var(--muted);font-size:14px}
footer .wrap{padding-top:24px;padding-bottom:48px}
footer p{margin:0 0 .7em;max-width:70ch}
.src{margin-top:3em;padding-top:1.2em;border-top:1px solid var(--line);font-size:13.5px;color:var(--muted)}
`.trim();

function shell({ title, description, canonical, type, extraHead = '', content }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${canonical}">
<link rel="alternate" type="application/atom+xml" title="OneDroid Blog" href="${BASE}/feed.xml">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:type" content="${type}">
<meta property="og:site_name" content="OneDroid Blog">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:url" content="${canonical}">
${extraHead}<style>${CSS}</style>
</head>
<body>
<header><div class="wrap"><a class="brand" href="${BASE}">ONEDROID <span>Blog</span></a><nav class="top"><a href="https://onedroid.ai">onedroid.ai</a><a href="${DOCS}">Docs</a><a href="${BASE}/feed.xml">Feed</a></nav></div></header>
<main class="wrap">
${content}
</main>
<footer><div class="wrap"><p>This blog is markdown in a repository and a static build: one copy of every post, also served as markdown at <code>.md</code> to any agent. Index for machines: <a href="${BASE}/llms.txt">llms.txt</a>.</p><p><a href="https://onedroid.ai">onedroid.ai</a> · <a href="${DOCS}">docs.onedroid.ai</a> · <a href="${BASE}/feed.xml">Atom feed</a></p><p>OneDroid (onedroid.ai) is AI agent infrastructure by Providentia Worldwide. Unrelated to Android or the OneDroid Android projects.</p></div></footer>
</body>
</html>
`;
}

const jsonLd = (obj) => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>\n`;

function postPage(p) {
  const html = render(p.body);
  const mdHref = `${p.url}.md`;
  const ld = jsonLd({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: p.meta.title,
    description: p.meta.description,
    datePublished: p.date,
    dateModified: p.updated,
    // A post signed "OneDroid" is by the company; anything else is a person's name.
    author: { '@type': p.meta.author === 'OneDroid' ? 'Organization' : 'Person', name: p.meta.author },
    mainEntityOfPage: { '@type': 'WebPage', '@id': p.abs },
    publisher: { '@type': 'Organization', name: 'OneDroid', url: SITE_ORIGIN },
  });
  const extra =
    `<link rel="alternate" type="text/markdown" href="${mdHref}">\n` +
    `<meta property="article:published_time" content="${p.date}">\n` +
    (p.updated !== p.date ? `<meta property="article:modified_time" content="${p.updated}">\n` : '') +
    p.tags.map((t) => `<meta property="article:tag" content="${esc(t)}">\n`).join('') +
    ld;
  const updated = p.updated !== p.date ? ` · Updated <time datetime="${p.updated}">${p.updated}</time>` : '';
  const tags = p.tags.length ? ` · ${p.tags.map(esc).join(', ')}` : '';
  return shell({
    title: `${p.meta.title} — OneDroid Blog`,
    description: p.meta.description,
    canonical: p.abs,
    type: 'article',
    extraHead: extra,
    content: `<p class="back"><a href="${BASE}">← All posts</a></p>
<article>
<h1>${esc(p.meta.title)}</h1>
<p class="lede">${esc(p.meta.description)}</p>
<p class="meta"><time datetime="${p.date}">${p.date}</time> · ${esc(p.meta.author)}${updated}${tags}</p>
${html}
<p class="src">Read this post <a href="${mdHref}">as markdown</a>. <a href="${BASE}">Back to the blog</a>.</p>
</article>`,
  });
}

function indexPage() {
  const list = posts.length
    ? `<ul class="posts">\n${posts
        .map(
          (p) =>
            `<li><h2><a href="${p.url}">${esc(p.meta.title)}</a></h2><p class="meta"><time datetime="${p.date}">${p.date}</time> · ${esc(p.meta.author)}</p><p>${esc(p.meta.description)}</p></li>`
        )
        .join('\n')}\n</ul>`
    : `<p>No posts yet.</p>`;
  return shell({
    title: 'OneDroid Blog',
    description: 'Posts from the OneDroid team about AI agent infrastructure.',
    canonical: ABS,
    type: 'website',
    extraHead: `<link rel="alternate" type="text/markdown" href="${BASE}/index.md">\n`,
    content: `<h1>OneDroid Blog</h1>\n<p class="lede">Posts from the OneDroid team about AI agent infrastructure.</p>\n${list}`,
  });
}

// ---------------------------------------------------------------- emit

const files = new Map(); // path relative to the output dir -> string | Buffer
const put = (rel, body) => files.set(`${BASE_DIR}/${rel}`, body);

put('index.html', indexPage());
put(
  'index.md',
  `# OneDroid Blog\n\n` +
    (posts.length
      ? posts.map((p) => `- ${p.date} [${p.meta.title}](${p.url}.md): ${p.meta.description}`).join('\n')
      : 'No posts yet.') +
    `\n`
);

for (const p of posts) {
  put(`${p.slug}.html`, postPage(p));
  put(`${p.slug}.md`, p.buf); // the SOURCE, byte for byte, not a re-render
}

for (const f of images) put(relative(CONTENT, f).split(sep).join('/'), readFileSync(f));

const stamp = (d) => `${d}T00:00:00Z`;
const feedUpdated = posts.length ? stamp(posts.reduce((m, p) => (p.updated > m ? p.updated : m), '0000-00-00')) : '1970-01-01T00:00:00Z';
const absolutize = (html) => html.replace(/(href|src)="\/(?!\/)/g, `$1="${SITE_ORIGIN}/`);

put(
  'feed.xml',
  `<?xml version="1.0" encoding="utf-8"?>\n<feed xmlns="http://www.w3.org/2005/Atom">\n` +
    `  <title>OneDroid Blog</title>\n  <id>${ABS}</id>\n  <updated>${feedUpdated}</updated>\n` +
    `  <link rel="self" type="application/atom+xml" href="${ABS}/feed.xml"/>\n` +
    `  <link rel="alternate" type="text/html" href="${ABS}"/>\n` +
    posts
      .map(
        (p) =>
          `  <entry>\n    <title>${esc(p.meta.title)}</title>\n    <id>${p.abs}</id>\n` +
          `    <link rel="alternate" type="text/html" href="${p.abs}"/>\n` +
          `    <link rel="alternate" type="text/markdown" href="${p.abs}.md"/>\n` +
          `    <published>${stamp(p.date)}</published>\n    <updated>${stamp(p.updated)}</updated>\n` +
          `    <author><name>${esc(p.meta.author)}</name></author>\n` +
          p.tags.map((t) => `    <category term="${esc(t)}"/>\n`).join('') +
          `    <summary>${esc(p.meta.description)}</summary>\n` +
          `    <content type="html">${esc(absolutize(render(p.body)))}</content>\n  </entry>\n`
      )
      .join('') +
    `</feed>\n`
);

put(
  'sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    `  <url><loc>${ABS}</loc>${posts.length ? `<lastmod>${feedUpdated.slice(0, 10)}</lastmod>` : ''}</url>\n` +
    posts.map((p) => `  <url><loc>${p.abs}</loc><lastmod>${p.updated}</lastmod></url>\n`).join('') +
    `</urlset>\n`
);

put(
  'llms.txt',
  `# OneDroid Blog\n\n> Posts from the OneDroid team about AI agent infrastructure.\n\n` +
    `Every post is markdown in a repository and is served as markdown at its .md URL below, and to\n` +
    `AI-agent user-agents at the canonical URL. Newest first.\n\n## Posts\n\n` +
    (posts.length
      ? posts.map((p) => `- [${p.meta.title}](${p.abs}.md): ${p.meta.description}`).join('\n')
      : 'No posts yet.') +
    `\n`
);

// ---------------------------------------------------------------- check / write

function walkDist(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir)) {
    const full = join(dir, e);
    if (statSync(full).isDirectory()) out.push(...walkDist(full));
    else out.push(relative(DIST, full).split(sep).join('/'));
  }
  return out;
}

function main() {
  if (CHECK) {
    const stale = [];
    for (const [rel, body] of files) {
      const path = join(DIST, rel);
      const buf = Buffer.isBuffer(body) ? body : Buffer.from(body, 'utf8');
      if (!existsSync(path) || !readFileSync(path).equals(buf)) stale.push(rel);
    }
    for (const rel of walkDist(DIST)) if (!files.has(rel)) stale.push(`${rel} (unexpected)`);
    if (stale.length) {
      console.error(`STALE (${stale.length}): ${stale.slice(0, 8).join(', ')}`);
      process.exit(1);
    }
    console.log(`OK: dist matches content (${posts.length} posts).`);
    return;
  }
  // rmSync is destructive: never point it at a directory that holds, or is, the content.
  const c = CONTENT + sep;
  if (DIST === dirname(DIST) || c.startsWith(DIST + sep) || DIST.startsWith(c)) {
    fail(`refusing to clean ${DIST}: it contains or sits inside the content directory`);
  }
  rmSync(DIST, { recursive: true, force: true });
  for (const [rel, body] of files) {
    const path = join(DIST, rel);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, body);
  }
  console.log(`Built ${posts.length} posts (${allPosts.length - posts.length} drafts skipped), ${files.size} files -> ${relative(process.cwd(), DIST) || '.'}/`);
}

main();
