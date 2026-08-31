# Run once in PowerShell (as Administrator) to register daily scheduled task.
# Update $scriptDir if you moved the agent folder.

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$vbsPath = Join-Path $scriptDir "run_agent_hidden.vbs"

schtasks /create /tn "DailyJobAgent" /tr "wscript.exe `"$vbsPath`"" /sc daily /st 22:00 /f

$s = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -WakeToRun `
    -ExecutionTimeLimit (New-TimeSpan -Hours 1) `
    -RunOnlyIfNetworkAvailable

Set-ScheduledTask -TaskName "DailyJobAgent" -Settings $s

Write-Host "Scheduled task 'DailyJobAgent' created — runs daily at 10:00 PM via hidden VBS launcher."
