"""
Product Service
"""
from app.extensions import db
from app.models.product import Product
from app.models.inventory import Inventory
from sqlalchemy import or_


class ProductService:
    
    @staticmethod
    def create_product(sku, name, price, barcode=None, initial_stock=0):
        """
        Create a new product with initial inventory
        
        Returns:
            Product object
        
        Raises:
            ValueError: If validation fails
        """
        # Validate
        if not sku or not name or price is None:
            raise ValueError('SKU, name, and price are required')
        
        if price < 0:
            raise ValueError('Price cannot be negative')
        
        # Check if SKU exists
        if db.session.query(Product).filter_by(sku=sku).first():
            raise ValueError('SKU already exists')
        
        # Check if barcode exists (if provided)
        if barcode and db.session.query(Product).filter_by(barcode=barcode).first():
            raise ValueError('Barcode already exists')
        
        try:
            # Create product
            product = Product(
                sku=sku,
                name=name,
                price=price,
                barcode=barcode
            )
            db.session.add(product)
            db.session.flush()  # Get product ID
            
            # Create inventory record
            inventory = Inventory(
                product_id=product.id,
                quantity=initial_stock
            )
            db.session.add(inventory)
            
            db.session.commit()
            return product
            
        except Exception as e:
            db.session.rollback()
            raise Exception(f'Failed to create product: {str(e)}')
    
    @staticmethod
    def update_product(product_id, **kwargs):
        """
        Update product details
        
        Allowed fields: name, sku, barcode, price, is_active
        
        Returns:
            Product object
        
        Raises:
            ValueError: If validation fails
        """
        product = db.session.query(Product).filter_by(id=product_id).first()
        if not product:
            raise ValueError('Product not found')
        
        allowed_fields = ['name', 'sku', 'barcode', 'price', 'is_active']
        
        for field, value in kwargs.items():
            if field not in allowed_fields:
                continue
            
            # Validate unique fields
            if field == 'sku' and value != product.sku:
                if db.session.query(Product).filter_by(sku=value).first():
                    raise ValueError('SKU already exists')
            
            if field == 'barcode' and value != product.barcode:
                if db.session.query(Product).filter_by(barcode=value).first():
                    raise ValueError('Barcode already exists')
            
            if field == 'price' and value < 0:
                raise ValueError('Price cannot be negative')
            
            setattr(product, field, value)
        
        try:
            db.session.commit()
            return product
        except Exception as e:
            db.session.rollback()
            raise Exception(f'Failed to update product: {str(e)}')
    
    @staticmethod
    def delete_product(product_id):
        """
        Soft delete product (set is_active to False)
        
        Returns:
            bool: True if successful
        """
        product = db.session.query(Product).filter_by(id=product_id).first()
        if not product:
            raise ValueError('Product not found')
        
        product.is_active = False
        db.session.commit()
        return True
    
    @staticmethod
    def get_product(product_id):
        """Get product by ID"""
        return db.session.query(Product).filter_by(id=product_id).first()
    
    @staticmethod
    def get_all_products(active_only=True):
        """Get all products"""
        query = db.session.query(Product)
        if active_only:
            query = query.filter_by(is_active=True)
        return query.order_by(Product.name).all()
    
    @staticmethod
    def search_products(query_string, active_only=True):
        """
        Search products by name, SKU, or barcode
        
        Returns:
            List of Product objects
        """
        query = db.session.query(Product)
        
        if active_only:
            query = query.filter_by(is_active=True)
        
        search_filter = or_(
            Product.name.ilike(f'%{query_string}%'),
            Product.sku.ilike(f'%{query_string}%'),
            Product.barcode.ilike(f'%{query_string}%')
        )
        
        return query.filter(search_filter).limit(20).all()