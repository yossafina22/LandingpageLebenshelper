$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:8080/")
$listener.Start()
Write-Output "Server running at http://localhost:8080/"
$dir = $PSScriptRoot
if (-not $dir) { $dir = "C:\Users\PC\Projekte\LandingpageLebenshelper" }

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        $rawPath = $request.Url.LocalPath
        if ($rawPath -eq "/" -or [string]::IsNullOrWhiteSpace($rawPath)) { $rawPath = "/index.html" }
        $cleanPath = $rawPath.TrimStart('/').Replace('/', '\')
        $filePath = Join-Path $dir $cleanPath
        
        if (Test-Path $filePath -PathType Leaf) {
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            if ($filePath.EndsWith(".html")) { $response.ContentType = "text/html; charset=utf-8" }
            elseif ($filePath.EndsWith(".css")) { $response.ContentType = "text/css; charset=utf-8" }
            elseif ($filePath.EndsWith(".js")) { $response.ContentType = "application/javascript; charset=utf-8" }
            elseif ($filePath.EndsWith(".svg")) { $response.ContentType = "image/svg+xml" }
            elseif ($filePath.EndsWith(".png")) { $response.ContentType = "image/png" }
            elseif ($filePath.EndsWith(".jpg") -or $filePath.EndsWith(".jpeg")) { $response.ContentType = "image/jpeg" }
            elseif ($filePath.EndsWith(".webp")) { $response.ContentType = "image/webp" }
            elseif ($filePath.EndsWith(".ico")) { $response.ContentType = "image/x-icon" }
            elseif ($filePath.EndsWith(".woff2")) { $response.ContentType = "font/woff2" }
            elseif ($filePath.EndsWith(".woff")) { $response.ContentType = "font/woff" }
            elseif ($filePath.EndsWith(".xml")) { $response.ContentType = "application/xml; charset=utf-8" }
            elseif ($filePath.EndsWith(".txt")) { $response.ContentType = "text/plain; charset=utf-8" }
            elseif ($filePath.EndsWith(".json")) { $response.ContentType = "application/json" }
            else { $response.ContentType = "text/plain; charset=utf-8" }
            
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
        }
        $response.OutputStream.Close()
    } catch {
        # Continue listening
    }
}
