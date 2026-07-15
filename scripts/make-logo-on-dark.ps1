param(
  [string]$Source = (Join-Path $PSScriptRoot "..\public\images\zona-mental-logo-v3-transparent.png"),
  [string]$Output = (Join-Path $PSScriptRoot "..\public\images\zona-mental-logo-v3-on-dark.png")
)

Add-Type -AssemblyName System.Drawing

function Test-GreenPixel($c) {
  return $c.A -gt 0 -and $c.G -gt ($c.R + 18) -and $c.G -gt ($c.B + 8) -and $c.G -gt 80
}

function Test-GreyOrDarkPixel($c) {
  if ($c.A -lt 20) { return $false }
  if ($c.R -gt 215 -and $c.G -gt 215 -and $c.B -gt 215) { return $false }
  if (Test-GreenPixel $c) { return $false }
  # grey wordmark, dark brain lines, subtitle rules
  return $c.R -lt 150 -and $c.G -lt 150 -and $c.B -lt 150
}

$bmp = [System.Drawing.Bitmap]::FromFile($Source)
for ($y = 0; $y -lt $bmp.Height; $y++) {
  for ($x = 0; $x -lt $bmp.Width; $x++) {
    $c = $bmp.GetPixel($x, $y)
    if (Test-GreyOrDarkPixel $c) {
      $alpha = [Math]::Max($c.A, 220)
      $bmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, 255, 255, 255))
    }
  }
}

$bmp.Save($Output, [System.Drawing.Imaging.ImageFormat]::Png)
Write-Output "Saved $Output ($($bmp.Width)x$($bmp.Height))"
