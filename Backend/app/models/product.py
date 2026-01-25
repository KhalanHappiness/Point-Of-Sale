from datetime import datetime
from app.extensions import db


class Product(db.Model):
    __tablename__ = 'products'
    
    id = db.Column(db.Integer, primary_key=True)
    sku = db.Column(db.String(50), unique=True, nullable=False, index=True)
    name = db.Column(db.String(200), nullable=False, index=True)
    barcode = db.Column(db.String(100), unique=True, nullable=True, index=True)
    min_price = db.Column(db.Numeric(10, 2), nullable=False)  # NEW
    max_price = db.Column(db.Numeric(10, 2), nullable=False)  # NEW
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    inventory = db.relationship('Inventory', backref='product', uselist=False, lazy=True)
    sale_items = db.relationship('SaleItem', backref='product', lazy=True)
    stock_movements = db.relationship('StockMovement', backref='product', lazy=True)
    
    def to_dict(self, include_inventory=True):
        data = {
            'id': self.id,
            'sku': self.sku,
            'name': self.name,
            'barcode': self.barcode,
            'min_price': float(self.min_price),  # CHANGED
            'max_price': float(self.max_price),  # CHANGED
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        
        if include_inventory and self.inventory:
            data['stock'] = self.inventory.quantity
        
        return data
    
    def __repr__(self):
        return f'<Product {self.name}>'