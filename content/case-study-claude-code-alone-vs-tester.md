---
title: "Before you add a separate tester to your AI coding agent: what one experiment measured"
description: A case study for product owners and leaders. The same feature built six times, three by Claude Code checking its own work and three by Claude Code with an independent tester, judged on checks neither had seen. The quality was the same. The agent got cheaper and the whole got dearer. What it cost, what it showed, and what it does not prove.
date: 2026-10-19
author: OneDroid
tags: case study, experiment, Claude Code, AI agents, testing
---

An AI coding agent that checks its own work is checking it against its own reading of the request. If it misread the request, its checks share the misreading, and "done" means only that the agent agrees with itself. The usual answer is a second pair of eyes: a separate tester that writes the checks before the work starts and never shows them to the agent.

A second pair of eyes costs money. So before you add one, you want to know two things: does it make the work better, and what does it do to the bill? This is the leaders' version of one experiment that measured both. The engineers' version, with every figure and every limit, is on [the case study page](https://onedroid.ai/case-study-claude-code-alone-vs-tester).

## The decision

Should an AI coding agent test its own work, or should a separate tester do it? The question for the business is not which sounds safer. It is whether the separate tester pays for itself.

## What we did

Our team took a small tasks app and one realistic feature request: adding tags to tasks, with rules for what a valid tag is, filtering by tag, a list of tags in use, and the matching screens. Claude Code built it six times from the same request, word for word, on the same model and settings.

- Three times it worked **alone**, as it normally would: it wrote and ran its own tests.
- Three times it **only built**, while OneDroid Argus acted as the tester. A separate session had written the tester's checks before any build. The agent never saw them. After each build it was told only which checks had failed, by name.

Then every one of the six results was judged on 13 further checks that neither setup had seen, not even by name. They were stored only after the last build.

## What it found

1. **The quality was the same.** All six builds passed all 13 hidden checks.
2. **The agent got cheaper.** With a separate tester it stopped testing itself: it ran its own tests less than once per build instead of three times, used 69% fewer tokens, and cost $1.01 a build instead of $1.97, about half.
3. **The whole got dearer.** The tester's own session, which wrote all the checks once, cost about $5.30. Spread over its three builds, that brought the total to $2.78 a build: 41% more than the agent working alone.
4. **The tester was satisfied first time.** Every build with a tester passed its checks in the first round, so no build needed a second try.

## The finding that changes the decision

On a feature this easy, a separate tester bought no extra quality and cost more in total. Both setups hit the ceiling, so this experiment cannot say whether the tester makes the work better. That needs a harder feature, one where the first build gets something wrong.

What it does show is where the money goes. Taking the testing out of the agent halved the agent's bill. The tester's cost is paid once per feature, and its checks stay behind, ready to run against every later change to the same app. Whether that reuse pays the tester back over several features was not measured here.

## What it cost

Six builds, at list prices for the model, plus one session for the tester. Each build alone took about six minutes. Each build with the tester took about an hour and a half, almost all of it waiting for a person to approve each step. That waiting is why the times cannot be compared. No production system was touched.

## What it does not prove

- It was one feature, and it was too easy to tell the two setups apart on quality.
- Three judged builds per setup is a small sample.
- The two setups ran inside slightly different wrappers, and the setup with a tester also got feedback from 37 older checks of the same app.
- The reuse of the tester's checks over later features, where its value should show, was not measured.
- The same team wrote the checks, ran the builds and wrote this.

This is a record of one experiment. Claude and Claude Code are products of Anthropic, named only to identify what was used. OneDroid is not affiliated with Anthropic.

## The takeaway

A separate tester makes your coding agent cheaper to run, because the agent stops checking itself. On a single easy feature it does not make the whole cheaper or the result better. Judge it on harder work and over several features, and count the tester's checks as something you keep.

The figures, the setup and the limits are on [the case study page](https://onedroid.ai/case-study-claude-code-alone-vs-tester), also as a [PDF](https://onedroid.ai/assets/case-studies/onedroid-case-study-claude-code-alone-vs-tester.pdf) and a [Word file](https://onedroid.ai/assets/case-studies/onedroid-case-study-claude-code-alone-vs-tester.docx). How to set up the checks yourself: [how to test code your AI agent wrote](https://onedroid.ai/blog/how-to-test-code-your-ai-agent-wrote).
