# OmniRoute Claude Launcher
# Run: powershell -File start-claude.ps1

$env:ANTHROPIC_BASE_URL = "http://localhost:20128"
$env:ANTHROPIC_API_KEY  = "omniroute"
$env:ANTHROPIC_MODEL    = "Claude Code"
$env:CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY = "1"
$env:CLAUDE_CODE_DISABLE_UNKNOWN_MODEL_WINDOW_ENFORCEMENT = "1"
Remove-Item Env:ANTHROPIC_AUTH_TOKEN -ErrorAction SilentlyContinue
Remove-Item Env:CLAUDE_CONFIG_DIR    -ErrorAction SilentlyContinue

Write-Host "OmniRoute -> $env:ANTHROPIC_MODEL @ $env:ANTHROPIC_BASE_URL" -ForegroundColor Cyan
claude
