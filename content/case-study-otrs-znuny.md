---
title: "Before you move to a new release: what one test found in OTRS and Znuny"
description: A case study for product owners and leaders. One sealed set of checks ran against OTRS Community Edition 6.0.30 and its fork Znuny 7.3.7 and found six changes that other systems rely on, including a fault in the old release that a plain comparison would have called a regression. What it cost, what it caught, and what it does not prove.
date: 2026-10-07
author: OneDroid
tags: case study, OneDroid Argus, upgrades, testing
---

Moving to a new release of a system your business runs on is a decision with a blind spot. The change log tells you what its authors remembered to write down. It does not tell you what will change for the other systems, scripts and people that talk to it every day.

This is a short case study of closing that blind spot with one test, written for the people who decide whether a move goes ahead. The engineers' version, with every check and every table, is on [the case study page](https://onedroid.ai/case-study-otrs-znuny).

<div style="position:relative;aspect-ratio:16/9;margin:24px 0"><iframe src="https://www.youtube-nocookie.com/embed/s_OzzMsZEXM" title="OTRS 6.0.30 vs Znuny 7.3.7: six differences, one sealed set of checks" loading="lazy" allow="encrypted-media; picture-in-picture; fullscreen" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen style="position:absolute;inset:0;width:100%;height:100%;border:0"></iframe></div>

The video in 56 seconds, [also on YouTube](https://www.youtube.com/watch?v=s_OzzMsZEXM).

## The decision

A team runs a ticketing system and is looking at a move: from OTRS Community Edition 6.0.30 to Znuny 7.3.7, the open source fork that continues it. The question that matters is not "is the new one better?". It is "what will break for everything that already depends on the old one?".

## What we did

An engineer on our team took both releases, installed them side by side on one laptop with the same starting data, and had his coding agent write one set of checks against the system's REST web service and four of its pages. The set was sealed before the comparison ran, so nobody could change it after seeing a result. OneDroid Argus then ran the same 26 checks three times against each system and compared the answers, field by field.

The people who build OneDroid Argus did not choose the system and did not write a check.

## What it found

Six differences that other systems would notice:

1. The old web address answers "not found" on the new release.
2. Every message in a ticket carries a new field.
3. The list of custom fields on a ticket is gone.
4. A ticket's history records two more entries for the same actions.
5. The data kept for a signed-in session is different.
6. An emoji in a message comes back as a replacement character on the **old** release, and unchanged on the new one.

Three of these did not show up when we searched the new release's change log for them. That does not mean they are undocumented. It means a team relying on the change log alone could have missed them.

What stayed the same is just as useful to know: error messages, customer permissions, the ticket workflow, search, and the response time of the sign-in page.

## The finding that changes the decision

Number 6 is the one to look at twice. The old release was the reference, and the old release is the one that gets it wrong. A comparison that only asks "does the new system behave like the old one?" would have reported the new release's correct behaviour as a regression, and a team could have spent time "fixing" the improvement away.

OneDroid Argus could see this because a check can state what is right for every system, the old one included, instead of treating the old system as right by definition.

## What it cost

One laptop, one engineer and his coding agent, over two days. The six runs of the first, smaller set took about 8 minutes. No production system was touched.

## What it does not prove

- Both systems were fresh installs. A move with years of real data, the common case, was not tested.
- Only one web service and four pages were checked. Most of both products was never asked a question.
- No checks of the browser screens, the database or email.
- The timings come from one laptop and five users. They show the new release was not slower here. They are not a benchmark.
- We did not trace the differences into the source code, and we do not say which ones are intended.
- The same team wrote the checks, ran them and wrote this. Running the sealed set again is the independent check.

This is a record of what one set of checks saw. It is not a review of either product. OneDroid is not affiliated with OTRS or Znuny.

## The takeaway

Before a move, run the same questions against both systems and read the answers side by side. Ask what is right, not only what is the same, so that a fault in the old system does not become the standard for the new one.

The full tables, the setup and every limit are on [the case study page](https://onedroid.ai/case-study-otrs-znuny), with a PDF and a Word file to share.
