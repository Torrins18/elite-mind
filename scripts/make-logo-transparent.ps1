param(
  [string]$Source = (Join-Path $PSScriptRoot "..\public\images\zona-mental-logo-v3.png"),
  [string]$Output = (Join-Path $PSScriptRoot "..\public\images\zona-mental-logo-v3-transparent.png"),
  [int]$Threshold = 45,
  [double]$CropTopRatio = 0.5
)

Add-Type -AssemblyName System.Drawing

$src = [System.Drawing.Bitmap]::FromFile($Source)
$cropHeight = [Math]::Max(1, [int][Math]::Round($src.Height * $CropTopRatio))
$cropped = New-Object System.Drawing.Bitmap $src.Width, $cropHeight
$graphics = [System.Drawing.Graphics]::FromImage($cropped)
$graphics.DrawImage($src, 0, 0, (New-Object System.Drawing.Rectangle 0, 0, $src.Width, $cropHeight), [System.Drawing.GraphicsUnit]::Pixel)
$graphics.Dispose()
$src.Dispose()

for ($y = 0; $y -lt $cropped.Height; $y++) {
  for ($x = 0; $x -lt $cropped.Width; $x++) {
    $c = $cropped.GetPixel($x, $y)
    if ($c.R -lt $Threshold -and $c.G -lt $Threshold -and $c.B -lt $Threshold) {
      $cropped.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
    }
  }
}

$cropped.Save($Output, [System.Drawing.Imaging.ImageFormat]::Png)
Write-Output "Saved $Output ($($cropped.Width)x$($cropped.Height))"
