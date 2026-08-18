Set-Location D:\quran-sana\Sana-quran-academy-platform

Write-Output "=== prisma migrate status ==="
npx prisma migrate status 2>&1 | Select-Object -First 40

Write-Output ""
Write-Output "=== tsc --noEmit ==="
npx tsc --noEmit 2>&1 | Select-Object -First 30
$tscExit = $LASTEXITCODE
Write-Output ("tsc exit code: {0}" -f $tscExit)
