# Daily PM Job Search Agent

Automated daily job search agent for Ayush Sisodia. Scrapes multiple Indian job boards, filters and ranks PM roles, generates ATS-tailored CV pointers, and emails a rich HTML digest.

## Quick Start

1. Copy `smtp_config.json.example` to `smtp_config.json` and add your Gmail app password.
2. Run a test:
   ```bash
   cd job_search_agent
   python main.py
   ```
3. Open `daily_job_digest_latest.html` to preview the email digest.

## Sources Scraped

- LinkedIn Jobs
- Naukri.com
- Instahyre
- iimjobs.com
- Wellfound (AngelList)
- Cutshort.io
- Foundit (Monster India)

## Windows Daily Automation

1. Double-click `run_agent.bat` to test manually.
2. Run `setup_scheduled_task.ps1` in PowerShell to register a daily 10 PM task.
3. `run_agent_hidden.vbs` launches the agent with **no visible CMD window**.

## Files

| File | Purpose |
|------|---------|
| `main.py` | Orchestrator |
| `job_fetcher.py` | Multi-source scraper + deduplication |
| `cv_enhancer.py` | ATS scoring + CV tailoring |
| `email_builder.py` | Rich HTML digest |
| `email_sender.py` | Gmail SMTP sender |
| `resume_profile.json` | Candidate profile |
| `sent_jobs_history.json` | Auto-created dedup history |
| `agent_run.log` | Run log |

## Notes

- Uses **Python standard library only** (no pip installs).
- Each scraper is independent — one failure does not stop others.
- Jobs already sent are excluded via `sent_jobs_history.json` (capped at 500 entries).
