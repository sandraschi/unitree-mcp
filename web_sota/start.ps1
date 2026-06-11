param([switch]$NoBrowser)
$ErrorActionPreference = "Stop"
$ScriptRoot = Split-Path -Parent $PSCommandPath
$RepoRoot = Split-Path -Parent $ScriptRoot

Write-Host "Starting unitree-mcp web dashboard..." -ForegroundColor Cyan

Get-NetTCPConnection -LocalPort 11052 -ErrorAction SilentlyContinue | ForEach-Object {
    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
}
Get-NetTCPConnection -LocalPort 11053 -ErrorAction SilentlyContinue | ForEach-Object {
    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
}

$BackendJob = Start-Job -Name "backend" -ScriptBlock {
    param($Root)
    Set-Location $Root
    $env:PYTHONPATH = "$Root\src"
    C:\Users\sandr\.local\bin\uv.exe run uvicorn web_sota.backend.server:app --host 127.0.0.1 --port 11052 --log-level warning
} -ArgumentList $RepoRoot

for ($i = 0; $i -lt 30; $i++) {
    try {
        $r = Invoke-WebRequest -Uri "http://127.0.0.1:11052/health" -TimeoutSec 2 -UseBasicParsing -ErrorAction SilentlyContinue
        if ($r.StatusCode -eq 200) { Write-Host "Backend ready on :11052" -ForegroundColor Green; break }
    } catch {}
    Start-Sleep 1
}

Start-Process -NoNewWindow -FilePath "npx" -ArgumentList "vite --port 11053 --host" -WorkingDirectory $ScriptRoot

for ($i = 0; $i -lt 30; $i++) {
    try {
        $r = Invoke-WebRequest -Uri "http://127.0.0.1:11053" -TimeoutSec 2 -UseBasicParsing -ErrorAction SilentlyContinue
        if ($r.StatusCode -eq 200) { Write-Host "Frontend ready on :11053" -ForegroundColor Green; break }
    } catch {}
    Start-Sleep 1
}

if (-not $NoBrowser) { Start-Process "http://127.0.0.1:11053" }

while ($true) {
    if ($BackendJob.State -eq "Completed" -or $BackendJob.State -eq "Failed") {
        Receive-Job $BackendJob; break
    }
    Start-Sleep 2
}
