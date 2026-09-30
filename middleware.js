// Serve the markdown source to agents, the HTML to humans, at the same URL.
//
// Same reasoning as onedroid-docs: this has to be middleware rather than a vercel.json rewrite,
// because Vercel evaluates rewrites only AFTER the filesystem check, so a rewrite on a path that
// already resolves to a file never fires.
//
// This project is reached through a rewrite from onedroid.ai/blog/*, so the path seen here still
// carries the /blog prefix. Keep BASE_PATH in sync with build.mjs.
//
// No imports: @vercel/edge's rewrite() helper would add a dependency.

const BASE_PATH = "/blog";

const AGENTS = /(ClaudeBot|Claude-User|Claude-SearchBot|GPTBot|ChatGPT-User|OAI-SearchBot|PerplexityBot|Perplexity-User|Google-Extended|CCBot|Applebot-Extended|Bytespider|meta-externalagent)/i;

export const config = {
  // /blog and /blog/<anything without a file extension>. Assets, feed, sitemap, llms.txt and the
  // .md twins themselves have extensions and are served as files.
  matcher: ["/blog", "/blog/((?!.*\\.[A-Za-z0-9]+$).*)"],
};

export default function middleware(request) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, "") || "/";
  if (path !== BASE_PATH && !path.startsWith(`${BASE_PATH}/`)) return;

  const ua = request.headers.get("user-agent") || "";
  const accept = request.headers.get("accept") || "";
  if (!AGENTS.test(ua) && !accept.includes("text/markdown")) return;

  const twin = path === BASE_PATH ? `${BASE_PATH}/index.md` : `${path}.md`;
  return new Response(null, {
    headers: {
      "x-middleware-rewrite": new URL(twin, request.url).toString(),
      Vary: "User-Agent, Accept",
    },
  });
}
