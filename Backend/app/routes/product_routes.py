"""
Product Routes
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.services.product_service import ProductService
from app.utils.permissions import require_role

product_bp = Blueprint('products', __name__)


@product_bp.route('', methods=['GET'])
@jwt_required()
def get_products():
    """
    Get all products
    
    Query params:
        active_only: bool (default True)
    
    Returns:
        {
            "products": [array]
        }
    """
    try:
        active_only = request.args.get('active_only', 'true').lower() == 'true'
        products = ProductService.get_all_products(active_only=active_only)
        
        return jsonify({
            'products': [p.to_dict() for p in products]
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch products'}), 500


@product_bp.route('/search', methods=['GET'])
@jwt_required()
def search_products():
    """
    Search products by name, SKU, or barcode
    
    Query params:
        q: string (search query)
        active_only: bool (default True)
    
    Returns:
        {
            "products": [array]
        }
    """
    query = request.args.get('q', '')
    
    if not query:
        return jsonify({'error': 'Search query required'}), 400
    
    try:
        active_only = request.args.get('active_only', 'true').lower() == 'true'
        products = ProductService.search_products(query, active_only=active_only)
        
        return jsonify({
            'products': [p.to_dict() for p in products]
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Search failed'}), 500


@product_bp.route('/<int:product_id>', methods=['GET'])
@jwt_required()
def get_product(product_id):
    """
    Get single product
    
    Returns:
        {
            "product": {object}
        }
    """
    try:
        product = ProductService.get_product(product_id)
        
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        return jsonify({'product': product.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch product'}), 500


@product_bp.route('', methods=['POST'])
@jwt_required()
@require_role('admin')
def create_product():
    """
    Create new product (Admin only)
    
    Request body:
        {
            "sku": "string",
            "name": "string",
            "price": number,
            "barcode": "string" (optional),
            "initial_stock": number (optional, default 0)
        }
    
    Returns:
        {
            "product": {object}
        }
    """
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    try:
        product = ProductService.create_product(
            sku=data.get('sku'),
            name=data.get('name'),
            price=data.get('price'),
            barcode=data.get('barcode'),
            initial_stock=data.get('initial_stock', 0)
        )
        
        return jsonify({'product': product.to_dict()}), 201
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': 'Product creation failed'}), 500


@product_bp.route('/<int:product_id>', methods=['PUT'])
@jwt_required()
@require_role('admin')
def update_product(product_id):
    """
    Update product (Admin only)
    
    Request body:
        {
            "name": "string" (optional),
            "sku": "string" (optional),
            "barcode": "string" (optional),
            "price": number (optional),
            "is_active": bool (optional)
        }
    
    Returns:
        {
            "product": {object}
        }
    """
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    try:
        product = ProductService.update_product(product_id, **data)
        return jsonify({'product': product.to_dict()}), 200
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': 'Product update failed'}), 500


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