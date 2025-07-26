# Use Node.js for building the frontend
FROM node:18-alpine as frontend-builder

WORKDIR /app/frontend

# Copy package files
COPY package*.json ./
RUN npm install

# Copy frontend source code
COPY index.html ./
COPY vite.config.js ./
COPY tailwind.config.js ./
COPY postcss.config.js ./
COPY src/ ./src/

# Build the React application
RUN npm run build

# Use Python for the backend
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY main.py .
COPY jira.py .
COPY user.py .
COPY voting_session.py .

# Create necessary directories
RUN mkdir -p database
RUN mkdir -p static
RUN mkdir -p src/models
RUN mkdir -p src/routes

# Move Python files to correct structure
RUN mv user.py src/models/
RUN mv voting_session.py src/models/

# Copy additional model files
COPY src/models/session_invitation.py src/models/session_invitation.py
COPY src/models/team.py src/models/team.py

# Move routes
RUN mv jira.py src/routes/

# Create __init__.py files
RUN touch src/__init__.py
RUN touch src/models/__init__.py
RUN touch src/routes/__init__.py

# Copy built frontend from frontend-builder stage
COPY --from=frontend-builder /app/frontend/dist/ ./static/

# Create user.py route file
RUN echo "from flask import Blueprint\n\nuser_bp = Blueprint('user', __name__)" > src/routes/user.py

# Create auth.py route file
COPY src/routes/auth.py src/routes/auth.py

# Copy teams.py route file
COPY src/routes/teams.py src/routes/teams.py

# Expose port
EXPOSE 5000

# Set environment variables
ENV FLASK_APP=main.py
ENV FLASK_ENV=production

# Run the application
CMD ["python", "main.py"]