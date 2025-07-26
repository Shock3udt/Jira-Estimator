# Jira Estimation Tool

A collaborative web application for estimating Jira issues using story points. Teams can create estimation sessions, connect to their self-hosted Jira instances, and vote on issues together.

## Live Application

🚀 **Deployed Application**: https://lnh8imcj988z.manus.space

## Features

- **Jira Integration**: Connect to your self-hosted Jira instance using API tokens
- **JQL Query Support**: Use JQL (Jira Query Language) to filter issues for estimation
- **Story Point Voting**: Vote using Fibonacci sequence (1, 2, 3, 5, 8, 13, 21, ?)
- **Real-time Collaboration**: See votes from team members in real-time
- **Session Management**: Creators can close voting sessions when consensus is reached
- **Responsive Design**: Works on desktop and mobile devices

## How to Use

### Creating a Session

1. Click **"Create Session"** on the home page
2. Fill in the required information:
   - **Jira URL**: Your self-hosted Jira instance URL (e.g., `https://your-company.atlassian.net`)
   - **Jira API Token**: Your personal API token for authentication
   - **JQL Query**: Query to filter issues (e.g., `project = PROJ AND status = 'To Do'`)
   - **Your Name**: Your name as the session creator
3. Click **"Create Session"** to start the estimation session
4. Share the generated Session ID with your team members

### Joining a Session

1. Click **"Join Session"** on the home page
2. Enter the Session ID provided by the session creator
3. Click **"Join Session"** to participate in voting

### Voting Process

1. Enter your name in the voter name field
2. For each Jira issue, click on the story point value you think is appropriate
3. You can change your vote at any time before the session is closed
4. View real-time voting results from all team members

### Closing a Session

Only the session creator can close a voting session:
1. Click the **"Close Session"** button in the session interface
2. Once closed, no new votes can be submitted
3. All voting results become visible to all participants

## Technical Architecture

### Backend (Flask)
- **Framework**: Flask with SQLAlchemy
- **Database**: SQLite for session and vote storage
- **Jira Integration**: REST API calls using bearer token authentication
- **CORS**: Enabled for frontend-backend communication

### Frontend (React)
- **Framework**: React with modern hooks
- **UI Components**: shadcn/ui component library
- **Styling**: Tailwind CSS
- **Icons**: Lucide React icons
- **Real-time Updates**: Polling every 5 seconds

### API Endpoints

- `POST /api/create-session` - Create a new estimation session
- `GET /api/session/{session_id}` - Get session details and votes
- `POST /api/vote` - Submit or update a vote
- `POST /api/close-session` - Close a voting session (creator only)

## Configuration Requirements

### Jira API Token Setup

1. Log in to your Jira instance
2. Go to Account Settings → Security → API tokens
3. Create a new API token
4. Use this token in the application

### JQL Query Examples

- `project = MYPROJECT AND status = "To Do"`
- `assignee = currentUser() AND status != Done`
- `project in (PROJ1, PROJ2) AND priority = High`
- `created >= -1w AND status = "In Progress"`

## Security Considerations

- API tokens are stored temporarily during session creation
- Sessions are isolated by unique session IDs
- No persistent user authentication required
- All communication over HTTPS in production

## Browser Compatibility

- Modern browsers with JavaScript enabled
- Chrome, Firefox, Safari, Edge (latest versions)
- Mobile browsers supported

## Support

For issues or questions about the application, please refer to the source code or contact the development team.

