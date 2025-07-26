from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import base64

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)

    # Jira settings
    jira_url = db.Column(db.String(500), nullable=True)
    jira_token_encrypted = db.Column(db.Text, nullable=True)  # Base64 encoded for basic obfuscation

    # Relationships
    owned_sessions = db.relationship('VotingSession', foreign_keys='VotingSession.creator_id', backref='creator', lazy='dynamic')
    votes = db.relationship('Vote', backref='user', lazy='dynamic')
    invitations = db.relationship('SessionInvitation', backref='user', lazy='dynamic')

    def set_password(self, password):
        """Set password hash"""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """Check if provided password matches hash"""
        return check_password_hash(self.password_hash, password)

    def get_owned_sessions(self):
        """Get sessions created by this user"""
        return self.owned_sessions.all()

    def get_invited_sessions(self):
        """Get open sessions user is invited to"""
        # Import here to avoid circular import
        from src.models.voting_session import VotingSession
        invited_session_ids = [inv.session_id for inv in self.invitations.filter_by(status='pending').all()]
        return VotingSession.query.filter(
            VotingSession.session_id.in_(invited_session_ids),
            VotingSession.is_closed == False
        ).all()

    def get_participated_sessions(self):
        """Get closed sessions where user participated"""
        # Import here to avoid circular import
        from src.models.voting_session import VotingSession
        # Get sessions where user voted
        voted_session_ids = [vote.session_id for vote in self.votes.all()]
        # Get sessions where user was invited and accepted
        invited_session_ids = [inv.session_id for inv in self.invitations.filter_by(status='accepted').all()]

        all_session_ids = list(set(voted_session_ids + invited_session_ids))

        return VotingSession.query.filter(
            VotingSession.session_id.in_(all_session_ids),
            VotingSession.is_closed == True
        ).all()

    def get_owned_teams(self):
        """Get teams created by this user"""
        # Import here to avoid circular import
        from src.models.team import Team
        return Team.query.filter_by(creator_id=self.id, is_active=True).all()

    def get_member_teams(self):
        """Get teams where user is a member"""
        # Import here to avoid circular import
        from src.models.team import Team, TeamMembership
        team_ids = [m.team_id for m in self.team_memberships if m.is_active]
        return Team.query.filter(Team.id.in_(team_ids), Team.is_active == True).all()

        def get_all_teams(self):
        """Get all teams (owned + member of)"""
        owned_teams = self.get_owned_teams()
        member_teams = self.get_member_teams()

        # Combine and deduplicate
        all_teams = {}
        for team in owned_teams + member_teams:
            all_teams[team.id] = team

        return list(all_teams.values())

    def set_jira_token(self, token):
        """Set encrypted Jira token (base64 encoded for basic obfuscation)"""
        if token:
            # Simple base64 encoding - not cryptographically secure but better than plain text
            encoded_token = base64.b64encode(token.encode('utf-8')).decode('utf-8')
            self.jira_token_encrypted = encoded_token
        else:
            self.jira_token_encrypted = None

    def get_jira_token(self):
        """Get decrypted Jira token"""
        if self.jira_token_encrypted:
            try:
                return base64.b64decode(self.jira_token_encrypted.encode('utf-8')).decode('utf-8')
            except Exception:
                return None
        return None

    def has_jira_settings(self):
        """Check if user has saved Jira settings"""
        return bool(self.jira_url and self.jira_token_encrypted)

    def clear_jira_settings(self):
        """Clear saved Jira settings"""
        self.jira_url = None
        self.jira_token_encrypted = None

    def __repr__(self):
        return f'<User {self.username}>'

    def to_dict(self, include_jira_settings=False):
        result = {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'is_active': self.is_active,
            'has_jira_settings': self.has_jira_settings()
        }

        if include_jira_settings:
            result['jira_url'] = self.jira_url
            # Never include the actual token in the response for security
            result['has_jira_token'] = bool(self.jira_token_encrypted)

        return result