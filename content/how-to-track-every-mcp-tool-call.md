---
title: How to track every MCP tool call your AI agents make
description: Ten steps to a log that names who called which MCP tool and when, using OneDroid Synapse. Ends with a test call you make yourself and find in the log, and a plain list of what the log does not give you.
date: 2026-10-03
author: OneDroid
tags: mcp, audit log, governance, how-to
---

Agents call tools through MCP servers. Afterwards, nobody can say which agent called which tool, on whose behalf, and when. This guide sets up one place where every call is recorded, then shows where to read the record. At the end you will have made a call and found its line.

The test is simple. "What did our agents do last quarter?" should be answered by reading a log, not by an investigation.

## What you need

- A browser and an account at [synapse.onedroid.ai](https://synapse.onedroid.ai).
- Claude Code, or any HTTP MCP client.
- Admin rights on the hub. If you created the hub, you have them. If you were invited, ask the owner ([Set up your hub](https://docs.onedroid.ai/setup)).

## Steps

**1. Sign in and create a hub.** Go to [synapse.onedroid.ai](https://synapse.onedroid.ai) and click **Sign in**. Choose where your data is stored, OneDroid Managed or Bring your own database. Give the hub a name and click **Create hub**. Use the same sign-in method every time. Google and email sign-ins on the same address are two different accounts.

**2. Add a connection.** Go to **Connect → Connections** and enable the upstream service your agents use. Each member then supplies their own credential with **My credential**. That is why the log can name a person rather than "the agent" ([Connections and credentials](https://docs.onedroid.ai/connections)).

**3. Create a token.** Check the hub picker in the top-left is on the right hub. Go to **Manage → API Tokens** and click **Create token**. Name it, and choose an expiry: 30 days, 90 days, 1 year, or No expiration. Copy the token before you close the dialog ([Connect Claude Code](https://docs.onedroid.ai/quickstart)).

**4. Point your client at the hub.**

```bash
claude mcp add \
  --transport http \
  "synapse" \
  https://synapse.onedroid.ai/agent/mcp \
  --header "Authorization: Bearer syn_YOUR_TOKEN"
```

Replace `syn_YOUR_TOKEN` with your token. Never paste a real token into a shared file.

**5. Confirm the connection.** Reload the window or open a new session. Then run `claude mcp list`, or type `/mcp` in an interactive session. You should see the `synapse` entry.

**6. See what the hub exposes.** Open **Connect → Tools**. It lists every tool available on the hub, grouped by service, with a total count. This is the list of what an agent can call here ([Tools, features and the audit trail](https://docs.onedroid.ai/tools-and-governance)).

**7. Check that logging is on.** Open **Admin → Features**. Find **Activity Logging**, which records tool-call activity to the hub's log, and **Compliance Logging**, which is long-term retention. Several rows are locked on by a platform-wide policy. The page says which.

**8. Check that it worked.** From your client, make one tool call. For example, ask the agent to run `synapse__list_hub_connections`, which takes no arguments. Then open **Admin → Activity Logs**. It is the live event stream for the hub and includes every tool call. Filter by event type. Find the row with your time and your name.

We ran this check on our own hub on 30 September 2026. The call appeared in the log within seconds, as one row carrying the user, the tool, a success flag and the latency. Two calls that the hub refused for lack of permission appeared too, marked as failed with the error `permission_denied`. A refused call is evidence as well.

**9. Review and export.** Open **Admin → Reporting**. It is the same record, organised for review, with **Activity**, **Compliance**, **Blockchain** and **Governance** tabs. Each is filterable. Click **Export CSV** to take the record out of the product. A brand-new hub shows "no records yet" until activity happens.

**10. Narrow the surface.** Open **Admin → Tool Toggles**. Disable a tool by its canonical name, for example `gmail_send_email`. It is gone for every member until you re-enable it. Over MCP, admins use `synapse_toggle_tool`, and `synapse_list_tool_toggles` reads the current overrides. The toggle is hub-wide. For per-person differences, use roles and groups.

## What each log line records

In **Activity Logs**, each row names these five things:

- time
- event
- actor
- target
- details

The event types include hub created, member invited, role changed, connection enabled, token created, feature toggled, and every tool call.

For a tool call, the [OneDroid Synapse page](https://onedroid.ai/synapse) lists what the entry holds: caller, tool, arguments hash, latency and result class. The [security page](https://onedroid.ai/security) puts it as which agent called which tool, on which connection, when, and whether it was allowed.

Calls made through a token or an OAuth connection are attributed to the person. An agent acting for you appears as you acting through an agent.

## What goes wrong

- **`401 missing_token`.** The header did not arrive. **`401 invalid_token`.** The token is wrong, rotated or revoked. The curl probe on the [quickstart page](https://docs.onedroid.ai/quickstart) tells the two apart.
- **No tools listed.** A fresh hub has zero connections. If you were invited, the owner has to enable them.
- **"You haven't connected your credentials for 'X'".** Your token is good. Your credential for that connection is missing. Use **Connect → Connections → My credential**. The message still says "My Connections tab". That name is stale ([Troubleshooting](https://docs.onedroid.ai/troubleshooting)).
- **A permission error on an admin tool.** Expected for a non-admin.
- **A reporting page that says "no records yet".** Nothing has happened on the hub yet.
- **A connection an admin just added does not show up.** It takes effect on your next connection, so reconnect.

## What this is not

- It is not a compliance certificate. OneDroid does not hold SOC 2, ISO 27001 or HIPAA attestation today ([Security](https://onedroid.ai/security)).
- Activity Logging is described as fail-open. The docs do not say what that means for a call made while logging is down.
- The docs show a filter by event type and an **Export CSV** control. They do not show a date-range filter or a saved query screen. Export, then filter the file.
- The docs describe Compliance Logging as long-term retention and do not give a period. Confirm the period for your hub before you quote one.
- Toggling a tool off removes it for every member. We saw permission refusals recorded (step 8). We did not test whether a call to a toggled-off tool leaves its own line, so this guide does not claim it does.
- Only calls that go through the hub are recorded. A server your client reaches directly is outside it ([MCP tools](https://docs.onedroid.ai/mcp-tools)).
