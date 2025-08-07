# PowerShell script to find and kill all running node.js servers

# Get all node processes (case-insensitive)
$nodeProcs = Get-Process | Where-Object { $_.ProcessName -match 'node' }

if ($nodeProcs) {
    Write-Host "Found $($nodeProcs.Count) node.js process(es). Terminating..."
    foreach ($proc in $nodeProcs) {
        try {
            Stop-Process -Id $proc.Id -Force -ErrorAction Stop
            Write-Host "Terminated node.js process with PID $($proc.Id)"
        } catch {
            Write-Host "Failed to terminate process with PID $($proc.Id): $_"
        }
    }
} else {
    Write-Host "No running node.js processes found."
}
