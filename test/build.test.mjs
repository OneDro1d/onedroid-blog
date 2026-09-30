import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, statSync, rmSync, existsSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, relative, sep } from 'node:path';

const REPO = dirname(dirname(new URL(import.meta.url).pathname));
const BUILD = join(REPO, 'build.mjs');
const ORIGIN = 'https://onedroid.ai';

const post = (fm, body = 'Body text.\n') =>
  `---\n${Object.entries(fm).map(([k, v]) => `${k}: ${v}`).join('\n')}\n---\n\n${body}`;

const GOOD = { title: 'Merged is not deployed', description: 'A short "quoted" & <escaped> summary', date: '2026-09-20', author: 'Jane <Doe>' };

function fixture(files) {
  const dir = mkdtempSync(join(tmpdir(), 'blog-test-'));
  const content = join(dir, 'content');
  mkdirSync(content);
  for (const [name, data] of Object.entries(files)) {
    mkdirSync(dirname(join(content, name)), { recursive: true });
    writeFileSync(join(content, name), data);
  }
  return { dir, content, out: join(dir, 'dist') };
}

function run(fx, args = [], script = BUILD) {
  return spawnSync(process.execPath, [script, ...args], {
    env: { ...process.env, BLOG_CONTENT_DIR: fx.content, BLOG_OUT_DIR: fx.out },
    encoding: 'utf8',
  });
}

function list(dir, base = dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir)) {
    const f = join(dir, e);
    if (statSync(f).isDirectory()) out.push(...list(f, base));
    else out.push(relative(base, f).split(sep).join('/'));
  }
  return out.sort();
}

const read = (fx, rel) => readFileSync(join(fx.out, rel), 'utf8');

const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');

function full() {
  return fixture({
    'older-post.md': post({ ...GOOD, title: 'Older', date: '2026-01-05', tags: 'a, b' }, '## Heading\n\nSee [the index](/blog) and [docs](https://docs.onedroid.ai).\n'),
    'merged-is-not-deployed.md': post({ ...GOOD, updated: '2026-09-25', tags: 'ci' }, '# Top\n\n![A pixel](/blog/img/px.png)\n\nText with `code`.\n'),
    'a-draft.md': post({ ...GOOD, title: 'SECRET DRAFT', draft: 'true' }),
    'img/px.png': PNG,
  });
}

test('build emits the expected file set under /blog and skips drafts', () => {
  const fx = full();
  const r = run(fx);
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(list(fx.out), [
    'blog/feed.xml',
    'blog/img/px.png',
    'blog/index.html',
    'blog/index.md',
    'blog/llms.txt',
    'blog/merged-is-not-deployed.html',
    'blog/merged-is-not-deployed.md',
    'blog/older-post.html',
    'blog/older-post.md',
    'blog/sitemap.xml',
  ]);
  for (const f of list(fx.out)) assert.ok(!readFileSync(join(fx.out, f)).includes('SECRET DRAFT'), `draft leaked into ${f}`);
});

test('markdown twin is the source file byte for byte; images are copied byte for byte', () => {
  const fx = full();
  run(fx);
  const src = readFileSync(join(fx.content, 'merged-is-not-deployed.md'));
  assert.ok(readFileSync(join(fx.out, 'blog/merged-is-not-deployed.md')).equals(src));
  assert.ok(readFileSync(join(fx.out, 'blog/img/px.png')).equals(PNG));
});

test('post page has the required head tags, JSON-LD, visible date and author, escaped frontmatter', () => {
  const fx = full();
  run(fx);
  const h = read(fx, 'blog/merged-is-not-deployed.html');
  const canon = `${ORIGIN}/blog/merged-is-not-deployed`;
  assert.match(h, /<title>Merged is not deployed — OneDroid Blog<\/title>/);
  assert.match(h, /<meta name="description" content="A short &quot;quoted&quot; &amp; &lt;escaped&gt; summary">/);
  assert.ok(h.includes(`<link rel="canonical" href="${canon}">`));
  assert.ok(h.includes(`<meta property="og:url" content="${canon}">`));
  assert.ok(h.includes('<meta property="og:type" content="article">'));
  assert.ok(h.includes('<meta property="og:title"') && h.includes('<meta property="og:description"'));
  assert.ok(h.includes('<meta name="twitter:card"') && h.includes('<meta name="twitter:title"') && h.includes('<meta name="twitter:description"'));
  assert.ok(h.includes('<link rel="alternate" type="text/markdown" href="/blog/merged-is-not-deployed.md">'));
  assert.ok(h.includes('<link rel="alternate" type="application/atom+xml" title="OneDroid Blog" href="/blog/feed.xml">'));
  assert.ok(h.includes('<time datetime="2026-09-20">2026-09-20</time>'));
  assert.ok(h.includes('Jane &lt;Doe&gt;'));
  assert.ok(!h.includes('Jane <Doe>'));
  assert.ok(h.includes('href="/blog"'));
  assert.ok(h.includes('href="https://onedroid.ai"') && h.includes('href="https://docs.onedroid.ai"'));
  assert.ok(!/<script(?![^>]*application\/ld\+json)/.test(h), 'only the JSON-LD script is allowed');
  const blocks = [...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  assert.equal(blocks.length, 1);
  const ld = JSON.parse(blocks[0][1]);
  assert.equal(ld['@type'], 'BlogPosting');
  assert.equal(ld.headline, 'Merged is not deployed');
  assert.equal(ld.datePublished, '2026-09-20');
  assert.equal(ld.dateModified, '2026-09-25');
  assert.equal(ld.author.name, 'Jane <Doe>');
  assert.equal(ld.mainEntityOfPage['@id'], canon);
  assert.equal(ld.publisher.name, 'OneDroid');
  assert.match(h, /<h1 id="top">Top<\/h1>/);
});

test('every internal URL in every html file is under /blog', () => {
  const fx = full();
  run(fx);
  for (const f of list(fx.out).filter((x) => x.endsWith('.html'))) {
    const h = read(fx, f);
    for (const m of h.matchAll(/\s(?:href|src)="([^"]*)"/g)) {
      const u = m[1];
      const ok = u === '/blog' || u.startsWith('/blog/') || u.startsWith('https://') || u.startsWith('#');
      assert.ok(ok, `${f}: URL ${u} escapes /blog`);
    }
  }
});

test('index lists posts newest first with title, date, description; twin index exists', () => {
  const fx = full();
  run(fx);
  const h = read(fx, 'blog/index.html');
  assert.ok(h.indexOf('Merged is not deployed') < h.indexOf('>Older<'));
  assert.ok(h.includes('<time datetime="2026-09-20">'));
  assert.ok(h.includes('A short &quot;quoted&quot; &amp; &lt;escaped&gt; summary'));
  assert.ok(h.includes(`<link rel="canonical" href="${ORIGIN}/blog">`));
  const md = read(fx, 'blog/index.md');
  assert.ok(md.indexOf('merged-is-not-deployed.md') < md.indexOf('older-post.md'));
});

test('feed.xml is Atom with absolute URLs and full content; sitemap and llms.txt list newest first', () => {
  const fx = full();
  run(fx);
  const feed = read(fx, 'blog/feed.xml');
  assert.match(feed, /<feed xmlns="http:\/\/www\.w3\.org\/2005\/Atom">/);
  assert.ok(feed.includes(`<id>${ORIGIN}/blog/merged-is-not-deployed</id>`));
  assert.ok(feed.includes(`href="${ORIGIN}/blog/feed.xml"`));
  assert.ok(feed.includes('<updated>2026-09-25T00:00:00Z</updated>'));
  assert.ok(feed.includes('Text with &lt;code&gt;code&lt;/code&gt;'), 'full rendered content, escaped');
  assert.ok(feed.includes(`src=&quot;${ORIGIN}/blog/img/px.png&quot;`), 'image URL is absolute inside content');
  assert.ok(!/(?:href|src)=(?:"|&quot;)\/blog/.test(feed), 'no relative /blog URL in the feed');
  assert.ok(!feed.includes('SECRET DRAFT'));
  const site = read(fx, 'blog/sitemap.xml');
  assert.ok(site.includes(`<loc>${ORIGIN}/blog</loc>`));
  assert.ok(site.includes(`<loc>${ORIGIN}/blog/older-post</loc>`));
  const llms = read(fx, 'blog/llms.txt');
  assert.ok(llms.includes(`(${ORIGIN}/blog/merged-is-not-deployed.md): A short`));
  assert.ok(llms.indexOf('merged-is-not-deployed') < llms.indexOf('older-post'));
});

test('zero published posts: builds, says no posts yet', () => {
  const fx = fixture({ 'only-draft.md': post({ ...GOOD, draft: 'true' }) });
  const r = run(fx);
  assert.equal(r.status, 0, r.stderr);
  assert.ok(read(fx, 'blog/index.html').includes('No posts yet.'));
  assert.deepEqual(list(fx.out).filter((f) => f.endsWith('.md') && !f.endsWith('index.md')), []);
  assert.equal(run(fx, ['--check']).status, 0);
});

test('the committed placeholder draft is valid and never published', () => {
  // Build the real content directory (which now holds real posts) and check only what this test is about:
  // the draft passes validation and appears in no output.
  const fx = { content: join(REPO, 'content'), out: mkdtempSync(join(tmpdir(), 'blog-out-')) };
  const r = run(fx);
  assert.equal(r.status, 0, r.stderr);
  assert.ok(!existsSync(join(fx.out, 'blog/hello-blog.md')));
  assert.ok(!existsSync(join(fx.out, 'blog/hello-blog.html')));
  assert.ok(!read(fx, 'blog/index.html').includes('hello-blog'));
});

test('build fails, naming file and field, on missing required frontmatter', () => {
  for (const field of ['title', 'description', 'date', 'author']) {
    const fm = { ...GOOD };
    delete fm[field];
    const fx = fixture({ 'bad-post.md': post(fm) });
    const r = run(fx);
    assert.notEqual(r.status, 0, `${field} missing should fail`);
    assert.ok(r.stderr.includes('bad-post.md') && r.stderr.includes(field), r.stderr);
  }
});

test('build fails on invalid dates and slugs', () => {
  for (const date of ['2026-02-30', '2026-9-1', 'yesterday', '2026-13-01']) {
    const fx = fixture({ 'bad-date.md': post({ ...GOOD, date }) });
    const r = run(fx);
    assert.notEqual(r.status, 0, date);
    assert.ok(r.stderr.includes('bad-date.md') && r.stderr.includes('date'), r.stderr);
  }
  const fx = fixture({ 'bad-updated.md': post({ ...GOOD, updated: '2026-02-31' }) });
  const r = run(fx);
  assert.notEqual(r.status, 0);
  assert.ok(r.stderr.includes('updated'));
  for (const name of ['Bad_Slug.md', 'UPPER.md', 'double--dash.md', '-lead.md', 'trail-.md', 'with space.md']) {
    const f = fixture({ [name]: post(GOOD) });
    const rr = run(f);
    assert.notEqual(rr.status, 0, name);
    assert.ok(rr.stderr.includes(name) && rr.stderr.includes('slug'), rr.stderr);
  }
});

test('build fails on links that escape /blog, missing images, missing alt text, script tags', () => {
  const cases = {
    'link.md': 'A [bad](/docs/x) link.\n',
    'img1.md': '![alt](/blog/img/missing.png)\n',
    'img2.md': '![](/blog/img/px.png)\n',
    'img3.md': '![alt](/img/px.png)\n',
    'script.md': '<script>alert(1)</script>\n',
  };
  for (const [name, body] of Object.entries(cases)) {
    const fx = fixture({ [name]: post(GOOD, body), 'img/px.png': PNG });
    const r = run(fx);
    assert.notEqual(r.status, 0, name);
    assert.ok(r.stderr.includes(name), r.stderr);
  }
});

test('--check: passes right after a build, fails on stale content and on missing dist', () => {
  const fx = full();
  assert.equal(run(fx, ['--check']).status, 1, 'missing dist must fail');
  assert.equal(run(fx).status, 0);
  const ok = run(fx, ['--check']);
  assert.equal(ok.status, 0, ok.stderr);
  writeFileSync(join(fx.content, 'older-post.md'), post({ ...GOOD, title: 'Older changed', date: '2026-01-05' }));
  assert.equal(run(fx, ['--check']).status, 1, 'changed content must fail');
  assert.equal(run(fx).status, 0);
  assert.equal(run(fx, ['--check']).status, 0);
  writeFileSync(join(fx.out, 'blog/stray.html'), 'x');
  assert.equal(run(fx, ['--check']).status, 1, 'unexpected file must fail');
});

test('BASE_PATH and SITE_ORIGIN are the only place the prefix and origin are set', () => {
  const src = readFileSync(BUILD, 'utf8');
  assert.match(src, /^const SITE_ORIGIN = 'https:\/\/onedroid\.ai';\nconst BASE_PATH = '\/blog';$/m);
  const moved = src.replace("'https://onedroid.ai'", "'https://example.test'").replace("'/blog'", "'/journal'");
  const tmp = join(REPO, 'test', '_moved-build.tmp.mjs');
  writeFileSync(tmp, moved);
  try {
    const fx = fixture({
      'one.md': post(GOOD, 'See [home](/journal).\n\n![alt](/journal/img/px.png)\n'),
      'img/px.png': PNG,
    });
    const r = run(fx, [], tmp);
    assert.equal(r.status, 0, r.stderr);
    const files = list(fx.out);
    assert.ok(files.includes('journal/one.html') && files.includes('journal/img/px.png') && files.includes('journal/feed.xml'), files.join());
    for (const f of files.filter((x) => /\.(html|xml|txt|md)$/.test(x))) {
      const t = read(fx, f);
      assert.ok(!t.includes('/blog'), `${f} still mentions /blog`);
      assert.ok(!t.includes('https://onedroid.ai/'), `${f} still mentions the old origin`);
    }
    assert.ok(read(fx, 'journal/one.html').includes('<link rel="canonical" href="https://example.test/journal/one">'));
  } finally {
    rmSync(tmp, { force: true });
  }
});

test('middleware serves the markdown twin to agents and Accept: text/markdown under /blog only', async () => {
  const { default: mw, config } = await import(join(REPO, 'middleware.js'));
  const req = (path, headers = {}) => new Request(`https://onedroid.ai${path}`, { headers });
  const rewrite = (res) => res?.headers.get('x-middleware-rewrite');
  assert.equal(rewrite(mw(req('/blog/some-post', { 'user-agent': 'Mozilla/5.0 (compatible; GPTBot/1.0)' }))), 'https://onedroid.ai/blog/some-post.md');
  assert.equal(rewrite(mw(req('/blog', { 'user-agent': 'ClaudeBot' }))), 'https://onedroid.ai/blog/index.md');
  assert.equal(rewrite(mw(req('/blog/', { accept: 'text/markdown' }))), 'https://onedroid.ai/blog/index.md');
  assert.equal(mw(req('/blog/some-post', { 'user-agent': 'Mozilla/5.0 Firefox' })), undefined);
  assert.equal(mw(req('/other', { 'user-agent': 'ClaudeBot' })), undefined);
  const [, pat] = config.matcher;
  const re = new RegExp(`^${pat}$`);
  assert.ok(re.test('/blog/some-post'));
  assert.ok(!re.test('/blog/feed.xml') && !re.test('/blog/some-post.md') && !re.test('/blog/img/px.png'));
});

test('vercel.json sets content types for md, feed, llms.txt and the security headers', () => {
  const v = JSON.parse(readFileSync(join(REPO, 'vercel.json'), 'utf8'));
  assert.equal(v.cleanUrls, true);
  assert.equal(v.trailingSlash, false);
  assert.equal(v.outputDirectory, 'dist');
  const ct = (src) => v.headers.find((h) => h.source === src)?.headers.find((h) => h.key === 'Content-Type')?.value;
  assert.match(ct('/blog/(.*).md'), /^text\/markdown/);
  assert.match(ct('/blog/feed.xml'), /^application\/atom\+xml/);
  assert.match(ct('/blog/llms.txt'), /^text\/plain/);
  const keys = v.headers[0].headers.map((h) => h.key);
  for (const k of ['X-Content-Type-Options', 'X-Frame-Options', 'Referrer-Policy', 'Strict-Transport-Security']) assert.ok(keys.includes(k), k);
});
