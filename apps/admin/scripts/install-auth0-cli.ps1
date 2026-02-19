$ProgressPreference = 'SilentlyContinue'
$rel = Invoke-RestMethod -Uri 'https://api.github.com/repos/auth0/auth0-cli/releases/latest'
$tag = $rel.tag_name
$ver = $tag -replace '^v',''
$url = "https://github.com/auth0/auth0-cli/releases/download/$tag/auth0-cli_${ver}_Windows_x86_64.zip"
$dest = "$env:LOCALAPPDATA\auth0-cli"

Write-Host "Downloading Auth0 CLI $tag..."
Write-Host "URL: $url"

Invoke-WebRequest -Uri $url -OutFile "$env:TEMP\auth0-cli.zip"
if (Test-Path $dest) { Remove-Item -Recurse -Force $dest }
Expand-Archive -Force "$env:TEMP\auth0-cli.zip" -DestinationPath $dest

# Add to PATH for this session
$env:PATH = "$dest;$env:PATH"

# Show installed
Get-ChildItem $dest
Write-Host ""
& "$dest\auth0.exe" --version
Write-Host ""
Write-Host "Installed to: $dest"
Write-Host "auth0.exe path: $dest\auth0.exe"
