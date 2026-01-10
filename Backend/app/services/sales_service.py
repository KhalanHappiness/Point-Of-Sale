"""
Sales Service - Business Logic for Sales
This is the CRITICAL service that handles atomic transactions
"""
from app.extensions import db
from app.models.sale import Sale, SaleItem
from app.models.inventory import Inventory
from app.models.stock_movement import StockMovement
from sqlalchemy import select


class SalesService:
    
    @staticmethod
    def create_sale(user_id, items_data, payment_method):
        """
        Create a new sale with full transaction safety
        
        Args:
            user_id: ID of the cashier
            items_data: List of {'product_id': int, 'quantity': int}
            payment_method: 'cash', 'card', or 'mobile'
        
        Returns:
            Sale object with items
        
        Raises:
            ValueError: If validation fails
            Exception: If transaction fails
        """
        
        # Validate payment method
        valid_methods = ['cash', 'card', 'mobile']
        if payment_method not in valid_methods:
            raise ValueError(f'Invalid payment method. Must be one of {valid_methods}')
        
        # Validate items
        if not items_data or len(items_data) == 0:
            raise ValueError('Sale must have at least one item')
        
        try:
            # BEGIN TRANSACTION
            # Everything from here must succeed or rollback
            
            sale_items = []
            total_amount = 0
            
            for item_data in items_data:
                product_id = item_data.get('product_id')
                quantity = item_data.get('quantity')
                
                if not product_id or not quantity or quantity <= 0:
                    raise ValueError('Invalid item data')
                
                # Lock the inventory row (prevents race conditions)
                inventory = db.session.query(Inventory).filter_by(
                    product_id=product_id
                ).with_for_update().first()
                
                if not inventory:
                    raise ValueError(f'Product {product_id} has no inventory record')
                
                # Check stock availability
                if inventory.quantity < quantity:
                    product_name = inventory.product.name
                    raise ValueError(
                        f'Insufficient stock for {product_name}. '
                        f'Available: {inventory.quantity}, Requested: {quantity}'
                    )
                
                # Get current price
                product = inventory.product
                if not product.is_active:
                    raise ValueError(f'Product {product.name} is not active')
                
                price_at_sale = product.price
                subtotal = price_at_sale * quantity
                total_amount += subtotal
                
                # Deduct inventory
                inventory.quantity -= quantity
                
                # Create sale item
                sale_item = SaleItem(
                    product_id=product_id,
                    quantity=quantity,
                    price_at_sale=price_at_sale
                )
                sale_items.append(sale_item)
                
                # Create stock movement (audit trail)
                movement = StockMovement(
                    product_id=product_id,
                    change=-quantity,  # Negative for sale
                    reason='sale',
                    user_id=user_id
                )
                db.session.add(movement)
            
            # Create the sale
            sale = Sale(
                total_amount=total_amount,
                payment_method=payment_method,
                user_id=user_id
            )
            db.session.add(sale)
            db.session.flush()  # Get sale ID
            
            # Link items to sale and add stock movement references
            for sale_item in sale_items:
                sale_item.sale_id = sale.id
                db.session.add(sale_item)
            
            # Update stock movements with sale reference
            for movement in db.session.new:
                if isinstance(movement, StockMovement) and not movement.reference_id:
                    movement.reference_id = sale.id
            
            # COMMIT TRANSACTION
            db.session.commit()
            
            return sale
            
        except Exception as e:
            # ROLLBACK on any error
            db.session.rollback()
            raise Exception(f'Sale transaction failed: {str(e)}')
    
    @staticmethod
    def get_sale(sale_id):
        """Get a single sale with items"""
        return db.session.query(Sale).filter_by(id=sale_id).first()
    
    @staticmethod
    def get_all_sales(limit=100, offset=0):
        """Get all sales with pagination"""
        return db.session.query(Sale).order_by(
            Sale.created_at.desc()
        ).limit(limit).offset(offset).all()
    
    @staticmethod
    def get_sales_by_date_range(start_date, end_date):
        """Get sales within a date range"""
        return db.session.query(Sale).filter(
            Sale.created_at >= start_date,
            Sale.created_at <= end_date
        ).order_by(Sale.created_at.desc()).all()