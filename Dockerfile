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

# Create necessary directories
RUN mkdir -p database
RUN mkdir -p static
RUN mkdir -p src/models
RUN mkdir -p src/routes

# Copy model files directly to their correct location
COPY src/models/user.py src/models/user.py
COPY src/models/voting_session.py src/models/voting_session.py
COPY src/models/session_invitation.py src/models/session_invitation.py
COPY src/models/team.py src/models/team.py
COPY src/models/api_key.py src/models/api_key.py

# Copy route files directly to their correct location
COPY jira.py src/routes/jira.py
COPY src/routes/auth.py src/routes/auth.py
COPY src/routes/teams.py src/routes/teams.py
COPY src/routes/api_keys.py src/routes/api_keys.py
COPY src/routes/user.py src/routes/user.py

# Create __init__.py files
RUN touch src/__init__.py
RUN touch src/models/__init__.py
RUN touch src/routes/__init__.py

# Copy built frontend from frontend-builder stage
COPY --from=frontend-builder /app/frontend/dist/ ./static/

# Expose port
EXPOSE 5000

# Set environment variables
ENV FLASK_APP=main.py
ENV FLASK_ENV=production

# Run the application
CMD ["python", "main.py"]