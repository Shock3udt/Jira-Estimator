from flask import Blueprint, request, jsonify, session, current_app
from src.models.user import db, User
from src.models.session_invitation import SessionInvitation
from src.services.email_service import send_welcome_email, send_session_invitation_email

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        username = data.get('username', '').strip()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')

        # Validation
        if not username or not email or not password:
            return jsonify({'error': 'All fields are required'}), 400

        if len(username) < 3:
            return jsonify({'error': 'Username must be at least 3 characters long'}), 400

        if len(password) < 6:
            return jsonify({'error': 'Password must be at least 6 characters long'}), 400

        # Check if user already exists
        if User.query.filter_by(username=username).first():
            return jsonify({'error': 'Username already exists'}), 400

        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email already exists'}), 400

        # Create new user
        user = User(username=username, email=email)
        user.set_password(password)

        db.session.add(user)
        db.session.commit()

        # Log user in
        session['user_id'] = user.id
        session['username'] = user.username

        # Send welcome email (non-blocking)
        try:
            # Get mail instance from current app
            mail = current_app.extensions.get('mail')
            if mail:
                send_welcome_email(mail, user.email, user.username)
        except Exception as e:
            # Log error but don't fail registration
            current_app.logger.error(f"Failed to send welcome email to {user.email}: {str(e)}")

        return jsonify({
            'message': 'Registration successful',
            'user': user.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        username_or_email = data.get('username_or_email', '').strip()
        password = data.get('password', '')

        if not username_or_email or not password:
            return jsonify({'error': 'Username/email and password are required'}), 400

        # Find user by username or email
        user = User.query.filter(
            (User.username == username_or_email) |
            (User.email == username_or_email.lower())
        ).first()

        if not user or not user.check_password(password):
            return jsonify({'error': 'Invalid credentials'}), 401

        if not user.is_active:
            return jsonify({'error': 'Account is disabled'}), 401

        # Log user in
        session['user_id'] = user.id
        session['username'] = user.username

        return jsonify({
            'message': 'Login successful',
            'user': user.to_dict()
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': 'Logout successful'}), 200

@auth_bp.route('/current-user', methods=['GET'])
def current_user():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401

    user = User.query.get(user_id)
    if not user or not user.is_active:
        session.clear()
        return jsonify({'error': 'User not found or inactive'}), 401

    return jsonify({'user': user.to_dict()}), 200

@auth_bp.route('/user-sessions', methods=['GET'])
def user_sessions():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401

    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    try:
        # Import here to avoid circular import
        from src.models.voting_session import VotingSession, Vote

        # Get basic session data
        owned_sessions_data = []
        for session_obj in user.get_owned_sessions():
            session_dict = session_obj.to_dict()

            # Add voting statistics for owned sessions
            # Count total people who can vote (creator + invited users)
            total_invitations = SessionInvitation.query.filter_by(session_id=session_obj.session_id).count()
            total_invited = total_invitations + 1  # +1 for the creator

            # Count unique voters who have actually voted
            votes = Vote.query.filter_by(session_id=session_obj.session_id).all()
            unique_voters = set()
            for vote in votes:
                if vote.user_id:
                    # Authenticated voter
                    unique_voters.add(f"user_{vote.user_id}")
                elif vote.voter_name:
                    # Non-authenticated voter
                    unique_voters.add(f"name_{vote.voter_name}")

            voters_count = len(unique_voters)

            # Add voting statistics to session data
            session_dict['voting_stats'] = {
                'voters_count': voters_count,
                'total_invited': total_invited,
                'total_invitations': total_invitations
            }

            owned_sessions_data.append(session_dict)

        invited_sessions = [s.to_dict() for s in user.get_invited_sessions()]
        participated_sessions = [s.to_dict() for s in user.get_participated_sessions()]

        return jsonify({
            'owned_sessions': owned_sessions_data,
            'invited_sessions': invited_sessions,
            'participated_sessions': participated_sessions
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/invite-to-session', methods=['POST'])
def invite_to_session():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401

    try:
        data = request.get_json()
        session_id = data.get('session_id')
        invitee_username = data.get('username', '').strip()

        if not session_id or not invitee_username:
            return jsonify({'error': 'Session ID and username are required'}), 400

        # Import here to avoid circular import
        from src.models.voting_session import VotingSession

        # Check if session exists and user owns it
        voting_session = VotingSession.query.filter_by(session_id=session_id).first()
        if not voting_session:
            return jsonify({'error': 'Session not found'}), 404

        if voting_session.creator_id != user_id:
            return jsonify({'error': 'Only session creator can invite users'}), 403

        if voting_session.is_closed:
            return jsonify({'error': 'Cannot invite to closed session'}), 400

        # Find invitee
        invitee = User.query.filter_by(username=invitee_username).first()
        if not invitee:
            return jsonify({'error': 'User not found'}), 404

        # Check if already invited
        existing_invitation = SessionInvitation.query.filter_by(
            session_id=session_id,
            user_id=invitee.id
        ).first()

        if existing_invitation:
            return jsonify({'error': 'User already invited to this session'}), 400

        # Create invitation
        invitation = SessionInvitation(
            session_id=session_id,
            user_id=invitee.id,
            invited_by_id=user_id
        )

        db.session.add(invitation)
        db.session.commit()

        # Send invitation email (non-blocking)
        try:
            # Get mail instance from current app
            mail = current_app.extensions.get('mail')
            if mail:
                inviter = User.query.get(user_id)
                session_details = {
                    'jira_url': voting_session.jira_url,
                    'jira_query': voting_session.jira_query
                }
                send_session_invitation_email(
                    mail,
                    invitee.email,
                    invitee.username,
                    inviter.username,
                    session_id,
                    session_details
                )
        except Exception as e:
            # Log error but don't fail invitation
            current_app.logger.error(f"Failed to send invitation email to {invitee.email}: {str(e)}")

        return jsonify({
            'message': f'User {invitee_username} invited successfully',
            'invitation': invitation.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/invite-team-to-session', methods=['POST'])
def invite_team_to_session():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401

    try:
        data = request.get_json()
        session_id = data.get('session_id')
        team_id = data.get('team_id')

        if not session_id or not team_id:
            return jsonify({'error': 'Session ID and team ID are required'}), 400

        # Import here to avoid circular import
        from src.models.voting_session import VotingSession
        from src.models.team import Team

        # Check if session exists and user owns it
        voting_session = VotingSession.query.filter_by(session_id=session_id).first()
        if not voting_session:
            return jsonify({'error': 'Session not found'}), 404

        if voting_session.creator_id != user_id:
            return jsonify({'error': 'Only session creator can invite teams'}), 403

        if voting_session.is_closed:
            return jsonify({'error': 'Cannot invite to closed session'}), 400

        # Check if team exists and user has access
        team = Team.query.get(team_id)
        if not team or not team.is_active:
            return jsonify({'error': 'Team not found'}), 404

        # User must be either team creator or team member
        if team.creator_id != user_id and not team.is_member(user_id):
            return jsonify({'error': 'Access denied to this team'}), 403

        # Get all team members
        team_members = team.get_members()
        invited_count = 0
        already_invited_count = 0
        errors = []

        # Get inviter info for emails
        inviter = User.query.get(user_id)
        session_details = {
            'jira_url': voting_session.jira_url,
            'jira_query': voting_session.jira_query
        }

        for member in team_members:
            # Skip if member is already invited
            existing_invitation = SessionInvitation.query.filter_by(
                session_id=session_id,
                user_id=member.id
            ).first()

            if existing_invitation:
                already_invited_count += 1
                continue

            # Create invitation for this member
            try:
                invitation = SessionInvitation(
                    session_id=session_id,
                    user_id=member.id,
                    invited_by_id=user_id
                )
                db.session.add(invitation)
                invited_count += 1

                # Send invitation email (non-blocking)
                try:
                    mail = current_app.extensions.get('mail')
                    if mail:
                        send_session_invitation_email(
                            mail,
                            member.email,
                            member.username,
                            inviter.username,
                            session_id,
                            session_details
                        )
                except Exception as email_error:
                    current_app.logger.error(f"Failed to send invitation email to {member.email}: {str(email_error)}")

            except Exception as e:
                errors.append(f"Failed to invite {member.username}: {str(e)}")

        db.session.commit()

        return jsonify({
            'message': f'Team invitation completed',
            'team_name': team.name,
            'invited_count': invited_count,
            'already_invited_count': already_invited_count,
            'total_members': len(team_members),
            'errors': errors
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/respond-to-invitation', methods=['POST'])
def respond_to_invitation():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401

    try:
        data = request.get_json()
        invitation_id = data.get('invitation_id')
        response = data.get('response')  # 'accepted' or 'declined'

        if not invitation_id or response not in ['accepted', 'declined']:
            return jsonify({'error': 'Valid invitation ID and response are required'}), 400

        invitation = SessionInvitation.query.filter_by(
            id=invitation_id,
            user_id=user_id,
            status='pending'
        ).first()

        if not invitation:
            return jsonify({'error': 'Invitation not found or already responded'}), 404

        invitation.status = response
        invitation.responded_at = db.func.now()
        db.session.commit()

        return jsonify({
            'message': f'Invitation {response}',
            'invitation': invitation.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/jira-settings', methods=['GET'])
def get_jira_settings():
    """Get user's saved Jira settings"""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401

    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        return jsonify({
            'jira_url': user.jira_url,
            'has_jira_token': bool(user.jira_token_encrypted)
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/jira-settings', methods=['POST'])
def save_jira_settings():
    """Save user's Jira settings"""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401

    try:
        data = request.get_json()
        jira_url = data.get('jira_url', '').strip()
        jira_token = data.get('jira_token', '').strip()

        # Validate URL
        if jira_url and not jira_url.startswith(('http://', 'https://')):
            return jsonify({'error': 'Invalid Jira URL format'}), 400

        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Update Jira settings
        user.jira_url = jira_url if jira_url else None
        user.set_jira_token(jira_token if jira_token else None)

        db.session.commit()

        return jsonify({
            'message': 'Jira settings saved successfully',
            'jira_url': user.jira_url,
            'has_jira_token': bool(user.jira_token_encrypted)
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/jira-settings', methods=['DELETE'])
def clear_jira_settings():
    """Clear user's saved Jira settings"""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401

    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        user.clear_jira_settings()
        db.session.commit()

        return jsonify({
            'message': 'Jira settings cleared successfully'
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500