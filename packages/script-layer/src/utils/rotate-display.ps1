# Rotate between different displays
param(
    [int]$Delay = 10  # Default delay in seconds between rotations
)

# Check if btm is available
if (-not (Get-Command btm -ErrorAction SilentlyContinue)) {
    Write-Host "btm (bottom) is not installed. Please install it first." -ForegroundColor Red
    Write-Host "Install with: winget install ClementTsang.bottom" -ForegroundColor Yellow
    exit 1
}

Write-Host "Starting display rotation (press Ctrl+C to stop)" -ForegroundColor Green
Write-Host "Rotating between: btm (resource monitor), moon phase, Kirkland weather" -ForegroundColor Cyan
Write-Host "Delay between rotations: $Delay seconds" -ForegroundColor Cyan
Write-Host ""

try {
    while ($true) {
        # Clear screen and show moon phase
        Clear-Host
        # Write-Host "=== Moon Phase ===" -ForegroundColor Green
        Write-Host ""
        Invoke-RestMethod https://wttr.in/moon?Fn
        
        Start-Sleep -Seconds $Delay
        
        # Clear screen and show Kirkland weather
        Clear-Host
        # Write-Host "=== Kirkland Weather ===" -ForegroundColor Green
        Write-Host ""
        Invoke-RestMethod https://wttr.in/Kirkland?2Fun
        
        Start-Sleep -Seconds $Delay

        # Clear screen and show btm
        # Clear-Host
        # Write-Host "=== Resource Monitor (btm) ===" -ForegroundColor Green
        # Write-Host "Press 'q' to exit btm and continue rotation" -ForegroundColor Yellow
        # Write-Host ""
        # btm
        
        Start-Sleep -Seconds $Delay
    }
}
catch {
    if ($_.Exception.InnerException -and $_.Exception.InnerException.GetType().Name -eq "OperationCanceledException") {
        Write-Host "`nDisplay rotation stopped by user" -ForegroundColor Yellow
    } else {
        Write-Host "`nError occurred: $($_.Exception.Message)" -ForegroundColor Red
    }
}
finally {
    Clear-Host
    Write-Host "Display rotation ended" -ForegroundColor Green
}
