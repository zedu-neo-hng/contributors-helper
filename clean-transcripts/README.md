# Clean Transcripts (Contributor Assistant knowledge base)

Output of **ticket #8 — Transcript Compaction & Cleaning** (`chore/neo-008-transcript-compaction`).

This directory is the durable, committed knowledge source for Zoe. It is derived from the raw
verbatim transcripts in [`../transcripts`](../transcripts) and is designed to be read by the chat
route **at request time** (see *Consumption* below). Per #8's acceptance criteria this ticket
changes no application code, UI or chat routing.

## Two files per session, and why

Every session produces exactly two files with a shared base name:

```
clean-transcripts/
  summaries/<base>.summary.md     ~6 KB   always loaded into the assistant's context
  transcripts/<base>.cleaned.md   varies  loaded only when a question needs the detail
```

- **`summaries/`** — dense, structured extraction: summary, people and roles, decisions,
  guidelines/process, deadlines, action items and Q&A. Small enough to sit in the system prompt on
  every request.
- **`transcripts/`** — the same call with timestamps, ASR line-wrapping, entity noise, stutters and
  filler words removed. Nothing summarised or dropped, so it answers follow-up questions
  ("what exactly did they say about X?") that the summary compresses away.

The split exists because the summaries are ~13k tokens in total (~1.3% of the chat model's 1M-token
window) while the cleaned transcripts are ~114k tokens (~11%). Both fit, but the summaries are the
better always-on context, and the full text is only needed occasionally.

## Sessions

| Date | Session | Summary | Cleaned | Source |
| --- | --- | --: | --: | --- |
| 2026-09-28 | Introductory call & program overview | 6,747 B | 122,354 B | [YouTube](https://www.youtube.com/watch/DDw5IXZoUZo) |
| 2026-09-30 | Lesson 1 — AI-powered product development | 6,183 B | 76,567 B | [YouTube](https://www.youtube.com/watch/WAGHjPHeQjE) |
| 2026-10-02 | Lesson 3 | 5,992 B | 46,925 B | [YouTube](https://www.youtube.com/watch/KEotAPiRYDQ) |
| 2026-10-05 | Lesson 4 (week 2) — mobile/desktop setup, taste, ticket scoping | 5,985 B | 54,342 B | [YouTube](https://www.youtube.com/watch/-j4WOSfR8dQ) |
| 2026-10-07 | Lesson 5 (week 2) — squad consolidation, redesign mandate, PR gates | 8,219 B | 90,244 B | [YouTube](https://www.youtube.com/watch/h_xLAOhDnsw) |
| 2026-10-12 | Week 3 class 3 / check-in call | 6,144 B | 24,405 B | not published |
| 2026-10-14 | Lesson 2 (week 3) — individual checks & the 8 team projects | 7,634 B | 29,534 B | [YouTube](https://www.youtube.com/watch/K00Ed98fch8) |
| 2026-10-16 | Call 9 — deadlines, sales auth, outbound, issue tracker | 6,815 B | 12,197 B | not published |
| | **Totals** | **53,719 B** (~13.4k tokens) | **456,568 B** (~114k tokens) | |

## Method

- **Cleaned transcripts** are produced by a **deterministic mechanical cleaner**, not by an LLM. It
  removes timestamps (`00:00:04.480`), the ~40-column ASR hard-wrap, `>>` markers, HTML entities,
  duplicated words/phrases and filler ("um", "uh", "you know", "I mean"), and restores paragraph
  breaks and sentence casing. Because it only deletes and reflows, **it cannot invent content**.
  Verified clean of residual timestamps, BOM/zero-width characters, rule lines, stuttered words and
  orphaned punctuation.
- **Summaries** are an extract-only LLM pass over the *cleaned* text, never the raw text, under
  strict rules: nothing may be stated that is not traceable to the transcript, no attribution is
  invented where the source has no speaker labels, and uncertain names or terms are marked `[?]`.
- Where a call says "Sunday" without a date, the summary keeps the spoken term and adds the computed
  absolute date in italics labelled *(computed)*, so relative deadlines are still answerable. This
  is intended to help with issue #27 ("Zoe gives vague deadlines").

## Known limitations

- **One raw file is intentionally skipped.** `transcripts/2026-10-14_lesson_6_week_3_standup.md` is a
  duplicate capture of the same recording as
  `2026-10-14_lesson_2_week_3_individual_checks_8_team_projects.md` (916 of 919 lines identical), so
  it gets no output pair. Its 43 KB would otherwise be duplicated in the knowledge base.
- **7 of the 9 raw transcripts are auto-generated captions** (tactiq) with no speaker labels, so
  attribution is often impossible; those summaries avoid naming the speaker rather than guessing.
- **ASR errors survive.** Only unambiguous noise is normalised (e.g. `H&amp;J` → HNG). Everything
  else is kept as spoken and flagged `[?]` rather than silently "corrected" — a wrong correction
  would become a confident wrong answer.
- **The 2026-09-28 introductory call is largely personal introductions.** Its roster of participants
  and backgrounds is deliberately retained because contributors do ask "who is X?", but it is the
  noisiest section of the knowledge base and the most likely candidate for later trimming.

## Consumption (next ticket)

`summaries/*.summary.md` is intended to be concatenated into the chat system prompt in place of the
hardcoded document currently in `src/app/api/chat/route.ts`, with `transcripts/*.cleaned.md` appended
only when a question needs the detail. Neither is read by the application yet — that change is a
separate ticket, since #8 requires chat routing to remain untouched.
