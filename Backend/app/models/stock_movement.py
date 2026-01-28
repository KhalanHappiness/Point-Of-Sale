# app/models/stock_movement.py (UPDATED)
from datetime import datetime
from app.extensions import db


class StockMovement(db.Model):
    __tablename__ = 'stock_movements'
    
    id = db.Column(db.Integer, primary_key=True)
    variant_id = db.Column(db.Integer, db.ForeignKey('product_variants.id'), nullable=False, index=True)  # CHANGED
    change = db.Column(db.Integer, nullable=False)  # Positive or negative
    reason = db.Column(db.String(50), nullable=False)  # 'sale', 'restock', 'adjustment', 'damage'
    reference_id = db.Column(db.Integer, nullable=True)  # Sale ID or other reference
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'variant_id': self.variant_id,
            'variant': self.variant.to_dict() if self.variant else None,
            'product_name': self.variant.product.name if self.variant and self.variant.product else None,
            'size_name': self.variant.size.name if self.variant and self.variant.size else None,
            'change': self.change,
            'reason': self.reason,
            'reference_id': self.reference_id,
            'user_id': self.user_id,
            'username': self.user.username if self.user else None,
            'notes': self.notes,
            'created_at': self.created_at.isoformat()
        }
    
    def __repr__(self):
        return f'<StockMovement variant={self.variant_id} change={self.change}>'