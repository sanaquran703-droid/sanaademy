$pages = @("/login", "/login/admin", "/login/teacher", "/login/student")
foreach ($p in $pages) {
    try {
        $r = Invoke-WebRequest -Uri ("http://localhost:3000" + $p) -UseBasicParsing
        $body = $r.Content
        $title = "N/A"
        if ($body -match '<title>([^<]+)') { $title = $matches[1] }
        $cards = if ($body -match 'الإدارة|المعلمات|الطالبات') { "YES" } else { "NO" }
        $form = if ($body -match 'لوحة الإدارة|بوابة المعلمة|بوابة الطالبة') { "YES" } else { "NO" }
        Write-Output "$p -> $title | portal-text:$cards form-portal:$form"
    } catch {
        Write-Output "$p -> ERROR"
    }
}
