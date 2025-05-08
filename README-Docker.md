# Improvscoreboard Docker Setup

This document explains how to use Docker for both development and production environments for the Improvscoreboard application.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

## Development Environment

The project includes a `docker-compose.yml` file that sets up a complete development environment with:

- SQLite database
- Node.js server (with hot-reloading)
- React client (with Vite dev server)

### Starting the Development Environment

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Stop all services
docker compose down
```

### Accessing the Services

- Client: http://localhost:5173
- Server API: http://localhost:3001/api/state
- SQLite database file: ./data/improvscoreboard.sqlite

### Development Workflow

The Docker setup mounts your local directories into the containers, so any changes you make to the source code will be reflected immediately:

- Client changes will trigger Vite's hot module replacement
- Server changes will restart the Node.js server (using nodemon)

## Production Environment

For production deployment, refer to the deployment scripts in the `server/deployment` directory. The production setup uses:

- SQLite for data persistence
- Docker for the application server
- Nginx as a reverse proxy

### Production Deployment

1. Set up a VPS using the `setup_vps.sh` script
2. Deploy the application using the `deploy.sh` script
3. Monitor the application using the `monitor.sh` script

## Docker Commands Reference

### Container Management

```bash
# List running containers
docker ps

# List all containers (including stopped ones)
docker ps -a

# Stop a container
docker stop <container_name>

# Start a container
docker start <container_name>

# Restart a container
docker restart <container_name>

# Remove a container
docker rm <container_name>
```

### Logs and Debugging

```bash
# View container logs
docker logs <container_name>

# Follow container logs
docker logs -f <container_name>

# Execute a command in a running container
docker exec -it <container_name> <command>

# Get a shell in a running container
docker exec -it <container_name> sh
```

### Database Operations

```bash
# Create a SQLite database backup
docker exec improvscoreboard-server sh -c "sqlite3 /app/data/improvscoreboard.sqlite '.backup /tmp/db.backup'"
docker cp improvscoreboard-server:/tmp/db.backup ./db.backup

# Restore a SQLite database backup
docker cp ./db.backup improvscoreboard-server:/tmp/db.backup
docker exec improvscoreboard-server sh -c "sqlite3 /app/data/improvscoreboard.sqlite '.restore /tmp/db.backup'"
```

## Troubleshooting

### Connection Issues

If the server can't connect to the SQLite database, check:

1. The data directory exists and has correct permissions
2. The SQLite database path is correct in the server's `.env` file
3. Server logs for database connection errors: `docker logs improvscoreboard-server`

### Volume Permissions

If you encounter permission issues with mounted volumes:

```bash
# Fix permissions for SQLite data directory
sudo chown -R 1000:1000 /path/to/data
```

### Network Issues

If containers can't communicate:

```bash
# Check Docker networks
docker network ls

# Inspect network
docker network inspect app-network