# app/services/product_service.py
from app.extensions import db
from app.models.product import Product
from app.models.product_variant import ProductVariant
from sqlalchemy import or_


class ProductService:
    
    @staticmethod
    def create_product(sku, name, min_price, max_price, category_id=None, brand_id=None, variants_data=None):
        """
        Create a new product with variants
        
        Args:
            variants_data: List of {'size_id': int, 'quantity': int, 'sku_suffix': str (optional)}
        
        Example:
            variants_data = [
                {'size_id': 1, 'quantity': 3, 'sku_suffix': '-SM'},
                {'size_id': 2, 'quantity': 5, 'sku_suffix': '-MD'},
            ]
        """
        # Validate
        if not sku or not name or min_price is None or max_price is None:
            raise ValueError('SKU, name, min_price, and max_price are required')
        
        if min_price < 0 or max_price < 0:
            raise ValueError('Prices cannot be negative')
        
        if min_price > max_price:
            raise ValueError('Minimum price cannot be greater than maximum price')
        
        # Check if SKU exists
        if db.session.query(Product).filter_by(sku=sku).first():
            raise ValueError('SKU already exists')
        
        try:
            # Create product
            product = Product(
                sku=sku,
                name=name,
                min_price=min_price,
                max_price=max_price,
                category_id=category_id,
                brand_id=brand_id
            )
            db.session.add(product)
            db.session.flush()  # Get product ID
            
            # Create variants if provided
            if variants_data:
                for variant_data in variants_data:
                    size_id = variant_data.get('size_id')
                    quantity = variant_data.get('quantity', 0)
                    sku_suffix = variant_data.get('sku_suffix')
                    
                    if not size_id:
                        raise ValueError('size_id is required for each variant')
                    
                    # Check for duplicate size
                    existing = db.session.query(ProductVariant).filter_by(
                        product_id=product.id,
                        size_id=size_id
                    ).first()
                    
                    if existing:
                        raise ValueError(f'Duplicate size_id {size_id} for this product')
                    
                    variant = ProductVariant(
                        product_id=product.id,
                        size_id=size_id,
                        quantity=max(0, quantity),  # Ensure non-negative
                        sku_suffix=sku_suffix
                    )
                    db.session.add(variant)
            
            db.session.commit()
            return product
            
        except Exception as e:
            db.session.rollback()
            raise Exception(f'Failed to create product: {str(e)}')
    
    @staticmethod
    def update_product(product_id, **kwargs):
        """
        Update product details and variants
        
        Allowed fields: name, sku, min_price, max_price, category_id, brand_id, is_active, variants
        
        variants format: [{'size_id': int, 'quantity': int, 'sku_suffix': str}]
        """
        product = db.session.query(Product).filter_by(id=product_id).first()
        if not product:
            raise ValueError('Product not found')
        
        allowed_fields = ['name', 'sku', 'min_price', 'max_price', 'category_id', 'brand_id', 'is_active']
        
        # Validate price range
        if 'min_price' in kwargs and 'max_price' in kwargs:
            if kwargs['min_price'] > kwargs['max_price']:
                raise ValueError('Minimum price cannot be greater than maximum price')
        elif 'min_price' in kwargs:
            if kwargs['min_price'] > product.max_price:
                raise ValueError('Minimum price cannot be greater than maximum price')
        elif 'max_price' in kwargs:
            if product.min_price > kwargs['max_price']:
                raise ValueError('Maximum price cannot be less than minimum price')
        
        try:
            # Update basic fields
            for field, value in kwargs.items():
                if field not in allowed_fields and field != 'variants':
                    continue
                
                if field == 'sku' and value != product.sku:
                    if db.session.query(Product).filter_by(sku=value).first():
                        raise ValueError('SKU already exists')
                
                if field in ['min_price', 'max_price'] and value < 0:
                    raise ValueError('Price cannot be negative')
                
                if field in allowed_fields:
                    setattr(product, field, value)
            
            # Update variants if provided
            if 'variants' in kwargs:
                variants_data = kwargs['variants']
                
                # Get existing variants
                existing_variants = {v.size_id: v for v in product.variants}
                provided_size_ids = set()
                
                for variant_data in variants_data:
                    size_id = variant_data.get('size_id')
                    quantity = variant_data.get('quantity', 0)
                    sku_suffix = variant_data.get('sku_suffix')
                    
                    if not size_id:
                        continue
                    
                    provided_size_ids.add(size_id)
                    
                    if size_id in existing_variants:
                        # Update existing variant
                        variant = existing_variants[size_id]
                        variant.quantity = max(0, quantity)
                        variant.sku_suffix = sku_suffix
                    else:
                        # Create new variant
                        variant = ProductVariant(
                            product_id=product.id,
                            size_id=size_id,
                            quantity=max(0, quantity),
                            sku_suffix=sku_suffix
                        )
                        db.session.add(variant)
                
                # Remove variants not in the provided list
                for size_id, variant in existing_variants.items():
                    if size_id not in provided_size_ids:
                        db.session.delete(variant)
            
            db.session.commit()
            return product
            
        except Exception as e:
            db.session.rollback()
            raise Exception(f'Failed to update product: {str(e)}')
    
    @staticmethod
    def delete_product(product_id):
        """Soft delete product"""
        product = db.session.query(Product).filter_by(id=product_id).first()
        if not product:
            raise ValueError('Product not found')
        
        product.is_active = False
        db.session.commit()
        return True
    
    @staticmethod
    def get_product(product_id):
        """Get product by ID with variants"""
        return db.session.query(Product).filter_by(id=product_id).first()
    
    @staticmethod
    def get_all_products(active_only=True):
        """Get all products with variants"""
        query = db.session.query(Product)
        if active_only:
            query = query.filter_by(is_active=True)
        return query.order_by(Product.name).all()
    
    @staticmethod
    def search_products(query_string, active_only=True):
        """Search products by name or SKU"""
        query = db.session.query(Product)
        
        if active_only:
            query = query.filter_by(is_active=True)
        
        search_filter = or_(
            Product.name.ilike(f'%{query_string}%'),
            Product.sku.ilike(f'%{query_string}%')
        )
        
        return query.filter(search_filter).limit(20).all()