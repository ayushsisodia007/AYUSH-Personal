# Kestrel: the AI-native revenue operating system (interactive prototype)

A single-file, clickable CRM prototype. It runs entirely in the browser with local sample data, no backend.
All companies, people, numbers and competitor signals are **fictional**.

## Run, build, test

```bash
python3 build.py                 # builds index.html from src/ (open index.html in a browser)
node tests/model.test.js         # business-logic tests, no browser (28)
node tests/e2e.js                # click-through tests in Chromium via Playwright (30)
node tests/journey.js            # drives the 12-step lead-to-revenue demo through the UI
node tests/mobile.js             # phone-width layout checks
```

## How it is organised

`src/js` is concatenated in file order into one script. The first four files are the **domain layer and never touch the DOM**, so the logic can be tested headlessly. The rest is UI.

| File | Responsibility |
|---|---|
| `01-core.js` | Constants, date and money formatting, icons |
| `02-seed.js` | One connected sample dataset (accounts, contacts, deals, tickets, activities, calls, workflows, agents) |
| `03-model.js` | State, persistence (localStorage), audit log, health, lead scoring, duplicate detection, lead conversion, stage moves, loss capture, revenue forecasting |
| `04-automation.js` | AI agents and the approval queue (apply / undo / edit), meeting extraction, workflow engine (triggers, conditions, actions, simulate, scan) |
| `10-ui.js` | Router, event delegation, drawers, modals, permission gating, shared components |
| `20-` to `30-` | Views: dashboard, leads, deals, accounts, activities and tasks, calls, market radar, workflow studio, AI agents, settings, guided journey |
| `90-main.js` | Kestrel AI chat, chart hover, start-up |

Visual identity lives in `src/base.css` (the original Kestrel look, unchanged) and `src/modules.css` (new components using the same tokens).

## Data model

Lead, Account, Contact, Opportunity (deal), Activity (tasks, follow-ups and reminders are activity types), Product, Forecast (derived from opportunities), Workflow, Agent, Agent Action, Customer Health (derived from tickets), Integration, User, Audit Log.

Relationships: a Lead converts into one Account, one Contact and one Opportunity. An Account has many Contacts and Opportunities. An Opportunity has a buying committee (Contacts), Products and Competitors. Activities link to any of lead, account, contact and opportunity. Agent Actions point at the record they would change and keep the previous value so they can be reversed.

## AI guardrails (enforced in code)

- Agents and workflows only **propose**. Nothing changes until a person approves.
- Every proposal shows its evidence and a confidence score, and can be edited or rejected.
- External messages are **drafts**. Approving one records intent. Nothing is sent.
- Every approval, edit, reversal, workflow run and setting change is written to the audit log.
- Approved changes can be reversed from the Agent Activity Centre.
- Role permissions gate edits. Use Settings, Users, "Act as" to see what each role can do.

## What is real and what is simulated

| Capability | Status |
|---|---|
| Kestrel AI assistant, Run analysis, Explain forecast, pasted-transcript extraction | **Live** (Claude through the Artifact runtime) when published. In a plain browser they fall back to rule-based answers from the same data and say "Demo mode". |
| Lead scoring, duplicate detection, forecasting, health rules, workflows, agent proposals | Real logic running on local data (deterministic rules, not machine learning) |
| Lead enrichment | **Simulated**: a small built-in company table, no data provider |
| Gmail, Outlook, Calendar, Teams, Slack, telephony, ERP, support platform | **Simulated**. "Connect" only switches on sample data. Nothing is read or sent. |
| Call recordings and transcripts | Scripted samples (Harbor Bank, Cirrus Air). Pasted transcripts are processed for real. |
| Competitor signals on Market Radar | Fictional sample feed, not a live crawl |
| Persistence | This browser only (localStorage). No sync, no accounts. |

## Known limitations

- Single user per browser. "Act as" simulates roles, it is not authentication.
- Probabilities and scoring weights are fixed, hand-tuned rules, not trained models.
- Workflow time-based triggers run through a simulated scan ("days ahead"), not a real scheduler.
- Custom fields are text or number only. Pipeline stages can be renamed, reordered, added and removed, but the Won and Lost stages are fixed.
- Keyboard support covers the main flows. A full accessibility audit has not been done.
