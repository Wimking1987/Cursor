# AGENTS.md

## Cursor Cloud specific instructions

### Repository shape (non-obvious)
This repo is **not** a single application. It is a collection of independent, self-contained
**static deliverables** (plain HTML / CSS / vanilla JS / Markdown + image assets). Each deliverable
lives on its own `cursor/*` feature branch; the `main` branch intentionally contains only a
placeholder `README.md`.

Known deliverable branches:
- `cursor/wix-offer-chatbot-1b5b` — "JustDoad Offer Advisor" interactive chatbot widget
  (`standalone/justdoad-offer-advisor.html`, plus a `-phone.html` mobile variant).
- `cursor/hochzeit-zeitplan-bb38` — wedding-day planner UI with a `localStorage`-backed checklist
  (`index.html` / `Hochzeit-Tagesablauf-Entwurf.html`).
- `cursor/website-discovery-qa-1b39` — Wix redesign meeting checklist
  (`Website_Stiftung_Alterssiedlung_Witikon/meeting-checkliste.html`).
- `cursor/3d-print-business-plan-9d8b` — business-plan Markdown docs + clickable
  `business-plan/praesentation.html` presentation.

Because content is per-branch, to work on or preview a deliverable you must check out its branch.
To preview a branch **without leaving your current branch**, use a git worktree, e.g.:
`git worktree add /tmp/wt origin/<branch-name>`.

### Build / lint / test
There is **no build system, no package manager, no lockfile, no test suite, and no database**.
`node` and `python3` are available but nothing in the repo depends on installing packages.
There is nothing to install and nothing to compile. "Linting" is limited to validating the HTML in a
browser.

### Running / previewing (the only "service")
Serve any deliverable's directory with Python's built-in static server, then open the HTML file:

```bash
python3 -m http.server 8080   # run from the folder containing the .html file
# → http://127.0.0.1:8080/<file>.html
```

Opening the `.html` file directly (`file://`) also works, but serving over HTTP is preferred so that
relative paths and `localStorage` behave consistently. All interactivity is client-side; there is no
backend, API key, or `.env` required. External links (Wix Studio, eclass.justdoad.ch, Google Fonts CDN)
are outbound only and are not needed for local preview.
