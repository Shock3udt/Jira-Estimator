from datetime import datetime
from src.models.user import db

class VotingSession(db.Model):
    __tablename__ = 'voting_session'

    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.String(36), unique=True, nullable=False)
    jira_url = db.Column(db.String(500), nullable=False)
    jira_token = db.Column(db.String(500), nullable=False)
    jira_query = db.Column(db.String(1000), nullable=False)

    # User-based creator (new system)
    creator_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)

    # Backward compatibility - keep creator_name for existing sessions
    creator_name = db.Column(db.String(100), nullable=True)

    # Voting mode: 'story_points' or 't_shirt_sizes'
    voting_mode = db.Column(db.String(20), default='story_points', nullable=False)

    is_closed = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    issues = db.relationship('JiraIssue', backref='session', lazy='dynamic', cascade='all, delete-orphan')
    votes = db.relationship('Vote', backref='session', lazy='dynamic', cascade='all, delete-orphan')

    def get_creator_name(self):
        """Get creator name - from User if available, fallback to creator_name field"""
        if self.creator_id and self.creator:
            return self.creator.username
        return self.creator_name or "Unknown"

    def can_be_closed_by_user(self, user_id=None, user_name=None):
        """Check if user can close this session"""
        if user_id and self.creator_id:
            return self.creator_id == user_id
        elif user_name and self.creator_name:
            return self.creator_name == user_name
        return False

    def can_be_managed_by_user(self, user_id=None, user_name=None):
        """Check if user can manage this session (delete, remove issues, etc.)"""
        if user_id and self.creator_id:
            return self.creator_id == user_id
        elif user_name and self.creator_name:
            return self.creator_name == user_name
        return False

    def delete_session(self):
        """Delete the session and all associated data"""
        # Delete all votes first
        Vote.query.filter_by(session_id=self.session_id).delete()
        # Delete all issues
        JiraIssue.query.filter_by(session_id=self.session_id).delete()
        # Delete the session itself
        db.session.delete(self)
        db.session.commit()

    def remove_issue(self, issue_key):
        """Remove a specific issue and all its votes from the session"""
        # Delete all votes for this issue
        Vote.query.filter_by(session_id=self.session_id, issue_key=issue_key).delete()
        # Delete the issue
        JiraIssue.query.filter_by(session_id=self.session_id, issue_key=issue_key).delete()
        db.session.commit()

    def to_dict(self):
        return {
            'id': self.id,
            'session_id': self.session_id,
            'jira_url': self.jira_url,
            'jira_query': self.jira_query,
            'creator_name': self.get_creator_name(),
            'creator_id': self.creator_id,
            'voting_mode': self.voting_mode,
            'is_closed': self.is_closed,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class JiraIssue(db.Model):
    __tablename__ = 'jira_issue'

    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.String(36), db.ForeignKey('voting_session.session_id'), nullable=False)
    issue_key = db.Column(db.String(50), nullable=False)
    issue_title = db.Column(db.String(500), nullable=False)
    issue_description = db.Column(db.Text)
    acceptance_criteria = db.Column(db.Text)  # Custom field customfield_12315940
    current_story_points = db.Column(db.Float, nullable=True)  # Current story points from Jira (customfield_12310243)
    issue_url = db.Column(db.String(500), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'session_id': self.session_id,
            'issue_key': self.issue_key,
            'issue_title': self.issue_title,
            'issue_description': self.issue_description,
            'acceptance_criteria': self.acceptance_criteria,
            'current_story_points': self.current_story_points,
            'issue_url': self.issue_url
        }

class Vote(db.Model):
    __tablename__ = 'vote'

    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.String(36), db.ForeignKey('voting_session.session_id'), nullable=False)
    issue_key = db.Column(db.String(50), nullable=False)

    # User-based voting (new system)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)

    # Backward compatibility - keep voter_name for existing votes
    voter_name = db.Column(db.String(100), nullable=True)

    estimation = db.Column(db.String(10), nullable=False)  # Story points like 1, 2, 3, 5, 8, 13, etc.
    voted_at = db.Column(db.DateTime, default=datetime.utcnow)

    def get_voter_name(self):
        """Get voter name - from User if available, fallback to voter_name field"""
        if self.user_id and self.user:
            return self.user.username
        return self.voter_name or "Anonymous"

    def to_dict(self):
        return {
            'id': self.id,
            'session_id': self.session_id,
            'issue_key': self.issue_key,
            'voter_name': self.get_voter_name(),
            'user_id': self.user_id,
            'estimation': self.estimation,
            'voted_at': self.voted_at.isoformat() if self.voted_at else None
        }