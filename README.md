# Jira Estimation Tool

<div align="center">

![Jira Estimation Tool](https://img.shields.io/badge/Jira-Estimation%20Tool-blue?style=for-the-badge&logo=jira)
![Python](https://img.shields.io/badge/Python-3.8+-blue?style=for-the-badge&logo=python)
![React](https://img.shields.io/badge/React-18+-blue?style=for-the-badge&logo=react)
![Flask](https://img.shields.io/badge/Flask-2.3+-green?style=for-the-badge&logo=flask)
![Docker](https://img.shields.io/badge/Docker-Ready-blue?style=for-the-badge&logo=docker)

**A collaborative web application for agile story point estimation with Jira integration**

[🚀 Live Demo](https://lnh8imcj988z.manus.space) • [📖 Documentation](#documentation) • [🐛 Report Bug](../../issues) • [✨ Request Feature](../../issues)

</div>

## ✨ Features

- 🔗 **Jira Integration** - Connect to self-hosted Jira instances with API token authentication
- 🔍 **JQL Query Support** - Use powerful JQL queries to filter and select issues for estimation
- 🎯 **Story Point Voting** - Vote using Fibonacci sequence (1, 2, 3, 5, 8, 13, 21, ?)
- ⚡ **Real-time Collaboration** - See team member votes as they happen
- 👥 **Session Management** - Create and join estimation sessions with unique session IDs
- 🎨 **Modern UI** - Responsive design with Tailwind CSS and shadcn/ui components
- 🔒 **Secure** - Token-based authentication with session isolation
- 📱 **Mobile-Friendly** - Works seamlessly on desktop and mobile devices
- 🐳 **Docker Ready** - Easy deployment with Docker and Docker Compose

## 🚀 Quick Start

### Using Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd "Jira Estimation Webpage with Token Authentication and Voting"
   ```

2. **Run with Docker**
   ```bash
   chmod +x docker-deploy.sh
   ./docker-deploy.sh
   ```

3. **Access the application**
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

### Creating an Estimation Session

1. Click **"Create Session"** on the home page
2. Fill in the required information:
   - **Jira URL**: Your Jira instance URL (e.g., `https://your-company.atlassian.net`)
   - **Jira API Token**: Your personal API token for authentication
   - **JQL Query**: Query to filter issues (e.g., `project = PROJ AND status = 'To Do'`)
   - **Your Name**: Your name as the session creator
3. Click **"Create Session"** to start the estimation session
4. Share the generated **Session ID** with your team members

### Joining a Session

1. Click **"Join Session"** on the home page
2. Enter the **Session ID** provided by the session creator
3. Enter your name
4. Click **"Join Session"** to participate in voting

### Voting Process

1. Review each Jira issue displayed in the session
2. Click on the story point value you think is appropriate (1, 2, 3, 5, 8, 13, 21, ?)
3. Change your vote anytime before the session is closed
4. View real-time voting results from all team members
5. Session creator can **close the session** when consensus is reached

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

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/create-session` | Create a new estimation session |
| `GET` | `/api/session/{session_id}` | Get session details and votes |
| `POST` | `/api/vote` | Submit or update a vote |
| `POST` | `/api/close-session` | Close a voting session (creator only) |

## 🛠️ Development

### Prerequisites

- Python 3.8+
- Node.js 16+
- Docker (optional)

### Local Development Setup

1. **Clone and navigate to the project**
   ```bash
   git clone <repository-url>
   cd "Jira Estimation Webpage with Token Authentication and Voting"
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

See [DEPLOYMENT_README.md](./DEPLOYMENT_README.md) and [DOCKER_DEPLOYMENT_README.md](./DOCKER_DEPLOYMENT_README.md) for detailed deployment instructions.

### Quick Docker Commands

```bash
# Build and run
docker compose up --build -d

# View logs
docker compose logs -f

# Stop application
docker compose down

# Rebuild after changes
docker compose up --build -d
```

## 🔒 Security Considerations

- API tokens are stored temporarily during session creation
- Sessions are isolated by unique session IDs
- No persistent user authentication required
- All communication over HTTPS in production
- Input validation and sanitization implemented
- CORS properly configured for frontend-backend communication

## 🌐 Browser Compatibility

- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## 📚 Documentation

- [Deployment Guide](./DEPLOYMENT_README.md)
- [Docker Deployment Guide](./DOCKER_DEPLOYMENT_README.md)
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
- 🐛 [Report bugs](../../issues)
- 💡 [Request features](../../issues)
- 💬 Join our discussions

## 📊 Project Status

![GitHub issues](https://img.shields.io/github/issues/username/repo)
![GitHub pull requests](https://img.shields.io/github/issues-pr/username/repo)
![GitHub last commit](https://img.shields.io/github/last-commit/username/repo)

---

<div align="center">
  <strong>Made with ❤️ for agile teams</strong>
</div>