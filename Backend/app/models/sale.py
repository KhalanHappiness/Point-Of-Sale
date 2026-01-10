"""
Sale and SaleItem Models
"""
from datetime import datetime
from app.extensions import db


class Sale(db.Model):
    __tablename__ = 'sales'
    
    id = db.Column(db.Integer, primary_key=True)
    total_amount = db.Column(db.Numeric(10, 2), nullable=False)
    payment_method = db.Column(db.String(20), nullable=False)  # 'cash', 'card', 'mobile'
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # Relationships
    items = db.relationship('SaleItem', backref='sale', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self, include_items=False):
        data = {
            'id': self.id,
            'total_amount': float(self.total_amount),
            'payment_method': self.payment_method,
            'user_id': self.user_id,
            'cashier': self.user.username if self.user else None,
            'created_at': self.created_at.isoformat()
        }
        
        if include_items:
            data['items'] = [item.to_dict() for item in self.items]
        
        return data
    
    def __repr__(self):
        return f'<Sale {self.id} ${self.total_amount}>'


class SaleItem(db.Model):
    __tablename__ = 'sale_items'
    
    id = db.Column(db.Integer, primary_key=True)
    sale_id = db.Column(db.Integer, db.ForeignKey('sales.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    price_at_sale = db.Column(db.Numeric(10, 2), nullable=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'sale_id': self.sale_id,
            'product_id': self.product_id,
            'product_name': self.product.name if self.product else None,
            'quantity': self.quantity,
            'price_at_sale': float(self.price_at_sale),
            'subtotal': float(self.quantity * self.price_at_sale)
        }
    
    def __repr__(self):
        return f'<SaleItem sale={self.sale_id} product={self.product_id}>'