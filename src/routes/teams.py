from flask import Blueprint, request, jsonify, session
from src.models.user import db, User
from src.models.team import Team, TeamMembership

teams_bp = Blueprint('teams', __name__)

@teams_bp.route('/create', methods=['POST'])
def create_team():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401

    try:
        data = request.get_json()
        name = data.get('name', '').strip()
        description = data.get('description', '').strip()

        if not name:
            return jsonify({'error': 'Team name is required'}), 400

        if len(name) < 3:
            return jsonify({'error': 'Team name must be at least 3 characters long'}), 400

        if len(name) > 100:
            return jsonify({'error': 'Team name must be less than 100 characters'}), 400

        # Check if user already has a team with this name
        existing_team = Team.query.filter_by(creator_id=user_id, name=name, is_active=True).first()
        if existing_team:
            return jsonify({'error': 'You already have a team with this name'}), 400

        # Create team
        team = Team(
            name=name,
            description=description,
            creator_id=user_id
        )

        db.session.add(team)
        db.session.flush()  # Get the team ID

        # Add creator as first member
        membership = TeamMembership(
            team_id=team.id,
            user_id=user_id,
            added_by_id=user_id
        )

        db.session.add(membership)
        db.session.commit()

        return jsonify({
            'message': 'Team created successfully',
            'team': team.to_dict(include_members=True)
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@teams_bp.route('/my-teams', methods=['GET'])
def get_my_teams():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401

    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        owned_teams = [team.to_dict() for team in user.get_owned_teams()]
        member_teams = [team.to_dict() for team in user.get_member_teams() if team.creator_id != user_id]

        return jsonify({
            'owned_teams': owned_teams,
            'member_teams': member_teams
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@teams_bp.route('/<int:team_id>', methods=['GET'])
def get_team(team_id):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401

    try:
        team = Team.query.get(team_id)
        if not team or not team.is_active:
            return jsonify({'error': 'Team not found'}), 404

        # Check if user has access to view this team
        if team.creator_id != user_id and not team.is_member(user_id):
            return jsonify({'error': 'Access denied'}), 403

        return jsonify({
            'team': team.to_dict(include_members=True)
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@teams_bp.route('/<int:team_id>/add-member', methods=['POST'])
def add_team_member(team_id):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401

    try:
        data = request.get_json()
        username = data.get('username', '').strip()

        if not username:
            return jsonify({'error': 'Username is required'}), 400

        team = Team.query.get(team_id)
        if not team or not team.is_active:
            return jsonify({'error': 'Team not found'}), 404

        # Check if user can manage this team
        if not team.can_be_managed_by(user_id):
            return jsonify({'error': 'Only team creators can add members'}), 403

        # Find the user to add
        user_to_add = User.query.filter_by(username=username, is_active=True).first()
        if not user_to_add:
            return jsonify({'error': 'User not found'}), 404

        # Check if user is already a member
        if team.is_member(user_to_add.id):
            return jsonify({'error': 'User is already a member of this team'}), 400

        # Create membership
        membership = TeamMembership(
            team_id=team.id,
            user_id=user_to_add.id,
            added_by_id=user_id
        )

        db.session.add(membership)
        db.session.commit()

        return jsonify({
            'message': f'User {username} added to team successfully',
            'membership': membership.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@teams_bp.route('/<int:team_id>/remove-member', methods=['POST'])
def remove_team_member(team_id):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401

    try:
        data = request.get_json()
        member_user_id = data.get('user_id')

        if not member_user_id:
            return jsonify({'error': 'User ID is required'}), 400

        team = Team.query.get(team_id)
        if not team or not team.is_active:
            return jsonify({'error': 'Team not found'}), 404

        # Check permissions - either team creator or the user removing themselves
        if not team.can_be_managed_by(user_id) and user_id != member_user_id:
            return jsonify({'error': 'Access denied'}), 403

        # Can't remove the team creator
        if member_user_id == team.creator_id:
            return jsonify({'error': 'Cannot remove team creator'}), 400

        # Find membership
        membership = TeamMembership.query.filter_by(
            team_id=team.id,
            user_id=member_user_id,
            is_active=True
        ).first()

        if not membership:
            return jsonify({'error': 'User is not a member of this team'}), 404

        # Deactivate membership
        membership.is_active = False
        db.session.commit()

        return jsonify({
            'message': 'Member removed successfully'
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@teams_bp.route('/<int:team_id>/update', methods=['PUT'])
def update_team(team_id):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401

    try:
        data = request.get_json()
        name = data.get('name', '').strip()
        description = data.get('description', '').strip()

        team = Team.query.get(team_id)
        if not team or not team.is_active:
            return jsonify({'error': 'Team not found'}), 404

        # Check permissions
        if not team.can_be_managed_by(user_id):
            return jsonify({'error': 'Only team creators can update team details'}), 403

        # Update fields if provided
        if name and name != team.name:
            if len(name) < 3:
                return jsonify({'error': 'Team name must be at least 3 characters long'}), 400
            if len(name) > 100:
                return jsonify({'error': 'Team name must be less than 100 characters'}), 400

            # Check for duplicate name
            existing_team = Team.query.filter_by(
                creator_id=user_id,
                name=name,
                is_active=True
            ).filter(Team.id != team_id).first()

            if existing_team:
                return jsonify({'error': 'You already have a team with this name'}), 400

            team.name = name

        if 'description' in data:  # Allow empty description
            team.description = description

        db.session.commit()

        return jsonify({
            'message': 'Team updated successfully',
            'team': team.to_dict(include_members=True)
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@teams_bp.route('/<int:team_id>/delete', methods=['DELETE'])
def delete_team(team_id):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401

    try:
        team = Team.query.get(team_id)
        if not team or not team.is_active:
            return jsonify({'error': 'Team not found'}), 404

        # Check permissions
        if not team.can_be_managed_by(user_id):
            return jsonify({'error': 'Only team creators can delete teams'}), 403

        # Soft delete - deactivate team and all memberships
        team.is_active = False
        TeamMembership.query.filter_by(team_id=team.id).update({'is_active': False})

        db.session.commit()

        return jsonify({
            'message': 'Team deleted successfully'
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500