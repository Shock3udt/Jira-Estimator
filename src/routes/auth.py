from flask import Blueprint, request, jsonify, session
from src.models.user import db, User
from src.models.session_invitation import SessionInvitation

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
        owned_sessions = [s.to_dict() for s in user.get_owned_sessions()]
        invited_sessions = [s.to_dict() for s in user.get_invited_sessions()]
        participated_sessions = [s.to_dict() for s in user.get_participated_sessions()]

        return jsonify({
            'owned_sessions': owned_sessions,
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

        return jsonify({
            'message': f'User {invitee_username} invited successfully',
            'invitation': invitation.to_dict()
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