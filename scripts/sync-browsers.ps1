# Sync Browsers Script
# Run this before committing to ensure all browser folders are in sync

Write-Host "Syncing files to browser folders..." -ForegroundColor Cyan

$rootDir = Split-Path -Parent $PSScriptRoot
$files = @("content.js", "popup.html", "popup.js", "background.js")

foreach ($file in $files) {
    $source = Join-Path $rootDir $file
    if (Test-Path $source) {
        Copy-Item $source (Join-Path $rootDir "browsers\chrome\$file") -Force
        Copy-Item $source (Join-Path $rootDir "browsers\edge\$file") -Force
        Write-Host "  Synced: $file" -ForegroundColor Green
    }
}

# Check versions
$rootVer = (Get-Content "$rootDir\manifest.json" | ConvertFrom-Json).version
$chromeVer = (Get-Content "$rootDir\browsers\chrome\manifest.json" | ConvertFrom-Json).version
$edgeVer = (Get-Content "$rootDir\browsers\edge\manifest.json" | ConvertFrom-Json).version

Write-Host "`nVersions: Root=$rootVer, Chrome=$chromeVer, Edge=$edgeVer"
if ($rootVer -eq $chromeVer -and $rootVer -eq $edgeVer) {
    Write-Host "All versions match!" -ForegroundColor Green
}
else {
    Write-Host "WARNING: Version mismatch!" -ForegroundColor Yellow
}

Write-Host "`nSync complete!" -ForegroundColor Cyan
