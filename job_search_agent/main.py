"""Daily PM Job Search & ATS CV Enhancer Agent — main orchestrator."""

import json
import os
import sys
from datetime import datetime

from cv_enhancer import CVEnhancer
from email_builder import EmailBuilder
from email_sender import EmailSender
from job_fetcher import JobFetcher, log_message


def safe_text(value):
    return str(value).encode("ascii", errors="replace").decode("ascii")


def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    profile_path = os.path.join(base_dir, "resume_profile.json")
    smtp_config_path = os.path.join(base_dir, "smtp_config.json")
    html_output_path = os.path.join(base_dir, "daily_job_digest_latest.html")
    log_path = os.path.join(base_dir, "agent_run.log")

    log_message("=" * 60, log_path)
    log_message("Daily PM Job Search Agent — START", log_path)

    with open(profile_path, encoding="utf-8") as handle:
        profile = json.load(handle)

    fetcher = JobFetcher(profile_path, base_dir=base_dir, log_path=log_path)
    jobs = fetcher.fetch_jobs()
    log_message(f"Fetched {len(jobs)} jobs for digest", log_path)

    enhancer = CVEnhancer(profile)
    enhanced_jobs = enhancer.enhance_jobs(jobs)
    log_message("CV enhancement complete", log_path)

    builder = EmailBuilder(profile)
    html_content = builder.build_digest(enhanced_jobs)
    subject = builder.build_subject(enhanced_jobs)

    sender = EmailSender(smtp_config_path, output_path=html_output_path)
    email_sent = sender.send_digest(html_content, subject)

    status = "Email sent" if email_sent else "HTML saved (email skipped or failed)"
    log_message(f"Agent run complete — {status}", log_path)
    log_message("Daily PM Job Search Agent — END", log_path)
    print(safe_text(f"Done. {status}. Preview: {html_output_path}"))


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(safe_text(f"FATAL ERROR: {exc}"))
        sys.exit(1)
