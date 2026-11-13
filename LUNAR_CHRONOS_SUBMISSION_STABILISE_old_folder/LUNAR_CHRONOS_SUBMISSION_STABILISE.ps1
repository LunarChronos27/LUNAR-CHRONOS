$ErrorActionPreference = 'Stop'

$root = (Get-Location).Path
if (-not (Test-Path (Join-Path $root 'package.json')) -or
    -not (Test-Path (Join-Path $root 'src\App.tsx')) -or
    -not (Test-Path (Join-Path $root 'src\App.css')) -or
    -not (Test-Path (Join-Path $root 'src\CLPSBrowser.tsx'))) {
    Write-Host 'ERROR: Open PowerShell in the LUNAR-CHRONOS project folder first.' -ForegroundColor Red
    exit 1
}

$appPath = Join-Path $root 'src\App.tsx'
$cssPath = Join-Path $root 'src\App.css'
$clpsPath = Join-Path $root 'src\CLPSBrowser.tsx'
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$appBackup = "$appPath.before-submit-stabilisation-$stamp.bak"
$cssBackup = "$cssPath.before-submit-stabilisation-$stamp.bak"
$clpsBackup = "$clpsPath.before-submit-stabilisation-$stamp.bak"

Copy-Item $appPath $appBackup
Copy-Item $cssPath $cssBackup
Copy-Item $clpsPath $clpsBackup

$utf8 = New-Object System.Text.UTF8Encoding($false)
$cp1252 = [System.Text.Encoding]::GetEncoding(1252)
$utf8Strict = New-Object System.Text.UTF8Encoding($false, $true)

function Repair-Mojibake([string]$value) {
    $pattern = '(?:Â|â|Ã)[^\x00-\x7F]+'
    $evaluator = [System.Text.RegularExpressions.MatchEvaluator]{
        param($match)
        try {
            $bytes = New-Object byte[] $match.Value.Length
            for ($i = 0; $i -lt $match.Value.Length; $i++) {
                $code = [int][char]$match.Value[$i]
                if ($code -ge 128 -and $code -le 159) {
                    $bytes[$i] = [byte]$code
                }
                else {
                    $one = $cp1252.GetBytes([string]$match.Value[$i])
                    if ($one.Length -ne 1) { throw 'Unexpected character encoding.' }
                    $bytes[$i] = $one[0]
                }
            }
            return $utf8Strict.GetString($bytes)
        }
        catch {
            return $match.Value
        }
    }
    return [regex]::Replace($value, $pattern, $evaluator)
}

try {
    $app = [System.IO.File]::ReadAllText($appPath)
    $css = [System.IO.File]::ReadAllText($cssPath)
    $clps = [System.IO.File]::ReadAllText($clpsPath)

    $app = Repair-Mojibake $app
    $css = Repair-Mojibake $css
    $clps = Repair-Mojibake $clps

    # Restore explicit OpenLayers controls and force a size calculation after mount.
    if ($app -notmatch "from 'ol/control\.js'") {
        $importAnchor = "import View from 'ol/View';"
        if (-not $app.Contains($importAnchor)) { throw 'Could not locate the OpenLayers View import. No source was changed.' }
        $app = $app.Replace($importAnchor, $importAnchor + "`r`n" + "import { defaults as defaultControls } from 'ol/control.js';")
    }

    if ($app -notmatch 'defaultControls\(') {
        $layersAnchor = 'layers: [wacLayer, nacLayer],'
        if (-not $app.Contains($layersAnchor)) { throw 'Could not locate the lunar map layer declaration. No source was changed.' }
        $app = $app.Replace($layersAnchor, $layersAnchor + "`r`n      controls: defaultControls({ zoom: true, rotate: false, attribution: true }),")
    }

    if ($app -notmatch 'map\.updateSize\(\)') {
        $mapAnchor = 'mapInstance.current = map;'
        if (-not $app.Contains($mapAnchor)) { throw 'Could not locate the lunar map initialisation point. No source was changed.' }
        $app = $app.Replace($mapAnchor, $mapAnchor + "`r`n    requestAnimationFrame(() => map.updateSize());")
    }

    # Automatically run the existing SPICE calculations for the active UTC scenario.
    if ($app -notmatch 'AUTO-LOAD SOLAR AND EARTH TELEMETRY') {
        $effectAnchor = @'
  useEffect(() => {
    setSolarResult(null);
    setEarthResult(null);
    setWindowsResult(null);
    setError('');
  }, [selectedLocation, selectedDate, selectedTime]);
'@
        $effectAnchor = $effectAnchor.Replace("`r`n", "`n")
        if (-not $app.Contains($effectAnchor)) { throw 'Could not locate the telemetry reset effect. No source was changed.' }
        $autoEffect = @'
  // AUTO-LOAD SOLAR AND EARTH TELEMETRY
  useEffect(() => {
    if (!selectedDate || !selectedTime) return;
    void calculateSolarElevation();
    void calculateEarthVisibility();
  }, [selectedLocation, selectedDate, selectedTime]);

'@
        $autoEffect = $autoEffect.Replace("`r`n", "`n")
        $app = $app.Replace($effectAnchor, $effectAnchor + "`n" + $autoEffect)
    }

    # Remove corrupted/decorative menu glyphs; retain the navigation labels.
    if ($css -notmatch 'SUBMISSION NAVIGATION CLEANUP') {
        $css += @'

/* SUBMISSION NAVIGATION CLEANUP */
.side-navigation .nav-item {
  gap: 0;
}
.side-navigation .nav-item > span:first-child {
  display: none;
}

/* Keep the OpenLayers map viewport and controls visible after layout changes. */
.map-frame,
.lunar-map,
.lunar-map .ol-viewport {
  width: 100%;
  min-height: 320px;
}
.lunar-map {
  height: 100%;
}
.lunar-map .ol-control {
  z-index: 8;
}
.lunar-map .ol-zoom {
  top: 12px;
  left: 12px;
}
'@
    }

    [System.IO.File]::WriteAllText($appPath, $app, $utf8)
    [System.IO.File]::WriteAllText($cssPath, $css, $utf8)
    [System.IO.File]::WriteAllText($clpsPath, $clps, $utf8)

    Write-Host 'Source corrections applied. Running production build...' -ForegroundColor Cyan
    npm run build
    if ($LASTEXITCODE -ne 0) {
        throw 'Production build failed. Restoring the three original files from the backups.'
    }

    Write-Host ''
    Write-Host 'SUCCESS: LUNAR CHRONOS stabilisation build passed.' -ForegroundColor Green
    Write-Host 'Backups created:'
    Write-Host $appBackup
    Write-Host $cssBackup
    Write-Host $clpsBackup
    Write-Host 'Refresh http://localhost:5173/ in Chrome.'
}
catch {
    if (Test-Path $appBackup) { Copy-Item $appBackup $appPath -Force }
    if (Test-Path $cssBackup) { Copy-Item $cssBackup $cssPath -Force }
    if (Test-Path $clpsBackup) { Copy-Item $clpsBackup $clpsPath -Force }
    Write-Host ''
    Write-Host ('SAFE STOP: ' + $_.Exception.Message) -ForegroundColor Red
    Write-Host 'The original source files have been restored from the backups.'
    exit 1
}
