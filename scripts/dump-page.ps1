$r = Invoke-WebRequest -Uri "http://localhost:3000/login" -UseBasicParsing
$r.Content | Out-File -FilePath scripts\page-login.html -Encoding utf8
Write-Output "saved scripts\page-login.html size=$($r.Content.Length)"
