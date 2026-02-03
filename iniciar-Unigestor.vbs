Dim shell, fso, logFolder, logFile
Dim operaPath, pagePath, cmd

Set shell = CreateObject("WScript.Shell")
Set fso   = CreateObject("Scripting.FileSystemObject")

' Caminhos
operaPath = shell.ExpandEnvironmentStrings("%LOCALAPPDATA%") & "\Programs\Opera\opera.exe"
pagePath  = shell.CurrentDirectory & "\frontend\index.html"

' Pasta de log
logFolder = shell.CurrentDirectory & "\logs"
If Not fso.FolderExists(logFolder) Then
    fso.CreateFolder(logFolder)
End If

' Log fixo
logFile = logFolder & "\unigestor.log"

' Inicia backend (oculto + log fixo)
cmd = "cmd /c cd """ & shell.CurrentDirectory & "\backend"" && script_iniciar_servidor.bat >> """ & logFile & """ 2>&1"
shell.Run cmd, 0, False

' Aguarda servidor iniciar
WScript.Sleep 2000

' ===== ABRIR SISTEMA NO OPERA (sempre abre) =====
shell.Run """" & operaPath & """ """ & pagePath & """", 1, False