# app/models/product.py (UPDATED)
from datetime import datetime
from app.extensions import db


class Product(db.Model):
    __tablename__ = 'products'
    
    id = db.Column(db.Integer, primary_key=True)
    sku = db.Column(db.String(50), unique=True, nullable=False, index=True)
    name = db.Column(db.String(200), nullable=False, index=True)
    min_price = db.Column(db.Numeric(10, 2), nullable=False)
    max_price = db.Column(db.Numeric(10, 2), nullable=False)
    
    # Foreign keys for category and brand
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'), nullable=True)
    brand_id = db.Column(db.Integer, db.ForeignKey('brands.id'), nullable=True)
    
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships (variants backref defined in ProductVariant)
    
    def get_total_stock(self):
        """Calculate total stock across all variants"""
        return sum(variant.quantity for variant in self.variants)
    
    def to_dict(self, include_variants=True):
        data = {
            'id': self.id,
            'sku': self.sku,
            'name': self.name,
            'min_price': float(self.min_price),
            'max_price': float(self.max_price),
            'category_id': self.category_id,
            'category': self.category.to_dict() if self.category else None,
            'brand_id': self.brand_id,
            'brand': self.brand.to_dict() if self.brand else None,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'stock': self.get_total_stock()  # Total stock across all sizes
        }
        
        if include_variants:
            data['variants'] = [v.to_dict() for v in self.variants]
        
        return data
    
    def __repr__(self):
        return f'<Product {self.name}>'