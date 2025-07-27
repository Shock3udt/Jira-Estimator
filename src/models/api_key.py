from datetime import datetime, timedelta
import secrets
import hashlib
import base64
from flask_sqlalchemy import SQLAlchemy

# Import db from user model to use the same instance
from src.models.user import db

class ApiKey(db.Model):
    __tablename__ = 'api_keys'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    key_prefix = db.Column(db.String(10), nullable=False, index=True)  # First 8 chars for identification
    key_hash = db.Column(db.String(255), nullable=False)  # SHA-256 hash of the full key
    scopes = db.Column(db.Text, default='read')  # Comma-separated scopes: read, write, admin
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=True)  # Optional expiration
    last_used_at = db.Column(db.DateTime, nullable=True)

    # Relationships
    user = db.relationship('User', backref='api_keys')
    usage_logs = db.relationship('ApiKeyUsage', backref='api_key', lazy='dynamic', cascade='all, delete-orphan')

    @staticmethod
    def generate_api_key():
        """Generate a cryptographically secure API key"""
        # Generate 32 random bytes and encode as base64 (without padding)
        key_bytes = secrets.token_bytes(32)
        key_suffix = base64.urlsafe_b64encode(key_bytes).decode('utf-8').rstrip('=')

        # Create key with prefix
        full_key = f"jira_est_{key_suffix}"
        return full_key

    @staticmethod
    def hash_key(api_key):
        """Hash an API key using SHA-256"""
        return hashlib.sha256(api_key.encode('utf-8')).hexdigest()

    @classmethod
    def verify_key(cls, api_key):
        """Verify an API key and return the ApiKey instance if valid"""
        if not api_key or not api_key.startswith('jira_est_'):
            return None

        # Extract prefix (first 8 characters after the jira_est_ prefix)
        if len(api_key) < 18:  # jira_est_ (9) + at least 8 chars
            return None

        key_prefix = api_key[:17]  # jira_est_ + first 8 chars of suffix
        key_hash = cls.hash_key(api_key)

        # Find matching key in database
        api_key_obj = cls.query.filter_by(
            key_prefix=key_prefix,
            key_hash=key_hash,
            is_active=True
        ).first()

        if api_key_obj:
            # Check if key has expired
            if api_key_obj.expires_at and api_key_obj.expires_at < datetime.utcnow():
                return None

            # Update last used timestamp
            api_key_obj.last_used_at = datetime.utcnow()
            db.session.commit()

        return api_key_obj

    def has_scope(self, required_scope):
        """Check if the API key has the required scope"""
        if not self.scopes:
            return False

        user_scopes = [scope.strip() for scope in self.scopes.split(',')]

        # Admin scope grants all permissions
        if 'admin' in user_scopes:
            return True

        return required_scope in user_scopes

    def is_expired(self):
        """Check if the API key has expired"""
        if not self.expires_at:
            return False
        return self.expires_at < datetime.utcnow()

    def revoke(self):
        """Revoke (deactivate) the API key"""
        self.is_active = False
        db.session.commit()

    def to_dict(self, include_full_key=False):
        """Convert to dictionary for JSON serialization"""
        result = {
            'id': self.id,
            'name': self.name,
            'key_prefix': self.key_prefix,
            'scopes': self.scopes,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'last_used_at': self.last_used_at.isoformat() if self.last_used_at else None,
            'is_expired': self.is_expired()
        }

        # Only include full key when creating (for one-time display)
        if include_full_key and hasattr(self, '_full_key'):
            result['key'] = self._full_key

        return result

    def __repr__(self):
        return f'<ApiKey {self.name} ({self.key_prefix}...)>'


class ApiKeyUsage(db.Model):
    __tablename__ = 'api_key_usage'

    id = db.Column(db.Integer, primary_key=True)
    api_key_id = db.Column(db.Integer, db.ForeignKey('api_keys.id'), nullable=False)
    endpoint = db.Column(db.String(500), nullable=False)
    method = db.Column(db.String(10), nullable=False)
    status_code = db.Column(db.Integer, nullable=True)
    ip_address = db.Column(db.String(45), nullable=True)  # IPv6 compatible
    user_agent = db.Column(db.Text, nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    def to_dict(self):
        return {
            'id': self.id,
            'endpoint': self.endpoint,
            'method': self.method,
            'status_code': self.status_code,
            'ip_address': self.ip_address,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }

    def __repr__(self):
        return f'<ApiKeyUsage {self.method} {self.endpoint} ({self.timestamp})>'