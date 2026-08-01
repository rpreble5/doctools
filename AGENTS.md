<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# doctools

Clinical reasoning tools for residents. Each tool targets a *documented*
error — not a topic that merely feels hard. If a proposed tool cannot
name the error it corrects, it does not belong here.

## Non-negotiables

**No PHI, no server, no accounts.** Everything runs client-side. There is
no database and no analytics. This is a privacy guarantee stated on every
page, and it also removes the entire HIPAA surface. Do not add a backend
without revisiting that promise first.

**Calculations are tested before they ship.** Every score and every piece
of probability maths has unit tests with hand-worked or published
reference cases. A wrong tool is worse than no tool.

**Scope boundaries are content.** Every tool states what it assumes.
Knowing you are outside the tool's assumptions is part of the framework
it teaches.

## The two colour rules

Both are enforced by convention, not by the compiler. Watch for them in
review.

1. **The interface is neutral.** Chrome — labels, rules, borders,
   headings, buttons, controls — uses only `ink` / `soft` / `faint` /
   `rule` / `hair` / `sunk`.
2. **Colour belongs to data.** The `--d-*` ramp appears only inside data
   marks: chart fills, criteria dots, band zones, the single alarm. A
   colour on a label is a bug.

`alarm` is used at most once per tool. That restraint is the mechanism —
in a muted system one saturated note carries weight that
red-everywhere never does.

Type follows the same logic: large and light for figures, small and
receding for labels. Weight comes from scale relationships and space,
not from ink.

## Layout

Panels are **co-equal**. No cards, no shadows, no hero element, no lead.
Structure comes from grid rules and whitespace. Visualisations are sized
to their content, not inflated for drama.

## Architecture

Three layers, in dependency order:

- `src/lib/` — pure logic. Scores, probability, content types. No React,
  fully tested.
- `src/components/modules/` — reusable reasoning modules
  (`ProbabilityBand`, `IconArray`, `CriteriaList`, `CompareBars`,
  `Trajectory`, `SeamNote`). No clinical content baked in. **This is the
  compounding asset** — each new module makes the next tool cheaper.
- `src/tools/<slug>/` — `content.ts` (the clinical substance, reviewable
  without reading React) plus a component composing modules around it.

`src/components/shell/` holds chrome shared by every tool. It is
deliberately thin: the canvas belongs to the tool, so a
visualisation-led tool can ignore the panel grid entirely.

## The reasoning spine

Most situation tools follow the same sequence, because it is the
skeleton an intern lacks:

> Is it? → How bad? → What do they get? → How much, how long? → What next?

Deviate where the clinical logic demands it. Learning the shape by
repetition across tools is a feature.

## Contested content

Where guidelines genuinely disagree, show the disagreement and take no
position. An intern who follows one society's guidance and gets pushed
back on concludes they were wrong; often they walked into a documented
split nobody surfaced. `SeamNote` exists for this.

## Commands

```
npm run dev        # dev server
npm run build      # production build (fully static)
npm test           # vitest — calculations
npm run typecheck  # tsc --noEmit
npm run lint
```
