#!/bin/bash

# Jira Estimation Tool - Docker Deployment Script

echo "🚀 Deploying Jira Estimation Tool with Docker Compose..."

# Create database directory if it doesn't exist
mkdir -p database

# Build and start the application using docker compose
docker compose up --build -d

echo "✅ Application is starting up..."
echo "📊 You can access the Jira Estimation Tool at: http://localhost:8080"
echo "📝 To view logs: docker compose logs -f"
echo "🔄 To restart: docker compose restart"
echo "🛑 To stop: docker compose down"

# Wait for the application to be ready
echo "⏳ Waiting for application to be ready..."
sleep 10

# Check if the application is responding
if curl -f http://localhost:8080 > /dev/null 2>&1; then
    echo "✅ Application is ready and responding!"
    echo "🌐 Open your browser to: http://localhost:8080"
else
    echo "⚠️  Application might still be starting up. Check logs with: docker compose logs -f"
fi