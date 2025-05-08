# Improvscoreboard Improvement Plan

This document outlines a comprehensive plan for improving the Improvscoreboard application and deploying it to a self-managed VPS for production use.

## Table of Contents

1. [Server Configuration Improvements](#1-server-configuration-improvements)
2. [Database Integration](#2-database-integration)
3. [Authentication Implementation](#3-authentication-implementation)
4. [Deployment Configuration](#4-deployment-configuration)
5. [Monitoring and Maintenance](#5-monitoring-and-maintenance)

## 1. Server Configuration Improvements

### 1.1 Environment Variables Management ✅

**Current State:** The application has minimal environment variable usage (only PORT and NODE_ENV).

**Improvements:**

- ✅ Create a `.env` file structure for both development and production
- ✅ Implement environment variables for:
  - ✅ Server port
  - ✅ Database connection details
  - ✅ CORS allowed origins
  - ✅ Authentication secrets
  - ✅ Log levels
- ✅ Add validation for required environment variables

**Implementation Steps:**

1. ✅ Install `dotenv` package
2. ✅ Create `.env.example` file with all required variables
3. ✅ Update server code to use environment variables
4. ✅ Add environment variable validation on startup

### 1.2 CORS Configuration ✅

**Current State:** CORS is configured only for localhost development.

**Improvements:**

- ✅ Make CORS configuration dynamic based on environment
- ✅ Allow configuring allowed origins via environment variables
- ✅ Implement proper CORS error handling

**Implementation Steps:**

1. ✅ Update CORS configuration to use environment variables
2. ✅ Create a whitelist of allowed origins for production
3. ✅ Implement proper error handling for CORS issues

### 1.3 Security Headers ✅

**Current State:** No security headers are implemented.

**Improvements:**

- ✅ Add essential security headers:
  - ✅ Content-Security-Policy
  - ✅ X-Content-Type-Options
  - ✅ X-Frame-Options
  - ✅ X-XSS-Protection
  - ✅ Strict-Transport-Security (HSTS)

**Implementation Steps:**

1. ✅ Install `helmet` package
2. ✅ Configure appropriate security headers
3. ✅ Test headers with security scanning tools

## 2. Database Integration

### 2.1 Database Selection ✅

**Current State:** In-memory state with no persistence.

**Improvements:**

- ✅ Implement MongoDB for data persistence
- ✅ Design schema for scoreboard state
- ✅ Create data access layer

**Implementation Steps:**

1. ✅ Install MongoDB and Mongoose packages
2. ✅ Set up database connection with proper error handling
3. ✅ Create Mongoose schemas for scoreboard state

### 2.2 Schema Design ✅

**Implemented Schemas:**

```javascript
// Scoreboard Schema
const scoreboardSchema = new mongoose.Schema({
  name: { type: String, default: 'Default Scoreboard' },
  teams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }],
  logoUrl: { type: String, default: null, required: false },
  logoSize: { type: Number, default: 50 },
  titleText: { type: String, default: '' },
  footerText: { type: String, default: null, required: false },
  titleTextColor: { type: String, default: '#FFFFFF' },
  titleTextSize: { type: Number, default: 2 },
  footerTextColor: { type: String, default: '#FFFFFF' },
  footerTextSize: { type: Number, default: 1.25 },
  showScore: { type: Boolean, default: true },
  showPenalties: { type: Boolean, default: true },
  showEmojis: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Team Schema
const teamSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  color: { type: String, required: true },
  score: { type: Number, default: 0 },
  penalties: {
    major: { type: Number, default: 0 },
    minor: { type: Number, default: 0 }
  },
  emoji: { type: String, enum: ['hand', 'fist', null], default: null },
  scoreboard: { type: mongoose.Schema.Types.ObjectId, ref: 'Scoreboard' }
});

// User Schema (for authentication)
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Store hashed password
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
  createdAt: { type: Date, default: Date.now }
});
```

### 2.3 Data Migration ✅

**Implementation Steps:**

1. ✅ Create data migration scripts
2. ✅ Implement functions to convert between in-memory state and database models
3. ✅ Add fallback to in-memory state if database connection fails

## 3. Authentication Implementation

### 3.1 Authentication System ✅

**Current State:** No authentication.

**Improvements:**

- ✅ Implement JWT-based authentication
- ✅ Create login page for control panel
- ✅ Add user management API

**Implementation Steps:**

1. ✅ Install required packages (`jsonwebtoken`, `bcrypt`, `express-jwt`)
2. ✅ Create authentication middleware
3. ✅ Implement login, logout, and token refresh endpoints
4. ✅ Add password hashing and validation

### 3.2 Route Protection ✅

**Implementation Steps:**

1. ✅ Protect control panel routes with authentication middleware
2. ✅ Keep display view publicly accessible
3. ✅ Add role-based access control for future expansion

### 3.3 UI Integration ✅

**Implementation Steps:**

1. ✅ Create login form component
2. ✅ Add authentication state to React context
3. ✅ Implement protected routes in React
4. ✅ Add logout functionality
5. ✅ Create session persistence with localStorage

## 4. Deployment Configuration

### 4.1 VPS Setup ✅

**Implementation Steps:**

1. ✅ Provision a VPS (Ubuntu 22.04 LTS recommended)
2. ✅ Install required dependencies:
   - ✅ Node.js (v18+)
   - ✅ MongoDB
   - ✅ Nginx
   - ✅ Certbot (for SSL)
   - ✅ UFW (firewall)
3. ✅ Create a dedicated user for the application
4. ✅ Set up SSH key authentication

### 4.2 Nginx Configuration ✅

**Implementation Steps:**

1. ✅ Install and configure Nginx as a reverse proxy
2. ✅ Create server blocks for the application
3. ✅ Configure WebSocket support
4. ✅ Set up proper caching for static assets

**Sample Nginx Configuration:**

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # Redirect HTTP to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name your-domain.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    
    # Static files
    location / {
        root /var/www/improvscoreboard/client/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 30d;
            add_header Cache-Control "public, no-transform";
        }
    }
    
    # API and WebSocket
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Socket.IO specific config
    location /socket.io {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 4.3 Process Management ✅

**Implementation Steps:**

1. ✅ Install PM2 for Node.js process management
2. ✅ Create PM2 ecosystem configuration
3. ✅ Configure PM2 to start on system boot
4. ✅ Set up log rotation

**Sample PM2 Configuration:**

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'improvscoreboard',
    script: 'server/dist/server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
};
```

### 4.4 SSL/TLS Configuration ✅

**Implementation Steps:**

1. ✅ Install Certbot for Let's Encrypt SSL certificates
2. ✅ Obtain and configure SSL certificates
3. ✅ Set up auto-renewal
4. ✅ Configure HTTPS in Nginx

## 5. Monitoring and Maintenance

### 5.1 Logging ✅

**Implementation Steps:**

1. ✅ Implement structured logging with Winston
2. ✅ Configure log rotation
3. ✅ Set up error alerting (optional)

### 5.2 Backup Strategy ✅

**Implementation Steps:**

1. ✅ Set up automated MongoDB backups
2. ✅ Configure backup rotation
3. ✅ Test backup restoration process

### 5.3 Update Process ✅

**Implementation Steps:**

1. ✅ Create a deployment script
2. ✅ Implement database migration strategy
3. ✅ Document update procedures

## Implementation Timeline

| Phase | Task | Estimated Time | Status |
|-------|------|----------------|--------|
| 1 | Server Configuration Improvements | 1-2 days | ✅ Completed |
| 2 | Database Integration | 2-3 days | ✅ Completed |
| 3 | Authentication Implementation | 2-3 days | ✅ Completed |
| 4 | Deployment Configuration | 1-2 days | ✅ Completed |
| 5 | Monitoring and Maintenance | 1 day | ✅ Completed |
| | **Total** | **7-11 days** | **5/5 Completed** |

## Conclusion

This improvement plan provides a comprehensive roadmap for enhancing the Improvscoreboard application and deploying it to a production VPS environment. By implementing these changes, the application will be more secure, reliable, and maintainable in a production setting.

The most critical improvements are:

1. Adding database persistence to prevent data loss
2. Implementing authentication to secure the control panel
3. Configuring proper deployment with Nginx and SSL

These changes will ensure that the application is production-ready while maintaining its core functionality and user experience.