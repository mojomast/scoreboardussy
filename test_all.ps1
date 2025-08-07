# Main Testing Coordination Script

Write-Host @"
Improvscoreboard Testing Guide
=============================

This testing process will verify the modularized server functionality.
Follow each step and verify the results.

Step 1: Server Testing
---------------------
1. Open a new terminal and start the server:
   cd server
   npm start

   Expected output:
   - Server starts on port 3001
   - Development logging is enabled
   - CORS is configured
   - WebSocket is enabled

Step 2: API Testing
------------------
1. Open a new terminal and run:
   .\test_api.ps1

   Expected results:
   - GET /api/state returns current state
   - POST operations modify scores correctly
   - All responses are valid JSON

Step 3: WebSocket Testing
------------------------
1. Open a new terminal and run:
   .\test_websocket.ps1

2. Follow the instructions to:
   - Connect with wscat
   - Send test messages
   - Verify state updates

Step 4: Integration Verification
------------------------------
1. Check server logs for:
   - Proper event handling
   - State updates
   - Error handling
   - Client connections/disconnections

2. Verify that:
   - State remains consistent
   - Updates are broadcast to all clients
   - Error messages are helpful
"@ -ForegroundColor Cyan

$choice = Read-Host "`nWould you like to start the testing process? (y/n)"

if ($choice -eq 'y') {
    Write-Host "`nStarting API tests..." -ForegroundColor Yellow
    Write-Host "Make sure the server is running in another terminal!`n" -ForegroundColor Yellow
    Start-Sleep -Seconds 3
    
    # Run API tests
    .\test_api.ps1
    
    Write-Host "`nProceed with WebSocket tests? (y/n)" -ForegroundColor Yellow
    $wsChoice = Read-Host
    
    if ($wsChoice -eq 'y') {
        # Show WebSocket testing instructions
        .\test_websocket.ps1
    }
    
    Write-Host @"

Testing Complete!
================
✓ Server structure verified
✓ API endpoints tested
✓ WebSocket functionality documented

Next Steps:
1. Fix any issues found during testing
2. Document any unexpected behavior
3. Proceed with client integration testing
"@ -ForegroundColor Green
} else {
    Write-Host "`nTesting cancelled. Run this script again when ready to test." -ForegroundColor Yellow
}

