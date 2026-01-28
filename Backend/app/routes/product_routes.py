# app/routes/product_routes.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.services.product_service import ProductService
from app.utils.permissions import require_role

product_bp = Blueprint('products', __name__)


@product_bp.route('', methods=['GET'])
@jwt_required()
def get_products():
    """
    Get all products with variants
    
    Query params:
        active_only: bool (default True)
    
    Returns:
        {
            "products": [array with variants]
        }
    """
    try:
        active_only_param = request.args.get('active_only', 'true')
        active_only = active_only_param.lower() in ['true', '1', 'yes']
        
        products = ProductService.get_all_products(active_only=active_only)
        
        return jsonify({
            'products': [p.to_dict(include_variants=True) for p in products]
        }), 200
        
    except Exception as e:
        print(f"Error in get_products: {str(e)}")
        return jsonify({'error': 'Failed to fetch products'}), 500


@product_bp.route('/search', methods=['GET'])
@jwt_required()
def search_products():
    """
    Search products by name or SKU
    
    Query params:
        q: string (search query)
        active_only: bool (default True)
    
    Returns:
        {
            "products": [array with variants]
        }
    """
    query = request.args.get('q', '')
    
    if not query:
        return jsonify({'error': 'Search query required'}), 400
    
    try:
        active_only = request.args.get('active_only', 'true').lower() == 'true'
        products = ProductService.search_products(query, active_only=active_only)
        
        return jsonify({
            'products': [p.to_dict(include_variants=True) for p in products]
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Search failed'}), 500


@product_bp.route('/<int:product_id>', methods=['GET'])
@jwt_required()
def get_product(product_id):
    """
    Get single product with variants
    
    Returns:
        {
            "product": {object with variants}
        }
    """
    try:
        product = ProductService.get_product(product_id)
        
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        return jsonify({'product': product.to_dict(include_variants=True)}), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch product'}), 500


@product_bp.route('', methods=['POST'])
@jwt_required()
@require_role('admin')
def create_product():
    """
    Create new product with variants (Admin only)
    
    Request body:
        {
            "sku": "string",
            "name": "string",
            "min_price": number,
            "max_price": number,
            "category_id": int (optional),
            "brand_id": int (optional),
            "variants": [
                {
                    "size_id": int,
                    "quantity": int,
                    "sku_suffix": "string" (optional)
                },
                ...
            ]
        }
    
    Returns:
        {
            "product": {object with variants}
        }
    """
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    try:
        product = ProductService.create_product(
            sku=data.get('sku'),
            name=data.get('name'),
            min_price=data.get('min_price'),
            max_price=data.get('max_price'),
            category_id=data.get('category_id'),
            brand_id=data.get('brand_id'),
            variants_data=data.get('variants', [])
        )
        
        return jsonify({'product': product.to_dict(include_variants=True)}), 201
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        print("CREATE PRODUCT ERROR:", str(e))
        return jsonify({'error': str(e)}), 500


@product_bp.route('/<int:product_id>', methods=['PUT'])
@jwt_required()
@require_role('admin')
def update_product(product_id):
    """
    Update product with variants (Admin only)
    
    Request body:
        {
            "name": "string" (optional),
            "sku": "string" (optional),
            "min_price": number (optional),
            "max_price": number (optional),
            "category_id": int (optional),
            "brand_id": int (optional),
            "is_active": bool (optional),
            "variants": [
                {
                    "size_id": int,
                    "quantity": int,
                    "sku_suffix": "string" (optional)
                },
                ...
            ] (optional)
        }
    
    Returns:
        {
            "product": {object with variants}
        }
    """
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    try:
        product = ProductService.update_product(product_id, **data)
        return jsonify({'product': product.to_dict(include_variants=True)}), 200
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        print("UPDATE PRODUCT ERROR:", str(e))
        return jsonify({'error': str(e)}), 500


@product_bp.route('/<int:product_id>', methods=['DELETE'])
@jwt_required()
@require_role('admin')
def delete_product(product_id):
    """
    Delete product (Admin only) - Soft delete
    
    Returns:
        {
            "message": "Product deleted successfully"
        }
    """
    try:
        ProductService.delete_product(product_id)
        return jsonify({'message': 'Product deleted successfully'}), 200
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 404
    except Exception as e:
        return jsonify({'error': 'Product deletion failed'}), 500