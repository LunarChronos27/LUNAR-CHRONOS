
$ErrorActionPreference = 'Stop'

$css = ".\src\App.css"

if (!(Test-Path $css)) {
    throw "App.css not found. No changes made."
}

$marker = "LUNAR CHRONOS - MISSION OPERATIONS ALIGNMENT REFINEMENT"

$current = Get-Content $css -Raw

if ($current.Contains($marker)) {
    throw "Alignment refinement already exists. No changes made."
}

$backupRoot = "C:\Users\h\Desktop\LUNA_CHRONOS_BACKUPS"
New-Item -ItemType Directory -Force -Path $backupRoot | Out-Null

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backup = Join-Path $backupRoot "PRE_OPS_ALIGNMENT_$timestamp.css"

Copy-Item $css $backup

$addition = @"

/* $marker */
.ops-controls {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-items: start;
}

.ops-field {
  min-width: 0;
}

.ops-field select {
  box-sizing: border-box;
  width: 100%;
  height: 42px;
  min-width: 0;
}

@media (max-width: 850px) {
  .ops-controls {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .ops-field:first-child {
    grid-column: 1 / -1;
  }
}

@media (max-width: 600px) {
  .ops-controls {
    grid-template-columns: minmax(0, 1fr);
  }

  .ops-field:first-child {
    grid-column: auto;
  }
}
"@

[System.IO.File]::AppendAllText(
    (Resolve-Path $css).Path,
    $addition,
    [System.Text.UTF8Encoding]::new($false)
)

Write-Host ""
Write-Host "MISSION OPERATIONS ALIGNMENT REFINEMENT APPLIED."
Write-Host "Backup: $backup"
