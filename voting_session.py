from datetime import datetime
from src.models.user import db

class VotingSession(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.String(36), unique=True, nullable=False)
    jira_url = db.Column(db.String(500), nullable=False)
    jira_token = db.Column(db.String(500), nullable=False)
    jira_query = db.Column(db.String(1000), nullable=False)
    creator_name = db.Column(db.String(100), nullable=False)
    is_closed = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'session_id': self.session_id,
            'jira_url': self.jira_url,
            'jira_query': self.jira_query,
            'creator_name': self.creator_name,
            'is_closed': self.is_closed,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class JiraIssue(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.String(36), db.ForeignKey('voting_session.session_id'), nullable=False)
    issue_key = db.Column(db.String(50), nullable=False)
    issue_title = db.Column(db.String(500), nullable=False)
    issue_description = db.Column(db.Text)
    issue_url = db.Column(db.String(500), nullable=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'session_id': self.session_id,
            'issue_key': self.issue_key,
            'issue_title': self.issue_title,
            'issue_description': self.issue_description,
            'issue_url': self.issue_url
        }

class Vote(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.String(36), db.ForeignKey('voting_session.session_id'), nullable=False)
    issue_key = db.Column(db.String(50), nullable=False)
    voter_name = db.Column(db.String(100), nullable=False)
    estimation = db.Column(db.String(10), nullable=False)  # Story points like 1, 2, 3, 5, 8, 13, etc.
    voted_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'session_id': self.session_id,
            'issue_key': self.issue_key,
            'voter_name': self.voter_name,
            'estimation': self.estimation,
            'voted_at': self.voted_at.isoformat() if self.voted_at else None
        }

