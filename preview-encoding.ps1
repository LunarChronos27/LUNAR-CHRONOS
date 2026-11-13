
$ErrorActionPreference = "Stop"

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

$files = @(
    ".\src\App.tsx",
    ".\src\CLPSBrowser.tsx"
)

foreach ($file in $files) {
    Write-Host "`n--- $file ---" -ForegroundColor Cyan

    $lines = Get-Content -LiteralPath $file -Encoding UTF8

    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i].Contains([char]0x00E2)) {
            $recovered = [regex]::Replace(
                $lines[$i],
                [string]([char]0x00E2) + "..",
                {
                    param($match)
                    Convert-Mojibake $match.Value
                }
            )

            Write-Host "Line $($i + 1)"
            Write-Host "BEFORE: $($lines[$i])"
            Write-Host "AFTER:  $recovered"
        }
    }
}
