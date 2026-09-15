# AGENTS.md

**Read [`CLAUDE.md`](./CLAUDE.md). It is the only guidance file for this repo,
and it applies to every agent regardless of which tool you are.**

That is the whole instruction. Everything about this project — the commands,
the architecture, the RTL and Arabic rules, the design decisions and the reasons
behind them, the deliberate placeholders, the admin dashboard, the AI pipeline
and the print path — lives there and is kept current there.

## Why this file holds nothing else

It used to be a copy of `CLAUDE.md`, and by the time anyone noticed it was
describing a different application: no backend, no order form, no dashboard,
prices hardcoded, routes at paths that had moved, and components that had been
renamed or deleted. An agent reading it confidently did the wrong thing.

**Two files describing one codebase is a fork, and the stale half wins whichever
agent happens to open it.** So this one is a pointer, and it must stay a
pointer: if you learn something about this repo worth writing down, write it in
`CLAUDE.md`. Do not copy any of it back here.

The same goes for `.codex/`, `.cursorrules`, or any other tool's convention
file — point them at `CLAUDE.md` rather than duplicating it.

## The one thing worth repeating

There is **no test framework** here. `npm run build` and `npm run lint` are the
entire automated gate, and both must exit clean. Anything beyond that has to be
verified by driving the running app in a browser — not by writing tests against
a runner that does not exist. `CLAUDE.md` says how.
