# Contributing to Jira Estimation Tool

Thank you for your interest in contributing to the Jira Estimation Tool! We welcome contributions from the community and are grateful for your help in making this project better.

## 🤝 How to Contribute

### Reporting Issues

Before creating a new issue, please:

1. **Search existing issues** to avoid duplicates
2. **Use the issue templates** when available
3. **Provide detailed information** including:
   - Steps to reproduce the issue
   - Expected vs actual behavior
   - Environment details (OS, browser, versions)
   - Screenshots or error messages if applicable

### Suggesting Features

We love feature suggestions! Please:

1. **Check existing feature requests** to avoid duplicates
2. **Use the feature request template**
3. **Explain the use case** and how it benefits users
4. **Consider the scope** - smaller, focused features are easier to implement

### Code Contributions

#### Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/jira-estimation-tool.git
   cd jira-estimation-tool
   ```
3. **Add the original repository as upstream**:
   ```bash
   git remote add upstream https://github.com/original-owner/jira-estimation-tool.git
   ```

#### Development Setup

1. **Backend setup**:
   ```bash
   # Create virtual environment
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate

   # Install dependencies
   pip install -r requirements.txt
   ```

2. **Frontend setup**:
   ```bash
   # Install Node.js dependencies
   npm install

   # Start development server
   npm run dev
   ```

3. **Start the backend**:
   ```bash
   python main.py
   ```

#### Making Changes

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

2. **Make your changes** following our coding standards
3. **Test your changes** thoroughly
4. **Commit your changes** with descriptive messages:
   ```bash
   git commit -m "feat: add real-time vote updates"
   # or
   git commit -m "fix: resolve session creation bug"
   ```

#### Commit Message Guidelines

We follow the [Conventional Commits](https://conventionalcommits.org/) specification:

- `feat:` - A new feature
- `fix:` - A bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Examples:
```
feat: add session timeout functionality
fix: resolve vote counting error
docs: update API documentation
style: format code with prettier
refactor: simplify session management logic
test: add unit tests for vote validation
chore: update dependencies
```

#### Submitting Changes

1. **Push your changes** to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create a Pull Request** on GitHub:
   - Use the provided PR template
   - Link to related issues
   - Provide a clear description of changes
   - Include screenshots for UI changes

3. **Respond to feedback** and make requested changes

## 📋 Development Guidelines

### Code Style

#### Python (Backend)
- Follow [PEP 8](https://pep8.org/) style guidelines
- Use type hints where appropriate
- Write docstrings for functions and classes
- Keep functions small and focused
- Use meaningful variable and function names

#### JavaScript/React (Frontend)
- Use functional components with hooks
- Follow React best practices
- Use camelCase for variables and functions
- Use PascalCase for components
- Keep components small and focused
- Use descriptive prop names

#### General Guidelines
- Write self-documenting code
- Add comments for complex logic
- Use consistent naming conventions
- Follow the existing code structure
- Don't commit commented-out code

### Testing

#### Backend Tests
```bash
# Run backend tests (when available)
python -m pytest tests/
```

#### Frontend Tests
```bash
# Run frontend tests
npm test

# Run linting
npm run lint
```

#### Manual Testing
- Test your changes in multiple browsers
- Test both mobile and desktop layouts
- Verify functionality with different Jira configurations
- Test edge cases and error scenarios

### Documentation

- Update relevant documentation for your changes
- Add inline code comments for complex logic
- Update API documentation if endpoints change
- Include examples in documentation

## 🏗️ Project Structure

```
├── src/                    # Frontend React application
│   ├── components/         # React components
│   ├── lib/               # Utility functions
│   └── main.jsx           # Application entry point
├── database/              # SQLite database files
├── main.py               # Flask application entry point
├── requirements.txt      # Python dependencies
├── package.json          # Node.js dependencies
├── docker-compose.yml    # Docker configuration
└── docs/                 # Documentation files
```

## 🚀 Release Process

### Version Numbering

We use [Semantic Versioning](https://semver.org/):
- `MAJOR.MINOR.PATCH` (e.g., 1.2.3)
- `MAJOR`: Breaking changes
- `MINOR`: New features (backward compatible)
- `PATCH`: Bug fixes (backward compatible)

### Release Checklist

1. Update version numbers
2. Update CHANGELOG.md
3. Test thoroughly
4. Create release notes
5. Tag the release
6. Deploy to production

## 📞 Getting Help

### Communication Channels

- **GitHub Issues**: For bug reports and feature requests
- **GitHub Discussions**: For questions and community discussions
- **Pull Request Comments**: For code-specific discussions

### Questions?

If you have questions about contributing:

1. Check existing documentation
2. Search closed issues and PRs
3. Create a new discussion thread
4. Be patient and respectful

## 🎯 Good First Issues

New contributors should look for issues labeled:
- `good first issue` - Easy issues for newcomers
- `help wanted` - Issues where we need community help
- `documentation` - Documentation improvements

## 🙏 Recognition

Contributors are recognized in:
- The project README
- Release notes for significant contributions
- GitHub contributor graphs

## 📜 Code of Conduct

Please note that this project is released with a [Code of Conduct](CODE_OF_CONDUCT.md). By participating in this project, you agree to abide by its terms.

## 📄 License

By contributing to this project, you agree that your contributions will be licensed under the same [MIT License](LICENSE) that covers the project.

---

Thank you for contributing to the Jira Estimation Tool! 🎉