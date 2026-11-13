
$ErrorActionPreference = "Stop"

$backup = "C:\Users\h\Desktop\LUNA_CHRONOS_BACKUPS\ENCODING_REPAIR_20261111_174639"

$files = @(
    ".\src\App.tsx",
    ".\src\CLPSBrowser.tsx"
)

# Confirm the original backup exists.
foreach ($file in $files) {
    $name = Split-Path $file -Leaf
    if (-not (Test-Path (Join-Path $backup $name))) {
        throw "Backup missing: $name. No files were changed."
    }
}

# Create an additional safety backup immediately before repair.
$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$safetyBackup = Join-Path `
    "C:\Users\h\Desktop\LUNA_CHRONOS_BACKUPS" `
    "PRE_APPLY_ENCODING_$stamp"

New-Item -ItemType Directory -Path $safetyBackup -Force | Out-Null

foreach ($file in $files) {
    Copy-Item -LiteralPath $file -Destination $safetyBackup
}

function Convert-Mojibake {
    param([string]$Text)

    $bytes = [System.Collections.Generic.List[byte]]::new()
    $cp1252 = [System.Text.Encoding]::GetEncoding(1252)

    foreach ($ch in $Text.ToCharArray()) {
        $n = [int]$ch

        if ($n -le 255) {
            $bytes.Add([byte]$n)
        }
        else {
            $encoded = $cp1252.GetBytes($ch.ToString())
            $bytes.Add($encoded[0])
        }
    }

    return [System.Text.Encoding]::UTF8.GetString($bytes.ToArray())
}

$pattern = [string][char]0x00E2 + ".{2}"

foreach ($file in $files) {
    Write-Host "`nRepairing $file" -ForegroundColor Cyan

    $original = [System.IO.File]::ReadAllText($file)

    $repaired = [regex]::Replace(
        $original,
        $pattern,
        [System.Text.RegularExpressions.MatchEvaluator]{
            param($match)
            Convert-Mojibake $match.Value
        }
    )

    $countBefore = [regex]::Matches($original, $pattern).Count
    $countAfter = [regex]::Matches($repaired, $pattern).Count

    if ($countBefore -eq 0) {
        Write-Host "No matching corrupted sequences found."
        continue
    }

    if ($countAfter -ne 0) {
        throw "Unresolved sequences in $file. File not written."
    }

    $raw = [System.IO.File]::ReadAllBytes($file)
    $hasBom = (
        $raw.Length -ge 3 -and
        $raw[0] -eq 239 -and
        $raw[1] -eq 187 -and
        $raw[2] -eq 191
    )

    $encoding = [System.Text.UTF8Encoding]::new($hasBom)

    [System.IO.File]::WriteAllText(
        $file,
        $repaired,
        $encoding
    )

    Write-Host "Repaired sequences: $countBefore"
    Write-Host "Remaining matching sequences: $countAfter"
}

Write-Host "`nENCODING REPAIR COMPLETED." -ForegroundColor Green
Write-Host "Safety backup: $safetyBackup"
