# Manual Testing Checklist for Modularized Server

1. Server Startup Test ✅
   - Server starts successfully
   - Correct port (3001) is used
   - Development logging is enabled
   - CORS is configured

2. API Endpoints to Test (using a new terminal or tool like Postman):
   ```
   GET http://localhost:3001/api/state
   POST http://localhost:3001/api/score/team1/increment
   POST http://localhost:3001/api/score/team2/increment
   ```

3. WebSocket Events to Test (using a tool like WebSocket client):
   ```
   Connect to: ws://localhost:3001
   
   Test Events:
   - updateTeam: {"teamId": "team1", "updates": {"name": "Test Team"}}
   - updateScore: {"teamId": "team1", "action": 1}
   - updatePenalty: {"teamId": "team1", "type": "major"}
   - resetPenalties: {"teamId": "team1"}
   - updateText: {"field": "titleText", "text": "Test Title"}
   ```

4. Integration Test with Client:
   - Start client development server
   - Connect to backend
   - Test all UI interactions

To proceed with testing:

1. Run the server in one terminal:
   ```
   npm start
   ```

2. In a separate terminal or using tools like Postman/WebSocket client:
   - Test API endpoints
   - Test WebSocket connections
   - Verify state updates

