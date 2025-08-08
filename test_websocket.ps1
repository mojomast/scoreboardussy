# WebSocket Test Script for PowerShell

Write-Host @"
WebSocket Testing Guide:

1. Start the server in a separate terminal:
   cd server
   npm start

2. In another terminal, connect using wscat:
   wscat -c ws://localhost:3001

3. Copy and paste these test messages one at a time:

# Update team name
{
    "getState": {}
}

# Update team name
{
    "updateTeam": {
        "teamId": "team1",
        "updates": {
            "name": "Test Team"
        }
    }
}

# Update score
{
    "updateScore": {
        "teamId": "team1",
        "action": 1
    }
}

# Add penalty
{
    "updatePenalty": {
        "teamId": "team1",
        "type": "major"
    }
}

# Reset penalties
{
    "resetPenalties": {
        "teamId": "team1"
    }
}

# Update title text
{
    "updateText": {
        "field": "titleText",
        "text": "Test Title"
    }
}

# Update visibility
{
    "updateVisibility": {
        "target": "score",
        "visible": false
    }
}

# Switch team emojis
{
    "switchTeamEmojis": {}
}

# Reset all
{
    "resetAll": {}
}

# ROUND SYSTEM TESTS

# Planning: set a Next Round Draft
{
    "setNextRoundDraft": {
        "config": {
            "number": 1,
            "isMixed": false,
            "theme": "Opening Game",
            "type": "shortform",
            "minPlayers": 2,
            "maxPlayers": 4,
            "timeLimit": 180
        }
    }
}

# Planning: enqueue an upcoming round
{
    "enqueueUpcoming": {
        "config": {
            "number": 2,
            "isMixed": true,
            "theme": "Genre Mashup",
            "type": "challenge",
            "minPlayers": 3,
            "maxPlayers": 5,
            "timeLimit": 300
        }
    }
}

# Lifecycle: start the game (uses draft or first upcoming)
{
    "startGame": {}
}

# Create next round (shortform)
{
    "createNextRound": "shortform"
}

# Start a round
{
    "startRound": {
        "config": {
            "number": 1,
            "isMixed": false,
            "theme": "Party Scene",
            "type": "shortform",
            "minPlayers": 2,
            "maxPlayers": 4,
            "timeLimit": 180
        }
    }
}

# End a round with results
{
    "endRound": {
        "points": {
            "team1": 3,
            "team2": 2
        },
        "penalties": {
            "team1": {
                "major": 0,
                "minor": 1
            },
            "team2": {
                "major": 1,
                "minor": 0
            }
        },
        "notes": "Team 1 had excellent character work"
    }
}

# Lifecycle: finish the game (generates HTML report on server)
{
    "finishGame": {}
}

# Create a longform round
{
    "createNextRound": "longform"
}

# Update round visibility settings
{
    "updateRoundSetting": {
        "target": "showTheme",
        "visible": false
    }
}

# Create a musical round
{
    "createNextRound": "musical"
}

# Test invalid round config (should fail validation)
{
    "startRound": {
        "config": {
            "number": 0,
            "isMixed": false,
            "theme": "Invalid",
            "type": "custom",
            "minPlayers": 10,
            "maxPlayers": 2,
            "timeLimit": -30
        }
    }
}

# Reset round system
{
    "resetRounds": {}
}

Each message should trigger a state update that will be broadcast back to all connected clients.
Monitor the server console for logging information about received events.
"@ -ForegroundColor Cyan

Write-Host "`nTo start testing:" -ForegroundColor Yellow
Write-Host "1. Make sure the server is running (npm start in server directory)" -ForegroundColor Yellow
Write-Host "2. Open a new terminal and run: wscat -c ws://localhost:3001" -ForegroundColor Yellow
Write-Host "3. Copy and paste the test messages above one at a time" -ForegroundColor Yellow

