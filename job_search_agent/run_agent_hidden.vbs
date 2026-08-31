Set fso = CreateObject("Scripting.FileSystemObject")
Set WshShell = CreateObject("WScript.Shell")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
WshShell.Run "cmd /c """ & scriptDir & "\run_agent.bat""", 0, True
Set WshShell = Nothing
Set fso = Nothing
