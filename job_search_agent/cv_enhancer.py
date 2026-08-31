"""ATS scoring and CV tailoring for each job listing."""

import re


LOCATION_BONUS = {
    "bangalore": 4,
    "bengaluru": 4,
    "gurgaon": 3,
    "gurugram": 3,
    "noida": 2,
    "greater noida": 2,
    "hyderabad": 1,
    "remote": 2,
}


class CVEnhancer:
    def __init__(self, profile):
        self.profile = profile
        self.all_skills = self._flatten_skills()

    def _flatten_skills(self):
        skills = []
        skill_groups = self.profile.get("skills", {})
        for group in skill_groups.values():
            skills.extend(group)
        return skills

    def _infer_requirements(self, title):
        title_lower = title.lower()
        if any(token in title_lower for token in ("ai", "genai", "ml", "llm")):
            return [
                "LLM Products",
                "Prompt Engineering",
                "AI Strategy",
                "Model Evaluation",
            ]
        if "senior" in title_lower or "lead" in title_lower or "group" in title_lower:
            return [
                "Product Strategy",
                "Stakeholder Management",
                "Cross-functional Leadership",
            ]
        if any(token in title_lower for token in ("saas", "b2b", "enterprise")):
            return ["Enterprise Workflows", "API Integration", "Customer Success"]
        if "growth" in title_lower:
            return ["PLG", "A/B Testing", "User Retention", "Funnel Optimization"]
        if "platform" in title_lower:
            return ["API Integration", "Multi-tenant SaaS", "Platform Strategy"]
        return ["Product Roadmap", "Agile/Scrum", "User Research", "PRD Writing"]

    def _keyword_overlap(self, title, requirements):
        haystack = title.lower()
        matched = []
        for skill in self.all_skills:
            if skill.lower() in haystack:
                matched.append(skill)
        for req in requirements:
            if req.lower() in haystack:
                matched.append(req)
        total = len(set(self.all_skills + requirements)) or 1
        overlap_ratio = len(set(matched)) / min(total, 20)
        return overlap_ratio, matched

    def _location_bonus(self, location):
        location_lower = (location or "").lower()
        for key, bonus in LOCATION_BONUS.items():
            if key in location_lower:
                return bonus
        return 0

    def _title_bonus(self, title):
        title_lower = title.lower()
        bonus = 0
        if any(token in title_lower for token in ("saas", "b2b", "enterprise")):
            bonus += 3
        if any(token in title_lower for token in ("ai", "genai", "ml")):
            bonus += 3
        return bonus

    def compute_match_score(self, job):
        title = job.get("title", "")
        location = job.get("location", "")
        requirements = self._infer_requirements(title)
        overlap_ratio, _ = self._keyword_overlap(title, requirements)
        base = 75 + overlap_ratio * 18
        score = base + self._location_bonus(location) + self._title_bonus(title)
        return min(100, round(score))

    def _missing_keywords(self, job, matched):
        requirements = self._infer_requirements(job.get("title", ""))
        missing = []
        for req in requirements:
            if req not in matched:
                missing.append(req)
        for skill in self.all_skills[:12]:
            title_lower = job.get("title", "").lower()
            if skill.lower() in title_lower and skill not in matched:
                matched.append(skill)
        for req in requirements:
            found = any(req.lower() in skill.lower() or skill.lower() in req.lower() for skill in self.all_skills)
            if not found and req not in missing:
                missing.append(req)
        return missing[:6]

    def _jd_summary(self, job, score):
        title = job.get("title", "Product Manager")
        company = job.get("company", "the company")
        name = self.profile.get("name", "Ayush Sisodia")
        return (
            f"{name} is a strong fit for the {title} role at {company} with a {score}% match. "
            f"With {self.profile.get('experience_years', 3)}+ years in B2B SaaS product management at "
            f"{self.profile.get('current_company', 'Zycus')}, Ayush brings proven 0-to-1 AI product "
            f"experience and enterprise SaaS delivery that aligns directly with this role's requirements."
        )

    def _cv_pointers(self, job):
        title_lower = job.get("title", "").lower()
        pointers = []
        if any(token in title_lower for token in ("ai", "genai", "llm", "ml")):
            pointers.append(
                "Lead with ANA — launched Agentic AI product 0-to-1 in 2 months using "
                "LLM multi-agent orchestration for 4 enterprise clients."
            )
            pointers.append(
                "Highlight 'My Merlin AI' GenAI chatbot that improved service quality by 23%."
            )
        if any(token in title_lower for token in ("procurement", "supply chain", "spend")):
            pointers.append(
                "Emphasize 34% reduction in procurement cycle times via tail-spend automation at Zycus."
            )
        if "growth" in title_lower:
            pointers.append(
                "Feature 200% increase in product subscriptions using RICE & Kano prioritization frameworks."
            )
        if any(token in title_lower for token in ("senior", "lead", "group")):
            pointers.append(
                "Prominently mention Best Cross-Product PM award at Zycus and cross-functional leadership."
            )
        if any(token in title_lower for token in ("saas", "b2b", "enterprise", "platform")):
            pointers.append(
                "Stress enterprise API integrations, multi-tenant SaaS architecture, and B2B workflow design."
            )
        if not pointers:
            pointers = [
                "Tailor summary to B2B SaaS product ownership and roadmap delivery.",
                "Add metrics from Zycus: 34% cycle time reduction and 200% subscription growth.",
                "Include MBA from IIT Jodhpur and Agile/Scrum certifications prominently.",
            ]
        return pointers[:4]

    def _bullet_rewrite(self, job):
        title_lower = job.get("title", "").lower()
        company = job.get("company", "target company")
        if any(token in title_lower for token in ("ai", "genai", "llm")):
            return (
                f"Drove 0-to-1 launch of Agentic AI product 'ANA' at Zycus — architected LLM multi-agent "
                f"orchestration delivering measurable ROI for 4 enterprise clients, directly relevant to "
                f"{company}'s AI product ambitions."
            )
        if "growth" in title_lower:
            return (
                "Scaled product subscriptions 200% by applying RICE & Kano frameworks to prioritize "
                "high-impact growth features and optimize user activation funnels."
            )
        if any(token in title_lower for token in ("senior", "lead")):
            return (
                "Recognized with Best Cross-Product PM award for leading cross-functional teams across "
                "procurement, AI, and platform products — delivering enterprise-grade SaaS at scale."
            )
        return (
            f"Owned end-to-end B2B SaaS product lifecycle at Zycus — from discovery to launch — "
            f"reducing procurement cycle times 34% and driving measurable enterprise customer outcomes "
            f"aligned with {company}'s product goals."
        )

    def _recruiter_pitch(self, job):
        title = job.get("title", "Product Manager")
        company = job.get("company", "your team")
        name = self.profile.get("name", "Ayush Sisodia")
        return (
            f"Hi, I'm {name}, an APM at Zycus (B2B SaaS) with 3+ years building enterprise products. "
            f"I recently launched an Agentic AI product 0-to-1 and believe my B2B SaaS + AI experience "
            f"is a strong match for the {title} role at {company}. Would love to connect for a quick chat!"
        )

    def enhance_job(self, job):
        title = job.get("title", "")
        requirements = self._infer_requirements(title)
        overlap_ratio, matched = self._keyword_overlap(title, requirements)
        score = self.compute_match_score(job)
        missing = self._missing_keywords(job, list(matched))
        job["match_score"] = score
        job["jd_summary"] = self._jd_summary(job, score)
        job["cv_pointers"] = self._cv_pointers(job)
        job["bullet_rewrite"] = self._bullet_rewrite(job)
        job["recruiter_pitch"] = self._recruiter_pitch(job)
        job["missing_keywords"] = missing
        job["matched_keywords"] = list(set(matched))[:8]
        return job

    def enhance_jobs(self, jobs):
        enhanced = []
        for index, job in enumerate(jobs, start=1):
            enriched = self.enhance_job(dict(job))
            enriched["rank"] = index
            enhanced.append(enriched)
        enhanced.sort(key=lambda item: item.get("match_score", 0), reverse=True)
        for index, job in enumerate(enhanced, start=1):
            job["rank"] = index
        return enhanced
