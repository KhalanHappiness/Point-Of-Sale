"""
Authentication Service
"""
from app.extensions import db
from app.models.user import User
from flask_jwt_extended import create_access_token, create_refresh_token


class AuthService:
    
    @staticmethod
    def authenticate(username, password):
        """
        Authenticate user and return tokens
        
        Returns:
            dict: {'access_token': str, 'refresh_token': str, 'user': dict}
        
        Raises:
            ValueError: If authentication fails
        """
        user = db.session.query(User).filter_by(username=username).first()
        
        if not user:
            raise ValueError('Invalid username or password')
        
        if not user.is_active:
            raise ValueError('Account is inactive')
        
        if not user.check_password(password):
            raise ValueError('Invalid username or password')
        
        # Create tokens
        access_token = create_access_token(
            identity=user.id,
            additional_claims={'role': user.role}
        )
        refresh_token = create_refresh_token(identity=user.id)
        
        return {
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': user.to_dict()
        }
    
    @staticmethod
    def create_user(username, email, password, role='cashier', created_by_admin=False):
        """
        Create a new user (admin only)
        
        Args:
            username: Unique username
            email: Unique email
            password: Plain text password (will be hashed)
            role: 'admin' or 'cashier'
            created_by_admin: Must be True to create user
        
        Returns:
            User object
        
        Raises:
            ValueError: If validation fails
            PermissionError: If not authorized
        """
        if not created_by_admin:
            raise PermissionError('Only admins can create users')
        
        # Validate role
        if role not in ['admin', 'cashier']:
            raise ValueError('Role must be "admin" or "cashier"')
        
        # Check if username exists
        if db.session.query(User).filter_by(username=username).first():
            raise ValueError('Username already exists')
        
        # Check if email exists
        if db.session.query(User).filter_by(email=email).first():
            raise ValueError('Email already exists')
        
        # Create user
        user = User(
            username=username,
            email=email,
            role=role
        )
        user.password = password  # Setter will hash it
        
        db.session.add(user)
        db.session.commit()
        
        return user
    
    @staticmethod
    def get_user_by_id(user_id):
        """Get user by ID"""
        return db.session.query(User).filter_by(id=user_id).first()