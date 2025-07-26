import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory
from flask_cors import CORS

# Import database and models FIRST to ensure they're properly loaded
print("Importing User model...")
try:
    from src.models.user import db, User
    print(f"✅ User imported successfully")
    print(f"User class: {User}")
    print(f"User.__dict__: {User.__dict__}")
except Exception as e:
    print(f"❌ Error importing User: {e}")
    import traceback
    traceback.print_exc()

print("Importing other models...")
try:
    from src.models.session_invitation import SessionInvitation
    from src.models.voting_session import VotingSession, JiraIssue, Vote
    from src.models.team import Team, TeamMembership
    print("✅ Other models imported successfully")
except Exception as e:
    print(f"❌ Error importing other models: {e}")
    import traceback
    traceback.print_exc()

# Import routes
from src.routes.user import user_bp
from src.routes.jira import jira_bp
from src.routes.auth import auth_bp
from src.routes.teams import teams_bp

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

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'database', 'app.db')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize database with app
db.init_app(app)

# Create all tables within app context
with app.app_context():
    print("Creating database tables...")
    db.create_all()
    print("✅ Database tables created successfully!")

    # Verify User model is properly loaded
    print("\n=== User Model Debugging ===")
    try:
        print(f"User class: {User}")
        print(f"User.__name__: {User.__name__}")
        print(f"User.__module__: {User.__module__}")
        print(f"User.__bases__: {User.__bases__}")

        # Check User class methods
        user_methods = [attr for attr in dir(User) if not attr.startswith('_')]
        print(f"User class methods: {user_methods}")

        # Try to create a user instance
        test_user = User(username='test', email='test@example.com')
        print(f"Test user created: {test_user}")
        print(f"Test user methods: {[method for method in dir(test_user) if not method.startswith('_')]}")

        # Check specific methods
        print(f"Has set_password: {hasattr(test_user, 'set_password')}")
        print(f"Has check_password: {hasattr(test_user, 'check_password')}")
        print(f"Has to_dict: {hasattr(test_user, 'to_dict')}")

        # Check if methods exist in class
        print(f"set_password in User.__dict__: {'set_password' in User.__dict__}")
        print(f"check_password in User.__dict__: {'check_password' in User.__dict__}")

    except Exception as e:
        print(f"❌ Error with User model: {e}")
        import traceback
        traceback.print_exc()

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
    app.run(host='0.0.0.0', port=5000, debug=True)
