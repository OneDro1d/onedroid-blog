---
title: "Before you modernize legacy code with an AI agent: what the tester checks decides whether it helps"
description: A case study for product owners and leaders. A decades-old Fortran library ported to Go by Claude Code in three setups and judged on the same hidden checks against the original. A tester pointed at the manual made the port worse; a tester pointed at the original matched the agent alone at 41% less cost. What it cost, what it showed, and what it does not prove.
date: 2026-10-19
author: OneDroid
tags: case study, experiment, Claude Code, AI agents, modernization, testing
---

Modernizing old code has one job above all: keep doing what the old system does. Rewriting a library in a newer language is easy to start and hard to trust, because the old system's behaviour is the specification, and much of it is written down nowhere, or written down slightly wrong.

AI coding agents now do much of this work. A natural move is to add a separate tester that checks the agent's port. This experiment asked whether that helps, and found that it depends entirely on what the tester checks. This is the leaders' version. The engineers' version, with every figure and every limit, is on [the case study page](https://onedroid.ai/case-study-modernization-three-setups).

## The decision

When an AI agent modernizes old code, should a separate tester check its work, and against what: the system's manual, or the old system itself?

## What we did

Our team had Claude Code port a decades-old numerical Fortran library to Go, keeping the original's behaviour. Every run got the same request, the same sources, the same user guide and the same interface. Each setup ran three times:

- **A, alone.** Claude Code worked as it normally would and tested its own port.
- **B, a tester on the manual.** Claude Code only built. A tester ran 100 checks written from the library's user guide and told the agent only which ones failed, for up to four rounds.
- **B′, a tester on the original.** The same, but the tester checked the port's answers against the original library's own recorded answers.

Every port was then judged on 109 further checks against the original's answers, which no setup had seen. The tester here was a simple script, not our product, so this is a result about where a tester points, not about OneDroid Argus.

## What it found

1. **Alone, the agent did well:** 104 of the 109 hidden checks, at $16.92 a run.
2. **The tester on the manual made the port worse:** 81 of 109. Where the original and its manual differ, the tester reported the original's behaviour as a failure, so the agent "fixed" it. In all three runs it changed one numerical detail the original handles approximately, and that single change moved results everywhere. The port scored better against the manual while drifting away from the system it was meant to replace.
3. **The tester on the original matched the agent alone, for much less:** 106 of 109, at $10.04 a run, 41% cheaper than working alone. With "behave like the original" as the test, there was nothing to "fix". The agent only built, ran no tests of its own, and its first port passed.

## The finding that changes the decision

A tester checking the wrong thing is worse than no tester. In a modernization, the thing to keep is the old system's answers, not its documentation. Point the tester there, and an agent that only builds becomes both faithful and cheaper. Point it at the manual, and you pay for a loop that pulls the port away from what your users rely on.

## What it cost

Nine runs of the agent, at its own reported cost, plus the tester's checks, which came from earlier work on the same library and can be reused. Writing those checks is not counted in the cost per run. No production system was touched.

## What it does not prove

- Three runs per setup, on one library.
- The tester's first round passed, so this does not show the loop repairing a port that started out wrong.
- One rule in the interface could be read two ways. It affects 5 of the hidden checks and explains the small lead of B′ over A. Without them, A and B′ tie at 101 of 104.
- One safeguard in the building setup was switched off in every B and B′ run because a helper tool was missing.
- The same team wrote the checks, ran the experiment and wrote this.

This is a record of one experiment. Claude and Claude Code are products of Anthropic, named only to identify what was used. OneDroid is not affiliated with Anthropic.

## The takeaway

If you use an AI agent to modernize code, test it against the system it replaces. Record the old system's answers, keep them away from the agent, and let the agent only build. In this experiment that matched the agent's own best work at 41% less cost, while a tester checking the manual did real damage.

The figures, the setup and the limits are on [the case study page](https://onedroid.ai/case-study-modernization-three-setups), also as a [PDF](https://onedroid.ai/assets/case-studies/onedroid-case-study-modernization-three-setups.pdf) and a [Word file](https://onedroid.ai/assets/case-studies/onedroid-case-study-modernization-three-setups.docx).
