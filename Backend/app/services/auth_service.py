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
    
    @staticmethod
    def get_all_users():
        """
        Get all users (admin only)
        
        Returns:
            list: List of User objects
        """
        return db.session.query(User).all()

    @staticmethod
    def update_user(user_id, email=None, role=None, password=None):
        """
        Update user information (admin only)
        
        Args:
            user_id: ID of user to update
            email: New email (optional)
            role: New role (optional)
            password: New password (optional)
        
        Returns:
            User object
        
        Raises:
            ValueError: If user not found or validation fails
        """
        user = db.session.query(User).filter_by(id=user_id).first()
        
        if not user:
            raise ValueError('User not found')
        
        # Update email if provided
        if email is not None:
            # Check if email already exists for another user
            existing = db.session.query(User).filter(
                User.email == email,
                User.id != user_id
            ).first()
            if existing:
                raise ValueError('Email already exists')
            user.email = email
        
        # Update role if provided
        if role is not None:
            if role not in ['admin', 'cashier']:
                raise ValueError('Role must be "admin" or "cashier"')
            user.role = role
        
        # Update password if provided
        if password is not None and password.strip():
            if len(password) < 8:
                raise ValueError('Password must be at least 8 characters')
            user.password = password  # Setter will hash it
        
        db.session.commit()
        return user

    @staticmethod
    def delete_user(user_id, current_user_id):
        """
        Delete user (admin only)
        
        Args:
            user_id: ID of user to delete
            current_user_id: ID of current user (to prevent self-deletion)
        
        Returns:
            bool: True if deleted
        
        Raises:
            ValueError: If user not found or trying to delete self
        """
        if user_id == current_user_id:
            raise ValueError('Cannot delete your own account')
        
        user = db.session.query(User).filter_by(id=user_id).first()
        
        if not user:
            raise ValueError('User not found')
        
        db.session.delete(user)
        db.session.commit()
        
        return True