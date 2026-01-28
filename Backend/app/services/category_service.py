# app/services/category_service.py
from app.extensions import db
from app.models.category import Category


class CategoryService:
    
    @staticmethod
    def create_category(name, description=None):
        """Create a new category"""
        if not name:
            raise ValueError('Category name is required')
        
        # Check if name exists
        if db.session.query(Category).filter_by(name=name).first():
            raise ValueError('Category name already exists')
        
        try:
            category = Category(name=name, description=description)
            db.session.add(category)
            db.session.commit()
            return category
        except Exception as e:
            db.session.rollback()
            raise Exception(f'Failed to create category: {str(e)}')
    
    @staticmethod
    def get_all_categories(active_only=True):
        """Get all categories"""
        query = db.session.query(Category)
        if active_only:
            query = query.filter_by(is_active=True)
        return query.order_by(Category.name).all()
    
    @staticmethod
    def update_category(category_id, **kwargs):
        """Update category"""
        category = db.session.query(Category).filter_by(id=category_id).first()
        if not category:
            raise ValueError('Category not found')
        
        allowed_fields = ['name', 'description', 'is_active']
        
        for field, value in kwargs.items():
            if field in allowed_fields:
                if field == 'name' and value != category.name:
                    if db.session.query(Category).filter_by(name=value).first():
                        raise ValueError('Category name already exists')
                setattr(category, field, value)
        
        db.session.commit()
        return category
    
    @staticmethod
    def delete_category(category_id):
        """Soft delete category"""
        category = db.session.query(Category).filter_by(id=category_id).first()
        if not category:
            raise ValueError('Category not found')
        
        category.is_active = False
        db.session.commit()
        return True