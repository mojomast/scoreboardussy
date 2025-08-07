# Test Script for PowerShell

# Test GET /api/state
Write-Host "Testing GET /api/state..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/state" -Method Get
    Write-Host "Success! Current state:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error getting state: $_" -ForegroundColor Red
}

# Test POST /api/score/team1/increment
Write-Host "`nTesting POST /api/score/team1/increment..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/score/team1/increment" -Method Post
    Write-Host "Success! Team 1 score updated:" -ForegroundColor Green
    "Team 1 score: " + $response.team1.score
} catch {
    Write-Host "Error updating score: $_" -ForegroundColor Red
}

# Test POST /api/score/team2/increment
Write-Host "`nTesting POST /api/score/team2/increment..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/score/team2/increment" -Method Post
    Write-Host "Success! Team 2 score updated:" -ForegroundColor Green
    "Team 2 score: " + $response.team2.score
} catch {
    Write-Host "Error updating score: $_" -ForegroundColor Red
}

# Check final state
Write-Host "`nGetting final state..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/state" -Method Get
    Write-Host "Final state:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error getting state: $_" -ForegroundColor Red
}

Write-Host "`nAPI tests completed!" -ForegroundColor Green
Write-Host "`nFor WebSocket testing, please install wscat (npm install -g wscat) and connect to ws://localhost:3001" -ForegroundColor Yellow

