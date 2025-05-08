# Improvscoreboard Deployment

This directory contains scripts and configuration files for deploying the Improvscoreboard application to a production environment using Docker.

## Files

- `setup_vps.sh`: Script to set up a new Ubuntu 24.04 LTS VPS for the application with Docker
- `deploy.sh`: Script to deploy the application to a production server
- `backup.sh`: Script to create and rotate MongoDB backups from Docker container
- `monitor.sh`: Script to monitor the application and Docker containers
- `ecosystem.config.js`: PM2 configuration file for process management (legacy)
- `nginx.conf`: Nginx configuration file for the reverse proxy

## VPS Setup

To set up a new VPS for the application, follow these steps:

1. SSH into your VPS as root
2. Copy the `setup_vps.sh` script to the server
3. Make the script executable: `chmod +x setup_vps.sh`
4. Run the script: `./setup_vps.sh`

The script will:
- Update the system
- Install Node.js, Docker, Docker Compose, Nginx, and other required packages
- Configure the firewall
- Create an application user
- Set up directories and permissions
- Configure log rotation
- Set up a daily MongoDB backup cron job
- Create Docker Compose files for MongoDB and the application

## Deployment

To deploy the application to a production server, follow these steps:

1. Update the configuration in `deploy.sh`:
   - `DEPLOY_USER`: The username on the server (default: `deploy`)
   - `DEPLOY_HOST`: The IP address or hostname of the server
   - `DEPLOY_PATH`: The path where the application will be deployed (default: `/var/www/improvscoreboard`)
   - `REPO_URL`: The URL of the Git repository (if using Git)
   - `BRANCH`: The branch to deploy (default: `main`)

2. Make the script executable: `chmod +x deploy.sh`

3. Run the script: `./deploy.sh`

The script will:
- Build the client and server applications
- Create a production `.env` file
- Copy the built files to the server
- Set up Nginx
- Configure PM2 to run the application

## SSL/TLS Configuration

To configure SSL/TLS for your domain, follow these steps:

1. Update the `nginx.conf` file with your domain name
2. Run Certbot to obtain an SSL certificate:
   ```
   certbot --nginx -d your-domain.com
   ```

## Docker Setup

The application uses Docker for containerization, which provides better isolation and compatibility with Ubuntu 24.04.

### MongoDB Container

MongoDB runs in a Docker container with the following configuration:
- Container name: `mongodb`
- Port: 27017 (mapped to host)
- Data volume: `/var/data/mongodb`
- Default credentials: admin/password (change these in production!)

### Application Container

The application runs in a Docker container with the following configuration:
- Container name: `improvscoreboard`
- Port: 3001 (mapped to host)
- Volume: `/var/www/improvscoreboard/server` mounted to `/app` in the container
- Environment variables set in the Docker Compose file

## MongoDB Backups

The `backup.sh` script creates and rotates MongoDB backups from the Docker container. It is set up to run daily via a cron job.

To manually create a backup, run:
```
./backup.sh
```

To test the backup restoration, run:
```
./backup.sh --test-restore
```

## Docker Management

The application is managed using Docker Compose. Here are some useful Docker commands:

- Start the application: `docker compose -f /var/docker/improvscoreboard/docker-compose.yml up -d`
- Stop the application: `docker compose -f /var/docker/improvscoreboard/docker-compose.yml down`
- View logs: `docker logs -f improvscoreboard`
- Restart the application: `docker restart improvscoreboard`
- Check container status: `docker ps`

## Monitoring

The application can be monitored using PM2's built-in monitoring tools. For more advanced monitoring, consider setting up:

- Prometheus for metrics collection
- Grafana for visualization
- Alertmanager for alerts

## Monitoring

The `monitor.sh` script checks the health of the application and Docker containers. It can be run manually or set up as a cron job.

To run the monitoring script:
```
./monitor.sh
```

## Troubleshooting

If you encounter issues with the deployment, check the following:

- Nginx logs: `/var/log/nginx/error.log`
- Application logs: `docker logs improvscoreboard`
- MongoDB logs: `docker logs mongodb`
- Docker status: `docker ps -a`
- Docker Compose logs: `docker compose -f /var/docker/improvscoreboard/docker-compose.yml logs`