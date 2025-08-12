# Multi-stage Dockerfile to build client and server, then run a single container

# 1) Build the client (React + Vite)
FROM node:18-alpine AS client-build
WORKDIR /app/client
# Install dependencies
COPY client/package*.json ./
RUN npm ci
# Copy server types into expected relative path for client build alias
RUN mkdir -p /app/server/src/types
COPY server/src/types /app/server/src/types
# Copy client source and build
COPY client/ .
RUN npm run build

# 2) Build the server (Express + TS)
FROM node:18-alpine AS server-build
WORKDIR /app/server
# Install dependencies
COPY server/package*.json ./
RUN npm ci && npm cache clean --force
# Copy source and build
COPY server/ ./
RUN npm run build

# 3) Runtime image
FROM node:18-alpine AS runtime
ENV NODE_ENV=production
# Create app dirs
WORKDIR /app/server
# Copy only production dependencies for server
COPY --from=server-build /app/server/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
# Copy built server dist
COPY --from=server-build /app/server/dist ./dist
# Copy client build where the server expects it (../client/dist relative to CWD)
WORKDIR /app
RUN mkdir -p /app/client
COPY --from=client-build /app/client/dist /app/client/dist
# Ensure working directory is server when launching
WORKDIR /app/server

# Expose backend port
EXPOSE 3001

# Persist server data (scoreboard state)
VOLUME ["/app/server/data"]

# Start the server
CMD ["node", "dist/server.js"]
