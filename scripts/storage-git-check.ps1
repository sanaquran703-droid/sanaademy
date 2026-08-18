Set-Location D:\quran-sana\Sana-quran-academy-platform

Write-Output "=== supabase.ts / storage helpers in src ==="
$found = Get-ChildItem -Recurse src -File | Where-Object { $_.Name -match 'supabase' }
if ($found) { $found.FullName } else { Write-Output "(none found in src)" }

Write-Output ""
Write-Output "=== storage references in src ==="
Get-ChildItem -Recurse src -File -Include *.ts,*.tsx | Select-String -Pattern "uploadToStorage|\.storage\b|storage.*upload" -List | ForEach-Object { Write-Output ("{0}: {1}" -f $_.Path, $_.Line.Trim()) } | Select-Object -First 8
Write-Output "(end)"

Write-Output ""
Write-Output "=== git status (first 20) ==="
$status = git status --short 2>&1
if ($status -match "fatal") { Write-Output "NO .git repository" } else { $status | Select-Object -First 20 }

Write-Output ""
Write-Output "=== modified files today ==="
Get-ChildItem -Recurse src,prisma -File -Include *.ts,*.tsx,*.sql,*.toml | Where-Object { $_.LastWriteTime -gt (Get-Date).AddDays(-7) } | ForEach-Object { $_.FullName } | Select-Object -First 30
