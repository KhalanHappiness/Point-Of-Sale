# app/services/sales_service.py
from app.extensions import db
from app.models.sale import Sale, SaleItem
from app.models.product_variant import ProductVariant
from app.models.stock_movement import StockMovement


class SalesService:
    
    @staticmethod
    def create_sale(user_id, items_data, payment_method):
        """
        Create a new sale with full transaction safety
        
        Args:
            user_id: ID of the cashier
            items_data: List of {'variant_id': int, 'quantity': int, 'price': float}
            payment_method: 'cash', 'card', or 'mobile'
        
        Returns:
            Sale object with items
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
            sale_items = []
            total_amount = 0
            
            for item_data in items_data:
                variant_id = item_data.get('variant_id')
                quantity = item_data.get('quantity')
                price = item_data.get('price')
                
                if not variant_id or not quantity or quantity <= 0:
                    raise ValueError('Invalid item data: variant_id and quantity required')
                
                if not price or price <= 0:
                    raise ValueError('Invalid price for item')
                
                # Lock the variant row (prevents race conditions)
                variant = db.session.query(ProductVariant).filter_by(
                    id=variant_id
                ).with_for_update().first()
                
                if not variant:
                    raise ValueError(f'Product variant {variant_id} not found')
                
                # Check stock availability
                if variant.quantity < quantity:
                    product_name = variant.product.name if variant.product else 'Unknown'
                    size_name = variant.size.name if variant.size else 'Unknown'
                    raise ValueError(
                        f'Insufficient stock for {product_name} ({size_name}). '
                        f'Available: {variant.quantity}, Requested: {quantity}'
                    )
                
                # Check if product is active
                if not variant.product.is_active:
                    raise ValueError(f'Product {variant.product.name} is not active')
                
                # Validate price is within range
                if price < float(variant.product.min_price) or price > float(variant.product.max_price):
                    raise ValueError(
                        f'Price {price} is outside allowed range '
                        f'({variant.product.min_price} - {variant.product.max_price})'
                    )
                
                subtotal = price * quantity
                total_amount += subtotal
                
                # Deduct inventory
                variant.quantity -= quantity
                
                # Create sale item
                sale_item = SaleItem(
                    variant_id=variant_id,
                    quantity=quantity,
                    price_at_sale=price
                )
                sale_items.append(sale_item)
                
                # Create stock movement (audit trail)
                movement = StockMovement(
                    variant_id=variant_id,
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
            
            # Link items to sale
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