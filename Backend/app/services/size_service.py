# app/services/size_service.py
from app.extensions import db
from app.models.size import Size


class SizeService:
    
    @staticmethod
    def create_size(name, description=None):
        """Create a new size"""
        if not name:
            raise ValueError('Size name is required')
        
        if db.session.query(Size).filter_by(name=name).first():
            raise ValueError('Size name already exists')
        
        try:
            size = Size(name=name, description=description)
            db.session.add(size)
            db.session.commit()
            return size
        except Exception as e:
            db.session.rollback()
            raise Exception(f'Failed to create size: {str(e)}')
    
    @staticmethod
    def get_all_sizes(active_only=True):
        """Get all sizes"""
        query = db.session.query(Size)
        if active_only:
            query = query.filter_by(is_active=True)
        return query.order_by(Size.name).all()
    
    @staticmethod
    def update_size(size_id, **kwargs):
        """Update size"""
        size = db.session.query(Size).filter_by(id=size_id).first()
        if not size:
            raise ValueError('Size not found')
        
        allowed_fields = ['name', 'description', 'is_active']
        
        for field, value in kwargs.items():
            if field in allowed_fields:
                if field == 'name' and value != size.name:
                    if db.session.query(Size).filter_by(name=value).first():
                        raise ValueError('Size name already exists')
                setattr(size, field, value)
        
        db.session.commit()
        return size
    
    @staticmethod
    def delete_size(size_id):
        """Soft delete size"""
        size = db.session.query(Size).filter_by(id=size_id).first()
        if not size:
            raise ValueError('Size not found')
        
        size.is_active = False
        db.session.commit()
        return True