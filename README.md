# Jira Estimation Tool

<div align="center">

![Jira Estimation Tool](https://img.shields.io/badge/Jira-Estimation%20Tool-blue?style=for-the-badge&logo=jira)
![Python](https://img.shields.io/badge/Python-3.8+-blue?style=for-the-badge&logo=python)
![React](https://img.shields.io/badge/React-18+-blue?style=for-the-badge&logo=react)
![Flask](https://img.shields.io/badge/Flask-2.3+-green?style=for-the-badge&logo=flask)
![Docker](https://img.shields.io/badge/Docker-Ready-blue?style=for-the-badge&logo=docker)

**A collaborative web application for agile story point estimation with Jira integration**

[🚀 Live Demo](https://lnh8imcj988z.manus.space) • [📖 Documentation](#documentation) • [🐛 Report Bug](https://github.com/Shock3udt/Jira-Estimator/issues) • [✨ Request Feature](https://github.com/Shock3udt/Jira-Estimator/issues)

</div>

## ✨ Features

- 🔗 **Jira Integration** - Connect to self-hosted Jira instances with API token authentication
- 🔍 **JQL Query Support** - Use powerful JQL queries to filter and select issues for estimation
- 🎯 **Story Point Voting** - Vote using Fibonacci sequence (1, 2, 3, 5, 8, 13, 21, ?)
- ⚡ **Real-time Collaboration** - See team member votes as they happen
- 👥 **Session Management** - Create and join estimation sessions with unique session IDs
- 🔐 **User Authentication** - Full user registration, login, and profile management
- 👥 **Team Management** - Create teams, invite members, and manage team-based sessions
- 🔑 **API Key Management** - Generate API keys with scoped permissions (read/write/admin)
- 📧 **Session Invitations** - Invite users via email to join estimation sessions
- 💾 **Jira Settings Storage** - Save and reuse Jira connection settings per user
- 📊 **User Dashboard** - Manage your sessions, invitations, and account settings
- 🎨 **Modern UI** - Responsive design with Tailwind CSS and shadcn/ui components
- 🔒 **Secure** - Token-based authentication with session isolation and API key scoping
- 👤 **Guest Support** - Allow guest users to participate with email identification
- 📱 **Mobile-Friendly** - Works seamlessly on desktop and mobile devices
- 📧 **Email Notifications** - Welcome emails, session invitations, and vote notifications
- 🐳 **Docker Ready** - Easy deployment with Docker and Docker Compose

## 🚀 Quick Start

### Using Docker (Recommended)

**Option 1: Use Pre-built Image (Fastest)**
```bash
# Pull and run the latest published image
docker run -d \
  --name jira-estimation-app \
  -p 8080:5000 \
  -v $(pwd)/database:/app/database \
  shock3udt/jira-estimation:latest
```

**Option 2: Docker Compose with Pre-built Image**
Create a `docker-compose.yml` file:
```yaml
services:
  jira-estimation-app:
    image: shock3udt/jira-estimation:latest
    ports:
      - "8080:5000"
    volumes:
      - ./database:/app/database
    restart: unless-stopped
```

Then run:
```bash
docker compose up -d
```

**Option 3: Build from Source**
1. **Clone the repository**
   ```bash
   git clone https://github.com/Shock3udt/Jira-Estimator.git
   cd Jira-Estimator
   ```

2. **Run with Docker**
   ```bash
   chmod +x docker-deploy.sh
   ./docker-deploy.sh
   ```

**Access the application**
Open your browser and go to: `http://localhost:8080`

### Manual Installation

<details>
<summary>Click to expand manual installation steps</summary>

#### Prerequisites

- Python 3.8 or higher
- Node.js 16 or higher
- npm or yarn

#### Backend Setup

1. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Initialize the database**
   ```bash
   python main.py
   ```
   (The database will be created automatically on first run)

#### Frontend Setup

1. **Install Node.js dependencies**
   ```bash
   npm install
   ```

2. **Build the frontend**
   ```bash
   npm run build
   ```

3. **Start the application**
   ```bash
   python main.py
   ```

4. **Access the application**
   Open your browser and go to: `http://localhost:5000`

</details>

## 🎯 How to Use

### Getting Started

The application supports two modes of operation:

**🔐 Registered Users (Recommended)**
- **Full Feature Access**: Create sessions, manage teams, generate API keys
- **Persistent Settings**: Save Jira credentials and reuse across sessions
- **Session Management**: View, edit, delete, and invite others to your sessions
- **Team Collaboration**: Create teams and invite members to sessions
- **Dashboard**: Comprehensive overview of your sessions, teams, and invitations

**👤 Guest Users**
- **Quick Participation**: Join existing sessions with just your email address
- **No Registration Required**: Immediate access to vote on sessions
- **Limited Functionality**: Cannot create sessions or manage teams

To get started as a **registered user**:
1. Click **"Register"** to create your account
2. Login and access the full user dashboard with all features

To participate as a **guest**:
1. Get a session ID from a registered user
2. Click **"Guest Join Session"** and provide your email

### Creating an Estimation Session

**For Registered Users:**
1. **Login** to your account
2. Go to **User Dashboard** or click **"Create Session"**
3. **Use Saved Settings** (if configured) or enter:
   - **Jira URL**: Your Jira instance URL (e.g., `https://your-company.atlassian.net`)
   - **Jira API Token**: Your personal API token for authentication
   - **JQL Query**: Query to filter issues (e.g., `project = PROJ AND status = 'To Do'`)
4. Click **"Create Session"** to start the estimation session
5. **Invite participants**:
   - Share the generated **Session ID**
   - Send **email invitations** to specific users
   - Invite entire **teams** if you have team management enabled

### Team Management

1. Go to **User Dashboard** → **Team Management**
2. **Create teams** and invite members by username
3. **Manage team sessions** - invite entire teams to estimation sessions
4. **Track team participation** across sessions

### API Key Management

1. Navigate to **User Dashboard** → **API Keys**
2. **Generate API keys** with specific scopes:
   - **Read**: View sessions and votes
   - **Write**: Create sessions and submit votes
   - **Admin**: Full access to all operations
3. **Use API keys** for automated integrations or external tools

### Joining a Session

**Registered Users:**
1. **Login** to your account
2. Click **"Join Session"** or access from your dashboard invitations
3. Enter the **Session ID**

**Guest Users:**
1. Click **"Guest Join Session"**
2. Enter the **Session ID** and your **email address**
3. Participate in voting (session creation not available)

### Voting Process

1. Review each Jira issue displayed in the session
2. Click on the story point value you think is appropriate (1, 2, 3, 5, 8, 13, 21, ?)
3. Change your vote anytime before the session is closed
4. View real-time voting results from all team members
5. Session creator can:
   - **Remove issues** from the session
   - **Close the session** when consensus is reached (automatically updates Jira)
   - **Delete the session** entirely

## 🔧 Configuration

### Jira API Token Setup

1. Log in to your Jira instance
2. Go to **Account Settings** → **Security** → **API tokens**
3. Create a new API token
4. Copy the token and use it in the application

### JQL Query Examples

```jql
# Basic project filter
project = MYPROJECT AND status = "To Do"

# Current user's assigned issues
assignee = currentUser() AND status != Done

# Multiple projects with high priority
project in (PROJ1, PROJ2) AND priority = High

# Recent issues in progress
created >= -1w AND status = "In Progress"

# Sprint planning
project = MYPROJECT AND fixVersion = "Sprint 1" AND status = "Ready for Development"
```

## 📊 User Dashboard & Account Management

The application includes a comprehensive user dashboard for registered users:

### Dashboard Features
- **Session Management**: View and manage all your created estimation sessions
- **Team Management**: Create and manage teams, invite members, view team sessions
- **API Key Management**: Generate, manage, and monitor API keys with different permission scopes
- **Jira Settings**: Save and manage your Jira connection settings for quick session creation
- **Session History**: Track your participation in estimation sessions
- **Invitation Management**: View and respond to session and team invitations

### Account Settings
- **Profile Management**: Update username, email, and password
- **Jira Integration**: Configure and test Jira API connections
- **Security Settings**: Manage active sessions and API key permissions
- **Team Memberships**: View teams you're a member of and manage your participation

### Guest User Features
While guest users have limited functionality, they can:
- Join estimation sessions using their email address
- Participate in voting on Jira issues
- View real-time voting results from other participants

## 🏗️ Architecture

### Tech Stack

**Backend**
- **Flask** - Lightweight Python web framework
- **SQLAlchemy** - Database ORM
- **SQLite** - Database for session and vote storage
- **Flask-CORS** - Cross-origin resource sharing
- **Requests** - Jira API integration

**Frontend**
- **React 18** - Modern UI library with hooks
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality component library
- **Lucide React** - Beautiful icon library

**Deployment**
- **Docker** - Containerization
- **Docker Compose** - Multi-container deployment
- **Gunicorn** - WSGI HTTP server for production

### API Endpoints

#### Authentication Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register a new user account |
| `POST` | `/api/auth/login` | User login |
| `POST` | `/api/auth/logout` | User logout |
| `GET` | `/api/auth/current-user` | Get current authenticated user |
| `GET` | `/api/auth/jira-settings` | Get user's saved Jira settings |
| `POST` | `/api/auth/jira-settings` | Save/update user's Jira settings |
| `DELETE` | `/api/auth/jira-settings` | Delete user's saved Jira settings |
| `GET` | `/api/auth/user-sessions` | Get user's created sessions |
| `POST` | `/api/auth/invite-to-session` | Send email invitation to session |
| `POST` | `/api/auth/invite-team-to-session` | Invite entire team to session |

#### Session Management Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/create-session` | Create a new estimation session |
| `GET` | `/api/session/{session_id}` | Get session details and votes |
| `POST` | `/api/vote` | Submit or update a vote |
| `POST` | `/api/close-session` | Close a voting session (creator only) |
| `DELETE` | `/api/delete-session` | Delete a session (creator only) |
| `DELETE` | `/api/remove-issue` | Remove an issue from session (creator only) |

#### Team Management Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/teams/my-teams` | Get user's teams (owned and member) |
| `GET` | `/api/teams/{team_id}` | Get team details and members |
| `POST` | `/api/teams/create` | Create a new team |
| `POST` | `/api/teams/{team_id}/add-member` | Add member to team |
| `DELETE` | `/api/teams/{team_id}/remove-member` | Remove member from team |
| `DELETE` | `/api/teams/{team_id}/delete` | Delete a team (creator only) |

#### API Key Management Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/api-keys/` | List user's API keys |
| `POST` | `/api/api-keys/` | Create a new API key |
| `DELETE` | `/api/api-keys/{key_id}` | Delete an API key |

#### API Key Authentication
All endpoints support API key authentication via headers:
- `X-API-Key: your_api_key_here`
- `Authorization: Bearer your_api_key_here`

API keys support scoped permissions:
- **read**: View sessions, votes, and user data
- **write**: Create sessions, submit votes, and modify user data
- **admin**: Full access to all operations

## 🛠️ Development

### Prerequisites

- Python 3.8+
- Node.js 16+
- Docker (optional)

### Local Development Setup

1. **Clone and navigate to the project**
   ```bash
   git clone https://github.com/Shock3udt/Jira-Estimator.git
   cd Jira-Estimator
   ```

2. **Backend development**
   ```bash
   # Install dependencies
   pip install -r requirements.txt

   # Run development server
   python main.py
   ```

3. **Frontend development**
   ```bash
   # Install dependencies
   npm install

   # Start development server
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

### Development Scripts

```bash
# Frontend linting
npm run lint

# Frontend preview build
npm run preview

# Backend with debug mode
python main.py  # (debug=True by default)
```

## 🐳 Deployment

### Docker Deployment

**🚀 Pre-built Image (Recommended)**

The easiest way to deploy is using our published Docker image from Docker Hub:

```bash
# Quick start with pre-built image
docker run -d \
  --name jira-estimation-app \
  -p 8080:5000 \
  -v ./database:/app/database \
  shock3udt/jira-estimation:latest

# Or with Docker Compose
docker compose up -d  # Uses shock3udt/jira-estimation:latest
```

**Available Image Tags:**
- `shock3udt/jira-estimation:latest` - Latest stable release
- `shock3udt/jira-estimation:main` - Latest from main branch
- `shock3udt/jira-estimation:v1.x.x` - Specific version tags

**🔧 Build from Source (Optional)**

If you need to customize the application:

```bash
# Clone and build
git clone https://github.com/Shock3udt/Jira-Estimator.git
cd Jira-Estimator
docker compose up --build -d
```

### Docker Management Commands

```bash
# Using pre-built image
docker compose up -d                    # Start with published image
docker compose logs -f                  # View logs
docker compose down                     # Stop application
docker pull shock3udt/jira-estimation:latest && docker compose up -d  # Update to latest

# Building from source
docker compose up --build -d           # Build and run from source
docker compose down                     # Stop application
docker compose up --build -d           # Rebuild after changes
```

See [DEPLOYMENT_README.md](./DEPLOYMENT_README.md) and [NGINX_DEPLOYMENT.md](./NGINX_DEPLOYMENT.md) for detailed deployment instructions.

### API Integration Examples

The application provides powerful API key authentication for automated integrations:

```bash
# Create a session via API
curl -X POST https://your-domain.com/api/create-session \
  -H "X-API-Key: your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "jira_url": "https://your-jira.com",
    "jira_token": "your_jira_token",
    "jira_query": "project = PROJ AND status = \"To Do\"",
    "use_saved_credentials": true
  }'

# Submit a vote via API
curl -X POST https://your-domain.com/api/vote \
  -H "X-API-Key: your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "session_uuid_here",
    "issue_key": "PROJ-123",
    "estimation": "5"
  }'

# Get session results via API
curl -X GET https://your-domain.com/api/session/session_uuid_here \
  -H "X-API-Key: your_api_key_here"
```

## 🔒 Security Considerations

- **User Authentication**: Secure password hashing with bcrypt
- **Session Management**: Server-side session storage with HTTP-only cookies
- **API Key Security**: SHA-256 hashed API keys with scoped permissions and usage logging
- **Jira Token Storage**: Encrypted storage of user Jira API tokens
- **Session Isolation**: Sessions are isolated by unique session IDs and user permissions
- **Input Validation**: Comprehensive validation and sanitization of all user inputs
- **Email Validation**: Proper email format validation for guest users and invitations
- **Team Security**: Team membership verification and creator-only management permissions
- **CORS Configuration**: Properly configured for secure frontend-backend communication
- **Production Ready**: All communication over HTTPS in production deployments
- **Guest Mode Security**: Email-based identification for non-registered participants
- **Permission Scoping**: Fine-grained permissions for API keys (read/write/admin)
- **Audit Trail**: API key usage logging for security monitoring

## 🌐 Browser Compatibility

- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## 📚 Documentation

- [Deployment Guide](./DEPLOYMENT_README.md)
- [NGINX Deployment Guide](./NGINX_DEPLOYMENT.md)
- [Email Configuration Guide](./EMAIL_CONFIGURATION.md)
- [Project Overview](./Jira%20Estimation%20Tool.md)
- [Contributing Guidelines](./CONTRIBUTING.md)
- [Changelog](./CHANGELOG.md)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](./CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🆘 Support

- 📖 Check our [documentation](#documentation)
- 🐛 [Report bugs](https://github.com/Shock3udt/Jira-Estimator/issues)
- 💡 [Request features](https://github.com/Shock3udt/Jira-Estimator/issues)
- 💬 Join our discussions

## 📊 Project Status

![GitHub issues](https://img.shields.io/github/issues/Shock3udt/Jira-Estimator)
![GitHub pull requests](https://img.shields.io/github/issues-pr/Shock3udt/Jira-Estimator)
![GitHub last commit](https://img.shields.io/github/last-commit/Shock3udt/Jira-Estimator)

---

<div align="center">
  <strong>Made with ❤️ for agile teams</strong>
</div>