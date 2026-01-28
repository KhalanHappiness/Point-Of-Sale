# app/models/product_variant.py (NEW)
from datetime import datetime
from app.extensions import db


class ProductVariant(db.Model):
    """
    Represents a specific variant of a product (e.g., T-Shirt in Size Medium)
    Each variant has its own stock quantity
    """
    __tablename__ = 'product_variants'
    
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    size_id = db.Column(db.Integer, db.ForeignKey('sizes.id'), nullable=False)
    quantity = db.Column(db.Integer, default=0, nullable=False)  # Stock for this variant
    sku_suffix = db.Column(db.String(20), nullable=True)  # Optional: e.g., "-SM" for small
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    product = db.relationship('Product', backref='variants')
    size = db.relationship('Size', backref='product_variants')
    stock_movements = db.relationship('StockMovement', backref='variant', lazy=True)
    sale_items = db.relationship('SaleItem', backref='variant', lazy=True)
    
    # Unique constraint: one product can't have duplicate sizes
    __table_args__ = (
        db.UniqueConstraint('product_id', 'size_id', name='unique_product_size'),
    )
    
    def to_dict(self):
        return {
            'id': self.id,
            'product_id': self.product_id,
            'size_id': self.size_id,
            'size': self.size.to_dict() if self.size else None,
            'quantity': self.quantity,
            'sku_suffix': self.sku_suffix,
            'full_sku': f"{self.product.sku}{self.sku_suffix or ''}" if self.product else None,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f'<ProductVariant {self.product.name if self.product else "?"} - {self.size.name if self.size else "?"}>'