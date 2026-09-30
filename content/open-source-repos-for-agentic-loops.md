---
title: 5 best open-source repos for running agentic coding loops
description: Five open-source repositories you can run today for agentic coding loops, each covering a different angle, with licence, stars, last push and one documented weakness per project. One of them is OneDroid's own.
date: 2026-09-30
author: OneDroid
tags: agentic loops, open source, coding agents, list
---

An agentic loop is an agent that plans, acts, checks its own result and repeats, with little human steering. This list gives five open-source repositories you can run today for that kind of work. Each covers a different part of the problem: a method, a loop runner, a minimal agent, a control center and a spec-first process.

Selection criteria:

1. The licence is readable from the GitHub API.
2. The last push is within 90 days of 30 September 2026, and the repository is not archived.
3. The README gives a way to run it.
4. Each project covers a different angle, so the list is not five versions of one thing.

One entry is ours. Dark Factory is OneDroid's own project. It is held to the same rules as the other four: its own README, licence and star count from the GitHub API, and one weakness taken from its own documentation. Every fact below was read on 30 September 2026, and every quote is from the project's own README or docs on that date. "Best" here means the strongest pick for each angle by the criteria above. The five are not ranked against each other.

## 1. Dark Factory (OneDroid's own project)

https://github.com/OneDro1d/dark-factory

In its own words: "The Dark Factory method — autonomous, governed, evidence-gated delivery."

- Licence: Apache-2.0
- Stars: 3, last push 23 September 2026 (as of 30 September 2026)

Good for: a method with enforcement. The README says a Dark Factory "is a build system that runs without a human in the inner loop". It accepts only "raw, unforgeable evidence": "file:line, diffs, exit codes, verbatim command output". A build runs "PO → SA → Infrastructure → Observability → TDD → adversary → QA", each stage a skill. It also states that "A blocked or skipped check is not a pass."

How to start: the README says to start at `starter-kit/instance/START-HERE.md`, which opens with this instruction.

```
# open Claude Code in starter-kit/instance and tell it:
Read START-HERE.md and execute it.
```

Weakness: step 1 of that file checks for `git`, `jq`, `bash`, `python3`, `gh` and `claude`. If a tool is missing, the file says: "tell the human which, and stop."

## 2. Ralph for Claude Code

https://github.com/frankbria/ralph-claude-code

In its own words: "Autonomous AI development loop with intelligent exit detection and rate limiting".

- Licence: MIT
- Stars: 9638, last push 29 September 2026 (as of 30 September 2026)

Good for: running the loop itself. The README says it "enables continuous autonomous development cycles where Claude Code iteratively improves your project until completion". It lists a "Dual-condition exit gate", which "Requires BOTH completion indicators AND explicit EXIT_SIGNAL". It also lists rate limiting at "100 calls/hour, configurable" and a circuit breaker.

How to start:

```
git clone https://github.com/frankbria/ralph-claude-code.git
cd ralph-claude-code
./install.sh
cd my-existing-project
ralph-enable
ralph --monitor
```

Weakness: the README lists under "In Progress" a multi-provider abstraction, "decoupling Ralph from `claude` so any headless coding CLI (Codex, Gemini, OpenCode, Droid, Kilocode, Copilot) can drive the loop". The project is named Ralph for Claude Code.

## 3. mini-swe-agent

https://github.com/SWE-agent/mini-swe-agent

In its own words: "The minimal AI software engineering agent".

- Licence: MIT
- Stars: 8121, last push 28 September 2026 (as of 30 September 2026)

Good for: reading and owning the whole loop. The README says the agent class is "Just some 100 lines of python". It "Has a completely linear history", and it "Executes actions with `subprocess.run`". It lists support for "local environments, docker/podman, singularity/apptainer, bublewrap, contree, and more", and reports that it "Scores >74% on the SWE-bench verified benchmark".

How to start:

```
pip install mini-swe-agent
mini
```

Weakness: the README says the agent "Does not have any tools other than bash". It tells you to use SWE-agent instead if "You want to experiment with different sets of tools" or "different history processors".

## 4. OpenHands

https://github.com/OpenHands/OpenHands

In its own words, the README is titled Agent Canvas: "The self-hosted developer control center for coding agents and automations."

- Licence: MIT
- Stars: 89618, last push 30 September 2026 (as of 30 September 2026)

Good for: running several agents from one place. The README says you can "Run OpenHands, Claude Code, Codex, Gemini, or any ACP-compatible agent across local, remote, and cloud backends". Automations can "Run on a schedule or in response to webhook events". It also documents Docker sandbox options.

How to start (Option 1 in the README; needs Node.js 24 or later and `uv`):

```
npm install -g @openhands/agent-canvas
agent-canvas
```

Weakness: for that option, the README warns: "the agent will have full access to your filesystem!"

## 5. Spec Kit

https://github.com/github/spec-kit

In its own words: "an open source toolkit that gives AI coding agents structured processes, reusable templates, and documented outcomes."

- Licence: MIT
- Stars: 139542, last push 30 September 2026 (as of 30 September 2026)

Good for: putting a specification in front of the agent. The README describes "specify → plan → tasks → implement → converge per feature". It says to "Repeat **implement → converge** until convergence reports **Converged**". For bug fixing it states: "Missing verification is not a successful fix."

How to start (needs Python 3.11+, `uv` and a supported coding agent):

```
uv tool install specify-cli
specify init my-project --integration copilot
cd my-project
```

Weakness: the README tells you to invoke each skill "one at a time, and review the result before continuing". The steps are paced by a person.

## Where the check lives

The five READMEs close the loop in different places. Dark Factory takes raw evidence and treats a skipped check as not a pass. Ralph stops on its own exit gate, which includes an explicit EXIT_SIGNAL from Claude. Spec Kit repeats implement and converge until convergence reports Converged, and asks you to review each step. The OpenHands and mini-swe-agent READMEs are about running the agent well. Neither describes a step that checks the agent's result inside the loop, so that part is yours to add.

A loop is only as good as the check that closes it.
