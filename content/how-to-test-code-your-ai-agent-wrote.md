---
title: "How to test code your AI agent wrote: 5 steps"
description: Five steps for testing code a coding agent wrote, using test cases the agent never sees. They come from the day this method found two bugs in our own build while every visible test was green. Includes what the method does not prove.
date: 2026-09-30
author: OneDroid
tags: testing, coding agents, holdout, how-to
---

This is a five-step method for testing code written by a coding agent. It needs no new tool: a folder the agent cannot read, and the discipline to run one check once. The steps are further down. First, why the tests you already have are not enough, and the day that showed us.

## The problem: the agent is grading its own homework

A common definition of done with coding agents: the agent wrote the code, the agent wrote the tests, the tests are green. That is not a test result. It is the agent agreeing with itself.

Agent-written tests are not useless. They measure the wrong thing. They tell you the code does what the agent thought of. The bugs that reach production live in what it did not think of.

## What happened on 24 September 2026

Our coding agents build one of our MCP tools, the one that turns text into narrated video. Part of its acceptance cases is withheld from them: the agents that write the code never see those cases.

On 24 September the visible unit tests were all green. The withheld cases found two bugs in that code:

1. **A NUL byte in a text field crashed text-to-speech.** It passed the tool's input schema, reached the text-to-speech step and crashed it. The caller was then told "provider unavailable, retry", which was wrong: retrying the same input could never work.
2. **A video shorter than the 3-second minimum was accepted.** The build took it anyway.

Both are fixed: the bad text is now refused at the gateway with an error that says what is wrong, and the short video is refused too.

Neither bug is exotic. Both are the kind a careful reviewer would ask about. The visible tests did not ask, because the code and its tests came from the same understanding of the problem. Whatever that understanding missed in one, it missed in the other.

One tool, one day, two bugs, found by cases the builder never saw. It is not a study and we will not dress it up as one.

## The 5 steps

The name for this is a holdout, and it comes from machine learning: you do not grade a model on the examples it trained on. If a coding agent has read the acceptance cases, passing them proves it can satisfy text it has read. If it has not, passing them is evidence about the system.

1. **Write the acceptance cases before the code.** Cover the happy path, the repeat, the wrong actor, the wrong state, and every external call failing.
2. **Split them.** The builder gets enough cases to understand the job. The rest is withheld.
3. **Keep the withheld cases where the agent's session cannot read them.** Not a folder it is asked to ignore: a place it has no access to.
4. **Run them once, against the finished build.** During the build the agent may learn that a withheld case failed and what the system actually did. It does not learn what was expected.
5. **After the verdict, publish them and write new ones.** A case the builder has now seen is a regression test. It has stopped being a holdout.

## What this does not prove

Withheld cases miss things too. They are written by people, from the same requirements, with the same blind spots as any test plan.

And "withheld" is only as strong as its custody. If the agent can read the folder, nothing is withheld, and no amount of process language changes that. Proving the cases existed before the build is one problem. Proving the builder never looked is a different one.

## Where OneDroid Argus fits

This method is what [OneDroid Argus](https://onedroid.ai/argus) packages: the scenario set is sealed and its hash anchored before the build, run against a pinned artefact the coding agent never tested it on, and revealed in full after the verdict so anyone can replay it. Every scenario ends as passed, failed, or harness error, and a harness error is never a pass.

OneDroid Argus is in early access and its runner is not published yet. The method does not wait for it: the five steps above work today.

A green run from the builder is a claim. The part of the job that stays with you is deciding what "done" means before the code exists, and not calling it done until something the builder never saw says so.

---

*Written by the agent that runs OneDroid's social accounts and merged by a human. Both bugs are from our own build logs.*
