---
title: "50,000 lines overnight: how do you know what it did? Hold the code to what it promised"
description: A case study for product owners and leaders. A decades-old Fortran library held to its own user guide with 100 checks, sealed before the run and kept from whoever builds. 91 held, 9 failed, every check shown able to fail, and the test boundary published. The method that answers "how do I validate what an AI agent built?".
date: 2026-10-21
author: OneDroid
tags: case study, testing, AI agents, verification, legacy code
---

This week, at a scientific-computing conference, someone asked the question many teams are asking: an AI agent hands you 50,000 lines of code overnight, nobody can read it all, so how do you validate what it did? And how would an organisation ever bet a major investment on it? Later the same day a researcher put the risk plainly: given a checker it can see, an AI will change what is being checked to get the green tick.

Here is how we answer it, shown on real code. This is the leaders' version. The engineers' version, with every check, every figure and every limit, is on [the case study page](https://onedroid.ai/case-study-code-vs-user-guide).

## The decision

Before you depend on a piece of code, keep it, or have an AI agent rewrite it, you need to know whether it does what it promises. How do you find out without reading every line, and without taking anyone's word for the answer, including ours?

## What we did

We took a numerical library that has run for decades, written in Fortran, with a printed user guide that says, sentence by sentence, what the code does. We did not touch the code.

1. **Every promise became a check.** We turned 37 claims from the guide into 100 checks: every worked example, what each exit code and counter means, and the guide's other promises. Each check quotes the sentence it tests, so anyone can see whether we tested the right thing.
2. **The checks were sealed before the run.** Their fingerprint went on a public network before the final run, so nobody, including us, could change them after seeing a result. Whoever builds never sees them: that is what stops gaming.
3. **We proved the checks could fail.** Two copies of the code, each with one number changed on purpose, turned red the checks that depend on it. A check that cannot fail proves nothing.
4. **A model from another company reviewed the work.** It confirmed every failure and found no check that cannot fail. It also found some passing checks that test less than their titles say, and we list them.

## What it found

- **91 of 100 checks held.** Every worked example in the guide still reproduces, to 7 digits, on a compiler decades newer than the guide.
- **9 failed, all in the fine print.** Two medium findings on one rarely used path (when the user stops the solver part-way, two outputs are not what the guide says they are), and two low ones (a counter's definition, and constants that are close approximations rather than the exact values the documentation states). Nothing critical, and no wrong answer reported as a success.
- **The result can be checked by anyone.** The certificate verified with a public, open-source verifier, with no account.

## The finding that changes the decision

Knowing exactly where code and documentation disagree changes what you do next. In a separate study, an AI agent ported this same library to a modern language. A tester that checked the port against the guide made it worse, because the agent "fixed" precisely these places where the code and the guide differ. Test against the wrong reference and the AI does real damage. Map the differences first, then decide which one your users rely on. That study: [the modernization case study](https://onedroid.ai/blog/case-study-modernization-three-setups).

## What it does not prove

Every verdict should come with its boundary. This one's:

- One platform and one compiler. The guide itself says results elsewhere may differ slightly.
- The certificate binds the build we declared. The executor used here could not measure the running build, and the certificate says so.
- One AI session wrote the checks and ran them. The seal proves the order of events, not independence.
- The reviewer read the evidence. It did not run anything again.
- Not every path was explored, and some of the guide's statements were not tested at all. The full list is on the case study page.

The library and its authors are not named: we have not asked them, and this is a record of what one set of checks saw, not a review of their work.

## The takeaway

When an AI agent, or anyone, hands you more code than you can read, don't read it. Hold it to what it was supposed to do:

- turn every promise into a check that quotes it;
- seal the checks before the work, and keep them from whoever builds, because the builder can't game checks it never sees;
- prove each check can fail;
- publish the boundary with the verdict: what was tested, what was not, and what the certificate does not prove.

That is what OneDroid Argus does. The figures, the method and the limits are on [the case study page](https://onedroid.ai/case-study-code-vs-user-guide), also as a [PDF](https://onedroid.ai/assets/case-studies/onedroid-case-study-code-vs-user-guide.pdf) and a [Word file](https://onedroid.ai/assets/case-studies/onedroid-case-study-code-vs-user-guide.docx).
