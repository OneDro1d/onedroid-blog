---
title: How to make your MCP servers portable across AI clients
description: Eight steps to connect your MCP tools once with OneDroid Synapse and reach the same tools from Claude Code and from Claude Desktop or claude.ai. Includes a check to rerun whenever a client stops seeing them.
date: 2026-10-02
author: OneDroid
tags: mcp, synapse, how-to
---

Your MCP servers are configured one client at a time. Each client holds its own credentials. A new client or a new machine means doing the work again.

This guide moves the tool connections out of the clients. At the end, two different AI clients will reach the same tools, and you will have a check that shows whether they do.

## What you need before you start

- A Google account or an email address to sign in with.
- The MCP servers you want to keep, with the URL and the token or login for each.
- Claude Code, for the `claude mcp add` command in step 5.
- Claude Desktop or claude.ai, for step 7.
- `curl`, for the check in step 8.

The tools sit behind OneDroid Synapse, a governed MCP gateway. Your clients connect to it instead of to each server.

## Steps

### 1. Sign in and create a hub

Go to [synapse.onedroid.ai](https://synapse.onedroid.ai) and click **Sign in**. Use **Continue with Google** or an email address. Use the same method every time. Google and email sign-ins on the same address are two different accounts.

Choose where your data is stored: **OneDroid Managed** or bring your own database. Give the hub a name and click **Create hub**. The hub holds your connections, your team and your permissions.

OneDroid Synapse appends a short suffix to the slug you type. Read the real slug from the browser URL.

### 2. Add your MCP servers to the hub

Go to **Connect → Connections**. The top of the page, **MCP Servers**, is what is on your hub. Below it is a collapsed **Catalogue** of connections you have not added.

For a catalogue entry, click its **Add … to this hub** button. For any other remote MCP server, click **Add remote MCP** and fill in:

- a namespace, lowercase and hyphenated. Its tools are prefixed with it, so `slack` becomes `slack__send_message`
- a display name
- a transport: **HTTP (modern)**, **SSE (legacy)** or **stdio (local)**
- the server URL
- an auth type: **API token** or **OAuth (auto-discovery)**

Adding a connection is an admin action. On a hub you created, you are the admin.

### 3. Save your own credential for each connection

A connection says the hub offers a service. It does not let you call it. Each member supplies their own credential.

On each row, use **My credential**. Token connections, marked **(PAT)**, show a password field in the row. Paste the token and click **Connect**. OAuth connections such as Slack, Monday, Notion, Miro, GitHub and Betterstack open a popup. If nothing happens, allow popups for `synapse.onedroid.ai` and click **Connect** again.

Then click **Verify** on the row. It proves the credential works now.

### 4. Create a token

Sign in at [synapse.onedroid.ai](https://synapse.onedroid.ai). Check that the hub picker in the top-left is on the hub you want, because a token is bound to one hub and one user. Go to **Manage → API Tokens** and click **Create token**.

Name it something you will recognise, such as `claude-code-laptop`. Pick an expiry: **30 days, 90 days, 1 year, or No expiration**. Copy the token before you dismiss the dialog.

### 5. Connect the first client

```bash
claude mcp add \
  --transport http \
  "synapse" \
  https://synapse.onedroid.ai/agent/mcp \
  --header "Authorization: Bearer syn_YOUR_TOKEN"
```

The label `synapse` is arbitrary. The URL is not. Use `/agent/mcp` with a token, with no hub slug.

### 6. Reload and confirm

MCP servers load at startup. Reload the window or open a new session, then run:

```bash
claude mcp list
```

You should see `synapse: https://synapse.onedroid.ai/agent/mcp (HTTP) - ✓ Connected`. In an interactive session, `/mcp` shows the `synapse` entry and the tools your hub exposes.

### 7. Connect a second client

Claude Desktop and claude.ai use a different route. There is no token to handle. You sign in through a consent screen.

In your hub, open **Connect → AI Clients**. It prints the exact URL for your hub. The shape is:

```text
https://synapse.onedroid.ai/hub/<your-slug>/mcp
```

Put your real slug in, suffix included. In Claude, open **Settings → Connectors**, choose to add a custom connector, and paste the URL. A consent screen opens in your browser. Approve it.

If your client asks for a Client ID and Secret, use **Generate credentials** on the **AI Clients** page and paste them into the client.

### 8. Check that it worked

Ask each assistant to list the tools it can reach. You should see tools named for the connections on your hub. Both clients read the same hub, so both should list tools from the same connections.

Then run this probe. It returns HTTP 200 with a JSON-RPC result when the token is good:

```bash
curl -s https://synapse.onedroid.ai/agent/mcp \
  -H "Authorization: Bearer syn_YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize",
       "params":{"protocolVersion":"2025-06-18","capabilities":{},
                 "clientInfo":{"name":"probe","version":"1.0"}}}'
```

Run it first whenever something fails. It separates a wrong token from a client that is not sending the header.

## What goes wrong

- **`401 missing_token`**: the header is not being sent. Run `claude mcp get <name>` and look for the `Headers` block.
- **`401 invalid_token`**: a typo, or the token was rotated or revoked. Use **Reveal** on the tokens page and compare, or rotate and reconfigure.
- **`ERR_SCOPE_UNAVAILABLE`**: you called `/hub/<slug>/mcp` with a slug that does not match the token's hub. Use `/agent/mcp`.
- **A short tool list and no error**: check the URL for a missing `/agent`. The bare `https://synapse.onedroid.ai/mcp` is not hub-scoped.
- **Connected, but no tools**: the hub has no connections enabled yet. Go back to step 2.
- **"You haven't connected your credentials for 'X'"**: your token is good. Your credential for that connection is missing. Go to **Connect → Connections** and use **My credential** on that row. Check the name in the quotes, because one service can have several aliases.

## What this is not

- There are two routes, not one. Token clients use `/agent/mcp`. Browser OAuth clients use `/hub/<slug>/mcp`. The two are not interchangeable.
- A token is not a service account. It carries your identity, your role and your audit trail.
- A token is bound to one user and one hub. You can hold five per user per hub.
- Microsoft 365 is not available on `synapse.onedroid.ai`. Google Workspace needs your own Google app there.
- Enabling a connection does not give anyone a credential for it. Each member supplies their own.

Reference pages: [Connect Claude Code](https://docs.onedroid.ai/quickstart), [Connect Claude Desktop or claude.ai](https://docs.onedroid.ai/claude-desktop), [Connections and credentials](https://docs.onedroid.ai/connections), [Endpoints and authentication](https://docs.onedroid.ai/endpoints), [Troubleshooting](https://docs.onedroid.ai/troubleshooting).
