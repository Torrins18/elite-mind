param(
  [string]$Source = (Join-Path $PSScriptRoot "..\public\images\zona-mental-logo-v2.png"),
  [string]$Output = (Join-Path $PSScriptRoot "..\public\images\zona-mental-logo-v2-transparent.png"),
  [int]$Threshold = 45
)

Add-Type -AssemblyName System.Drawing
$bmp = [System.Drawing.Bitmap]::FromFile($Source)
for ($y = 0; $y -lt $bmp.Height; $y++) {
  for ($x = 0; $x -lt $bmp.Width; $x++) {
    $c = $bmp.GetPixel($x, $y)
    if ($c.R -lt $Threshold -and $c.G -lt $Threshold -and $c.B -lt $Threshold) {
      $bmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
    }
  }
}
$bmp.Save($Output, [System.Drawing.Imaging.ImageFormat]::Png)
Write-Output "Saved $Output ($($bmp.Width)x$($bmp.Height))"
