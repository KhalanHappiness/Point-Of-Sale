"""
Authentication Routes
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.services.auth_service import AuthService
from app.utils.permissions import require_role

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Login endpoint
    
    Request body:
        {
            "username": "string",
            "password": "string"
        }
    
    Returns:
        {
            "access_token": "string",
            "refresh_token": "string",
            "user": {object}
        }
    """
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400
    
    try:
        result = AuthService.authenticate(username, password)
        return jsonify(result), 200
    except ValueError as e:
        return jsonify({'error': str(e)}), 401
    except Exception as e:
        return jsonify({'error': 'Authentication failed'}), 500


@auth_bp.route('/register', methods=['POST'])
@jwt_required()
@require_role('admin')
def register():
    """
    Register new user (Admin only)
    
    Request body:
        {
            "username": "string",
            "email": "string",
            "password": "string",
            "role": "admin" | "cashier"
        }
    
    Returns:
        {
            "user": {object}
        }
    """
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role', 'cashier')
    
    if not username or not email or not password:
        return jsonify({'error': 'Username, email, and password required'}), 400
    
    try:
        user = AuthService.create_user(
            username=username,
            email=email,
            password=password,
            role=role,
            created_by_admin=True
        )
        return jsonify({'user': user.to_dict()}), 201
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except PermissionError as e:
        return jsonify({'error': str(e)}), 403
    except Exception as e:
        return jsonify({'error': 'User creation failed'}), 500


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """
    Get current user info
    
    Returns:
        {
            "user": {object}
        }
    """
    try:
        user_id = get_jwt_identity()
        user = AuthService.get_user_by_id(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({'user': user.to_dict()}), 200
    except Exception as e:
        return jsonify({'error': 'Failed to get user info'}), 500