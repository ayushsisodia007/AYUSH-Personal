"""SMTP email sender for daily job digest."""

import json
import os
import smtplib
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText


def safe_text(value):
    return str(value).encode("ascii", errors="replace").decode("ascii")


class EmailSender:
    def __init__(self, config_path, output_path=None):
        self.config_path = config_path
        self.output_path = output_path
        self.config = self._load_config()

    def _load_config(self):
        if not os.path.exists(self.config_path):
            return {}
        with open(self.config_path, encoding="utf-8") as handle:
            return json.load(handle)

    def _save_html_backup(self, html_content):
        if not self.output_path:
            return
        with open(self.output_path, "w", encoding="utf-8") as handle:
            handle.write(html_content)

    def send_digest(self, html_content, subject):
        self._save_html_backup(html_content)

        if not self.config:
            print(safe_text(
                f"SMTP config not found at {self.config_path} — HTML digest saved locally. "
                "Copy smtp_config.json.example to smtp_config.json and fill in credentials."
            ))
            return False

        sender = self.config.get("sender_email")
        recipient = self.config.get("recipient_email", sender)
        password = self.config.get("app_password")
        host = self.config.get("smtp_host", "smtp.gmail.com")
        port = int(self.config.get("smtp_port", 587))

        if not sender or not password or "your-gmail-app-password" in password:
            print(safe_text(
                "SMTP not configured — HTML digest saved locally. "
                "Fill smtp_config.json with Gmail app password to enable email."
            ))
            return False

        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = sender
        message["To"] = recipient
        message.attach(MIMEText(html_content, "html", "utf-8"))

        try:
            with smtplib.SMTP(host, port, timeout=30) as server:
                server.starttls()
                server.login(sender, password)
                server.sendmail(sender, [recipient], message.as_string())
            print(safe_text(f"Email sent successfully to {recipient} at {datetime.now()}"))
            return True
        except Exception as exc:
            print(safe_text(f"Email send failed: {exc}"))
            print(safe_text(f"HTML digest saved to {self.output_path}"))
            return False
