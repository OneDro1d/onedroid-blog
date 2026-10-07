---
title: "Before you put an AI agent in front of trading data: what one test found in a FINOS CALM demo"
description: A case study for product owners and leaders. Seven checks, sealed before the run, asked whether an open source demo that puts an AI agent's tool server in front of trading data does what its architecture says. Its guardrail held in search but not on a second path to the same data. What it took, what it caught, and what it does not prove.
date: 2026-10-08
author: OneDroid
tags: case study, OneDroid Argus, AI agents, architecture, testing
---

Giving an AI agent access to business data comes with two promises written on paper. An architecture diagram says which parts may talk to which. A guardrail says what the agent must never see. Both are easy to approve in a review meeting, and hard to check once the system is running.

This is a short case study of checking both promises with one test, written for the people who decide whether such a system goes live. The engineers' version, with every check and every table, is on [the case study page](https://onedroid.ai/case-study-finos-calm).

## The decision

A team is about to put an AI agent's tool server in front of trading data. Before trusting it, they want three answers: does the running system match its architecture, does the guardrail hold on every path to the data, and can anyone prove later exactly what was tested and what it found?

We asked those questions of an open source demo built for exactly this situation: the "trades API and MCP" demo of FINOS CALM, a project that writes a system's architecture down as a file. The demo has a trades service, a tool server an AI agent talks to, and a guardrail that must keep three stock symbols away from the agent.

## What we did

Our team ran the demo, unchanged, on one shared cloud cluster, and ran seven checks against it with OneDroid Argus. Six of the checks were generated straight from the demo's own architecture file, so they test what the file says rather than what someone remembered. One was written by hand to ask a question the file does not.

The checks were sealed before the run, so nobody could change them after seeing a result, and the seal and the verdict were recorded on public ledgers. Before running, OneDroid Argus also confirmed that the software actually running was exactly the version the team said it was testing.

## What it found

Five checks passed and two failed:

1. **The guardrail did not cover a second path.** It refused the three restricted symbols when the agent searched for trades. But when the agent asked for one restricted trade by its id, it got the whole trade back: instrument, price, quantity and status.
2. **A connection the architecture forbids was open.** This one is about our own cluster, not the demo: our cluster does not enforce the network rules the demo ships with, so they had no effect there. On a cluster that enforces them, it may not appear.

What held is just as useful to know: the agent's tool server answered where the architecture says it should, and the guardrail let an allowed symbol through and refused the three restricted ones in search, every time.

## The finding that changes the decision

Number 1 is the one to remember. A guardrail tested on the obvious path looks finished. The hand-written check asked for the same data a second way, and the data came out. A review of the diagram would not have found it, because the diagram says a guardrail exists, not where it applies.

Number 2 matters too, because it is ours. A rule about what must not connect is only as good as the network underneath it. A check generated from the architecture asks that question on every deployment, including your own.

## What it took

One shared cluster, the demo's own published software and setup, seven checks, and one certified run. The demo generates made-up trade data when it starts, so no real trading data was involved.

## What it does not prove

- One deployment, on a cluster that does not enforce network rules. Finding 2 may not appear elsewhere.
- One certified run, plus an earlier certified run of the same checks the same day, which gave the same result. Two runs are not a stability measure.
- Demo data, regenerated at each start, not real data.
- No capacity claim. Two practice runs outside the sealed set served up to 160 users at once without errors, and the limit was not reached.
- No checks of screens or browsers, and no check of the demo's third service.
- We did not trace the cause of finding 1 in the demo's code, and we have not reported it to the demo's authors.
- The same team wrote the checks, ran them and wrote this. Running the sealed set again is the independent check.

This is a record of what one set of checks saw. It is not a review of FINOS CALM or of the demo. OneDroid is not affiliated with FINOS, the CALM project or the demo's authors.

## The takeaway

Before an AI agent goes near sensitive data, turn the architecture and the guardrail into checks, seal them, and run them against the system as it is actually deployed. Then ask the same data for a second way in.

The full tables, the setup, the ledger records and every limit are on [the case study page](https://onedroid.ai/case-study-finos-calm), with a PDF and a Word file to share.
