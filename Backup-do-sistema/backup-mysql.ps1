$ErrorActionPreference = "Stop"

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$envPath = Join-Path $projectRoot "backend\\.env"

if (-not (Test-Path $envPath)) {
  Write-Error "Arquivo .env nao encontrado em $envPath"
  exit 1
}

$envMap = @{}
Get-Content -Path $envPath | ForEach-Object {
  $line = $_.Trim()
  if ($line -eq "" -or $line.StartsWith("#")) { return }
  $parts = $line -split "=", 2
  if ($parts.Length -eq 2) {
    $envMap[$parts[0].Trim()] = $parts[1].Trim()
  }
}

$dbHost = $envMap["DB_HOST"]
$dbUser = $envMap["DB_USER"]
$dbPass = $envMap["DB_PASSWORD"]
$dbName = $envMap["DB_NAME"]

if (-not $dbHost -or -not $dbUser -or -not $dbName) {
  Write-Error "Variaveis DB_HOST, DB_USER ou DB_NAME ausentes no .env"
  exit 1
}

$backupDir = $PSScriptRoot
$tz = [System.TimeZoneInfo]::FindSystemTimeZoneById("E. South America Standard Time")
$brTime = [System.TimeZoneInfo]::ConvertTimeFromUtc((Get-Date).ToUniversalTime(), $tz)
$timestamp = $brTime.ToString("yyyy-MM-dd_HH-mm-ss")
$outFolder = Join-Path $backupDir ("backup_unigestor_{0}" -f $timestamp)
$zipFile = Join-Path $backupDir ("backup_unigestor_{0}.zip" -f $timestamp)
$logFile = Join-Path $backupDir "backup_log.txt"
New-Item -ItemType Directory -Path $outFolder -Force | Out-Null

$tables = @("items", "uniform_deliveries", "employees")

Add-Content -Path $logFile -Value ("Backup - {0}" -f $brTime.ToString("yyyy-MM-dd HH:mm:ss")) -Encoding utf8
Add-Content -Path $logFile -Value ("[{0}] Inicio do backup" -f $brTime.ToString("yyyy-MM-dd HH:mm:ss")) -Encoding utf8

$baseArgs = @("-h", $dbHost, "-u", $dbUser)
if ($dbPass) { $baseArgs += "-p$dbPass" }
$baseArgs += $dbName

$mysqldumpPath = Join-Path $env:ProgramFiles "MySQL\\MySQL Server 8.0\\bin\\mysqldump.exe"
if (-not (Test-Path $mysqldumpPath)) {
  Write-Error "mysqldump nao encontrado em $mysqldumpPath"
  exit 1
}

foreach ($table in $tables) {
  $outFile = Join-Path $outFolder ("{0}.sql" -f $table)
  $args = @($baseArgs + $table)
  & $mysqldumpPath @args | Out-File -FilePath $outFile -Encoding utf8
  if ($LASTEXITCODE -ne 0) {
    Write-Error "Falha ao executar mysqldump para a tabela $table. Verifique se o MySQL esta instalado e no PATH."
    Add-Content -Path $logFile -Value ("[{0}] Erro ao gerar backup da tabela {1}" -f $brTime.ToString("yyyy-MM-dd HH:mm:ss"), $table) -Encoding utf8
    exit 1
  }
  if ((Get-Item $outFile).Length -eq 0) {
    Write-Error "Backup gerado vazio para a tabela $table. Verifique as credenciais e o acesso ao banco."
    Add-Content -Path $logFile -Value ("[{0}] Backup vazio para a tabela {1}" -f $brTime.ToString("yyyy-MM-dd HH:mm:ss"), $table) -Encoding utf8
    exit 1
  }
}

$readmePath = Join-Path $outFolder "README.txt"
@'
Backup do UniGestor

Conteudo:
- items.sql
- uniform_deliveries.sql
- employees.sql

Restaurar (exemplo):
1) crie/seleciona o banco:
   mysql -u SEU_USUARIO -p
   CREATE DATABASE unigestor;
   USE unigestor;

2) importe cada arquivo:
   mysql -u SEU_USUARIO -p unigestor < items.sql
   mysql -u SEU_USUARIO -p unigestor < uniform_deliveries.sql
   mysql -u SEU_USUARIO -p unigestor < employees.sql

Observacao: ajuste o nome do banco se necessario.
'@ | Set-Content -Path $readmePath -Encoding utf8

Compress-Archive -Path $outFolder -DestinationPath $zipFile -Force
Remove-Item -Path $outFolder -Recurse -Force
Write-Output "Backup compactado: $zipFile"

Add-Content -Path $logFile -Value ("[{0}] Backup finalizado: {1}" -f $brTime.ToString("yyyy-MM-dd HH:mm:ss"), $zipFile) -Encoding utf8

$backups = Get-ChildItem -Path $backupDir -Filter "backup_unigestor_*.zip" | Sort-Object LastWriteTime -Descending
$backups | Select-Object -Skip 2 | ForEach-Object { Remove-Item -Path $_.FullName -Force }
