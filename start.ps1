# KTV 練唱：一鍵啟動（建置前端、啟動後端、開瀏覽器）
# 用法：.\start.ps1          第一次會自動建置前端
#       .\start.ps1 -Rebuild 改過前端程式碼後重新建置
param([switch]$Rebuild)
$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot

if ($Rebuild -or -not (Test-Path "$root/frontend/dist/index.html")) {
    Write-Host '建置前端…'
    npm --prefix "$root/frontend" install
    npm --prefix "$root/frontend" run build
}

# 後端就緒後自動開瀏覽器
Start-Job -ScriptBlock {
    for ($i = 0; $i -lt 120; $i++) {
        try {
            Invoke-WebRequest 'http://127.0.0.1:8000/api/health' -UseBasicParsing -TimeoutSec 2 | Out-Null
            Start-Process 'http://127.0.0.1:8000'
            break
        } catch { Start-Sleep -Seconds 1 }
    }
} | Out-Null

Write-Host '啟動後端：http://127.0.0.1:8000 （按 Ctrl+C 結束）'
uv run --directory "$root/backend" uvicorn app.main:app --host 127.0.0.1 --port 8000
