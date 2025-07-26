# Changelog

All notable changes to the Jira Estimation Tool will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive project documentation
- Contributing guidelines
- Code of conduct
- Security policy
- Editor configuration

### Changed
- Improved README with detailed setup instructions
- Enhanced project structure documentation

### Security
- Added security policy and best practices documentation

## [1.0.0] - 2024-01-XX

### Added
- **Core Features**
  - Jira integration with API token authentication
  - JQL query support for issue filtering
  - Story point voting with Fibonacci sequence (1, 2, 3, 5, 8, 13, 21, ?)
  - Real-time collaborative voting sessions
  - Session management with unique session IDs

- **User Interface**
  - Modern responsive design with Tailwind CSS
  - shadcn/ui component library integration
  - Mobile-friendly interface
  - Intuitive session creation and joining flows

- **Backend Infrastructure**
  - Flask web framework with SQLAlchemy ORM
  - SQLite database for session and vote storage
  - RESTful API endpoints
  - CORS support for frontend-backend communication

- **Frontend Architecture**
  - React 18 with modern hooks
  - Vite build tool and development server
  - Component-based architecture
  - Real-time polling for vote updates

- **Deployment & DevOps**
  - Docker containerization
  - Docker Compose for easy deployment
  - Production-ready Gunicorn WSGI server
  - Automated deployment scripts

### API Endpoints
- `POST /api/create-session` - Create estimation sessions
- `GET /api/session/{session_id}` - Retrieve session details and votes
- `POST /api/vote` - Submit or update votes
- `POST /api/close-session` - Close voting sessions (creator only)

### Security
- Token-based Jira authentication
- Session isolation with unique identifiers
- Input validation and sanitization
- Secure CORS configuration

### Browser Support
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

---

## Version History Format

### Types of Changes
- `Added` for new features
- `Changed` for changes in existing functionality
- `Deprecated` for soon-to-be removed features
- `Removed` for now removed features
- `Fixed` for any bug fixes
- `Security` for vulnerability fixes

### Release Notes Template
```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- New feature descriptions

### Changed
- Changes to existing features

### Deprecated
- Features that will be removed in future versions

### Removed
- Features that have been removed

### Fixed
- Bug fix descriptions

### Security
- Security improvement descriptions
```

---

## Links
- [Unreleased]: Compare link to latest changes
- [1.0.0]: Compare link to version 1.0.0