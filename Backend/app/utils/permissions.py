"""
Permission Decorators
"""
from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt


def require_role(required_role):
    """
    Decorator to require specific role
    
    Usage:
        @require_role('admin')
        def some_route():
            pass
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            claims = get_jwt()
            user_role = claims.get('role')
            
            if user_role != required_role:
                return jsonify({
                    'error': f'Access denied. {required_role.capitalize()} role required.'
                }), 403
            
            return fn(*args, **kwargs)
        return wrapper
    return decorator