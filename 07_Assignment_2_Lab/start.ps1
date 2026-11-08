$ErrorActionPreference = 'Stop'
$studyFolder = $PSScriptRoot
$studyPort = 9602
$studyUrl = "http://127.0.0.1:$studyPort/07_Assignment_2_Lab/"
$studyListener = Get-NetTCPConnection -State Listen -LocalPort $studyPort -ErrorAction SilentlyContinue
if (-not $studyListener) {
    $studyPython = (Get-Command python -ErrorAction Stop).Source
    Start-Process -FilePath $studyPython -ArgumentList @('"' + (Join-Path $studyFolder 'serve.py') + '"', '--port', $studyPort) -WindowStyle Hidden
}
Write-Host "Open $studyUrl"
Write-Host 'You can also open index.html directly for offline reading.'
