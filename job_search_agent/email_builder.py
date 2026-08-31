"""Build rich HTML email digest for daily job search results."""

import html
from datetime import datetime


class EmailBuilder:
    def __init__(self, profile):
        self.profile = profile
        self.candidate_name = profile.get("name", "Ayush Sisodia")

    def _esc(self, value):
        return html.escape(str(value or ""))

    def _linkedin_search_url(self, company):
        query = html.escape(company.replace(" ", "%20"), quote=True)
        return f"https://www.linkedin.com/jobs/search/?keywords=Product%20Manager&location=India&f_C={query}"

    def _build_summary_row(self, job):
        apply_url = self._esc(job.get("url", "#"))
        linkedin_url = self._esc(job.get("linkedin_url") or job.get("url", "#"))
        return f"""
        <tr>
            <td style="padding:8px;border:1px solid #e2e8f0;text-align:center;">#{job.get('rank', '-')}</td>
            <td style="padding:8px;border:1px solid #e2e8f0;">
                <a href="{apply_url}" style="color:#1d4ed8;text-decoration:none;font-weight:600;">
                    {self._esc(job.get('title'))}
                </a>
            </td>
            <td style="padding:8px;border:1px solid #e2e8f0;">{self._esc(job.get('company'))}</td>
            <td style="padding:8px;border:1px solid #e2e8f0;">{self._esc(job.get('location'))}</td>
            <td style="padding:8px;border:1px solid #e2e8f0;">{self._esc(job.get('source'))}</td>
            <td style="padding:8px;border:1px solid #e2e8f0;">{self._esc(job.get('posted', 'Recent'))}</td>
            <td style="padding:8px;border:1px solid #e2e8f0;">{self._esc(job.get('ctc', 'NA'))}</td>
            <td style="padding:8px;border:1px solid #e2e8f0;text-align:center;font-weight:700;color:#059669;">
                {job.get('match_score', 0)}%
            </td>
            <td style="padding:8px;border:1px solid #e2e8f0;text-align:center;">
                <a href="{apply_url}" style="background:#2563eb;color:#fff;padding:6px 10px;border-radius:4px;text-decoration:none;font-size:12px;">Apply</a>
            </td>
        </tr>"""

    def _build_job_card(self, job):
        apply_url = self._esc(job.get("url", "#"))
        linkedin_url = self._esc(job.get("linkedin_url") or apply_url)
        source_url = apply_url
        pointers_html = "".join(
            f"<li style='margin-bottom:6px;'>{self._esc(point)}</li>"
            for point in job.get("cv_pointers", [])
        )
        missing_html = "".join(
            f"<span style='background:#fee2e2;color:#b91c1c;padding:3px 8px;border-radius:12px;margin:2px;font-size:12px;display:inline-block;'>"
            f"{self._esc(keyword)}</span>"
            for keyword in job.get("missing_keywords", [])
        )
        if not missing_html:
            missing_html = "<span style='color:#059669;font-size:13px;'>Strong keyword alignment</span>"

        return f"""
        <div style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:20px;margin-bottom:20px;box-shadow:0 2px 6px rgba(0,0,0,0.05);">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                <span style="background:#1e3a8a;color:#fff;padding:4px 10px;border-radius:20px;font-size:13px;font-weight:700;">
                    Rank #{job.get('rank', '-')}
                </span>
                <span style="background:#059669;color:#fff;padding:4px 10px;border-radius:20px;font-size:13px;font-weight:700;">
                    {job.get('match_score', 0)}% Match
                </span>
            </div>
            <h2 style="margin:0 0 6px;color:#1e293b;font-size:20px;">{self._esc(job.get('title'))}</h2>
            <p style="margin:0 0 4px;color:#475569;font-size:15px;">
                <strong>{self._esc(job.get('company'))}</strong> &bull; {self._esc(job.get('location'))}
                &bull; CTC: {self._esc(job.get('ctc', 'NA'))}
            </p>
            <p style="margin:8px 0 14px;color:#64748b;font-size:13px;">
                Source: {self._esc(job.get('source'))} &bull; Posted: {self._esc(job.get('posted', 'Recent'))}
            </p>
            <div style="margin-bottom:16px;">
                <a href="{apply_url}" style="background:#2563eb;color:#fff;padding:8px 14px;border-radius:6px;text-decoration:none;margin-right:8px;font-size:13px;">Apply Direct</a>
                <a href="{linkedin_url}" style="background:#0a66c2;color:#fff;padding:8px 14px;border-radius:6px;text-decoration:none;margin-right:8px;font-size:13px;">LinkedIn</a>
                <a href="{source_url}" style="background:#64748b;color:#fff;padding:8px 14px;border-radius:6px;text-decoration:none;font-size:13px;">Source Site</a>
            </div>
            <h3 style="color:#1e3a8a;font-size:15px;margin:16px 0 8px;">Why you'll be shortlisted</h3>
            <p style="color:#334155;line-height:1.6;margin:0 0 14px;">{self._esc(job.get('jd_summary', ''))}</p>
            <h3 style="color:#b91c1c;font-size:14px;margin:12px 0 8px;">Missing ATS Keywords</h3>
            <div style="margin-bottom:14px;">{missing_html}</div>
            <div style="background:#fef9c3;border-left:4px solid #eab308;padding:12px 16px;margin-bottom:14px;border-radius:0 6px 6px 0;">
                <h3 style="color:#854d0e;font-size:14px;margin:0 0 8px;">CV Modification Pointers</h3>
                <ul style="margin:0;padding-left:18px;color:#713f12;">{pointers_html}</ul>
            </div>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;padding:12px 16px;margin-bottom:14px;border-radius:6px;">
                <h3 style="color:#1e293b;font-size:14px;margin:0 0 8px;">Tailored Bullet for This Role</h3>
                <p style="margin:0;color:#334155;line-height:1.6;font-style:italic;">{self._esc(job.get('bullet_rewrite', ''))}</p>
            </div>
            <div style="background:#ecfdf5;border-left:4px solid #10b981;padding:12px 16px;border-radius:0 6px 6px 0;">
                <h3 style="color:#065f46;font-size:14px;margin:0 0 8px;">Recruiter LinkedIn Outreach (Copy-Paste)</h3>
                <p style="margin:0;color:#047857;line-height:1.6;">{self._esc(job.get('recruiter_pitch', ''))}</p>
            </div>
        </div>"""

    def build_digest(self, jobs):
        today = datetime.now().strftime("%B %d, %Y")
        job_count = len(jobs)
        top_score = max((job.get("match_score", 0) for job in jobs), default=0)
        summary_rows = "".join(self._build_summary_row(job) for job in jobs)
        cards = "".join(self._build_job_card(job) for job in jobs)

        if not jobs:
            summary_rows = """
            <tr><td colspan="9" style="padding:20px;text-align:center;color:#64748b;">
                No fresh jobs found today. The agent will try again tomorrow.
            </td></tr>"""
            cards = "<p style='color:#64748b;text-align:center;'>No job cards to display.</p>"

        return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Daily PM Job Digest — {self._esc(self.candidate_name)}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Segoe UI,Arial,sans-serif;">
    <div style="max-width:900px;margin:0 auto;padding:20px;">
        <div style="background:linear-gradient(135deg,#1e3a8a,#1d4ed8);color:#fff;padding:28px;border-radius:12px 12px 0 0;">
            <h1 style="margin:0 0 8px;font-size:26px;">Daily PM Job Digest — {self._esc(self.candidate_name)}</h1>
            <p style="margin:0;opacity:0.9;font-size:14px;">{today} &bull; Live Scraped from LinkedIn, Naukri, Instahyre, iimjobs, Wellfound, Cutshort</p>
            <div style="margin-top:16px;display:flex;flex-wrap:wrap;gap:8px;">
                <span style="background:rgba(255,255,255,0.2);padding:6px 12px;border-radius:20px;font-size:12px;">{job_count} Fresh Roles</span>
                <span style="background:rgba(255,255,255,0.2);padding:6px 12px;border-radius:20px;font-size:12px;">Live Scraped Today</span>
                <span style="background:rgba(255,255,255,0.2);padding:6px 12px;border-radius:20px;font-size:12px;">Bangalore &gt; Gurgaon &gt; Noida &gt; Hyderabad</span>
                <span style="background:rgba(255,255,255,0.2);padding:6px 12px;border-radius:20px;font-size:12px;">&ge; 18 LPA / Undisclosed</span>
            </div>
        </div>
        <div style="background:#fff;padding:24px;border:1px solid #e2e8f0;border-top:none;">
            <h2 style="color:#1e293b;font-size:18px;margin:0 0 16px;">Executive Summary — Top Match: {top_score}%</h2>
            <div style="overflow-x:auto;">
                <table style="width:100%;border-collapse:collapse;font-size:13px;">
                    <thead>
                        <tr style="background:#f8fafc;">
                            <th style="padding:8px;border:1px solid #e2e8f0;">Rank</th>
                            <th style="padding:8px;border:1px solid #e2e8f0;">Role Title</th>
                            <th style="padding:8px;border:1px solid #e2e8f0;">Company</th>
                            <th style="padding:8px;border:1px solid #e2e8f0;">Location</th>
                            <th style="padding:8px;border:1px solid #e2e8f0;">Source</th>
                            <th style="padding:8px;border:1px solid #e2e8f0;">Posted</th>
                            <th style="padding:8px;border:1px solid #e2e8f0;">CTC</th>
                            <th style="padding:8px;border:1px solid #e2e8f0;">Match%</th>
                            <th style="padding:8px;border:1px solid #e2e8f0;">Apply</th>
                        </tr>
                    </thead>
                    <tbody>
                        {summary_rows}
                    </tbody>
                </table>
            </div>
        </div>
        <div style="padding:24px 0;">
            <h2 style="color:#1e293b;font-size:18px;margin:0 0 16px;">Detailed Role Cards</h2>
            {cards}
        </div>
        <div style="background:#1e293b;color:#94a3b8;padding:20px;border-radius:0 0 12px 12px;font-size:12px;text-align:center;">
            <p style="margin:0 0 6px;">Excluded: TPM, Engineering Manager, Project Manager, Program Manager, Scrum Master</p>
            <p style="margin:0 0 6px;">Sources: LinkedIn, Naukri, Instahyre, iimjobs, Wellfound, Cutshort, Foundit</p>
            <p style="margin:0;">Deduplication: Previously sent jobs automatically excluded</p>
        </div>
    </div>
</body>
</html>"""

    def build_subject(self, jobs):
        today = datetime.now().strftime("%Y-%m-%d")
        job_count = len(jobs)
        top_score = max((job.get("match_score", 0) for job in jobs), default=0)
        return f"[{today}] Daily PM Job Digest — {job_count} Fresh Roles | Top Match: {top_score}%"
