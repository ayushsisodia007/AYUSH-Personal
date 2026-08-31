@echo off
cd /d "%~dp0"
python main.py >> agent_run.log 2>&1
echo [%date% %time%] Agent run completed >> agent_run.log
