# Docker Deployment Guide - Jira Estimation Tool

This guide provides complete instructions for deploying the Jira Estimation Tool using Docker and Docker Compose.

## Quick Start

### Prerequisites
- Docker (version 20.0 or higher)
- Docker Compose (version 2.0 or higher)

### Easy Deployment
1. Run the deployment script:
   ```bash
   chmod +x docker-deploy.sh
   ./docker-deploy.sh
   ```

2. Access the application at: http://localhost:8080

## Manual Deployment

### Build and Start
```bash
# Create database directory
mkdir -p database

# Build and start the application
docker compose up --build -d
```

### Management Commands
```bash
# View logs
docker compose logs -f

# Stop application
docker compose down

# Restart application
docker compose restart
```

## Configuration

The application runs on port 8080 by default (mapped from internal port 5000). To change the external port, modify the `ports` section in `docker-compose.yml`:

```yaml
ports:
  - "9000:5000"  # External:Internal
```

## Database Persistence

The SQLite database is persisted in the `./database` directory on the host machine.

## Troubleshooting

### Common Issues

**Port Already in Use**:
```bash
# Check what's using port 8080
lsof -i :8080
```

**Build Failures**:
```bash
# Clean build cache
docker system prune -a
# Rebuild from scratch
docker compose build --no-cache
```

**Database Issues**:
```bash
# Reset database (WARNING: This deletes all data)
docker compose down
rm -rf database/
mkdir database
docker compose up -d
```

## Production Deployment

For production deployment, consider:
- Using a reverse proxy (Nginx/Caddy)
- Setting up SSL/HTTPS
- Configuring proper logging
- Setting up monitoring

## Architecture

The deployment uses:
- Multi-stage Dockerfile (Node.js for frontend build, Python for backend)
- Docker Compose for orchestration
- Volume mounting for database persistence
- Health checks for monitoring