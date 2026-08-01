# doctools

Clinical reasoning tools for residents and students.

Not a reference and not a calculator collection. Each tool targets a
**documented, measured error** in how clinicians reason — and tries to
make itself unnecessary by showing the shape of the reasoning, not just
the answer.

The errors are real and well described. Clinicians overestimate the
probability of disease both before and after testing — surveyed
practitioners put pneumonia after a positive radiograph at 95% against an
evidence range of 46–65%, and UTI after a positive culture at 80% against
0–8.3%. They correctly estimate treatment harms about 13% of the time and
benefits about 11%, underestimating harm and overestimating benefit in a
consistent direction. Roughly four in five pneumonia courses run longer
than indicated, while four in five patients get the right drug.

## Privacy

Everything runs in your browser. There is no server, no database, no
account, and no analytics. Nothing you type is transmitted or stored.

## Status

Early. One tool, unreviewed clinical content, pending attending review.

| Tool | Targets |
| --- | --- |
| Community-acquired pneumonia | Post-test probability overestimated, low-risk patients over-triaged, four in five courses too long |

## Development

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # calculation tests
npm run typecheck
npm run build      # fully static output
```

Architecture and conventions are in [AGENTS.md](./AGENTS.md).

## A caveat that is not boilerplate

This is a teaching scaffold, not clinical decision support. Clinical
content is unreviewed. Every tool states its scope, and being outside
that scope matters.
