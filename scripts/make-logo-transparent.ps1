Add-Type -AssemblyName System.Drawing
$src = Join-Path $PSScriptRoot "..\public\images\zona-mental-logo-brand.png"
$out = Join-Path $PSScriptRoot "..\public\images\zona-mental-logo-transparent.png"
$bmp = [System.Drawing.Bitmap]::FromFile($src)
for ($y = 0; $y -lt $bmp.Height; $y++) {
  for ($x = 0; $x -lt $bmp.Width; $x++) {
    $c = $bmp.GetPixel($x, $y)
    if ($c.R -lt 45 -and $c.G -lt 45 -and $c.B -lt 45) {
      $bmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
    }
  }
}
$bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
Write-Output "Saved $out ($($bmp.Width)x$($bmp.Height))"
