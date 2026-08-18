$log = 'D:\quran-sana\Sana-quran-academy-platform\scripts\build-s1.log'
$content = Get-Content $log -Raw
if ($content -match 'Compiled successfully') { Write-Output "BUILD_OK" } else { Write-Output "BUILD_NOT_FOUND" }
$errors = Select-String -Path $log -Pattern 'error|Failed|failed' | Where-Object { $_.Line -notmatch 'prerendered|static content|Dynamic' }
if ($errors) { $errors | ForEach-Object { Write-Output $_.Line } } else { Write-Output "NO_ERROR_LINES" }
