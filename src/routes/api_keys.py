from flask import Blueprint, request, jsonify, session
from datetime import datetime, timedelta
from src.models.user import db, User
from src.models.api_key import ApiKey, ApiKeyUsage
import functools

api_keys_bp = Blueprint('api_keys', __name__)

def login_required(f):
    """Decorator to require authentication for API key management endpoints"""
    @functools.wraps(f)
    def decorated_function(*args, **kwargs):
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'error': 'Authentication required'}), 401

        user = User.query.get(user_id)
        if not user or not user.is_active:
            return jsonify({'error': 'User not found or inactive'}), 401

        return f(user, *args, **kwargs)
    return decorated_function

def api_key_auth_required(scopes=None):
    """Decorator to require API key authentication with optional scope checking"""
    def decorator(f):
        @functools.wraps(f)
        def decorated_function(*args, **kwargs):
            # Check for API key in headers
            api_key = request.headers.get('X-API-Key') or request.headers.get('Authorization', '').replace('Bearer ', '')

            if not api_key:
                return jsonify({'error': 'API key required'}), 401

            # Verify API key
            api_key_obj = ApiKey.verify_key(api_key)
            if not api_key_obj:
                return jsonify({'error': 'Invalid or expired API key'}), 401

            # Check scopes if specified
            if scopes:
                required_scopes = scopes if isinstance(scopes, list) else [scopes]
                if not any(api_key_obj.has_scope(scope) for scope in required_scopes):
                    return jsonify({'error': f'Insufficient permissions. Required scopes: {", ".join(required_scopes)}'}), 403

            # Log API key usage
            try:
                usage_log = ApiKeyUsage(
                    api_key_id=api_key_obj.id,
                    endpoint=request.endpoint or request.path,
                    method=request.method,
                    ip_address=request.remote_addr,
                    user_agent=request.headers.get('User-Agent', '')
                )
                db.session.add(usage_log)
                db.session.commit()
            except Exception as e:
                # Don't fail the request if logging fails
                print(f"Failed to log API key usage: {e}")

            # Add API key info to request context
            request.api_key = api_key_obj
            request.api_key_user = api_key_obj.user

            return f(*args, **kwargs)
        return decorated_function
    return decorator

@api_keys_bp.route('/', methods=['GET'])
@login_required
def list_api_keys(user):
    """List all API keys for the authenticated user"""
    try:
        api_keys = ApiKey.query.filter_by(user_id=user.id).order_by(ApiKey.created_at.desc()).all()

        return jsonify({
            'api_keys': [key.to_dict() for key in api_keys]
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_keys_bp.route('/', methods=['POST'])
@login_required
def create_api_key(user):
    """Create a new API key for the authenticated user"""
    try:
        data = request.get_json()
        name = data.get('name', '').strip()
        scopes = data.get('scopes', 'read').strip()
        expires_in_days = data.get('expires_in_days')

        # Validation
        if not name:
            return jsonify({'error': 'API key name is required'}), 400

        if len(name) > 100:
            return jsonify({'error': 'API key name must be 100 characters or less'}), 400

        # Validate scopes
        valid_scopes = ['read', 'write', 'admin']
        scope_list = [scope.strip() for scope in scopes.split(',') if scope.strip()]

        if not scope_list:
            scope_list = ['read']

        for scope in scope_list:
            if scope not in valid_scopes:
                return jsonify({'error': f'Invalid scope: {scope}. Valid scopes are: {", ".join(valid_scopes)}'}), 400

        # Check if user already has an API key with this name
        existing_key = ApiKey.query.filter_by(user_id=user.id, name=name).first()
        if existing_key:
            return jsonify({'error': 'An API key with this name already exists'}), 400

        # Generate API key
        full_key = ApiKey.generate_api_key()
        key_prefix = full_key[:17]  # jira_est_ + first 8 chars
        key_hash = ApiKey.hash_key(full_key)

        # Calculate expiration
        expires_at = None
        if expires_in_days:
            try:
                expires_in_days = int(expires_in_days)
                if expires_in_days <= 0:
                    return jsonify({'error': 'Expiration days must be positive'}), 400
                if expires_in_days > 365:
                    return jsonify({'error': 'Maximum expiration is 365 days'}), 400
                expires_at = datetime.utcnow() + timedelta(days=expires_in_days)
            except ValueError:
                return jsonify({'error': 'Invalid expiration days'}), 400

        # Create API key
        api_key = ApiKey(
            user_id=user.id,
            name=name,
            key_prefix=key_prefix,
            key_hash=key_hash,
            scopes=','.join(scope_list),
            expires_at=expires_at
        )

        # Store full key temporarily for response
        api_key._full_key = full_key

        db.session.add(api_key)
        db.session.commit()

        return jsonify({
            'message': 'API key created successfully',
            'api_key': api_key.to_dict(include_full_key=True),
            'warning': 'This is the only time you will see the full API key. Store it safely!'
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@api_keys_bp.route('/<int:key_id>', methods=['DELETE'])
@login_required
def delete_api_key(user, key_id):
    """Delete (revoke) an API key"""
    try:
        api_key = ApiKey.query.filter_by(id=key_id, user_id=user.id).first()

        if not api_key:
            return jsonify({'error': 'API key not found'}), 404

        # Delete the API key and its usage logs
        db.session.delete(api_key)
        db.session.commit()

        return jsonify({'message': 'API key deleted successfully'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@api_keys_bp.route('/<int:key_id>/revoke', methods=['POST'])
@login_required
def revoke_api_key(user, key_id):
    """Revoke (deactivate) an API key without deleting it"""
    try:
        api_key = ApiKey.query.filter_by(id=key_id, user_id=user.id).first()

        if not api_key:
            return jsonify({'error': 'API key not found'}), 404

        if not api_key.is_active:
            return jsonify({'error': 'API key is already revoked'}), 400

        api_key.revoke()

        return jsonify({'message': 'API key revoked successfully'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@api_keys_bp.route('/<int:key_id>/usage', methods=['GET'])
@login_required
def get_api_key_usage(user, key_id):
    """Get usage logs for an API key"""
    try:
        api_key = ApiKey.query.filter_by(id=key_id, user_id=user.id).first()

        if not api_key:
            return jsonify({'error': 'API key not found'}), 404

        # Get pagination parameters
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 50, type=int), 100)  # Max 100 per page

        # Get usage logs
        usage_logs = api_key.usage_logs.order_by(ApiKeyUsage.timestamp.desc()).paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )

        return jsonify({
            'api_key': api_key.to_dict(),
            'usage_logs': [log.to_dict() for log in usage_logs.items],
            'pagination': {
                'page': page,
                'pages': usage_logs.pages,
                'per_page': per_page,
                'total': usage_logs.total
            }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Example protected endpoint that requires API key authentication
@api_keys_bp.route('/test', methods=['GET'])
@api_key_auth_required(['read'])
def test_api_key():
    """Test endpoint for API key authentication"""
    return jsonify({
        'message': 'API key authentication successful!',
        'api_key_name': request.api_key.name,
        'user': request.api_key_user.username,
        'scopes': request.api_key.scopes
    }), 200