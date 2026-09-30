---
title: "How to give your AI agent persistent memory: a step-by-step OneDroid Engram setup"
description: Seven steps to give an AI agent memory that outlives the session, using OneDroid Engram. Set up a namespace and a scoped token, connect an MCP client, and prove that a new session can find what an earlier one wrote.
date: 2026-10-01
author: OneDroid
tags: memory, engram, how-to
---

A model session ends and takes everything with it. The next session starts from nothing, and you paste the same context again.

This guide sets up a store that outlives the session. At the end, one agent session will have written a decision, and a separate session will have found it by meaning. You run that proof yourself.

The store is OneDroid Engram. Its documentation is at [docs.onedroid.ai](https://docs.onedroid.ai/engram).

## What you need

- A OneDroid account. You sign in with Google or an email address. It is the same account you use for OneDroid Synapse. OneDroid Engram is free for individuals and small teams.
- An MCP client that speaks streamable HTTP and can send a header.
- `curl`, for the connection check.

## Steps

### 1. Sign in

Go to [engram.onedroid.ai](https://engram.onedroid.ai). A new account starts with one library, **Personal**. A library is the top-level container you own and share.

### 2. Create a namespace

A namespace is a subject area inside a library, and it is what you write into. In the sidebar, open **Namespaces**. Select a single library first. The page will not create anything while **All Libraries** is selected. Choose **Create** and enter a name. Names use letters, numbers, dots, hyphens and underscores. Use `product-decisions`.

### 3. Create a library token

Open **API Tokens** and create a **library token** for the library that holds your namespace. It reaches one library and nothing else, which suits an agent you want bounded. Give it a name and an expiry. The page offers 7, 30 (the default), 60 or 90 days.

Copy the token from the banner. It is shown once. It looks like `engram_` followed by 32 hex characters. Keep it out of chat and git.

### 4. Point your client at the endpoint

In your client's MCP settings, set the server address:

```
https://engram.onedroid.ai/mcp
```

Send the token as a header:

```
Authorization: Bearer <your engram token>
```

If your client cannot set headers, the docs describe a `?token=` form of the URL. URLs end up in logs and history, so use the header when you can.

You can also reach OneDroid Engram through a OneDroid Synapse hub, where calls are governed and audited with your other tools. Paste the library token into **Paste API token…** on the Engram connection and choose **Paste token**.

### 5. Test the token without a client

```bash
curl -si https://engram.onedroid.ai/mcp \
  -H "Authorization: Bearer <your engram token>" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize",
       "params":{"protocolVersion":"2025-06-18","capabilities":{},
                 "clientInfo":{"name":"probe","version":"1.0"}}}'
```

A good token returns HTTP 200, an `Mcp-Session-Id` header, and a result naming the server `engram`.

### 6. Have the agent write a memory

Ask your agent to write a note with `engram_write`. Three parameters are required:

```
engram_write
  collection: "product-decisions"
  title:      "Why we chose Postgres over MongoDB"
  content:    "## Decision\n\nWe store product events in Postgres ..."
  kind:       "decision"
```

`collection` takes a namespace name or its UUID. `kind` is optional and defaults to `document`. The response carries an `id`, a `commit_sha`, a `chunk_count` and an `embedded_count`. When the two counts match, every chunk is searchable by meaning. No embedding provider needs configuring first.

### 7. Have the agent search it back

```
engram_search
  query:      "which database did we pick for events and why"
  collection: "product-decisions"
```

Search is hybrid. It blends meaning and keywords, 70/30 by default. Leave out `collection` to search everything the token reaches.

## Check that it worked

1. Close the session that wrote the note.
2. Open a new session, with the same client and the same token.
3. Ask the agent to run `engram_search` with a question worded differently from the title.
4. Confirm that the result contains your decision.

Results are chunks, not objects. The `heading` field says which section matched, and one object can appear more than once.

To see the record, ask for `engram_history` on the object. A first write appears as `add: Why we chose Postgres over MongoDB`.

## What goes wrong

- **HTTP 401 with the plain-text body `Unauthorized`.** The token is missing, wrong or revoked. The body is not JSON, so a client that parses it reports a parse error. That means unauthorised, not broken.
- **An empty result.** A valid namespace with nothing matching returns `{"results": [], "total_results": 0}`. It is not an error. If a query that used to match returns nothing, check that the namespace still has objects.
- **Every result shows `vector_score: 0`.** The query could not be embedded, and search fell back to keywords only, with no warning. The cause is usually transient. If it never changes, check the library's embedding model. Meaning-based search needs 1536-dimension vectors.
- **`collection "…" not found`.** The namespace name is wrong. A typo fails loudly.
- **A OneDroid Synapse message reading "You haven't connected your credentials for 'engram'".** The hub is fine. Your own credential for that connection is missing. Go to **Connect → Connections** and use **My credential** on that row. The message names a "My Connections" tab that no longer exists.
- **A hub row showing "server unreachable" with `upstream returned HTTP 401`.** The server answered and rejected the token. Mint a new one and paste it again.

## What this is not

- **Writes are explicit.** `engram_write` adds a new object each time, so calling it twice makes two. To change one, use `engram_update`. Each update is a new version, and `engram_restore` brings an old version back as a new one.
- **Tool calls pass through your model provider.** The content you write with `engram_write` travels through the model your client uses. For sensitive material, add it in the web app, which never touches a model.
- **A library token sees one library.** A namespace in any other library answers `not found`.
- **Not everything is in your database.** If you bring your own Postgres, your content lives there. The library registry, which records which libraries exist and who belongs to them, is read from the OneDroid platform database.

The full path, with every call and response, is in [Using Engram](https://docs.onedroid.ai/engram-usage). Every tool is listed in the [tool reference](https://docs.onedroid.ai/engram-tools).
