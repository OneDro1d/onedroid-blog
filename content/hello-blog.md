---
title: Hello, blog
description: Placeholder that documents the post frontmatter. It is a draft and is never published.
date: 2026-09-30
author: OneDroid
tags: meta
draft: true
---

This is a placeholder. `draft: true` keeps it out of every output (pages, markdown twins, feed,
sitemap, llms.txt), so the repo builds with zero published posts.

Frontmatter fields:

- `title`, `description`, `date` (YYYY-MM-DD) and `author` are required. The build fails without them.
- `tags` (comma-separated), `updated` (YYYY-MM-DD) and `draft` (`true` hides the post) are optional.

The file name is the slug: `content/merged-is-not-deployed.md` is published at `/blog/merged-is-not-deployed`.
Delete this file when the first real post lands.
