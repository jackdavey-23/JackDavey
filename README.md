# JackDavey — Command Center

One side panel that shows where every project stands: **Auto Trader**, **Agent City** and **Digital Projects**.
Each card shows status, progress, and what to do **now**. Click a card to expand it for the **next step**, the **plan**,
and the **overnight** log (what the agents did while you were away).

## How it fits together

| Piece | What it is |
| --- | --- |
| `hub/status.json` | The data: one entry per project. This is the source of truth. |
| `mods/command-center/` | The Claude Code mod that draws the panel from that file. |

The panel reads `hub/status.json` when the session starts, every 60 seconds, and when you press **↻ Refresh**
or type `/hub`. To update it, ask Claude ("update my hub: Agent City is live, 3 agents ran overnight…") and it
edits the JSON and commits it.

## Updating a project

Each project in `hub/status.json` has:

- `status`: `active`, `planning`, `paused`, `blocked` or `done`
- `progress`: 0–100
- `phase`: one short label (e.g. "Backtesting")
- `now`: the one thing to do right now
- `next`: the step after that, for when you want to take it
- `plan`: the ordered steps
- `overnight`: lines describing what happened since you last looked

## Running the panel

In a Claude Code session on this repo, load the mod from its folder:

```
claude --plugin-dir mods/command-center
```

Then type `/hub`.
