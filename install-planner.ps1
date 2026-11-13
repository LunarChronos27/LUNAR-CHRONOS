$ErrorActionPreference = 'Stop'
$root = 'C:\Users\h\Desktop\lunar-chronos'
$src = Join-Path $root 'src'
$appPath = Join-Path $src 'App.tsx'
$cssPath = Join-Path $src 'App.css'
$componentSource = Join-Path $PSScriptRoot 'MissionOperationsPlanner.tsx'
$componentTarget = Join-Path $src 'MissionOperationsPlanner.tsx'

if (!(Test-Path $appPath) -or !(Test-Path $cssPath) -or !(Test-Path $componentSource)) {
  throw 'Required project or installer files not found. No project changes made.'
}
$app = [IO.File]::ReadAllText($appPath)
$css = [IO.File]::ReadAllText($cssPath)
$importAnchor = "import USTMissionTimeline from './USTMissionTimeline';"
$jsxPattern = '(?s)<USTMissionTimeline\s+apiUrl=\{API_URL\}\s+locations=\{locations\.map\(\(\{ id, name \}\) => \(\{ id, name \}\)\)\}\s*/>'

if (!$app.Contains($importAnchor)) { throw 'UST calendar import not found. No project changes made.' }
if ([regex]::Matches($app, $jsxPattern).Count -ne 1) { throw 'UST calendar integration point not unique. No project changes made.' }
if ((Test-Path $componentTarget) -and !(Select-String -Path $componentTarget -Pattern 'export default function MissionOperationsPlanner' -Quiet)) {
  throw 'An existing planner file was found but does not match the expected component. No files changed.'
}

$stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
Copy-Item $appPath "$appPath.$stamp.bak"
Copy-Item $cssPath "$cssPath.$stamp.bak"
[IO.File]::WriteAllText($componentTarget, [IO.File]::ReadAllText($componentSource), [Text.UTF8Encoding]::new($false))

if (!$app.Contains("import MissionOperationsPlanner from './MissionOperationsPlanner';")) {
  $app = $app.Replace($importAnchor, "$importAnchor`r`nimport MissionOperationsPlanner from './MissionOperationsPlanner';")
}
if (!$app.Contains('<MissionOperationsPlanner apiUrl={API_URL} locations={locations} />')) {
  $app = [regex]::Replace($app, $jsxPattern, [System.Text.RegularExpressions.MatchEvaluator]{ param($m) $m.Value + "`r`n              <MissionOperationsPlanner apiUrl={API_URL} locations={locations} />" }, 1)
}
[IO.File]::WriteAllText($appPath, $app, [Text.UTF8Encoding]::new($false))

$style = @'
.mission-operations-planner{margin-top:20px}
.ops-controls{display:grid;grid-template-columns:1.3fr 1fr 1fr;gap:14px;margin:18px 0}
.ops-field{display:flex;flex-direction:column;gap:8px;min-width:0}
.ops-field label,.ops-time-context span,.ops-site-metric span{color:var(--cyan);font:10px var(--mono);letter-spacing:.08em}
.ops-field select{width:100%;min-width:0;padding:11px;background:var(--surface);color:var(--text);border:1px solid var(--border);border-radius:6px}
.ops-time-context{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:16px 0}
.ops-time-context>div{display:flex;flex-direction:column;gap:7px;padding:13px;background:var(--surface);border:1px solid var(--border);border-radius:7px;min-width:0}
.ops-time-context strong{color:var(--text);font-size:13px;overflow-wrap:anywhere}
.ops-time-context small,.ops-site-metric small,.ops-profile-heading small{color:var(--muted);font-size:11px;line-height:1.5}
.ops-calculate,.ops-refresh{padding:11px 15px;border:1px solid var(--cyan);border-radius:6px;background:var(--cyan-soft);color:var(--cyan);font:11px var(--mono);cursor:pointer}
.ops-calculate:disabled{opacity:.55;cursor:not-allowed}
.ops-profile-results{display:grid;gap:14px;margin-top:18px}
.ops-profile-moment{padding:16px;background:var(--surface-2);border:1px solid var(--border);border-radius:8px}
.ops-profile-heading{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:14px}
.ops-profile-heading>div{display:flex;flex-direction:column;gap:6px}
.ops-profile-heading strong{color:var(--cyan);font:11px var(--mono)}
.ops-profile-heading span{color:var(--muted);font:11px var(--mono)}
.ops-profile-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.ops-site-card{min-width:0;padding:13px;background:var(--surface);border:1px solid var(--border);border-radius:7px}
.ops-site-card h3{margin:0 0 13px;color:var(--text);font-size:15px}
.ops-site-metric{display:flex;flex-direction:column;gap:7px;padding:11px 0;border-top:1px solid var(--border)}
.ops-site-metric strong{color:var(--text);font-size:15px;overflow-wrap:anywhere}
.ops-provisional{display:block;margin-top:10px;color:var(--amber);font-size:11px;line-height:1.5}
.ops-caveat{margin-top:15px;color:var(--muted);font-size:11px;line-height:1.6}
@media(max-width:850px){.ops-controls{grid-template-columns:1fr 1fr}.ops-field:first-child{grid-column:1/-1}}
@media(max-width:600px){.ops-controls,.ops-profile-grid,.ops-time-context{grid-template-columns:1fr}.ops-field:first-child{grid-column:auto}.ops-profile-heading{flex-direction:column}}
'@
if (!$css.Contains('.mission-operations-planner')) {
  [IO.File]::WriteAllText($cssPath, $css + "`r`n" + $style, [Text.UTF8Encoding]::new($false))
}
Write-Host 'Planner files installed. Running production build...' -ForegroundColor Cyan
Push-Location $root
try { npm run build } finally { Pop-Location }
