# Improvscoreboard Deployment

This directory contains scripts and configuration files for deploying the Improvscoreboard application to a production environment.

## Files

- `setup_vps.sh`: Script to set up a new Ubuntu 22.04 LTS VPS for the application
- `deploy.sh`: Script to deploy the application to a production server
- `backup.sh`: Script to create and rotate MongoDB backups
- `ecosystem.config.js`: PM2 configuration file for process management
- `nginx.conf`: Nginx configuration file for the reverse proxy

## VPS Setup

To set up a new VPS for the application, follow these steps:

1. SSH into your VPS as root
2. Copy the `setup_vps.sh` script to the server
3. Make the script executable: `chmod +x setup_vps.sh`
4. Run the script: `./setup_vps.sh`

The script will:
- Update the system
- Install Node.js, MongoDB, Nginx, and other required packages
- Configure the firewall
- Create an application user
- Set up directories and permissions
- Configure log rotation
- Set up a daily MongoDB backup cron job

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

## MongoDB Backups

The `backup.sh` script creates and rotates MongoDB backups. It is set up to run daily via a cron job.

To manually create a backup, run:
```
./backup.sh
```

To test the backup restoration, run:
```
./backup.sh --test-restore
```

## Process Management

The application is managed using PM2. Here are some useful PM2 commands:

- Start the application: `pm2 start ecosystem.config.js --env production`
- Restart the application: `pm2 restart improvscoreboard`
- Stop the application: `pm2 stop improvscoreboard`
- View logs: `pm2 logs improvscoreboard`
- Monitor the application: `pm2 monit`

## Monitoring

The application can be monitored using PM2's built-in monitoring tools. For more advanced monitoring, consider setting up:

- Prometheus for metrics collection
- Grafana for visualization
- Alertmanager for alerts

## Troubleshooting

If you encounter issues with the deployment, check the following:

- Nginx logs: `/var/log/nginx/error.log`
- Application logs: `pm2 logs improvscoreboard`
- MongoDB logs: `/var/log/mongodb/mongod.log`