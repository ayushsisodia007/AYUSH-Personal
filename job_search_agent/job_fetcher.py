"""Multi-source job scraper with deduplication and filtering."""

import json
import os
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)
REQUEST_HEADERS = {
    "User-Agent": USER_AGENT,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}
REQUEST_DELAY_SECONDS = 1
HISTORY_CAP = 500
TOP_JOBS_LIMIT = 15

SEARCH_COMBINATIONS = [
    ("Product Manager", "Bengaluru"),
    ("Senior Product Manager", "Bengaluru"),
    ("Associate Product Manager", "Bengaluru"),
    ("AI Product Manager", "Bengaluru"),
    ("GenAI Product Manager", "Bengaluru"),
    ("B2B SaaS Product Manager", "Bengaluru"),
    ("SaaS Product Manager", "Bengaluru"),
    ("Product Manager", "Gurugram"),
    ("Senior Product Manager", "Gurugram"),
    ("Product Manager SaaS", "Gurugram"),
    ("Product Manager", "Noida"),
    ("Product Manager", "Hyderabad"),
    ("Product Manager", "Remote India"),
    ("Product Manager enterprise", "Bengaluru"),
    ("Growth Product Manager", "Bengaluru"),
    ("Platform Product Manager", "Bengaluru"),
]

LOCATION_PRIORITY = {
    "bangalore": 1,
    "bengaluru": 1,
    "gurgaon": 2,
    "gurugram": 2,
    "noida": 3,
    "greater noida": 3,
    "hyderabad": 4,
    "remote": 5,
}


def safe_text(value):
    return str(value).encode("ascii", errors="replace").decode("ascii")


def log_message(message, log_path=None):
    line = f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {safe_text(message)}"
    print(line)
    if log_path:
        with open(log_path, "a", encoding="utf-8") as handle:
            handle.write(line + "\n")


class JobFetcher:
    def __init__(self, profile_path, base_dir=None, log_path=None):
        self.base_dir = base_dir or os.path.dirname(os.path.abspath(profile_path))
        self.log_path = log_path or os.path.join(self.base_dir, "agent_run.log")
        self.history_path = os.path.join(self.base_dir, "sent_jobs_history.json")
        with open(profile_path, encoding="utf-8") as handle:
            self.profile = json.load(handle)
        self.sent_keys = self._load_history()

    def _load_history(self):
        if not os.path.exists(self.history_path):
            return set()
        try:
            with open(self.history_path, encoding="utf-8") as handle:
                data = json.load(handle)
            return set(data.get("sent_job_keys", []))
        except (json.JSONDecodeError, OSError):
            return set()

    def _save_history(self, new_keys):
        combined = list(self.sent_keys | set(new_keys))
        combined = combined[-HISTORY_CAP:]
        payload = {
            "sent_job_keys": combined,
            "last_updated": datetime.now().strftime("%Y-%m-%d"),
        }
        with open(self.history_path, "w", encoding="utf-8") as handle:
            json.dump(payload, handle, indent=2)
        self.sent_keys = set(combined)

    @staticmethod
    def job_key(title, company):
        return f"{title.lower().strip()}|{company.lower().strip()}"

    def _fetch_html(self, url):
        request = urllib.request.Request(url, headers=REQUEST_HEADERS)
        with urllib.request.urlopen(request, timeout=30) as response:
            return response.read().decode("utf-8", errors="replace")

    def _request_with_delay(self, url):
        time.sleep(REQUEST_DELAY_SECONDS)
        return self._fetch_html(url)

    def _make_job(self, title, company, location, url, source, posted="Recent", ctc="NA", linkedin_url=None):
        title = re.sub(r"\s+", " ", title or "").strip()
        company = re.sub(r"\s+", " ", company or "").strip()
        location = re.sub(r"\s+", " ", location or "").strip()
        if not title or not company or not url:
            return None
        return {
            "title": title,
            "company": company,
            "location": location or "India",
            "url": url,
            "source": source,
            "posted": posted,
            "ctc": ctc or "NA",
            "linkedin_url": linkedin_url,
        }

    def _scrape_linkedin(self):
        jobs = []
        for role, city in SEARCH_COMBINATIONS:
            try:
                query = urllib.parse.quote(role)
                location = urllib.parse.quote(f"{city}, India")
                url = (
                    "https://www.linkedin.com/jobs/search/?"
                    f"keywords={query}&location={location}&f_TPR=r604800"
                )
                html = self._request_with_delay(url)
                links = re.findall(
                    r'href="(https://[^"]*linkedin\.com/jobs/view/[^"]*?)"', html
                )
                titles = re.findall(
                    r'class="base-search-card__title"[^>]*>\s*([^<]+?)\s*<', html
                )
                companies = re.findall(
                    r'class="hidden-nested-link"[^>]*>\s*([^<]+?)\s*<', html
                )
                locations = re.findall(
                    r'class="job-search-card__location"[^>]*>\s*([^<]+?)\s*<', html
                )
                dates = re.findall(
                    r'<time[^>]*datetime="([^"]+)"', html
                )
                count = min(len(titles), len(companies), len(links))
                for index in range(count):
                    posted = dates[index] if index < len(dates) else "Recent"
                    job = self._make_job(
                        titles[index],
                        companies[index],
                        locations[index] if index < len(locations) else city,
                        links[index].split("?")[0],
                        "LinkedIn",
                        posted=posted,
                        linkedin_url=links[index].split("?")[0],
                    )
                    if job:
                        jobs.append(job)
            except Exception as exc:
                log_message(f"LinkedIn scrape warning ({role}, {city}): {exc}", self.log_path)
        return jobs

    @staticmethod
    def _slugify(text):
        slug = text.lower().strip()
        slug = re.sub(r"[^a-z0-9\s-]", "", slug)
        slug = re.sub(r"\s+", "-", slug)
        return slug

    def _scrape_naukri(self):
        jobs = []
        city_slugs = {
            "Bengaluru": "bangalore",
            "Gurugram": "gurgaon",
            "Noida": "noida",
            "Hyderabad": "hyderabad",
            "Remote India": "india",
        }
        roles = [
            "product-manager",
            "senior-product-manager",
            "associate-product-manager",
            "ai-product-manager",
            "saas-product-manager",
            "growth-product-manager",
            "platform-product-manager",
        ]
        for city_name, city_slug in city_slugs.items():
            for role_slug in roles:
                try:
                    url = f"https://www.naukri.com/{role_slug}-jobs-in-{city_slug}?jobAge=14"
                    html = self._request_with_delay(url)
                    title_blocks = re.findall(
                        r'class="title[^"]*"[^>]*>\s*<a[^>]*href="([^"]+)"[^>]*title="([^"]+)"',
                        html,
                        re.IGNORECASE,
                    )
                    if not title_blocks:
                        title_blocks = re.findall(
                            r'<a[^>]*class="[^"]*title[^"]*"[^>]*href="([^"]+)"[^>]*>\s*([^<]+?)\s*</a>',
                            html,
                            re.IGNORECASE,
                        )
                    companies = re.findall(
                        r'class="comp-name[^"]*"[^>]*>\s*([^<]+?)\s*<', html, re.IGNORECASE
                    )
                    locations = re.findall(
                        r'class="locWdth[^"]*"[^>]*>\s*([^<]+?)\s*<', html, re.IGNORECASE
                    )
                    salaries = re.findall(
                        r'class="salary[^"]*"[^>]*>\s*([^<]+?)\s*<', html, re.IGNORECASE
                    )
                    for index, (job_url, title) in enumerate(title_blocks):
                        if job_url.startswith("/"):
                            job_url = "https://www.naukri.com" + job_url
                        company = companies[index] if index < len(companies) else "Unknown"
                        location = locations[index] if index < len(locations) else city_name
                        ctc = salaries[index] if index < len(salaries) else "NA"
                        job = self._make_job(title, company, location, job_url, "Naukri", ctc=ctc)
                        if job:
                            jobs.append(job)
                except Exception as exc:
                    log_message(f"Naukri scrape warning ({role_slug}, {city_slug}): {exc}", self.log_path)
        return jobs

    def _scrape_instahyre(self):
        jobs = []
        locations = ["bangalore", "gurgaon", "hyderabad", "remote"]
        for location in locations:
            try:
                url = (
                    "https://www.instahyre.com/search-jobs/"
                    f"?q=product+manager&l={location}"
                )
                html = self._request_with_delay(url)
                blocks = re.findall(
                    r'<a[^>]*href="(/job/[^"]+)"[^>]*>.*?<h2[^>]*>([^<]+)</h2>.*?'
                    r'<div[^>]*class="[^"]*company[^"]*"[^>]*>([^<]+)</div>.*?'
                    r'<div[^>]*class="[^"]*location[^"]*"[^>]*>([^<]+)</div>',
                    html,
                    re.IGNORECASE | re.DOTALL,
                )
                if not blocks:
                    links = re.findall(r'href="(/job/[^"]+)"', html)
                    titles = re.findall(r'<h2[^>]*class="[^"]*job-title[^"]*"[^>]*>([^<]+)</h2>', html)
                    companies = re.findall(r'class="[^"]*company-name[^"]*"[^>]*>([^<]+)<', html)
                    locations_found = re.findall(r'class="[^"]*job-location[^"]*"[^>]*>([^<]+)<', html)
                    for index, link in enumerate(links):
                        title = titles[index] if index < len(titles) else "Product Manager"
                        company = companies[index] if index < len(companies) else "Unknown"
                        loc = locations_found[index] if index < len(locations_found) else location
                        job_url = "https://www.instahyre.com" + link
                        job = self._make_job(title, company, loc, job_url, "Instahyre")
                        if job:
                            jobs.append(job)
                else:
                    for link, title, company, loc in blocks:
                        job_url = "https://www.instahyre.com" + link
                        job = self._make_job(title, company, loc, job_url, "Instahyre")
                        if job:
                            jobs.append(job)
            except Exception as exc:
                log_message(f"Instahyre scrape warning ({location}): {exc}", self.log_path)
        return jobs

    def _scrape_iimjobs(self):
        jobs = []
        try:
            url = "https://www.iimjobs.com/j/product-management-jobs"
            html = self._request_with_delay(url)
            entries = re.findall(
                r'<a[^>]*href="(https://www\.iimjobs\.com/j/[^"]+)"[^>]*>.*?'
                r'<h2[^>]*>([^<]+)</h2>.*?<span[^>]*class="[^"]*company[^"]*"[^>]*>([^<]+)</span>',
                html,
                re.IGNORECASE | re.DOTALL,
            )
            if not entries:
                links = re.findall(r'href="(https://www\.iimjobs\.com/j/[^"]+)"', html)
                titles = re.findall(r'class="[^"]*job-title[^"]*"[^>]*>([^<]+)<', html)
                companies = re.findall(r'class="[^"]*company-name[^"]*"[^>]*>([^<]+)<', html)
                locations = re.findall(r'class="[^"]*location[^"]*"[^>]*>([^<]+)<', html)
                for index, link in enumerate(links[:30]):
                    title = titles[index] if index < len(titles) else "Product Manager"
                    company = companies[index] if index < len(companies) else "Unknown"
                    location = locations[index] if index < len(locations) else "India"
                    job = self._make_job(title, company, location, link, "iimjobs")
                    if job:
                        jobs.append(job)
            else:
                for link, title, company in entries:
                    job = self._make_job(title, company, "India", link, "iimjobs")
                    if job:
                        jobs.append(job)
        except Exception as exc:
            log_message(f"iimjobs scrape warning: {exc}", self.log_path)
        return jobs

    def _scrape_wellfound(self):
        jobs = []
        try:
            url = "https://wellfound.com/jobs?q=product+manager&l=india"
            html = self._request_with_delay(url)
            entries = re.findall(
                r'href="(/jobs/[^"]+)"[^>]*>.*?<span[^>]*>([^<]+)</span>.*?'
                r'<div[^>]*class="[^"]*company[^"]*"[^>]*>([^<]+)</div>',
                html,
                re.IGNORECASE | re.DOTALL,
            )
            if not entries:
                links = re.findall(r'href="(/jobs/[^"]+)"', html)
                titles = re.findall(r'class="[^"]*job-title[^"]*"[^>]*>([^<]+)<', html)
                companies = re.findall(r'class="[^"]*company-name[^"]*"[^>]*>([^<]+)<', html)
                for index, link in enumerate(links[:25]):
                    title = titles[index] if index < len(titles) else "Product Manager"
                    company = companies[index] if index < len(companies) else "Startup"
                    job_url = "https://wellfound.com" + link
                    job = self._make_job(title, company, "India", job_url, "Wellfound")
                    if job:
                        jobs.append(job)
            else:
                for link, title, company in entries:
                    job_url = "https://wellfound.com" + link
                    job = self._make_job(title, company, "India", job_url, "Wellfound")
                    if job:
                        jobs.append(job)
        except Exception as exc:
            log_message(f"Wellfound scrape warning: {exc}", self.log_path)
        return jobs

    def _scrape_cutshort(self):
        jobs = []
        try:
            url = "https://cutshort.io/jobs/product-manager"
            html = self._request_with_delay(url)
            links = re.findall(r'href="(https://cutshort\.io/job/[^"]+)"', html)
            titles = re.findall(r'class="[^"]*job-title[^"]*"[^>]*>([^<]+)<', html)
            companies = re.findall(r'class="[^"]*company-name[^"]*"[^>]*>([^<]+)<', html)
            locations = re.findall(r'class="[^"]*location[^"]*"[^>]*>([^<]+)<', html)
            salaries = re.findall(r'class="[^"]*salary[^"]*"[^>]*>([^<]+)<', html)
            seen_urls = set()
            for index, link in enumerate(links):
                if link in seen_urls:
                    continue
                seen_urls.add(link)
                title = titles[index] if index < len(titles) else "Product Manager"
                company = companies[index] if index < len(companies) else "Unknown"
                location = locations[index] if index < len(locations) else "India"
                ctc = salaries[index] if index < len(salaries) else "NA"
                job = self._make_job(title, company, location, link, "Cutshort", ctc=ctc)
                if job:
                    jobs.append(job)
        except Exception as exc:
            log_message(f"Cutshort scrape warning: {exc}", self.log_path)
        return jobs

    def _scrape_foundit(self):
        jobs = []
        locations = ["bangalore", "gurgaon", "noida", "hyderabad"]
        for location in locations:
            try:
                query = urllib.parse.quote("product manager")
                url = (
                    "https://www.foundit.in/srp/results?"
                    f"query={query}&locations={location}&freshness=14"
                )
                html = self._request_with_delay(url)
                links = re.findall(r'href="(https://www\.foundit\.in/job/[^"]+)"', html)
                titles = re.findall(r'class="[^"]*jobTitle[^"]*"[^>]*>([^<]+)<', html, re.IGNORECASE)
                companies = re.findall(r'class="[^"]*companyName[^"]*"[^>]*>([^<]+)<', html, re.IGNORECASE)
                locs = re.findall(r'class="[^"]*location[^"]*"[^>]*>([^<]+)<', html, re.IGNORECASE)
                salaries = re.findall(r'class="[^"]*salary[^"]*"[^>]*>([^<]+)<', html, re.IGNORECASE)
                for index, link in enumerate(links[:20]):
                    title = titles[index] if index < len(titles) else "Product Manager"
                    company = companies[index] if index < len(companies) else "Unknown"
                    loc = locs[index] if index < len(locs) else location
                    ctc = salaries[index] if index < len(salaries) else "NA"
                    job = self._make_job(title, company, loc, link, "Foundit", ctc=ctc)
                    if job:
                        jobs.append(job)
            except Exception as exc:
                log_message(f"Foundit scrape warning ({location}): {exc}", self.log_path)
        return jobs

    def _is_excluded_title(self, title):
        title_lower = title.lower()
        for excluded in self.profile.get("excluded_roles", []):
            if excluded.lower() in title_lower:
                return True
        return False

    def _matches_target_role(self, title):
        title_lower = title.lower()
        if self._is_excluded_title(title):
            return False
        role_keywords = [
            "product manager",
            "product lead",
            "group product manager",
            "apm",
            "spm",
            "gpm",
            "product management",
        ]
        return any(keyword in title_lower for keyword in role_keywords)

    def _location_priority(self, location):
        location_lower = (location or "").lower()
        for key, priority in LOCATION_PRIORITY.items():
            if key in location_lower:
                return priority
        if "india" in location_lower:
            return 6
        return 99

    def _location_allowed(self, location):
        location_lower = (location or "").lower()
        if "remote" in location_lower or "hybrid" in location_lower:
            return True
        for target in self.profile.get("target_locations", []):
            if target.lower() in location_lower:
                return True
        return False

    def _parse_ctc_lpa(self, ctc_text):
        if not ctc_text or ctc_text.strip().upper() in ("NA", "N/A", "NOT DISCLOSED", ""):
            return None
        text = ctc_text.lower().replace(",", "")
        match = re.search(r"(\d+(?:\.\d+)?)\s*(?:lpa|lakhs?|l)", text)
        if match:
            return float(match.group(1))
        match = re.search(r"(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)", text)
        if match:
            return float(match.group(1))
        return None

    def _ctc_allowed(self, ctc_text):
        parsed = self._parse_ctc_lpa(ctc_text)
        if parsed is None:
            return True
        return parsed >= self.profile.get("min_ctc_lpa", 18)

    def _parse_posted_date(self, posted_text):
        if not posted_text or posted_text.lower() in ("recent", "na", "n/a"):
            return datetime.now()
        posted_text = posted_text.strip()
        try:
            if re.match(r"\d{4}-\d{2}-\d{2}", posted_text):
                return datetime.strptime(posted_text[:10], "%Y-%m-%d")
        except ValueError:
            pass
        posted_lower = posted_text.lower()
        if "hour" in posted_lower or "minute" in posted_lower or "just now" in posted_lower:
            return datetime.now()
        if "day" in posted_lower:
            match = re.search(r"(\d+)", posted_lower)
            days = int(match.group(1)) if match else 1
            return datetime.now() - timedelta(days=days)
        if "week" in posted_lower:
            match = re.search(r"(\d+)", posted_lower)
            weeks = int(match.group(1)) if match else 1
            return datetime.now() - timedelta(weeks=weeks)
        return datetime.now()

    def _is_recent_enough(self, posted_text):
        posted_date = self._parse_posted_date(posted_text)
        max_days = self.profile.get("max_days_old", 14)
        return (datetime.now() - posted_date).days <= max_days

    def _deduplicate_jobs(self, jobs):
        seen = set()
        unique = []
        for job in jobs:
            key = self.job_key(job["title"], job["company"])
            if key in seen:
                continue
            seen.add(key)
            unique.append(job)
        return unique

    def _filter_jobs(self, jobs):
        filtered = []
        for job in jobs:
            if not self._matches_target_role(job["title"]):
                continue
            if not self._location_allowed(job["location"]):
                continue
            if not self._ctc_allowed(job.get("ctc", "NA")):
                continue
            if not self._is_recent_enough(job.get("posted", "Recent")):
                continue
            key = self.job_key(job["title"], job["company"])
            if key in self.sent_keys:
                continue
            job["location_priority"] = self._location_priority(job["location"])
            filtered.append(job)
        return filtered

    def _sort_jobs(self, jobs):
        return sorted(
            jobs,
            key=lambda item: (
                item.get("location_priority", 99),
                -self._parse_posted_date(item.get("posted", "Recent")).timestamp(),
            ),
        )

    def fetch_jobs(self):
        log_message("Starting multi-source job fetch...", self.log_path)
        all_jobs = []

        scrapers = [
            ("LinkedIn", self._scrape_linkedin),
            ("Naukri", self._scrape_naukri),
            ("Instahyre", self._scrape_instahyre),
            ("iimjobs", self._scrape_iimjobs),
            ("Wellfound", self._scrape_wellfound),
            ("Cutshort", self._scrape_cutshort),
            ("Foundit", self._scrape_foundit),
        ]

        for source_name, scraper in scrapers:
            try:
                source_jobs = scraper()
                log_message(f"{source_name}: scraped {len(source_jobs)} raw jobs", self.log_path)
                all_jobs.extend(source_jobs)
            except Exception as exc:
                log_message(f"{source_name} scraper failed: {exc}", self.log_path)

        all_jobs = self._deduplicate_jobs(all_jobs)
        log_message(f"After cross-source dedup: {len(all_jobs)} jobs", self.log_path)

        filtered = self._filter_jobs(all_jobs)
        log_message(f"After filtering: {len(filtered)} jobs", self.log_path)

        sorted_jobs = self._sort_jobs(filtered)
        top_jobs = sorted_jobs[:TOP_JOBS_LIMIT]

        if len(top_jobs) < 10:
            log_message(
                f"WARNING: Only {len(top_jobs)} fresh jobs found (minimum target: 10)",
                self.log_path,
            )

        new_keys = [self.job_key(job["title"], job["company"]) for job in top_jobs]
        if new_keys:
            self._save_history(new_keys)

        log_message(f"Returning top {len(top_jobs)} jobs", self.log_path)
        return top_jobs
