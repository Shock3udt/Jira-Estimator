from flask_mail import Message
from flask import current_app
from datetime import datetime
import os

def send_email(mail, subject, recipients, html_body, text_body=None):
    """Send an email using Flask-Mail"""
    try:
        # Get sender from config with fallback
        sender = current_app.config.get('MAIL_DEFAULT_SENDER') or current_app.config.get('MAIL_USERNAME')
        if not sender:
            current_app.logger.error("No sender configured - MAIL_DEFAULT_SENDER or MAIL_USERNAME required")
            return False

        # Validate that sender is not the same as recipient
        if isinstance(recipients, list) and len(recipients) > 0:
            if sender == recipients[0]:
                current_app.logger.error(f"Sender and recipient are the same: {sender}")
                return False

        msg = Message(
            subject=subject,
            sender=sender,
            recipients=recipients
        )
        msg.html = html_body
        if text_body:
            msg.body = text_body

        current_app.logger.info(f"Sending email from {sender} to {recipients} with subject: {subject}")
        mail.send(msg)
        return True
    except Exception as e:
        current_app.logger.error(f"Failed to send email: {str(e)}")
        return False

def get_email_template_base():
    """Get the base HTML template for emails"""
    return """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{title}</title>
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                background-color: #f8fafc;
                margin: 0;
                padding: 0;
            }}
            .container {{
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 8px;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                overflow: hidden;
            }}
            .header {{
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 32px 24px;
                text-align: center;
            }}
            .header h1 {{
                margin: 0;
                font-size: 28px;
                font-weight: 600;
            }}
            .header p {{
                margin: 8px 0 0 0;
                opacity: 0.9;
                font-size: 16px;
            }}
            .content {{
                padding: 32px 24px;
            }}
            .content h2 {{
                color: #1f2937;
                font-size: 24px;
                font-weight: 600;
                margin: 0 0 16px 0;
            }}
            .content h3 {{
                color: #374151;
                font-size: 18px;
                font-weight: 600;
                margin: 24px 0 8px 0;
            }}
            .content p {{
                color: #6b7280;
                margin: 16px 0;
                font-size: 16px;
            }}
            .button {{
                display: inline-block;
                padding: 12px 24px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white !important;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
                margin: 16px 0;
                transition: transform 0.2s;
            }}
            .button:hover {{
                transform: translateY(-1px);
            }}
            .info-box {{
                background-color: #f3f4f6;
                border-left: 4px solid #667eea;
                padding: 16px;
                margin: 24px 0;
                border-radius: 0 6px 6px 0;
            }}
            .info-box h4 {{
                margin: 0 0 8px 0;
                color: #1f2937;
                font-size: 16px;
                font-weight: 600;
            }}
            .info-box p {{
                margin: 0;
                color: #6b7280;
                font-size: 14px;
            }}
            .footer {{
                background-color: #f9fafb;
                padding: 24px;
                text-align: center;
                border-top: 1px solid #e5e7eb;
            }}
            .footer p {{
                margin: 0;
                color: #9ca3af;
                font-size: 14px;
            }}
            .footer a {{
                color: #667eea;
                text-decoration: none;
            }}
            .session-details {{
                background-color: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
            }}
            .session-details h4 {{
                margin: 0 0 12px 0;
                color: #1e293b;
                font-size: 16px;
                font-weight: 600;
            }}
            .session-details .detail-row {{
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 0;
                border-bottom: 1px solid #e2e8f0;
            }}
            .session-details .detail-row:last-child {{
                border-bottom: none;
            }}
            .session-details .detail-label {{
                font-weight: 500;
                color: #475569;
            }}
            .session-details .detail-value {{
                color: #1e293b;
                font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
                background-color: #f1f5f9;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 14px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎯 Jira Estimation Tool</h1>
                <p>Collaborative Story Point Estimation</p>
            </div>
            <div class="content">
                {content}
            </div>
            <div class="footer">
                <p>© 2024 Jira Estimation Tool. This email was sent automatically.</p>
                <p><a href="{base_url}">Visit Application</a></p>
            </div>
        </div>
    </body>
    </html>
    """

def send_welcome_email(mail, user_email, username):
    """Send welcome email to newly registered user"""
    base_url = current_app.config.get('APP_BASE_URL', 'http://localhost:8080')

    content = f"""
        <h2>Welcome to Jira Estimation Tool! 🎉</h2>
        <p>Hi <strong>{username}</strong>,</p>
        <p>Thank you for joining the Jira Estimation Tool! You're now ready to start collaborating with your team on story point estimation.</p>

        <div class="info-box">
            <h4>🚀 What's Next?</h4>
            <p>Here are some things you can do to get started:</p>
        </div>

        <h3>✨ Key Features Available to You:</h3>
        <p><strong>📊 Create Estimation Sessions:</strong> Set up voting sessions for your Jira issues using JQL queries</p>
        <p><strong>👥 Team Management:</strong> Create teams and invite members for organized collaboration</p>
        <p><strong>🔑 API Integration:</strong> Generate API keys for automated workflows and integrations</p>
        <p><strong>⚙️ Jira Settings:</strong> Save your Jira credentials for quick session creation</p>

        <div class="session-details">
            <h4>💡 Getting Started Tips</h4>
            <div class="detail-row">
                <span class="detail-label">Configure Jira Settings</span>
                <span class="detail-value">Save your Jira URL and API token</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Create Your First Session</span>
                <span class="detail-value">Use JQL to filter issues for estimation</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Invite Team Members</span>
                <span class="detail-value">Collaborate on story point voting</span>
            </div>
        </div>

        <p style="text-align: center; margin: 32px 0;">
            <a href="{base_url}" class="button">Start Using Jira Estimation Tool</a>
        </p>

        <p>If you have any questions or need help getting started, feel free to explore the application or reach out to your team administrator.</p>
        <p>Happy estimating! 🎯</p>
    """

    html_body = get_email_template_base().format(
        title="Welcome to Jira Estimation Tool",
        content=content,
        base_url=base_url
    )

    text_body = f"""
    Welcome to Jira Estimation Tool!

    Hi {username},

    Thank you for joining the Jira Estimation Tool! You're now ready to start collaborating with your team on story point estimation.

    Key Features Available:
    - Create Estimation Sessions with JQL queries
    - Team Management and collaboration
    - API Integration capabilities
    - Jira Settings management

    Visit the application: {base_url}

    Happy estimating!
    """

    return send_email(
        mail=mail,
        subject="Welcome to Jira Estimation Tool! 🎯",
        recipients=[user_email],
        html_body=html_body,
        text_body=text_body
    )

def send_session_invitation_email(mail, invitee_email, invitee_username, inviter_username, session_id, session_details):
    """Send session invitation email"""
    base_url = current_app.config.get('APP_BASE_URL', 'http://localhost:8080')
    session_url = f"{base_url}/join/{session_id}"

    content = f"""
        <h2>You're Invited to Join an Estimation Session! 🎯</h2>
        <p>Hi <strong>{invitee_username}</strong>,</p>
        <p><strong>{inviter_username}</strong> has invited you to participate in a Jira estimation session.</p>

        <div class="session-details">
            <h4>📋 Session Details</h4>
            <div class="detail-row">
                <span class="detail-label">Session ID</span>
                <span class="detail-value">{session_id}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Jira Project</span>
                <span class="detail-value">{session_details.get('jira_url', 'N/A')}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Query</span>
                <span class="detail-value">{session_details.get('jira_query', 'N/A')}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Created By</span>
                <span class="detail-value">{inviter_username}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Created</span>
                <span class="detail-value">{datetime.now().strftime('%B %d, %Y at %H:%M')}</span>
            </div>
        </div>

        <div class="info-box">
            <h4>🗳️ How Voting Works</h4>
            <p>You'll vote on story points using the Fibonacci sequence: 1, 2, 3, 5, 8, 13, 21, or ? for unclear requirements. Your votes help the team reach consensus on effort estimation.</p>
        </div>

        <p style="text-align: center; margin: 32px 0;">
            <a href="{session_url}" class="button">Join Estimation Session</a>
        </p>

        <p><strong>Alternative Access:</strong> You can also join by logging into the application and using session ID: <code>{session_id}</code></p>

        <p>The session will remain open until the creator closes it or all issues are estimated. Don't worry - you can change your votes at any time before the session is closed.</p>

        <p>Ready to help estimate some story points? 🚀</p>
    """

    html_body = get_email_template_base().format(
        title="Session Invitation - Jira Estimation Tool",
        content=content,
        base_url=base_url
    )

    text_body = f"""
    You're Invited to Join an Estimation Session!

    Hi {invitee_username},

    {inviter_username} has invited you to participate in a Jira estimation session.

    Session Details:
    - Session ID: {session_id}
    - Jira Project: {session_details.get('jira_url', 'N/A')}
    - Query: {session_details.get('jira_query', 'N/A')}
    - Created By: {inviter_username}

    Join the session: {session_url}

    You can vote on story points using the Fibonacci sequence and help the team reach consensus on effort estimation.

    Happy estimating!
    """

    return send_email(
        mail=mail,
        subject=f"🎯 Estimation Session Invitation from {inviter_username}",
        recipients=[invitee_email],
        html_body=html_body,
        text_body=text_body
    )

def send_first_vote_notification_email(mail, creator_email, creator_username, voter_name, session_id, issue_key, estimation, session_details):
    """Send notification to session creator when someone votes for the first time"""
    base_url = current_app.config.get('APP_BASE_URL', 'http://localhost:8080')
    session_url = f"{base_url}/join/{session_id}"

    content = f"""
        <h2>New Vote in Your Estimation Session! 🗳️</h2>
        <p>Hi <strong>{creator_username}</strong>,</p>
        <p>Great news! <strong>{voter_name}</strong> just cast their first vote in your estimation session.</p>

        <div class="info-box">
            <h4>📊 Vote Details</h4>
            <p><strong>{voter_name}</strong> voted <strong>{estimation}</strong> story points for issue <strong>{issue_key}</strong></p>
        </div>

        <div class="session-details">
            <h4>📋 Session Information</h4>
            <div class="detail-row">
                <span class="detail-label">Session ID</span>
                <span class="detail-value">{session_id}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Issue</span>
                <span class="detail-value">{issue_key}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Voter</span>
                <span class="detail-value">{voter_name}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Estimation</span>
                <span class="detail-value">{estimation} points</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Time</span>
                <span class="detail-value">{datetime.now().strftime('%B %d, %Y at %H:%M')}</span>
            </div>
        </div>

        <p>This is {voter_name}'s first vote in this session, so we wanted to let you know that the estimation process is underway!</p>

        <p style="text-align: center; margin: 32px 0;">
            <a href="{session_url}" class="button">View Session Progress</a>
        </p>

        <div class="info-box">
            <h4>🎯 Session Management</h4>
            <p>As the session creator, you can monitor voting progress, remove issues if needed, and close the session when consensus is reached. All story points will be automatically updated in Jira when you close the session.</p>
        </div>

        <p>Keep the momentum going! 🚀</p>
    """

    html_body = get_email_template_base().format(
        title="New Vote Notification - Jira Estimation Tool",
        content=content,
        base_url=base_url
    )

    text_body = f"""
    New Vote in Your Estimation Session!

    Hi {creator_username},

    {voter_name} just cast their first vote in your estimation session.

    Vote Details:
    - Session ID: {session_id}
    - Issue: {issue_key}
    - Voter: {voter_name}
    - Estimation: {estimation} points
    - Time: {datetime.now().strftime('%B %d, %Y at %H:%M')}

    View session progress: {session_url}

    This is {voter_name}'s first vote in this session. Keep the momentum going!
    """

    return send_email(
        mail=mail,
        subject=f"🗳️ New Vote from {voter_name} in Session {session_id}",
        recipients=[creator_email],
        html_body=html_body,
        text_body=text_body
    )