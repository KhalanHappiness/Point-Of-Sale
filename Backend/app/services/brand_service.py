# app/services/brand_service.py
from app.extensions import db
from app.models.brand import Brand


class BrandService:
    
    @staticmethod
    def create_brand(name, description=None):
        """Create a new brand"""
        if not name:
            raise ValueError('Brand name is required')
        
        if db.session.query(Brand).filter_by(name=name).first():
            raise ValueError('Brand name already exists')
        
        try:
            brand = Brand(name=name, description=description)
            db.session.add(brand)
            db.session.commit()
            return brand
        except Exception as e:
            db.session.rollback()
            raise Exception(f'Failed to create brand: {str(e)}')
    
    @staticmethod
    def get_all_brands(active_only=True):
        """Get all brands"""
        query = db.session.query(Brand)
        if active_only:
            query = query.filter_by(is_active=True)
        return query.order_by(Brand.name).all()
    
    @staticmethod
    def update_brand(brand_id, **kwargs):
        """Update brand"""
        brand = db.session.query(Brand).filter_by(id=brand_id).first()
        if not brand:
            raise ValueError('Brand not found')
        
        allowed_fields = ['name', 'description', 'is_active']
        
        for field, value in kwargs.items():
            if field in allowed_fields:
                if field == 'name' and value != brand.name:
                    if db.session.query(Brand).filter_by(name=value).first():
                        raise ValueError('Brand name already exists')
                setattr(brand, field, value)
        
        db.session.commit()
        return brand
    
    @staticmethod
    def delete_brand(brand_id):
        """Soft delete brand"""
        brand = db.session.query(Brand).filter_by(id=brand_id).first()
        if not brand:
            raise ValueError('Brand not found')
        
        brand.is_active = False
        db.session.commit()
        return True