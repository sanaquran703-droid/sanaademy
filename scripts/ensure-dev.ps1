try {
  $code = (Invoke-WebRequest -Uri 'http://localhost:3000/login/teacher' -UseBasicParsing -TimeoutSec 5).StatusCode
  Write-Output "DEV_SERVER_OK status=$code"
} catch {
  Write-Output "DEV_SERVER_OFFLINE starting..."
  Start-Process -FilePath "powershell" -ArgumentList "-NoProfile","-Command","cd D:\quran-sana\Sana-quran-academy-platform; npm run dev" -WindowStyle Minimized
  Start-Sleep -Seconds 15
  Write-Output "STARTED"
}
