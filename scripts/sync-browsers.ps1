# Sync Browsers Script
# Run this before committing to ensure all browser folders are in sync

Write-Host "🔄 Syncing files to browser folders..." -ForegroundColor Cyan

$rootDir = Split-Path -Parent $PSScriptRoot
$files = @("content.js", "popup.html", "popup.js", "background.js")
$browsers = @("chrome", "edge")

foreach ($browser in $browsers) {
    Write-Host "`n📁 Syncing to browsers/$browser/" -ForegroundColor Yellow
    foreach ($file in $files) {
        $source = Join-Path $rootDir $file
        $dest = Join-Path $rootDir "browsers\$browser\$file"
        if (Test-Path $source) {
            Copy-Item $source $dest -Force
            Write-Host "  ✅ $file" -ForegroundColor Green
        } else {
            Write-Host "  ❌ $file not found" -ForegroundColor Red
        }
    }
}

# Check version consistency
Write-Host "`n🔍 Checking version consistency..." -ForegroundColor Cyan
$rootVersion = (Get-Content "$rootDir\manifest.json" | ConvertFrom-Json).version
$chromeVersion = (Get-Content "$rootDir\browsers\chrome\manifest.json" | ConvertFrom-Json).version
$edgeVersion = (Get-Content "$rootDir\browsers\edge\manifest.json" | ConvertFrom-Json).version

Write-Host "  Root:   v$rootVersion" -ForegroundColor $(if ($rootVersion -eq $chromeVersion -and $rootVersion -eq $edgeVersion) { "Green" } else { "Red" })
Write-Host "  Chrome: v$chromeVersion" -ForegroundColor $(if ($rootVersion -eq $chromeVersion) { "Green" } else { "Red" })
Write-Host "  Edge:   v$edgeVersion" -ForegroundColor $(if ($rootVersion -eq $edgeVersion) { "Green" } else { "Red" })

if ($rootVersion -eq $chromeVersion -and $rootVersion -eq $edgeVersion) {
    Write-Host "`n✅ All versions match!" -ForegroundColor Green
} else {
    Write-Host "`n⚠️  Version mismatch detected! Update all manifest.json files." -ForegroundColor Yellow
}

Write-Host "`n🎉 Sync complete!" -ForegroundColor Cyan
