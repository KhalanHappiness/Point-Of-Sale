# app/services/inventory_service.py
from app.extensions import db
from app.models.product_variant import ProductVariant
from app.models.stock_movement import StockMovement
from app.models.product import Product


class InventoryService:
    
    @staticmethod
    def get_all_inventory(active_products_only=True):
        """
        Get all inventory (all variants)
        
        Returns:
            List of ProductVariant objects
        """
        query = db.session.query(ProductVariant)
        
        if active_products_only:
            query = query.join(ProductVariant.product).filter(
                Product.is_active == True
            )
        
        return query.order_by(
            ProductVariant.product_id,
            ProductVariant.size_id
        ).all()
    
    @staticmethod
    def adjust_variant_inventory(variant_id, change, reason, user_id, notes=None):
        """
        Adjust inventory for a specific variant
        
        Args:
            variant_id: ID of the variant
            change: int (positive or negative)
            reason: 'restock', 'adjustment', 'damage'
            user_id: ID of user making the change
            notes: Optional notes
        
        Returns:
            Updated ProductVariant object
        """
        valid_reasons = ['restock', 'adjustment', 'damage']
        if reason not in valid_reasons:
            raise ValueError(f'Invalid reason. Must be one of {valid_reasons}')
        
        try:
            # Lock the variant
            variant = db.session.query(ProductVariant).filter_by(
                id=variant_id
            ).with_for_update().first()
            
            if not variant:
                raise ValueError('Product variant not found')
            
            # Check if adjustment would make quantity negative
            new_quantity = variant.quantity + change
            if new_quantity < 0:
                raise ValueError(
                    f'Invalid adjustment. Current: {variant.quantity}, Change: {change}'
                )
            
            # Update quantity
            variant.quantity = new_quantity
            
            # Create stock movement
            movement = StockMovement(
                variant_id=variant_id,
                change=change,
                reason=reason,
                user_id=user_id,
                notes=notes
            )
            db.session.add(movement)
            
            db.session.commit()
            
            return variant
            
        except Exception as e:
            db.session.rollback()
            raise Exception(f'Inventory adjustment failed: {str(e)}')
    
    @staticmethod
    def get_stock_movements(variant_id=None, product_id=None, limit=100):
        """
        Get stock movement history
        
        Args:
            variant_id: Filter by variant (optional)
            product_id: Filter by product (optional)
            limit: Max results
        """
        query = db.session.query(StockMovement)
        
        if variant_id:
            query = query.filter_by(variant_id=variant_id)
        elif product_id:
            # Get all variants for this product, then filter movements
            variant_ids = db.session.query(ProductVariant.id).filter_by(
                product_id=product_id
            ).all()
            variant_ids = [v[0] for v in variant_ids]
            query = query.filter(StockMovement.variant_id.in_(variant_ids))
        
        return query.order_by(
            StockMovement.created_at.desc()
        ).limit(limit).all()