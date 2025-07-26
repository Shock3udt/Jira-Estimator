from datetime import datetime
from src.models.user import db

class Team(db.Model):
    __tablename__ = 'teams'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    creator_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)

    # Relationships
    creator = db.relationship('User', foreign_keys=[creator_id], backref='created_teams')
    memberships = db.relationship('TeamMembership', backref='team', lazy='dynamic', cascade='all, delete-orphan')

    def get_members(self):
        """Get all active members of this team"""
        from src.models.user import User
        member_ids = [m.user_id for m in self.memberships.filter_by(is_active=True).all()]
        return User.query.filter(User.id.in_(member_ids)).all()

    def get_member_count(self):
        """Get count of active members"""
        return self.memberships.filter_by(is_active=True).count()

    def is_member(self, user_id):
        """Check if user is an active member of this team"""
        return self.memberships.filter_by(user_id=user_id, is_active=True).first() is not None

    def can_be_managed_by(self, user_id):
        """Check if user can manage this team (creator or admin)"""
        return self.creator_id == user_id

    def to_dict(self, include_members=False):
        result = {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'creator_id': self.creator_id,
            'creator_name': self.creator.username if self.creator else 'Unknown',
            'member_count': self.get_member_count(),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'is_active': self.is_active
        }

        if include_members:
            result['members'] = [member.to_dict() for member in self.get_members()]

        return result

class TeamMembership(db.Model):
    __tablename__ = 'team_memberships'

    id = db.Column(db.Integer, primary_key=True)
    team_id = db.Column(db.Integer, db.ForeignKey('teams.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    added_by_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    added_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)

    # Relationships
    user = db.relationship('User', foreign_keys=[user_id], backref='team_memberships')
    added_by = db.relationship('User', foreign_keys=[added_by_id])

    # Unique constraint to prevent duplicate memberships
    __table_args__ = (db.UniqueConstraint('team_id', 'user_id', name='unique_team_user'),)

    def to_dict(self):
        return {
            'id': self.id,
            'team_id': self.team_id,
            'user_id': self.user_id,
            'user_name': self.user.username if self.user else 'Unknown',
            'added_by_id': self.added_by_id,
            'added_by_name': self.added_by.username if self.added_by else 'Unknown',
            'added_at': self.added_at.isoformat() if self.added_at else None,
            'is_active': self.is_active
        }