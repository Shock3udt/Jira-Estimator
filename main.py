import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_mail import Mail

# Import database and models
from src.models.user import db, User
from src.models.session_invitation import SessionInvitation
from src.models.voting_session import VotingSession, JiraIssue, Vote
from src.models.team import Team, TeamMembership
from src.models.api_key import ApiKey, ApiKeyUsage

# Import routes
from src.routes.user import user_bp
from jira import jira_bp  # Import from root level jira.py
from src.routes.auth import auth_bp
from src.routes.teams import teams_bp
from src.routes.api_keys import api_keys_bp

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
app.config['SECRET_KEY'] = 'asdf#FGSgvasgf$5$WGT'

# Session configuration for authentication
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['PERMANENT_SESSION_LIFETIME'] = 86400  # 24 hours

# Enable CORS for all routes
CORS(app, supports_credentials=True)

app.register_blueprint(user_bp, url_prefix='/api')
app.register_blueprint(jira_bp, url_prefix='/api')
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(teams_bp, url_prefix='/api/teams')
app.register_blueprint(api_keys_bp, url_prefix='/api/api-keys')

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'database', 'app.db')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Email configuration
app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER', 'localhost')
app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', 587))
app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS', 'true').lower() == 'true'
app.config['MAIL_USE_SSL'] = os.getenv('MAIL_USE_SSL', 'false').lower() == 'true'
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')

# Set MAIL_DEFAULT_SENDER with proper fallback
mail_sender = os.getenv('MAIL_SENDER') or os.getenv('MAIL_USERNAME')
if mail_sender:
    app.config['MAIL_DEFAULT_SENDER'] = mail_sender
    print(f"📧 Email sender configured: {mail_sender}")
else:
    print("⚠️  No email sender configured - emails will not be sent")

app.config['APP_BASE_URL'] = os.getenv('APP_BASE_URL', 'http://localhost:8080')

# Initialize database with app
db.init_app(app)

# Initialize Flask-Mail
mail = Mail(app)

# Create all tables within app context
with app.app_context():
    db.create_all()

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    static_folder_path = app.static_folder
    if static_folder_path is None:
            return "Static folder not configured", 404

    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    else:
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(static_folder_path, 'index.html')
        else:
            return "index.html not found", 404


if __name__ == '__main__':
    # Use debug mode only in development
    debug_mode = os.getenv('FLASK_DEBUG', 'false').lower() == 'true'
    app.run(host='0.0.0.0', port=5000, debug=debug_mode)
